-- Make durable decisions and assumptions searchable as workspace memory.
-- The generated vectors contain only workspace-owned record text and remain
-- protected by the existing RLS policies.

alter table public.decision_records
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(decision, '') || ' ' || coalesce(rationale, '') || ' ' || coalesce(risk_notes, ''))
  ) stored;

alter table public.assumptions
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(statement, '') || ' ' || coalesce(validation_plan, '') || ' ' || coalesce(owner, ''))
  ) stored;

create index if not exists decision_records_search_vector_idx
  on public.decision_records using gin (search_vector);

create index if not exists assumptions_search_vector_idx
  on public.assumptions using gin (search_vector);

