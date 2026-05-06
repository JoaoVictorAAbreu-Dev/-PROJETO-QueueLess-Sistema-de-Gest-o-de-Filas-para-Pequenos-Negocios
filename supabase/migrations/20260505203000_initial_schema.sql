create extension if not exists "pgcrypto";

create type public.queue_status as enum ('waiting', 'called', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null check (char_length(trim(business_name)) >= 2),
  public_slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null check (char_length(trim(customer_name)) >= 1),
  phone text,
  party_size integer not null default 1 check (party_size between 1 and 99),
  notes text,
  status public.queue_status not null default 'waiting',
  position integer not null default 1,
  created_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.attendance_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  queue_entry_id uuid references public.queue_entries(id) on delete set null,
  customer_name text not null,
  party_size integer not null default 1 check (party_size between 1 and 99),
  wait_time_minutes integer not null check (wait_time_minutes >= 0),
  served_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index queue_entries_profile_status_position_idx
  on public.queue_entries (profile_id, status, position, created_at);

create index attendance_history_profile_served_at_idx
  on public.attendance_history (profile_id, served_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger queue_entries_set_updated_at
before update on public.queue_entries
for each row execute function public.set_updated_at();

create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'negocio')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_business_name text;
  base_slug text;
begin
  raw_business_name := coalesce(new.raw_user_meta_data ->> 'business_name', split_part(new.email, '@', 1), 'Meu negocio');
  base_slug := public.slugify(raw_business_name) || '-' || substring(new.id::text from 1 for 8);

  insert into public.profiles (id, business_name, public_slug)
  values (new.id, raw_business_name, base_slug)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.queue_entries enable row level security;
alter table public.attendance_history enable row level security;

create policy "Owners can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "Owners can upsert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

create policy "Owners can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Public can read business profiles"
on public.profiles for select
to anon
using (true);

create policy "Owners can manage queue"
on public.queue_entries for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

create policy "Public can read active queue"
on public.queue_entries for select
to anon
using (status in ('waiting', 'called'));

create policy "Owners can manage attendance history"
on public.attendance_history for all
to authenticated
using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

alter publication supabase_realtime add table public.queue_entries;
alter publication supabase_realtime add table public.attendance_history;
