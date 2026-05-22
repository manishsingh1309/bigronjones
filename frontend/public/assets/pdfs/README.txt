Drop the actual lead-magnet PDFs into this folder before launching.

Expected filenames (must match the pdf_url values inserted into Supabase
public.lead_magnets):

  mass-gain-guide.pdf
  fat-loss-blueprint.pdf
  sleep-recovery-guide.pdf

Anything in /frontend/public/ is served at the site root, so the file at
/frontend/public/assets/pdfs/mass-gain-guide.pdf becomes
https://yoursite.com/assets/pdfs/mass-gain-guide.pdf at runtime.
