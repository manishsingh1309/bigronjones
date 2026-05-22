-- BIGRONJONES Lead-Funnel Schema
-- Run once in Supabase SQL Editor to provision the tables, indexes,
-- and Row Level Security policies for the lead-generation funnel.

-- =====================================================================
-- LEAD MAGNETS — one row per free offer (e-book, guide, etc.)
-- =====================================================================
create table if not exists public.lead_magnets (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  description text,
  pdf_url text not null,
  cover_image_url text,
  category text default 'fitness',
  target_audience text default '35+',
  email_subject text,
  email_preview text,
  active boolean default true,
  download_count integer default 0,
  created_at timestamptz default now()
);

-- =====================================================================
-- LEADS — one row per (email, magnet) submission
-- =====================================================================
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,

  full_name text not null,
  email text not null,
  phone text,

  lead_magnet_id uuid references public.lead_magnets(id),
  lead_magnet_slug text,
  source text default 'website',
  utm_source text,
  utm_campaign text,
  utm_content text,
  referrer_url text,

  status text default 'new',
  email_verified boolean default false,
  pdf_sent boolean default false,
  pdf_sent_at timestamptz,

  sequence_day integer default 0,
  sequence_paused boolean default false,
  last_email_sent_at timestamptz,
  next_email_due_at timestamptz,

  emails_opened integer default 0,
  emails_clicked integer default 0,
  converted_to_customer boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(email, lead_magnet_slug)
);

create index if not exists leads_email_idx on public.leads(email);
create index if not exists leads_next_email_idx
  on public.leads(next_email_due_at)
  where sequence_paused = false;
create index if not exists leads_lead_magnet_idx on public.leads(lead_magnet_id);

-- =====================================================================
-- EMAIL SEQUENCES — pre-written nurture emails per magnet
-- body_html stores prose with `||` as the paragraph delimiter.
-- =====================================================================
create table if not exists public.email_sequences (
  id uuid default gen_random_uuid() primary key,
  lead_magnet_id uuid references public.lead_magnets(id),
  day_number integer not null,
  subject text not null,
  preview_text text,
  body_html text not null,
  body_text text,
  cta_text text,
  cta_url text,
  active boolean default true,
  created_at timestamptz default now(),
  unique(lead_magnet_id, day_number)
);

-- =====================================================================
-- BLOG POSTS — used by the optional Supabase-backed blog generator
-- =====================================================================
create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  tags text[] default '{}',
  author text default 'Big Ron Jones',
  read_time integer default 4,
  published boolean default false,
  published_at timestamptz,
  ai_generated boolean default true,
  featured_image text,
  seo_title text,
  seo_description text,
  views integer default 0,
  created_at timestamptz default now()
);

create index if not exists blog_published_idx
  on public.blog_posts(published_at desc)
  where published = true;

-- =====================================================================
-- ROW LEVEL SECURITY — leads/sequences are server-only;
-- magnets and published blogs are publicly readable.
-- =====================================================================
alter table public.lead_magnets enable row level security;
drop policy if exists "Lead magnets are public" on public.lead_magnets;
create policy "Lead magnets are public"
  on public.lead_magnets for select
  using (active = true);

alter table public.leads enable row level security;
-- No public policies — all writes/reads happen server-side via service role.

alter table public.blog_posts enable row level security;
drop policy if exists "Published posts are public" on public.blog_posts;
create policy "Published posts are public"
  on public.blog_posts for select
  using (published = true);

alter table public.email_sequences enable row level security;
-- No public policies — sequences are operational data, not user-facing.
