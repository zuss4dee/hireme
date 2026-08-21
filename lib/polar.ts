import "server-only";
import { Polar } from "@polar-sh/sdk";
import type { PaymentType } from "./types";

const ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN ?? "";
const BID_PRODUCT = process.env.POLAR_BID_PRODUCT_ID ?? "";
const UNLOCK_PRODUCT = process.env.POLAR_UNLOCK_PRODUCT_ID ?? "";

/**
 * Polar is optional: without a token and the two product ids the app falls back
 * to demo payments so every flow stays clickable.
 */
export const polarConfigured = Boolean(ACCESS_TOKEN && BID_PRODUCT && UNLOCK_PRODUCT);

/** "sandbox" talks to sandbox.polar.sh — use it until you go live. */
const SERVER = (process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production") as "sandbox" | "production";

let client: Polar | null = null;
export function polar(): Polar {
  if (!ACCESS_TOKEN) throw new Error("POLAR_ACCESS_TOKEN is not set");
  if (!client) client = new Polar({ accessToken: ACCESS_TOKEN, server: SERVER });
  return client;
}

/**
 * Bids go through a pay-what-you-want product so the buyer sets the amount.
 * Recruiter unlocks are a fixed-price product — Polar owns that price, so we
 * never send an amount for them.
 */
export function productFor(intent: PaymentType) {
  return intent === "bid"
    ? { id: BID_PRODUCT, payWhatYouWant: true }
    : { id: UNLOCK_PRODUCT, payWhatYouWant: false };
}

export const PAYMENT_COPY: Record<PaymentType, string> = {
  bid: "Leaderboard bid",
  unlock: "Unlock contact details",
  interview: "Interview invitation",
  hire: "Hire request",
};
