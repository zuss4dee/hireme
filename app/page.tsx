import Link from "next/link";
import { Suspense } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { Search } from "@/components/search";
import { Ticker } from "@/components/ticker";
import { listCandidates, recentActivity, totalPot } from "@/lib/db";
import { compactNumber, usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [candidates, activity, pot] = await Promise.all([listCandidates({ q }), recentActivity(), totalPot()]);
  const topBid = candidates[0]?.current_bid ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="pt-6 text-center sm:pt-12">
        <span className="chip mx-auto border-lime/30 bg-lime/10 text-money">
          <span className="h-1.5 w-1.5 rounded-full bg-money pulse-ring" /> live · {candidates.length} competing right now
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl md:text-7xl">
          The internet&apos;s
          <br />
          leaderboard for <span className="text-money">talent.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Stop applying. Start getting discovered. Create your profile, climb the leaderboard,
          and let companies come to you.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/join" className="btn btn-primary w-full text-base sm:w-auto">
            Claim your spot →
          </Link>
          <Link href="/recruiter" className="btn btn-ghost w-full text-base sm:w-auto">
            Discover talent
          </Link>
        </div>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3 text-center">
          {[
            { label: "top spot", value: usd(topBid), accent: "text-gold" },
            { label: "on the line", value: usd(pot), accent: "text-money" },
            { label: "companies watching", value: compactNumber(4212), accent: "text-pink" },
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
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">The leaderboard</h2>
            <p className="text-sm text-muted">
              {q ? <>Results for “{q}”</> : <>Ranked by bid. Outbid anyone to take their spot.</>}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-12 rounded-full border border-line bg-surface-2" />}>
          <Search />
        </Suspense>

        <Leaderboard candidates={candidates} />
      </section>

      <section className="card relative overflow-hidden p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-lime/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-pink/20 blur-3xl" />
        <h3 className="relative text-2xl font-black tracking-tight sm:text-4xl">
          Your CV is outdated.
          <br />
          Your ranking isn&apos;t.
        </h3>
        <p className="relative mx-auto mt-3 max-w-lg text-muted">
          Show the world what you can do and let opportunities find you. {usd(topBid + 100)} takes
          the top spot right now.
        </p>
        <Link href="/join" className="btn btn-primary relative mt-6">
          Take the top spot
        </Link>
      </section>
    </div>
  );
}
