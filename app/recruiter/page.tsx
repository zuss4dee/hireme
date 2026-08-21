import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CandidateCard } from "@/components/candidate-card";
import { RecruiterMode } from "@/components/recruiter-mode";
import { Search } from "@/components/search";
import { listCandidates } from "@/lib/db";
import { usd, UNLOCK_PRICE } from "@/lib/money";
import { getSessionUser } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Browse candidates" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "Everyone" },
  { key: "open", label: "Open to work" },
  { key: "passive", label: "Open to the right thing" },
];

export default async function RecruiterPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const user = await getSessionUser();
  const all = await listCandidates({ q });
  const candidates = status ? all.filter((c) => c.availability === status) : all;

  return (
    <div className="flex flex-col gap-7 pt-6">
      <header className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-pink/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <span className="chip border-pink/40 bg-pink/10 text-pink">For recruiters</span>
            <h1 className="mt-3 text-3xl font-black tracking-tighter sm:text-5xl">
              Stop posting jobs.
              <br />
              <span className="text-pink">Start picking people.</span>
            </h1>
            <p className="mt-3 max-w-xl text-muted">
              No job posts. No applications. No inbox full of maybes. Browse everyone for free — pay{" "}
              <span className="font-black text-fg">{usd(UNLOCK_PRICE)}</span> only when you want to actually talk to someone.
            </p>
          </div>
          {!supabaseConfigured ? <RecruiterMode active={user?.role === "recruiter"} /> : null}
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Browse", d: "Ranked by how badly they want it." },
            { n: "2", t: `Unlock · ${usd(UNLOCK_PRICE)}`, d: "Contact details revealed instantly." },
            { n: "3", t: "Talk", d: "They get notified that you're interested." },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-line bg-surface-2 p-4">
              <div className="text-xs font-black text-pink">STEP {s.n}</div>
              <div className="mt-1 font-bold">{s.t}</div>
              <div className="text-sm text-muted">{s.d}</div>
            </div>
          ))}
        </div>
      </header>

      <Suspense fallback={<div className="h-12 rounded-full border border-line bg-surface-2" />}>
        <Search action="/recruiter" placeholder="Search by role, skill, city…" />
      </Suspense>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (f.key) params.set("status", f.key);
          const href = `/recruiter${params.toString() ? `?${params}` : ""}`;
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.label}
              href={href}
              className={`chip transition ${active ? "border-lime/60 bg-lime/10 font-bold text-money" : "hover:text-fg"}`}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="ml-auto text-sm text-muted">{candidates.length} people</span>
      </div>

      {candidates.length === 0 ? (
        <div className="card p-10 text-center text-muted">Nobody matches that. Try fewer words.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => (
            <CandidateCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
