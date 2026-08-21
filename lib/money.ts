/** Everything is stored in pence. Everything is displayed in pounds. */
export const UNLOCK_PRICE = 2500; // £25 to unlock a candidate's contact details

export function gbp(pence: number, opts: { decimals?: boolean } = {}) {
  const pounds = pence / 100;
  const decimals = opts.decimals ?? !Number.isInteger(pounds);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(pounds);
}

/** The cheapest bid that takes the spot above you. */
export function priceToBeat(targetBid: number) {
  return targetBid + 100; // one pound more
}

export function parsePounds(input: string | number | null | undefined): number {
  const n = typeof input === "number" ? input : Number.parseFloat(String(input ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
