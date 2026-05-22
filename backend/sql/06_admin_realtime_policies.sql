-- BIGRONJONES Trial — Admin realtime read policies
-- Allows admin emails (read-only) to see all rows in day_completions and
-- user_activity_log. This is what powers the live admin dashboard feed via
-- Supabase realtime subscriptions.
--
-- Server-side mutations still go through the service-role client which
-- bypasses RLS. The admin guard at /api/admin/* still enforces ADMIN_EMAILS.
--
-- IMPORTANT: keep this list in sync with the ADMIN_EMAILS env var.
-- Run AFTER 05_trial_completions_activity.sql.

-- =====================================================================
-- Helper: is_admin()
-- Returns true when the current Supabase JWT's email matches the allowlist.
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'ron@bigronjones.com',
    'dev@anyfeast.com'
  );
$$;

-- =====================================================================
-- day_completions — admin can read all (write still service-role only)
-- =====================================================================
drop policy if exists "completions_admin_read" on public.day_completions;
create policy "completions_admin_read" on public.day_completions
  for select using (public.is_admin());

-- =====================================================================
-- user_activity_log — admin can read all
-- =====================================================================
drop policy if exists "activity_admin_read" on public.user_activity_log;
create policy "activity_admin_read" on public.user_activity_log
  for select using (public.is_admin());

-- =====================================================================
-- users — admin can read all (so realtime joins resolve names/emails)
-- =====================================================================
drop policy if exists "users_admin_read" on public.users;
create policy "users_admin_read" on public.users
  for select using (public.is_admin());

-- =====================================================================
-- Realtime publication — make sure the tables are in supabase_realtime
-- (Supabase enables this by default on most tables, but be explicit.)
-- =====================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'day_completions'
  ) then
    alter publication supabase_realtime add table public.day_completions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_activity_log'
  ) then
    alter publication supabase_realtime add table public.user_activity_log;
  end if;
end $$;
