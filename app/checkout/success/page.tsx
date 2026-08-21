import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Confetti } from "@/components/confetti";
import { ManageLink } from "@/components/manage-link";
import { ShareButton } from "@/components/share-button";
import { getCandidateByUsername, getCandidateForOwner, getContactEmail } from "@/lib/db";
import { fulfil } from "@/lib/fulfil";
import { usd } from "@/lib/money";
import { stripe, stripeConfigured } from "@/lib/stripe";
import type { Candidate, PaymentType } from "@/lib/types";
import { shareText, SITE_URL } from "@/lib/site";

export const metadata: Metadata = { title: "Payment complete" };
export const dynamic = "force-dynamic";

type Search = { session_id?: string; demo?: string; intent?: string; candidate?: string; amount?: string; company?: string };

/**
 * The webhook is the source of truth, but local dev often has no `stripe
 * listen` running — so this page verifies the session and fulfils too.
 * `fulfil` is idempotent on the session id, so whichever lands first wins.
 */
async function resolve(sp: Search): Promise<{ intent: PaymentType; amount: number; candidate: Candidate | null; company: string | null; failed: boolean }> {
  if (sp.session_id && stripeConfigured) {
    const session = await stripe().checkout.sessions.retrieve(sp.session_id);
    const meta = session.metadata ?? {};
    const intent = (meta.intent as PaymentType) || "unlock";
    const candidateId = meta.candidate_id ?? "";
    const amount = Number(meta.amount ?? session.amount_total ?? 0);

    // Mirrors the webhook's guard — never grant a rank the payment didn't cover.
    const paid = session.amount_subtotal ?? session.amount_total ?? 0;

    let failed = false;
    if (session.payment_status === "paid" && candidateId && paid >= amount) {
      const result = await fulfil({
        intent,
        candidateId,
        userId: meta.user_id || null,
        amount,
        company: meta.company || null,
        message: meta.message || null,
        paymentRef: session.id,
      });
      failed = !result.ok;
    }

    return {
      intent,
      amount,
      failed,
      company: meta.company || null,
      candidate: candidateId ? await getCandidateForOwner(candidateId) : null,
    };
  }

  return {
    intent: (sp.intent as PaymentType) ?? "bid",
    amount: Number(sp.amount ?? 0),
    failed: false,
    company: sp.company || null,
    candidate: sp.candidate ? await getCandidateForOwner((await getCandidateByUsername(sp.candidate))?.id ?? "") : null,
  };
}

export default async function SuccessPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { intent, amount, candidate, company, failed } = await resolve(sp);
  const isBid = intent === "bid";
  // Paid for, so it can be shown once — this page is the delivery.
  const contactEmail = !isBid && candidate ? await getContactEmail(candidate.id) : null;

  // Never celebrate a payment whose effect didn't land — that is how someone
  // ends up looking at "#null at $0" after being charged.
  if (failed || (candidate && intent === "bid" && candidate.current_bid <= 0)) {
    return (
      <div className="card mx-auto mt-12 max-w-lg p-8 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-pink">Payment received</p>
        <h1 className="mt-3 text-2xl font-black tracking-tighter">We couldn&apos;t apply it yet.</h1>
        <p className="mt-3 text-muted">
          Your card was charged {usd(amount)} and we have the receipt, but something went wrong
          putting you on the leaderboard. Nothing is lost — reload this page in a minute and it will
          finish on its own.
        </p>
        <p className="mt-3 text-sm text-muted">
          If it still hasn&apos;t worked, email us with this reference and we&apos;ll fix it or
          refund you:
        </p>
        <code className="mt-2 block truncate rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs">
          {sp.session_id ?? "no-reference"}
        </code>
        <Link href="/dashboard" className="btn btn-ghost mt-6">Go to my dashboard</Link>
      </div>
    );
  }

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
            <p className="text-sm font-black uppercase tracking-widest text-money">You&apos;re live. Now climb.</p>
            <h1 className="mt-3 text-5xl font-black tracking-tighter sm:text-7xl">#{candidate.rank ?? "—"}</h1>
            <p className="mt-2 text-lg font-semibold">
              {candidate.rank === 1
                ? "You own the top spot 👑"
                : `You're currently #${candidate.rank} — ${(candidate.rank ?? 1) - 1} ${(candidate.rank ?? 1) - 1 === 1 ? "person is" : "people are"} ahead of you`}
            </p>
            <p className="mt-3 text-sm text-muted">
              Paid {usd(amount)}. The leaderboard already updated — everyone can see it. Outbid your way up.
            </p>
            {candidate.manage_token ? <ManageLink url={`${SITE_URL}/manage?key=${candidate.manage_token}`} /> : null}

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
              <a href={`mailto:${contactEmail}`} className="font-mono text-lg font-bold text-money underline">
                {contactEmail}
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">
              {candidate.name.split(" ")[0]} has been notified that{" "}
              <span className="font-semibold text-fg">{company ?? "A company"}</span> is interested
              {intent === "interview" ? " and wants to interview them." : intent === "hire" ? " and wants to hire them." : "."}
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={`/profile/${candidate.username}`} className="btn btn-primary">Back to their profile</Link>
              <Link href="/recruiter" className="btn btn-ghost">Discover more talent</Link>
            </div>
          </div>
        )}
      </div>

      {sp.demo ? (
        <p className="text-xs text-muted">
          Demo payment — no card was charged. Add your Stripe keys to <code className="font-mono">.env.local</code> for real checkout.
        </p>
      ) : null}
    </div>
  );
}
