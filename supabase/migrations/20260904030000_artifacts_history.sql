-- T14: Durable generated artifacts, version history, and export support.
-- Generated content remains reviewable and workspace-scoped; it is never sent automatically.

create type public.artifact_kind as enum ('product_brief', 'communication_message');

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind public.artifact_kind not null,
  title text not null check (char_length(trim(title)) between 1 and 300),
  source_workflow text not null check (source_workflow in ('define_specify', 'align_communicate')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.artifact_versions (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  version integer not null check (version > 0),
  content jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (artifact_id, version)
);

create index artifacts_workspace_updated_at_idx on public.artifacts (workspace_id, updated_at desc);
create index artifact_versions_artifact_version_idx on public.artifact_versions (artifact_id, version desc);

create trigger artifacts_set_updated_at
before update on public.artifacts
for each row execute function public.set_updated_at();

alter table public.artifacts enable row level security;
alter table public.artifact_versions enable row level security;

revoke all on table public.artifacts from anon, authenticated;
revoke all on table public.artifact_versions from anon, authenticated;
grant select, insert, update, delete on table public.artifacts to authenticated;
grant select, insert on table public.artifact_versions to authenticated;

create policy "Workspace members can view artifacts"
  on public.artifacts for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Editors can create artifacts"
  on public.artifacts for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and created_by = (select auth.uid()));

create policy "Editors can update artifacts"
  on public.artifacts for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'member']))
  with check (private.has_workspace_role(workspace_id, array['owner', 'member']));

create policy "Editors can delete artifacts"
  on public.artifacts for delete to authenticated
  using (private.is_workspace_owner(workspace_id) or created_by = (select auth.uid()));

create policy "Workspace members can view artifact versions"
  on public.artifact_versions for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Editors can create artifact versions"
  on public.artifact_versions for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner', 'member']) and created_by = (select auth.uid()));
