# PM Kit workspace redesign

The original working application is preserved on `backup/pre-ui-redesign-20260905` and tag `pre-ui-redesign-20260905` (commit `67fe2be`).

## Experience

- Question-first home with real, RLS-filtered workspace summaries.
- Grouped navigation and focused screens; existing hash destinations remain supported.
- Visited panels remain mounted to preserve local drafts and running results.
- Shared forest/sage surface, form, card, focus, and responsive styling across existing panels.
- Expandable saved rationale, risks, source locations, and citation inspection.
- Existing Discover approval navigates to the selected handoff target. No new backend handoff capability is implied.
- Loading messages describe actual pending requests, without simulated steps or counts.

## Preserved boundaries

No database migrations, API contract changes, auth/RLS changes, or AI pipeline replacements. Metrics and experiment drafts remain local as before. Existing status enums are displayed as stored; no invented evidence-strength scores or analytics.

## Validation

- ESLint, 46 tests, TypeScript compilation and Next.js production build passed.
- Browser smoke checks covered 18 screens at 1440px, 768px, and 390px, including mobile navigation, without horizontal overflow or JavaScript runtime errors.
- Desktop workflow and mobile home screenshots reviewed.
- Navigation test verifies a metric draft survives switching away and back.
- No paid AI calls were needed for UI checks.

Signed-in production behavior should be checked after deployment using the existing account session. The redesign does not replace a full backend regression suite.
