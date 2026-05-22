-- Add optional profile icon choice for existing Sprout databases.
alter table public.profiles
  add column if not exists profile_icon text;
