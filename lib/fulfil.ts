import "server-only";
import { getCandidateById, placeBid, recordInterest, recordPayment, recordView } from "./db";
import type { PaymentType } from "./types";

export type FulfilInput = {
  intent: PaymentType;
  candidateId: string;
  userId: string | null;
  amount: number; // pence
  company?: string | null;
  message?: string | null;
  paymentRef?: string | null;
};

export type FulfilResult = { ok: true; rank: number | null; username: string } | { ok: false; error: string };

/**
 * Single place where money turns into product state. Called by the Polar
 * webhook, by the success page (belt and braces if the webhook is late), and
 * directly in demo mode. Idempotent on the payment provider's reference.
 */
export async function fulfil(input: FulfilInput): Promise<FulfilResult> {
  const { alreadyRecorded } = await recordPayment({
    userId: input.userId,
    candidateId: input.candidateId,
    amount: input.amount,
    paymentType: input.intent,
    paymentRef: input.paymentRef ?? null,
  });

  const candidate = await getCandidateById(input.candidateId);
  if (!candidate) return { ok: false, error: "candidate_not_found" };

  if (alreadyRecorded) return { ok: true, rank: candidate.rank, username: candidate.username };

  if (input.intent === "bid") {
    try {
      const updated = await placeBid({ candidateId: input.candidateId, userId: input.userId, amount: input.amount });
      return { ok: true, rank: updated.rank, username: updated.username };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "bid_failed";
      return { ok: false, error: msg };
    }
  }

  await recordInterest({
    candidateId: input.candidateId,
    recruiterId: input.userId,
    company: input.company ?? null,
    message: input.message ?? null,
    type: input.intent,
  });
  await recordView({ candidateId: input.candidateId, viewerId: input.userId, viewerRole: "recruiter", source: "recruiter" });

  return { ok: true, rank: candidate.rank, username: candidate.username };
}
