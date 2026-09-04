-- PM Agent V2 core schema.
-- RLS and authorization policies are intentionally added in T04.

create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  slug text not null check (
    char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (slug)
);

comment on table public.workspaces is
  'A durable product workspace containing context and future PM artifacts.';

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member', 'viewer')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

comment on table public.workspace_members is
  'Workspace membership; authorization policies are added in T04.';

create table public.context_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  category text not null check (
    category in (
      'product',
      'goals',
      'personas',
      'strategy',
      'constraints',
      'metrics',
      'decisions',
      'assumptions'
    )
  ),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  content text not null check (char_length(btrim(content)) between 1 and 50000),
  source_type text not null check (source_type in ('user_input', 'imported', 'generated')),
  provenance jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.context_items is
  'Structured product context that future workflows can reuse and cite.';

create index workspaces_owner_id_idx on public.workspaces(owner_id);
create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index context_items_workspace_category_idx
  on public.context_items(workspace_id, category);

create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger set_context_items_updated_at
before update on public.context_items
for each row execute function public.set_updated_at();
