import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ShareButton } from "@/components/share-button";
import { Stat } from "@/components/stat";
import { getCandidateByUserId, getCandidateByUsername, getRival, getStats, listInterest } from "@/lib/db";
import { compactNumber, usd, priceToBeat } from "@/lib/money";
import { getSessionUser } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase";
import { AVAILABILITY_LABEL } from "@/lib/types";
import { profilePath, shareText } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const INTEREST_COPY = {
  unlock: { icon: "👀", text: "unlocked your contact details" },
  interview: { icon: "📅", text: "wants to interview you" },
  hire: { icon: "🎉", text: "wants to hire you" },
} as const;

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ as?: string; welcome?: string }> }) {
  const { as } = await searchParams;
  const user = await getSessionUser();

  let me = user ? await getCandidateByUserId(user.id) : null;
  const isPeek = !me && !supabaseConfigured && Boolean(as);
  if (isPeek && as) me = await getCandidateByUsername(as);

  if (!me) {
    return (
      <div className="card mt-10 p-10 text-center">
        <h1 className="text-3xl font-black tracking-tighter">You&apos;re not on the board yet.</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          No profile, no rank, no recruiters. Fix that in about two minutes.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/join" className="btn btn-primary">Put myself on the board</Link>
          {!supabaseConfigured ? (
            <Link href="/dashboard?as=damilare" className="btn btn-ghost">Peek at a demo dashboard</Link>
          ) : null}
        </div>
      </div>
    );
  }

  const [stats, rival, interest] = await Promise.all([getStats(me.id), getRival(me), listInterest(me.id)]);
  const target = rival ? priceToBeat(rival.current_bid) : priceToBeat(me.current_bid);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {isPeek ? (
        <p className="rounded-xl border border-violet/40 bg-violet/10 px-4 py-3 text-sm font-semibold text-violet">
          Demo view — you&apos;re looking at {me.name}&apos;s dashboard. <Link href="/join" className="underline">Make your own →</Link>
        </p>
      ) : null}

      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Avatar name={me.name} src={me.photo} size={72} />
          <div className="min-w-0">
            <p className="text-sm text-muted">Welcome back,</p>
            <h1 className="text-2xl font-black tracking-tighter sm:text-3xl">{me.name.split(" ")[0]}</h1>
            <Link href={`/profile/${me.username}`} className="text-sm text-muted hover:text-money">{profilePath(me.username)} ↗</Link>
          </div>
          <div className="ml-auto flex gap-6 sm:gap-10">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">current rank</div>
              <div className="text-4xl font-black tabular-nums text-gold sm:text-5xl">#{me.rank ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">current bid</div>
              <div className="text-4xl font-black tabular-nums text-money sm:text-5xl">{usd(me.current_bid)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-5 border-lime/30 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-lg font-black tracking-tight">
            {rival ? <>Next above you: {rival.name} at {usd(rival.current_bid)}</> : <>You own the top spot 👑</>}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {rival ? (
              <>
                Pay <span className="font-black text-money">{usd(target)}</span> and you take #{rival.rank}. The board updates instantly.
              </>
            ) : (
              <>Someone will come for it. Raise your bid to make it expensive for them.</>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/checkout?intent=bid${rival ? `&beat=${rival.username}` : ""}`} className="btn btn-primary">
            {rival ? `Outbid them · ${usd(target)}` : `Raise my bid · ${usd(target)}`}
          </Link>
          <ShareButton
            url={`/profile/${me.username}`}
            text={shareText(me.rank)}
            className="btn btn-ghost"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Profile views" value={compactNumber(stats.views)} accent="white" sub="all time" />
        <Stat label="Portfolio clicks" value={compactNumber(stats.portfolio_clicks)} accent="lime" sub="people who left to look" />
        <Stat label="Recruiter views" value={compactNumber(stats.recruiter_views)} accent="pink" sub="signed-in recruiters" />
        <Stat label="Companies interested" value={stats.companies_interested} accent="violet" />
        <Stat label="Interview requests" value={stats.interview_requests} accent="gold" />
        <Stat label="Hires" value={stats.hires} accent="lime" />
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Who wants you</h2>
          <span className="chip">{interest.length} signals</span>
        </div>
        {interest.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing yet. Climbing the board is the fastest way to change that — the top three get most of the traffic.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-line">
            {interest.map((i) => {
              const copy = INTEREST_COPY[i.type];
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-3 text-sm">
                  <span aria-hidden>{copy.icon}</span>
                  <span className="font-bold text-fg">{i.company ?? "A company"}</span>
                  <span className="text-muted">{copy.text}</span>
                  <span className="ml-auto text-xs text-muted">
                    {new Date(i.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  {i.message ? <p className="w-full text-fg/70">“{i.message}”</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card flex flex-wrap items-center gap-4 p-6">
        <div>
          <h2 className="font-black tracking-tight">Status: {AVAILABILITY_LABEL[me.availability]}</h2>
          <p className="text-sm text-muted">Your public profile is live at {profilePath(me.username)}</p>
        </div>
        <Link href={`/profile/${me.username}`} className="btn btn-ghost ml-auto">View public profile</Link>
      </section>
    </div>
  );
}
