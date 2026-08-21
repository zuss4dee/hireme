import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { fulfil } from "@/lib/fulfil";
import { polarConfigured } from "@/lib/polar";
import type { PaymentType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.POLAR_WEBHOOK_SECRET ?? "";

/** Polar metadata values come back as string | number | boolean. */
function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

export async function POST(req: Request) {
  if (!polarConfigured || !SECRET) {
    return NextResponse.json({ error: "Polar is not configured" }, { status: 501 });
  }

  const body = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => (headers[key] = value));

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(body, headers, SECRET);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    throw e;
  }

  // order.paid is the one that means "the money actually arrived".
  if (event.type === "order.paid") {
    const order = event.data;
    const meta = (order.metadata ?? {}) as Record<string, unknown>;
    const candidateId = str(meta.candidate_id);

    // What we asked for vs. what actually cleared. The ad-hoc price should make
    // these identical; if they ever diverge, the money wins and we don't grant a
    // rank that wasn't paid for.
    const expected = Number(meta.amount ?? 0);
    const paid = order.subtotalAmount ?? order.totalAmount ?? 0;

    if (candidateId && paid < expected) {
      console.error("[polar] underpaid order, refusing to fulfil", { orderId: order.id, expected, paid });
      return NextResponse.json({ received: true, ignored: "underpaid" });
    }

    if (candidateId) {
      const result = await fulfil({
        intent: (str(meta.intent) as PaymentType) || "unlock",
        candidateId,
        userId: str(meta.user_id) || null,
        amount: expected || paid,
        company: str(meta.company) || null,
        message: str(meta.message) || null,
        // Keyed on the checkout so the success page and this handler collapse
        // into one payment row.
        paymentRef: order.checkoutId ?? order.id,
      });
      if (!result.ok) console.error("[polar] fulfilment failed", result.error, order.id);
    }
  }

  return NextResponse.json({ received: true });
}
