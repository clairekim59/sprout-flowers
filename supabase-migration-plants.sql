-- ============================================================
-- Sprout ✿ — plants table (named plants + graduation history)
-- Run this once in Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1. plants table: one row per plant a user has ever owned.
--    archived_at is null for the currently-active plant.
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  final_leaf_count integer
);

-- Each user has at most one active plant at a time.
create unique index if not exists plants_active_per_owner_idx
  on public.plants(owner_id)
  where archived_at is null;

create index if not exists plants_owner_created_idx
  on public.plants(owner_id, created_at desc);

-- 2. Backfill: every existing profile gets one active plant.
insert into public.plants (owner_id, created_at)
  select p.id, p.created_at
  from public.profiles p
  where not exists (
    select 1 from public.plants pl
    where pl.owner_id = p.id and pl.archived_at is null
  );

-- 3. Add plant_id to messages so leaves stay attached to the plant
--    they grew on, even after the user graduates to a new seed.
alter table public.messages
  add column if not exists plant_id uuid references public.plants(id) on delete set null;

-- Backfill existing messages to the current active plant of the recipient.
update public.messages m
  set plant_id = (
    select id from public.plants
    where owner_id = m.recipient_id and archived_at is null
    limit 1
  )
  where m.plant_id is null;

alter table public.messages alter column plant_id drop not null;

create index if not exists messages_plant_id_idx on public.messages(plant_id, created_at);

-- 4. RLS for plants.
--    SELECT: own plants (any state) + anyone's active plant (so senders can address it).
--    INSERT/UPDATE: only your own.
alter table public.plants enable row level security;

drop policy if exists "plants_select" on public.plants;
create policy "plants_select" on public.plants
  for select using (owner_id = auth.uid() or archived_at is null);

drop policy if exists "plants_insert" on public.plants;
create policy "plants_insert" on public.plants
  for insert with check (owner_id = auth.uid());

drop policy if exists "plants_update" on public.plants;
create policy "plants_update" on public.plants
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- 5. Trigger: when a new profile is created, give them a fresh active plant.
create or replace function public.create_initial_plant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.plants (owner_id) values (NEW.id)
    on conflict do nothing;
  return NEW;
end;
$$;

drop trigger if exists profiles_create_plant on public.profiles;
create trigger profiles_create_plant
  after insert on public.profiles
  for each row execute function public.create_initial_plant();

-- 6. Trigger: when a message is inserted, auto-fill plant_id with
--    the recipient's currently-active plant. Lets app code keep
--    inserting messages with just (sender_id, recipient_id, body, anon).
create or replace function public.set_plant_id_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.sender_id is null then
    raise exception 'sender is required';
  end if;

  if NEW.recipient_id is null then
    raise exception 'recipient is required';
  end if;

  if NEW.plant_id is null then
    select id into NEW.plant_id
      from public.plants
      where owner_id = NEW.recipient_id and archived_at is null
      limit 1;
    if NEW.plant_id is null then
      raise exception 'recipient has no active plant';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists messages_set_plant_id on public.messages;
create trigger messages_set_plant_id
  before insert on public.messages
  for each row execute function public.set_plant_id_on_message_insert();

-- 7. graduate_plant: archive the caller's active plant (snapshotting
--    its final leaf count) and create a fresh active seed. Returns
--    the new plant's id. Also zeroes profiles.leaf_count so the
--    existing trigger keeps counting only the new plant's leaves.
create or replace function public.graduate_plant()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plant_id uuid;
  current_count integer;
  new_plant_id uuid;
begin
  select id into current_plant_id
    from public.plants
    where owner_id = auth.uid() and archived_at is null
    for update;

  if current_plant_id is null then
    raise exception 'no active plant to graduate';
  end if;

  select count(*) into current_count
    from public.messages
    where plant_id = current_plant_id;

  update public.plants
    set archived_at = now(), final_leaf_count = current_count
    where id = current_plant_id;

  insert into public.plants (owner_id) values (auth.uid())
    returning id into new_plant_id;

  update public.profiles
    set leaf_count = 0
    where id = auth.uid();

  return new_plant_id;
end;
$$;

grant execute on function public.graduate_plant() to authenticated;
