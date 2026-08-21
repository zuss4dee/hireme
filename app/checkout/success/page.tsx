import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Confetti } from "@/components/confetti";
import { ShareButton } from "@/components/share-button";
import { getCandidateById, getCandidateByUsername } from "@/lib/db";
import { fulfil } from "@/lib/fulfil";
import { usd } from "@/lib/money";
import { getSessionUser } from "@/lib/session";
import { polar, polarConfigured } from "@/lib/polar";
import type { Candidate, PaymentType } from "@/lib/types";
import { shareText } from "@/lib/site";

export const metadata: Metadata = { title: "Payment complete" };
export const dynamic = "force-dynamic";

type Search = { checkout_id?: string; demo?: string; intent?: string; candidate?: string; amount?: string; company?: string };

/**
 * The webhook is the source of truth, but local dev often has no tunnel for it
 * — so this page verifies the checkout and fulfils too. `fulfil` is idempotent
 * on the checkout id, so whichever lands first wins.
 */
async function resolve(sp: Search): Promise<{ intent: PaymentType; amount: number; candidate: Candidate | null; company: string | null }> {
  if (sp.checkout_id && polarConfigured) {
    const checkout = await polar().checkouts.get({ id: sp.checkout_id });
    const meta = (checkout.metadata ?? {}) as Record<string, unknown>;
    const asString = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
    const intent = (asString(meta.intent) as PaymentType) || "unlock";
    const candidateId = asString(meta.candidate_id);
    const amount = Number(meta.amount ?? checkout.totalAmount ?? 0);

    // Mirrors the webhook's guard — never grant a rank the payment didn't cover.
    const paid = checkout.amount ?? checkout.totalAmount ?? 0;

    if (checkout.status === "succeeded" && candidateId && paid >= amount) {
      await fulfil({
        intent,
        candidateId,
        userId: asString(meta.user_id) || null,
        amount,
        company: asString(meta.company) || null,
        message: asString(meta.message) || null,
        paymentRef: checkout.id,
      });
    }

    return {
      intent,
      amount,
      company: asString(meta.company) || null,
      candidate: candidateId ? await getCandidateById(candidateId) : null,
    };
  }

  return {
    intent: (sp.intent as PaymentType) ?? "bid",
    amount: Number(sp.amount ?? 0),
    company: sp.company || null,
    candidate: sp.candidate ? await getCandidateByUsername(sp.candidate) : null,
  };
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { intent, amount, candidate, company } = await resolve(sp);
  const user = await getSessionUser();
  const isBid = intent === "bid";

  if (!candidate) {
    return (
      <div className="card mt-12 p-10 text-center">
        <h1 className="text-2xl font-black">Payment received.</h1>
        <p className="mt-2 text-muted">We couldn&apos;t find the profile it was for. Get in touch and we&apos;ll sort it.</p>
        <Link href="/" className="btn btn-primary mt-6">Back to the board</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-10 text-center">
      <Confetti />

      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-pink/20 blur-3xl" />

        {isBid ? (
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-widest text-money">Bid placed</p>
            <h1 className="mt-3 text-5xl font-black tracking-tighter sm:text-7xl">#{candidate.rank ?? "—"}</h1>
            <p className="mt-2 text-lg font-semibold">
              {candidate.rank === 1 ? "You own the top of the board 👑" : `You're now #${candidate.rank} at ${usd(candidate.current_bid)}`}
            </p>
            <p className="mt-3 text-sm text-muted">
              Paid {usd(amount)}. The board already updated — everyone can see it.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <ShareButton
                url={`/profile/${candidate.username}`}
                text={shareText(candidate.rank)}
                label="Share my rank 🔥"
                className="btn btn-primary"
              />
              <Link href="/dashboard" className="btn btn-ghost">Go to dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm font-black uppercase tracking-widest text-pink">Unlocked</p>
            <div className="mt-5 flex flex-col items-center gap-3">
              <Avatar name={candidate.name} src={candidate.photo} size={80} />
              <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">{candidate.name}</h1>
              <p className="text-muted">{candidate.title}</p>
            </div>
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-lime/40 bg-lime/[0.08] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Contact</p>
              <a href={`mailto:${candidate.contact_email}`} className="font-mono text-lg font-bold text-money underline">
                {candidate.contact_email}
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">
              {candidate.name.split(" ")[0]} has been notified that{" "}
              <span className="font-semibold text-fg">{company ?? user?.email ?? "a company"}</span> is interested
              {intent === "interview" ? " and wants to interview them." : intent === "hire" ? " and wants to hire them." : "."}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/profile/${candidate.username}`} className="btn btn-primary">Back to their profile</Link>
              <Link href="/recruiter" className="btn btn-ghost">Find someone else</Link>
            </div>
          </div>
        )}
      </div>

      {sp.demo ? (
        <p className="text-xs text-muted">
          Demo payment — no card was charged. Add your Polar keys to <code className="font-mono">.env.local</code> for real checkout.
        </p>
      ) : null}
    </div>
  );
}
