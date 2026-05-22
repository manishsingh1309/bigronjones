-- BIGRONJONES — Consolidated migration
--
-- Run this file in Supabase → SQL Editor → New query. It's idempotent (safe
-- to run multiple times) and brings any existing database up to the schema
-- the app currently expects: trial-system tables, role column, day-completion
-- tracking, and the activity log.
--
-- Run order doesn't matter — every statement is gated with IF NOT EXISTS or
-- DO blocks that check first.

-- =====================================================================
-- USERS — ensure the table and all expected columns exist
-- =====================================================================
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users
  add column if not exists phone text,
  add column if not exists has_booked_calendly boolean default false,
  add column if not exists trial_start_date timestamptz,
  add column if not exists trial_end_date timestamptz,
  add column if not exists trial_completed_at timestamptz,
  add column if not exists converted_to_paid boolean default false,
  add column if not exists paid_program_id text,
  add column if not exists paid_start_date timestamptz,
  add column if not exists program_type text default 'general',
  add column if not exists age_group text,
  add column if not exists auth_user_id uuid,
  add column if not exists payment_status text default 'pending',
  add column if not exists stripe_session_id text,
  add column if not exists shopify_order_id text,
  add column if not exists calendly_event_id text,
  add column if not exists discovery_call_scheduled_at timestamptz,
  add column if not exists priority_window_expires_at timestamptz,
  add column if not exists role text not null default 'user';

-- Role check constraint (gated by existence — adds only if not already there)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('user', 'admin', 'super_admin'));
  end if;
end $$;

-- Payment status check constraint
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_payment_status_check'
  ) then
    alter table public.users
      add constraint users_payment_status_check
      check (payment_status in ('pending','paid','refunded'));
  end if;
end $$;

-- Program type constraint
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_program_type_check'
  ) then
    alter table public.users
      add constraint users_program_type_check
      check (program_type in ('mens','womens','general'));
  end if;
end $$;

create index if not exists users_email_idx on public.users(email);
create index if not exists users_role_idx on public.users(role);
create index if not exists users_auth_user_idx
  on public.users(auth_user_id) where auth_user_id is not null;
create index if not exists users_stripe_session_idx
  on public.users(stripe_session_id) where stripe_session_id is not null;
create index if not exists users_trial_start_idx
  on public.users(trial_start_date) where trial_start_date is not null;
create index if not exists users_priority_window_idx
  on public.users(priority_window_expires_at)
  where priority_window_expires_at is not null;

-- =====================================================================
-- DAY COMPLETIONS — one row per (user, trial_day) with their daily note
-- =====================================================================
create table if not exists public.day_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  trial_day integer not null check (trial_day between 1 and 7),

  watched_video boolean default false,
  completed_workout boolean default false,
  logged_nutrition boolean default false,
  reviewed_notes boolean default false,

  energy_rating integer check (energy_rating between 1 and 5),
  difficulty_rating integer check (difficulty_rating between 1 and 5),
  overall_feeling text check (overall_feeling in ('great','good','okay','tough','rough')),

  feedback_text text,
  ron_viewed boolean default false,
  ron_reply text,
  ron_replied_at timestamptz,

  completed_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, trial_day)
);

create index if not exists day_completions_user_idx
  on public.day_completions(user_id);
create index if not exists day_completions_completed_idx
  on public.day_completions(completed_at desc);

alter table public.day_completions enable row level security;
drop policy if exists "completions_own" on public.day_completions;
create policy "completions_own" on public.day_completions
  for all using (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  )
  with check (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  );

-- =====================================================================
-- USER ACTIVITY LOG — admin live feed
-- =====================================================================
create table if not exists public.user_activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  activity_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists activity_log_user_idx
  on public.user_activity_log(user_id);
create index if not exists activity_log_created_idx
  on public.user_activity_log(created_at desc);

alter table public.user_activity_log enable row level security;
drop policy if exists "activity_own" on public.user_activity_log;
create policy "activity_own" on public.user_activity_log
  for select using (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  );

-- =====================================================================
-- SOFT-DELETE — admin "delete user" stamps this column instead of
-- removing the row, preserving order/completion history for audits.
-- =====================================================================
alter table public.users
  add column if not exists deleted_at timestamptz;

create index if not exists users_active_idx
  on public.users(created_at desc)
  where deleted_at is null;

-- =====================================================================
-- DONE
-- After this runs, hard-refresh the dashboard. The auth/me/check-in errors
-- you were seeing in the browser console should disappear and check-ins
-- should mark days complete and unlock the next day automatically.
-- =====================================================================
