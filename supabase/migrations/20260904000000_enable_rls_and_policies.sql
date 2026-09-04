-- T04: Authorization and Row Level Security.
--
-- The public tables are protected for authenticated users only. Membership
-- checks live in the private schema so policies do not recursively evaluate
-- the membership table through the public API.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspaces
    where id = target_workspace_id
      and owner_id = (select auth.uid())
  );
$$;

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.has_workspace_role(
  target_workspace_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role = any (allowed_roles)
  );
$$;

create or replace function private.add_workspace_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

create or replace function private.prevent_workspace_membership_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.workspace_id <> old.workspace_id or new.user_id <> old.user_id then
    raise exception 'workspace membership identity cannot be changed';
  end if;

  return new;
end;
$$;

create or replace function private.prevent_context_workspace_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.workspace_id <> old.workspace_id then
    raise exception 'context item workspace cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function private.is_workspace_owner(uuid) from public;
revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.has_workspace_role(uuid, text[]) from public;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, text[]) to authenticated;

drop trigger if exists add_workspace_owner_membership on public.workspaces;
create trigger add_workspace_owner_membership
  after insert on public.workspaces
  for each row
  execute function private.add_workspace_owner_membership();

drop trigger if exists prevent_workspace_membership_identity_change on public.workspace_members;
create trigger prevent_workspace_membership_identity_change
  before update on public.workspace_members
  for each row
  execute function private.prevent_workspace_membership_identity_change();

drop trigger if exists prevent_context_workspace_change on public.context_items;
create trigger prevent_context_workspace_change
  before update on public.context_items
  for each row
  execute function private.prevent_context_workspace_change();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.context_items enable row level security;

-- Keep the client roles least-privileged. service_role is intentionally not
-- revoked here because server-side administrative operations bypass RLS.
revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.context_items from anon, authenticated;

grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, update, delete on table public.context_items to authenticated;

drop policy if exists "Workspace members can view workspaces" on public.workspaces;
create policy "Workspace members can view workspaces"
  on public.workspaces
  for select
  to authenticated
  using (private.is_workspace_member(id));

drop policy if exists "Users can create owned workspaces" on public.workspaces;
create policy "Users can create owned workspaces"
  on public.workspaces
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can update workspaces" on public.workspaces;
create policy "Owners can update workspaces"
  on public.workspaces
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete workspaces" on public.workspaces;
create policy "Owners can delete workspaces"
  on public.workspaces
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Workspace members can view memberships" on public.workspace_members;
create policy "Workspace members can view memberships"
  on public.workspace_members
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

drop policy if exists "Owners can add memberships" on public.workspace_members;
create policy "Owners can add memberships"
  on public.workspace_members
  for insert
  to authenticated
  with check (
    private.is_workspace_owner(workspace_id)
    and role in ('member', 'viewer')
    and user_id <> (select auth.uid())
  );

drop policy if exists "Owners can update memberships" on public.workspace_members;
create policy "Owners can update memberships"
  on public.workspace_members
  for update
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    and role <> 'owner'
  )
  with check (
    private.is_workspace_owner(workspace_id)
    and role in ('member', 'viewer')
    and user_id <> (select auth.uid())
  );

drop policy if exists "Owners can remove memberships" on public.workspace_members;
create policy "Owners can remove memberships"
  on public.workspace_members
  for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id)
    and role <> 'owner'
  );

drop policy if exists "Workspace members can view context" on public.context_items;
create policy "Workspace members can view context"
  on public.context_items
  for select
  to authenticated
  using (private.is_workspace_member(workspace_id));

drop policy if exists "Editors can create context" on public.context_items;
create policy "Editors can create context"
  on public.context_items
  for insert
  to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and (created_by is null or created_by = (select auth.uid()))
    and (updated_by is null or updated_by = (select auth.uid()))
  );

drop policy if exists "Editors can update context" on public.context_items;
create policy "Editors can update context"
  on public.context_items
  for update
  to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'member']))
  with check (
    private.has_workspace_role(workspace_id, array['owner', 'member'])
    and (created_by is null or created_by = (select auth.uid()))
    and (updated_by is null or updated_by = (select auth.uid()))
  );

drop policy if exists "Editors can delete context" on public.context_items;
create policy "Editors can delete context"
  on public.context_items
  for delete
  to authenticated
  using (private.has_workspace_role(workspace_id, array['owner', 'member']));
