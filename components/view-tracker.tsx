import { recordView } from "@/lib/db";
import { getVisitorId } from "@/lib/session";

/**
 * Server component that logs a profile view as a side effect of rendering.
 * Rendered inside <Suspense> so it never delays the page.
 */
export async function ViewTracker({
  candidateId,
  isOwner = false,
  source = "profile",
}: {
  candidateId: string;
  isOwner?: boolean;
  source?: "profile" | "recruiter";
}) {
  // Owners don't inflate their own numbers.
  if (isOwner) return null;

  await recordView({
    candidateId,
    viewerId: await getVisitorId(),
    viewerRole: "anon",
    source,
  });
  return null;
}
