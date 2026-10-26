# HUMMIN source-fidelity audit — 26 October 2026

## Exact tested code and evidence

- Isolated React Preview deploy: `6fa0c1d36771` (passed build/deploy).
- One-shot gate workflow: `1c4652b85590`, GitHub Actions run **40374412800**.
- Canonical functional, structure, accessibility gate: **42/42 passed**.
- Browser capture parity: **3/42 passed, 39/42 failed**. These are **NOT** release approval.
- Passing widths/routes: Applied Expertise at 768px; Privacy at 1440px; Terms at 1440px.
- Comparison was read-only, with original/reference and React full-page captures, pixel diff and page height delta, across 14 URLs × 390/768/1440px.
- Exact screenshot evidence: `hummin-native-react-canonical-design` artifact from run 40374412800.

## Reference-capture integrity caveat

The full-page production screenshots appear to contain nontrivial unrendered/absent content at the time of capture. This is distinct from the owner's approved underlying design HTML:

- **How We Work:** Original design has four requirement columns. In the production full-page capture, the commitment heading renders, but the columns are visually absent. React renders them.
- **Assessment:** Production full-page capture truncates much of the expected assessment introduction and ends near the start of the four information cards; React displays all four cards. Extreme screenshot pixel differences (40.3% on mobile) do not establish a legitimate React-content defect.
- **Insights author/team:** Reference screenshot displays only a small plain article-like heading, with large blank body, not the original Insights author hero, authored bio or editorial list. React implements the author UI from the owner's Insights source bundle. The 54.6% desktop difference is not reliable design evidence.
- **About:** Production screenshot has a large blank area where original source declares the dictionary explanation, while React displays it.

**Do not delete content, blank sections, or remove accessible interactions in React to reproduce incomplete production captures.** An audit exception is not a pass. These routes require a repaired source browser capture or side-by-side comparison against the original owner-authored design source.

## Verified genuine discrepancies from the same screenshot artifact

- Homepage source problem cards have subtle or effectively hidden hummingbird motifs; Preview over-emphasised a large white hummingbird. Adjusted motif opacity without replacing the original artwork.
- Contact form sat immediately below hero in Preview; original design body has a 64–112px fluid upper inset. Source-measured inset restored.
- Who We Work With's assessment button was terracotta in Preview; the original source uses dark charcoal with grey hover. Corrected to source style.
- Insights article sidebar/help region expanded too widely on desktop. Constrained to the source's restrained editorial column proportions.
- Minor card spacing, caption sizing, and section rhythm differences remain measurable, especially Engagements and Insights lists.

These post-audit CSS fixes are committed **after** tested Preview `6fa0c1d36771`; they have not been deployed or verified. Do not claim a new passing rate from those commits.

## Next safe completion sequence

1. Use the saved 42 source/react/diff sets to correct actual UI differences in **one source-based local batch**, never changing the target to match blank screenshots.
2. Preserve original React data + D1, Calendar, Resend, Turnstile integrations; verify transactional routes in a non-delivery test mode.
3. Stage **one** consolidated Preview deployment when the batch is complete. Do not automatically dispatch multiple CI suites.
4. Run **one** post-deploy canonical/visual release gate. Distinguish trustworthy reference comparisons from invalid/incomplete source captures.
5. Obtain owner's explicit sign-off before public cutover; do not change `hummin.org`, production routing, D1 or messaging meanwhile.

**Release status: BLOCKED (visual source fidelity not certified).**
