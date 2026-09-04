-- T07: File upload and document handling.
--
-- Documents are private workspace assets. Metadata is kept in public.documents
-- while file bytes live in the private Storage bucket with matching policies.

create type public.document_status as enum ('uploaded', 'processing', 'ready', 'failed');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  original_name text not null check (char_length(trim(original_name)) between 1 and 255),
  storage_path text not null check (char_length(trim(storage_path)) between 1 and 1024),
  mime_type text not null check (char_length(trim(mime_type)) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 6291456),
  status public.document_status not null default 'uploaded',
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, storage_path)
);

create index documents_workspace_id_created_at_idx
  on public.documents (workspace_id, created_at desc);

create index documents_uploaded_by_idx
  on public.documents (uploaded_by);

create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'documents',
  'documents',
  false,
  6291456,
  array[
    'application/json',
    'application/msword',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/markdown',
    'text/plain'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.documents enable row level security;

revoke all on table public.documents from anon, authenticated;
grant select, insert, delete on table public.documents to authenticated;

drop policy if exists "Workspace members can view documents" on public.documents;
create policy "Workspace members can view documents"
  on public.documents
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

drop policy if exists "Editors can register documents" on public.documents;
create policy "Editors can register documents"
  on public.documents
  for insert
  to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and uploaded_by = (select auth.uid())
  );

drop policy if exists "Editors can delete documents" on public.documents;
create policy "Editors can delete documents"
  on public.documents
  for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    or uploaded_by = (select auth.uid())
  );

drop policy if exists "Workspace members can read documents" on storage.objects;
create policy "Workspace members can read documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and private.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Editors can upload documents" on storage.objects;
create policy "Editors can upload documents"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and private.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner', 'member'])
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

drop policy if exists "Workspace editors can delete documents" on storage.objects;
create policy "Workspace editors can delete documents"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (
      private.is_workspace_owner(((storage.foldername(name))[1])::uuid)
      or (storage.foldername(name))[2] = (select auth.uid())::text
    )
  );
