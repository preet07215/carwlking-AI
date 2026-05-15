-- Run once in Supabase → SQL Editor so the app can persist model, proxy, and pricing.
-- If these columns are missing, POST /api/history may fail silently in the UI.

alter table public.extraction_history
  add column if not exists prompt text;

alter table public.extraction_history
  add column if not exists model_id text;

alter table public.extraction_history
  add column if not exists use_proxy boolean not null default false;

alter table public.extraction_history
  add column if not exists pricing_summary text;

comment on column public.extraction_history.prompt is 'User extraction instruction.';
comment on column public.extraction_history.model_id is 'Chat model id (e.g. OpenRouter id) sent to Hermes.';
comment on column public.extraction_history.use_proxy is 'Whether Oxylabs web unblocker headers were used.';
comment on column public.extraction_history.pricing_summary is 'List-price label snapshot for the model at run time.';
