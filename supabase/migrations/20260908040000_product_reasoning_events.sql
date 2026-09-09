-- Add privacy-safe signals for evidence inspection and human reasoning records.

alter table public.product_events
  drop constraint if exists product_events_event_name_check;

alter table public.product_events
  add constraint product_events_event_name_check check (event_name in (
    'workspace_viewed',
    'workflow_started',
    'workflow_completed',
    'workflow_failed',
    'artifact_created',
    'artifact_version_created',
    'artifact_exported',
    'evidence_citation_inspected',
    'decision_created',
    'assumption_created',
    'document_uploaded',
    'document_extraction_completed',
    'document_extraction_failed',
    'onboarding_started',
    'onboarding_completed'
  ));
