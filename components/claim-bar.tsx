"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_BID, usd } from "@/lib/money";

export function ClaimBar({ boardBids }: { boardBids: number[] }) {
  const router = useRouter();
  const [claim, setClaim] = useState("");
  const [bid, setBid] = useState(Math.max(MIN_BID, (boardBids[0] ?? 0) + 100));
  const projectedRank = boardBids.filter((amount) => amount >= bid).length + 1;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = claim.trim();
    if (!value) return;
    router.push(`/join?claim=${encodeURIComponent(value)}&amount=${bid}`);
  }

  return (
    <section className="mx-auto mt-8 w-full max-w-3xl text-center sm:mt-10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Set your bid</p>
      <div className="mt-2 flex items-center justify-center gap-2 text-2xl font-black tracking-tight sm:text-3xl">
        <span>Claim <span className="text-pink">#{projectedRank}</span> for</span>
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-1.5 py-1">
        <button
          type="button"
          aria-label="Lower bid by one dollar"
          onClick={() => setBid((value) => Math.max(MIN_BID, value - 100))}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-pink transition hover:bg-pink/10 disabled:opacity-40"
          disabled={bid <= MIN_BID}
        >
          −
        </button>
        <span className="min-w-14 text-xl font-black tabular-nums text-money">{usd(bid)}</span>
        <button
          type="button"
          aria-label="Raise bid by one dollar"
          onClick={() => setBid((value) => value + 100)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-lg font-bold text-pink transition hover:bg-pink/10"
        >
          +
        </button>
      </div>
      </div>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">Higher bids rank higher. New spots start at {usd(MIN_BID)}.</p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="claim-entry">Your name, portfolio URL, or handle</label>
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
            ◎
          </span>
          <input
            id="claim-entry"
            value={claim}
            onChange={(event) => setClaim(event.target.value)}
            className="field !rounded-full !py-3 !pl-10"
            placeholder="Your portfolio URL, @handle, or name"
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={!claim.trim()} className="btn btn-pink px-7 disabled:cursor-not-allowed disabled:opacity-50">
          Outbid with {usd(bid)}
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">You&apos;ll fill in the rest of your details on the next step.</p>
    </section>
  );
}
