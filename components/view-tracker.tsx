import { recordView } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

/**
 * Server component that logs a profile view as a side effect of rendering.
 * Rendered inside <Suspense> so it never delays the page. Owners viewing
 * themselves don't inflate their own numbers.
 */
export async function ViewTracker({
  candidateId,
  ownerId,
  source = "profile",
}: {
  candidateId: string;
  ownerId: string;
  source?: "profile" | "recruiter";
}) {
  const user = await getSessionUser();
  if (user?.id === ownerId) return null;

  await recordView({
    candidateId,
    viewerId: user?.id ?? null,
    viewerRole: user?.role ?? "anon",
    source: user?.role === "recruiter" ? "recruiter" : source,
  });
  return null;
}
