# Controlled Product Manager beta layer

The beta layer is additive and defaults to `BETA_ACCESS_MODE=observe`. It
supports a public product entry point, an existing authenticated PM workspace,
and a server-authorized beta operations portal without changing authentication,
Supabase workspace behavior, workflow contracts, or saved drafts.

## Experience boundaries

- Public visitors see the product page at `/` while signed out. “Use Bootstrap
  PM” opens one Name + Email modal. Continue validates/registers the participant,
  sets a short-lived HttpOnly server claim, silently establishes a Supabase
  anonymous session, consumes the claim to bind the participant to that session,
  creates or loads the first private workspace, and opens the PM workspace. The
  PM is never shown an account, password, or infrastructure step.
- Returning users with the same guest session open their existing workspace
  directly. A different device or lost guest session does not start a recovery
  flow yet; recovery is a future beta decision.
- A signed-in account without a participant record sees a short profile-completion
  screen instead of the workspace only for the existing non-guest account
  path. Guest sessions without a completed handoff are returned to the public
  entry flow. The configured Super Admin is exempt so operations access and
  the existing workspace remain available.
- The Super Admin portal is `/admin/beta`. Access is server-authorized by the
  signed-in email in `BETA_SUPER_ADMIN_EMAILS` and its analytics are limited to
  name, email, country, usage, engagement, feedback, continuation requests,
  and contact-click events. Prompts, evidence, artifact content, raw IP/GPS,
  and fingerprints are not exposed.

## Access and identity

Keep `BETA_ACCESS_MODE=observe` while the final identity/access experience is
being decided. Observe mode keeps final allowlist authentication deferred. The
beta registration accepts only Name + Email and returns only `email` and
`created`; the server stores a short-lived, signed, HttpOnly claim cookie. The
handoff requires the current Supabase anonymous session, consumes that claim,
and uses a server-only admin client to bind the participant and create or load
the owner workspace. The browser cannot choose allowance, status, country, or
auth identity. The handoff is duplicate-safe by normalized email and refuses
to rebind a participant already attached to another guest.
The legacy `register_beta_participant` function remains in the historical
migration for compatibility, but its execute privilege is revoked for public
and normal authenticated roles by the additive lock migration.

Greeting language is deterministic: browser language first, country metadata as
fallback, then English. It supports Arabic, French, Spanish, German, Turkish,
Urdu, and English copy without requesting GPS or using an LLM. Country code and
country name remain separate metadata for Admin analytics. The shared
`resolveDisplayFirstName` helper applies the name precedence: preferred name,
first token of full name, first token of profile name, then no name. The UI must
never render `undefined` or infer a name from an email address.

The beta registration response returns only `email` and `created`; participant
metadata is available only after the anonymous session is authenticated. The
registration enforces strict input and body-size validation, while the signed
claim is short-lived and single-purpose because it is consumed when the
participant receives its first `auth_user_id`.

## Allowance and meaningful product activity

The registered participant allowance is authoritative. A participant with 10
requests and an approved +5 grant has 15 total requests; the legacy workspace
run cap is used only for non-participant users. Reservations are serialized by
the participant row lock. A provider or system failure releases the reservation
so failed work does not consume allowance. If the reservation RPC errors or
returns no verifiable row, provider execution is blocked with a temporary
service error; a beta request is never treated as unregistered merely because
usage could not be verified.

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
