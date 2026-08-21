import { NextResponse } from "next/server";

/**
 * Nothing to do per-request any more: there are no logins, so there is no
 * session to refresh. Kept as a no-op with an empty matcher so adding
 * middleware later doesn't mean re-wiring the app.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: [] };
