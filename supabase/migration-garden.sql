-- ============================================================
-- Sprout ✿ — "my garden" feature migration
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- on top of supabase-setup.sql.
-- ============================================================

-- ---------- leaf_count column on profiles ----------
alter table public.profiles
  add column if not exists leaf_count integer not null default 0;

-- backfill existing rows from messages count
update public.profiles p
set leaf_count = coalesce(
  (select count(*) from public.messages where recipient_id = p.id), 0
);

-- ---------- trigger to keep leaf_count in sync ----------
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

-- ---------- friends table ----------
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
