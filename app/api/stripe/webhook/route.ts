import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfil } from "@/lib/fulfil";
import { stripe, stripeConfigured } from "@/lib/stripe";
import type { PaymentType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: Request) {
  if (!stripeConfigured || !SECRET) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  // constructEvent needs the raw body, so read it as text before parsing.
  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, SECRET);
  } catch (e) {
    const message = e instanceof Error ? e.message : "invalid signature";
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const meta = session.metadata ?? {};
    const candidateId = meta.candidate_id ?? "";
    const expected = Number(meta.amount ?? 0);
    const paid = session.amount_subtotal ?? session.amount_total ?? 0;

    if (session.payment_status === "paid" && candidateId) {
      // What we asked for vs. what actually cleared. Never grant a rank the
      // payment didn't cover.
      if (paid < expected) {
        console.error("[stripe] underpaid session, refusing to fulfil", { id: session.id, expected, paid });
        return NextResponse.json({ received: true, ignored: "underpaid" });
      }

      const result = await fulfil({
        intent: (meta.intent as PaymentType) || "unlock",
        candidateId,
        userId: meta.user_id || null,
        amount: expected || paid,
        company: meta.company || null,
        message: meta.message || null,
        paymentRef: session.id,
      });
      if (!result.ok) console.error("[stripe] fulfilment failed", result.error, session.id);
    }
  }

  return NextResponse.json({ received: true });
}
