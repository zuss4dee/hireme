import "server-only";
import { getCandidateByManageToken } from "./db";
import { getManageToken } from "./session";
import type { Candidate } from "./types";

/**
 * The listing this browser owns, resolved from the manage-token cookie.
 * Returns null for everyone else — there is no account to fall back on.
 */
export async function getMyListing(): Promise<Candidate | null> {
  const token = await getManageToken();
  return token ? getCandidateByManageToken(token) : null;
}
