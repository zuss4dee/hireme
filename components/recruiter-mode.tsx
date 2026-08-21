"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { becomeRecruiter } from "@/lib/actions";

export function RecruiterMode({ active }: { active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (active) {
    return <span className="chip border-pink/40 bg-pink/10 font-bold text-pink">Recruiter mode on</span>;
  }

  return (
    <button
      onClick={() =>
        start(async () => {
          await becomeRecruiter();
          router.refresh();
        })
      }
      className="btn btn-ghost px-3 py-2 text-xs"
    >
      {pending ? "…" : "Switch to recruiter mode"}
    </button>
  );
}
