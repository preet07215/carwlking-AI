-- Optional columns for extraction context (model, proxy, prompt).
-- Apply in Supabase SQL editor or via supabase db push after 001.

alter table public.extraction_history
  add column if not exists prompt text;

alter table public.extraction_history
  add column if not exists model_id text;

alter table public.extraction_history
  add column if not exists use_proxy boolean not null default false;

comment on column public.extraction_history.prompt is 'User extraction instruction.';
comment on column public.extraction_history.model_id is 'Chat completion model id passed to Hermes.';
comment on column public.extraction_history.use_proxy is 'Whether Oxylabs web unblocker headers were used.';
