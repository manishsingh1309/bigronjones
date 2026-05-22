-- Migration 06 — Multi-type content support for the admin dashboard.
--
-- Backwards compatible:
--   • existing lead_magnets rows (PDFs) keep working as `type='pdf'`
--   • pdf_url stays where it is — for non-PDF types we use external_url
--   • everything new is nullable
--
-- Run once in Supabase SQL Editor.

-- ── Extend lead_magnets ────────────────────────────────────────────────────
alter table public.lead_magnets
  add column if not exists type text default 'pdf'
    check (type in ('pdf', 'ebook', 'youtube', 'url', 'file')),
  add column if not exists external_url text,
  add column if not exists cta_text text,
  add column if not exists view_count integer default 0,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_at timestamptz default now();

-- pdf_url was NOT NULL in the original schema. Now that we support
-- non-PDF content (YouTube etc) we relax that. Existing rows keep
-- their value, so this is a no-op for current data.
alter table public.lead_magnets
  alter column pdf_url drop not null;

-- Backfill: any existing row with a pdf_url is a 'pdf' type.
update public.lead_magnets
set type = 'pdf'
where type is null and pdf_url is not null;

-- Auto-bump updated_at on row writes.
create or replace function public.lead_magnets_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists lead_magnets_updated_at on public.lead_magnets;
create trigger lead_magnets_updated_at
  before update on public.lead_magnets
  for each row execute function public.lead_magnets_set_updated_at();

-- ── Storage bucket for uploaded PDFs / ebooks / files ─────────────────────
-- Public read so users can download via the email link.
-- Only service-role (server) can write — uploads go through our admin API.
insert into storage.buckets (id, name, public, file_size_limit)
values ('content-files', 'content-files', true, 52428800)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- Public read policy (anyone with the URL can download).
drop policy if exists "Public can read content-files" on storage.objects;
create policy "Public can read content-files"
  on storage.objects for select
  using (bucket_id = 'content-files');

-- Service role bypasses RLS, so no insert/update/delete policy is needed.
-- Browser uploads happen via our /api/admin/upload-url endpoint which
-- mints a signed URL using the service role.
