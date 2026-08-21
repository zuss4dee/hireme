"use client";

import { useState } from "react";

export function ShareButton({
  url,
  text,
  label = "Share my rank",
  className = "btn btn-ghost",
}: {
  url: string;
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const absolute = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "HireMe.lol", text, url: absolute });
        return;
      } catch {
        // user dismissed — fall through to copy
      }
    }
    await navigator.clipboard.writeText(`${text} ${absolute}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button onClick={share} className={className}>
      {copied ? "Copied ✓" : label}
    </button>
  );
}
