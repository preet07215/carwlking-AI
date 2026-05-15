-- Add pricing snapshot (run-time OpenRouter list price label).
-- Run in Supabase SQL Editor if these columns are missing (Table Editor refresh).

alter table public.extraction_history
  add column if not exists pricing_summary text;

comment on column public.extraction_history.pricing_summary is 'Optional list-pricing label for the model (e.g. OpenRouter) at run time.';
