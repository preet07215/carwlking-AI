-- Run this in the Supabase SQL editor (or via supabase db push) before using cloud history.

create table if not exists public.extraction_history (
  id uuid primary key,
  url text not null,
  status text not null check (status in ('completed', 'running', 'failed')),
  duration_ms integer not null default 0,
  created_at timestamptz not null default now(),
  result_text text
);

create index if not exists extraction_history_created_at_idx
  on public.extraction_history (created_at desc);

comment on table public.extraction_history is 'AI extraction runs persisted from the extraction dashboard.';

-- Writes use the service role from Next.js API routes (bypasses RLS). Lock down anon access:
alter table public.extraction_history enable row level security;

-- No policies for anon/authenticated users; only the service role key (server-side) may read/write.
