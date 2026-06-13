-- Run this in Supabase → SQL Editor AFTER profiles.sql.
-- Persists bookings, penalties, and wallet transactions per user.

-- ============ Bookings ============
create table if not exists public.bookings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  parking_id text not null,
  spot_id text not null,
  hours numeric not null default 1,
  cost numeric not null default 0,
  payment_method text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ Penalties ============
create table if not exists public.penalties (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount numeric not null default 0,
  parking_id text,
  date date not null default current_date,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'disputed')),
  paid_via text,
  created_at timestamptz not null default now()
);

-- ============ Wallet transactions ============
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                -- topup | park | penalty | reward
  label text not null,
  delta numeric not null default 0,  -- positive = credit, negative = debit
  created_at timestamptz not null default now()
);

-- ============ Row Level Security ============
alter table public.bookings enable row level security;
alter table public.penalties enable row level security;
alter table public.transactions enable row level security;

-- Bookings: owner has full control, admins can read all
drop policy if exists "Owner manages own bookings" on public.bookings;
create policy "Owner manages own bookings"
  on public.bookings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all bookings" on public.bookings;
create policy "Admins read all bookings"
  on public.bookings for select
  using (public.is_admin());

-- Penalties: owner reads + updates (pay/dispute), admins manage all
drop policy if exists "Owner reads own penalties" on public.penalties;
create policy "Owner reads own penalties"
  on public.penalties for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Owner updates own penalties" on public.penalties;
create policy "Owner updates own penalties"
  on public.penalties for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins insert penalties" on public.penalties;
create policy "Admins insert penalties"
  on public.penalties for insert
  with check (auth.uid() = user_id or public.is_admin());

-- Transactions: owner has full control, admins can read all
drop policy if exists "Owner manages own transactions" on public.transactions;
create policy "Owner manages own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read all transactions" on public.transactions;
create policy "Admins read all transactions"
  on public.transactions for select
  using (public.is_admin());

-- Helpful indexes
create index if not exists bookings_user_idx on public.bookings(user_id);
create index if not exists penalties_user_idx on public.penalties(user_id);
create index if not exists transactions_user_idx on public.transactions(user_id);
