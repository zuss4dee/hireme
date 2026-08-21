import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { PortfolioLink } from "@/components/portfolio-link";
import { ShareButton } from "@/components/share-button";
import { Stat } from "@/components/stat";
import { ViewTracker } from "@/components/view-tracker";
import { getCandidateByUsername, getRival, getStats, hasUnlocked, listBids } from "@/lib/db";
import { compactNumber, usd, priceToBeat } from "@/lib/money";
import { getSessionUser } from "@/lib/session";
import { AVAILABILITY_LABEL } from "@/lib/types";
import { SITE_NAME, shareText } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const c = await getCandidateByUsername(username);
  if (!c) return { title: "Not on the board" };
  return {
    title: `${c.name} — ${c.title} · #${c.rank ?? "?"}`,
    description: `${c.name} is #${c.rank ?? "?"} on ${SITE_NAME} at ${usd(c.current_bid)}. ${c.bio ?? ""}`.trim(),
    openGraph: { title: `${c.name} is #${c.rank ?? "?"} on ${SITE_NAME}`, description: c.bio ?? c.title },
  };
}

const SOCIALS = [
  { key: "portfolio_url", label: "Portfolio", icon: "🔗" },
  { key: "github_url", label: "GitHub", icon: "⌨" },
  { key: "linkedin_url", label: "LinkedIn", icon: "in" },
  { key: "twitter_url", label: "X", icon: "𝕏" },
] as const;

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const c = await getCandidateByUsername(username);
  if (!c) notFound();

  const user = await getSessionUser();
  const [stats, rival, bids, unlocked] = await Promise.all([
    getStats(c.id),
    getRival(c),
    listBids(c.id),
    hasUnlocked(user?.id ?? null, c.id),
  ]);
  const isOwner = user?.id === c.user_id;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <Suspense fallback={null}>
        <ViewTracker candidateId={c.id} ownerId={c.user_id} />
      </Suspense>

      <Link href="/" className="text-sm font-semibold text-muted transition hover:text-money">← back to the board</Link>

      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={c.name} src={c.photo} size={112} className="!h-24 !w-24 sm:!h-28 sm:!w-28" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip border-gold/40 bg-gold/10 font-black text-gold">#{c.rank ?? "—"} on the board</span>
              <span className="chip border-lime/30 text-money">{AVAILABILITY_LABEL[c.availability]}</span>
              {c.location ? <span className="chip">📍 {c.location}</span> : null}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tighter sm:text-5xl">{c.name}</h1>
            <p className="mt-1 text-lg font-semibold text-muted">{c.title}</p>
            {c.bio ? <p className="mt-4 max-w-2xl text-fg/80">{c.bio}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {c.skills.map((s) => (
                <span key={s} className="chip border-violet/30 bg-violet/10 text-violet">{s}</span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {SOCIALS.map(({ key, label, icon }) => {
                const href = c[key];
                if (!href) return null;
                return (
                  <PortfolioLink key={key} candidateId={c.id} href={href} className="chip transition hover:border-lime/50 hover:text-money">
                    <span aria-hidden>{icon}</span> {label}
                  </PortfolioLink>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">current bid</div>
            <div className="text-4xl font-black tabular-nums text-money sm:text-5xl">{usd(c.current_bid)}</div>
            {rival ? (
              <p className="mt-1 text-xs text-muted">
                {usd(priceToBeat(rival.current_bid))} beats {rival.name.split(" ")[0]} for #{rival.rank}
              </p>
            ) : (
              <p className="mt-1 text-xs font-semibold text-gold">Top of the board 👑</p>
            )}
          </div>
        </div>

        <div className="relative mt-7 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row">
          {isOwner ? (
            <>
              <Link href="/dashboard" className="btn btn-primary flex-1">Go to my dashboard</Link>
              <ShareButton
                url={`/profile/${c.username}`}
                text={shareText(c.rank)}
                className="btn btn-ghost flex-1"
              />
            </>
          ) : (
            <>
              <Link href={`/checkout?intent=interview&candidate=${c.username}`} className="btn btn-primary flex-1">
                Invite for interview
              </Link>
              <Link href={`/checkout?intent=hire&candidate=${c.username}`} className="btn btn-pink flex-1">
                Hire this person
              </Link>
              <Link href={`/checkout?intent=bid&beat=${c.username}`} className="btn btn-ghost flex-1">
                Outbid for #{c.rank ?? "?"}
              </Link>
            </>
          )}
        </div>

        <div className="relative mt-4 rounded-xl border border-line bg-surface-2 p-4">
          {unlocked ? (
            <p className="text-sm">
              <span className="font-bold text-money">Contact unlocked:</span>{" "}
              <a href={`mailto:${c.contact_email}`} className="font-mono text-fg underline decoration-lime">{c.contact_email}</a>
            </p>
          ) : (
            <p className="text-sm text-muted">
              🔒 Contact details are hidden. Recruiters unlock them at checkout — the candidate gets notified the moment you do.
            </p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Profile views" value={compactNumber(stats.views)} accent="white" />
        <Stat label="Recruiter views" value={compactNumber(stats.recruiter_views)} accent="pink" />
        <Stat label="Companies interested" value={stats.companies_interested} accent="violet" />
        <Stat label="Interview requests" value={stats.interview_requests} accent="gold" />
      </section>

      {bids.length > 0 ? (
        <section className="card p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted">Bid history</h2>
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {bids.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted">{new Date(b.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="font-black tabular-nums text-money">{usd(b.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
