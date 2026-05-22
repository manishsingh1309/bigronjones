-- BIGRONJONES Trial System — Extensions
-- Adds the columns required by the /programs/trial sales page,
-- /trial/success Calendly hand-off, and Supabase auth ↔ trial linking.
--
-- Run in Supabase SQL editor AFTER 03_trial_system.sql.

-- =====================================================================
-- USERS — extra trial-flow columns
-- =====================================================================
alter table public.users
  add column if not exists auth_user_id uuid,
  add column if not exists payment_status text default 'pending'
    check (payment_status in ('pending','paid','refunded')),
  add column if not exists stripe_session_id text,
  add column if not exists shopify_order_id text,
  add column if not exists calendly_event_id text,
  add column if not exists discovery_call_scheduled_at timestamptz,
  add column if not exists priority_window_expires_at timestamptz;

create index if not exists users_auth_user_idx
  on public.users(auth_user_id) where auth_user_id is not null;

create index if not exists users_stripe_session_idx
  on public.users(stripe_session_id) where stripe_session_id is not null;

-- Allow program_type values used by the men's/women's selector.
-- Existing default is 'general' which we keep for legacy rows.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_program_type_check'
  ) then
    alter table public.users
      add constraint users_program_type_check
      check (program_type in ('mens','womens','general'));
  end if;
end $$;

-- =====================================================================
-- RECOVERY METRICS — extra signals from the dashboard form
-- =====================================================================
alter table public.recovery_metrics
  add column if not exists mood integer,
  add column if not exists workout_completed boolean default false,
  add column if not exists workout_type text
    check (workout_type in ('gym','home','skipped'));

-- Storing trial_day directly removes a date math step on read.
alter table public.recovery_metrics
  add column if not exists trial_day integer;

create index if not exists recovery_metrics_trial_day_idx
  on public.recovery_metrics(user_id, trial_day) where trial_day is not null;

-- =====================================================================
-- TRAINING MODULES — backfill the 7 trial-day modules from the handoff
-- (idempotent: ON CONFLICT keeps existing rows untouched).
-- =====================================================================
insert into public.training_modules
  (slug, title, description, video_url, trial_day, duration_minutes, active, key_takeaways)
values
  ('trial-day-1-orientation-women', 'Welcome / Orientation — Women',
   'Day 1 orientation. How the next 7 days work, what to track, what to expect.',
   'https://www.youtube.com/embed/90-COQ3d0mQ?rel=0&modestbranding=1', 1, 12, true,
   array['Set baseline','Understand the framework','Commit to the 7 days']),
  ('trial-day-2-orientation-men', 'Welcome / Orientation — Men',
   'Day 2 orientation for men. Mindset, structure, and the rules of engagement.',
   'https://www.youtube.com/embed/KGiKfgMHgiM?rel=0&modestbranding=1', 2, 12, true,
   array['Mindset reset','Structure over willpower','Daily reps win']),
  ('trial-day-3-cardio-doctrine', 'Cardio Doctrine',
   'How Ron programs cardio for adults 35+. Heart rate zones and the truth about steady state.',
   'https://www.youtube.com/embed/KwoI0SgTJzY?rel=0&modestbranding=1', 3, 14, true,
   array['Zone 2 dominates','HR caps not paces','Recovery starts at the heart']),
  ('trial-day-4-cardio-doctrine-men', 'Cardio Doctrine — Men',
   'Day 4 cardio doctrine specific to men. Programming intensity by week.',
   'https://www.youtube.com/embed/fGZx__eem7I?rel=0&modestbranding=1', 4, 14, true,
   array['Intensity vs frequency','Recovery wins gains','Test, don''t guess']),
  ('trial-day-5-recovery-doctrine-men', 'Recovery Doctrine — Men',
   'Recovery is the program. Sleep, soreness, and what the metrics tell us.',
   'https://www.youtube.com/embed/1NJgQ5Hz2Yk?rel=0&modestbranding=1', 5, 13, true,
   array['Sleep is the cheat code','Soreness is feedback','Track to adjust']),
  ('trial-day-6-recovery-doctrine-women', 'Recovery Doctrine — Women',
   'Recovery doctrine for women. Cycle awareness, sleep quality, training calibration.',
   'https://www.youtube.com/embed/M-hR9CDcQng?rel=0&modestbranding=1', 6, 13, true,
   array['Cycle-aware training','Sleep first','Push only when ready']),
  ('trial-day-7-strength-doctrine', 'Strength Training Doctrine',
   'How Ron prescribes strength for longevity. Compounds, frequency, and progressive overload.',
   'https://www.youtube.com/embed/yTAPv6f8FfU?rel=0&modestbranding=1', 7, 15, true,
   array['Compounds first','Frequency over volume','Progressive overload, always'])
on conflict (slug) do nothing;
