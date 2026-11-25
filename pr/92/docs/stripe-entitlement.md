# ScoreTool entitlement (Stripe)

> 25 Nov 2026 status: the function, table, webhook (`we_1UcdcD47VzymlfXoBUfARAAA`) and portal config (`bpc_1UcdR947VzymlfXocxw9O9mT`) are deployed and live. A live A$0 end-to-end run passed (see HANDOFF.md). The Pages app calls the function from `plans.js`. Open items before taking money: the Checkout/portal business name (PropGuard), and Supabase email templates (the signup email carries only a link, no code).

ScoreTool is a static GitHub Pages site. It cannot hold `STRIPE_SECRET_KEY`. Checkout and the webhook run as a Supabase Edge Function on the Archery Calendar project that this app already uses for photos and score sync:

- Project ref: `sllsqpfqwckwtljzjxli`
- Function URL: `https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement`
- SQL and function source in this repo: `supabase/scoretool_entitlements.sql`, `supabase/functions/stripe-entitlement/`

`nfstride1-ux/archery-calendar` already has `supabase/functions/` (club-events, read-flyer) and the ScoreTool SQL files. There is no second backend. A Cloudflare Worker is not required.

Nothing in this repository is a live secret. The names to set on the function are `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_URL` is injected by Supabase (`https://sllsqpfqwckwtljzjxli.supabase.co`). Do not put those values in git, in the Pages site, or in a screenshot.

## Prices (live, AUD, created 17 Nov 2026)

| Plan | Product | Lookup key | Price id | Amount (GST inclusive since 25 Nov 2026) |
|---|---|---|---|---|
| Plus monthly | `prod_VdtwwWYJwFWqDc` | `scoretool_plus_month` | `price_1Ucc9647VzymlfXogT6DXroB` | A$4.99 |
| Plus yearly | `prod_VdtwwWYJwFWqDc` | `scoretool_plus_year` | `price_1Ucc9847VzymlfXoq1xyPpvY` | A$49 |
| Pro monthly | `prod_VdtwoVkHeZR0SU` | `scoretool_pro_month` | `price_1Ucc9A47VzymlfXoTYdq52id` | A$7.99 |
| Pro yearly | `prod_VdtwoVkHeZR0SU` | `scoretool_pro_year` | `price_1Ucc9C47VzymlfXovGOZeIf1` | A$79 |

The function accepts only these lookup keys. The phone never sends a secret and never chooses an arbitrary Stripe price.

## What the function does

`POST /checkout` creates a Stripe Checkout Session with `mode=subscription` for one of the four prices. `success_url` and `cancel_url` must be this GitHub Pages app or localhost.

`POST /webhook` checks `Stripe-Signature` (HMAC SHA256 of `t + "." + raw body`, five-minute window) with `STRIPE_WEBHOOK_SECRET`. It handles:

- `checkout.session.completed` (subscription mode only)
- `customer.subscription.updated`
- `customer.subscription.deleted`

It upserts `public.scoretool_entitlements` by email: `customer_id`, `subscription_id`, `tier` (`plus` or `pro`), `status`, `price_id`, `current_period_end`. Refund events are ignored. There is no automatic refund.

`POST /entitlement` reads the Supabase Auth user from the `Authorization: Bearer` access token and returns `{valid, server:true, tier, status, current_period_end, customer_id}` for that email only.

`POST /portal` creates a Stripe Customer Portal session for that customer's `customer_id`.

Row level security is on and there are no policies for anon or authenticated. Only the service role, used inside the function, can read or write the table.

Access is `active` or `trialing` until `current_period_end`. `past_due` and `unpaid` stay open until `current_period_end`. `canceled`, `incomplete`, and `incomplete_expired` do not open the app. Deleting a subscription sets `canceled` and `current_period_end` from `ended_at`, so an immediate cancel stops access. A delete event for a different subscription id does not clear the current row.

## What the phone does

`SCORETOOL_ENTITLEMENT_URL` in `app.js` is the function URL above. It is not a secret.

Free, with no sign-in and no payment:

- The score card: every round, plotting, and saving scores
- Basic stats: totals, averages, and past sessions
- League and Lingkana scoring

Plus (paid): analysis, diary, photos and group scoring.

Pro (paid): bows, arrows, and the Tune helper, as well as Plus.

Plans is an upgrade. It opens from a locked Plus or Pro screen (See plans) and from Me → Plans. The first screen is the score card, not a paywall.

`S.unlocked` is the app's "profile set up" flag and is not a plan. Founding profiles (made before testing ended) are Pro for life. Every profile already on a phone when the paid build first loads is listed in `scoretool.paid.early` and keeps full access. Profiles made after that are Free until a server-checked plan says otherwise.

A paid plan is cached in `scoretool.stripe.entitlement` after `POST /entitlement` returns `valid: true` and `server: true`, so a paid phone can reopen offline until `current_period_end`. The cache counts only while the phone is signed in, is re-checked on open (at most every 10 minutes), and is cleared on a 401. The cache is not `S.unlocked`. A static page can still be edited locally; the next online check overwrites the cache from the table.

Sign-in is Supabase Auth on the same project (the publishable key already in `photos.js` / `calsync.js`). The person enters the email they paid with, asks for a code, and types the code or opens the magic link. The function trusts the email on the Auth user, not an email typed into the entitlement request.

## Deploy steps

Do these in order. The function does nothing useful until they are done. This pull request does not deploy and does not merge.

1. Supabase Dashboard → project `sllsqpfqwckwtljzjxli` → SQL Editor. Paste and run `supabase/scoretool_entitlements.sql`.
2. Install the Supabase CLI and log in (`supabase login`). From this repository:

   ```sh
   supabase link --project-ref sllsqpfqwckwtljzjxli
   supabase secrets set \
     STRIPE_SECRET_KEY=sk_live_REPLACE \
     STRIPE_WEBHOOK_SECRET=whsec_REPLACE \
     SUPABASE_SERVICE_ROLE_KEY=REPLACE
   supabase functions deploy stripe-entitlement --no-verify-jwt --project-ref sllsqpfqwckwtljzjxli
   ```

   `STRIPE_WEBHOOK_SECRET` can be set after step 4 if Stripe has not shown it yet. Secrets are read at runtime. Do not commit the values. The service role key is Supabase → Project Settings → API.
3. Confirm `GET https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement/health` returns `{"ok":true,"service":"scoretool-entitlement"}`. Send header `apikey` with the publishable key if the gateway asks for one.
4. Stripe Dashboard → Developers → Webhooks → Add endpoint.

   - URL: `https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET` (step 2).

5. Stripe → Settings → Billing → Customer portal. Turn the portal on. Allow customers to update their payment method, cancel, and switch between the Plus and Pro prices listed above. Save.
6. Supabase → Authentication → Providers → Email. Email signups must be on, because the restore flow creates an Auth user for the payment email. Authentication → URL configuration:

   - Site URL: `https://nfstride1-ux.github.io/scoretool-demo/`
   - Redirect URLs: that same URL, plus any localhost origin you use for a check (for example `http://127.0.0.1:8765`).

7. Authentication → Email templates → Magic link. Keep the link `{{ .ConfirmationURL }}` and include the code `{{ .Token }}` so the phone can accept either.
8. Refunds: leave refunds manual. When a customer asks, refund the payment in the Stripe Dashboard and cancel that subscription (immediately if the refund should stop access now). Do not add a refund webhook. Cancel sends `customer.subscription.deleted`, which records `canceled`.

After the function is deployed, the Pages site can call it. Merging and deploying the site is a separate step. Do not merge this pull request from the agent.

## Sign-in for paid members (25 Nov 2026)

Google or Apple only (Supabase Auth OAuth). The emailed code / magic link is no longer offered in the app.

- Supabase > Authentication > URL configuration > Redirect URLs must include `https://nfstride1-ux.github.io/scoretool-demo/?plans=1` (or `https://nfstride1-ux.github.io/scoretool-demo/**`).
- Google Cloud OAuth client (Web application): Authorized redirect URI `https://sllsqpfqwckwtljzjxli.supabase.co/auth/v1/callback`; Authorized JavaScript origin `https://nfstride1-ux.github.io`.
- Apple: Services ID with Sign in with Apple, domain `sllsqpfqwckwtljzjxli.supabase.co`, Return URL `https://sllsqpfqwckwtljzjxli.supabase.co/auth/v1/callback`; Supabase needs the Services ID, Team ID, Key ID and the .p8 key (secret generated from them, renew every 6 months).
