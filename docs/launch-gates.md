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
- [ ] Connect a confirmed HUMMIN-owned Google Workspace calendar using Worker-specific OAuth secrets; test FreeBusy, conflict prevention, meeting creation, invites and cancellation behaviour.
- [ ] Add booking endpoint rate limiting and form abuse protections before enabling `BOOKING_ENABLED`.
- [ ] Establish production D1, backups, incident/recovery process and monitoring.
- [ ] Approve the PR, production deployment, domain cutover, and indexability changes.

## Defer calendar credentials without blocking design QA

Calendar authentication is explicitly deferred. Keep `BOOKING_ENABLED=false`, with a visible mailto fallback and no collection of booking details. A connected ChatGPT calendar belonging to a different organisation must never be silently adopted as the HUMMIN booking calendar.

The same applies to contact: keep `CONTACT_ENABLED=false` until security and genuine notification delivery are verified. Neither preview nor documentation should claim that untested services work in production.

## Security defaults

Do not commit OAuth refresh tokens, API secrets, attendee or customer data to GitHub. Do not create test bookings against an unrelated calendar. The production DNS, email routing and site remain untouched until the owner explicitly authorises the change.
