import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { getCompanyByToken, listCompanyOpportunities, listCompanyOpportunityInterests } from "@/lib/db";
import { getCompanyToken } from "@/lib/session";

export const metadata: Metadata = { title: "Company" };
export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const company = await getCompanyByToken((await getCompanyToken()) ?? "");
  if (!company) notFound();
  const [opportunities, interests] = await Promise.all([listCompanyOpportunities(company.id), listCompanyOpportunityInterests(company.id)]);
  return (
    <div className="flex flex-col gap-8 pt-6">
      <section className="card flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-3xl font-black text-pink">{company.logo ? <img src={company.logo} alt={company.name} className="h-full w-full object-cover" /> : company.name.slice(0, 1)}</div>
        <div><p className="text-sm font-bold text-muted">Company profile</p><h1 className="text-3xl font-black tracking-tighter">{company.name}</h1>{company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-money hover:underline">{company.website.replace(/^https?:\/\//, "")}</a> : null}</div>
        <Link href="/opportunities/new" className="btn btn-primary ml-auto">Create opportunity</Link>
      </section>
      <section><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-pink">Your company</p><h2 className="mt-1 text-2xl font-black">Opportunities</h2></div><span className="chip">{opportunities.length} live</span></div><div className="mt-4 flex flex-col gap-3">{opportunities.map((opportunity) => <Link key={opportunity.id} href={`/opportunity/${opportunity.slug}`} className="card flex items-center justify-between gap-4 p-5 hover:border-pink/40"><div><h3 className="font-black">{opportunity.title}</h3><p className="mt-1 text-sm text-muted">{opportunity.skills.join(" · ") || "Open to strong generalists"}</p></div><span className="text-sm font-bold text-pink">View →</span></Link>)}</div></section>
      <section><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-pink">People who raised their hand</p><h2 className="mt-1 text-2xl font-black">Interested talent</h2></div><span className="chip">{interests.length} signals</span></div>{interests.length === 0 ? <p className="mt-4 text-sm text-muted">When someone is interested, they will appear here with their leaderboard position.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{interests.map((interest) => interest.candidate ? <Link key={interest.id} href={`/profile/${interest.candidate.username}`} className="card flex items-center gap-3 p-4 hover:border-pink/40"><Avatar name={interest.candidate.name} src={interest.candidate.photo} size={44} /><div><p className="font-black">#{interest.candidate.rank} {interest.candidate.name}</p><p className="text-sm text-muted">{interest.candidate.title}</p></div></Link> : null)}</div>}</section>
    </div>
  );
}
