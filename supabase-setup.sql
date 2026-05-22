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
  profile_icon  text,
  sprout_id     text not null unique,
  leaf_count    integer not null default 0,
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

-- ---------- leaf_count auto-update ----------
create or replace function public.bump_leaf_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles
       set leaf_count = leaf_count + 1
     where id = new.recipient_id;
  elsif (tg_op = 'DELETE') then
    update public.profiles
       set leaf_count = greatest(leaf_count - 1, 0)
     where id = old.recipient_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row execute function public.bump_leaf_count();

drop trigger if exists on_message_delete on public.messages;
create trigger on_message_delete
  after delete on public.messages
  for each row execute function public.bump_leaf_count();

-- ---------- friends (my garden) ----------
create table if not exists public.friends (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (owner_id, friend_id),
  check (owner_id <> friend_id)
);

create index if not exists friends_owner_idx on public.friends(owner_id);

alter table public.friends enable row level security;

drop policy if exists "friends_select_own" on public.friends;
create policy "friends_select_own"
  on public.friends for select to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "friends_insert_own" on public.friends;
create policy "friends_insert_own"
  on public.friends for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "friends_delete_own" on public.friends;
create policy "friends_delete_own"
  on public.friends for delete to authenticated
  using (auth.uid() = owner_id);

-- ---------- friend requests ----------
create table if not exists public.friend_requests (
  id          uuid primary key default gen_random_uuid(),
  from_id     uuid not null references public.profiles(id) on delete cascade,
  to_id       uuid not null references public.profiles(id) on delete cascade,
  message     text,
  created_at  timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);

create index if not exists friend_requests_to_idx   on public.friend_requests(to_id);
create index if not exists friend_requests_from_idx on public.friend_requests(from_id);

alter table public.friend_requests enable row level security;

drop policy if exists "fr_select_own" on public.friend_requests;
create policy "fr_select_own"
  on public.friend_requests for select to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

drop policy if exists "fr_insert_as_sender" on public.friend_requests;
create policy "fr_insert_as_sender"
  on public.friend_requests for insert to authenticated
  with check (auth.uid() = from_id);

drop policy if exists "fr_delete_own" on public.friend_requests;
create policy "fr_delete_own"
  on public.friend_requests for delete to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

create or replace function public.accept_friend_request(req_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r from public.friend_requests where id = req_id;
  if not found then
    raise exception 'request not found';
  end if;
  if r.to_id <> auth.uid() then
    raise exception 'not authorized to accept this request';
  end if;

  insert into public.friends (owner_id, friend_id)
    values (r.from_id, r.to_id)
    on conflict (owner_id, friend_id) do nothing;
  insert into public.friends (owner_id, friend_id)
    values (r.to_id, r.from_id)
    on conflict (owner_id, friend_id) do nothing;

  delete from public.friend_requests where id = req_id;
end;
$$;

grant execute on function public.accept_friend_request(uuid) to authenticated;
