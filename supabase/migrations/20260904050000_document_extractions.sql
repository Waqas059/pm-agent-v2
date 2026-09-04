-- P0 document extraction and source locators.
--
-- Extracted text is workspace-scoped and is created by the authenticated
-- application server after reading the matching private Storage object.

create unique index documents_workspace_id_id_key
  on public.documents (workspace_id, id);

create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  extracted_text text not null check (char_length(trim(extracted_text)) between 1 and 500000),
  locators jsonb not null default '[]'::jsonb,
  extractor text not null check (char_length(trim(extractor)) between 1 and 100),
  page_count integer check (page_count is null or page_count > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (workspace_id, document_id)
    references public.documents (workspace_id, id)
    on delete cascade
);

create index document_extractions_workspace_updated_at_idx
  on public.document_extractions (workspace_id, updated_at desc);

create or replace function private.prevent_document_extraction_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.document_id <> old.document_id or new.workspace_id <> old.workspace_id then
    raise exception 'document extraction identity cannot be changed';
  end if;

  return new;
end;
$$;

create trigger document_extractions_set_updated_at
before update on public.document_extractions
for each row execute function public.set_updated_at();

create trigger prevent_document_extraction_identity_change
before update on public.document_extractions
for each row execute function private.prevent_document_extraction_identity_change();

alter table public.document_extractions enable row level security;

revoke all on table public.document_extractions from anon, authenticated;
grant select, insert, update on table public.document_extractions to authenticated;

create policy "Workspace members can view document extractions"
  on public.document_extractions for select to authenticated
  using (private.is_workspace_member(workspace_id));

create policy "Editors can create document extractions"
  on public.document_extractions for insert to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and created_by = (select auth.uid())
  );

create policy "Creators and owners can update document extractions"
  on public.document_extractions for update to authenticated
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
