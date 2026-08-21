import { cookies } from "next/headers";
import { supabaseConfigured, serverClient } from "./supabase";

export type SessionUser = { id: string; email: string; role: "candidate" | "recruiter" };

export const DEMO_UID_COOKIE = "hireme_uid";
export const DEMO_ROLE_COOKIE = "hireme_role";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (supabaseConfigured) {
    const sb = await serverClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: row } = await sb.from("users").select("role").eq("id", data.user.id).maybeSingle();
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      role: (row?.role as SessionUser["role"]) ?? "candidate",
    };
  }

  const store = await cookies();
  const id = store.get(DEMO_UID_COOKIE)?.value;
  if (!id) return null;
  return {
    id,
    email: store.get("hireme_email")?.value ?? "you@hireme.lol",
    role: (store.get(DEMO_ROLE_COOKIE)?.value as SessionUser["role"]) ?? "candidate",
  };
}

/** Demo-mode sign-in: a cookie is the whole session. */
export async function setDemoSession(user: { id: string; email?: string; role?: "candidate" | "recruiter" }) {
  const store = await cookies();
  const opts = { httpOnly: false, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
  store.set(DEMO_UID_COOKIE, user.id, opts);
  if (user.email) store.set("hireme_email", user.email, opts);
  store.set(DEMO_ROLE_COOKIE, user.role ?? "candidate", opts);
}
