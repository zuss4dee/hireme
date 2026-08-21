# HireMe.lol

A public leaderboard of people who want to be hired. Pay to climb. Recruiters browse free
and pay to make contact. No CVs, no applications, no ATS.

```
Create profile → climb the leaderboard → share your rank → recruiters discover you
```

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. **No configuration needed** — with no environment variables the
app boots on a seeded in-memory store with simulated payments, so every flow (join, bid,
outbid, unlock, dashboard analytics) is clickable straight away.

## Go real

1. Copy `.env.example` to `.env.local`.
2. **Supabase** — create a project, then paste `supabase/schema.sql` into the SQL editor and run it.
   That creates every table, the RLS policies, the ranking function and the atomic `place_bid` RPC.
   Add the three Supabase keys. If you ran an earlier copy of the schema, apply
   `supabase/migrations/001_polar.sql` too.
3. **Polar** — create two one-time products in the dashboard (sandbox.polar.sh while testing):

   | Product | Pricing | Env var |
   | --- | --- | --- |
   | Leaderboard bid | **Pay what you want** | `POLAR_BID_PRODUCT_ID` |
   | Unlock candidate | **Fixed, £25** | `POLAR_UNLOCK_PRODUCT_ID` |

   Enable **GBP** on both — this app sends amounts in pence, and if GBP isn't enabled Polar
   falls back to your organization's default currency and reads those numbers as its minor
   units instead. Then add `POLAR_ACCESS_TOKEN`, leave `POLAR_SERVER=sandbox` until you go
   live, and add a webhook pointing at `/api/polar/webhook` subscribed to `order.paid`.
   Paste its signing secret as `POLAR_WEBHOOK_SECRET`.

The app switches backends automatically: Supabase when its keys are present, Polar Checkout
when its token and both product ids are present. Either can be enabled independently.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Leaderboard, search, live bid ticker |
| `/join` | Create a candidate profile (live preview, no CV) |
| `/profile/[username]` | Public profile — rank, bid, links, stats, hire buttons |
| `/dashboard` | Candidate analytics + the "outbid them" loop |
| `/recruiter` | Free browsing grid with filters |
| `/checkout` | Bids and recruiter unlocks |
| `/checkout/success` | Confetti, new rank, share |

## How the money works

Everything is stored in **pence** (`current_bid: 4800` = £48).

- **Bid** — a candidate pays to raise their own bid. `place_bid()` updates the bid, logs the
  row, and re-ranks the whole board in one transaction. The minimum is always one pound more
  than the person above.
- **Unlock / interview / hire** — a recruiter pays £25 (`UNLOCK_PRICE`) to reveal contact
  details. A `recruiter_interest` row lands on the candidate's dashboard.

Bids ride Polar's pay-what-you-want pricing, so the buyer's chosen amount is the price.
Unlocks use a fixed-price product, so Polar owns that number and the app never sends one.

Fulfilment lives in one place (`lib/fulfil.ts`) and is idempotent on the Polar checkout id,
so the webhook and the success page can both call it safely. Polar is the merchant of
record, so VAT and sales tax are handled for you.

## Deploy

```bash
vercel
```

Add the same environment variables in the Vercel project, then point a Polar webhook
endpoint at `https://your-domain/api/polar/webhook` for `order.paid`.

## Structure

```
app/          routes (App Router, all server components except forms)
components/   UI — leaderboard, cards, checkout form, confetti
lib/db.ts     the only data layer; dispatches to Supabase or the demo store
lib/fulfil.ts payment → product state
supabase/     schema.sql
```
