import { NextResponse } from "next/server";
import { getCandidateById } from "@/lib/db";
import { fulfil } from "@/lib/fulfil";
import { ensureVisitorId } from "@/lib/session";
import { getMyListing } from "@/lib/owner";
import { automaticTax, lineItemFor, stripe, stripeConfigured } from "@/lib/stripe";
import { UNLOCK_PRICE } from "@/lib/money";
import type { PaymentType } from "@/lib/types";

const INTENTS: PaymentType[] = ["bid", "unlock", "interview", "hire"];

function origin(req: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
}

export async function POST(req: Request) {
  let body: { intent?: string; candidateId?: string; amount?: number; company?: string; message?: string; acknowledged?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const intent = body.intent as PaymentType;
  if (!INTENTS.includes(intent)) return NextResponse.json({ error: "Unknown intent" }, { status: 400 });

  // Recruiter unlocks have one price and the server decides it. Only bids take
  // an amount from the client, and it still has to clear the current bid below.
  const amount = intent === "bid" ? Math.round(Number(body.amount ?? 0)) : UNLOCK_PRICE;
  if (!Number.isFinite(amount) || amount < 100 || amount > 5_000_000) {
    return NextResponse.json({ error: "Bids must be between $1 and $50,000." }, { status: 400 });
  }

  const candidate = body.candidateId ? await getCandidateById(body.candidateId) : null;
  if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

  // No accounts: the payer is whoever holds the manage token (a candidate
  // raising their own bid) or an anonymous visitor id (a recruiter).
  const visitorId = await ensureVisitorId();

  if (intent === "bid") {
    const mine = await getMyListing();
    if (!mine || mine.id !== candidate.id) {
      return NextResponse.json({ error: "You can only raise your own bid.", redirect: "/join" }, { status: 403 });
    }
    if (amount <= candidate.current_bid) {
      return NextResponse.json({ error: "That doesn't beat your current bid." }, { status: 400 });
    }
  }

  // Refusing here as well as in the UI keeps the record honest: no payment is
  // ever created without the buyer having accepted the terms.
  if (body.acknowledged !== true) {
    return NextResponse.json({ error: "You have to accept the terms before paying." }, { status: 400 });
  }

  const company = (body.company ?? "").trim().slice(0, 80) || null;
  const message = (body.message ?? "").trim().slice(0, 400) || null;

  // ---------------------------------------------------------- demo payments
  if (!stripeConfigured) {
    const result = await fulfil({
      intent,
      candidateId: candidate.id,
      userId: visitorId,
      amount,
      company,
      message,
      paymentRef: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    const params = new URLSearchParams({ demo: "1", intent, candidate: candidate.username, amount: String(amount) });
    if (company) params.set("company", company);
    return NextResponse.json({ url: `/checkout/success?${params}` });
  }

  // -------------------------------------------------------- stripe checkout
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [lineItemFor(intent, candidate.name, amount)],
    success_url: `${origin(req)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin(req)}/profile/${candidate.username}`,
    // Stripe Tax needs an address to work out what to charge.
    ...(automaticTax ? { automatic_tax: { enabled: true }, billing_address_collection: "required" as const } : {}),
    metadata: {
      intent,
      candidate_id: candidate.id,
      user_id: visitorId,
      amount: String(amount),
      company: company ?? "",
      message: message ?? "",
      acknowledged: "true",
      acknowledged_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ url: session.url });
}
