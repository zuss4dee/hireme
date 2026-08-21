import "server-only";
import { Polar } from "@polar-sh/sdk";
import type { PaymentType } from "./types";

const ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN ?? "";
const PRODUCT_ID = process.env.POLAR_PRODUCT_ID ?? "";

/**
 * Polar is optional: without a token and a product id the app falls back to
 * demo payments so every flow stays clickable.
 */
export const polarConfigured = Boolean(ACCESS_TOKEN && PRODUCT_ID);

/** "sandbox" talks to sandbox.polar.sh — use it until you go live. */
const SERVER = (process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production") as "sandbox" | "production";

let client: Polar | null = null;
export function polar(): Polar {
  if (!ACCESS_TOKEN) throw new Error("POLAR_ACCESS_TOKEN is not set");
  if (!client) client = new Polar({ accessToken: ACCESS_TOKEN, server: SERVER });
  return client;
}

/**
 * Every bid is a different price, so we send an ad-hoc fixed price with the
 * checkout instead of relying on catalog pricing. One product covers the whole
 * app, and — unlike pay-what-you-want — the buyer cannot edit the amount on
 * Polar's page, so the figure the server computed is the figure that gets paid.
 */
export function adHocPrice(amountInPence: number) {
  return {
    [PRODUCT_ID]: [{ amountType: "fixed" as const, priceCurrency: "gbp" as const, priceAmount: amountInPence }],
  };
}

export const PRODUCT_ID_FOR_CHECKOUT = () => PRODUCT_ID;

export const PAYMENT_COPY: Record<PaymentType, string> = {
  bid: "Leaderboard bid",
  unlock: "Unlock contact details",
  interview: "Interview invitation",
  hire: "Hire request",
};
