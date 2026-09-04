-- P1 workflow handoffs, decision records, and assumption registry.

create table public.workflow_handoffs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_run_id uuid references public.workflow_runs(id) on delete set null,
  source_workflow text not null check (source_workflow = 'discover_synthesize'),
  target_workflow text not null check (target_workflow in ('define_specify', 'align_communicate')),
  status text not null default 'approved' check (status in ('approved', 'rejected', 'consumed')),
  payload jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, id),
  foreign key (workspace_id, source_run_id) references public.workflow_runs(workspace_id, id) on delete set null
);

create table public.decision_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 200),
  decision text not null check (char_length(trim(decision)) between 1 and 5000),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'superseded', 'reversed')),
  alternatives jsonb not null default '[]'::jsonb,
  rationale text not null check (char_length(trim(rationale)) between 1 and 5000),
  assumption_ids uuid[] not null default '{}'::uuid[],
  evidence_ids uuid[] not null default '{}'::uuid[],
  risk_notes text not null default '' check (char_length(risk_notes) <= 5000),
  artifact_ids uuid[] not null default '{}'::uuid[],
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, id)
);

create table public.assumptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  statement text not null check (char_length(trim(statement)) between 1 and 3000),
  status text not null default 'unvalidated' check (status in ('unvalidated', 'validated', 'invalidated')),
  impact text not null default 'medium' check (impact in ('low', 'medium', 'high')),
  validation_plan text not null check (char_length(trim(validation_plan)) between 1 and 3000),
  owner text not null default '' check (char_length(owner) <= 200),
  due_date date,
  evidence_ids uuid[] not null default '{}'::uuid[],
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, id)
);

create index workflow_handoffs_workspace_updated_at_idx on public.workflow_handoffs (workspace_id, updated_at desc);
create index decision_records_workspace_updated_at_idx on public.decision_records (workspace_id, updated_at desc);
create index assumptions_workspace_updated_at_idx on public.assumptions (workspace_id, updated_at desc);

create or replace function private.prevent_p1_record_identity_change()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.workspace_id <> old.workspace_id then raise exception 'record workspace cannot be changed'; end if;
  return new;
end;
$$;

create trigger workflow_handoffs_set_updated_at before update on public.workflow_handoffs for each row execute function public.set_updated_at();
create trigger decision_records_set_updated_at before update on public.decision_records for each row execute function public.set_updated_at();
create trigger assumptions_set_updated_at before update on public.assumptions for each row execute function public.set_updated_at();
create trigger workflow_handoffs_identity_guard before update on public.workflow_handoffs for each row execute function private.prevent_p1_record_identity_change();
create trigger decision_records_identity_guard before update on public.decision_records for each row execute function private.prevent_p1_record_identity_change();
create trigger assumptions_identity_guard before update on public.assumptions for each row execute function private.prevent_p1_record_identity_change();

alter table public.workflow_handoffs enable row level security;
alter table public.decision_records enable row level security;
alter table public.assumptions enable row level security;
revoke all on table public.workflow_handoffs, public.decision_records, public.assumptions from anon, authenticated;
grant select, insert, update on table public.workflow_handoffs, public.decision_records, public.assumptions to authenticated;

create policy "Workspace members can view workflow handoffs" on public.workflow_handoffs for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Editors can create workflow handoffs" on public.workflow_handoffs for insert to authenticated with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and created_by = (select auth.uid()) and approved_by = (select auth.uid()));
create policy "Creators and owners can update workflow handoffs" on public.workflow_handoffs for update to authenticated using (private.is_workspace_owner(workspace_id) or (private.has_workspace_role(workspace_id, array['owner', 'member']) and created_by = (select auth.uid()))) with check (private.has_workspace_role(workspace_id, array['owner', 'member']));

create policy "Workspace members can view decision records" on public.decision_records for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Editors can create decision records" on public.decision_records for insert to authenticated with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Editors can update decision records" on public.decision_records for update to authenticated using (private.has_workspace_role(workspace_id, array['owner', 'member'])) with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and updated_by = (select auth.uid()));

create policy "Workspace members can view assumptions" on public.assumptions for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Editors can create assumptions" on public.assumptions for insert to authenticated with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Editors can update assumptions" on public.assumptions for update to authenticated using (private.has_workspace_role(workspace_id, array['owner', 'member'])) with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and updated_by = (select auth.uid()));
