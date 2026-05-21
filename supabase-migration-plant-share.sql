-- ============================================================
-- Sprout ✿ — shareable plants (public read-only links)
-- Run this once in Supabase Dashboard → SQL Editor.
-- Requires supabase-migration-plants.sql to have been run first.
-- ============================================================

-- 1. A per-plant share token. Null = not shared. Non-null = anyone
--    holding the token can view the plant read-only.
alter table public.plants
  add column if not exists share_id uuid unique;

-- 2. enable_plant_share: turn on sharing for one of the caller's own
--    plants and return its (stable) share token. Idempotent.
create or replace function public.enable_plant_share(p_plant_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  if not exists (
    select 1 from public.plants
    where id = p_plant_id and owner_id = auth.uid()
  ) then
    raise exception 'plant not found or not yours';
  end if;

  select share_id into sid from public.plants where id = p_plant_id;
  if sid is null then
    sid := gen_random_uuid();
    update public.plants set share_id = sid where id = p_plant_id;
  end if;
  return sid;
end;
$$;

grant execute on function public.enable_plant_share(uuid) to authenticated;

-- 3. get_shared_plant: public, read-only view of a shared plant and
--    its messages. Anonymous messages keep their sender hidden. Runs
--    as definer so it can read past RLS, but only ever exposes a plant
--    that was explicitly shared (has a matching share_id).
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
  select id, name, archived_at, final_leaf_count, owner_id
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
    'leaf_count', coalesce(
      plant_rec.final_leaf_count,
      (select count(*) from public.messages where plant_id = plant_rec.id)
    ),
    'messages', coalesce(msgs, '[]'::json)
  );
end;
$$;

grant execute on function public.get_shared_plant(uuid) to anon, authenticated;
