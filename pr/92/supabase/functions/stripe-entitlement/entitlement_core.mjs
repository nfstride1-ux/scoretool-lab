/* ScoreTool Stripe entitlement rules. No network and no secrets.
   Used by the Edge Function and by node --test. Prices are the live AUD prices created 17 Nov 2026. */

export const PRICES = {
  scoretool_plus_month: {id: 'price_1Ucc9647VzymlfXogT6DXroB', tier: 'plus', interval: 'month', amount: 499, currency: 'aud', product: 'prod_VdtwwWYJwFWqDc'},
  scoretool_plus_year: {id: 'price_1Ucc9847VzymlfXoq1xyPpvY', tier: 'plus', interval: 'year', amount: 4900, currency: 'aud', product: 'prod_VdtwwWYJwFWqDc'},
  scoretool_pro_month: {id: 'price_1Ucc9A47VzymlfXoTYdq52id', tier: 'pro', interval: 'month', amount: 799, currency: 'aud', product: 'prod_VdtwoVkHeZR0SU'},
  scoretool_pro_year: {id: 'price_1Ucc9C47VzymlfXovGOZeIf1', tier: 'pro', interval: 'year', amount: 7900, currency: 'aud', product: 'prod_VdtwoVkHeZR0SU'}
};
const RANK = {plus: 1, pro: 2};
const OPEN = new Set(['active', 'trialing']);
const UNTIL_END = new Set(['past_due', 'unpaid']);
const TOLERANCE = 300;

export function lookupPrice(keyOrId) {
  const k = String(keyOrId || '');
  if (PRICES[k]) return {lookup_key: k, ...PRICES[k]};
  for (const [name, v] of Object.entries(PRICES)) if (v.id === k) return {lookup_key: name, ...v};
  return null;
}

export function normalEmail(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,120}\.[a-z]{2,24}$/.test(s)) return '';
  return s;
}

export function emailOf(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const cust = obj.customer && typeof obj.customer === 'object' ? obj.customer : null;
  return normalEmail(obj.customer_email || (obj.customer_details && obj.customer_details.email) || obj.email || (cust && cust.email));
}

export function customerIdOf(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj.customer === 'string') return obj.customer;
  if (obj.customer && typeof obj.customer.id === 'string') return obj.customer.id;
  return null;
}

function priceIdOfItem(item) {
  if (!item || typeof item !== 'object') return '';
  if (typeof item.price === 'string') return item.price;
  if (item.price && typeof item.price.id === 'string') return item.price.id;
  if (item.plan && typeof item.plan.id === 'string') return item.plan.id;
  return '';
}

export function priceIdsOf(sub) {
  const items = sub && sub.items && Array.isArray(sub.items.data) ? sub.items.data : [];
  return items.map(priceIdOfItem).filter(Boolean);
}

/* Classic subscriptions put current_period_end on the subscription. Newer API versions put it on each item.
   A canceled subscription uses ended_at so an immediate cancel does not keep access until the old period end. */
export function periodEndUnix(sub) {
  if (!sub || typeof sub !== 'object') return null;
  if (sub.status === 'canceled' && Number.isFinite(Number(sub.ended_at))) return Number(sub.ended_at);
  if (Number.isFinite(Number(sub.current_period_end))) return Number(sub.current_period_end);
  const items = sub.items && Array.isArray(sub.items.data) ? sub.items.data : [];
  const ends = items.map(i => Number(i && i.current_period_end)).filter(n => Number.isFinite(n));
  return ends.length ? Math.max(...ends) : null;
}

export function tierFromPrices(ids) {
  let best = null;
  for (const id of ids || []) {
    const p = lookupPrice(id);
    if (!p) continue;
    if (!best || RANK[p.tier] > RANK[best.tier]) best = p;
  }
  return best;
}

export function rowFromSubscription(sub, email) {
  if (!sub || typeof sub !== 'object') return {error: 'no-subscription'};
  const plan = tierFromPrices(priceIdsOf(sub));
  if (!plan) return {error: 'unknown-price'};
  const em = normalEmail(email) || emailOf(sub);
  if (!em) return {error: 'no-email'};
  const end = periodEndUnix(sub);
  return {row: {
    email: em,
    customer_id: customerIdOf(sub),
    subscription_id: typeof sub.id === 'string' ? sub.id : null,
    tier: plan.tier,
    status: String(sub.status || ''),
    price_id: plan.id,
    current_period_end: end ? new Date(end * 1000).toISOString() : null
  }};
}

export function eventEmail(event) {
  const obj = event && event.data && event.data.object || {};
  return emailOf(obj) || (obj.subscription && typeof obj.subscription === 'object' ? emailOf(obj.subscription) : '');
}

/* Apply one Stripe event to the stored row. Refunds are ignored: a person refunds in the Dashboard and cancels there. */
export function applyEvent(prev, event) {
  const type = event && event.type;
  const obj = event && event.data && event.data.object || {};
  if (type === 'charge.refunded' || type === 'charge.refund.updated' || type === 'refund.created' || type === 'refund.updated')
    return {action: 'ignore', reason: 'no-automatic-refund', row: prev || null};
  if (type === 'checkout.session.completed') {
    if (obj.mode && obj.mode !== 'subscription') return {action: 'ignore', reason: 'not-subscription', row: prev || null};
    const email = emailOf(obj);
    const customer_id = customerIdOf(obj);
    if (obj.subscription && typeof obj.subscription === 'object') {
      const built = rowFromSubscription(obj.subscription, email || emailOf(obj.subscription));
      if (built.error) return {action: 'ignore', reason: built.error, row: prev || null};
      if (!built.row.customer_id) built.row.customer_id = customer_id;
      return {action: 'upsert', row: built.row};
    }
    const subscription_id = typeof obj.subscription === 'string' ? obj.subscription : '';
    if (!subscription_id) return {action: 'ignore', reason: 'no-subscription', row: prev || null};
    return {action: 'fetch-subscription', subscription_id, email, customer_id, row: prev || null};
  }
  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    if (prev && prev.subscription_id && obj.id && prev.subscription_id !== obj.id && type === 'customer.subscription.deleted')
      return {action: 'ignore', reason: 'other-subscription', row: prev};
    const email = emailOf(obj) || (prev && prev.subscription_id === obj.id ? prev.email : '');
    const built = rowFromSubscription(obj, email);
    if (built.error === 'no-email') return {action: 'needs-email', customer_id: customerIdOf(obj), row: prev || null};
    if (built.error) return {action: 'ignore', reason: built.error, row: prev || null};
    if (type === 'customer.subscription.deleted') {
      built.row.status = 'canceled';
      const ended = Number(obj.ended_at);
      built.row.current_period_end = Number.isFinite(ended) ? new Date(ended * 1000).toISOString() : new Date().toISOString();
    }
    return {action: 'upsert', row: built.row};
  }
  return {action: 'ignore', reason: 'unhandled', row: prev || null};
}

export async function resolveEvent(event, prev, deps) {
  const step = applyEvent(prev, event);
  if (step.action === 'fetch-subscription') {
    const sub = await deps.fetchSubscription(step.subscription_id);
    let email = step.email || emailOf(sub);
    if (!email && deps.fetchCustomerEmail) email = normalEmail(await deps.fetchCustomerEmail(customerIdOf(sub) || step.customer_id));
    const built = rowFromSubscription(sub, email);
    if (built.error) return {action: 'ignore', reason: built.error, row: prev || null};
    if (!built.row.customer_id && step.customer_id) built.row.customer_id = step.customer_id;
    return {action: 'upsert', row: built.row};
  }
  if (step.action === 'needs-email') {
    const email = await deps.fetchCustomerEmail(step.customer_id);
    const sub = event.data.object;
    const built = rowFromSubscription(sub, email);
    if (built.error) return {action: 'ignore', reason: built.error, row: prev || null};
    if (event.type === 'customer.subscription.deleted') {
      built.row.status = 'canceled';
      const ended = Number(sub.ended_at);
      built.row.current_period_end = Number.isFinite(ended) ? new Date(ended * 1000).toISOString() : new Date().toISOString();
    }
    return {action: 'upsert', row: built.row};
  }
  return step;
}

export function accessOf(row, nowMs) {
  if (!row || (row.tier !== 'plus' && row.tier !== 'pro')) return {ok: false, reason: 'none'};
  const end = row.current_period_end ? Date.parse(row.current_period_end) : NaN;
  const live = !Number.isFinite(end) || end > nowMs;
  if (OPEN.has(row.status)) return live ? {ok: true, tier: row.tier} : {ok: false, reason: 'period-ended'};
  if (UNTIL_END.has(row.status) && Number.isFinite(end) && end > nowMs) return {ok: true, tier: row.tier};
  return {ok: false, reason: 'inactive'};
}

export function publicEntitlement(row, nowMs) {
  const a = accessOf(row, nowMs || Date.now());
  const base = {
    server: true,
    tier: row && (row.tier === 'plus' || row.tier === 'pro') ? row.tier : null,
    status: row && row.status || null,
    current_period_end: row && row.current_period_end || null
  };
  if (!a.ok) return {valid: false, ...base};
  return {valid: true, ...base, customer_id: row.customer_id || null};
}

export function safeReturnUrl(url, kind) {
  let u;
  try { u = new URL(String(url || '')); } catch { return null; }
  const pages = u.protocol === 'https:' && u.hostname === 'nfstride1-ux.github.io' && u.pathname.startsWith('/scoretool-demo');
  const local = u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1');
  if (!pages && !local) return null;
  if (u.username || u.password) return null;
  if (kind === 'success') u.searchParams.set('checkout', 'success');
  if (kind === 'cancel') u.searchParams.set('checkout', 'cancel');
  return u.toString();
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function stripeSign(rawBody, secret, t) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(t) + '.' + rawBody));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function stripeSignatureOk(rawBody, header, secret, nowSec = Math.floor(Date.now() / 1000)) {
  if (!rawBody && rawBody !== '') return false;
  if (!header || !secret) return false;
  const bits = String(header).split(',').map(s => s.trim());
  const t = (bits.find(s => s.startsWith('t=')) || '').slice(2);
  const v1s = bits.filter(s => s.startsWith('v1=')).map(s => s.slice(3));
  if (!/^\d+$/.test(t) || !v1s.length) return false;
  if (Math.abs(nowSec - Number(t)) > TOLERANCE) return false;
  const hex = await stripeSign(String(rawBody), secret, t);
  return v1s.some(v => timingSafeEqual(v, hex));
}
