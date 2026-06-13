-- Run this in Supabase → SQL Editor before using real auth.
-- Creates profiles linked to auth.users, auto-populated on sign-up.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  plate text,
  vehicle_make text,
  vehicle_color text,
  subscription_id text,
  subscription_renewal date,
  subscription_billing text default 'monthly',
  wallet_balance numeric default 0,
  stars_rewards int default 0,
  status text default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

alter table public.profiles enable row level security;

drop policy if exists "Users read accessible profiles" on public.profiles;
create policy "Users read accessible profiles"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update
  using (public.is_admin());

-- After creating an admin account via sign-up, promote it:
-- update public.profiles set role = 'admin' where email = 'admin@adapark.kktc';
