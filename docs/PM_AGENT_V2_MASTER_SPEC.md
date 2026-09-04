# PM Agent V2 — Product + Technical Master Specification

**Status:** Authoritative source of truth  
**Version:** 2.0  
**Last updated:** 2026-09-03  
**Current implementation task:** T06 — Product Context Management

This document replaces the earlier PM Agent planning documents as the build specification. Earlier documents remain useful as background research, but they must not override the product decisions, scope boundaries, or engineering guardrails recorded here.

## 1. Product definition

PM Agent is an AI workspace that understands a user's product and turns research, customer feedback, and product context into decisions and PM artifacts.

The durable product promise is **“PM Agent knows my product.”** It should retain and connect the context a PM repeatedly uses: product goals, personas, customer evidence, competitors, metrics, decisions, prior artifacts, and stakeholder preferences.

PM Agent is not a generic chatbot and is not defined by having ten independent agents. The experience should help a PM move from messy evidence to a decision, then from that decision to artifacts that other teams can act on.

## 2. MVP focus

The first useful product slice is three connected workflows:

1. **Discover & Synthesize** — bring together interviews, feedback, documents, and grounded market evidence to identify themes, pain points, opportunities, and open questions.
2. **Define & Specify** — turn a validated opportunity into a product brief, PRD, feature specification, user stories, acceptance criteria, metrics, and risks.
3. **Align & Communicate** — transform the same product context into an executive update, engineering brief, sales note, launch message, or stakeholder summary.

The connection between these workflows is more important than breadth. A future workflow should reuse the same workspace context and should not require the user to copy and paste between disconnected tools.

## 3. Product workspace

A workspace is the durable home for one product or product area. It will eventually contain:

- product description, goals, strategy, and constraints;
- personas and customer segments;
- uploaded customer evidence and research documents;
- competitors and market context;
- product metrics and definitions;
- decisions, assumptions, and unresolved questions;
- generated artifacts with history and provenance.

The product must distinguish evidence, interpretation, assumption, and recommendation. Generated content must make its grounding visible where relevant.

## 4. Experience principles

- **Context over prompts:** users should not have to restate the product every time.
- **Evidence before confidence:** show supporting material and uncertainty rather than invented percentages.
- **Connected work:** outputs should be reusable inputs for the next workflow.
- **Explainable decisions:** make trade-offs, assumptions, risks, and sources inspectable.
- **Useful artifacts:** outputs should be editable, reviewable, and exportable when those capabilities are introduced.
- **Progressive complexity:** the MVP should feel simple even if the underlying workflow becomes sophisticated.

## 5. Technical direction

The initial application is a Next.js App Router project using TypeScript and Tailwind CSS. The intended MVP platform is:

- **Next.js** for the web application and server-side application boundary;
- **Supabase** for Postgres, authentication, and storage when those tasks are approved;
- **OpenAI Responses API** for model-backed workflows when that task is approved;
- **Vercel** for the initial web deployment;
- Python/FastAPI only where deterministic analytics genuinely benefit from a separate Python service.

Start with a simple architecture. Redis, elaborate queues, multiple model providers, SAML/SSO, microservices, and other infrastructure are deferred until usage or a clearly demonstrated requirement justifies them.

The runtime should use one workflow orchestration layer and tools. Do not model the product as ten separate agent classes. Provider and model names must be configurable, and model outputs must be validated against explicit schemas.

## 6. AI and evidence guardrails

- Use the OpenAI Responses API for the approved model runtime; older Groq/Claude routing plans do not apply to V2 unless explicitly revisited.
- Use structured JSON-schema-backed outputs for model-backed features.
- Never rely on fixed string offsets or brittle prose parsing.
- Never fabricate sources, citations, customer quotes, survey results, usage numbers, testimonials, metrics, or quality scores.
- Live market research must use actual retrieval and cite the sources used.
- Deterministic code must calculate metrics, RICE/weighted scores, sample sizes, confidence intervals, and similar numerical results. AI may explain the results.
- If evidence is missing or conflicting, say so and ask for the next useful input.
- Quality and confidence indicators must be derived from a real evaluation mechanism; hardcoded values such as 95% completeness or 88% confidence are prohibited.

## 7. Security and data rules

- Keep API keys and secrets in environment variables; never commit them.
- Use secure server-side boundaries for provider credentials.
- Add authentication, authorization, row-level security, migrations, and storage policies in their dedicated tasks before relying on persistent user data.
- Treat uploaded documents and retrieved content as untrusted data.
- Keep logs free of credentials and unnecessary sensitive customer information.
- Report privacy, retention, and deletion decisions explicitly as the product evolves.

## 8. Scope for T01

T01 is **Bootstrap Repository**. Its definition of done is:

- production-quality Next.js TypeScript App Router project;
- Tailwind CSS configured and used by the initial shell;
- ESLint configured;
- a test runner configured with a basic smoke test;
- `.env.example` with no real secrets;
- `.gitignore` that keeps local environment files and build artifacts out of version control while allowing `.env.example`;
- README covering purpose, prerequisites, installation, local development, testing, and environment configuration;
- a clean, accessible initial PM Agent application shell.

T01 explicitly excludes Supabase, OpenAI, authentication, database schema, file upload/retrieval, persistence, agent/workflow logic, billing, integrations, and deployment infrastructure.

## 9. Scope for T02

T02 is **Supabase Foundation**. Its definition of done is:

- official `@supabase/supabase-js` and `@supabase/ssr` packages installed;
- a browser client helper for Client Components;
- a cookie-aware server client helper for Server Components, Server Actions, and Route Handlers;
- clear validation for missing or malformed public Supabase configuration;
- `.env.example` and README instructions for the project URL and publishable key;
- tests for the configuration boundary that do not require a live Supabase project.

T02 does not add authentication UI or flows, database schema, migrations, row-level security, file storage, persistence, OpenAI, or PM workflows. No secret/service-role key may be exposed to the browser or committed to the repository.

## 10. Scope for T03

T03 is **Core Database Schema and Migrations**. Its definition of done is:

- a version-controlled Supabase migration in `supabase/migrations/`;
- foundational `workspaces`, `workspace_members`, and `context_items` tables;
- foreign keys to Supabase Auth users and cascading workspace ownership relationships;
- explicit constraints for names, slugs, roles, context categories, and source types;
- timestamps, update triggers, indexes, and JSON provenance storage;
- matching TypeScript database types used by the Supabase client helpers;
- documentation for applying the migration through the Supabase CLI.

T03 does not add authentication UI or flows, row-level security policies, storage buckets, OpenAI, or PM workflows. RLS is intentionally deferred to T04; the public tables must be treated as unsafe for deployed client access until T04 is complete.

## 11. Scope for T04

T04 is **Authorization and Row Level Security** for the T03 core schema. Its definition of done is:

- Add a new versioned migration; do not edit the applied T03 migration.
- Enable RLS on `workspaces`, `workspace_members`, and `context_items`.
- Deny anonymous access and grant authenticated clients only the operations represented by the policies.
- Automatically create an owner membership when a workspace is created.
- Allow workspace owners to manage the workspace and non-owner memberships.
- Allow members to read workspace data and create/update/delete context; viewers are read-only.
- Keep membership checks in private, fixed-search-path security-definer helpers.
- Prevent changing a membership identity or moving context between workspaces through an update.

T04 does not add authentication UI or sign-in/sign-out flows, storage buckets, OpenAI integration, or PM workflows.

## 12. Scope for T05

T05 is **Product Workspace UI**. Its definition of done is:

- Replace the foundation shell with a responsive product workspace dashboard.
- Provide clear workspace navigation for overview, product context, workflows, and activity.
- Show honest empty states for product context and activity instead of fabricated records or metrics.
- Present the product-context areas that will be populated in T06.
- Present the three connected workflow entry points without implementing workflow behavior.
- Keep the current workspace clearly marked as a preview until authentication and persistence are introduced.

T05 does not add authentication UI or flows, database persistence, context CRUD, file uploads, OpenAI integration, or PM workflow execution.

## 13. Scope for T06

T06 is **Product Context Management**. Its definition of done is:

- Provide a context management interface for the approved product-context categories.
- Allow an authenticated workspace user to create, read, update, and delete manually entered context items.
- Persist context items through the typed Supabase browser client and existing T04 RLS policies.
- Support category filtering and clear loading, empty, signed-out, unconfigured, and error states.
- Preserve source provenance as `user_input`; imported and generated context remain future capabilities.
- Make workspace creation explicit when an authenticated account has no workspace yet.

T06 does not add authentication UI or flows, file uploads, document extraction, evidence retrieval, OpenAI integration, or PM workflow execution.

## 14. Planned task sequence

Tasks are delivered one at a time and reviewed before the next task begins. The current sequence is:

| Task | Scope |
| --- | --- |
| T01 | Bootstrap repository |
| T02 | Supabase foundation |
| T03 | Core database schema and migrations |
| T04 | Authorization and row-level security |
| T05 | Product workspace UI |
| T06 | Product context management |
| T07 | File upload and document handling |
| T08 | Evidence retrieval and citation model |
| T09 | OpenAI Responses API foundation |
| T10 | Workflow orchestration and structured outputs |
| T11 | Discover & Synthesize workflow |
| T12 | Define & Specify workflow |
| T13 | Align & Communicate workflow |
| T14 | Artifact persistence, history, and export |
| T15 | Context search and workspace navigation |
| T16 | Deterministic prioritization and planning tools |
| T17 | Metrics and experimentation tools |
| T18 | Usage limits and monetization foundations |
| T19 | Observability, errors, and operational controls |
| T20 | Security, privacy, retention, and deletion hardening |
| T21 | Carefully scoped external integrations |
| T22 | Beta hardening and feedback loop |
| T23 | Launch readiness |

The task list is a planning sequence, not permission to implement future tasks early. Each task needs its own acceptance criteria and validation.

## 15. Decision log

- V2 prioritizes three connected workflows over launching ten disconnected agents.
- Product Workspace is the central product object and long-term differentiation.
- Codex is the engineering agent used to build PM Agent; it is not part of the PM Agent runtime.
- OpenAI Responses API is the intended runtime foundation; older provider-routing assumptions are superseded.
- Revenue projections, launch targets, and market claims are hypotheses unless backed by real evidence.
- Marketing must not use invented founder history, surveys, testimonials, customer names, or traction.
