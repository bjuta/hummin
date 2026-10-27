# HUMMIN — Authoritative source component map

**Design authority:** `design/sources/site-v4.template.json`, `design/sources/assessment.*.part`, and `design/sources/insights-v4.html.gz.b64`. The previous React presentation code was discarded. No component in this map is derived from that failed implementation.

## Proven source boundaries

The extractor `scripts/catalog-approved-source.mjs` captures every source element and emits unmodified HTML/CSS. `scripts/extract-source-blueprints.mjs` selects **45 named, SHA-256-pinned source components** using `design/source-components.registry`. The second stage checks that every exact source fragment still matches the approved byte signature.

| Family | Actual source structures | Reuse / variation |
| --- | --- | --- |
| Shell | `shell.header`, `shell.navigation-drawer`, `shell.footer` | One global site structure; navigation is a nested component |
| Marketing hero and routes | `marketing.home`, `marketing.shared-inner-hero`, `marketing.how-we-work`, `marketing.applied-expertise`, `marketing.engagements`, `marketing.who-we-work-with`, `marketing.about`, `marketing.contact` | The inner hero is controlled by the source's `{{ inner }}` expression. Route-specific content uses independent `sc-if` branches |
| Problem and engagement cards | `marketing.problem-cards`, `marketing.engagement-cards` | Exact `sc-for` loops, original interactive events |
| Expertise and workflow grids | `marketing.stage-cards`, `marketing.expertise-domains` | Original inline spacing and card tokens |
| Tier comparison and values | `marketing.comparison-columns`, `marketing.comparison-rows`, `marketing.values-tabs` | Exact data-driven cells and selection handlers |
| Conversion and modal | `conversion.assessment-band`, `conversion.problem-dialog` | Site-wide assessment invitation and source-authored dialog |
| Embedded page interfaces | `integration.assessment`, `integration.insights` | Original `dc-import` boundaries with callbacks; **not** React iframes to copy blindly |
| Assessment | `assessment.intro`, `assessment.question-flow`, `assessment.results`, `assessment.booking`, plus seven named question/result/booking loops | The original intro, question and results states are separate source branches, not three reconstructed websites |
| Insights hero and layouts | `editorial.shared-hero`, `editorial.hero.index`, `editorial.hero.topic`, `editorial.hero.author`, `editorial.hero.article`, `editorial.index`, `editorial.archive`, `editorial.article` | One authored radial hero contains four conditional views. The content has separate index/list/article branches |
| Editorial cards and newsletter | `editorial.cards.index`, `editorial.cards.archive`, `editorial.related-articles`, `editorial.newsletter` | Retain the *distinct* index/archive/related markup where the approved source differs |

The component families above are **engineering groupings**, not claims that every member has identical HTML or styling. The 45 fragments overlap because their source elements genuinely nest.

## Verified original-source extraction

| Source | Parsed elements | Raw structural fragments | Original style blocks | SHA-verified named blueprints |
| --- | ---: | ---: | ---: | ---: |
| Main website | 386 | 74 | 2 | 22 |
| Assessment | 220 | 49 | 2 | 11 |
| Insights | 271 | 63 | 1 | 12 |
| **Total** | **877** | **186** | **5** | **45** |

Run `npm install --no-save --no-audit --no-fund parse5@7.3.0`, followed by `node scripts/catalog-approved-source.mjs` and `node scripts/extract-source-blueprints.mjs`. The workflow `.github/workflows/hummin-source-catalog.yml` performs these steps and the source-only application build.

The exported `artifacts/source-component-blueprints/manifest.json` records, for each component: approved-source byte offsets, SHA-256, original root attributes, **every original inline style**, dynamic `{{ expression }}` bindings, event handlers, and nested design-runtime directives. `components/*.html` holds unchanged source substrings.

## Binding and design constraints for any future native implementation

1. **Original DOM hierarchy and authored inline styles are the baseline.** The previous manually approximated CSS is deleted and must not be restored.
2. **Bindings must be implemented, not stripped.** Examples include `sc-if`, `sc-for`, `sc-camel-on-click`, `sc-camel-on-mouse-enter`, `style-active` and `dc-import`; the blueprint manifest enumerates the actual instances.
3. **Preserve real design variations.** The home hero is distinct from the shared marketing inner hero; Insights has conditional hero branches; Assessment has distinct introduction, flow, results, and booking states.
4. **Use original visual assets, original typography and exact responsive styles.** Do not infer missing markup from screenshots, use placeholder imagery, or substitute the deleted reconstructed primitives.
5. **Do not ship the source design runtime as a React dependency.** The originals are the extraction authority only; if a future native React implementation is authorized, it must reproduce the approved rendered behavior from explicitly traced source components, without importing the archived HTML at runtime.
6. **No cutover or destructive HTML deletion.** Production remains untouched; the public domain continues to serve the approved source. Any new implementation requires fresh owner review and complete visual acceptance.

**Status:** source extraction and boundary classification; **no replacement React presentation implemented**. This source catalogue is not a visual-fidelity pass.
