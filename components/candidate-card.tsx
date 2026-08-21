import Link from "next/link";
import { Avatar } from "./avatar";
import { gbp } from "@/lib/money";
import { UNLOCK_PRICE } from "@/lib/money";
import { AVAILABILITY_LABEL, type Candidate } from "@/lib/types";

export function CandidateCard({ c }: { c: Candidate }) {
  return (
    <div className="card group flex flex-col gap-4 p-5 transition hover:border-lime/40 hover:bg-white/[0.06]">
      <div className="flex items-start gap-3">
        <Avatar name={c.name} src={c.photo} size={52} />
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${c.username}`} className="block truncate font-black tracking-tight group-hover:text-lime">
            {c.name}
          </Link>
          <p className="truncate text-sm text-muted">{c.title}</p>
          {c.location ? <p className="truncate text-xs text-muted">📍 {c.location}</p> : null}
        </div>
        <span className="chip shrink-0 border-gold/40 bg-gold/10 font-black text-gold">#{c.rank ?? "—"}</span>
      </div>

      {c.bio ? <p className="line-clamp-3 text-sm text-white/75">{c.bio}</p> : null}

      <div className="flex flex-wrap gap-1.5">
        <span className="chip border-lime/30 text-lime">{AVAILABILITY_LABEL[c.availability]}</span>
        {c.skills.slice(0, 3).map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-4">
        <div>
          <div className="text-lg font-black tabular-nums text-lime">{gbp(c.current_bid)}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">their bid</div>
        </div>
        <div className="flex gap-2">
          <Link href={`/profile/${c.username}`} className="btn btn-ghost px-3 py-2 text-xs">View</Link>
          <Link href={`/checkout?intent=unlock&candidate=${c.username}`} className="btn btn-primary px-3 py-2 text-xs">
            Unlock · {gbp(UNLOCK_PRICE)}
          </Link>
        </div>
      </div>
    </div>
  );
}
