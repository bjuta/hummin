# HUMMIN native migration — functional acceptance checkpoint
**Date:** 27 October 2026  
**Branch:** `feat/fullstack-workers-foundation`  
**Release decision:** NOT READY FOR PUBLIC CUTOVER. The existing public site and production services stay unchanged.

## Verified at the current Preview deployment

| Gate | Evidence | Status and scope |
|---|---|---|
| Original-source visual parity | [GitHub Actions #40557216199](https://github.com/bjuta/hummin/actions/runs/40557216199) | **42/42 pass**, original versus same native Preview, 390/768/1440px, ≤8% pixel difference, ≤12px document-height difference; 21 marketing, 15 Assessment/Insights, 6 legal |
| Full Assessment browser path | [GitHub Actions #40556964561](https://github.com/bjuta/hummin/actions/runs/40556964561) | **3/3 viewport runs pass:** 23 source-derived questions per width, 69 question interactions total, weighted scoring, original priority plan, local unlocking and restart |
| Offline service regressions | [GitHub Actions #40557683376](https://github.com/bjuta/hummin/actions/runs/40557683376) | **73/73 tests pass** across mocked enquiry/email/booking, Insights publishing, Admin, analytics/SEO and native Assessment |
| Assessment source-data export | [GitHub Actions #40552997703](https://github.com/bjuta/hummin/actions/runs/40552997703) | PASS, original 23 questions, scoring factors, numeric inputs, currencies and plan descriptions exported as versioned JSON; no runtime dependency on original HTML |
| Isolated Preview deployment | [GitHub Actions #40556495295](https://github.com/bjuta/hummin/actions/runs/40556495295) | PASS, source routes available on Workers Preview only, public-host 404 guard retained |

Visual acceptance is **not** an endorsement of endpoint integration or public deployment. The reported 42/42 was remeasured on the Assessment-capable Preview rather than inheriting the earlier static-Preview result.

## Native Assessment source contract

- `app/data/ApprovedAssessmentContract.generated.json`: signed-by-content original-source inputs, generated using `scripts/export-native-assessment-contract.mjs`.
- `app/lib/assessment-native.ts`: pure 23-step model, answer validation, five-area weighted score and estimate, result recommendations.
- `app/components/SourceAssessmentInteractive.tsx`: native React intro, full flow, results and local unlock. The source-transcribed component markup and design tokens are reused rather than redrawn.
- `tests/source-assessment-native.test.mjs`: author-data, input validation, score and source-routing unit cases.
- `scripts/accept-source-assessment-functional.mjs`: three-width real browser test, waits for hydration, no external mutations.
- No booking slot may be shown as available from the original source's deterministic **mock calendar**. The local result unlock must not claim an email was sent. Preview explicitly does not call booking reserve/assessment email/contact endpoints.

## Remaining cutover blockers

1. **Native contact form to backend:** The source-faithful `SourceMarketingPreview` currently displays a non-delivery notice instead of calling `app/routes/contact.tsx`. Production backend unit tests pass but native browser-to-service integration is not accepted. Preserve field validation, honeypot, Turnstile hostname validation, origin checks, rate/security controls and atomic outbox enqueue.
2. **Assessment result delivery and actual booking:** Native Assessment computes and unlocks locally only. It is not connected to `/api/assessment/email`, `/api/booking/slots`, or `/api/booking/reserve`. Any eventual integration must use real availability and explicit Turnstile verification, avoid real recipient deliveries in tests and never use the legacy mock calendar's fabricated slots or local calendar files as confirmation.
3. **Insights interactions and CMS:** Current source-native editorial Preview uses source-authored static view models; search/filter/article/topic/author actions and newsletter/download requests still require full, tested client event wiring and CMS publication behavior. Several source-compiler props remain lowercase `onclick`/`onchange` and cannot be counted as working native React event handlers merely because their screens render correctly.
4. **Authenticated Admin:** Mocked auth/data/operations regression suite passed; no live authenticated administrative browser acceptance was attempted. Require secure permission/session verification against isolated staging state.
5. **Production readiness:** End-to-end integration/abuse checks, accessibility/SEO, production Worker config/migrations, reversible rollback and explicit owner sign-off remain mandatory. Run an updated unified 42-case source-fidelity gate **after any new presentation changes**.

## Production and audit safety

The public `main` deployment was **not modified** in this phase. `app/routes/fidelity.ts` and archived `design/sources/**` are retained while public pages use the reversible fallback. No real email was sent, no calendar appointment was reserved, and no production D1 table was mutated as part of these isolated functional and visual checks. Do not set any cutover switch, merge to `main`, change public routing, remove archived HTML, or deploy to a public custom domain without the owner's separate explicit approval.

## Release sequence

Continue safe, mocked native-to-service integration tests, then isolated staging behavior verification with no actual side effects. Repeat functional, security and visual acceptance as one documented candidate, preserve a production rollback point, obtain explicit approval, and only then consider a reviewed cutover. HTML retirement is a separate post-cutover procedure.
