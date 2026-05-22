-- Premium Dashboard Models
-- Tables for check-ins, workouts, email progress, and booking/payment audit.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_session_id text,
  amount integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  calendly_event_id text,
  booking_time timestamptz,
  booking_completed boolean not null default false,
  meeting_completed boolean not null default false,
  coach_instructions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trial_day integer not null,
  mood integer not null,
  energy integer not null,
  sleep_quality integer not null,
  soreness integer not null,
  performance integer not null,
  weight numeric,
  waist numeric,
  hr integer,
  hrv integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, created_at)
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  program_type text not null check (program_type in ('gym', 'home')),
  day integer not null,
  title text not null,
  coach_notes text not null,
  video_url text,
  exercises jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  step integer not null,
  subject text not null,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  read_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'sent', 'opened', 'read')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, step)
);

create table if not exists public.dashboard_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);