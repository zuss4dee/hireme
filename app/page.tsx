import Link from "next/link";
import { Suspense } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { Search } from "@/components/search";
import { Ticker } from "@/components/ticker";
import { listCandidates, recentActivity } from "@/lib/db";
import { usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [candidates, activity] = await Promise.all([listCandidates({ q }), recentActivity()]);
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
        <div className="mx-auto mt-10 grid max-w-3xl divide-y divide-line border-y border-line text-left sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { number: "01", title: "Build your profile", text: "Show your skills, work, and what you want next.", href: "/join" },
            { number: "02", title: "Claim a rank", text: "Place a bid to put your name where it belongs.", href: "/rules" },
            { number: "03", title: "Get discovered", text: "Recruiters browse the board and reach out directly.", href: "/recruiter" },
          ].map((step) => (
            <Link key={step.number} href={step.href} className="group flex gap-3 px-1 py-4 sm:flex-col sm:gap-2 sm:px-5 sm:py-3">
              <span className="font-mono text-xs font-bold text-pink transition-colors group-hover:text-money">{step.number}</span>
              <span>
                <span className="block font-black tracking-tight group-hover:text-money">{step.title}</span>
                <span className="mt-1 block text-sm leading-snug text-muted">{step.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Ticker items={activity} />

      {candidates.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="card overflow-hidden border-fg/10 bg-fg p-5 text-white sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-lime">
                <span className="h-2 w-2 rounded-full bg-lime pulse-ring" /> Board pulse
              </div>
              <span className="font-mono text-xs text-white/50">#1 right now</span>
            </div>
            <div className="mt-8 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-2xl font-black tracking-tight sm:text-3xl">{candidates[0].name}</p>
                <p className="mt-1 truncate text-sm text-white/60">{candidates[0].title}</p>
              </div>
              <p className="shrink-0 text-2xl font-black tabular-nums text-lime sm:text-3xl">{usd(topBid)}</p>
            </div>
          </div>
          <div className="card flex flex-col justify-between p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-pink">Make a move</p>
              <p className="mt-2 text-lg font-black tracking-tight">Your next opportunity is already browsing.</p>
              <p className="mt-1 text-sm text-muted">Put your work in front of people looking right now.</p>
            </div>
            <Link href="/join" className="btn btn-primary mt-5 w-full sm:w-fit">Join the board</Link>
          </div>
        </section>
      ) : null}

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
