# Bootstrap PM Agent V2 implementation map

## Scope

This map records the current route, component, state, and API boundaries before further UI implementation. The approved Home / Workspace direction is implemented as a shell and composition layer around existing PM capabilities. Backend contracts, Supabase access, authentication, hash navigation, visited-panel mounting, local drafts, and workflow result review remain the source of truth.

## Reuse map

| Product area | Current route / entry | Existing UI reused | State and data reused | API / persistence reused | Implementation treatment |
| --- | --- | --- | --- | --- | --- |
| Home | `#overview` | `WorkspaceOverview`, `PmEntryPanel`, `AuthPanel`, `WorkspaceSearchPanel` | Home query state, intelligence tab/collapse state, PM entry draft, auth session | Supabase reads for workspace, context, documents, evidence, decisions, assumptions, artifacts, workflow runs; `/api/pm/plan` through `PmEntryPanel` | Keep as the primary PM work queue and command surface. |
| Work | `#discover` via primary nav alias | `ProductWorkScreen` | Active Product Work stage, visited-panel mounting, workflow stage state | Read-only Supabase work summaries; existing workflow panels and handoff API | Keep “Work” as the simplified navigation label while retaining `#discover` deep-link compatibility. |
| Product Work | `#discover`, `#define`, `#align` | `ProductWorkScreen` | Product work title/question, current stage, latest runs, evidence, assumptions, decisions | Supabase reads; existing handoff/workflow APIs | Use as the connected shell around stage-specific workflow panels. |
| Discover | `#discover` | `DiscoverWorkflowPanel`, `CitationChip`, Product Work frame | Question draft, transient result, loading/error state, approved handoff events | `POST /api/workflows/discover`; `GET /api/workflows/handoffs` where applicable | Preserve the current source-grounded synthesis and review checkpoint. |
| Define | `#define` | `DefineWorkflowPanel`, `ArtifactActions`, `CitationChip` | Opportunity draft, handoff-loaded opportunity, transient brief result, loading/error state | `GET /api/workflows/handoffs?target=define_specify`; `POST /api/workflows/define`; `/api/artifacts` through `ArtifactActions` | Keep Define as a stage inside Product Work; do not replace the workflow contract. |
| Align | `#align` | `AlignWorkflowPanel`, `ArtifactActions` | Communication format, request draft, handoff-loaded request, transient message result | `GET /api/workflows/handoffs?target=align_communicate`; `POST /api/workflows/align`; `/api/artifacts` through `ArtifactActions` | Keep Align as the communication / decision-output stage. |
| Deliver | Visual stage target currently points to `#artifacts` | `ArtifactLibraryPanel`, `MetricsExperimentPanel`, `PrioritizationPanel`, `LaunchReadinessPanel` | Saved artifact list/version state, experiment and planning drafts, launch readiness state | `/api/artifacts`, export/version routes, existing Supabase reads/writes/local state in each panel | Do not invent a Deliver API. Present existing artifact, experiment, planning, and launch capabilities as the delivery surface when the stage is expanded. |
| Evidence | `#evidence` | `EvidenceLibraryPanel`, `CitationChip` | Evidence list/filter/form state, citation inspection, document options, save/delete feedback | Supabase `evidence_items`, `evidence_citations`, and `documents` queries and CRUD | Preserve traceability, source locators, search, create, inspect, and delete behavior. |
| Artifacts | `#artifacts` | `ArtifactLibraryPanel`, `ArtifactActions` | Artifact list, version metadata, export actions | `/api/artifacts`, `/api/artifacts/[id]/versions`, `/api/artifacts/[id]/export` | Keep the library as the durable output and Deliver destination. |
| Experiments | `#metrics` | `MetricsExperimentPanel` | Existing local metric/experiment draft state and review UI | Existing deterministic metrics helpers and current panel behavior | Keep the navigation label “Experiments” while preserving the existing metrics and experiment capability. |
| Search | Navigation search control; no separate hash view | `WorkspaceSearchPanel` | Search input, results, open-result navigation | `GET /api/search` | Keep search available from the global shell; do not create a second search backend or route unless required by a later approved task. |
| Settings | `#settings` plus header account control | Inline account view, `AuthPanel`, and existing workspace-control panels (`PrivacyPanel`, `IntegrationsPanel`, `FeedbackPanel`, `UsagePanel`, `ObservabilityPanel`, `LaunchReadinessPanel`) | Auth session state and each panel’s existing local/persisted state | Supabase auth; existing privacy/delete, usage, observability, integrations, feedback, launch APIs and persistence | Keep account access stable and expose existing controls without deleting capabilities that are visually secondary. |

## Route and mounting rules

- Hash navigation remains the public deep-link contract. `#workflows` continues to normalize to Discover.
- `visited` in `src/app/page.tsx` remains the mounting boundary so leaving and returning to a view does not discard local drafts or transient workflow results.
- Product Work owns the visual shell for Discover, Define, and Align, but the existing workflow panels remain the behavior boundary.
- Existing panels not yet promoted into the Home shell remain reachable through their current hash destinations and grouped internal navigation.
- No API route, Supabase table, auth flow, schema, or workflow contract is removed or renamed as part of the visual implementation.

## Phased implementation plan

### Phase A — Foundation and shell

- Reuse the existing design tokens, icon system, focus treatment, skip link, auth header, workspace selector, and responsive shell.
- Keep primary navigation compact: Home, Work, Evidence, Artifacts, Experiments, Search, Settings.
- Verify signed-out, no-workspace, empty, and populated Home states remain honest.

### Phase B — Home work queue

- Keep the question-first command surface as the primary action.
- Keep Product Work and Next Best Action grounded in real workflow runs.
- Keep Needs Your Attention limited to existing decision, assumption, and evidence state.
- Keep Intelligence contextual and source-aware.

### Phase C — Product Work stage continuity

- Preserve the Product Work shell and stage navigation.
- Keep Discover, Define, and Align panels mounted and behaviorally unchanged.
- Keep handoff review and evidence lineage intact.

### Phase D — Secondary capability exposure

- Expose existing Evidence, Artifacts, Experiments, Search, and Settings capabilities through the shell without recreating their backend behavior.
- Treat Deliver as a composition of existing artifact, experiment, planning, and launch capabilities until a dedicated Deliver contract is approved.

### Phase E — QA gate

- Run lint, typecheck, tests, production build, and diff checks.
- Visually inspect desktop, laptop, tablet, and 390px mobile states.
- Check keyboard navigation, focus visibility, touch target size, reduced motion, tab semantics, drawer behavior, and signed-in/signed-out states.

## Explicit non-goals for this pass

- No API, Supabase, auth, schema, or workflow contract changes.
- No removal of existing capability because it is not in the compact primary navigation.
- No redesign of full Discover, Define, Align, Evidence, Artifacts, Experiments, or Settings surfaces beyond what the approved Home shell requires.
- No new Deliver backend or fabricated PM data.
