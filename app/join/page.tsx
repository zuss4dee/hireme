import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { getCandidateByUserId } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { supabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Put yourself on the board" };
export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const user = await getSessionUser();
  if (user) {
    const existing = await getCandidateByUserId(user.id);
    if (existing) redirect("/dashboard");
  }
  if (supabaseConfigured && !user) redirect("/login?next=/join");

  return (
    <div className="flex flex-col gap-8 pt-6">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
          Put yourself <span className="text-money">on the board</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Two minutes. No CV, no cover letter, no “tell us about a time you failed”.
        </p>
      </header>

      <JoinForm />

      <p className="text-center text-sm text-muted">
        Just here to hire someone? <Link href="/recruiter" className="font-semibold text-money hover:underline">Browse the board</Link>
      </p>
    </div>
  );
}
