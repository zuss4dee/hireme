import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** When false the whole app runs on the in-memory demo store instead. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Request-scoped client that respects RLS and refreshes the auth cookie. */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component — middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Bypasses RLS. Server-only: bids, payments, view counters, webhook fulfilment. */
export function adminClient() {
  if (!SERVICE_ROLE) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}
