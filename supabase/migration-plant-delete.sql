-- ============================================================
-- Sprout ✿ — permanently delete a plant (irrevocable)
-- Run this once in Supabase Dashboard → SQL Editor.
-- Requires supabase-migration-plants.sql first.
-- ============================================================

-- delete_plant: permanently removes one of the caller's plants and
-- all of its messages.
-- If the deleted plant was the active one, a fresh seed is planted and
-- profiles.leaf_count is reset so the user always has an active plant.
-- Returns the new active plant id when one was created, else null.
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
