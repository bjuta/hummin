# HUMMIN React migration — source-first component contract

## Why we changed the method

The prior approach iteratively approximated every page from screenshots. It produced repeated CSS overrides and passed functional checks while failing visual comparisons. From now on, the **approved original HTML design bundle is the source**, and React is only the implementation.

## Source assets

- Marketing HTML and style rules: `design/sources/site-v4.template.json` (JSON-encoded authoritative HTML).
- Insights HTML: `design/sources/insights-v4.html.gz.b64`.
- Original static resources: manifest shards under `design/sources`.
- Original Figtree and Newsreader fonts, SVG icon variants, hero artwork and photography are extracted by the existing prebuild scripts.

A newly uploaded owner HTML file should be compared to the repository source first; replace the authoritative source if it supersedes these versions. **Do not hand-transcribe the site again.**

## Reusable primitive layer

`app/components/SourcePrimitives.tsx`:

- `SourceButton`: original CTA DOM/class styles, used by marketing pages.
- `SourceSectionTitle`: common headings/eyebrows.
- `SourceShelf`: the original horizontal shelf plus native scrolling and accessible controls.
- `SourceIcon`: static owner-supplied Lucide/brand SVGs, never re-drawn approximations.
- `SourceChip`: consistent inline metadata/badge markup.
- `SourceDialog`: shared problem/engagement modal structure, accessible close and Escape behavior.

`app/components/SourceEditorialCard.tsx` uses a single data/router implementation for the three **source-authored** editorial variants: latest, topic/author archive and related reading. It retains each original class structure for styling.

## Style foundation

`scripts/sync-source-foundation.mjs` reads the owner HTML and deterministically regenerates `app/components/source-foundation.generated.css` during `npm run prebuild`. The original base stylesheet remains intact inside a low-priority CSS layer; its palette is exported as semantic `--hummin-*` variables.

The marketing, Contact, Insights, article, assessment, promotion and legal styles now reference these shared variables (448 existing colour literals consolidated mechanically, without changing their computed values).

**Rule:** new page-specific CSS is allowed for genuinely unique compositions; repeated controls and colours must come from the foundation and primitives. Do not stack emergency `!important` override sections to make individual screenshots look similar.

## Fidelity completion process

1. Inventory repeatable sections across the original HTML (hero, shelf, poster, section heading, CTA, tabs, modal, editorial/card, forms).
2. Port each pattern **once** into a primitive. Use original tokens, source content, source imagery and source DOM; adapt only interactivity/bindings needed for React.
3. Instantiate the pattern across all applicable routes. Data remains in source-derived content modules. Shared backend operations remain unchanged.
4. Run local source-contract and build checks before consuming hosted CI minutes:
   - `npm run verify:design-source`
   - `node --test tests/source-editorial-contract.test.mjs`
   - `npm run typecheck`
   - `npm run build`
5. Only after a complete local pass, deploy one consolidated isolated Preview candidate and run one sequential release gate. Compare trustworthy full-page captures from production, with rendered frame/scroll effects settled.
6. Inspect **systemic** differences (font metrics, root width/padding, card variant geometry, animation/reveal timing), fix in shared primitives or source token extraction, then verify the affected routes together. Treat incomplete production source captures as blocked/invalid evidence, never as proof that React should delete real content.
7. Preserve D1, Cloudflare Turnstile, Resend, booking calendar, newsletter and Admin functionality. No real test emails or reservations, no public cutover without owner approval.

## Status

Source foundations and first-wave shared primitives have been committed to the development branch and statically inspected. **They have not been built or deployed yet; no GitHub Actions were started for this refactor.** Earlier canonical pass results cannot certify the new commit, and visual parity is not yet approved.

The goal of this architecture is to eliminate repeated visual patching, not to relax HUMMIN's requirement for full fidelity.


## HTML-removal safety — enforced after migration

The **normal React build is now self-contained**. Versioned assets live under `public/brand`, React article blocks live in `app/lib/react-original-insights.json`, and `app/components/source-foundation.css` is a static CSS snapshot rather than a build-generated file. `prebuild` only makes independently-authored downloadable tools; `pretypecheck` is removed. CI tests now validate React components and these committed assets directly.

**Do not delete the original `design/sources` bundle yet.** The public-host reversible route gate still calls `app/routes/fidelity.ts`, which fetches `/design/site/index.html` generated by the old restoration path. Removing the original while this production fallback is live would break public pages. Legacy restoration scripts remain preserved for rollback but are not part of normal React builds, typechecks or current React acceptance.

The safe deletion sequence, after owner-approved public React routing, is:

1. Confirm no public route uses `originalLoader` or `/design/*` and no build hook references `restore-original.mjs`, `extract-react-assets.mjs`, `extract-react-insights.mjs` or `sync-source-foundation.mjs`.
2. Run `npm run verify:design-source`, `npm run verify:seo`, `npm run verify:insights`, `npm run verify:boot`, `npm run typecheck` and `npm run build` **with `design/sources` temporarily absent**. Confirm all required local assets and articles remain available.
3. Confirm release sign-off and rollback strategy. Only then remove the legacy `design/sources/*` HTML/bundle files and unused restoration/extraction scripts from the working branch in a separate reversible commit. No automatic history rewriting; historic commits can still contain old HTML.

**Current status:** build dependency removed in code; separate no-source build execution and public cutover not yet certified. Public site untouched.
