import { NextResponse } from "next/server";
import { getCandidateByManageToken } from "@/lib/db";
import { setManageToken } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * The manage link people are given after paying. Exchanges the secret token
 * for a cookie so the dashboard works on this device from then on — this is
 * what replaces logging in.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const origin = new URL(req.url).origin;

  const listing = await getCandidateByManageToken(key);
  if (!listing) {
    return NextResponse.redirect(new URL("/dashboard?bad_key=1", origin));
  }

  await setManageToken(key);
  return NextResponse.redirect(new URL("/dashboard", origin));
}
