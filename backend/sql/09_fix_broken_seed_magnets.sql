-- Migration 09 — deactivate the original PDF seed magnets.
--
-- WHY this exists:
--   02_seed_lead_magnets.sql inserted three magnets with pdf_url values like
--   '/assets/pdfs/mass-gain-guide.pdf'. Those PDFs were never dropped into
--   frontend/public/assets/pdfs/, so submitting any of those forms emails a
--   link that 404s.
--
--   The lead-magnet workflow now lives on the admin UI: Ron creates a magnet
--   at /admin/content/new, picks "External Link", and pastes his Google
--   Drive / Dropbox / Notion / etc URL. The unique sharable URL is
--   bigronjones.com/free/<slug>.
--
--   This migration deactivates only the broken seed rows. If Ron has already
--   replaced any pdf_url with a working https:// link (Drive, S3, anywhere),
--   that row stays active.
--
-- Run ONCE in Supabase → SQL Editor → New query.
-- Idempotent: re-running it is a no-op.

update public.lead_magnets
set
  active = false,
  updated_at = now()
where slug in ('mass-gain-guide', 'fat-loss-blueprint', 'sleep-recovery-guide')
  and pdf_url like '/assets/pdfs/%';
