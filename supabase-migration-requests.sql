-- ============================================================
-- Sprout ✿ — friend request flow migration
-- Run this once in Supabase Dashboard → SQL Editor.
-- Builds on supabase-setup.sql + supabase-migration-garden.sql.
-- ============================================================

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

-- Atomically accept: drop request, add bilateral friend rows.
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
