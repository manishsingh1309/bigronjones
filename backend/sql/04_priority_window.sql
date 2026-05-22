alter table public.users
  add column if not exists priority_window_expires_at timestamptz;

create index if not exists users_priority_window_idx
  on public.users(priority_window_expires_at)
  where priority_window_expires_at is not null;
