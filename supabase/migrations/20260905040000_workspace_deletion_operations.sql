-- Owner-controlled workspace deletion audit records.
-- The table intentionally has no foreign key to workspaces so a completed
-- deletion can retain its minimal audit record after the workspace is gone.

create table public.workspace_deletion_operations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status text not null check (status in ('started', 'completed', 'failed')),
  record_counts jsonb not null default '{}'::jsonb,
  storage_object_count integer not null default 0 check (storage_object_count >= 0),
  failure_reason text,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create index workspace_deletion_operations_requested_by_idx
  on public.workspace_deletion_operations(requested_by, started_at desc);

alter table public.workspace_deletion_operations enable row level security;

revoke all on table public.workspace_deletion_operations from anon, authenticated;
grant select, insert, update on table public.workspace_deletion_operations to authenticated;

create policy "Owners can view deletion operations"
  on public.workspace_deletion_operations
  for select
  to authenticated
  using (requested_by = (select auth.uid()) or private.is_workspace_owner(workspace_id));

create policy "Owners can create deletion operations"
  on public.workspace_deletion_operations
  for insert
  to authenticated
  with check (
    requested_by = (select auth.uid())
    and private.is_workspace_owner(workspace_id)
  );

create policy "Requesters can update deletion operations"
  on public.workspace_deletion_operations
  for update
  to authenticated
  using (requested_by = (select auth.uid()))
  with check (requested_by = (select auth.uid()));
