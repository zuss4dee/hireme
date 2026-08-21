import "server-only";
import { demoDB, demoRecomputeRanks, demoStats } from "./demo-store";
import { adminClient, serverClient, supabaseConfigured } from "./supabase";
import type { Bid, Candidate, CandidateStats, Interest, InterestType, PaymentType } from "./types";

const CANDIDATE_COLS =
  "id,user_id,name,username,photo,title,bio,location,portfolio_url,linkedin_url,github_url,twitter_url,skills,current_bid,rank,availability,contact_email,created_at";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

// ------------------------------------------------------------------ reads

export async function listCandidates(opts: { q?: string; limit?: number } = {}): Promise<Candidate[]> {
  const { q, limit = 100 } = opts;

  if (!supabaseConfigured) {
    demoRecomputeRanks();
    // current_bid === 0 means the profile exists but was never paid for.
    let rows = demoDB().candidates.filter((c) => c.current_bid > 0);
    if (q) rows = rows.filter((c) => matches(c, q));
    return rows.slice(0, limit);
  }

  const sb = await serverClient();
  let query = sb
    .from("candidate_profiles")
    .select(CANDIDATE_COLS)
    .gt("current_bid", 0)
    .order("current_bid", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (q) {
    const term = `%${q}%`;
    query = query.or(`name.ilike.${term},title.ilike.${term},location.ilike.${term},bio.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row, i) => ({ ...(row as Candidate), rank: (row as Candidate).rank ?? i + 1 }));
}

function matches(c: Candidate, q: string) {
  const hay = [c.name, c.title, c.location, c.bio, ...c.skills].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

export async function getCandidateByUsername(username: string): Promise<Candidate | null> {
  if (!supabaseConfigured) {
    demoRecomputeRanks();
    return demoDB().candidates.find((c) => c.username === username) ?? null;
  }
  const sb = await serverClient();
  const { data } = await sb.from("candidate_profiles").select(CANDIDATE_COLS).eq("username", username).maybeSingle();
  return (data as Candidate) ?? null;
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  if (!supabaseConfigured) return demoDB().candidates.find((c) => c.id === id) ?? null;
  const sb = await serverClient();
  const { data } = await sb.from("candidate_profiles").select(CANDIDATE_COLS).eq("id", id).maybeSingle();
  return (data as Candidate) ?? null;
}

export async function getCandidateByUserId(userId: string): Promise<Candidate | null> {
  if (!supabaseConfigured) {
    demoRecomputeRanks();
    return demoDB().candidates.find((c) => c.user_id === userId) ?? null;
  }
  const sb = await serverClient();
  const { data } = await sb.from("candidate_profiles").select(CANDIDATE_COLS).eq("user_id", userId).maybeSingle();
  return (data as Candidate) ?? null;
}

/** The person directly above you on the board — the one you have to outbid. */
export async function getRival(candidate: Candidate): Promise<Candidate | null> {
  if (!candidate.rank || candidate.rank <= 1) return null;
  if (!supabaseConfigured) {
    demoRecomputeRanks();
    return demoDB().candidates.find((c) => c.rank === candidate.rank! - 1) ?? null;
  }
  const sb = await serverClient();
  const { data } = await sb
    .from("candidate_profiles")
    .select(CANDIDATE_COLS)
    .gt("current_bid", candidate.current_bid)
    .order("current_bid", { ascending: true })
    .limit(1);
  return ((data ?? [])[0] as Candidate) ?? null;
}

export async function getStats(candidateId: string): Promise<CandidateStats> {
  if (!supabaseConfigured) return demoStats(candidateId);

  const sb = await serverClient();
  const count = (q: ReturnType<typeof sb.from>) => q;
  const [views, portfolio, recruiterViews, interest] = await Promise.all([
    sb.from("profile_views").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId).neq("source", "portfolio_click"),
    sb.from("profile_views").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId).eq("source", "portfolio_click"),
    sb.from("profile_views").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId).eq("viewer_role", "recruiter"),
    sb.from("recruiter_interest").select("type,company").eq("candidate_id", candidateId),
  ]);
  void count;
  const rows = (interest.data ?? []) as { type: InterestType; company: string | null }[];
  return {
    views: views.count ?? 0,
    portfolio_clicks: portfolio.count ?? 0,
    recruiter_views: recruiterViews.count ?? 0,
    companies_interested: new Set(rows.map((r) => r.company ?? "anon")).size,
    interview_requests: rows.filter((r) => r.type === "interview").length,
    hires: rows.filter((r) => r.type === "hire").length,
  };
}

export async function listInterest(candidateId: string): Promise<Interest[]> {
  if (!supabaseConfigured) {
    return demoDB()
      .interest.filter((i) => i.candidate_id === candidateId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const sb = await serverClient();
  const { data } = await sb
    .from("recruiter_interest")
    .select("id,candidate_id,company,message,type,created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(25);
  return (data ?? []) as Interest[];
}

export async function listBids(candidateId: string): Promise<Bid[]> {
  if (!supabaseConfigured) {
    return demoDB()
      .bids.filter((b) => b.candidate_id === candidateId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10);
  }
  const sb = await serverClient();
  const { data } = await sb
    .from("bids")
    .select("id,candidate_id,amount,created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as Bid[];
}

/** Every distinct bid on the board, highest first — powers the rank preview. */
export async function boardBids(): Promise<number[]> {
  const rows = await listCandidates({ limit: 500 });
  return rows.map((c) => c.current_bid).sort((a, b) => b - a);
}

export async function totalPot(): Promise<number> {
  if (!supabaseConfigured) return demoDB().candidates.reduce((sum, c) => sum + c.current_bid, 0);
  const sb = await serverClient();
  const { data } = await sb.from("candidate_profiles").select("current_bid");
  return (data ?? []).reduce((sum: number, r: { current_bid: number }) => sum + r.current_bid, 0);
}

export async function usernameTaken(username: string) {
  return Boolean(await getCandidateByUsername(username));
}

// ----------------------------------------------------------------- writes

export type NewCandidate = Omit<Candidate, "id" | "rank" | "created_at" | "current_bid"> & { current_bid?: number };

export async function createCandidate(input: NewCandidate): Promise<Candidate> {
  if (!supabaseConfigured) {
    const row: Candidate = {
      ...input,
      current_bid: input.current_bid ?? 0,
      id: uid("cand"),
      rank: null,
      created_at: new Date().toISOString(),
    };
    demoDB().candidates.push(row);
    demoRecomputeRanks();
    return row;
  }
  const sb = await serverClient();
  const { data, error } = await sb.from("candidate_profiles").insert({ ...input, current_bid: input.current_bid ?? 0 }).select(CANDIDATE_COLS).single();
  if (error) throw error;
  return data as Candidate;
}

export async function updateCandidate(id: string, patch: Partial<Candidate>): Promise<void> {
  if (!supabaseConfigured) {
    const row = demoDB().candidates.find((c) => c.id === id);
    if (row) Object.assign(row, patch);
    demoRecomputeRanks();
    return;
  }
  const sb = await serverClient();
  await sb.from("candidate_profiles").update(patch).eq("id", id);
}

/** Atomic outbid. Throws `bid_too_low` if the amount doesn't beat the current bid. */
export async function placeBid(args: { candidateId: string; userId: string | null; amount: number }): Promise<Candidate> {
  const { candidateId, userId, amount } = args;

  if (!supabaseConfigured) {
    const db = demoDB();
    const row = db.candidates.find((c) => c.id === candidateId);
    if (!row) throw new Error("candidate_not_found");
    if (amount <= row.current_bid) throw new Error("bid_too_low");
    row.current_bid = amount;
    db.bids.push({ id: uid("bid"), candidate_id: candidateId, amount, created_at: new Date().toISOString() });
    demoRecomputeRanks();
    return row;
  }

  const sb = adminClient();
  const { data, error } = await sb.rpc("place_bid", { p_candidate_id: candidateId, p_user_id: userId, p_amount: amount });
  if (error) throw new Error(error.message.includes("bid_too_low") ? "bid_too_low" : error.message);
  return data as Candidate;
}

export async function recordView(args: {
  candidateId: string;
  viewerId?: string | null;
  viewerRole?: string;
  source?: "profile" | "portfolio_click" | "recruiter";
}) {
  const row = {
    candidate_id: args.candidateId,
    viewer_id: args.viewerId ?? null,
    viewer_role: args.viewerRole ?? "anon",
    source: args.source ?? "profile",
    created_at: new Date().toISOString(),
  };
  if (!supabaseConfigured) {
    demoDB().views.push(row);
    return;
  }
  const sb = await serverClient();
  await sb.from("profile_views").insert(row);
}

export async function recordInterest(args: {
  candidateId: string;
  recruiterId: string | null;
  company?: string | null;
  message?: string | null;
  type: InterestType;
}): Promise<Interest> {
  const row: Interest = {
    id: uid("int"),
    candidate_id: args.candidateId,
    company: args.company ?? null,
    message: args.message ?? null,
    type: args.type,
    created_at: new Date().toISOString(),
  };
  if (!supabaseConfigured) {
    demoDB().interest.push(row);
    return row;
  }
  const sb = adminClient();
  const { data } = await sb
    .from("recruiter_interest")
    .insert({ candidate_id: args.candidateId, recruiter_id: args.recruiterId, company: row.company, message: row.message, type: args.type })
    .select("id,candidate_id,company,message,type,created_at")
    .single();
  return (data as Interest) ?? row;
}

/** Idempotent on provider_payment_id — the webhook and the success page both call this. */
export async function recordPayment(args: {
  userId: string | null;
  candidateId: string | null;
  amount: number;
  paymentType: PaymentType;
  paymentRef: string | null;
}): Promise<{ alreadyRecorded: boolean }> {
  if (!supabaseConfigured) {
    const db = demoDB();
    if (args.paymentRef && db.payments.some((p) => p.provider_payment_id === args.paymentRef)) return { alreadyRecorded: true };
    db.payments.push({
      id: uid("pay"),
      user_id: args.userId,
      candidate_id: args.candidateId,
      amount: args.amount,
      payment_type: args.paymentType,
      provider_payment_id: args.paymentRef,
      created_at: new Date().toISOString(),
    });
    return { alreadyRecorded: false };
  }

  const sb = adminClient();
  if (args.paymentRef) {
    const { data: existing } = await sb.from("payments").select("id").eq("provider_payment_id", args.paymentRef).maybeSingle();
    if (existing) return { alreadyRecorded: true };
  }
  await sb.from("payments").insert({
    user_id: args.userId,
    candidate_id: args.candidateId,
    amount: args.amount,
    payment_type: args.paymentType,
    provider_payment_id: args.paymentRef,
  });
  return { alreadyRecorded: false };
}

export async function hasUnlocked(userId: string | null, candidateId: string) {
  if (!userId) return false;
  if (!supabaseConfigured) {
    return demoDB().payments.some((p) => p.user_id === userId && p.candidate_id === candidateId && p.payment_type !== "bid");
  }
  const sb = adminClient();
  const { data } = await sb
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("candidate_id", candidateId)
    .neq("payment_type", "bid")
    .limit(1);
  return (data ?? []).length > 0;
}

export type ActivityItem = { id: string; name: string; username: string; amount: number; created_at: string };

/** Recent bids across the whole board — powers the homepage ticker. */
export async function recentActivity(limit = 12): Promise<ActivityItem[]> {
  if (!supabaseConfigured) {
    const db = demoDB();
    const byId = new Map(db.candidates.map((c) => [c.id, c]));
    return db.bids
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
      .flatMap((b) => {
        const c = byId.get(b.candidate_id);
        return c ? [{ id: b.id, name: c.name, username: c.username, amount: b.amount, created_at: b.created_at }] : [];
      });
  }

  const sb = await serverClient();
  const { data } = await sb
    .from("bids")
    .select("id,amount,created_at,candidate_profiles(name,username)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as unknown as {
    id: string;
    amount: number;
    created_at: string;
    candidate_profiles: { name: string; username: string } | null;
  }[]).flatMap((r) =>
    r.candidate_profiles
      ? [{ id: r.id, name: r.candidate_profiles.name, username: r.candidate_profiles.username, amount: r.amount, created_at: r.created_at }]
      : [],
  );
}
