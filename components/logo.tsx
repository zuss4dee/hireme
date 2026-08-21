/**
 * Three ascending bars — a leaderboard climbing, with the top bar crowned by a
 * spark. Reads as "ranking" rather than "money", which is the product.
 * Built to stay legible at favicon size, so no thin strokes and no detail
 * below ~2px at 32px.
 */
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="HireMe"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-lime, #c8f331)" />
      {/* podium: 3rd, 2nd, 1st */}
      <rect x="6.5" y="18" width="5" height="7.5" rx="2.5" fill="var(--color-ink, #0a0a0f)" />
      <rect x="13.5" y="14" width="5" height="11.5" rx="2.5" fill="var(--color-ink, #0a0a0f)" />
      <rect x="20.5" y="9.5" width="5" height="16" rx="2.5" fill="var(--color-ink, #0a0a0f)" />
      {/* the spark on top of first place */}
      <circle cx="23" cy="5" r="2.25" fill="var(--color-ink, #0a0a0f)" />
    </svg>
  );
}
