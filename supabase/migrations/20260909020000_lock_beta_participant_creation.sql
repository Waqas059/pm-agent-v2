-- Participant creation is a Super Admin operation only.
-- Revoke the public registration function introduced in the previous beta layer
-- migration; admin routes use the server-only service role instead.

revoke execute on function public.register_beta_participant(text, text, text, text, text) from public, anon, authenticated;

-- Keep one pending continuation request per participant. The UI can safely retry
-- without creating a queue of duplicate requests.
create unique index if not exists beta_one_open_continuation_per_participant_idx
  on public.beta_continuation_requests (participant_id)
  where status = 'new';

-- Granting access must update the participant and request atomically. This RPC
-- is callable only by the server-side service role used by /admin/beta.
create or replace function public.admin_grant_beta_continuation(
  request_id uuid,
  custom_allowance integer default null,
  grant_amount integer default 5
)
returns table (participant_id uuid, request_allowance integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  request_row public.beta_continuation_requests%rowtype;
  participant_row public.beta_participants%rowtype;
  next_allowance integer;
begin
  if current_user <> 'service_role' then
    raise exception 'Only the server admin can grant beta continuation access';
  end if;

  if custom_allowance is not null and custom_allowance < 0 then
    raise exception 'Custom allowance cannot be negative';
  end if;
  if custom_allowance is null and (grant_amount is null or grant_amount <= 0) then
    raise exception 'Grant amount must be positive';
  end if;

  select * into request_row
  from public.beta_continuation_requests
  where id = request_id
  for update;

  if request_row.id is null then
    raise exception 'Continuation request not found';
  end if;
  if request_row.status <> 'new' then
    raise exception 'Continuation request has already been reviewed';
  end if;

  select * into participant_row
  from public.beta_participants
  where id = request_row.participant_id
  for update;

  if participant_row.id is null then
    raise exception 'Beta participant not found';
  end if;

  next_allowance := coalesce(custom_allowance, participant_row.request_allowance + grant_amount);
  update public.beta_participants
  set request_allowance = next_allowance,
      updated_at = timezone('utc', now())
  where id = participant_row.id;

  update public.beta_continuation_requests
  set status = 'approved',
      reviewed_at = timezone('utc', now())
  where id = request_row.id;

  return query select participant_row.id, next_allowance;
end;
$$;

revoke all on function public.admin_grant_beta_continuation(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_grant_beta_continuation(uuid, integer, integer) to service_role;
