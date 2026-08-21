import { SEEDS, seedCandidates } from "./demo-data";
import type { Bid, Candidate, CandidateStats, Interest } from "./types";

/**
 * In-memory database used when Supabase credentials aren't configured, so the
 * product is fully clickable out of the box. Lives on globalThis so it survives
 * Next's dev-server module reloads.
 */
type ViewRow = { candidate_id: string; viewer_id: string | null; viewer_role: string; source: string; created_at: string };
type PaymentRow = { id: string; user_id: string | null; candidate_id: string | null; amount: number; payment_type: string; provider_payment_id: string | null; fulfilled_at?: string | null; created_at: string };
type SiteVisitRow = { created_at: string };

type DemoDB = {
  candidates: Candidate[];
  bids: Bid[];
  views: ViewRow[];
  interest: Interest[];
  payments: PaymentRow[];
  site_visits?: SiteVisitRow[];
  baseline: Record<string, { views: number; recruiter_views: number; portfolio_clicks: number }>;
};

function build(): DemoDB {
  const candidates = seedCandidates();
  const baseline: DemoDB["baseline"] = {};
  const interest: Interest[] = [];
  const bids: Bid[] = [];

  SEEDS.forEach((s) => {
    const id = `demo-${s.username}`;
    baseline[id] = { views: s.views, recruiter_views: s.recruiterViews, portfolio_clicks: s.portfolioClicks };
    s.interest.forEach((it, i) => {
      interest.push({
        id: `${id}-int-${i}`,
        candidate_id: id,
        company: it.company,
        message: it.message ?? null,
        type: it.type,
        created_at: new Date(Date.now() - it.daysAgo * 86_400_000).toISOString(),
      });
    });
    // a little bidding history so profiles feel alive
    const steps = [0.35, 0.6, 0.85, 1];
    steps.forEach((f, i) => {
      bids.push({
        id: `${id}-bid-${i}`,
        candidate_id: id,
        amount: Math.max(100, Math.round((s.bid * f) / 100) * 100),
        created_at: new Date(Date.now() - (steps.length - i) * 36_000_000).toISOString(),
      });
    });
  });

  return { candidates, bids, views: [], interest, payments: [], site_visits: [], baseline };
}

const g = globalThis as unknown as { __hiremeDemoDB?: DemoDB };
export function demoDB(): DemoDB {
  if (!g.__hiremeDemoDB) g.__hiremeDemoDB = build();
  return g.__hiremeDemoDB;
}

export function demoRecomputeRanks() {
  const db = demoDB();
  db.candidates.sort((a, b) => b.current_bid - a.current_bid || a.created_at.localeCompare(b.created_at));
  // Unpaid (bid 0) and moderated profiles are off the board, so hold no rank.
  let rank = 0;
  db.candidates.forEach((c) => {
    c.rank = c.current_bid > 0 && !c.hidden ? ++rank : null;
  });
}

export function demoStats(candidateId: string): CandidateStats {
  const db = demoDB();
  const base = db.baseline[candidateId] ?? { views: 0, recruiter_views: 0, portfolio_clicks: 0 };
  const live = db.views.filter((v) => v.candidate_id === candidateId);
  const interest = db.interest.filter((i) => i.candidate_id === candidateId);
  return {
    views: base.views + live.filter((v) => v.source !== "portfolio_click").length,
    portfolio_clicks: base.portfolio_clicks + live.filter((v) => v.source === "portfolio_click").length,
    recruiter_views: base.recruiter_views + live.filter((v) => v.viewer_role === "recruiter").length,
    companies_interested: new Set(interest.map((i) => i.company ?? i.id)).size,
    interview_requests: interest.filter((i) => i.type === "interview").length,
    hires: interest.filter((i) => i.type === "hire").length,
  };
}
