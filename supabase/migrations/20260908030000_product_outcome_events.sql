-- Add privacy-safe outcome events for artifact reuse and export measurement.
-- These events contain only event metadata; artifact content is never stored.

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
    'document_uploaded',
    'document_extraction_completed',
    'document_extraction_failed',
    'onboarding_started',
    'onboarding_completed'
  ));
