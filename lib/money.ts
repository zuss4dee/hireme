/** Everything is stored in cents. Everything is displayed in dollars. */
export const UNLOCK_PRICE = 2500; // $25 to unlock a candidate's contact details

/**
 * The floor to get on the board at all. Nobody is listed for free — a bid of 0
 * means "profile created, not paid for yet" and stays off the leaderboard.
 * Raise this if the board fills up with drive-by signups.
 */
export const MIN_BID = 500; // $5

export function usd(cents: number, opts: { decimals?: boolean } = {}) {
  const dollars = cents / 100;
  const decimals = opts.decimals ?? !Number.isInteger(dollars);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(dollars);
}

/** The cheapest bid that takes the spot above you. */
export function priceToBeat(targetBid: number) {
  return targetBid + 100; // one dollar more
}

export function parseDollars(input: string | number | null | undefined): number {
  const n = typeof input === "number" ? input : Number.parseFloat(String(input ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
