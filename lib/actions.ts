"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCandidate, getCandidateByUserId, recordView, slugify, usernameTaken } from "./db";
import { getSessionUser, setDemoSession } from "./session";
import { supabaseConfigured } from "./supabase";
import type { Availability } from "./types";

export type FormState = { error?: string } | undefined;

const AVAILABILITIES: Availability[] = ["open", "passive", "not_looking", "hired"];

function url(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).toString();
  } catch {
    return null;
  }
}

async function freeUsername(base: string) {
  const root = slugify(base) || `player${Math.floor(Math.random() * 9999)}`;
  let candidate = root;
  for (let i = 2; i < 60 && (await usernameTaken(candidate)); i++) candidate = `${root}-${i}`;
  return candidate;
}

export async function createProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const portfolio = url(formData.get("portfolio_url"));
  const email = String(formData.get("contact_email") ?? "").trim();

  if (name.length < 2) return { error: "Add your name — the board is not anonymous." };
  if (title.length < 2) return { error: "What do you actually do? Add a role." };
  if (!portfolio) return { error: "A portfolio, site or GitHub is required. It's your CV now." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Add a real email — that's what recruiters unlock." };

  const user = await getSessionUser();
  if (supabaseConfigured && !user) redirect("/login?next=/join");

  const existing = user ? await getCandidateByUserId(user.id) : null;
  if (existing) redirect(`/dashboard`);

  const userId = user?.id ?? `demo-user-${Math.random().toString(36).slice(2, 10)}`;
  const username = await freeUsername(String(formData.get("username") ?? "") || name);
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const availabilityRaw = String(formData.get("availability") ?? "open") as Availability;
  const availability = AVAILABILITIES.includes(availabilityRaw) ? availabilityRaw : "open";

  await createCandidate({
    user_id: userId,
    name,
    username,
    photo: url(formData.get("photo")),
    title,
    bio: bio || null,
    location: String(formData.get("location") ?? "").trim() || null,
    portfolio_url: portfolio,
    linkedin_url: url(formData.get("linkedin_url")),
    github_url: url(formData.get("github_url")),
    twitter_url: url(formData.get("twitter_url")),
    skills,
    availability,
    contact_email: email,
    current_bid: 0,
  });

  if (!supabaseConfigured) await setDemoSession({ id: userId, email, role: "candidate" });

  revalidatePath("/");
  redirect(`/checkout?intent=bid&welcome=1`);
}

/** Fired from the profile page when someone opens a candidate's portfolio. */
export async function trackPortfolioClick(candidateId: string) {
  const user = await getSessionUser();
  await recordView({ candidateId, viewerId: user?.id ?? null, viewerRole: user?.role ?? "anon", source: "portfolio_click" });
}

/** Lets a browsing user flip into recruiter mode in demo builds. */
export async function becomeRecruiter() {
  if (supabaseConfigured) return;
  const user = await getSessionUser();
  await setDemoSession({
    id: user?.id ?? `demo-recruiter-${Math.random().toString(36).slice(2, 10)}`,
    email: user?.email,
    role: "recruiter",
  });
}
