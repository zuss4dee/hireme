"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCandidate, recordView, slugify, usernameTaken } from "./db";
import { parseSkills } from "./skills";
import { MIN_BID, parseDollars, usd } from "./money";
import { ensureVisitorId, getVisitorId, setManageToken } from "./session";
import { getMyListing } from "./owner";
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

function automaticPhoto(email: string, portfolio: string, suppliedPhoto: FormDataEntryValue | null): string {
  const explicit = url(suppliedPhoto);
  if (explicit) return explicit;

  const emailHash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${emailHash}?d=${encodeURIComponent(`https://unavatar.io/${portfolio}`)}&s=512`;
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

  const openingBid = parseDollars(String(formData.get("bid") ?? ""));
  if (openingBid < MIN_BID) return { error: `The board isn't free. Minimum opening bid is ${usd(MIN_BID)}.` };

  if (await getMyListing()) redirect("/dashboard");

  const userId = await ensureVisitorId();
  const username = await freeUsername(String(formData.get("username") ?? "") || name);
  const skills = parseSkills(String(formData.get("skills") ?? ""));
  const availabilityRaw = String(formData.get("availability") ?? "open") as Availability;
  const availability = AVAILABILITIES.includes(availabilityRaw) ? availabilityRaw : "open";

  const created = await createCandidate({
    user_id: userId,
    name,
    username,
    photo: automaticPhoto(email, portfolio, formData.get("photo")),
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

  // The token is the only way back to this listing — hand it over immediately,
  // before payment, so a dropped checkout doesn't strand the profile.
  if (created.manage_token) await setManageToken(created.manage_token);

  revalidatePath("/");
  // The profile exists at $0 — it isn't on the board until this checkout clears.
  redirect(`/checkout?intent=bid&welcome=1&amount=${openingBid}`);
}

/** Fired from the profile page when someone opens a candidate's portfolio. */
export async function trackPortfolioClick(candidateId: string) {
  await recordView({ candidateId, viewerId: await getVisitorId(), viewerRole: "anon", source: "portfolio_click" });
}

