import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { adminEnabled, isAdmin } from "@/lib/admin";
import { listAllCandidates } from "@/lib/db";
import { usd } from "@/lib/money";
import { AdminLoginForm } from "./login-form";
import { logoutAction, toggleHiddenAction } from "./actions";

export const metadata: Metadata = { title: "Moderation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // No token configured means no admin surface exists at all.
  if (!adminEnabled) notFound();
  if (!(await isAdmin())) return <AdminLoginForm />;

  const candidates = await listAllCandidates();
  const live = candidates.filter((c) => !c.hidden && c.current_bid > 0);
  const hidden = candidates.filter((c) => c.hidden);
  const unpaid = candidates.filter((c) => !c.hidden && c.current_bid === 0);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Moderation</h1>
          <p className="mt-1 text-sm text-muted">
            {live.length} live · {unpaid.length} unpaid · {hidden.length} hidden
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost px-3 py-2 text-sm">Lock again</button>
        </form>
      </header>

      <ul className="flex flex-col gap-2">
        {candidates.map((c) => (
          <li
            key={c.id}
            className={`card flex flex-wrap items-center gap-3 p-3 ${c.hidden ? "border-pink/40 bg-pink/[0.04]" : ""}`}
          >
            <Avatar name={c.name} src={c.photo} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/profile/${c.username}`} className="truncate font-bold hover:text-money">{c.name}</Link>
                {c.hidden ? <span className="chip border-pink/40 bg-pink/10 font-bold text-pink">hidden</span> : null}
                {c.current_bid === 0 ? <span className="chip border-gold/40 bg-gold/10 font-bold text-gold">unpaid</span> : null}
              </div>
              <div className="truncate text-sm text-muted">
                {c.title} · /{c.username} · {c.contact_email}
              </div>
              {c.bio ? <p className="mt-1 line-clamp-2 text-sm text-fg/70">{c.bio}</p> : null}
            </div>
            <div className="text-right">
              <div className="font-black tabular-nums text-money">{usd(c.current_bid)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {c.rank ? `#${c.rank}` : "no rank"}
              </div>
            </div>
            <form action={toggleHiddenAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="hidden" value={String(!c.hidden)} />
              <button
                type="submit"
                className={`btn px-3 py-2 text-xs ${c.hidden ? "btn-ghost" : "btn-pink"}`}
              >
                {c.hidden ? "Restore" : "Hide"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted">
        Hiding removes a listing from the board, search and recruiter filters immediately. The profile,
        its bids and its payment history are kept — nothing is deleted, and it can be restored.
      </p>
    </div>
  );
}
