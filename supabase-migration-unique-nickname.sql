-- ============================================================
-- Sprout ✿ — enforce case-insensitive unique nicknames
-- Run this once in Supabase Dashboard → SQL Editor.
-- ============================================================

-- Will fail if any existing duplicates exist (case-insensitive).
-- If that happens, rename one of the conflicting profiles first:
--   update public.profiles set display_name = display_name || '2' where ...
create unique index if not exists profiles_display_name_lower_idx
  on public.profiles (lower(display_name));
