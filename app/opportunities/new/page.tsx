import type { Metadata } from "next";
import Link from "next/link";
import { CompanyForm } from "@/components/company-form";
import { OpportunityForm } from "@/components/opportunity-form";
import { getCompanyByToken } from "@/lib/db";
import { getCompanyToken } from "@/lib/session";

export const metadata: Metadata = { title: "Create an opportunity" };
export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  const company = await getCompanyByToken((await getCompanyToken()) ?? "");
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pt-6">
      <header><Link href="/opportunities" className="text-sm font-semibold text-muted hover:text-fg">← Opportunities</Link><h1 className="mt-5 text-4xl font-black tracking-tighter">{company ? "Create an opportunity" : "Create your company profile"}</h1><p className="mt-3 text-muted">{company ? "Tell talented people what you are building and who could make it bigger." : "Companies get discovered here too. Set up your profile, then publish your first opportunity."}</p></header>
      {company ? <OpportunityForm /> : <CompanyForm />}
    </div>
  );
}
