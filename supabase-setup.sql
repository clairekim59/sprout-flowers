-- ============================================================
-- Sprout ✿ — Supabase schema setup
-- Run this once in Supabase Dashboard → SQL Editor → New query.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text not null,
  sprout_id     text not null unique,
  created_at    timestamptz not null default now()
);

-- ---------- messages ----------
create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  body          text not null check (length(body) > 0 and length(body) <= 500),
  anon          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists messages_recipient_idx on public.messages(recipient_id, created_at);
create index if not exists messages_sender_idx    on public.messages(sender_id, created_at desc);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "messages_insert_as_sender" on public.messages;
create policy "messages_insert_as_sender"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);

-- ---------- Auto-create profile on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, sprout_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', 'sprout'),
    coalesce(
      new.raw_user_meta_data->>'sprout_id',
      'plant_' || substring(replace(new.id::text, '-', ''), 1, 6)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
