# PM Agent V2 — Product + Technical Master Specification

**Status:** Authoritative source of truth  
**Version:** 3.0  
**Last updated:** 2026-09-04  
**Project:** Bootstrap PM Agent V2  
**Current phase:** PM Kit Intelligence + Production Hardening

This document is the authoritative product and technical scope for PM Agent V2. Earlier planning documents remain useful as background research, but they must not override the product decisions, priorities, scope boundaries, or engineering guardrails recorded here.

## 1. Product definition

PM Agent V2 is a context-aware AI workspace for Product Managers. It understands the product, its evidence, previous decisions, assumptions, metrics, and artifacts, then helps the PM investigate problems, make decisions, define product work, and communicate outcomes.

The durable product promise is:

> **PM Agent knows my product.**

The product must reduce repeated context-setting and fragmented PM work. A PM should be able to maintain one durable product workspace containing product goals, strategy, personas, customer evidence, documents, competitors, metrics, decisions, assumptions, experiments, prior artifacts, and stakeholder context.

PM Agent is not a generic chatbot, a collection of prompt templates, or a set of disconnected agents. It is a connected PM operating workspace where evidence, reasoning, decisions, and downstream artifacts remain linked.

## 2. Core product loop

The product should optimize for the following durable loop:

**Context → Evidence → Decision → Artifact → Memory**

Every major capability should strengthen this loop.

- **Context:** what the product is, who it serves, goals, constraints, strategy, metrics, stakeholders, and prior work.
- **Evidence:** customer research, documents, observations, metrics, external research, and source-backed findings.
- **Decision:** the choice made, alternatives considered, evidence used, rationale, assumptions, risks, owner, date, and status.
- **Artifact:** PRD, feature specification, user stories, engineering brief, executive update, experiment, roadmap item, or other actionable PM output.
- **Memory:** durable product knowledge that can be retrieved later so users do not have to reconstruct why a decision was made.

## 3. Current product status

The following foundation is already implemented and should be preserved unless a later task explicitly changes it:

### Foundation and workspace
- Next.js application foundation.
- Supabase database and storage foundation.
- Authentication and authorization.
- Row Level Security.
- Product workspace UI.
- Product context management.
- Private document uploads.
- Evidence and citation model.

### AI workflows
- OpenAI Responses API foundation.
- LangChain Core as the shared workflow validation/orchestration layer.
- Discover & Synthesize workflow.
- Define & Specify workflow.
- Align & Communicate workflow.

### Product capabilities
- Artifact history and export.
- Search.
- Prioritization.
- Metrics.
- Experiments.
- Usage foundation.
- Error handling.
- Privacy controls.
- Scoped integrations foundation.
- Beta feedback.
- Launch-readiness checks.

### Deployment
- Code is pushed to GitHub main.
- Production deployment is live on Vercel.
- Supabase production Site URL and auth callback are configured.

These completed capabilities are the baseline. Do not regress or unnecessarily rewrite them when implementing the next phase.

## 4. Product principles

### 4.1 Context over prompts
Users should not have to restate their product every time. Workflows and agent capabilities should reuse the same workspace context.

### 4.2 Evidence before confidence
The product must distinguish source-backed evidence from interpretation, assumption, and recommendation. Never fabricate evidence, citations, metrics, customer quotes, confidence values, or quality scores.

### 4.3 Human-controlled product decisions
AI may investigate, recommend, compare, synthesize, and prepare downstream work. Material product decisions should remain reviewable and explicitly approved by the PM.

Do not automatically run Discover → Define → Align without a meaningful PM review point when a product decision is being made.

### 4.4 Connected work
Outputs from one capability should be reusable in the next without copy/paste. However, continuity should not eliminate human judgment.

### 4.5 Deterministic calculations
RICE, weighted prioritization, sample-size calculations, confidence intervals, KPI formulas, experiment math, and similar numerical outputs must be calculated by deterministic code. The LLM may explain them but should not invent or silently calculate authoritative values.

### 4.6 Progressive agentic behavior
Do not make every feature agentic. Use deterministic application logic where appropriate and agent orchestration where task selection, evidence retrieval, tool choice, multi-step reasoning, or human checkpoints materially improve the experience.

### 4.7 Production trust
Customer documents and product evidence can be sensitive. Security, data isolation, deletion, retention, and source provenance are product requirements, not implementation details.

## 5. PM capability model

PM Agent should evolve from three fixed workflows into one connected PM system with reusable capabilities.

The system should support the following capability areas over time:

1. **Product Context** — goals, strategy, personas, segments, constraints, stakeholders, competitors, and product definitions.
2. **Customer Discovery** — interviews, feedback, themes, pain points, jobs-to-be-done, and unmet needs.
3. **Market Intelligence** — competitor research, market evidence, positioning, and externally sourced product intelligence.
4. **Opportunity Analysis** — opportunities, evidence strength, unresolved questions, and opportunity comparison.
5. **Prioritization** — RICE, weighted scoring, value/effort, trade-off analysis, and decision support.
6. **Product Definition** — product briefs, PRDs, feature specifications, user stories, acceptance criteria, dependencies, and risks.
7. **Planning** — roadmap items, milestones, dependencies, release planning, and sequencing.
8. **Metrics** — KPI definitions, success metrics, leading/lagging indicators, and measurement plans.
9. **Experiments** — hypotheses, assumptions, validation methods, experiment plans, and learning outcomes.
10. **Decision Support** — alternatives, recommendations, rationale, evidence, assumptions, risks, and approvals.
11. **Stakeholder Communication** — executive, engineering, sales, GTM, launch, and stakeholder communication.
12. **Knowledge and Memory** — durable retrieval of decisions, assumptions, artifacts, evidence, and product history.

Do not implement these as twelve isolated agent classes. They should be reusable tools/capabilities available to one PM intelligence layer.

## 6. LangChain role

LangChain is the shared orchestration layer. It is not the product itself and should not be added merely as an abstraction around a single model call.

The next phase should make LangChain materially useful by enabling reusable PM tools, state-aware execution, retrieval, structured workflow handoffs, and human approval checkpoints.

The desired direction is:

**PM request → understand task → retrieve relevant context/evidence → select PM capabilities/tools → reason → ask for PM decision when needed → create/update artifact → persist traceable outcome**

LangChain should help orchestrate this behavior while OpenAI remains the approved model runtime unless explicitly changed.

Where long-running stateful workflows, branching, checkpointing, recovery, or human-in-the-loop execution become necessary, evaluate LangGraph rather than implementing brittle custom state machines.

## 7. PM tool layer

Introduce reusable server-side PM tools/capabilities instead of continuously adding monolithic workflows.

Initial tool candidates:

- `search_product_context`
- `search_evidence`
- `retrieve_artifact`
- `retrieve_decision`
- `retrieve_assumptions`
- `compare_opportunities`
- `calculate_rice`
- `calculate_weighted_score`
- `define_success_metrics`
- `create_experiment_plan`
- `create_prd`
- `create_user_stories`
- `create_engineering_brief`
- `create_executive_update`
- `create_roadmap_item`
- `record_decision`

Tool contracts must be typed, validated, permission-aware, and testable. Do not expose unrestricted arbitrary tool execution.

## 8. New first-class domain objects

### 8.1 Decision record

Add a first-class Decision object so PM Agent can answer not only what was produced, but why a product choice was made.

A decision should support at minimum:

- title / decision question;
- selected decision;
- alternatives considered;
- evidence references;
- rationale;
- assumptions;
- risks;
- owner;
- decision date;
- status: proposed, approved, revisited, reversed;
- links to resulting artifacts;
- provenance and timestamps.

Decision history should be auditable. Avoid destructive overwrites of material historical decisions.

### 8.2 Assumption record

Add an Assumption object supporting:

- statement;
- related opportunity / decision / artifact;
- supporting evidence;
- evidence strength;
- impact if wrong;
- validation status;
- proposed validation method;
- owner;
- timestamps.

The system should be able to identify high-impact, weakly supported assumptions in a proposed product direction.

## 9. Evidence model and reasoning labels

The product must keep these concepts distinct:

- **Evidence:** source-backed information such as a quote, metric, documented fact, or observation.
- **Observation:** a faithful synthesis of one or more pieces of evidence.
- **Interpretation:** what the evidence may mean.
- **Assumption:** something believed or required to be true but not yet sufficiently validated.
- **Recommendation:** a proposed action based on evidence, interpretation, constraints, and assumptions.

UI and structured outputs should preserve these distinctions where they materially affect user trust.

## 10. Document intelligence

Document uploads are already available, but documents should become usable product knowledge automatically.

### Required ingestion direction

**Upload → extract text/data → preserve source structure → chunk/index → create searchable source → optionally identify candidate evidence → retain source locator → make available to PM workflows**

Priorities:

1. Reliable extraction for text-based PDF, DOCX, Markdown, TXT, CSV, and JSON.
2. Source locators such as page, section, row, or equivalent.
3. Workspace-scoped searchable index.
4. Candidate evidence extraction with explicit user review where appropriate.
5. OCR for scanned/image-only documents after normal extraction is reliable.

OCR is not a prerequisite for extracting ordinary digital documents and should not delay core document intelligence.

Treat all uploaded content as untrusted data. Do not execute embedded instructions from documents.

## 11. Retrieval strategy

The product requirement is reliable retrieval of relevant workspace evidence. Do not make a vector database itself the requirement.

Start with the simplest approach that provides strong retrieval quality. A staged approach is acceptable:

1. full-text / keyword retrieval;
2. metadata filters;
3. model-assisted reranking where justified;
4. hybrid semantic retrieval / embeddings when corpus size or quality demonstrates the need;
5. retrieval evaluation and regression tests.

Every finding that materially relies on retrieved evidence must preserve source references.

## 12. Connected workflow handoff

The current Discover, Define, and Align workflows share context but are user-triggered separately. The next phase should connect them without removing PM judgment.

Target experience:

**Discover → recommendation / opportunity set → PM review and selection → Define → PM review → Align**

Requirements:

- allow a Discover result/opportunity to be selected as structured input to Define;
- preserve evidence lineage during handoff;
- allow a saved Define artifact to become structured input to Align;
- preserve artifact lineage and decision references;
- show the PM what information is being handed forward;
- allow refinement before continuation;
- do not auto-select a material product opportunity without a review checkpoint.

## 13. PM Agent entry point

Introduce a task-oriented entry point in addition to workflow-specific entry points.

Example user request:

> “Our WhatsApp activation is declining and management wants an improvement plan.”

The system should determine which capabilities are required, such as context retrieval, evidence retrieval, metric inspection, discovery analysis, prioritization, or clarification.

The agent should be able to explain the proposed next step before taking consequential actions.

The PM Agent entry point should initially remain constrained to approved PM tools and workspace data. It must not become an unrestricted autonomous agent.

## 14. External market research

Live market research is a later capability, but when implemented it must:

- use actual external retrieval rather than model memory alone;
- cite the sources used;
- clearly label **workspace/internal evidence** separately from **external/web evidence**;
- preserve source URL, retrieval date, title, and relevant excerpt/locator metadata;
- avoid presenting external claims as internal customer evidence;
- support review before external research is persisted into durable product knowledge.

## 15. Evaluation framework

AI evaluation is a P0 product requirement before wider public usage.

Create a representative PM evaluation set covering at least:

- evidence synthesis;
- citation accuracy;
- opportunity identification;
- PRD quality;
- acceptance criteria quality;
- prioritization explanations;
- decision rationale;
- assumption identification;
- stakeholder communication;
- failure behavior when evidence is insufficient or conflicting.

Track at minimum:

- grounding accuracy;
- citation validity;
- unsupported-claim / hallucination rate;
- completeness;
- schema validity;
- instruction adherence;
- human acceptance/rejection;
- latency;
- model/token cost.

No static or invented confidence/quality percentages are allowed.

## 16. AI observability

Every production AI run should record appropriate non-sensitive operational metadata, including where available:

- workflow / capability;
- model;
- latency;
- input/output token usage;
- estimated provider cost;
- status/error class;
- tools invoked;
- retrieval count/source types;
- artifact created or updated;
- user acceptance/rejection or feedback signal.

Do not log raw sensitive customer content unnecessarily.

Observability should support both product learning and cost management.

## 17. Product analytics and success metrics

The product needs outcome metrics, not only technical completion status.

### North-star candidate

**Useful PM outcomes completed per active workspace**

### Supporting metrics

- workspace activation rate;
- time to first useful artifact or decision;
- first successful evidence-backed workflow;
- Discover → Define handoff rate;
- Define → Align handoff rate;
- artifact acceptance / reuse / export rate;
- artifact edit rate;
- evidence/citation inspection or use rate;
- decisions recorded per active workspace;
- assumptions created and resolved;
- weekly returning PMs / workspace retention;
- AI run latency and failure rate;
- AI cost per useful outcome.

Analytics must distinguish real events from demo/sample data.

## 18. Onboarding

Add an activation-focused onboarding flow so a new PM does not land in an empty workspace without guidance.

Suggested onboarding sequence:

1. create workspace;
2. describe the product/product area;
3. identify target customers/personas;
4. add goals and current priorities;
5. upload existing product material;
6. optionally add competitors and KPIs;
7. prepare workspace context;
8. guide user into a first evidence-backed investigation.

The onboarding goal is not form completion. It is time to first useful PM outcome.

## 19. Production hardening

The following work remains mandatory before considering the current beta broadly production-ready:

- final authenticated UAT on the live website;
- final review of Supabase RLS policies;
- final review of storage policies;
- authentication and callback verification in production;
- server-side input validation review;
- secret/configuration review;
- privacy and sensitive-data logging review;
- complete workspace deletion behavior;
- retention policy decisions and automation;
- failure/retry behavior for AI calls and ingestion;
- update T23/status UI to remove stale pre-deployment “pending” wording;
- production smoke tests after every release.

## 20. Usage, billing, and plans

Real server-side usage enforcement and billing are deferred until beta usage demonstrates repeated value.

For the current phase:

- retain usage instrumentation;
- protect the service from accidental/unbounded usage;
- measure model cost per capability and useful outcome;
- do not spend major engineering effort on paid-plan complexity before retention and workflow value are validated.

Billing, subscriptions, enterprise administration, and complex plan entitlements belong to a later commercialization phase.

## 21. Integrations

Do not build broad integrations prematurely.

Prioritize integrations based on observed user behavior. Examples:

- Jira/Linear if product definitions and user stories are frequently moved into delivery systems;
- Slack/Teams if stakeholder communication is a frequent downstream action;
- Notion/Confluence if artifact knowledge synchronization is repeatedly requested.

Tool calling and external write actions must require explicit authorization and appropriate human confirmation.

## 22. Prioritized next backlog

### P0 — prove trust and production quality

1. **Live authenticated UAT**
   - Complete end-to-end UAT against the deployed production URL.
   - Test signup/sign-in, workspace creation, context, evidence, document upload, workflows, artifacts, prioritization, metrics, experiments, privacy, feedback, sign-out, and failure states.

2. **Production security review**
   - Review RLS, storage policies, auth callbacks, secret handling, server boundaries, and sensitive logging.

3. **Fix production status accuracy**
   - Remove obsolete pre-deployment “pending” wording from T23/status surfaces.

4. **AI evaluation harness**
   - Establish representative PM tasks, grounding/citation tests, regression checks, and quality baselines.

5. **Document text extraction**
   - Parse ordinary digital documents, preserve locators, and make extracted content available to workspace retrieval.

### P1 — make PM Kit intelligent and connected

6. **Human-approved Discover → Define → Align handoff**
   - Structured handoff with evidence/artifact lineage and explicit PM checkpoints.

7. **Decision records**
   - First-class decisions with alternatives, evidence, rationale, assumptions, risks, status, and artifact links.

8. **Assumption registry**
   - Track high-impact assumptions and validation status.

9. **PM tool layer + constrained agent entry point**
   - Expose reusable PM capabilities through typed tools and allow LangChain to select among approved tools.

10. **Retrieval quality upgrade**
    - Improve retrieval using full-text, metadata, reranking, and semantic/hybrid retrieval when justified by evaluation.

11. **AI observability + product analytics**
    - Measure model quality, latency, cost, tool usage, outcomes, and workflow conversion.

12. **Activation onboarding**
    - Guide a new PM from workspace setup to first useful evidence-backed outcome.

13. **Workspace deletion + retention automation**
    - Complete user-controlled deletion and enforce documented retention behavior.

### P2 — expand after core loop proves value

14. **Live market research**
15. **OCR for scanned documents**
16. **External tool calling / integrations**
17. **Billing and paid plans**
18. **Enterprise administration / advanced governance**

## 23. Explicit non-goals for the current phase

Do not prioritize the following before the P0/P1 loop is proven:

- dozens of standalone PM generators;
- ten or more independent AI agents;
- autonomous product decisions without PM approval;
- broad Jira/Slack/Notion/Confluence integrations at once;
- complex multi-provider model routing without measured need;
- microservice decomposition without a concrete scaling requirement;
- Redis/queue infrastructure without demonstrated workload need;
- enterprise SSO/SAML before enterprise demand;
- advanced billing complexity before retention validation;
- decorative AI confidence scores;
- unsupported market statistics or fabricated customer evidence.

## 24. Engineering guardrails

- Keep secrets server-side and out of repository/logs.
- Preserve workspace isolation and RLS.
- Treat documents, retrieved web content, and model output as untrusted input.
- Validate model outputs with explicit schemas and runtime validation.
- Preserve evidence and artifact provenance.
- Any schema change requires a versioned migration and rollback consideration.
- Any AI contract change requires tests/eval fixtures and backward compatibility review.
- Prefer small, testable changes over broad rewrites.
- Codex must report assumptions/blockers rather than silently inventing product behavior.
- Do not replace working deterministic code with LLM calls merely to make a feature “AI-powered.”

## 25. Definition of the next product phase

The next phase is successful when a PM can:

1. create a product workspace and provide enough initial context;
2. upload product/customer documents and have their usable content extracted automatically;
3. ask a real product question rather than selecting a rigid template;
4. have PM Agent retrieve relevant product context and evidence;
5. receive source-grounded analysis and an explicit distinction between evidence, interpretation, assumption, and recommendation;
6. review/select an opportunity or decision direction;
7. carry that approved direction into Define without copy/paste;
8. produce a reviewable PRD/specification with evidence lineage;
9. carry an approved artifact into stakeholder communication;
10. save the decision, rationale, assumptions, artifacts, and evidence relationships as durable product memory;
11. later ask “Why did we make this decision?” and receive an answer grounded in the recorded decision and evidence;
12. complete the flow reliably in production with measurable quality, latency, cost, and user feedback signals.

## 26. Product positioning

Do not position PM Agent primarily as “AI that generates PRDs.”

The stronger product thesis is:

> **PM Agent is a context-aware PM workspace that connects product context, evidence, decisions, artifacts, and memory so Product Managers can move from a messy problem to an explainable decision and actionable product work.**

LangChain is an implementation enabler for orchestration and reusable PM capabilities. The user value remains the connected product-management workflow and durable product knowledge.

## 27. Codex execution instruction

This specification is the new authoritative scope for the **Bootstrap PM Agent V2** project.

Before implementing new functionality:

1. preserve the completed baseline;
2. review the P0 and P1 priorities in this document;
3. do not restart completed tasks unless a real defect or dependency requires it;
4. implement one bounded task at a time with acceptance criteria and tests;
5. keep the product loop **Context → Evidence → Decision → Artifact → Memory** intact;
6. prioritize production trust, document intelligence, evaluation, and connected PM workflow continuity over adding more standalone generators.

When future requirements conflict with older PM Agent V2 documents, this Version 3.0 specification wins unless explicitly superseded by a newer approved specification.
