import Link from "next/link";
import { Logo } from "./logo";
import { getMyListing } from "@/lib/owner";
import { SITE_BRAND, SITE_TLD } from "@/lib/site";

export async function Nav() {
  const me = await getMyListing();

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <Logo size={32} className="transition group-hover:-translate-y-0.5" />
          <span className="text-lg font-black tracking-tight">
            {SITE_BRAND}
            <span className="text-money">{SITE_TLD}</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <Link href="/opportunities" className="hidden rounded-full px-3 py-2 text-muted transition hover:bg-black/[0.04] hover:text-fg sm:block">
            Opportunities
          </Link>
          <Link href="/companies" className="hidden rounded-full px-3 py-2 text-muted transition hover:bg-black/[0.04] hover:text-fg sm:block">
            Companies
          </Link>
          <Link href="/recruiter" className="hidden rounded-full px-3 py-2 text-muted transition hover:bg-black/[0.04] hover:text-fg sm:block">
            Discover talent
          </Link>
          {me ? (
            <>
              <Link href={`/profile/${me.username}`} className="hidden rounded-full px-3 py-2 text-muted transition hover:bg-black/[0.04] hover:text-fg sm:block">
                My profile
              </Link>
              <Link href="/dashboard" className="btn btn-primary px-4 py-2 text-sm">
                Dashboard {me.rank ? `· #${me.rank}` : ""}
              </Link>
            </>
          ) : (
            <Link href="/join" className="btn btn-primary px-4 py-2 text-sm">
              Claim your spot
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
