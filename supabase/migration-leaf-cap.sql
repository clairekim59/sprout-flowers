-- ============================================================
-- Sprout ✿ — cap each plant at 12 leaves
-- Run once in Supabase Dashboard → SQL Editor (after migration-plants.sql).
--
-- A leaf is a message attached to a plant. This redefines the existing
-- before-insert trigger function so it refuses to attach a 13th leaf:
-- once a plant already holds 12 messages, new sends raise PLANT_FULL,
-- which the app surfaces as a friendly "this plant is full" message.
-- Plants that somehow already exceed 12 keep their leaves; they just
-- can't grow further.
-- ============================================================

create or replace function public.set_plant_id_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  leaf_total integer;
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

  -- hard cap: at most 12 leaves per plant
  select count(*) into leaf_total
    from public.messages
    where plant_id = NEW.plant_id;
  if leaf_total >= 12 then
    raise exception 'PLANT_FULL' using errcode = 'check_violation';
  end if;

  return NEW;
end;
$$;

-- trigger already points at this function (created in migration-plants.sql);
-- recreated here so this file is self-contained if run on a fresh setup.
drop trigger if exists messages_set_plant_id on public.messages;
create trigger messages_set_plant_id
  before insert on public.messages
  for each row execute function public.set_plant_id_on_message_insert();
