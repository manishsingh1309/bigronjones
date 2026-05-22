-- =====================================================================
-- 10_soft_delete_users.sql
--
-- Add soft-delete capability to users table. The admin "delete user"
-- action stamps deleted_at instead of removing the row, preserving
-- audit trails for orders, completions, and payment history while
-- keeping the row out of admin views.
--
-- Run once in the Supabase SQL Editor.
-- =====================================================================

alter table public.users
  add column if not exists deleted_at timestamptz;

-- Partial index — only non-deleted rows are usually queried, so this
-- keeps the index small even as deletions accumulate.
create index if not exists users_active_idx
  on public.users(created_at desc)
  where deleted_at is null;

comment on column public.users.deleted_at is
  'Set by admin soft-delete. NULL = active. Filtered out of admin lists/stats.';
