import "server-only";
import { cookies } from "next/headers";

/**
 * There are no accounts. Two cookies carry everything:
 *
 * - `hireme_manage` is the secret token for a listing you paid for. It is also
 *   handed to you as a link, so losing the cookie doesn't lose the listing.
 * - `hireme_vid` is a throwaway id for an anonymous visitor, used to remember
 *   which candidates a recruiter has already unlocked.
 */
export const MANAGE_COOKIE = "hireme_manage";
export const VISITOR_COOKIE = "hireme_vid";

const YEAR = 60 * 60 * 24 * 365;

export async function getManageToken(): Promise<string | null> {
  return (await cookies()).get(MANAGE_COOKIE)?.value ?? null;
}

export async function setManageToken(token: string) {
  (await cookies()).set(MANAGE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  });
}

export async function clearManageToken() {
  (await cookies()).delete(MANAGE_COOKIE);
}

/** Read-only: returns null rather than minting one, so it is safe in a render. */
export async function getVisitorId(): Promise<string | null> {
  return (await cookies()).get(VISITOR_COOKIE)?.value ?? null;
}

/** Mints on first use. Only call from a route handler or server action. */
export async function ensureVisitorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const id = `v_${crypto.randomUUID().replace(/-/g, "")}`;
  store.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  });
  return id;
}
