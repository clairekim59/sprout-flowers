-- ============================================================
-- Sprout ✿ — daily send limit (3 notes per sender per day)
-- Run once in Supabase Dashboard → SQL Editor (after migration-leaf-cap.sql).
--
-- Redefines the message-insert trigger to also cap how many notes a single
-- sender can send per day. Past the cap, inserts raise DAILY_LIMIT, which the
-- app shows as "you've sent all of today's notes — come back tomorrow".
-- The window resets at midnight MST (America/Phoenix, fixed UTC-7, no DST).
-- Keeps the existing recipient checks, active-plant resolution, and 12-leaf cap.
-- ============================================================

create or replace function public.set_plant_id_on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  leaf_total integer;
  sent_today integer;
begin
  if NEW.sender_id is null then
    raise exception 'sender is required';
  end if;

  if NEW.recipient_id is null then
    raise exception 'recipient is required';
  end if;

  -- daily send cap: at most 3 notes per sender since midnight MST (America/Phoenix)
  select count(*) into sent_today
    from public.messages
    where sender_id = NEW.sender_id
      and created_at >= (date_trunc('day', now() at time zone 'America/Phoenix') at time zone 'America/Phoenix');
  if sent_today >= 3 then
    raise exception 'DAILY_LIMIT' using errcode = 'check_violation';
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

drop trigger if exists messages_set_plant_id on public.messages;
create trigger messages_set_plant_id
  before insert on public.messages
  for each row execute function public.set_plant_id_on_message_insert();
