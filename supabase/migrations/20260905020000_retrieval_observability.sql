-- P1 retrieval quality and privacy-preserving workflow observability.

alter table public.context_items
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored;

create index if not exists context_items_search_vector_idx
  on public.context_items using gin (search_vector);

alter table public.document_extractions
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(extracted_text, ''))
  ) stored;

create index if not exists document_extractions_search_vector_idx
  on public.document_extractions using gin (search_vector);

alter table public.workflow_runs
  add column if not exists provider text not null default 'openai_responses' check (provider in ('openai_responses')),
  add column if not exists model text,
  add column if not exists duration_ms integer check (duration_ms is null or duration_ms >= 0),
  add column if not exists input_chars integer check (input_chars is null or input_chars >= 0),
  add column if not exists output_chars integer check (output_chars is null or output_chars >= 0),
  add column if not exists tool_names text[] not null default '{}'::text[];

create index if not exists workflow_runs_workspace_provider_idx
  on public.workflow_runs (workspace_id, provider, created_at desc);
