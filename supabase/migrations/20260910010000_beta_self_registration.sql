-- Public beta registration is server-authorized and starts in a non-active state.
-- Authentication matching promotes a participant to active when they enter the product.

alter table public.beta_participants
  drop constraint if exists beta_participants_status_check;

alter table public.beta_participants
  add constraint beta_participants_status_check
  check (status in ('invited', 'registered', 'pending_access', 'active', 'paused', 'declined'));

create or replace function public.get_my_beta_participant()
returns table (
  id uuid,
  full_name text,
  preferred_name text,
  email text,
  status text,
  request_allowance integer,
  country_code text,
  country_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
begin
  update public.beta_participants
  set auth_user_id = current_user_id,
      status = case when status in ('registered', 'pending_access') then 'active' else status end,
      updated_at = timezone('utc', now())
  where current_user_id is not null
    and lower(email) = current_email
    and (auth_user_id is null or auth_user_id = current_user_id);

  return query
  select p.id, p.full_name, p.preferred_name, p.email, p.status,
    p.request_allowance, p.country_code, p.country_name
  from public.beta_participants p
  where p.auth_user_id = current_user_id
     or (current_user_id is not null and lower(p.email) = current_email);
end;
$$;

create or replace function public.get_my_beta_usage()
returns table (registered boolean, used_count integer, allowance integer, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  participant public.beta_participants%rowtype;
  used integer;
begin
  update public.beta_participants
  set auth_user_id = current_user_id,
      status = case when status in ('registered', 'pending_access') then 'active' else status end,
      updated_at = timezone('utc', now())
  where current_user_id is not null
    and lower(email) = current_email
    and (auth_user_id is null or auth_user_id = current_user_id);

  select p.* into participant
  from public.beta_participants p
  where p.auth_user_id = current_user_id;

  if participant.id is null then
    return query select false, 0, null::integer, null::integer;
    return;
  end if;

  select count(*)::integer into used
  from public.beta_request_reservations r
  where r.participant_id = participant.id
    and r.status in ('reserved', 'succeeded');
  return query select true, used, participant.request_allowance, greatest(participant.request_allowance - used, 0);
end;
$$;

create or replace function public.reserve_beta_request(
  requested_operation text,
  requested_key uuid
)
returns table (allowed boolean, reservation_id uuid, registered boolean, used_count integer, allowance integer, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  participant public.beta_participants%rowtype;
  used integer;
  existing public.beta_request_reservations%rowtype;
  existing_id uuid;
begin
  update public.beta_participants
  set auth_user_id = current_user_id,
      status = case when status in ('registered', 'pending_access') then 'active' else status end,
      updated_at = timezone('utc', now())
  where current_user_id is not null
    and lower(email) = current_email
    and (auth_user_id is null or auth_user_id = current_user_id);

  select p.* into participant
  from public.beta_participants p
  where p.auth_user_id = current_user_id
  for update;

  if participant.id is null then
    return query select true, null::uuid, false, 0, null::integer, null::integer;
    return;
  end if;

  if requested_operation not in ('discover', 'define', 'align', 'pm_assistant', 'ai_artifact', 'market_research') then
    raise exception 'Unsupported beta request operation';
  end if;

  select count(*)::integer into used
  from public.beta_request_reservations r
  where r.participant_id = participant.id
    and r.status in ('reserved', 'succeeded');

  select r.* into existing from public.beta_request_reservations r where r.request_key = requested_key;
  if existing.id is not null then
    return query select existing.status <> 'released', existing.id, true, used, participant.request_allowance, greatest(participant.request_allowance - used, 0);
    return;
  end if;

  if participant.status in ('paused', 'declined') or used >= participant.request_allowance then
    return query select false, null::uuid, true, used, participant.request_allowance, 0;
    return;
  end if;

  insert into public.beta_request_reservations (participant_id, operation, request_key)
  values (participant.id, requested_operation, requested_key)
  returning id into existing_id;
  return query select true, existing_id, true, used + 1, participant.request_allowance, greatest(participant.request_allowance - used - 1, 0);
end;
$$;
