-- ScoreTool Stripe entitlements on the Archery Calendar project (sllsqpfqwckwtljzjxli).
-- ADDITIVE ONLY. Safe to run more than once. Run in Supabase > SQL Editor, then deploy the edge function.
-- The browser cannot read this table. The edge function uses the service role, which bypasses RLS.

create table if not exists public.scoretool_entitlements (
  email text primary key check (char_length(email) between 3 and 160),
  customer_id text check (customer_id is null or char_length(customer_id) <= 80),
  subscription_id text check (subscription_id is null or char_length(subscription_id) <= 80),
  tier text not null check (tier in ('plus', 'pro')),
  status text not null check (char_length(status) between 1 and 40),
  price_id text check (price_id is null or char_length(price_id) <= 80),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.scoretool_entitlements enable row level security;
revoke all on public.scoretool_entitlements from public, anon, authenticated;
