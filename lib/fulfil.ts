import "server-only";
import { getCandidateById, markFulfilled, placeBid, recordInterest, recordPayment, recordView } from "./db";
import type { PaymentType } from "./types";

export type FulfilInput = {
  intent: PaymentType;
  candidateId: string;
  userId: string | null;
  amount: number; // cents
  company?: string | null;
  message?: string | null;
  paymentRef?: string | null;
};

export type FulfilResult = { ok: true; rank: number | null; username: string } | { ok: false; error: string };

/**
 * Single place where money turns into product state. Called by the Stripe
 * webhook, by the success page (belt and braces if the webhook is late), and
 * directly in demo mode.
 *
 * Idempotency keys off `fulfilled_at`, not off the existence of a payment row.
 * Recording the payment first and treating that as "done" once masked a failed
 * bid permanently: the money was taken, the rank never granted, and every
 * retry returned success without doing anything.
 */
export async function fulfil(input: FulfilInput): Promise<FulfilResult> {
  const { alreadyFulfilled } = await recordPayment({
    userId: input.userId,
    candidateId: input.candidateId,
    amount: input.amount,
    paymentType: input.intent,
    paymentRef: input.paymentRef ?? null,
  });

  const candidate = await getCandidateById(input.candidateId);
  if (!candidate) return { ok: false, error: "candidate_not_found" };

  if (alreadyFulfilled) return { ok: true, rank: candidate.rank, username: candidate.username };

  if (input.intent === "bid") {
    try {
      const updated = await placeBid({ candidateId: input.candidateId, userId: input.userId, amount: input.amount });
      await markFulfilled(input.paymentRef ?? null);
      return { ok: true, rank: updated.rank, username: updated.username };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "bid_failed";
      // The bid is already at or above what was paid for — a concurrent webhook
      // and success page both fulfilling. That is success, not failure.
      if (msg === "bid_too_low" && candidate.current_bid >= input.amount) {
        await markFulfilled(input.paymentRef ?? null);
        return { ok: true, rank: candidate.rank, username: candidate.username };
      }
      console.error("[fulfil] bid failed after payment", { paymentRef: input.paymentRef, candidateId: input.candidateId, amount: input.amount, error: msg });
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
  await markFulfilled(input.paymentRef ?? null);

  return { ok: true, rank: candidate.rank, username: candidate.username };
}
