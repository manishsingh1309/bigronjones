create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null,
  status text not null default 'pending',
  stripe_session_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_stripe_session_idx
  on public.orders(stripe_session_id)
  where stripe_session_id is not null;
