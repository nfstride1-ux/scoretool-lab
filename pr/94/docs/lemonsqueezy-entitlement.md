# ScoreTool entitlement (Lemon Squeezy)

This page is static GitHub Pages. There is no Lemon Squeezy account, store, product, or server. Until those exist, the app does not take payment and does not grant access from this phone.

`S.unlocked` in `localStorage` (`scoretool.v1` or `scoretool.v1.<tester>`) is only a leftover flag. The Unlock button that used to set it is gone. A phone that already has `unlocked: true` still opens the app, and that value is not deleted or rewritten by this change. It is not a receipt. Anyone with `unlocked` missing or false sees “Not open yet” and cannot turn the app on.

`SCORETOOL_ENTITLEMENT_URL` in `app.js` is empty. `entitlementVerify()` then returns `{ok:false, reason:'no-server'}` and writes nothing. A later `valid: true` reply is not applied to `S.unlocked`. Filling the URL in without the server below would still not be a payment check, because a static page can ignore the answer.

Non-Nathe tester profiles still set `S.unlocked` the first time they have no profile (`app.js`, the tester line). That is a separate demo shortcut, not a purchase. Turn it off when the server check below is the only way in.

## What has to exist first

1. A Lemon Squeezy account, one store, and one ScoreTool product (license key, or a subscription if access should lapse). Note `store_id`, `product_id`, and `variant_id` from the dashboard. Do not put those checks only in the public JavaScript: the page can be edited.
2. A serverless function the Pages site can call. A Cloudflare Worker fits a static site. A Supabase Edge Function or a Netlify function is the same shape. GitHub Pages cannot keep a secret or receive a webhook.
3. Secrets only on that function:
   - `LEMONSQUEEZY_WEBHOOK_SECRET` — the signing secret from Lemon Squeezy → Settings → Webhooks (6 to 40 characters).
   - `ENTITLEMENT_SIGNING_KEY` — private key (ECDSA P-256 or Ed25519). The matching public key can live in the app. The private key cannot.
   - `SCORETOOL_STORE_ID`, `SCORETOOL_PRODUCT_ID`, and `SCORETOOL_VARIANT_ID` once the product exists.
   - The License API itself does not use the store API key. Activate and validate are `POST` form bodies to `https://api.lemonsqueezy.com/v1/licenses/…` with `Accept: application/json`. The store API key is only needed if the function also reads orders or subscriptions from `https://api.lemonsqueezy.com/v1/`.

## Endpoints

All three are on the function, not on `github.io`.

### `POST /entitlement/activate`

Body JSON: `{ "license_key": "…", "instance_name": "this phone" }`.

The function calls Lemon Squeezy:

`POST https://api.lemonsqueezy.com/v1/licenses/activate`

Form fields: `license_key`, `instance_name` (required).

Accept only when `activated` is true, `license_key.status` is `active` or `inactive` (a new key is `inactive` until the first activation, and `valid` is still true), and `meta.store_id`, `meta.product_id`, and `meta.variant_id` match the ScoreTool product. `expired` and `disabled` do not unlock.

Save `instance.id` from that response. It is not returned again. Store it next to the license key id in the function’s own storage (Workers KV, D1, or a Supabase table).

Reply `{ "valid": true, "server": true, "token": "<signed>", "exp": <unix> }`. `server: true` is required so a hand-written JSON file cannot satisfy `entitlementVerify`. The token is signed with `ENTITLEMENT_SIGNING_KEY` and carries `exp`, `license_key_id`, and `instance_id`. Do not send the license key back to be stored as the entitlement.

### `POST /entitlement/validate`

Body JSON: `{ "token": "<signed>" }` or `{ "license_key": "…", "instance_id": "…" }`.

Verify the token signature first. If it is inside its expiry, the function may return a refreshed token without calling Lemon every time. Otherwise call:

`POST https://api.lemonsqueezy.com/v1/licenses/validate`

Form fields: `license_key`, and `instance_id` when we have one.

Same product-id check. `valid` must be true. Reply with a new signed token, or `{ "valid": false, "server": true }`.

### `POST /webhooks/lemonsqueezy`

Lemon Squeezy sends `Content-Type: application/json`, `X-Event-Name`, and `X-Signature`. The signature is HMAC-SHA256 of the raw body, hex, using the signing secret. Compare with a constant-time check. Reject anything else with a non-200 so Lemon retries (it retries three times: about 5s, 25s, 125s). Return 200 only after the signature matches and the row is saved.

Subscribe to:

- `license_key_created`
- `license_key_updated`
- `order_created`
- `order_refunded`
- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `subscription_expired`
- `subscription_payment_failed`
- `subscription_payment_recovered`

A license product needs the license and order events. A subscription needs the subscription events as well. On refund, cancel, expire, or disable, mark that license invalid in the function’s storage so the next validate fails even if the cached token has not expired yet. Prefer a short token life (seven days) so a cancelled key stops working within a week if the phone is offline.

## What the phone stores

A new key, `scoretool.entitlement`, holds only the signed token and `exp`. It is not `S.unlocked`.

On launch, if `SCORETOOL_ENTITLEMENT_URL` is set, the app sends the token to `/entitlement/validate`. Access follows that answer, not a local boolean.

Offline: the public key in the app can check the signature and `exp` with no network. Inside `exp`, the app stays open. Past `exp`, or with no token, it does not grant access. Sessions, rounds, and registrations already on the phone stay put either way.

Online again: validate, and replace the token when the server says so.

## What not to do

Do not call Lemon’s License API from the page and trust the JSON. Anyone can answer that request locally. Do not add another `localStorage` flag that means “paid”. Do not put the webhook secret or the signing private key in this repository.
