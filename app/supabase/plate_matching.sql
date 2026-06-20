-- Run this in Supabase → SQL Editor AFTER profiles.sql and data_tables.sql.
-- Stores evidence for detected plates that are NOT registered to any user.

create table if not exists public.flagged_detections (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text unique,            -- source row id from the `vehicles` detection feed
  plate_number text not null,
  detected_time text,
  latitude text,
  longitude text,
  image_url text,                    -- evidence snapshot uploaded by the detection code
  status text not null default 'unregistered',
  created_at timestamptz not null default now()
);

-- Add the evidence image column to the detection feed table (safe if it already exists).
alter table public.vehicles add column if not exists image_url text;

alter table public.flagged_detections enable row level security;

-- Admins can read and save flagged detections.
drop policy if exists "Admins read flagged detections" on public.flagged_detections;
create policy "Admins read flagged detections"
  on public.flagged_detections for select
  using (public.is_admin());

drop policy if exists "Admins insert flagged detections" on public.flagged_detections;
create policy "Admins insert flagged detections"
  on public.flagged_detections for insert
  with check (public.is_admin());

drop policy if exists "Admins update flagged detections" on public.flagged_detections;
create policy "Admins update flagged detections"
  on public.flagged_detections for update
  using (public.is_admin());

create index if not exists flagged_detections_plate_idx on public.flagged_detections(plate_number);

-- Admin dashboard reads the detection feed (Colab inserts via service_role).
alter table public.vehicles enable row level security;

drop policy if exists "Admins read vehicles" on public.vehicles;
create policy "Admins read vehicles"
  on public.vehicles for select
  using (public.is_admin());

-- Evidence bucket: must be PUBLIC for browser thumbnails (Storage → evidence → Public).
-- Colab uploads need the service_role key (anon cannot write with 0 policies).
-- Public URL pattern:
--   https://<project-ref>.supabase.co/storage/v1/object/public/evidence/<filename>.jpg

-- NOTE: plate numbers are captured on the profiles table (profiles.plate) at sign-up.
