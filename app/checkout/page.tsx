import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CheckoutForm } from "@/components/checkout-form";
import { getCandidateByUserId, getCandidateByUsername, getRival, listCandidates } from "@/lib/db";
import { gbp, priceToBeat, UNLOCK_PRICE } from "@/lib/money";
import { getSessionUser } from "@/lib/session";
import { polarConfigured } from "@/lib/polar";
import type { PaymentType } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

const INTENTS: PaymentType[] = ["bid", "unlock", "interview", "hire"];

const RECRUITER_COPY: Record<Exclude<PaymentType, "bid">, { title: string; blurb: string }> = {
  unlock: { title: "Unlock contact details", blurb: "Reveal their email straight away. They get notified that you're interested." },
  interview: { title: "Invite for interview", blurb: "Unlocks their contact details and sends your interview request to their dashboard." },
  hire: { title: "Hire this person", blurb: "Unlocks their contact details and tells them you want to make an offer. The rest happens between you two." },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; beat?: string; candidate?: string; welcome?: string }>;
}) {
  const sp = await searchParams;
  const intent = (INTENTS.includes(sp.intent as PaymentType) ? sp.intent : "bid") as PaymentType;
  const demoMode = !polarConfigured;

  // ------------------------------------------------------------- bid flow
  if (intent === "bid") {
    const user = await getSessionUser();
    const mine = user ? await getCandidateByUserId(user.id) : null;
    if (!mine) redirect("/join");

    const board = await listCandidates({ limit: 100 });
    const rival = sp.beat ? await getCandidateByUsername(sp.beat) : await getRival(mine);
    const top = board[0];
    const minimum = mine.current_bid + 100;
    const target = rival && rival.id !== mine.id ? Math.max(priceToBeat(rival.current_bid), minimum) : minimum;

    const presets = [
      { label: rival && rival.id !== mine.id ? `Beat ${rival.name.split(" ")[0]}` : "Nudge it up", amount: target, hint: rival && rival.id !== mine.id ? `takes #${rival.rank}` : "stay hungry" },
      { label: "Comfortable lead", amount: target + 1000, hint: "+£10 buffer" },
      { label: "Take #1", amount: top && top.id !== mine.id ? Math.max(priceToBeat(top.current_bid), minimum) : minimum + 1000, hint: "top of the board" },
    ].filter((p, i, arr) => arr.findIndex((x) => x.amount === p.amount) === i);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-6">
        {sp.welcome ? (
          <div className="card border-lime/40 bg-lime/[0.06] p-5 text-center">
            <p className="text-lg font-black tracking-tight">You&apos;re on the board 🎉</p>
            <p className="mt-1 text-sm text-muted">
              You&apos;re at £0 right now, which means you&apos;re at the bottom. Pick a bid and start climbing —
              or <Link href="/dashboard" className="font-semibold text-lime underline">skip for now</Link>.
            </p>
          </div>
        ) : null}

        <header>
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">Climb the board</h1>
          <p className="mt-2 text-muted">
            You&apos;re <span className="font-bold text-white">#{mine.rank ?? "—"}</span> at{" "}
            <span className="font-bold text-lime">{gbp(mine.current_bid)}</span>.
            {rival && rival.id !== mine.id ? (
              <> Pay <span className="font-bold text-lime">{gbp(target)}</span> to take #{rival.rank} from {rival.name}.</>
            ) : (
              <> Nobody above you. Raise your bid to make the top spot expensive.</>
            )}
          </p>
        </header>

        {rival && rival.id !== mine.id ? (
          <div className="card flex items-center gap-4 p-4">
            <Avatar name={rival.name} src={rival.photo} size={48} />
            <div className="min-w-0">
              <div className="truncate font-bold">{rival.name}</div>
              <div className="truncate text-sm text-muted">#{rival.rank} · {rival.title}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xl font-black tabular-nums text-lime">{gbp(rival.current_bid)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">to beat</div>
            </div>
          </div>
        ) : null}

        <CheckoutForm
          intent="bid"
          candidateId={mine.id}
          candidateName={mine.name}
          amount={target}
          minimum={minimum}
          presets={presets}
          editable
          demoMode={demoMode}
          minimumHint={
            rival && rival.id !== mine.id
              ? `${gbp(target)} takes #${rival.rank}. Minimum ${gbp(minimum)} — anything lower leaves you where you are.`
              : `Minimum ${gbp(minimum)} — anything lower leaves you where you are.`
          }
        />
      </div>
    );
  }

  // ------------------------------------------------------- recruiter flow
  const candidate = sp.candidate ? await getCandidateByUsername(sp.candidate) : null;
  if (!candidate) notFound();
  const copy = RECRUITER_COPY[intent as Exclude<PaymentType, "bid">];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-6">
      <Link href={`/profile/${candidate.username}`} className="text-sm font-semibold text-muted transition hover:text-lime">
        ← back to {candidate.name.split(" ")[0]}&apos;s profile
      </Link>

      <header>
        <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 max-w-lg text-muted">{copy.blurb}</p>
      </header>

      <div className="card flex items-center gap-4 p-5">
        <Avatar name={candidate.name} src={candidate.photo} size={56} />
        <div className="min-w-0">
          <div className="truncate text-lg font-black tracking-tight">{candidate.name}</div>
          <div className="truncate text-sm text-muted">#{candidate.rank ?? "—"} · {candidate.title}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-black tabular-nums text-lime">{gbp(UNLOCK_PRICE)}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">one-off</div>
        </div>
      </div>

      <CheckoutForm
        intent={intent}
        candidateId={candidate.id}
        candidateName={candidate.name}
        amount={UNLOCK_PRICE}
        minimum={UNLOCK_PRICE}
        editable={false}
        demoMode={demoMode}
      />
    </div>
  );
}
