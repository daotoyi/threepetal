<div align="center">

**English** &nbsp; | &nbsp; [简体中文](README.zh-CN.md)

</div>

# Threepetal

> Threepetal is a quiet, ad-free puzzle garden: match three petals at a time, earn them back, and grow a little haven you own forever.

An ad-free, buy-once ($4.99) cozy match-three puzzle game with cloud saves, made for an English-speaking audience. Match petals, furnish a small garden, and keep it for good.

- **Tagline:** *Three petals at a time.*
- **Stack:** Next.js 15 (App Router) + Supabase (Postgres / Auth / RLS) + LemonSqueezy (merchant of record, handles global sales tax)
- **Repository:** https://github.com/daotoyi/threepetal
- **Contract:** `Spec.md` is the single source of truth for behaviour and acceptance criteria.

> The working name "Tiny Haven" was dropped after a naming conflict with `tinyhaven.gg`, a web-based cozy life sim in the same space. The directory and npm package are both named `threepetal`.

## How to play

1. Tap two neighbouring petals to swap them.
2. Line up three or more of the same colour to clear them. Each tile cleared earns 2 petals.
3. Reach the chapter's petal goal before you run out of moves. A swap that makes no match costs nothing.
4. Spend petals on garden decorations. Your progress saves to the cloud.

No timer. No ads. The first three chapters are free; one $4.99 purchase unlocks all six.

> Level data lives in `lib/game/levels.ts`: 6 chapters (3 free + 3 paid). Chapter one is 5x5 / 30 petals / 12 moves; chapter six is 8x8 / 130 petals / 22 moves. When adding chapters, update this section and the "All 6 chapters" copy on the `/unlock` page.

## Project structure

```
app/
  page.tsx             Landing page (live game preview hero)
  play/page.tsx        Game page (chapter select, board, decorations, cloud save)
  unlock/page.tsx      Checkout page (LemonSqueezy)
  account/page.tsx     Account page (email magic link, restore purchase)
  api/checkout         Create a LemonSqueezy checkout session
  api/webhook          LemonSqueezy webhook (signature, idempotency, licenses)
  api/entitlements     Server-side entitlement check (source of truth)
  api/progress         Cloud save read / write
components/            ui / SiteHeader / SiteFooter / GameCanvas / DecorationPanel
lib/supabase/          browser + server clients (@supabase/ssr)
lib/lemonsqueezy.ts    checkout creation + webhook signature verification
lib/game/              types / engine (match-3) / levels
supabase/migrations/   0001_init.sql (RLS policies and unique indexes)
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values (see Account setup below):

```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
LEMONSQUEEZY_API_KEY / LEMONSQUEEZY_STORE_ID / LEMONSQUEEZY_VARIANT_ID / LEMONSQUEEZY_WEBHOOK_SECRET
NEXT_PUBLIC_SITE_URL
ENTITLEMENT_FULL_GAME=full_game
```

No real credentials are committed to this repository.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000
```

> Vercel Hobby cannot be used for commercial projects; production requires Vercel Pro. The Supabase free tier pauses projects and has no backups, so use Pro in production.

## Account setup (one-time)

1. **Supabase:** create a project -> run `supabase/migrations/0001_init.sql` in the SQL Editor -> copy the project URL, anon key and service_role key from Project Settings.
2. **LemonSqueezy:** register as a merchant (KYC) -> create a one-time $4.99 product named "Full Game Unlock" -> copy the Store ID and Variant ID -> under Settings / Webhooks, add an endpoint pointing to `https://<your-domain>/api/webhook` and generate a Webhook Secret. Repeat in the Sandbox store for test payments.

## Payment flow (sandbox test)

1. Start the dev server and sign in on `/account` via email magic link.
2. Open `/unlock` and choose "Unlock" -> the client POSTs `/api/checkout` -> receives a LemonSqueezy checkout URL -> redirects.
3. Complete a test payment with the LemonSqueezy Sandbox / Simulator -> LemonSqueezy sends an `order_created` webhook.
4. The webhook verifies the signature, writes `purchases` and `licenses` (`full_game`, active), and only **after** those succeed records the `ls_events` idempotency marker. A failed write returns 5xx so LemonSqueezy retries.
5. `/api/entitlements` returns `full_game` -> paid chapters unlock, decorations become available, cloud saves activate.
6. On another device, choose "Restore" to recover the entitlement from the license.

Refunds (`order_refunded`) revoke access by looking up `purchases.ls_order_id`, since refund events do not carry `custom_data.user_id`.

## Quality gates (P0)

- Lucide SVG icons throughout, no emoji icons; no purple-to-pink gradients; components reference Design Tokens only (no hardcoded hex colours).
- The `licenses` table is the source of truth for entitlements and is written only by the webhook via service_role; the client-side gate is UX only.
- Webhook signature verification + event idempotency + enforced RLS protect against forged client requests and replays.
- Landing and checkout pages state only shipped capabilities: no fabricated testimonials, no promises of unreleased features.

## Status

The code, game loop and payment chain are implemented and verified with a production build and runtime smoke test. Still outstanding:

- Third-party credentials: Supabase project + migration, LemonSqueezy sandbox payment, Vercel Pro deployment.
- Privacy policy, refund policy and a GDPR account-deletion flow are **not yet implemented**.
- Trademark (USPTO / EUIPO), domain and app-store name checks before launch.
