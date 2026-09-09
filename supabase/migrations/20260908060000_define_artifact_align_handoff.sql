-- Allow an approved Define artifact to become structured input to Align.
-- Existing Discover handoffs remain valid; this is an additive provenance extension.

alter table public.workflow_handoffs
  drop constraint if exists workflow_handoffs_source_workflow_check;

alter table public.workflow_handoffs
  add constraint workflow_handoffs_source_workflow_check
  check (source_workflow in ('discover_synthesize', 'define_specify'));

alter table public.workflow_handoffs
  add column if not exists source_artifact_id uuid references public.artifacts(id) on delete set null;

create index if not exists workflow_handoffs_source_artifact_idx
  on public.workflow_handoffs (source_artifact_id)
  where source_artifact_id is not null;

