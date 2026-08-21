import type { Metadata } from "next";
import Link from "next/link";
import { listCompanies } from "@/lib/db";

export const metadata: Metadata = { title: "Companies" };
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await listCompanies();
  return (
    <div className="flex flex-col gap-8 pt-6">
      <header><p className="text-xs font-black uppercase tracking-widest text-pink">Company profiles</p><h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">Companies building something.</h1><p className="mt-3 max-w-xl text-muted">Meet the teams creating opportunities for people on the leaderboard.</p></header>
      {companies.length === 0 ? <div className="card p-10 text-center"><h2 className="text-2xl font-black">No company profiles yet.</h2><p className="mt-2 text-muted">Create an opportunity and be the first one discovered.</p><Link href="/opportunities/new" className="btn btn-primary mt-6">Create a company profile</Link></div> : <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{companies.map((company) => <Link key={company.id} href={`/company/${company.slug}`} className="card p-5 hover:border-pink/40"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-xl font-black text-pink">{company.logo ? <img src={company.logo} alt="" className="h-full w-full object-cover" /> : company.name.slice(0, 1)}</div><h2 className="mt-4 text-xl font-black">{company.name}</h2><p className="mt-2 line-clamp-3 text-sm text-muted">{company.description || "A company looking for people who can move the work forward."}</p></Link>)}</section>}
    </div>
  );
}
