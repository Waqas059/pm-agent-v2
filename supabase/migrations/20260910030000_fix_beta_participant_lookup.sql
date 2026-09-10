-- Qualify the participant email column so the beta profile lookup is
-- unambiguous alongside the table-returning function's email output column.
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
  update public.beta_participants as p
  set auth_user_id = current_user_id,
      status = case when p.status in ('registered', 'pending_access') then 'active' else p.status end,
      updated_at = timezone('utc', now())
  where current_user_id is not null
    and lower(p.email) = current_email
    and (p.auth_user_id is null or p.auth_user_id = current_user_id);

  return query
  select p.id, p.full_name, p.preferred_name, p.email, p.status,
    p.request_allowance, p.country_code, p.country_name
  from public.beta_participants as p
  where p.auth_user_id = current_user_id
     or (current_user_id is not null and lower(p.email) = current_email);
end;
$$;
