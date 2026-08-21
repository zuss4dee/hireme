export function Stat({
  label,
  value,
  sub,
  accent = "lime",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "lime" | "pink" | "violet" | "gold" | "white";
}) {
  const color = {
    lime: "text-money",
    pink: "text-pink",
    violet: "text-violet",
    gold: "text-gold",
    white: "text-fg",
  }[accent];

  return (
    <div className="card p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-black tabular-nums tracking-tight sm:text-3xl ${color}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  );
}
