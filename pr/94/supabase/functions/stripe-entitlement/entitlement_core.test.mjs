import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  PRICES, lookupPrice, applyEvent, resolveEvent, accessOf, publicEntitlement,
  safeReturnUrl, stripeSign, stripeSignatureOk
} from './entitlement_core.mjs';

const PLUS = {
  id: 'sub_plus', status: 'active', customer: 'cus_ada',
  current_period_end: 2_000_000_000,
  items: {data: [{price: {id: PRICES.scoretool_plus_month.id}}]}
};
const PRO = {
  id: 'sub_pro', status: 'active', customer: 'cus_ada',
  current_period_end: 2_050_000_000,
  items: {data: [{price: {id: PRICES.scoretool_pro_year.id}, current_period_end: 2_050_000_000}]}
};

test('lookup keys are the four live AUD prices', () => {
  assert.equal(lookupPrice('scoretool_plus_month').id, 'price_1Ucc9647VzymlfXogT6DXroB');
  assert.equal(lookupPrice('scoretool_plus_year').amount, 4900);
  assert.equal(lookupPrice('scoretool_pro_month').tier, 'pro');
  assert.equal(lookupPrice('price_1Ucc9C47VzymlfXovGOZeIf1').lookup_key, 'scoretool_pro_year');
  assert.equal(lookupPrice('price_other'), null);
});

test('checkout.session.completed records Plus from the expanded subscription', () => {
  const event = {type: 'checkout.session.completed', data: {object: {
    mode: 'subscription', customer: 'cus_ada', customer_email: 'Ada@Example.com', subscription: PLUS
  }}};
  const step = applyEvent(null, event);
  assert.equal(step.action, 'upsert');
  assert.equal(step.row.email, 'ada@example.com');
  assert.equal(step.row.tier, 'plus');
  assert.equal(step.row.status, 'active');
  assert.equal(step.row.customer_id, 'cus_ada');
  assert.equal(step.row.price_id, PRICES.scoretool_plus_month.id);
  assert.equal(accessOf(step.row, 1_900_000_000_000).ok, true);
});

test('checkout.session.completed with a subscription id asks for a Stripe fetch', async () => {
  const event = {type: 'checkout.session.completed', data: {object: {
    mode: 'subscription', customer: 'cus_ada', customer_details: {email: 'ada@example.com'}, subscription: 'sub_plus'
  }}};
  const step = await resolveEvent(event, null, {fetchSubscription: async id => ({...PLUS, id})});
  assert.equal(step.action, 'upsert');
  assert.equal(step.row.tier, 'plus');
  assert.equal(step.row.subscription_id, 'sub_plus');
});

test('subscription.updated moves the same customer to Pro', () => {
  const prev = applyEvent(null, {type: 'checkout.session.completed', data: {object: {
    mode: 'subscription', customer_email: 'ada@example.com', subscription: PLUS
  }}}).row;
  const step = applyEvent(prev, {type: 'customer.subscription.updated', data: {object: {...PRO, customer: {id: 'cus_ada', email: 'ada@example.com'}}}});
  assert.equal(step.row.tier, 'pro');
  assert.equal(step.row.price_id, PRICES.scoretool_pro_year.id);
  assert.equal(accessOf(step.row, Date.parse(prev.current_period_end) + 1000).tier, 'pro');
});

test('subscription.updated without an email loads the customer', async () => {
  const event = {type: 'customer.subscription.updated', data: {object: {...PRO, customer: 'cus_ada'}}};
  const step = await resolveEvent(event, null, {fetchCustomerEmail: async () => 'ada@example.com'});
  assert.equal(step.action, 'upsert');
  assert.equal(step.row.email, 'ada@example.com');
  assert.equal(step.row.tier, 'pro');
});

test('subscription.deleted ends access at ended_at', () => {
  const prev = {email: 'ada@example.com', customer_id: 'cus_ada', subscription_id: 'sub_pro', tier: 'pro', status: 'active', price_id: PRICES.scoretool_pro_year.id, current_period_end: '2035-01-01T00:00:00.000Z'};
  const ended = 1_800_000_000;
  const step = applyEvent(prev, {type: 'customer.subscription.deleted', data: {object: {
    ...PRO, id: 'sub_pro', status: 'canceled', ended_at: ended, customer: 'cus_ada'
  }}});
  assert.equal(step.row.status, 'canceled');
  assert.equal(accessOf(step.row, (ended - 10) * 1000).ok, false);
  assert.equal(accessOf(step.row, (ended + 10) * 1000).reason, 'inactive');
});

test('deleting a different subscription does not clear the current plan', () => {
  const prev = {email: 'ada@example.com', subscription_id: 'sub_pro', tier: 'pro', status: 'active', price_id: PRICES.scoretool_pro_year.id, current_period_end: '2035-01-01T00:00:00.000Z'};
  const step = applyEvent(prev, {type: 'customer.subscription.deleted', data: {object: {...PLUS, id: 'sub_old', status: 'canceled', ended_at: 1_700_000_000}}});
  assert.equal(step.action, 'ignore');
  assert.equal(step.reason, 'other-subscription');
  assert.equal(step.row.tier, 'pro');
});

test('an unknown price is ignored and the stored plan stays', () => {
  const prev = {email: 'ada@example.com', subscription_id: 'sub_plus', tier: 'plus', status: 'active', price_id: PRICES.scoretool_plus_month.id, current_period_end: '2033-05-18T03:33:20.000Z'};
  const step = applyEvent(prev, {type: 'customer.subscription.updated', data: {object: {
    id: 'sub_plus', status: 'active', customer: {id: 'cus_ada', email: 'ada@example.com'},
    current_period_end: 2_000_000_000, items: {data: [{price: {id: 'price_not_scoretool'}}]}
  }}});
  assert.equal(step.action, 'ignore');
  assert.equal(step.row.tier, 'plus');
});

test('a refund event does not change entitlement', () => {
  const prev = {email: 'ada@example.com', tier: 'plus', status: 'active', current_period_end: '2033-05-18T03:33:20.000Z'};
  for (const type of ['charge.refunded', 'refund.created']) {
    const step = applyEvent(prev, {type, data: {object: {id: 'ch_1', amount_refunded: 499}}});
    assert.equal(step.action, 'ignore');
    assert.equal(step.reason, 'no-automatic-refund');
    assert.equal(step.row, prev);
  }
});

test('access follows status and the period end', () => {
  const now = Date.parse('2026-11-17T00:00:00Z');
  const future = '2027-01-01T00:00:00.000Z';
  const past = '2026-01-01T00:00:00.000Z';
  assert.equal(accessOf({tier: 'plus', status: 'trialing', current_period_end: future}, now).ok, true);
  assert.equal(accessOf({tier: 'pro', status: 'active', current_period_end: past}, now).reason, 'period-ended');
  assert.equal(accessOf({tier: 'plus', status: 'past_due', current_period_end: future}, now).ok, true);
  assert.equal(accessOf({tier: 'plus', status: 'past_due', current_period_end: past}, now).ok, false);
  assert.equal(accessOf({tier: 'pro', status: 'incomplete', current_period_end: future}, now).ok, false);
  assert.equal(accessOf({tier: 'plus', status: 'canceled', current_period_end: future}, now).ok, false);
  assert.deepEqual(publicEntitlement(null, now), {valid: false, server: true, tier: null, status: null, current_period_end: null});
  const pub = publicEntitlement({tier: 'pro', status: 'active', current_period_end: future, customer_id: 'cus_ada'}, now);
  assert.equal(pub.valid, true);
  assert.equal(pub.server, true);
  assert.equal(pub.tier, 'pro');
  assert.equal(pub.customer_id, 'cus_ada');
});

test('return URLs stay on this site or localhost', () => {
  assert.match(safeReturnUrl('https://nfstride1-ux.github.io/scoretool-demo/?tester=nathe', 'success'), /checkout=success/);
  assert.match(safeReturnUrl('http://127.0.0.1:8765/', 'cancel'), /checkout=cancel/);
  assert.equal(safeReturnUrl('https://evil.example/scoretool-demo/', 'success'), null);
  assert.equal(safeReturnUrl('https://nfstride1-ux.github.io/other/', 'success'), null);
  assert.equal(safeReturnUrl('javascript:alert(1)', 'success'), null);
});

test('Stripe signature accepts the raw body and rejects tampering', async () => {
  const secret = 'whsec_test_placeholder';
  const raw = JSON.stringify({id: 'evt_1', type: 'customer.subscription.updated'});
  const t = 1_700_000_000;
  const v1 = await stripeSign(raw, secret, t);
  assert.equal(await stripeSignatureOk(raw, `t=${t},v1=${v1}`, secret, t), true);
  assert.equal(await stripeSignatureOk(raw, `t=${t},v1=${v1}`, 'whsec_other', t), false);
  assert.equal(await stripeSignatureOk(raw + ' ', `t=${t},v1=${v1}`, secret, t), false);
  assert.equal(await stripeSignatureOk(raw, `t=${t - 301},v1=${v1}`, secret, t), false);
  assert.equal(await stripeSignatureOk(raw, '', secret, t), false);
});

test('the phone lists the same lookup keys and AUD amounts', () => {
  const src = fs.readFileSync(new URL('../../../plans.js', import.meta.url), 'utf8');
  for (const key of Object.keys(PRICES)) assert.match(src, new RegExp(key));
  assert.match(src, /A\$4\.99/);
  assert.match(src, /A\$49/);
  assert.match(src, /A\$7\.99/);
  assert.match(src, /A\$79/);
});
