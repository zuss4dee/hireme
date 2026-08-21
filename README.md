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
3. **Polar** — create **one** one-time product in the dashboard (sandbox.polar.sh while
   testing) and put its id in `POLAR_PRODUCT_ID`. Its catalog price is irrelevant: every
   checkout sends an **ad-hoc USD price**, so the amount is always the one the server
   computed. That matters — with pay-what-you-want pricing the buyer can edit the amount on
   Polar's page, which would let someone claim a $151 rank for $1.

   Then add `POLAR_ACCESS_TOKEN`, leave `POLAR_SERVER=sandbox` until you go live, and add a
   webhook pointing at `/api/polar/webhook` subscribed to `order.paid`. Paste its signing
   secret as `POLAR_WEBHOOK_SECRET`.

The app switches backends automatically: Supabase when its keys are present, Polar Checkout
when its token and product id are present. Either can be enabled independently.

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

Everything is stored in **cents** (`current_bid: 4800` = $48).

- **Bid** — a candidate pays to raise their own bid. `place_bid()` updates the bid, logs the
  row, and re-ranks the whole board in one transaction. The minimum is always one pound more
  than the person above.
- **Unlock / interview / hire** — a recruiter pays $25 (`UNLOCK_PRICE`) to reveal contact
  details. A `recruiter_interest` row lands on the candidate's dashboard.

Both bids and unlocks are ad-hoc fixed prices created with the checkout, so the server is
the only thing that decides what anything costs. The client can propose a bid amount; it is
re-validated against the current bid before checkout. Unlock prices ignore the client
entirely. The webhook refuses to fulfil an order that cleared for less than it should have.

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
