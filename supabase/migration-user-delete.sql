-- ============================================================
-- Sprout ✿ — delete account while preserving message history
-- Run once in Supabase Dashboard → SQL Editor.
-- Requires supabase-setup.sql + supabase-migration-plants.sql first.
--
-- Behavior:
-- - Messages the deleted user sent stay on recipients' plants, but no
--   longer point to the deleted profile.
-- - Messages sent to the deleted user stay visible only in each sender's
--   sent box; they are detached from the deleted user's plants.
-- - Profile, plants, friendships, requests, and auth user are removed.
-- ============================================================

-- Existing databases created messages with cascading, NOT NULL profile
-- references. Account deletion needs preserved messages, so make profile
-- references nullable and detach on profile/plant deletion. The delete_plant
-- RPC deletes a plant's own leaves explicitly.
alter table public.messages
  alter column recipient_id drop not null,
  alter column sender_id drop not null,
  alter column plant_id drop not null;

alter table public.messages
  drop constraint if exists messages_recipient_id_fkey,
  drop constraint if exists messages_sender_id_fkey,
  drop constraint if exists messages_plant_id_fkey;

alter table public.messages
  add constraint messages_recipient_id_fkey
    foreign key (recipient_id) references public.profiles(id) on delete set null,
  add constraint messages_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete set null,
  add constraint messages_plant_id_fkey
    foreign key (plant_id) references public.plants(id) on delete set null;

-- Keep normal app inserts strict even though preserved historical messages
-- can now have nullable profile/plant references.
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

create or replace function public.delete_plant(p_plant_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  was_active boolean;
  active_plant_id uuid;
  new_plant_id uuid;
begin
  select (archived_at is null) into was_active
    from public.plants
    where id = p_plant_id and owner_id = auth.uid();

  if not found then
    raise exception 'plant not found or not yours';
  end if;

  delete from public.messages
    where plant_id = p_plant_id;

  delete from public.plants
    where id = p_plant_id and owner_id = auth.uid();

  if was_active then
    insert into public.plants (owner_id) values (auth.uid())
      returning id into new_plant_id;
    update public.profiles set leaf_count = 0 where id = auth.uid();
  else
    select id into active_plant_id
      from public.plants
      where owner_id = auth.uid() and archived_at is null
      limit 1;

    update public.profiles
       set leaf_count = coalesce(
         (select count(*) from public.messages where plant_id = active_plant_id),
         0
       )
     where id = auth.uid();
  end if;

  return new_plant_id;
end;
$$;

grant execute on function public.delete_plant(uuid) to authenticated;

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not logged in';
  end if;

  -- Received messages should no longer belong to the deleted user or any
  -- deleted plant, but each sender should still see them in their sent box.
  update public.messages
     set recipient_id = null,
         plant_id = null
   where recipient_id = v_uid;

  -- Sent messages stay on the recipient's plant, but no profile info remains.
  update public.messages
     set sender_id = null
   where sender_id = v_uid;

  delete from public.friend_requests
   where from_id = v_uid or to_id = v_uid;

  delete from public.friends
   where owner_id = v_uid or friend_id = v_uid;

  delete from public.plants
   where owner_id = v_uid;

  delete from public.profiles
   where id = v_uid;

  delete from auth.users
   where id = v_uid;
end;
$$;

grant execute on function public.delete_account() to authenticated;
