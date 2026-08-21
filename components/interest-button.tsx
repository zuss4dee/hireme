"use client";

import { useState, useTransition } from "react";
import { expressOpportunityInterest } from "@/lib/actions";

export function InterestButton({ opportunityId }: { opportunityId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function showInterest() {
    setMessage(null);
    startTransition(async () => {
      const result = await expressOpportunityInterest(opportunityId);
      setMessage(result?.error ?? "Interest sent to the company.");
    });
  }

  return (
    <div>
      <button type="button" onClick={showInterest} disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? "Sending…" : "I&apos;m interested"}
      </button>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
