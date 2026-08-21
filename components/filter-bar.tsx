import Link from "next/link";

export type FilterGroup = {
  key: string;
  label: string;
  options: { value: string; label: string; count?: number }[];
};

/**
 * Link-based filters — no client JS, every combination is a shareable URL.
 */
export function FilterBar({
  groups,
  active,
  basePath,
  query,
}: {
  groups: FilterGroup[];
  active: Record<string, string | undefined>;
  basePath: string;
  query?: string;
}) {
  function hrefFor(key: string, value: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    Object.entries(active).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v);
    });
    // Clicking the active option clears it.
    if (value && active[key] !== value) params.set(key, value);
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-wrap items-center gap-2">
          <span className="w-20 shrink-0 text-[11px] font-black uppercase tracking-widest text-muted">
            {group.label}
          </span>
          {group.options.map((opt) => {
            const isActive = (active[group.key] ?? "") === opt.value;
            return (
              <Link
                key={`${group.key}-${opt.value || "all"}`}
                href={hrefFor(group.key, opt.value)}
                className={`chip transition ${
                  isActive ? "border-money/50 bg-money/10 font-bold text-money" : "hover:border-money/40 hover:text-fg"
                }`}
              >
                {opt.label}
                {opt.count !== undefined ? <span className="text-muted">{opt.count}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
