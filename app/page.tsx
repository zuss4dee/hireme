import Link from "next/link";
import { Suspense } from "react";
import { Leaderboard } from "@/components/leaderboard";
import { ClaimBar } from "@/components/claim-bar";
import { Search } from "@/components/search";
import { Ticker } from "@/components/ticker";
import { boardBids, getSiteVisits, listCandidates, listOpportunities, recentActivity, recordSiteVisit } from "@/lib/db";
import { compactNumber, usd } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  await recordSiteVisit();
  const [candidates, activity, siteVisits, bids, opportunities] = await Promise.all([listCandidates({ q }), recentActivity(), getSiteVisits(), boardBids(), listOpportunities(3)]);
  const topBid = bids[0] ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="pt-6 text-center sm:pt-12">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="chip border-lime/30 bg-lime/10 text-money">
            <span className="h-1.5 w-1.5 rounded-full bg-money pulse-ring" /> live · {candidates.length} competing right now
          </span>
          <span className="chip border-pink/30 bg-pink/10 text-pink">
            {compactNumber(siteVisits)} visits since launch
          </span>
        </div>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl md:text-7xl">
          The internet&apos;s
          <br />
          leaderboard for <span className="text-money">talent.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Stop applying. Start getting discovered. Create your profile, climb the leaderboard,
          and let companies come to you.
        </p>
        <ClaimBar boardBids={bids} />
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

      {opportunities.length > 0 ? (
        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-pink">Companies looking for talent</p><h2 className="mt-1 text-2xl font-black tracking-tight">Latest opportunities</h2></div><Link href="/opportunities" className="text-sm font-bold text-money hover:underline">See all →</Link></div>
          <div className="grid gap-3 md:grid-cols-3">
            {opportunities.map((opportunity) => <Link key={opportunity.id} href={`/opportunity/${opportunity.slug}`} className="card p-5 hover:border-pink/40"><p className="text-sm font-bold text-muted">{opportunity.company?.name}</p><h3 className="mt-1 font-black">{opportunity.title}</h3><p className="mt-3 text-sm text-muted">{opportunity.remote_status} · {opportunity.location || "Location flexible"}</p></Link>)}
          </div>
        </section>
      ) : null}

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
