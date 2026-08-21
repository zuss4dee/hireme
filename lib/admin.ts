import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const TOKEN = process.env.ADMIN_TOKEN ?? "";
export const ADMIN_COOKIE = "hireme_admin";

/** Without ADMIN_TOKEN set, /admin refuses to open at all. */
export const adminEnabled = Boolean(TOKEN);

function matches(candidate: string) {
  const a = Buffer.from(candidate);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdmin() {
  if (!adminEnabled) return false;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value && matches(value));
}

export async function signInAdmin(token: string) {
  if (!adminEnabled || !matches(token)) return false;
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return true;
}

export async function signOutAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
}
