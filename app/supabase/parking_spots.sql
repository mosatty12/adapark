-- Run this in Supabase → SQL Editor AFTER profiles.sql.
-- Keeps parking spot occupancy in sync between admin and driver sessions.

create table if not exists public.spot_status (
  parking_id text not null,
  spot_id text not null,
  status text not null check (status in ('empty', 'filled', 'booked', 'mine', 'blocked')),
  updated_at timestamptz not null default now(),
  primary key (parking_id, spot_id)
);

alter table public.spot_status enable row level security;

-- Anyone can read spot availability (drivers + admins).
drop policy if exists "Anyone read spot_status" on public.spot_status;
drop policy if exists "Authenticated read spot_status" on public.spot_status;
create policy "Anyone read spot_status"
  on public.spot_status for select
  using (true);

-- Logged-in users (admin or driver) can insert/update when booking or managing the lot.
drop policy if exists "Authenticated upsert spot_status" on public.spot_status;
create policy "Authenticated upsert spot_status"
  on public.spot_status for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update spot_status" on public.spot_status;
create policy "Authenticated update spot_status"
  on public.spot_status for update
  to authenticated
  using (true);

create index if not exists spot_status_parking_idx on public.spot_status(parking_id);

-- Live sync: Supabase → Database → Publications → supabase_realtime → enable spot_status
-- Or run once (ignore error if already added):
-- alter publication supabase_realtime add table public.spot_status;
