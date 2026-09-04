-- T08: Evidence retrieval and citation model.
--
-- This migration stores human-confirmed evidence and its source references.
-- It does not extract, summarize, or invent evidence from uploaded documents.

create type public.evidence_kind as enum ('quote', 'observation', 'metric');

create table public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  kind public.evidence_kind not null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  content text not null check (char_length(trim(content)) between 1 and 20000),
  source_label text not null check (char_length(trim(source_label)) between 1 and 255),
  source_locator jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(source_label, ''))
  ) stored
);

create index evidence_items_workspace_created_at_idx
  on public.evidence_items (workspace_id, created_at desc);

create index evidence_items_document_id_idx
  on public.evidence_items (document_id);

create index evidence_items_search_vector_idx
  on public.evidence_items using gin (search_vector);

create trigger evidence_items_set_updated_at
  before update on public.evidence_items
  for each row
  execute function public.set_updated_at();

create table public.evidence_citations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  evidence_item_id uuid not null references public.evidence_items(id) on delete cascade,
  citation_key text not null check (citation_key ~ '^CIT-[A-Z0-9]{6,32}$'),
  label text not null check (char_length(trim(label)) between 1 and 255),
  locator jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, citation_key),
  unique (evidence_item_id)
);

create index evidence_citations_workspace_idx
  on public.evidence_citations (workspace_id, created_at desc);

create index evidence_citations_evidence_item_idx
  on public.evidence_citations (evidence_item_id);

alter table public.evidence_items enable row level security;
alter table public.evidence_citations enable row level security;

revoke all on table public.evidence_items from anon, authenticated;
revoke all on table public.evidence_citations from anon, authenticated;
grant select, insert, update, delete on table public.evidence_items to authenticated;
grant select, insert, delete on table public.evidence_citations to authenticated;

drop policy if exists "Workspace members can view evidence" on public.evidence_items;
create policy "Workspace members can view evidence"
  on public.evidence_items
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

drop policy if exists "Editors can create evidence" on public.evidence_items;
create policy "Editors can create evidence"
  on public.evidence_items
  for insert
  to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and created_by = (select auth.uid())
  );

drop policy if exists "Editors can update evidence" on public.evidence_items;
create policy "Editors can update evidence"
  on public.evidence_items
  for update
  to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'member']))
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and created_by = (select auth.uid())
  );

drop policy if exists "Editors can delete evidence" on public.evidence_items;
create policy "Editors can delete evidence"
  on public.evidence_items
  for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or created_by = (select auth.uid())
  );

drop policy if exists "Workspace members can view citations" on public.evidence_citations;
create policy "Workspace members can view citations"
  on public.evidence_citations
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

drop policy if exists "Editors can create citations" on public.evidence_citations;
create policy "Editors can create citations"
  on public.evidence_citations
  for insert
  to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and created_by = (select auth.uid())
  );

drop policy if exists "Editors can delete citations" on public.evidence_citations;
create policy "Editors can delete citations"
  on public.evidence_citations
  for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or created_by = (select auth.uid())
  );
