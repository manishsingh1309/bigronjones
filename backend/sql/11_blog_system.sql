-- ============================================================================
-- 11_blog_system.sql — Trend-based AI blog generation system
--   Persists AI-generated blogs (previously in-memory only) to Supabase so
--   they survive restarts and render on the public /blog page.
--
--   Column shape mirrors the frontend `Blog` interface (shared/lib/blogStore.ts)
--   so the API can map rows 1:1 with no lossy translation, PLUS SEO/trend
--   metadata used by the generator.
--
--   Safe to run multiple times (idempotent: IF NOT EXISTS / drop-then-create
--   policies). Run in Supabase → SQL Editor.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- BLOGS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),

  -- Core content (mirrors the frontend Blog shape)
  slug text unique not null,
  title text not null,
  subtitle text,
  excerpt text not null,
  body text not null,                         -- markdown (same renderer as seed blogs)
  category text not null default 'Fitness',
  tags text[] default '{}',
  reading_time text default '3 min read',     -- display string, e.g. "4 min read"
  challenge_of_the_day text,
  cover_image text,

  -- Author (denormalised — always Big Ron)
  author_name text default 'Big Ron Jones',
  author_avatar text default '/images/ron/mentality-portrait.jpg',
  author_title text default 'Fitness & Wellness Coach',
  ron_image_url text,                         -- rotating Ron photo for the byline

  -- SEO
  meta_title text,
  meta_description text,
  keywords text[] default '{}',
  image_credit text,

  -- Trend provenance
  trending_keyword text,
  trend_score integer,
  trend_date date,

  -- Status / flags
  published boolean default true,
  featured boolean default false,
  ai_generated boolean default true,

  -- Analytics
  views integer default 0,

  created_at timestamptz default now(),
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists blogs_slug_idx on public.blogs(slug);
create index if not exists blogs_published_idx on public.blogs(published_at desc) where published = true;
create index if not exists blogs_keyword_idx on public.blogs(trending_keyword);
create index if not exists blogs_category_idx on public.blogs(category);

-- ─────────────────────────────────────────────────────────────────────────
-- TREND LOGS — what we fetched / chose each run
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.trend_logs (
  id uuid primary key default gen_random_uuid(),
  fetch_date date default current_date,
  keywords jsonb not null default '[]',
  selected_keywords jsonb default '[]',
  blogs_generated integer default 0,
  error_message text,
  created_at timestamptz default now()
);

create index if not exists trend_logs_date_idx on public.trend_logs(fetch_date desc);

-- ─────────────────────────────────────────────────────────────────────────
-- BLOG ANALYTICS — per-view rows
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.blog_analytics (
  id uuid primary key default gen_random_uuid(),
  blog_id uuid references public.blogs(id) on delete cascade,
  blog_slug text not null,
  viewed_at timestamptz default now(),
  user_agent text,
  referrer text
);

create index if not exists analytics_blog_idx on public.blog_analytics(blog_id);
create index if not exists analytics_date_idx on public.blog_analytics(viewed_at desc);

-- ─────────────────────────────────────────────────────────────────────────
-- Atomic view increment (avoids read-modify-write races)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.increment_blog_views(p_blog_id uuid)
returns void
language sql
security definer
as $$
  update public.blogs set views = coalesce(views, 0) + 1 where id = p_blog_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
--   Public can read only published blogs and insert analytics rows.
--   Writes to blogs/trend_logs happen via the service-role key (bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.blogs enable row level security;
alter table public.trend_logs enable row level security;
alter table public.blog_analytics enable row level security;

drop policy if exists "blogs_public_read" on public.blogs;
create policy "blogs_public_read" on public.blogs
  for select using (published = true);

drop policy if exists "analytics_public_insert" on public.blog_analytics;
create policy "analytics_public_insert" on public.blog_analytics
  for insert with check (true);
