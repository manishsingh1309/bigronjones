-- ===========================================================================
-- 12_trial_daily_metrics.sql
--
-- Adds the daily recovery-metric ratings collected after each trial-day lesson
-- to the day_completions table. The 7-Day trial dashboard asks the user to rate
-- six metrics 1-5 after watching each day's video; submitting them is what marks
-- the day complete and unlocks the next day.
--
-- energy_rating already exists (see 05_trial_completions_activity.sql); this
-- migration adds the remaining five so all six live on the same completion row.
--
-- Safe to run multiple times (add column if not exists).
-- Run this in the Supabase SQL editor.
-- ===========================================================================

alter table public.day_completions
  add column if not exists mood_rating        integer check (mood_rating        between 1 and 5),
  add column if not exists libido_rating      integer check (libido_rating      between 1 and 5),
  add column if not exists performance_rating integer check (performance_rating between 1 and 5),
  add column if not exists sleep_rating       integer check (sleep_rating       between 1 and 5),
  add column if not exists rhr_rating         integer check (rhr_rating         between 1 and 5);

-- energy_rating may be missing on very old projects — add it too, idempotently.
alter table public.day_completions
  add column if not exists energy_rating      integer check (energy_rating      between 1 and 5);
