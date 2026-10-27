# HUMMIN native source interactions — acceptance evidence
27 October 2026 · Development only · **Public cutover: BLOCKED**

## Verified functionality

- **23-question Assessment:** full original answer flow, numeric validation, weighted five-area score, estimated cost, local results gate, restart. The [69-step, 3-width browser run](https://github.com/bjuta/hummin/actions/runs/40556964561) passed at 390/768/1440px, with no booking, email, or enquiry mutations.
- **Contact Preview:** source-native fields, inline errors and a real request/response to `/__source-verify/contact`. [3/3 viewport browser runs and 4 unit tests](https://github.com/bjuta/hummin/actions/runs/40563600130) passed. The preview-only endpoint shares **the same accepted field names and length rules** as the public handler, but does not import/call it; parity must be reverified if either implementation changes. Its response explicitly says **delivered:false**, with no D1/email integration. Rejects known public hosts, cross-origin requests, oversized/malformed payloads and honeypot violations.
- **Insights Preview:** React's 29 source-transcribed lowercase `onclick`/`onchange` attributes were corrected to native `onClick`/`onChange` bindings without changing layout markup. The [3/3 viewport browser run](https://github.com/bjuta/hummin/actions/runs/40564414422) passed search, type filters, approved featured article and return navigation with zero transactional calls. Only the original **enquiries-30-day-fix** article and source-backed Marketing topic are wired; unsupported pages never impersonate a different article. Newsletter submits do not send.
- **Offline backend service regression:** [73/73 tests](https://github.com/bjuta/hummin/actions/runs/40564702116) passed across mocked mail, booking, Admin, Insights publications, analytics/SEO, and Assessment domain logic.

## Strict visual gate

The updated post-Insights-interaction full 42-case source/native visual gate is [run #40564661323](https://github.com/bjuta/hummin/actions/runs/40564661323). **Use its actual completed conclusion** to determine whether the currently deployed interactive Preview maintains 42/42 visual acceptance. Older run #40557216199 passed prior to these particular interaction changes and cannot substitute for a fresh release certificate.

## What this deliberately does not claim

1. Native contact **live delivery** is not connected. The isolated validation route never writes an enquiry or queues an email. The approved public `/contact` action still has the original origin, honeypot, Turnstile and D1/outbox requirements.
2. Assessment result **email and live calendar** integration is not connected. No original mock slot should be represented as bookable; actual appointment confirmation requires a successful provider-backed reservation.
3. Insights full editorial/CMS route navigation, all article bodies, gated downloads and newsletter double opt-in are **not complete**. The source-native Preview only represents explicitly verified view models.
4. Admin authenticated staging browser acceptance, production configuration, accessibility/SEO cutover checks and the rollback/retirement plan remain independent release gates.
5. Nothing in these tests authorizes production routing changes, database migrations, external delivery, HTML removal or merging the dev branch to main.

## Preserved safeguards

- All interaction work is on `feat/fullstack-workers-foundation`, not `main`.
- `hummin.org` and `www.hummin.org` reject the isolated Preview routes.
- Public HTML fallback stays intact, preserving a rollback path until an explicitly approved cutover.
- Full end-to-end testing may use fictional `example.test` visitors, but must not queue mail, reserve calendar events or modify production D1 data.
