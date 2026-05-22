-- Super-admin + 7-day coaching progression
-- Adds persisted roles, day modules, progress tracking, daily feedback,
-- and private coach notes.

alter table public.users
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check
      check (role in ('user', 'admin', 'super_admin'));
  end if;
end $$;

create index if not exists users_role_idx on public.users(role);

create table if not exists public.video_modules (
  id uuid primary key default gen_random_uuid(),
  day_number integer not null unique check (day_number between 1 and 7),
  title text not null,
  description text not null,
  youtube_url text not null,
  resources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_video_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  watched boolean not null default false,
  completed boolean not null default false,
  unlocked boolean not null default false,
  completed_at timestamptz,
  watched_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_number)
);

create index if not exists user_video_progress_user_idx
  on public.user_video_progress(user_id, day_number);

create table if not exists public.daily_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  mood integer not null check (mood between 1 and 10),
  energy integer not null check (energy between 1 and 10),
  understanding_level integer not null check (understanding_level between 1 and 10),
  takeaway text,
  struggles text,
  questions text,
  commitment_score integer not null check (commitment_score between 1 and 10),
  notes text,
  sentiment_score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day_number)
);

create index if not exists daily_feedback_user_idx
  on public.daily_feedback(user_id, day_number);

create table if not exists public.coach_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  admin_id uuid not null references public.users(id) on delete cascade,
  note text not null,
  label text not null default 'general' check (label in ('general', 'high-risk', 'high-potential')),
  created_at timestamptz not null default now()
);

create index if not exists coach_notes_user_idx on public.coach_notes(user_id, created_at desc);

alter table public.users enable row level security;
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select
  using (
    auth.uid() = auth_user_id
    or role = 'super_admin'
  );

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (
    auth.uid() = auth_user_id
    or role = 'super_admin'
  )
  with check (
    auth.uid() = auth_user_id
    or role = 'super_admin'
  );

alter table public.video_modules enable row level security;
drop policy if exists "Authenticated users can read modules" on public.video_modules;
create policy "Authenticated users can read modules"
  on public.video_modules for select
  using (auth.role() = 'authenticated');

alter table public.user_video_progress enable row level security;
drop policy if exists "Users can read own video progress" on public.user_video_progress;
create policy "Users can read own video progress"
  on public.user_video_progress for select
  using (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists "Users can write own video progress" on public.user_video_progress;
create policy "Users can write own video progress"
  on public.user_video_progress for insert
  with check (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists "Users can update own video progress" on public.user_video_progress;
create policy "Users can update own video progress"
  on public.user_video_progress for update
  using (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  )
  with check (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );

alter table public.daily_feedback enable row level security;
drop policy if exists "Users can read own feedback" on public.daily_feedback;
create policy "Users can read own feedback"
  on public.daily_feedback for select
  using (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists "Users can write own feedback" on public.daily_feedback;
create policy "Users can write own feedback"
  on public.daily_feedback for insert
  with check (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );

drop policy if exists "Users can update own feedback" on public.daily_feedback;
create policy "Users can update own feedback"
  on public.daily_feedback for update
  using (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  )
  with check (
    auth.uid() = (
      select auth_user_id from public.users where id = user_id
    )
    or exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );

alter table public.coach_notes enable row level security;
drop policy if exists "Super admins can manage coach notes" on public.coach_notes;
create policy "Super admins can manage coach notes"
  on public.coach_notes for all
  using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid() and u.role = 'super_admin'
    )
  );
