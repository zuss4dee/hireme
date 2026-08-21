"use client";

import { useState } from "react";
import { browserClient } from "@/lib/supabase-browser";

export function LoginForm({ next = "/join" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const { error } = await browserClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { role },
      },
    });
    if (error) {
      setError(error.message);
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="card p-8 text-center">
        <p className="text-2xl font-black tracking-tight">Check your email 📬</p>
        <p className="mt-2 text-muted">
          We sent a magic link to <span className="font-semibold text-white">{email}</span>. No password, ever.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="card flex flex-col gap-4 p-6">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="you@example.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(["candidate", "recruiter"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl border p-3 text-sm font-bold transition ${
              role === r ? "border-lime bg-lime/10 text-lime" : "border-line bg-white/[0.03] text-muted hover:text-white"
            }`}
          >
            {r === "candidate" ? "I want to be hired" : "I'm hiring"}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm font-semibold text-pink">{error}</p> : null}
      <button type="submit" disabled={state === "sending"} className="btn btn-primary disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}
