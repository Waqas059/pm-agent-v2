-- Add privacy-safe provider quality signals for review-only market research.
-- Counts and latency are stored; prompts, findings, sources, and provider
-- payloads are never stored in product analytics.

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
    'market_research_completed',
    'market_research_failed',
    'onboarding_started',
    'onboarding_completed'
  ));
