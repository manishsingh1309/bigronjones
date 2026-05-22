-- BIGRONJONES Trial — Day Completions + Activity Log
-- Adds the tables that power Ron's super-admin oversight: every user's
-- day-by-day checklist + feedback, and a live activity stream.
--
-- Run AFTER 03_trial_system.sql and 04_trial_extensions.sql.

-- =====================================================================
-- DAY COMPLETIONS — checklist + feedback for each trial day
-- One row per (user, trial_day). Replaces the loose end-of-day signal
-- with a structured object Ron can review.
-- =====================================================================
create table if not exists public.day_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  trial_day integer not null check (trial_day between 1 and 7),

  -- Checklist
  watched_video boolean default false,
  completed_workout boolean default false,
  logged_nutrition boolean default false,
  reviewed_notes boolean default false,

  -- Self-rated end-of-day
  energy_rating integer check (energy_rating between 1 and 5),
  difficulty_rating integer check (difficulty_rating between 1 and 5),
  overall_feeling text check (overall_feeling in ('great','good','okay','tough','rough')),

  -- Free-text feedback to Ron + Ron's reply
  feedback_text text,
  ron_viewed boolean default false,
  ron_reply text,
  ron_replied_at timestamptz,

  completed_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, trial_day)
);

create index if not exists day_completions_user_idx on public.day_completions(user_id);
create index if not exists day_completions_completed_idx on public.day_completions(completed_at desc);
create index if not exists day_completions_unread_idx on public.day_completions(ron_viewed)
  where ron_viewed = false;
create index if not exists day_completions_has_feedback_idx on public.day_completions(completed_at desc)
  where feedback_text is not null and ron_viewed = false;

-- =====================================================================
-- USER ACTIVITY LOG — every meaningful action for the admin live feed
-- =====================================================================
create table if not exists public.user_activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  activity_type text not null,
  -- 'login' | 'video_started' | 'video_completed' | 'day_completed'
  -- 'feedback_submitted' | 'playlist_opened' | 'metrics_submitted'
  -- 'call_booked' | 'phase2_viewed' | 'admin_replied'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists activity_log_user_idx on public.user_activity_log(user_id);
create index if not exists activity_log_type_idx on public.user_activity_log(activity_type);
create index if not exists activity_log_created_idx on public.user_activity_log(created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY
-- All admin/server reads use the service-role client (bypasses RLS).
-- User reads are gated by auth.uid() = users.auth_user_id.
-- =====================================================================
alter table public.day_completions enable row level security;
drop policy if exists "completions_own" on public.day_completions;
create policy "completions_own" on public.day_completions
  for all using (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  )
  with check (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  );

alter table public.user_activity_log enable row level security;
drop policy if exists "activity_own" on public.user_activity_log;
create policy "activity_own" on public.user_activity_log
  for select using (
    user_id in (select id from public.users where auth_user_id = auth.uid())
  );
-- Inserts come from the server (service role) so no INSERT policy needed.
