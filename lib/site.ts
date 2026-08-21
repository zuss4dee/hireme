/**
 * One source of truth for the brand, derived from NEXT_PUBLIC_SITE_URL so the
 * app follows whatever domain you deploy it on. Safe to import from client
 * components — NEXT_PUBLIC_* is inlined at build time.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hireme.fit";

export const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).host.replace(/^www\./, "");
  } catch {
    return "hireme.fit";
  }
})();

/** ".fit" — empty on hosts without a dot, e.g. localhost:3000 */
const dot = SITE_HOST.indexOf(".");
export const SITE_TLD = dot === -1 ? "" : SITE_HOST.slice(dot);

/** "HireMe" + ".fit" */
export const SITE_BRAND = "HireMe";
export const SITE_NAME = `${SITE_BRAND}${SITE_TLD}`;

/** "hireme.fit/damilare" — what people see and share. */
export function profilePath(username: string) {
  return `${SITE_HOST}/${username}`;
}

export function shareText(rank: number | null) {
  return `I'm #${rank ?? "?"} on ${SITE_NAME}. Outbid me if you dare.`;
}
