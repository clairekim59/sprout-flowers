-- ============================================================
-- Sprout ✿ — per-message read state (unread notifications)
-- Run once in Supabase Dashboard → SQL Editor.
-- Requires supabase-setup.sql + supabase-migration-plants.sql first.
--
-- Adds read_at to messages so a recipient's unread leaves are tracked
-- server-side: every message a user hasn't opened stays unread across
-- reloads, devices, and offline periods until they actually read it.
-- ============================================================

-- 1. read_at: null = the recipient hasn't opened this message yet.
--    Existing messages stay NULL, so anything not yet read shows as unread.
alter table public.messages
  add column if not exists read_at timestamptz;

create index if not exists messages_unread_idx
  on public.messages(recipient_id)
  where read_at is null;

-- 2. mark_message_read: let a recipient mark one of THEIR received messages
--    read. security definer so no broad UPDATE policy is needed; the
--    recipient_id = auth.uid() guard means callers can only touch their own
--    inbox, and only the read_at timestamp is ever changed.
create or replace function public.mark_message_read(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
     set read_at = now()
   where id = p_message_id
     and recipient_id = auth.uid()
     and read_at is null;
end;
$$;

grant execute on function public.mark_message_read(uuid) to authenticated;
