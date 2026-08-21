import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ShareButton } from "@/components/share-button";
import { Stat } from "@/components/stat";
import { boardBids, getRival, getStats, listInterest } from "@/lib/db";
import { compactNumber, usd, priceToBeat } from "@/lib/money";
import { getMyListing } from "@/lib/owner";
import { AVAILABILITY_LABEL, type Availability } from "@/lib/types";
import { profilePath, shareText } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const INTEREST_COPY = {
  unlock: { icon: "👀", text: "unlocked your contact details" },
  interview: { icon: "📅", text: "wants to interview you" },
  hire: { icon: "🎉", text: "wants to hire you" },
} as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; bad_key?: string }>;
}) {
  const { bad_key } = await searchParams;
  const me = await getMyListing();

  if (!me) {
    return (
      <div className="card mt-10 p-10 text-center">
        {bad_key ? (
          <p className="mx-auto mb-5 max-w-md rounded-xl border border-pink/40 bg-pink/10 px-4 py-3 text-sm font-semibold text-pink">
            That manage link isn&apos;t valid. Check you copied the whole thing.
          </p>
        ) : null}
        <h1 className="text-3xl font-black tracking-tighter">No listing on this device.</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          There are no accounts here. If you already have a listing, open the manage link you were
          given after paying — otherwise start a new one.
        </p>
        <Link href="/join" className="btn btn-primary mt-6">Put myself on the board</Link>
      </div>
    );
  }

  const [stats, rival, interest, bids] = await Promise.all([getStats(me.id), getRival(me), listInterest(me.id), boardBids()]);
  const behindYou = Math.max(0, bids.length - (me.rank ?? bids.length));
  const target = rival ? priceToBeat(rival.current_bid) : priceToBeat(me.current_bid);
  const isLive = me.current_bid > 0;

  // Created but never paid for: nothing to analyse yet, so send them to finish.
  if (!isLive) {
    return (
      <div className="card mt-10 p-10 text-center">
        <span className="chip mx-auto border-gold/40 bg-gold/10 font-bold text-gold">Not live yet</span>
        <h1 className="mt-4 text-3xl font-black tracking-tighter">
          {me.name.split(" ")[0]}, you&apos;re not on the leaderboard yet.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Your bid is your rank. Claim a position and you&apos;re live instantly, wherever it lands you.
        </p>
        <Link href="/checkout?intent=bid" className="btn btn-primary mt-6">Claim my spot</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      {me.hidden ? (
        <p className="rounded-xl border border-pink/40 bg-pink/10 px-4 py-3 text-sm font-semibold text-pink">
          Your listing has been removed from the board by a moderator. Your stats are frozen and
          recruiters can no longer find you.
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
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">your rank</div>
              <div className="text-4xl font-black tabular-nums text-gold sm:text-5xl">#{me.rank ?? "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">your bid</div>
              <div className="text-4xl font-black tabular-nums text-money sm:text-5xl">{usd(me.current_bid)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-5 border-lime/30 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h2 className="text-lg font-black tracking-tight">
            {rival ? <>Next to beat: {rival.name} at {usd(rival.current_bid)}</> : <>You own the top spot 👑</>}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {rival ? (
              <>
                Only <span className="font-black text-money">{usd(target - me.current_bid)}</span> away. Take #{rival.rank} and the leaderboard updates instantly.
              </>
            ) : (
              <>Someone will come for it. Raise your bid to make it expensive.</>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/checkout?intent=bid${rival ? `&beat=${rival.username}` : ""}`} className="btn btn-primary">
            {rival ? `Outbid them · ${usd(target)}` : `Go higher · ${usd(target)}`}
          </Link>
          <ShareButton
            url={`/profile/${me.username}`}
            text={shareText(me.rank)}
            className="btn btn-ghost"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="People watching you" value={compactNumber(stats.views)} accent="white" sub="all time" />
        <Stat label="Portfolio clicks" value={compactNumber(stats.portfolio_clicks)} accent="lime" sub="people who left to look" />
        <Stat label="Companies watching you" value={compactNumber(stats.recruiter_views)} accent="pink" sub="companies that looked" />
        <Stat label="Companies interested" value={stats.companies_interested} accent="violet" />
        <Stat label="Opportunities" value={stats.interview_requests} accent="gold" sub="interview requests" />
        <Stat label="Hires" value={stats.hires} accent="lime" />
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Who wants you</h2>
          <span className="chip">{interest.length} signals</span>
        </div>
        {interest.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing yet. Climbing is the fastest way to change that — the top three get most of the attention.
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
          <h2 className="font-black tracking-tight">Status: {AVAILABILITY_LABEL[me.availability as Availability]}</h2>
          <p className="text-sm text-muted">You&apos;re ahead of {behindYou} {behindYou === 1 ? "person" : "people"} · {profilePath(me.username)}</p>
        </div>
        <Link href={`/profile/${me.username}`} className="btn btn-ghost ml-auto">View my profile</Link>
      </section>
    </div>
  );
}
