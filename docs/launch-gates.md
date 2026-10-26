# HUMMIN launch gates

**Scope:** `feat/fullstack-workers-foundation` is a private development/preview integration, not an approved public launch. `hummin.org` and Google Workspace DNS must remain unchanged until explicitly approved.

## Completed in development source
- [x] Original standalone site design is restored from its exported HTML rather than recreated visually.
- [x] Original assessment questions, scoring and results code are retained in the exported experience.
- [x] Calendar interface calls real Worker endpoints, not generated appointment availability or fictional confirmations.
- [x] Cloudflare preview D1 has the `enquiries` and `booking_slots` tables and booking index (verified 25 October 2026).
- [x] Preview configuration fails closed with `CONTACT_ENABLED=false` and `BOOKING_ENABLED=false`.
- [x] Inactive contact experience offers a direct mailto link rather than a fake enquiry confirmation.
- [x] Repository verification script checks fidelity anchors, routes, booking safeguards and disabled preview configuration.

## Release blockers — validation, operational services and approvals
- [ ] Verify latest GitHub CI **and** successful Cloudflare automatic deployment of the same commit.
- [ ] Compare rendered preview against supplied original site and assessment across desktop and mobile; check fonts, icons, imagery, layouts, motifs, transitions, and accessibility.
- [ ] Complete keyboard, screen-reader, and browser-back navigation testing.
- [ ] Approve final HUMMIN logo/photography assets and confirm permissions.
- [ ] Approve privacy notice, data retention periods, and contact/assessment consent handling.
- [ ] Configure and test Turnstile + Resend sender on an approved subdomain with end-to-end delivery to `sales@hummin.org`; don't change Google Workspace MX records.
- [ ] Review pending/failed enquiry records, failure notifications and operational access.
- [ ] Calendar credentials exist in preview and a historical confirmed record is present; earlier documentation claims a test dated 28 October 2026, which is later than this audit date. Repeat and record a contemporaneous acceptance with timestamp and consent before marking Google Calendar verified.
- [ ] Confirm invitation receipt, cancellation/reconciliation behaviour, and an end-to-end appointment through the published assessment UI.
- [x] Source implementation: D1-backed anonymous rate limits, booking Turnstile verification and dual booking feature gates (commit `b59832d6`, pending end-to-end acceptance).
- [x] Preview D1 schema for `0010_booking_abuse.sql` applied directly and all three objects verified on 26 October 2026. Preview has no Wrangler migration ledger; do not present this as a tracked migration.
- [x] Preview D1 schema `0011_booking_reconciliation.sql` applied directly and all three objects verified (no Wrangler ledger in preview).
- [x] Google cancellation and movement reconciliation unit tests passed in CI on commit `5b822cc6`; reminders and queued confirmations recheck Google event state before dispatch.
- [ ] Apply tracked `0010_booking_abuse.sql`, `0011_booking_reconciliation.sql` and `0012_booking_change_history.sql` via approved Wrangler production-staging workflow; check `d1_migrations` and quotas before activation.
- [ ] Run controlled Turnstile browser acceptance on an authorised preview hostname; verify success, replay rejection, wrong action, missing token, and rate limiting.
- [ ] Verify one genuine Google Calendar reservation (FreeBusy, invitation receipt, Meet link, Google event and D1 record), conflicting simultaneous requests and moved/cancelled appointment reconciliation.
- [ ] Verify Google event insert timeout and database confirmation failures recover without creating ghost bookings; verify booking confirmation and reminder messages arrive in intended inboxes.
- [ ] Establish production D1, backups, incident/recovery process and monitoring.
- [ ] Approve the PR, production deployment, domain cutover, and indexability changes.

## Booking remains deliberately off until launch protection

Calendar authentication is configured and verified on the preview Worker. Keep `BOOKING_ENABLED=false` until anti-abuse protection, invitation delivery and the complete assessment-to-booking flow are verified. The live slots API must show no bookable choices while booking is disabled.

The same applies to contact: keep `CONTACT_ENABLED=false` until security and genuine notification delivery are verified. Neither preview nor documentation should claim that untested services work in production.

## Security defaults

Do not commit OAuth refresh tokens, API secrets, attendee or customer data to GitHub. Do not create test bookings against an unrelated calendar. The production DNS, email routing and site remain untouched until the owner explicitly authorises the change.

## Current single-slice engineering audit, 26 October 2026

Evidence is not a launch substitute. GitHub PR #1 remains draft, production custom routes and public DNS remain unchanged. Preview currently has one confirmed booking row, and staging none; D1 outbox 'sent' means provider acceptance, not recipient-side inbox delivery. Do not claim receipt until checked on the consenting attendee account.

Fail-closed policy: turn on **both** `BOOKING_ENABLED` and `BOOKING_AVAILABILITY_ENABLED` only after Turnstile, Resend, Calendar, migration, and genuine end-to-end acceptance. A deployed Worker or a passing CI suite is not the same as live permission to release.

Remaining acceptance ownership: privacy and consent copy, browser accessibility and visual parity, exact staging service settings and anti-drift, real attendee confirmation, backup/rollback rehearsal, and an explicitly approved launch window. Never make a production domain cutover as a side effect of this security slice.

### Additional release evidence (26 October 2026)

GitHub CI and Cloudflare Preview Build passed at commit `5b822cc6`. Preview has both security and reconciliation schemas. The Google cancellation/movement recovery tests are deterministic mocked-behavior tests, **not live Google Calendar delivery or attendee tests**. The production-staging `d1_migrations` ledger remains at nine records until approved Wrangler migration; do not execute raw production SQL or manually forge migration history. The connected Google Calendar account is not the HUMMIN booking account, and recipient-side delivery cannot be certified from that connection. Public DNS and live booking remain unchanged.

### Rescheduled appointment integrity — 26 October 2026

- [x] Source retains Google event ID and booking row when an appointment moves; validated with mocked Google responses and D1 transactional tests.
- [x] Repeated moves each receive an independent append-only `booking_change_history` record; cancellation preserves an audit and releases the old slot only after repeated observations.
- [x] Booking confirmation and reminder idempotency keys include the appointment time, allowing fresh email after a move; the mail worker still verifies the current Google event before dispatch.
- [x] New `0012_booking_change_history.sql` table/index applied and inspected on Preview D1 (direct schema, not tracked Wrangler migration).
- [x] GitHub CI and Cloudflare Preview build passed at `14febc632e5c1ee664e0f7dee09ef6680aba4457`.
- [ ] Apply migrations 0010, 0011, and 0012 to the isolated Production Staging D1 through the approved Wrangler workflow and confirm ledger entries; no manual SQL substitutions.
- [ ] Verify receipt of both a new booking invitation and a moved-appointment invitation with consenting attendee; verify delivery outcomes beyond provider acceptance.

## Verified production-staging acceptance — 26 October 2026 (supersedes earlier preview-only statements)

- [x] Tracked D1 migrations 0010–0012 applied to isolated production-staging D1; confirmed in `d1_migrations`.
- [x] Staging Worker has all 19 bindings; Google booking and Turnstile keys configured and both staging booking gates enabled.
- [x] Real published assessment completed, slot chosen, Turnstile accepted by live booking flow, Google event created and attendee invited; D1 confirmed matching event for Wednesday 28 October 2026, 10:00–10:30 EAT.
- [x] Recipient provided PDF of Google invitation showing attendee, exact appointment, RSVP options and Meet link.
- [x] Resend accepted assessment-results and HUMMIN-branded customer confirmation messages. **External recipient inbox receipt for the separate branded confirmation is not independently evidenced.**
- [x] Branded internal new-booking notification for this same event recovered by five-minute mail cron and independently found in `sales@hummin.org` Gmail on 26 October at 10:50 EAT.
- [x] New internal-booking notification tests and staging deployment succeeded (GitHub Actions run 40287665241).
- [ ] **Launch blocker**: `/privacy` currently says 'Privacy notice under review' and is not a publishable privacy statement. Approve accurate purpose, processor, retention, deletion, cookies, security and contact disclosures and replace this page before routing `hummin.org`.
- [ ] **Launch blocker**: Owner acceptance of supplied website across desktop/mobile and keyboard accessibility, plus licensed assets and contact consent.
- [x] HUMMIN-branded visitor confirmation **received** at `grimpossible@gmail.com` on 26 October 2026 at 10:13 EAT. Recipient-provided Gmail PDF confirms sender `HUMMIN <hello@hummin.org>`, reply-to `sales@hummin.org`, Wednesday 28 October 2026 at 10:00–10:30 EAT, Meet/Calendar actions and HUMMIN styling. Resend provider ID `01a1770e-b31a-77a7-ac13-d840150f8b2b` matched staging outbox acceptance.
- [ ] Scheduled 24-hour booking reminder is queued for 27 October 2026 at 10:00 EAT; recipient-side delivery cannot be certified before it is sent.
- [ ] Controlled parallel-booking and Google move/cancel/timeout testing on isolated staging remain unverified live; mock unit tests passed.
- [ ] Confirm backup/rollback rehearsal, monitoring, operational ownership and owner-approved public-domain cutover. No `hummin.org` routes changed.

The earlier portions of this file document historical development states and must not be interpreted as the current staging status. Continue testing on **Production Staging**, not Preview.
