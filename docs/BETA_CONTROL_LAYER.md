# Controlled PM beta layer

The beta layer is additive and currently defaults to `BETA_ACCESS_MODE=observe`.
Observe mode records and manages registered participants without changing the
existing Supabase authentication or blocking unregistered signed-in users.

## Included

- Admin-managed participant registry with full name, preferred name, email,
  status, allowance, and country metadata.
- A separate name + email beta registration form. It records beta
  participation only and does not create, replace, or alter a Supabase login.
- Deterministic country detection from `x-vercel-ip-country`, then browser
  locale. No raw IP, GPS, third-party IP lookup, or AI inference is stored.
- Server-authoritative reservations for meaningful AI generations only. Failed
  requests release their reservation; concurrent requests are serialized by a
  participant row lock in the database function.
- Persistent beta feedback and continuation requests, with local fallback for
  users who are not yet registered.
- Server-authorized `/admin/beta` operations page. Admin identity is controlled
  by `BETA_SUPER_ADMIN_EMAILS` and admin data access requires the server-only
  `SUPABASE_SERVICE_ROLE_KEY`.
- Contact actions are tracked as product events only; the application does not
  claim that an external message was sent.

## Configuration

Keep `BETA_ACCESS_MODE=observe` while the final identity/access experience is
still being decided. Configure the beta contact fields and admin email list in
the server environment. Never place the service-role key in a `NEXT_PUBLIC_*`
variable.

The additive migration is:

`supabase/migrations/20260909010000_beta_control_layer.sql`

Apply it through the existing Supabase migration workflow before using the
participant registry, persistent feedback, or server-authoritative beta
allowances in a deployed environment.
