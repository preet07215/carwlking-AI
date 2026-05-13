-- Add extraction prompt; existing rows get NULL prompt.

alter table public.extraction_history
  add column if not exists prompt text;

comment on column public.extraction_history.prompt is 'User extraction instructions (saved when the run starts).';
