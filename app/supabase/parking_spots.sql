-- Run this in Supabase → SQL Editor (grad_project) AFTER profiles.sql.
-- Keeps parking spot occupancy in sync between admin and driver sessions.
-- Re-run the FULL file if spot_status stays empty after admin changes.
-- App env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) MUST point to this project.

create table if not exists public.spot_status (
  parking_id text not null,
  spot_id text not null,
  status text not null check (status in ('empty', 'filled', 'booked', 'mine', 'blocked')),
  updated_at timestamptz not null default now(),
  primary key (parking_id, spot_id)
);

alter table public.spot_status enable row level security;

-- API roles must be allowed to touch the table (RLS still applies).
grant select on table public.spot_status to anon, authenticated;
grant insert, update, delete on table public.spot_status to authenticated;

drop policy if exists "Anyone read spot_status" on public.spot_status;
drop policy if exists "Authenticated read spot_status" on public.spot_status;
drop policy if exists "Authenticated upsert spot_status" on public.spot_status;
drop policy if exists "Authenticated update spot_status" on public.spot_status;
drop policy if exists "Authenticated manage spot_status" on public.spot_status;

-- Public read (map availability).
create policy "Anyone read spot_status"
  on public.spot_status for select
  using (true);

-- Any signed-in user (admin or driver) can write spot status.
create policy "Authenticated manage spot_status"
  on public.spot_status for all
  to authenticated
  using (true)
  with check (true);

create index if not exists spot_status_parking_idx on public.spot_status(parking_id);

-- Optional live sync: Database → Publications → supabase_realtime → enable spot_status
