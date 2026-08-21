import { NextResponse } from "next/server";
import { getCandidateById, getCandidateByUserId } from "@/lib/db";
import { fulfil } from "@/lib/fulfil";
import { getSessionUser, setDemoSession } from "@/lib/session";
import { adHocPrice, polar, polarConfigured, PRODUCT_ID_FOR_CHECKOUT } from "@/lib/polar";
import { UNLOCK_PRICE } from "@/lib/money";
import { supabaseConfigured } from "@/lib/supabase";
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

  const user = await getSessionUser();

  if (intent === "bid") {
    const mine = user ? await getCandidateByUserId(user.id) : null;
    if (!mine || mine.id !== candidate.id) {
      return NextResponse.json({ error: "You can only raise your own bid.", redirect: "/join" }, { status: 403 });
    }
    if (amount <= candidate.current_bid) {
      return NextResponse.json({ error: "That doesn't beat your current bid." }, { status: 400 });
    }
  } else if (!user && !supabaseConfigured) {
    // Demo mode: browsing recruiters get an identity the moment they pay.
    await setDemoSession({ id: `demo-recruiter-${Math.random().toString(36).slice(2, 10)}`, role: "recruiter" });
  }

  // Refusing here as well as in the UI keeps the record honest: no payment is
  // ever created without the buyer having accepted the terms.
  if (body.acknowledged !== true) {
    return NextResponse.json({ error: "You have to accept the terms before paying." }, { status: 400 });
  }

  const company = (body.company ?? "").trim().slice(0, 80) || null;
  const message = (body.message ?? "").trim().slice(0, 400) || null;

  // ---------------------------------------------------------- demo payments
  if (!polarConfigured) {
    const payer = await getSessionUser();
    const result = await fulfil({
      intent,
      candidateId: candidate.id,
      userId: payer?.id ?? null,
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

  // --------------------------------------------------------- polar checkout
  const checkout = await polar().checkouts.create({
    products: [PRODUCT_ID_FOR_CHECKOUT()],
    // Ad-hoc price: locks the amount to what the server just computed.
    prices: adHocPrice(amount),
    customerEmail: user?.email || undefined,
    successUrl: `${origin(req)}/checkout/success?checkout_id={CHECKOUT_ID}`,
    metadata: {
      intent,
      candidate_id: candidate.id,
      user_id: user?.id ?? "",
      amount: String(amount),
      company: company ?? "",
      message: message ?? "",
      acknowledged: "true",
      acknowledged_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ url: checkout.url });
}
