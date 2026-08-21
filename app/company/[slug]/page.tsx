import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug, listCompanyOpportunities } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompanyBySlug((await params).slug);
  return company ? { title: company.name, description: company.description ?? `Opportunities at ${company.name}`, openGraph: { title: company.name, description: company.description ?? undefined, images: company.logo ? [company.logo] : undefined } } : { title: "Company" };
}

export default async function PublicCompanyPage({ params }: Props) {
  const company = await getCompanyBySlug((await params).slug);
  if (!company) notFound();
  const opportunities = await listCompanyOpportunities(company.id);
  return (
    <div className="flex flex-col gap-8 pt-6">
      <Link href="/companies" className="text-sm font-semibold text-muted hover:text-fg">← Companies</Link>
      <section className="card p-6 sm:p-10"><div className="flex items-center gap-5"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-3xl font-black text-pink">{company.logo ? <img src={company.logo} alt={company.name} className="h-full w-full object-cover" /> : company.name.slice(0, 1)}</div><div><h1 className="text-4xl font-black tracking-tighter">{company.name}</h1>{company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-money hover:underline">Visit website ↗</a> : null}</div></div><p className="mt-8 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-fg/80">{company.description || "A company building something worth paying attention to."}</p></section>
      <section><p className="text-xs font-black uppercase tracking-widest text-pink">Current opportunities</p><h2 className="mt-1 text-2xl font-black">Come work on the next thing.</h2><div className="mt-4 flex flex-col gap-3">{opportunities.filter((opportunity) => opportunity.status === "open").map((opportunity) => <Link key={opportunity.id} href={`/opportunity/${opportunity.slug}`} className="card flex items-center justify-between gap-4 p-5 hover:border-pink/40"><div><h3 className="font-black">{opportunity.title}</h3><p className="mt-1 text-sm text-muted">{opportunity.location || "Location flexible"} · {opportunity.remote_status}</p></div><span className="text-sm font-bold text-pink">View →</span></Link>)}</div></section>
    </div>
  );
}
