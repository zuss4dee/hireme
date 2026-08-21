import "server-only";
import Stripe from "stripe";
import type { PaymentType } from "./types";

const KEY = process.env.STRIPE_SECRET_KEY ?? "";

/** Stripe is optional: without a key the app falls back to demo payments. */
export const stripeConfigured = Boolean(KEY);

/**
 * We are the merchant of record now, so tax is ours to handle. Turn this on
 * once Stripe Tax is configured in the dashboard (origin address + at least
 * one registration), otherwise Checkout rejects the session.
 */
export const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "true";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(KEY, { typescript: true });
  return client;
}

/**
 * Every bid is a different price, so each checkout carries an inline
 * `price_data` line item rather than a catalog price. The buyer cannot edit
 * it, so the figure the server computed is the figure that gets charged.
 */
/**
 * Managed Payments is on by default for this account, and it requires a product
 * tax code on every inline line item. Stripe warns against the generic
 * "Electronically Supplied Services" code for US sales because it misses
 * state-level distinctions, so we use the specific SaaS codes and split them by
 * who is actually buying: candidates are individuals, recruiters are businesses.
 */
const TAX_CODE: Record<PaymentType, string> = {
  bid: "txcd_10103000", // SaaS - Personal Use
  unlock: "txcd_10103001", // SaaS - Business Use
  interview: "txcd_10103001",
  hire: "txcd_10103001",
};

export function lineItemFor(intent: PaymentType, candidateName: string, amount: number): Stripe.Checkout.SessionCreateParams.LineItem {
  const copy: Record<PaymentType, { name: string; description: string }> = {
    bid: {
      name: `Leaderboard bid — ${candidateName}`,
      description: "Claims your position on the public HireMe.fit board. Non-refundable.",
    },
    unlock: {
      name: `Unlock contact details — ${candidateName}`,
      description: "Reveals this candidate's contact details immediately. Non-refundable.",
    },
    interview: {
      name: `Interview invitation — ${candidateName}`,
      description: "Unlocks contact details and sends an interview request. Non-refundable.",
    },
    hire: {
      name: `Hire request — ${candidateName}`,
      description: "Unlocks contact details and sends a hire request. Non-refundable.",
    },
  };

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: amount,
      product_data: { ...copy[intent], tax_code: TAX_CODE[intent] },
    },
  };
}
