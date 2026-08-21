import { gbp } from "@/lib/money";
import type { ActivityItem } from "@/lib/db";

export function Ticker({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden rounded-full border border-line bg-white/[0.03] py-2">
      <div className="marquee flex w-max gap-8 whitespace-nowrap text-sm">
        {loop.map((a, i) => (
          <span key={`${a.id}-${i}`} className="flex items-center gap-2 text-muted">
            <span className="text-pink">🔥</span>
            <span className="font-bold text-white">{a.name}</span>
            <span>bid</span>
            <span className="font-black text-lime tabular-nums">{gbp(a.amount)}</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink to-transparent" />
    </div>
  );
}
