# HUMMIN React migration — source fidelity release contract
26 October 2026 · Owner feedback and source PDF comparison

## Authority and objective
The approved, currently running pages at `hummin.org` and the owner-supplied original HTML design bundles are **the source of truth**. React is a change of implementation technology only. Replacements must preserve the original visual design, content, interaction and responsive behaviour, not recreate something of a similar style.

**No release approval may rely solely on passing CI, axe accessibility, renderability, React implementation checks or the previous 42/42 browser smoke results.** Those checks passed while large visual and feature differences existed.

## Grounded owner-reported gaps, 26 October
Screenshots supplied for:
- Production homepage vs `hummin-web-preview.grimpossible.workers.dev/`.
- Production `/insights/enquiries-30-day-fix` vs Preview `/__react/insights/enquiries-30-day-fix`.

Homepage before remediation:
- Problem shelf used incorrect card colour order and a different card composition.
- Engagement cards lost original gradients, colours, compact copy, modal interactions and CTA styling.
- Exact headline copy “Keep us close with a Residency.” was replaced with “Keep moving with a Residency.”
- Original three Insights teasers were replaced with an “Explore Insights” action.
- An unapproved dark “Tell us what's holding your business back” CTA section appeared.
- Footer omitted “Notes from HUMMIN.”
- General font sizes, layout rhythm and card geometry differed.

Original Insights article vs prior Preview:
- Missing source-designed back link, type/topic chips, hero motif and author/date/read metadata.
- Missing editorial figure and caption.
- Missing on-page table of contents with support card.
- Four-step routine flattened to an ordinary numbered list instead of numbered information cards.
- Source download PDF CTA changed to an enquiry contact link.
- Missing share actions, author card, related “Read next” cards and email newsletter section.
- Substantial article length and typography differences.

## Implementation response
- Original template `design/sources/site-v4.template.json` used to recover homepage exact colour mapping, card wording, gradient settings, spacing and editorial teasers.
- `design/sources/insights-v4.html.gz.b64` inflated and inspected as the article layout reference.
- Source Figtree and Newsreader web fonts extracted by build scripts; do not use substitute Google Fonts variants.
- Source article and assessment SVG figures extracted by build scripts, not redrawn approximations.
- New source-derived React article component, original publication data and secured existing newsletter, PDF, booking and email routes are retained.
- Original HTML is never injected with `dangerouslySetInnerHTML`, executed as a runtime, or embedded as an iframe in React pages.

## Non-negotiable release gates
1. Compare source vs React at 390, 768 and 1440 px, including **full-page** screenshots, not just first folds. Measure pixel mismatch and absolute document height difference; preserve labelled reference, candidate and diff images.
2. Check exact source content, typographic metrics, local font assets, card ordering and colours, radii, spacing, section composition, hero cropping, responsiveness, CTA states, navigation and visible hover/focus/touch states.
3. Exercise modal, shelf, search/filter, newsletter, assessment result, secure booking, consent and Admin-published article flows without creating real appointments or sending to real recipients during tests.
4. Verify accessible name, keyboard and contrast without visually replacing any source pattern unless required for accessibility; document unavoidable changes.
5. Any failed required visual route blocks cutover. Require per-route screen parity, not only a single aggregate pass. Compare **all** marketing, Insights, Assessment, Contact, Legal and Admin routes before claiming complete migration.
6. Preserve existing D1/Calendar/Resend/Turnstile integration and configuration; release approval must precede any production routing or binding changes.

## Automated evidence
`scripts/audit-react-visual-parity.mjs` and workflow `hummin-react-visual-parity.yml` provide real production vs isolated Preview pixel comparison and preserve screenshot diffs as GitHub Actions artifacts. The initial comparison failed, with approximately 16–24% mismatch on the prior homepage Preview. This is expected evidence of insufficiency, **not** a reason to lower the acceptance threshold.

Only claims backed by post-deployment comparisons of the specific commit under discussion count as verified. Work committed after the deployed Preview must not be described as accepted.

Status: **NOT APPROVED FOR PRODUCTION REPLACEMENT.** The public website must remain on its approved legacy rendering until these source-fidelity gates pass.
