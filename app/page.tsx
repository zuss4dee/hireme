import Link from "next/link";
import { Suspense } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { Search } from "@/components/search";
import { Ticker } from "@/components/ticker";
import { listCandidates, recentActivity, totalPot } from "@/lib/db";
import { compactNumber, gbp } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [candidates, activity, pot] = await Promise.all([listCandidates({ q }), recentActivity(), totalPot()]);
  const topBid = candidates[0]?.current_bid ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="pt-6 text-center sm:pt-12">
        <span className="chip mx-auto border-lime/30 bg-lime/10 text-lime">
          <span className="h-1.5 w-1.5 rounded-full bg-lime pulse-ring" /> live auction · {candidates.length} people on the board
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl md:text-7xl">
          Who deserves
          <br />
          to be <span className="text-lime">hired?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Pay to climb the board. Get seen by recruiters. No CVs, no applications, no ATS black hole.
          The person at the top wins the attention.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/join" className="btn btn-primary w-full text-base sm:w-auto">
            Put myself on the board →
          </Link>
          <Link href="/recruiter" className="btn btn-ghost w-full text-base sm:w-auto">
            I&apos;m hiring
          </Link>
        </div>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3 text-center">
          {[
            { label: "top bid", value: gbp(topBid), accent: "text-gold" },
            { label: "total on the board", value: gbp(pot), accent: "text-lime" },
            { label: "recruiter views", value: compactNumber(4212), accent: "text-pink" },
          ].map((s) => (
            <div key={s.label} className="card px-3 py-3">
              <div className={`text-lg font-black tabular-nums sm:text-2xl ${s.accent}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted sm:text-[11px]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Ticker items={activity} />

      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">The board</h2>
            <p className="text-sm text-muted">
              {q ? <>Results for “{q}”</> : <>Ranked by bid. Outbid anyone to take their spot.</>}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-12 rounded-full border border-line bg-white/[0.03]" />}>
          <Search />
        </Suspense>

        <Leaderboard candidates={candidates} />
      </section>

      <section className="card relative overflow-hidden p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-lime/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-pink/20 blur-3xl" />
        <h3 className="relative text-2xl font-black tracking-tight sm:text-4xl">
          Nobody is reading your CV.
        </h3>
        <p className="relative mx-auto mt-3 max-w-lg text-muted">
          They&apos;re reading this board. {gbp(topBid + 100)} puts you at number one right now.
        </p>
        <Link href="/join" className="btn btn-primary relative mt-6">
          Take the top spot
        </Link>
      </section>
    </div>
  );
}
