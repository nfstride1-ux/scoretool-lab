-- ScoreTool coaching tables. Additive only. Do not apply until Nathe says go live.
-- Preview and tests use localStorage; this file is the go-live schema with RLS.
-- Project: sllsqpfqwckwtljzjxli. Does not touch scoretool_entitlements or Lingkana data.

create table if not exists public.scoretool_share_links (
  token text primary key,
  archer_id uuid,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
alter table public.scoretool_share_links enable row level security;
-- Anyone with the token can read that one row (one-off share, no account).
create policy scoretool_share_links_read_token on public.scoretool_share_links
  for select using (true);
create policy scoretool_share_links_insert_own on public.scoretool_share_links
  for insert to authenticated with check (archer_id = auth.uid());
create policy scoretool_share_links_delete_own on public.scoretool_share_links
  for delete to authenticated using (archer_id = auth.uid());

create table if not exists public.scoretool_coach_links (
  code text primary key,
  archer_id uuid not null,
  archer_name text,
  coach_id uuid,
  coach_name text,
  coach_email text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  removed_at timestamptz
);
alter table public.scoretool_coach_links enable row level security;
create policy scoretool_coach_links_archer_all on public.scoretool_coach_links
  for all to authenticated using (archer_id = auth.uid()) with check (archer_id = auth.uid());
create policy scoretool_coach_links_coach_read on public.scoretool_coach_links
  for select to authenticated using (coach_id = auth.uid() or (status = 'pending' and coach_id is null));
create policy scoretool_coach_links_coach_claim on public.scoretool_coach_links
  for update to authenticated using (status = 'pending' or coach_id = auth.uid())
  with check (coach_id = auth.uid() or status = 'removed');

create table if not exists public.scoretool_coach_feed (
  archer_id uuid primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.scoretool_coach_feed enable row level security;
create policy scoretool_coach_feed_own on public.scoretool_coach_feed
  for all to authenticated using (archer_id = auth.uid()) with check (archer_id = auth.uid());
create policy scoretool_coach_feed_coach_read on public.scoretool_coach_feed
  for select to authenticated using (
    exists (
      select 1 from public.scoretool_coach_links l
      where l.archer_id = scoretool_coach_feed.archer_id
        and l.coach_id = auth.uid()
        and l.status = 'active'
    )
  );

create table if not exists public.scoretool_coach_notes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null,
  archer_id uuid not null,
  kind text not null,
  target text not null,
  note_type text not null,
  body text not null,
  reply text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.scoretool_coach_notes enable row level security;
create policy scoretool_coach_notes_coach on public.scoretool_coach_notes
  for all to authenticated using (coach_id = auth.uid()) with check (coach_id = auth.uid());
create policy scoretool_coach_notes_archer_read on public.scoretool_coach_notes
  for select to authenticated using (archer_id = auth.uid());
create policy scoretool_coach_notes_archer_reply on public.scoretool_coach_notes
  for update to authenticated using (archer_id = auth.uid())
  with check (archer_id = auth.uid());

create table if not exists public.scoretool_coach_layouts (
  coach_id uuid primary key,
  layout jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.scoretool_coach_layouts enable row level security;
create policy scoretool_coach_layouts_own on public.scoretool_coach_layouts
  for all to authenticated using (coach_id = auth.uid()) with check (coach_id = auth.uid());
