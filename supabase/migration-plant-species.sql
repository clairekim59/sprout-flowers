-- ============================================================
-- Sprout ✿ — plant species (mystery seed → 1 of 6 plants)
-- Run once in Supabase Dashboard → SQL Editor.
-- Requires supabase-migration-plants.sql (+ -plant-share.sql) first.
-- ============================================================

-- species 0..5; NULL = seed not chosen yet (triggers onboarding).
-- Existing plants stay NULL so every user picks a seed once.
alter table public.plants
  add column if not exists species smallint;

-- Re-publish get_shared_plant to include the species so a shared
-- plant renders in the right shape/colors for guests.
create or replace function public.get_shared_plant(p_share_id uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  plant_rec record;
  msgs json;
begin
  select id, name, archived_at, final_leaf_count, owner_id, species
    into plant_rec
    from public.plants
    where share_id = p_share_id;

  if not found then
    return null;
  end if;

  select json_agg(
           json_build_object(
             'id', m.id,
             'body', m.body,
             'anon', m.anon,
             'created_at', m.created_at,
             'from_name', case when m.anon then null else pr.display_name end
           ) order by m.created_at asc
         )
    into msgs
    from public.messages m
    left join public.profiles pr on pr.id = m.sender_id
    where m.plant_id = plant_rec.id;

  return json_build_object(
    'name', plant_rec.name,
    'owner_name', (select display_name from public.profiles where id = plant_rec.owner_id),
    'archived', plant_rec.archived_at is not null,
    'species', plant_rec.species,
    'leaf_count', coalesce(
      plant_rec.final_leaf_count,
      (select count(*) from public.messages where plant_id = plant_rec.id)
    ),
    'messages', coalesce(msgs, '[]'::json)
  );
end;
$$;

grant execute on function public.get_shared_plant(uuid) to anon, authenticated;
