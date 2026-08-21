import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { supabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (!supabaseConfigured) redirect(next ?? "/join");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pt-12">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tighter">Sign in</h1>
        <p className="mt-2 text-muted">One email, one link. That&apos;s the whole login.</p>
      </header>
      <Suspense fallback={null}>
        <LoginForm next={next ?? "/join"} />
      </Suspense>
      <p className="text-center text-sm text-muted">
        Just browsing? <Link href="/" className="font-semibold text-money hover:underline">See the board</Link>
      </p>
    </div>
  );
}
