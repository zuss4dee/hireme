import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CandidateCard } from "@/components/candidate-card";
import { FilterBar, type FilterGroup } from "@/components/filter-bar";
import { Search } from "@/components/search";
import { listCandidates } from "@/lib/db";
import { usd, UNLOCK_PRICE } from "@/lib/money";

export const metadata: Metadata = { title: "Discover talent" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "", label: "Everyone" },
  { value: "open", label: "Open to work" },
  { value: "passive", label: "Open to the right thing" },
];

const BUDGET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0-2500", label: "Under $25" },
  { value: "2500-10000", label: "$25–$100" },
  { value: "10000-", label: "$100+" },
];

/** Facets come from whoever is actually on the board, so they're never stale. */
function facets<T extends string>(values: T[], limit: number) {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    // A count of 1 on every chip is just noise — only show it when it means something.
    .map(([value, count]) => ({ value, label: value, count: count > 1 ? count : undefined }));
}

export default async function RecruiterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; skill?: string; location?: string; budget?: string }>;
}) {
  const { q, status, skill, location, budget } = await searchParams;
  const all = await listCandidates({ q });

  const [budgetMin, budgetMax] = (budget ?? "").split("-").map((n) => (n === "" ? undefined : Number(n)));

  const candidates = all.filter((c) => {
    if (status && c.availability !== status) return false;
    if (skill && !c.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return false;
    if (location && c.location !== location) return false;
    if (budget) {
      if (budgetMin !== undefined && c.current_bid < budgetMin) return false;
      if (budgetMax !== undefined && c.current_bid >= budgetMax) return false;
    }
    return true;
  });

  const groups: FilterGroup[] = [
    { key: "status", label: "Status", options: STATUS_OPTIONS },
    { key: "skill", label: "Skill", options: [{ value: "", label: "Any" }, ...facets(all.flatMap((c) => c.skills), 10)] },
    {
      key: "location",
      label: "Location",
      options: [{ value: "", label: "Anywhere" }, ...facets(all.flatMap((c) => (c.location ? [c.location] : [])), 8)],
    },
    { key: "budget", label: "Their bid", options: BUDGET_OPTIONS },
  ];

  return (
    <div className="flex flex-col gap-7 pt-6">
      <header className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-pink/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <span className="chip border-pink/40 bg-pink/10 text-pink">For companies</span>
            <h1 className="mt-3 text-3xl font-black tracking-tighter sm:text-5xl">
              The best talent
              <br />
              <span className="text-pink">isn&apos;t applying.</span>
            </h1>
            <p className="mt-3 max-w-xl text-muted">
              Discover people already proving they deserve attention. Browse everyone for free — pay{" "}
              <span className="font-black text-fg">{usd(UNLOCK_PRICE)}</span> only when you want to actually talk to someone.
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Discover", d: "Ranked by how badly they want it." },
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

      <div className="card flex flex-col gap-3 p-4">
        <FilterBar groups={groups} active={{ status, skill, location, budget }} basePath="/recruiter" query={q} />
        <div className="flex items-center justify-between border-t border-line pt-3 text-sm text-muted">
          <span>
            <span className="font-bold text-fg">{candidates.length}</span> of {all.length} competing
          </span>
          {status || skill || location || budget ? (
            <Link href={q ? `/recruiter?q=${encodeURIComponent(q)}` : "/recruiter"} className="font-semibold text-pink hover:underline">
              Clear filters
            </Link>
          ) : null}
        </div>
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
