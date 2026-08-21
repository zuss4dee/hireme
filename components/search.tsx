"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const QUICK = ["Engineer", "Designer", "Product", "AI", "London", "Remote"];

export function Search({ action = "/", placeholder = "Search by name, role, skill or city…" }: { action?: string; placeholder?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();

  function go(value: string) {
    setQ(value);
    start(() => router.push(value ? `${action}?q=${encodeURIComponent(value)}` : action));
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(q);
        }}
        className="relative"
      >
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">⌕</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Search candidates"
          className="field !rounded-full !py-3.5 pl-10 pr-24"
        />
        <button type="submit" className="btn btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 text-sm">
          {pending ? "…" : "Search"}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((t) => (
          <button key={t} onClick={() => go(t)} className="chip transition hover:border-lime/50 hover:text-lime">
            {t}
          </button>
        ))}
        {params.get("q") ? (
          <button onClick={() => go("")} className="chip border-pink/40 text-pink transition hover:bg-pink/10">
            clear ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
