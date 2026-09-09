-- Privacy-aware product analytics for activation, workflow conversion, and
-- outcome measurement. Event properties must not contain prompts, outputs,
-- credentials, source content, or other sensitive workspace data.

create table public.product_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null check (event_name in (
    'workspace_viewed',
    'workflow_started',
    'workflow_completed',
    'workflow_failed',
    'artifact_created',
    'document_uploaded',
    'document_extraction_completed',
    'document_extraction_failed',
    'onboarding_started',
    'onboarding_completed'
  )),
  surface text not null check (char_length(surface) between 1 and 80),
  workflow_name text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index product_events_workspace_created_idx
  on public.product_events (workspace_id, created_at desc);

create index product_events_workspace_event_idx
  on public.product_events (workspace_id, event_name, created_at desc);

alter table public.product_events enable row level security;

revoke all on table public.product_events from anon, authenticated;
grant select, insert on table public.product_events to authenticated;

create policy "Workspace members can view product events"
  on public.product_events
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Workspace members can record product events"
  on public.product_events
  for insert
  to authenticated
  with check (
    private.is_workspace_member(workspace_id)
    and user_id = (select auth.uid())
  );
