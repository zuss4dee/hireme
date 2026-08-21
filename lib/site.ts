/**
 * One source of truth for the brand, derived from NEXT_PUBLIC_SITE_URL so the
 * app follows whatever domain you deploy it on. Safe to import from client
 * components — NEXT_PUBLIC_* is inlined at build time.
 */
const FALLBACK = "https://hireme.fit";

/**
 * Env vars arrive as strings, and an unset one in a dashboard is "" rather than
 * undefined — which `??` does not catch. Anything unusable (blank, missing
 * protocol, malformed) falls back rather than throwing, because this feeds
 * `metadataBase` and a throw here fails the whole build.
 */
function normaliseSiteUrl(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return FALLBACK;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return FALLBACK;
  }
}

export const SITE_URL = normaliseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** Always parseable: SITE_URL is validated above. */
export const SITE_HOST = new URL(SITE_URL).host.replace(/^www\./, "");

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
