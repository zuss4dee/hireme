import { NextResponse } from "next/server";
import { getCandidateById, getCandidateByUserId } from "@/lib/db";
import { fulfil } from "@/lib/fulfil";
import { getSessionUser, setDemoSession } from "@/lib/session";
import { polar, polarConfigured, productFor } from "@/lib/polar";
import { supabaseConfigured } from "@/lib/supabase";
import type { PaymentType } from "@/lib/types";

const INTENTS: PaymentType[] = ["bid", "unlock", "interview", "hire"];

function origin(req: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
}

export async function POST(req: Request) {
  let body: { intent?: string; candidateId?: string; amount?: number; company?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const intent = body.intent as PaymentType;
  if (!INTENTS.includes(intent)) return NextResponse.json({ error: "Unknown intent" }, { status: 400 });

  const amount = Math.round(Number(body.amount ?? 0));
  if (!Number.isFinite(amount) || amount < 100 || amount > 5_000_000) {
    return NextResponse.json({ error: "Bids must be between £1 and £50,000." }, { status: 400 });
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
  const product = productFor(intent);
  const checkout = await polar().checkouts.create({
    products: [product.id],
    // Only the bid product is pay-what-you-want; the unlock product carries its
    // own fixed price and Polar rejects an amount for it.
    ...(product.payWhatYouWant ? { amount } : {}),
    currency: "gbp",
    customerEmail: user?.email || undefined,
    successUrl: `${origin(req)}/checkout/success?checkout_id={CHECKOUT_ID}`,
    metadata: {
      intent,
      candidate_id: candidate.id,
      user_id: user?.id ?? "",
      amount: String(amount),
      company: company ?? "",
      message: message ?? "",
    },
  });

  return NextResponse.json({ url: checkout.url });
}
