import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { CheckoutForm } from "@/components/checkout-form";
import { boardBids, getCandidateByUserId, getCandidateByUsername, getRival, listCandidates } from "@/lib/db";
import { usd, priceToBeat, MIN_BID, UNLOCK_PRICE } from "@/lib/money";
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
  searchParams: Promise<{ intent?: string; beat?: string; candidate?: string; welcome?: string; amount?: string }>;
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
    const bids = await boardBids();
    const rival = sp.beat ? await getCandidateByUsername(sp.beat) : await getRival(mine);
    const top = board[0];
    const isLive = mine.current_bid > 0;
    const minimum = Math.max(mine.current_bid + 100, MIN_BID);
    const requested = Number(sp.amount ?? 0);
    const target =
      requested >= minimum
        ? requested
        : rival && rival.id !== mine.id
          ? Math.max(priceToBeat(rival.current_bid), minimum)
          : minimum;

    const rankFor = (amount: number) => bids.filter((b) => b >= amount && b !== (isLive ? mine.current_bid : -1)).length + 1;
    const beatsRival = Boolean(rival && rival.id !== mine.id);

    const presets = [
      {
        label: beatsRival ? `Beat ${rival!.name.split(" ")[0]}` : isLive ? "Nudge it up" : "Your bid",
        amount: target,
        hint: `lands at #${rankFor(target)}`,
      },
      { label: "Comfortable lead", amount: target + 1000, hint: `lands at #${rankFor(target + 1000)}` },
      {
        label: "Take #1",
        amount: top && top.id !== mine.id ? Math.max(priceToBeat(top.current_bid), minimum) : minimum + 1000,
        hint: "top of the board",
      },
    ].filter((p, i, arr) => arr.findIndex((x) => x.amount === p.amount) === i);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 pt-6">
        {sp.welcome ? (
          <div className="card border-lime/40 bg-lime/[0.06] p-5 text-center">
            <p className="text-lg font-black tracking-tight">Profile saved — one step left 🎉</p>
            <p className="mt-1 text-sm text-muted">
              Your listing goes public the moment this clears. Until then nobody can see it.
            </p>
          </div>
        ) : null}

        <header>
          <h1 className="text-3xl font-black tracking-tighter sm:text-4xl">
            {isLive ? "Climb the board" : "Claim your spot"}
          </h1>
          <p className="mt-2 text-muted">
            {isLive ? (
              <>
                You&apos;re <span className="font-bold text-fg">#{mine.rank ?? "—"}</span> at{" "}
                <span className="font-bold text-money">{usd(mine.current_bid)}</span>.
              </>
            ) : (
              <>Your bid is your rank — pay more than someone and you take their place.</>
            )}
            {beatsRival ? (
              <> Pay <span className="font-bold text-money">{usd(target)}</span> to take #{rival!.rank} from {rival!.name}.</>
            ) : isLive ? (
              <> Nobody above you. Raise your bid to make the top spot expensive.</>
            ) : null}
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
              <div className="text-xl font-black tabular-nums text-money">{usd(rival.current_bid)}</div>
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
          boardBids={bids}
          selfBid={isLive ? mine.current_bid : undefined}
          minimumHint={
            rival && rival.id !== mine.id
              ? `${usd(target)} takes #${rival.rank}. Minimum ${usd(minimum)} — anything lower leaves you where you are.`
              : `Minimum ${usd(minimum)} — anything lower leaves you where you are.`
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
      <Link href={`/profile/${candidate.username}`} className="text-sm font-semibold text-muted transition hover:text-money">
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
          <div className="text-2xl font-black tabular-nums text-money">{usd(UNLOCK_PRICE)}</div>
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
