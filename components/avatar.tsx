"use client";

import { useState } from "react";

const GRADIENTS = [
  "linear-gradient(135deg,#d4ff3f,#9b6bff)",
  "linear-gradient(135deg,#ff4d9d,#ffc83d)",
  "linear-gradient(135deg,#9b6bff,#4dd7ff)",
  "linear-gradient(135deg,#ffc83d,#ff4d9d)",
  "linear-gradient(135deg,#4dffb0,#d4ff3f)",
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({
  name,
  src,
  size = 48,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 font-black text-ink ${className}`}
      style={{ width: size, height: size, background: GRADIENTS[seed], fontSize: size * 0.36 }}
      aria-hidden={false}
    >
      {!src || broken ? (
        initials(name)
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
    </span>
  );
}
