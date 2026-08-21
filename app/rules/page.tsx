import type { Metadata } from "next";
import Link from "next/link";
import { MIN_BID, UNLOCK_PRICE, usd } from "@/lib/money";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Rules" };

const SECTIONS = [
  {
    title: "How ranking works",
    items: [
      "Your bid is your rank. Nothing else affects position.",
      `Bids are whole US dollars, minimum ${usd(MIN_BID)}.`,
      "Bid more than someone and you take their place. Bid less and you sit below them — you still get listed, at whatever rank the bid earns.",
      "Equal bids break in favour of whoever got there first.",
      "Raising your own bid only costs the new amount; you are not refunded the old one.",
    ],
  },
  {
    title: "What you can list",
    items: [
      "A real person looking for work, with a working portfolio, site or profile link.",
      "One listing per person. Duplicates get removed.",
      "No agencies, no lead-gen, no listings on someone else's behalf without their say-so.",
    ],
  },
  {
    title: "After you pay",
    items: [
      "Your listing goes public as soon as the payment clears. That is what claims the rank.",
      "Until it clears, your profile is saved but invisible.",
      "Your contact details stay hidden until a recruiter pays to unlock them.",
    ],
  },
  {
    title: "For recruiters",
    items: [
      `Browsing is free. ${usd(UNLOCK_PRICE)} unlocks one candidate's contact details.`,
      "Unlocking notifies the candidate that you're interested.",
      "Contact details are for contacting that candidate. Don't resell, scrape or bulk-export them.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 pt-8">
      <header>
        <h1 className="text-4xl font-black tracking-tighter">Rules</h1>
        <p className="mt-3 text-muted">
          {SITE_NAME} is a public leaderboard. You pay to stand above everyone else. Rank is the
          bid — nothing else.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="text-lg font-black tracking-tight">{section.title}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {section.items.map((item) => (
              <li key={item} className="flex gap-3 text-fg/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-money" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card p-6">
        <h2 className="text-lg font-black tracking-tight">Refunds &amp; chargebacks</h2>
        <div className="mt-3 flex flex-col gap-3 text-fg/80">
          <p>
            Payments are <span className="font-bold">non-refundable</span>. A bid buys a position on a
            public board, delivered immediately — it is not a guarantee of staying there, of being
            contacted, or of being hired. Being outbid is the game working as intended, not a fault.
          </p>
          <p>
            Recruiter unlocks are non-refundable once the contact details have been revealed, because
            that is the entire thing being sold.
          </p>
          <p>
            If something went wrong with a payment — charged twice, charged the wrong amount, a
            listing that never went live — email us before opening a dispute and we will sort it out.
            Nothing here removes rights you have by law.
          </p>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-black tracking-tight">Moderation</h2>
        <p className="mt-3 text-fg/80">
          We can remove any listing from the board — impersonation, abuse, spam, or anything that
          makes the board worse. A removed listing keeps its data and can be restored, but does not
          appear publicly. Removal for breaking these rules does not come with a refund.
        </p>
      </section>

      <p className="text-sm text-muted">
        Payments are processed by <span className="font-semibold text-fg">Polar</span>, the merchant
        of record — they appear on your statement and handle tax.{" "}
        <Link href="/" className="font-semibold text-money hover:underline">Back to the board</Link>
      </p>
    </div>
  );
}
