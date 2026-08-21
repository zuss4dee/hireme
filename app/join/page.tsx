import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { getMyListing } from "@/lib/owner";
import { boardBids } from "@/lib/db";

export const metadata: Metadata = { title: "Get on the leaderboard" };
export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ claim?: string; amount?: string }>;
}) {
  // Already own a listing on this device? Manage it instead of making another.
  if (await getMyListing()) redirect("/dashboard");

  const bids = await boardBids();
  const { claim, amount } = await searchParams;
  const initialBid = Number.isFinite(Number(amount)) ? Number(amount) : undefined;

  return (
    <div className="flex flex-col gap-8 pt-6">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
          Get on the <span className="text-money">leaderboard</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Two minutes. No forms, no cover letter, no waiting to hear back. Pick your bid, take your rank.
        </p>
      </header>

      <JoinForm boardBids={bids} claim={claim} initialBid={initialBid} />

      <p className="text-center text-sm text-muted">
        Here to hire? <Link href="/recruiter" className="font-semibold text-money hover:underline">Discover talent</Link>
      </p>
    </div>
  );
}
