import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/nav";
import { supabaseConfigured } from "@/lib/supabase";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — the internet's leaderboard for talent`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Stop applying. Start getting discovered. Climb the leaderboard and let companies come to you.",
  openGraph: {
    title: `${SITE_NAME} — the internet's leaderboard for talent`,
    description: "Stop applying. Start getting discovered.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#08080d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        {/* No database configured means the board is seed data, not real people.
            Says so on its own, and disappears the moment Supabase is wired up. */}
        {!supabaseConfigured ? (
          <p className="border-b border-gold/30 bg-gold/10 px-4 py-2 text-center text-xs font-semibold text-gold">
            Preview — these are example listings while we get set up. Nobody here is real yet.
          </p>
        ) : null}
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
        <footer className="border-t border-line/60 py-10 text-sm text-muted">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              <span className="font-black text-fg">{SITE_NAME}</span> — where talent gets discovered.
              <br className="sm:hidden" />
              <span className="sm:ml-1">
                Inspired by{" "}
                <a
                  href="https://outbid.lol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-fg underline decoration-money underline-offset-2 hover:text-money"
                >
                  outbid.lol
                </a>
                .
              </span>
            </p>
            <div className="flex gap-5">
              <Link href="/" className="hover:text-fg">Leaderboard</Link>
              <Link href="/join" className="hover:text-fg">Claim your spot</Link>
              <Link href="/recruiter" className="hover:text-fg">Discover talent</Link>
              <Link href="/rules" className="hover:text-fg">Rules</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
