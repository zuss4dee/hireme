"use client";

import { useState } from "react";

/**
 * There are no accounts, so this link *is* the account. It has to be
 * impossible to scroll past. The URL is built server-side and passed in, so
 * the server and client render identical markup.
 */
export function ManageLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-xl border border-gold/40 bg-gold/10 p-4 text-left">
      <p className="text-[11px] font-black uppercase tracking-widest text-gold">Save this link</p>
      <p className="mt-1 text-sm text-fg/80">
        It&apos;s the only way back to your listing — there are no passwords to reset. It already
        works in this browser; save it in case you switch device.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs">
          {url}
        </code>
        <button onClick={copy} className="btn btn-ghost shrink-0 px-3 py-2 text-xs">
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}
