-- Controlled beta participation and quota ledger.
-- Access remains observational until BETA_ACCESS_MODE is changed server-side.

create table public.beta_participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 160),
  preferred_name text check (preferred_name is null or char_length(btrim(preferred_name)) between 1 and 80),
  email text not null check (char_length(btrim(email)) between 3 and 320),
  status text not null default 'active' check (status in ('invited', 'active', 'paused', 'declined')),
  request_allowance integer not null default 10 check (request_allowance >= 0),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text,
  country_first_detected_at timestamptz,
  country_last_detected_at timestamptz,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index beta_participants_email_lower_idx on public.beta_participants (lower(email));
create index beta_participants_status_idx on public.beta_participants (status);

create or replace function public.register_beta_participant(
  participant_full_name text,
  participant_preferred_name text,
  participant_email text,
  detected_code text,
  detected_name text
)
returns table (id uuid, status text, display_name text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(btrim(participant_email));
  existing_id uuid;
  saved_status text;
  saved_name text;
begin
  if char_length(btrim(participant_full_name)) not between 1 and 160 or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid full name and email are required';
  end if;

  select p.id into existing_id
  from public.beta_participants p
  where lower(p.email) = normalized_email
  for update;

  if existing_id is null then
    insert into public.beta_participants (full_name, preferred_name, email, status, request_allowance, country_code, country_name, country_first_detected_at, country_last_detected_at)
    values (btrim(participant_full_name), nullif(btrim(participant_preferred_name), ''), normalized_email, 'invited', 10,
      case when detected_code ~ '^[A-Z]{2}$' then detected_code else null end,
      case when detected_code ~ '^[A-Z]{2}$' then nullif(btrim(detected_name), '') else null end,
      case when detected_code ~ '^[A-Z]{2}$' then timezone('utc', now()) else null end,
      case when detected_code ~ '^[A-Z]{2}$' then timezone('utc', now()) else null end)
    returning public.beta_participants.id into existing_id;
  else
    -- A public registration retry must not overwrite an admin-managed record.
    -- Country refresh is performed only after authenticated participant matching.
    select p.id into existing_id from public.beta_participants p where p.id = existing_id;
  end if;

  select p.status, coalesce(p.preferred_name, p.full_name) into saved_status, saved_name
  from public.beta_participants p where p.id = existing_id;
  return query select existing_id, saved_status, saved_name;
end;
$$;

create table public.beta_request_reservations (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.beta_participants(id) on delete cascade,
  operation text not null check (operation in ('discover', 'define', 'align', 'pm_assistant', 'ai_artifact', 'market_research')),
  request_key uuid not null unique,
  status text not null default 'reserved' check (status in ('reserved', 'succeeded', 'released')),
  created_at timestamptz not null default timezone('utc', now()),
  finalized_at timestamptz
);

create index beta_request_reservations_participant_status_idx
  on public.beta_request_reservations (participant_id, status, created_at desc);

create table public.beta_continuation_requests (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.beta_participants(id) on delete cascade,
  requested_at timestamptz not null default timezone('utc', now()),
  status text not null default 'new' check (status in ('new', 'approved', 'declined')),
  allowance_at_request integer not null check (allowance_at_request >= 0),
  used_at_request integer not null check (used_at_request >= 0),
  reviewed_at timestamptz,
  admin_note text
);

create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.beta_participants(id) on delete cascade,
  usefulness_rating integer not null check (usefulness_rating between 1 and 5),
  would_use_again boolean not null,
  feedback_text text not null default '' check (char_length(feedback_text) <= 2000),
  wants_continued_access boolean not null default false,
  status text not null default 'new' check (status in ('new', 'reviewed', 'follow_up')),
  created_at timestamptz not null default timezone('utc', now())
);

create index beta_feedback_created_idx on public.beta_feedback (created_at desc);

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
      updated_at = timezone('utc', now())
  where auth_user_id is null
    and lower(email) = current_email
    and current_user_id is not null;

  return query
  select p.id, p.full_name, p.preferred_name, p.email, p.status,
    p.request_allowance, p.country_code, p.country_name
  from public.beta_participants p
  where p.auth_user_id = current_user_id
     or (current_user_id is not null and lower(p.email) = current_email);
end;
$$;

create or replace function public.record_my_beta_country(
  detected_code text,
  detected_name text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.beta_participants
  set country_code = case when detected_code ~ '^[A-Z]{2}$' then detected_code else country_code end,
      country_name = case when detected_code ~ '^[A-Z]{2}$' then nullif(btrim(detected_name), '') else country_name end,
      country_first_detected_at = coalesce(country_first_detected_at, timezone('utc', now())),
      country_last_detected_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where auth_user_id = (select auth.uid())
    and detected_code ~ '^[A-Z]{2}$';
  return found;
end;
$$;

create or replace function public.get_my_beta_usage()
returns table (registered boolean, used_count integer, allowance integer, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  participant public.beta_participants%rowtype;
  used integer;
begin
  update public.beta_participants
  set auth_user_id = (select auth.uid()), updated_at = timezone('utc', now())
  where auth_user_id is null
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and (select auth.uid()) is not null;

  select p.* into participant
  from public.beta_participants p
  where p.auth_user_id = (select auth.uid());

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
  participant public.beta_participants%rowtype;
  used integer;
  existing public.beta_request_reservations%rowtype;
  existing_id uuid;
begin
  update public.beta_participants
  set auth_user_id = (select auth.uid()), updated_at = timezone('utc', now())
  where auth_user_id is null
    and lower(email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    and (select auth.uid()) is not null;

  select p.* into participant
  from public.beta_participants p
  where p.auth_user_id = (select auth.uid())
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

create or replace function public.finalize_beta_request(request_reservation_id uuid, succeeded boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.beta_request_reservations r
  set status = case when succeeded then 'succeeded' else 'released' end,
      finalized_at = timezone('utc', now())
  where r.id = request_reservation_id
    and r.participant_id in (select p.id from public.beta_participants p where p.auth_user_id = (select auth.uid()))
    and r.status = 'reserved';
  return found;
end;
$$;

alter table public.beta_participants enable row level security;
alter table public.beta_request_reservations enable row level security;
alter table public.beta_continuation_requests enable row level security;
alter table public.beta_feedback enable row level security;
revoke all on table public.beta_participants, public.beta_request_reservations, public.beta_continuation_requests, public.beta_feedback from anon, authenticated;
create or replace function private.is_beta_participant(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.beta_participants
    where id = target_participant_id and auth_user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_beta_participant(uuid) from public;
grant execute on function private.is_beta_participant(uuid) to authenticated;
grant insert on table public.beta_continuation_requests, public.beta_feedback to authenticated;
create policy "Beta participants can submit continuation requests"
  on public.beta_continuation_requests for insert to authenticated
  with check (private.is_beta_participant(participant_id));
create policy "Beta participants can submit feedback"
  on public.beta_feedback for insert to authenticated
  with check (private.is_beta_participant(participant_id));
grant execute on function public.get_my_beta_participant() to authenticated;
grant execute on function public.register_beta_participant(text, text, text, text, text) to anon, authenticated;
grant execute on function public.record_my_beta_country(text, text) to authenticated;
grant execute on function public.get_my_beta_usage() to authenticated;
grant execute on function public.reserve_beta_request(text, uuid) to authenticated;
grant execute on function public.finalize_beta_request(uuid, boolean) to authenticated;

alter table public.product_events drop constraint if exists product_events_event_name_check;
alter table public.product_events add constraint product_events_event_name_check check (event_name in (
  'workspace_viewed', 'workflow_started', 'workflow_completed', 'workflow_failed',
  'artifact_created', 'artifact_version_created', 'artifact_exported',
  'evidence_citation_inspected', 'decision_created', 'assumption_created',
  'document_uploaded', 'document_extraction_completed', 'document_extraction_failed',
  'market_research_completed', 'market_research_failed', 'onboarding_started',
  'onboarding_completed', 'beta_feedback_submitted', 'beta_access_requested',
  'beta_contact_clicked'
));

create trigger set_beta_participants_updated_at
before update on public.beta_participants
for each row execute function public.set_updated_at();
