/* ScoreTool Stripe entitlement. Deploy on the Archery Calendar Supabase project.
   URL: https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement
   Secrets (names only, set in the Supabase dashboard or CLI, never in this repo):
     STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
   SUPABASE_URL is injected by Supabase. See docs/stripe-entitlement.md.
   Deploy: supabase functions deploy stripe-entitlement --no-verify-jwt --project-ref sllsqpfqwckwtljzjxli */

import {
  resolveEvent, lookupPrice, safeReturnUrl, publicEntitlement, normalEmail, stripeSignatureOk, eventEmail, customerIdOf
} from "./entitlement_core.mjs";

const SB = (Deno.env.get("SUPABASE_URL") || "https://sllsqpfqwckwtljzjxli.supabase.co").replace(/\/$/, "");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const STRIPE = Deno.env.get("STRIPE_SECRET_KEY") || "";
const WHSEC = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const MAX_BODY = 65536;

const H: Record<string, string> = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, stripe-signature",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
const out = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers: H});

function routeOf(req: Request) {
  const path = new URL(req.url).pathname;
  const mark = "/stripe-entitlement";
  const i = path.indexOf(mark);
  const rest = (i >= 0 ? path.slice(i + mark.length) : path).replace(/\/+$/, "");
  return rest || "/";
}

async function stripeForm(path: string, fields: Record<string, string>) {
  const r = await fetch("https://api.stripe.com" + path, {
    method: "POST",
    headers: {"Authorization": "Bearer " + STRIPE, "Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams(fields)
  });
  const text = await r.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(text); } catch { /* Stripe error bodies are still JSON; keep empty on a cut-off body */ }
  return {ok: r.ok, status: r.status, json};
}

async function stripeGet(path: string) {
  const r = await fetch("https://api.stripe.com" + path, {headers: {"Authorization": "Bearer " + STRIPE}});
  if (!r.ok) throw new Error("stripe " + r.status);
  return await r.json();
}

async function authEmail(req: Request) {
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token || token.length < 20 || !SERVICE) return "";
  const r = await fetch(SB + "/auth/v1/user", {headers: {apikey: SERVICE, Authorization: "Bearer " + token}});
  if (!r.ok) return "";
  const user = await r.json();
  return normalEmail(user && user.email);
}

async function readRow(email: string) {
  const r = await fetch(SB + "/rest/v1/scoretool_entitlements?email=eq." + encodeURIComponent(email) + "&select=*", {
    headers: {apikey: SERVICE, Authorization: "Bearer " + SERVICE}
  });
  if (!r.ok) throw new Error("entitlement read failed");
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function writeRow(row: Record<string, unknown>) {
  const r = await fetch(SB + "/rest/v1/scoretool_entitlements?on_conflict=email", {
    method: "POST",
    headers: {
      apikey: SERVICE,
      Authorization: "Bearer " + SERVICE,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({...row, updated_at: new Date().toISOString()})
  });
  if (!r.ok) throw new Error("entitlement write failed " + r.status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {status: 204, headers: H});
  const route = routeOf(req);
  try {
    if (req.method === "GET" && (route === "/" || route === "/health"))
      return out(200, {ok: true, service: "scoretool-entitlement"});
    if (req.method !== "POST") return out(405, {ok: false, error: "use POST"});

    if (route === "/webhook") {
      if (!WHSEC || !STRIPE || !SERVICE) return out(500, {ok: false, error: "server not configured"});
      const raw = await req.text();
      if (raw.length > MAX_BODY) return out(413, {ok: false, error: "body too large"});
      const ok = await stripeSignatureOk(raw, req.headers.get("stripe-signature"), WHSEC);
      if (!ok) return out(400, {ok: false, error: "bad signature"});
      let event: {type?: string; data?: {object?: {customer?: unknown; subscription?: unknown}}};
      try { event = JSON.parse(raw); } catch { return out(400, {ok: false, error: "not json"}); }
      const fetchCustomerEmail = async (id: string) => {
        const c = await stripeGet("/v1/customers/" + encodeURIComponent(id || ""));
        return String(c && c.email || "");
      };
      let email = eventEmail(event);
      if (!email) {
        const obj = event.data && event.data.object || {};
        const cid = customerIdOf(obj) || customerIdOf(obj.subscription);
        if (cid) email = normalEmail(await fetchCustomerEmail(String(cid)));
      }
      const prev = email ? await readRow(email) : null;
      const step = await resolveEvent(event, prev, {
        fetchSubscription: (id: string) => stripeGet("/v1/subscriptions/" + encodeURIComponent(id)),
        fetchCustomerEmail
      });
      if (step.action === "upsert" && step.row) await writeRow(step.row as Record<string, unknown>);
      console.log(JSON.stringify({t: new Date().toISOString(), type: event.type || "", action: step.action}));
      return out(200, {ok: true, received: true});
    }

    if (!STRIPE || !SERVICE) return out(500, {ok: false, error: "server not configured"});

    const len = Number(req.headers.get("content-length") || 0);
    if (len > 8192) return out(413, {ok: false, error: "body too large"});
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { return out(400, {ok: false, error: "not json"}); }

    if (route === "/checkout") {
      const plan = lookupPrice(body.lookup_key);
      if (!plan) return out(400, {ok: false, error: "unknown plan"});
      const success = safeReturnUrl(body.success_url, "success");
      const cancel = safeReturnUrl(body.cancel_url, "cancel");
      if (!success || !cancel) return out(400, {ok: false, error: "return url is not this app"});
      const fields: Record<string, string> = {
        mode: "subscription",
        "line_items[0][price]": plan.id,
        "line_items[0][quantity]": "1",
        success_url: success,
        cancel_url: cancel,
        client_reference_id: "scoretool",
        "metadata[lookup_key]": plan.lookup_key
      };
      const email = normalEmail(body.email);
      if (email) fields.customer_email = email;
      const session = await stripeForm("/v1/checkout/sessions", fields);
      if (!session.ok || typeof session.json.url !== "string") return out(502, {ok: false, error: "checkout was not created"});
      return out(200, {ok: true, url: session.json.url});
    }

    if (route === "/entitlement" || route === "/portal") {
      const email = await authEmail(req);
      if (!email) return out(401, {ok: false, error: "sign in again"});
      const row = await readRow(email);
      if (route === "/entitlement") return out(200, publicEntitlement(row, Date.now()));
      if (!row || !row.customer_id) return out(404, {ok: false, error: "no subscription to manage"});
      const back = safeReturnUrl(body.return_url, "");
      if (!back) return out(400, {ok: false, error: "return url is not this app"});
      const portal = await stripeForm("/v1/billing_portal/sessions", {customer: String(row.customer_id), return_url: back});
      if (!portal.ok || typeof portal.json.url !== "string") return out(502, {ok: false, error: "portal was not created"});
      return out(200, {ok: true, url: portal.json.url});
    }

    return out(404, {ok: false, error: "not found"});
  } catch (e) {
    console.error(e instanceof Error ? e.message : "server error");
    return out(500, {ok: false, error: "server error"});
  }
});
