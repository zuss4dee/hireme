"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usd } from "@/lib/money";
import type { PaymentType } from "@/lib/types";

export function CheckoutForm({
  intent,
  candidateId,
  candidateName,
  amount,
  minimum,
  presets = [],
  editable,
  demoMode,
  minimumHint,
}: {
  intent: PaymentType;
  candidateId: string;
  candidateName: string;
  amount: number;
  minimum: number;
  presets?: { label: string; amount: number; hint?: string }[];
  editable: boolean;
  demoMode: boolean;
  minimumHint?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(amount);
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tooLow = value < minimum;

  async function pay() {
    setError(null);
    if (tooLow) {
      setError(`Minimum is ${usd(minimum)} — you have to actually beat them.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, candidateId, amount: value, company, message }),
      });
      const data = (await res.json()) as { url?: string; error?: string; redirect?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Payment could not be started.");
        if (data.redirect) router.push(data.redirect);
        setBusy(false);
        return;
      }
      // Full navigation either way: it guarantees the nav, board and dashboard
      // all re-render with the new rank instead of serving the router cache.
      window.location.assign(data.url);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {editable ? (
        <div className="card p-5">
          <label className="label" htmlFor="amount">Your bid</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-money">$</span>
            <input
              id="amount"
              type="number"
              min={minimum / 100}
              step="1"
              value={Number.isFinite(value) ? value / 100 : ""}
              onChange={(e) => setValue(Math.round(Number(e.target.value) * 100))}
              className="field !py-4 !pl-10 !text-3xl !font-black tabular-nums"
            />
          </div>
          <p className={`mt-2 text-xs ${tooLow ? "text-pink" : "text-muted"}`}>
            {minimumHint ?? `Minimum ${usd(minimum)} — anything lower doesn't move you.`}
          </p>

          {presets.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setValue(p.amount)}
                  className={`rounded-xl border p-3 text-left transition ${
                    value === p.amount ? "border-lime bg-lime/10" : "border-line bg-surface-2 hover:border-lime/40"
                  }`}
                >
                  <div className="text-lg font-black tabular-nums text-money">{usd(p.amount)}</div>
                  <div className="text-xs font-semibold">{p.label}</div>
                  {p.hint ? <div className="text-[11px] text-muted">{p.hint}</div> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {intent !== "bid" ? (
        <div className="card flex flex-col gap-4 p-5">
          <div>
            <label className="label" htmlFor="company">Your company</label>
            <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="field" placeholder="Acme Inc." />
          </div>
          {intent !== "unlock" ? (
            <div>
              <label className="label" htmlFor="message">Message to {candidateName.split(" ")[0]}</label>
              <textarea
                id="message"
                rows={3}
                maxLength={400}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="field resize-none"
                placeholder={intent === "hire" ? "We want to make you an offer." : "Loved your portfolio — can you chat Thursday?"}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-pink/40 bg-pink/10 px-4 py-3 text-sm font-semibold text-pink">{error}</p>
      ) : null}

      <button onClick={pay} disabled={busy} className="btn btn-primary w-full text-base disabled:opacity-60">
        {busy ? "Taking you to payment…" : `Pay ${usd(value)}`}
      </button>

      <p className="text-center text-xs text-muted">
        {demoMode
          ? "Demo mode — no Polar keys configured, so this completes instantly without charging anything."
          : "Secure payment by Polar. You'll be redirected to complete it."}
      </p>
    </div>
  );
}
