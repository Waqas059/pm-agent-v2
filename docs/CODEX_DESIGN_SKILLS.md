# Codex design skills

These project-local skills are available for frontend work in PM Agent V2:

- `frontend-production-shadcn` — use for the authenticated product workspace: dashboards, app shell, navigation, forms, tables, settings, states, and other product UI. It complements the global `frontend-design` skill by adding a restrained production-SaaS workflow grounded in the repository's React, Next.js, Tailwind, and shadcn conventions.
- `design-lead-gen-landing-page` — use for the public marketing website or a lead-generation landing page. It complements the global `frontend-design` skill by adding positioning, content, conversion-flow, asset-sourcing, and verification guidance. The upstream file names its skill `design a lead-gen landing page`.

For either surface, also use the global `ui-ux-pro-max` skill for accessibility, responsive behavior, interaction states, navigation, forms, and UX quality checks. Use `frontend-design` for the overall visual direction and distinctive execution. Apply the product skill to workspace UI and the landing-page skill to public marketing UI; do not use the landing-page workflow to shape internal product screens.

## Sources

- `frontend-production-shadcn`: [wzx2002/codex-frontend-skill/SKILL.md](https://github.com/wzx2002/codex-frontend-skill/blob/main/SKILL.md)
- `design-lead-gen-landing-page`: [m8ig/design-skills/skills/design-lead-gen-landing-page/SKILL.md](https://github.com/m8ig/design-skills/blob/master/skills/design-lead-gen-landing-page/SKILL.md)

Keep these files project-local under `.agents/skills/` so future Codex runs can use the same design guidance without changing the user's global skill installation.
