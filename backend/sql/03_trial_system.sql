-- BIGRONJONES Trial System Schema
-- 7-Day Oversight Trial for Coaching Platform
-- Run once in Supabase SQL Editor to provision tables for trial management

-- =====================================================================
-- USERS — trial and coaching customers
-- =====================================================================
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text not null,
  phone text,

  -- Trial fields
  has_booked_calendly boolean default false,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  trial_completed_at timestamptz,

  -- Conversion tracking
  converted_to_paid boolean default false,
  paid_program_id text, -- Stripe product ID or internal identifier
  paid_start_date timestamptz,

  -- User segment
  program_type text default 'general', -- 'mens', 'womens', 'general'
  age_group text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists users_email_idx on public.users(email);
create index if not exists users_trial_start_idx on public.users(trial_start_date)
  where trial_start_date is not null;
create index if not exists users_trial_active_idx on public.users(trial_end_date)
  where trial_completed_at is null;

-- =====================================================================
-- RECOVERY METRICS — daily logs during trial
-- =====================================================================
create table if not exists public.recovery_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,

  metric_date date not null,
  
  -- Recovery indicators
  energy_level integer, -- 1-10 scale
  soreness_level integer, -- 1-10 scale (0 = no soreness)
  sleep_hours numeric(3,1),
  sleep_quality integer, -- 1-10 scale
  
  -- Vitals
  resting_heart_rate integer,
  heart_rate_variability integer, -- HRV in milliseconds
  
  -- Activity
  steps integer,
  water_intake_liters numeric(3,1),
  
  -- Notes
  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, metric_date)
);

create index if not exists recovery_metrics_user_idx on public.recovery_metrics(user_id);
create index if not exists recovery_metrics_date_idx on public.recovery_metrics(metric_date);

-- =====================================================================
-- TRAINING MODULES — structured coaching content
-- =====================================================================
create table if not exists public.training_modules (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  
  title text not null,
  description text,
  
  -- Content
  content_html text, -- Rich HTML content
  key_takeaways text[], -- Array of key points
  video_url text,
  
  -- Metadata
  difficulty text default 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  program_type text default 'general', -- 'mens', 'womens', 'general'
  trial_day integer, -- Day of trial when this should be shared (1-7)
  
  duration_minutes integer, -- Estimated time to complete
  active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists training_modules_trial_day_idx on public.training_modules(trial_day);
create index if not exists training_modules_program_idx on public.training_modules(program_type);

-- =====================================================================
-- EMAIL LOGS — prevent duplicate sends and track engagement
-- =====================================================================
create table if not exists public.email_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  
  email_type text not null, -- 'DAY_1_WELCOME', 'DAY_2_EDUCATION', etc.
  trial_day integer not null,
  
  sent_at timestamptz default now(),
  
  -- Engagement tracking
  opened_at timestamptz,
  clicked_at timestamptz,
  cta_link_clicked text, -- Which CTA was clicked
  
  -- Metadata
  send_attempt_count integer default 1,
  last_retry_at timestamptz,
  error_message text,

  created_at timestamptz default now(),

  unique(user_id, email_type, trial_day)
);

create index if not exists email_logs_user_idx on public.email_logs(user_id);
create index if not exists email_logs_sent_idx on public.email_logs(sent_at desc);
create index if not exists email_logs_type_idx on public.email_logs(email_type);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.users enable row level security;
-- No public policies — all writes/reads happen server-side via service role

alter table public.recovery_metrics enable row level security;
-- Optional: Add auth policy so users can only see their own metrics
-- For now, server-only

alter table public.training_modules enable row level security;
drop policy if exists "Training modules are public" on public.training_modules;
create policy "Training modules are public"
  on public.training_modules for select
  using (active = true);

alter table public.email_logs enable row level security;
-- No public policies — operational data, server-only
