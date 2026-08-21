import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { Nav } from "@/components/nav";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — who deserves to be hired?`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "A public leaderboard of people who want to be hired. Outbid your way to the top. Recruiters browse for free and hire directly.",
  openGraph: {
    title: `${SITE_NAME} — who deserves to be hired?`,
    description: "Pay to climb. Get discovered. The leaderboard is the product.",
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
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
        <footer className="border-t border-line/60 py-10 text-sm text-muted">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              <span className="font-black text-fg">{SITE_NAME}</span> — the leaderboard is the product.
            </p>
            <div className="flex gap-5">
              <Link href="/" className="hover:text-fg">Leaderboard</Link>
              <Link href="/join" className="hover:text-fg">Join</Link>
              <Link href="/recruiter" className="hover:text-fg">For recruiters</Link>
              <Link href="/rules" className="hover:text-fg">Rules</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
