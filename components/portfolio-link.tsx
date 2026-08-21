"use client";

import { trackPortfolioClick } from "@/lib/actions";

export function PortfolioLink({
  candidateId,
  href,
  children,
  className,
}: {
  candidateId: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        // fire-and-forget: never block the click on analytics
        void trackPortfolioClick(candidateId);
      }}
    >
      {children}
    </a>
  );
}
