---
name: design a lead-gen landing page
description: "Use when designing and building a marketing/lead-gen landing page from scratch in code for a real brand. Covers picking an aesthetic direction, sourcing real content/assets (never approximating logos or generating images unless asked), lead-gen funnel structure, visual craft pitfalls, foreground-image/glow CSS traps, and how to verify by reproducing bugs rather than glancing at screenshots."
---

Use this when asked to design and build a marketing/lead-gen landing page from scratch in code (single HTML file or a small framework), especially when a real brand/business already exists behind it. This is the end-to-end process — research, asset sourcing, structure, visual craft, and verification — not just "write some HTML".

**Default to code (HTML/CSS/JS), not scripting nodes in a Figma file directly.** Figma Plugin API scripting is a narrow, mechanical medium with little training signal behind it — the result reads as "assembled primitives," not designed. Actual visual taste transfers far more reliably into code, where layout systems (flex/grid), real CSS visual primitives (gradients, masks, blend modes, custom SVG), and a fast render-and-look loop do most of the compositional work. If the end target is Figma, design in HTML first and import (see the standalone-file note in section 2), rather than building the design by hand-positioning Figma nodes.

## 0. Establish the aesthetic direction first

Invoke the `frontend-design` skill (or its rules if unavailable) before writing markup. Commit to ONE bold, context-derived direction with a single signature element — never start from the banned-list defaults: centered hero badge+headline+CTA stack, purple gradients, Inter/system font, icon-in-rounded-square 3-card grids, gray-box placeholders, glassmorphism without reason, emoji icons, hand-drawn organic SVG icon paths (geometric construction from `rect`/`line` primitives is fine — e.g. floor-plan icons).

If the project already has a design-system doc (see the `extract design system from a live website` skill), the direction's tokens come from there — colors, radii, shadow character, typography rules (e.g. "key messages lowercase") are LAW, not suggestions, unless the user later overrides them explicitly for this project.

## 1. Pull real content before writing any copy

- If a real business/site exists, `WebFetch` it for concrete facts: dates, prices, addresses, distances, credentials. Don't invent financial/legal specifics (mortgage rates, bank partner names, discount %) that aren't verifiably on the source — if the real content doesn't have it, frame the CTA as "discuss with a manager" instead of fabricating a number.
- Prefer the richest real fact over a generic one. A real completion date, a real "N years on the market" claim, a real distance beats generic marketing filler every time — these are also your strongest trust-building content, not just decoration.

## 2. Source real assets — never approximate

Asset priority order: **real brand assets > user-provided > generated (only if explicitly permitted) > geometric self-made > labeled stand-in**. If the user says "don't generate images," or hasn't said you can, go straight to sourcing real ones:

- Fetch the real site's HTML source directly (`curl` + `grep` for `src=`, `srcset=`, `data-src=`) to find actual image URLs, including size variants (`@xs`, `@md`, `@xxl` etc. — always grab the largest available). Download with `curl -sL -o`.
- **Logos are not text.** Never approximate a wordmark/logotype with styled `<span>text</span><sup>mark</sup>` — even a "close enough" font-weight or which typeface the superscript uses can visibly differ from the real trademark. Find the actual logo asset: check for an SVG sprite (`icons.svg` with `<symbol id="logo">`), inline SVG in the page source, or a dedicated logo file. Extract the real symbol/path data and save it as a standalone `.svg`. You need at minimum two color variants — one for light backgrounds, one recolored (e.g. `sed 's/#1C1A16/#FEFEF9/'`) for dark ones (footer, dark hero, statement sections).
- When testing image-heavy pages from a copied/temp file (e.g. a `sed`-modified duplicate for screenshot purposes), remember relative asset paths break if the copy lives in a different directory — serve/test from the same directory as the real assets, or fix paths first.
- **Don't reuse the same image asset across adjacent, differently-themed sections.** Even if it technically fits both, a repeated photo between neighboring blocks reads as laziness/a placeholder, not a deliberate choice. Pull enough distinct real candidates per section that nothing repeats within view of itself — go back to the source site's asset list rather than reaching for an already-used file.

## 3. Structure the funnel, don't just stack sections

For a **lead-gen** page specifically (as opposed to a brand/awareness page), section order is a conversion decision, not a content-dump order:

1. Hero — emotional hook + lowest-friction path to the form (a single button that scrolls to the one real form beats a second, unlabeled mini-form bolted onto the hero).
2. Trust strip — 3-4 fast credibility facts (scale, developer, location, segment).
3. **One or two genuine differentiation sections** ("why this project," a visual quality proof) — not zero (a lone hero isn't enough of a hook before asking for money-relevant info) and not six (don't bury the product).
4. The product/pricing itself, once enough context justifies the price.
5. Deeper trust builders with concrete, falsifiable facts (a real handover date + timeline visualization beats vague "quality guaranteed" copy).
6. Secondary decision factors (location, lifestyle, amenities).
7. A second trust signal immediately before the final CTA — reusing the same trust-strip component is fine (repetition-for-anchoring is a legitimate pattern), but consider a visual variant if it's the exact same block repeated with different words back-to-back.
8. The one real contact form, then footer.

Rules that came up repeatedly and are easy to violate silently:
- **Nav order must equal scroll order.** Users use nav to build a spatial map of the page; a mismatch (e.g. "Location" appears before "Construction Progress" in the nav but after it on the page) breaks that map on the first click.
- **Every `scroll-margin-top`** on anchor targets so a `position:fixed` header doesn't hide the section heading when nav-jumping.
- **CTA copy must match its destination.** "Watch the construction photo report →" that actually opens a lead form is a broken promise exactly where you're trying to build trust — either build the real destination or rewrite the copy to what the click actually delivers.
- **Every form input needs a visible `<label>`**, not a placeholder standing in for one (placeholders vanish on input and are unreliable for screen readers).
- **Don't duplicate a heading verbatim between adjacent major sections** (e.g. hero H1 and the very next section's H2 saying the exact same sentence). If the brand has a repeatable phrase pattern ("The home that...", "Дом, который..."), use a *different* completion each time it recurs.

## 4. Visual craft checklist (apply after structure is right)

- Reading text (captions, body copy, secondary labels) needs real contrast — a token like "55% opacity ink" that looks tastefully muted in a mockup can fail WCAG AA on real photography backgrounds. Reserve the lightest opacity tier for genuinely decorative labels only; bump anything a user is expected to actually read to ~70%+ solid.
- Card internal padding should be ≤ the gap between cards, or they visually "detach" from the grid.
- Give small/alternate button sizes a named scale step (`.btn-sm`) instead of one-off inline overrides scattered through the markup.
- Don't let 3+ consecutive sections share the same background tone with zero visual break — alternate white/tint backgrounds or add a divider. When you do add a tint to fix this, check the section immediately after doesn't already have its own border on the shared edge (you'll get a doubled seam).
- A repeated "big stat number" motif (large muted numeral + small inline unit + mono caption) is a good signature element if reused consistently — don't let one occurrence be a different scale/weight than the others without a deliberate reason (e.g. the single most important stat can legitimately be bigger).

## 5. Foreground cutout images over a background (hero building/product shots etc.) — the traps

This came up as a multi-round bug hunt; the rules below prevent all of it up front:

- **Never size a foreground image by height with `width:auto`.** On a taller/narrower viewport the proportional width grows unbounded and gets hard-clipped by the container's `overflow:hidden` — a jarring vertical cut straight through the subject. Size by **width** instead (`width:X%; height:auto`), which can never exceed the container's own width. If you need it capped in both directions, bound both explicitly with `object-fit:contain`, not just one axis with a `max-width` afterthought.
- **A PNG cutout's own hard edges will show** wherever it has opaque content near its bounding box (a ground-level scene, a shadow, anything that isn't transparent alpha). Fade the image's own edge with a CSS `mask-image: linear-gradient(...)`, don't rely on the source PNG's transparency alone.
- **To add contrast behind overlapping text, don't lighten the whole image** (a full-bleed gradient scrim washes out everything, not just the text zone). Anchor a soft radial glow specifically to the text column so it moves with it, not to the outer full-bleed section (which is often wider than and independently positioned from a centered, max-width content wrapper — anchoring to the wrong element makes the glow visibly "detach" from the text as viewport width changes).
- **Size the glow's own box generously oversized relative to where the gradient actually fades to zero.** A `radial-gradient` is clipped by its own element's box — if the box edge lands before the gradient reaches 0% opacity, you get a hard-edged rectangle, which is a more obviously broken look than no glow at all. Rule of thumb: the box should be roughly 2-3x the visible glow diameter, gradient stops fading to 0 well inside that.
- **Stacking-context gotcha:** an absolutely-positioned decorative element placed early in the DOM (intending "paints behind, since it's first") will still render ON TOP of later `position:static` siblings by default — CSS stacks positioned elements above static ones regardless of source order. Fix by giving the parent `position:relative; z-index:0` (this creates a local stacking context) and the decorative element `z-index:-1` inside it.

## 6. Verify by reproducing, not by glancing

- **Capture evidence before writing code, not after.** If you're cloning or matching a real reference (a live competitor site, a brand's existing site), scroll it top to bottom in small steps at both desktop and mobile (390×844) widths, noting new sections, sticky elements, and lazy-loaded content, *before* you scaffold anything. Test each interactive control one at a time, returning to the baseline state between tests. Building first and "checking against the reference later" produces drift you then have to hunt for; capturing first means you're building from ground truth.
- Prefer the live, interactive browser (Claude-in-Chrome extension or equivalent) over static screenshots when available — several real bugs here (dead buttons, broken anchor-scroll, mismatched CTA destinations) were only caught by actually clicking through, not by eyeballing a render.
- If only headless screenshots are available: `min-height:100vh` elements will badly distort if you set an artificially tall `--window-size` for a full-page capture (100vh inflates to that height). Either capture at a real viewport height and stitch multiple scrolled screenshots, or `sed 's/min-height:100vh;/min-height:900px;/'` into a throwaway copy first.
- If a screenshot shows something implausible (content "stuck" mid-fade, washed out, semi-transparent for no reason), don't trust it blindly — check computed styles directly (`getComputedStyle(el).opacity`, `el.classList`) before concluding it's a real bug. CSS `transition`-driven elements can be caught mid-repaint by screenshot tooling; a forced repaint (nudge scroll, wait, re-screenshot) or direct JS inspection tells you whether it's a capture artifact or a real, user-facing bug.
- When a user reports a specific visual complaint ("the image is cut off on the left," "the glow has a hard edge"), reproduce the exact condition first (resize to the viewport that shows it, zoom into the exact region, inspect computed geometry) before proposing a fix — and explain the actual root cause found, not just "fixed it."
- Before final handoff, run the `qa a build against its source design` skill as a blocking gate if there's a concrete source to compare against (a reference site, a mockup, a design-system doc) — it's a stricter, side-by-side, five-surface comparison discipline than an ad hoc "looks right" pass.
- If a real asset genuinely can't be copied and you substitute something, say so explicitly (which asset, why, what you used instead) rather than letting a silent substitution look like a faithful copy.

## 7. Iterating on user feedback

- Treat design pushback as a real design conversation, not a queue of tickets: when a user disagrees with a structural choice you made (e.g. "apartments shouldn't be block 2, one hero isn't enough of a hook"), engage with the reasoning and propose a concrete alternative rather than just complying or just defending the original choice.
- Brand style rules (e.g. "headings are always lowercase" per the brand guideline) hold until the user overrides them for this project — then their live preference wins over the documented rule, even though the rule was "correct" per the original brief.
- Don't silently reintroduce a bug you already fixed once you're editing a nearby area for an unrelated request — re-verify the specific thing you touched, not just the new change.
