import type { Metadata } from "next";
import Link from "next/link";
import { listOpportunities } from "@/lib/db";

export const metadata: Metadata = { title: "Opportunities" };
export const dynamic = "force-dynamic";

const WORK_STYLE = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" } as const;

export default async function OpportunitiesPage() {
  const opportunities = await listOpportunities();
  return (
    <div className="flex flex-col gap-8 pt-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-pink">Companies looking for talent</p>
          <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">Latest opportunities</h1>
          <p className="mt-3 max-w-xl text-muted">Companies are looking for people who can move the work forward. Discover the opportunity, then make yourself known.</p>
        </div>
        <Link href="/opportunities/new" className="btn btn-primary">Create an opportunity</Link>
      </header>
      {opportunities.length === 0 ? (
        <div className="card p-10 text-center"><h2 className="text-2xl font-black">No opportunities yet.</h2><p className="mt-2 text-muted">Be the first company to put something worth chasing on the board.</p></div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {opportunities.map((opportunity) => (
            <Link key={opportunity.id} href={`/opportunity/${opportunity.slug}`} className="card group p-6 transition hover:-translate-y-0.5 hover:border-pink/40">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-lg font-black text-pink">
                  {opportunity.company?.logo ? <img src={opportunity.company.logo} alt="" className="h-full w-full object-cover" /> : opportunity.company?.name.slice(0, 1)}
                </div>
                <div className="min-w-0"><p className="text-sm font-bold text-muted">{opportunity.company?.name}</p><h2 className="mt-1 text-xl font-black tracking-tight group-hover:text-pink">{opportunity.title}</h2></div>
              </div>
              <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-fg/80">{opportunity.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                <span className="chip">{WORK_STYLE[opportunity.remote_status]}</span>
                {opportunity.location ? <span className="chip">{opportunity.location}</span> : null}
                {opportunity.salary_range ? <span className="chip text-money">{opportunity.salary_range}</span> : null}
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
