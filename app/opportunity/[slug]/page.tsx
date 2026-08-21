import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { InterestButton } from "@/components/interest-button";
import { getOpportunityBySlug, listRecommendedCandidates } from "@/lib/db";

const WORK_STYLE = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" } as const;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const opportunity = await getOpportunityBySlug((await params).slug);
  if (!opportunity) return { title: "Opportunity" };
  return { title: `${opportunity.title} at ${opportunity.company?.name ?? "a company"}`, description: opportunity.description, openGraph: { title: `${opportunity.title} at ${opportunity.company?.name ?? "a company"}`, description: opportunity.description, images: opportunity.company?.logo ? [opportunity.company.logo] : undefined } };
}

export const dynamic = "force-dynamic";

export default async function OpportunityPage({ params }: Props) {
  const opportunity = await getOpportunityBySlug((await params).slug);
  if (!opportunity) notFound();
  const recommended = await listRecommendedCandidates(opportunity);
  return (
    <div className="flex flex-col gap-8 pt-6">
      <Link href="/opportunities" className="text-sm font-semibold text-muted hover:text-fg">← All opportunities</Link>
      <section className="card p-6 sm:p-10">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-2xl font-black text-pink">{opportunity.company?.logo ? <img src={opportunity.company.logo} alt={opportunity.company.name} className="h-full w-full object-cover" /> : opportunity.company?.name.slice(0, 1)}</div>
          <div><p className="font-bold text-pink">{opportunity.company?.name}</p><h1 className="mt-1 text-4xl font-black tracking-tighter sm:text-5xl">{opportunity.title}</h1></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2"><span className="chip">{WORK_STYLE[opportunity.remote_status]}</span>{opportunity.location ? <span className="chip">{opportunity.location}</span> : null}{opportunity.salary_range ? <span className="chip text-money">{opportunity.salary_range}</span> : null}</div>
        <p className="mt-8 max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-fg/80">{opportunity.description}</p>
        {opportunity.skills.length > 0 ? <div className="mt-6 flex flex-wrap gap-2">{opportunity.skills.map((skill) => <span key={skill} className="chip border-violet/30 bg-violet/10 text-violet">{skill}</span>)}</div> : null}
        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted">Interested? Let {opportunity.company?.name} know you are paying attention.</p><InterestButton opportunityId={opportunity.id} /></div>
      </section>
      <section><div><p className="text-xs font-black uppercase tracking-widest text-pink">Find talent</p><h2 className="mt-1 text-2xl font-black">People who could move this forward</h2><p className="mt-2 text-muted">Recommended from the live leaderboard based on the skills in this opportunity.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recommended.map((candidate) => <div key={candidate.id} className="card p-4 hover:border-pink/40"><Link href={`/profile/${candidate.username}`} className="flex items-center gap-3"><Avatar name={candidate.name} src={candidate.photo} size={48} /><div className="min-w-0"><p className="truncate font-black">#{candidate.rank} {candidate.name}</p><p className="truncate text-sm text-muted">{candidate.title}</p></div></Link><Link href={`/checkout?intent=interview&candidate=${candidate.username}`} className="btn btn-ghost mt-4 w-full text-sm">Invite interview</Link></div>)}</div></section>
    </div>
  );
}
