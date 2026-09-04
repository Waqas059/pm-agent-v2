-- Workflow run persistence and chain state.
--
-- Runs and steps are workspace-scoped so a future long-chain executor can
-- resume, inspect, and retry work without moving product data across tenants.
-- Inputs and outputs are intentionally stored as JSONB; callers must avoid
-- putting credentials or unnecessary sensitive data into these payloads.

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_name text not null check (workflow_name in (
    'pm_chain',
    'discover_synthesize',
    'define_specify',
    'align_communicate'
  )),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  input jsonb not null,
  output jsonb,
  error_message text,
  created_by uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, id)
);

create table public.workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null,
  workspace_id uuid not null,
  step_key text not null check (step_key in ('discover', 'define', 'align', 'artifact_persist')),
  step_order smallint not null check (step_order > 0),
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  input jsonb not null,
  output jsonb,
  error_message text,
  created_by uuid not null references auth.users(id) on delete restrict,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workflow_run_id, step_key),
  unique (workflow_run_id, step_order),
  foreign key (workspace_id, workflow_run_id)
    references public.workflow_runs (workspace_id, id)
    on delete cascade
);

create or replace function private.prevent_workflow_run_workspace_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.workspace_id <> old.workspace_id then
    raise exception 'workflow run workspace cannot be changed';
  end if;

  return new;
end;
$$;

create or replace function private.prevent_workflow_step_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.workflow_run_id <> old.workflow_run_id
    or new.workspace_id <> old.workspace_id
    or new.step_key <> old.step_key
    or new.step_order <> old.step_order then
    raise exception 'workflow step identity cannot be changed';
  end if;

  return new;
end;
$$;

create index workflow_runs_workspace_updated_at_idx
  on public.workflow_runs (workspace_id, updated_at desc);
create index workflow_run_steps_run_order_idx
  on public.workflow_run_steps (workflow_run_id, step_order);
create index workflow_run_steps_workspace_updated_at_idx
  on public.workflow_run_steps (workspace_id, updated_at desc);

create trigger workflow_runs_set_updated_at
before update on public.workflow_runs
for each row execute function public.set_updated_at();

create trigger workflow_run_steps_set_updated_at
before update on public.workflow_run_steps
for each row execute function public.set_updated_at();

create trigger prevent_workflow_run_workspace_change
before update on public.workflow_runs
for each row execute function private.prevent_workflow_run_workspace_change();

create trigger prevent_workflow_step_identity_change
before update on public.workflow_run_steps
for each row execute function private.prevent_workflow_step_identity_change();

alter table public.workflow_runs enable row level security;
alter table public.workflow_run_steps enable row level security;

revoke all on table public.workflow_runs from anon, authenticated;
revoke all on table public.workflow_run_steps from anon, authenticated;
grant select, insert, update, delete on table public.workflow_runs to authenticated;
grant select, insert, update, delete on table public.workflow_run_steps to authenticated;

create policy "Workspace members can view workflow runs"
  on public.workflow_runs for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Editors can create workflow runs"
  on public.workflow_runs for insert to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and created_by = (select auth.uid())
  );

create policy "Run creators and owners can update workflow runs"
  on public.workflow_runs for update to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or (
      private.has_workspace_role(workspace_id, array['owner', 'member'])
      and created_by = (select auth.uid())
    )
  )
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and (
      private.is_workspace_owner(workspace_id)
      or created_by = (select auth.uid())
    )
  );

create policy "Run creators and owners can delete workflow runs"
  on public.workflow_runs for delete to authenticated
  using (private.is_workspace_owner(workspace_id) or created_by = (select auth.uid()));

create policy "Workspace members can view workflow steps"
  on public.workflow_run_steps for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Editors can create workflow steps"
  on public.workflow_run_steps for insert to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and created_by = (select auth.uid())
  );

create policy "Step creators and owners can update workflow steps"
  on public.workflow_run_steps for update to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or (
      private.has_workspace_role(workspace_id, array['owner', 'member'])
      and created_by = (select auth.uid())
    )
  )
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and (
      private.is_workspace_owner(workspace_id)
      or created_by = (select auth.uid())
    )
  );

create policy "Step creators and owners can delete workflow steps"
  on public.workflow_run_steps for delete to authenticated
  using (private.is_workspace_owner(workspace_id) or created_by = (select auth.uid()));
