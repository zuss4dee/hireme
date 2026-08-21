"use client";

import { useEffect, useState } from "react";

const COLORS = ["#d4ff3f", "#ff4d9d", "#9b6bff", "#ffc83d", "#ffffff"];

/** Cheap, dependency-free celebration. Respects reduced-motion. */
export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces, setPieces] = useState<{ left: number; delay: number; dur: number; color: string; size: number; rot: number }[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setPieces(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.4 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rot: Math.random() * 360,
      })),
    );
  }, [count]);

  if (pieces.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-5vh",
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `confetti-fall ${p.dur}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`@keyframes confetti-fall{to{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}
