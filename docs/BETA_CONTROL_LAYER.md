# Controlled Product Manager beta layer

The beta layer is additive and defaults to `BETA_ACCESS_MODE=observe`. It
supports a public product entry point, an existing authenticated PM workspace,
and a server-authorized beta operations portal without changing authentication,
Supabase workspace behavior, workflow contracts, or saved drafts.

## Experience boundaries

- Public visitors see the product page at `/` while signed out. “Use Bootstrap
  PM” first opens a small Name + Email registration modal. The server creates
  the participant with the default allowance, then the existing authentication
  flow opens with the registration email prefilled. The public page never
  exposes Supabase, access mode, or request-reservation mechanics.
- Signed-in users see the existing PM workspace. The participant is matched
  automatically by normalized auth email, promoted from `registered` to
  `active` on product entry, and the PM is never asked to repeat their name.
- The Super Admin portal is `/admin/beta`. Access is server-authorized by the
  signed-in email in `BETA_SUPER_ADMIN_EMAILS` and its analytics are limited to
  name, email, country, usage, engagement, feedback, continuation requests,
  and contact-click events. Prompts, evidence, artifact content, raw IP/GPS,
  and fingerprints are not exposed.

## Access and identity

Keep `BETA_ACCESS_MODE=observe` while the final identity/access experience is
being decided. Observe mode records participants without blocking other
signed-in users. The public registration route accepts only Name + Email and
creates records through a server-only Supabase admin client; the browser cannot
choose allowance, status, country, or auth identity. The route is duplicate
safe by normalized email. The legacy `register_beta_participant` function
remains in the historical migration for compatibility, but its execute
privilege is revoked for public and normal authenticated roles by the additive
lock migration.

Country greeting detection is deterministic: trusted Vercel country header,
then browser locale, then neutral copy. It does not use raw IP, GPS, an LLM, or
email guessing. The name precedence is preferred name, full-name first token,
profile first name, then no name; the UI must never render `undefined`.

## Allowance and meaningful product activity

The registered participant allowance is authoritative. A participant with 10
requests and an approved +5 grant has 15 total requests; the legacy workspace
run cap is used only for non-participant users. Reservations are serialized by
the participant row lock. A provider or system failure releases the reservation
so failed work does not consume allowance.

Counted operations are Discover, Define, Align, PM assistant generation, AI
artifact generation, and market research with AI. Navigation, reads, evidence
browsing, citations, search, filters, exports, feedback, contact, uploads, and
deterministic extraction do not consume allowance.

Requests 1–7 do not show prominent usage. After requests 8 and 9, the workspace
shows a subtle remaining-count notice. Request 10 succeeds and opens the
personalized completion modal. Request 11 is blocked before provider execution
and opens the same modal. The modal lets the participant request continuation,
give feedback, or contact Waqas, while explicitly preserving read access to
existing work, evidence, decisions, and artifacts.

## Continuation, feedback, and contact

The continuation endpoint creates one pending request per participant and does
not automatically increase allowance. The admin portal can grant +5, set a
custom total allowance, or decline. Approval updates the participant and
request atomically through `admin_grant_beta_continuation`.

Feedback captures usefulness from 1–5, would-use-again, written feedback,
continued-access intent, participant identity, and review status. Contact is
tracked as `beta_contact_clicked`; the application does not claim that an
external message was sent.

## Admin portal

`/admin/beta` provides compact Overview, Beta users, and Feedback sections.
Overview includes beta PMs, active PMs in the last seven days, AI requests used,
continuation requests, country mix, operating rules, and a needs-attention
queue. Beta users includes participant identity, country, usage, last active,
Discover/Define/Align progress, useful-output signal, status, participant
detail, and allowance controls. The portal never renders PM content.

## Migrations and deployment

Apply these migrations through the existing Supabase workflow before using the
participant registry, persistent feedback, continuation requests, or
server-authoritative allowances in a deployed environment:

- `supabase/migrations/20260909010000_beta_control_layer.sql`
- `supabase/migrations/20260909020000_lock_beta_participant_creation.sql`
- `supabase/migrations/20260910010000_beta_self_registration.sql`

The service-role key is server-only and must never be placed in a
`NEXT_PUBLIC_*` variable, logged, or returned to the browser.

## Deferred by beta decision

- Supabase leaked-password protection remains a required pre-public-launch
  security task, not a private-beta blocker.
- No automatic retention policy is introduced; owner-controlled deletion and
  future workspace-level retention remain compatible with the model.
- Semantic/vector retrieval is deferred; deterministic retrieval remains the
  beta baseline and the evidence domain stays extensible for hybrid search.
- GitHub read-only integration is the first future integration phase.
- Billing, entitlements, usage paywalls, enterprise SSO/SCIM/governance, and
  autonomous integration writes are deferred.
