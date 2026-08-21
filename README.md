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
   That creates every table, the RLS policies, the column grants, the ranking function and the
   atomic `place_bid` RPC. Add the three Supabase keys. Supabase Auth is **not** used — no
   redirect URLs to configure. If you have an older database, apply everything in
   `supabase/migrations/` in order.
3. **Stripe** — add `STRIPE_SECRET_KEY`. There is no product to create: every checkout builds
   an inline `price_data` line item, so the amount is always the one the server computed and
   the buyer can't change it. For local webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

   Paste the printed signing secret as `STRIPE_WEBHOOK_SECRET`. In production, add an endpoint
   at `/api/stripe/webhook` subscribed to `checkout.session.completed`.

   You are the merchant of record, so **sales tax and VAT are yours to handle**. Configure
   Stripe Tax in the dashboard (origin address plus at least one registration), then set
   `STRIPE_AUTOMATIC_TAX=true` — Checkout rejects the session if you enable it before then.

The app switches backends automatically: Supabase when its keys are present, Stripe Checkout
when its secret key is present. Either can be enabled independently.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Leaderboard, search, live bid ticker |
| `/join` | Create a profile and place an opening bid (live preview, no CV) |
| `/profile/[username]` | Public profile — rank, bid, links, stats, hire buttons |
| `/dashboard` | Candidate analytics + the "outbid them" loop (manage-token cookie) |
| `/manage?key=…` | Exchanges a manage token for a cookie — this replaces logging in |
| `/recruiter` | Free browsing grid — filter by status, skill, location and bid range |
| `/checkout` | Bids and recruiter unlocks |
| `/rules` | Ranking rules, refunds, chargebacks, moderation |
| `/admin` | Moderation — hide/restore listings (404s unless `ADMIN_TOKEN` is set) |
| `/checkout/success` | Confetti, new rank, share |

## How the money works

Everything is stored in **cents** (`current_bid: 4800` = $48).

- **Bid** — a candidate pays to raise their own bid. `place_bid()` updates the bid, logs the
  row, and re-ranks the whole board in one transaction. The minimum is always one pound more
  than the person above.
- **Unlock / interview / hire** — a recruiter pays $25 (`UNLOCK_PRICE`) to reveal contact
  details. A `recruiter_interest` row lands on the candidate's dashboard.

Both bids and unlocks are inline `price_data` line items created with the checkout, so the
server is the only thing that decides what anything costs. The client can propose a bid amount; it is
re-validated against the current bid before checkout. Unlock prices ignore the client
entirely. The webhook refuses to fulfil an order that cleared for less than it should have.

Fulfilment lives in one place (`lib/fulfil.ts`) and is idempotent on the Stripe session id,
so the webhook and the success page can both call it safely.

## Deploy

```bash
vercel
```

Add the same environment variables in the Vercel project, then point a Stripe webhook
endpoint at `https://your-domain/api/stripe/webhook` for `checkout.session.completed`.

## No accounts

There are no logins, passwords or magic links. Ownership of a listing is a **secret manage
token** minted when the profile is created:

- It's set as an httpOnly cookie immediately, so the dashboard works in that browser.
- It's also handed over as `/manage?key=<token>` on the success page, so a lost cookie or a
  new device doesn't strand the listing.
- Recruiters are fully anonymous. A `hireme_vid` cookie remembers which candidates they
  unlocked so the contact details stay visible on return visits.

`manage_token` and `contact_email` are **not readable with the public anon key** —
`grant select (…)` on `candidate_profiles` lists only the public columns. That matters more
than it looks: RLS is row-level and cannot stop `?select=contact_email`, and a column-level
`REVOKE` does nothing against a table-level grant. Without the column grant, anyone could
dump every candidate's email with the key that ships in the browser bundle and bypass the
$25 unlock entirely.

## Moderation

Set `ADMIN_TOKEN` (e.g. `openssl rand -hex 32`) and `/admin` opens a token-gated list of every
profile — live, unpaid and hidden — with one button each. Without the variable the route 404s,
so no admin surface exists at all.

Hiding is reversible and destroys nothing: the profile, its bids and its payment history stay.
A hidden listing drops out of the board, search, recruiter filters, the homepage activity ticker
and the total, holds no rank, and the ranks below it close up. The owner sees a notice on their
dashboard and profile explaining what happened.

## Security note

`place_bid` and `recompute_ranks` are `SECURITY DEFINER`, and Postgres grants `EXECUTE` to
`PUBLIC` by default — which exposes them over PostgREST to the **anon key that ships in the
browser bundle**. Left alone, anyone could `POST /rest/v1/rpc/place_bid` and claim rank #1
without paying. `004_function_grants.sql` revokes that and grants execute to `service_role`
only, which is the role the server uses after a payment clears. Re-run
`get_advisors`/the database linter after any change that adds a `SECURITY DEFINER` function.

## Notes

**Skills accept anything.** `lib/skills.ts` splits on commas, newlines, bullets, pipes,
semicolons and middots, so people can paste straight from a CV. Multi-word skills
("Design systems") and slashed ones ("CI/CD") survive intact; duplicates are dropped
case-insensitively.

**Every payment requires an explicit acknowledgement.** The checkout has a non-refundable
consent checkbox, enforced server-side as well as in the UI, and the acceptance is written into
the Stripe session metadata — so a chargeback can be answered with evidence the buyer agreed.

**Recruiter facets come from the live board**, not a hardcoded taxonomy — the skill and
location filters list whatever people actually put on their profiles, most common first.

**Don't run `npm run build` while `next dev` is running.** They share `.next` and the
production build corrupts the dev server's module map (every page 500s with
`__webpack_modules__[moduleId] is not a function`). Use `npm run build:check`, which builds
into `.next-build` instead.

## Structure

```
app/          routes (App Router, all server components except forms)
components/   UI — leaderboard, cards, checkout form, confetti
lib/db.ts     the only data layer; dispatches to Supabase or the demo store
lib/fulfil.ts payment → product state
supabase/     schema.sql
```
