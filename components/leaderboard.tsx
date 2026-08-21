import Link from "next/link";
import { Avatar } from "./avatar";
import { usd, priceToBeat } from "@/lib/money";
import { AVAILABILITY_LABEL, type Candidate } from "@/lib/types";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function rankStyles(rank: number) {
  if (rank === 1) return "bg-gold/15 text-gold border-gold/40";
  if (rank === 2) return "bg-black/[0.06] text-fg border-line";
  if (rank === 3) return "bg-pink/15 text-pink border-pink/40";
  return "bg-black/[0.04] text-muted border-line";
}

export function LeaderboardRow({ c, index = 0 }: { c: Candidate; index?: number }) {
  const rank = c.rank ?? index + 1;
  const dot = c.availability === "open" ? "bg-money" : c.availability === "hired" ? "bg-pink" : "bg-gold";

  return (
    <li
      className="rise group card relative flex items-center gap-2.5 p-3 transition hover:border-lime/40 hover:bg-black/[0.03] sm:gap-4 sm:p-4"
      style={{ animationDelay: `${Math.min(index, 12) * 25}ms` }}
    >
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-sm font-black tabular-nums sm:h-11 sm:w-11 sm:text-base ${rankStyles(rank)}`}>
        {MEDAL[rank] ?? rank}
      </div>

      <Link href={`/profile/${c.username}`} className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
        <Avatar name={c.name} src={c.photo} size={44} className="!h-10 !w-10 sm:!h-11 sm:!w-11" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-bold tracking-tight group-hover:text-money">{c.name}</span>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} title={AVAILABILITY_LABEL[c.availability]} />
          </div>
          <div className="truncate text-sm text-muted">
            {c.title}
            {c.location ? <span className="hidden sm:inline"> · {c.location}</span> : null}
          </div>
        </div>
      </Link>

      <div className="hidden shrink-0 gap-1.5 lg:flex">
        {c.skills.slice(0, 2).map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-right">
          <div className="text-base font-black tabular-nums text-money sm:text-lg">{usd(c.current_bid)}</div>
          {/* the caption is wider than the number — on phones it would squeeze the name */}
          <div className="hidden text-[10px] font-semibold uppercase tracking-wider text-muted sm:block">current bid</div>
        </div>
        <Link
          href={`/checkout?intent=bid&beat=${c.username}`}
          className="btn btn-ghost px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
          title={`Take this spot for ${usd(priceToBeat(c.current_bid))}`}
        >
          Outbid
        </Link>
      </div>
    </li>
  );
}

export function Leaderboard({ candidates }: { candidates: Candidate[] }) {
  if (candidates.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg font-bold">Nobody here.</p>
        <p className="mt-1 text-muted">Try a different search — or take the whole board for yourself.</p>
        <Link href="/join" className="btn btn-primary mt-5">Put myself on the board</Link>
      </div>
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {candidates.map((c, i) => (
        <LeaderboardRow key={c.id} c={c} index={i} />
      ))}
    </ol>
  );
}
