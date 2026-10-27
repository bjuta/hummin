# HUMMIN native integration acceptance — 27 October 2026

**Branch:** `feat/fullstack-workers-foundation`  
**Public release:** BLOCKED; production `main`, email providers, D1 and Calendar untouched.

## Source-backed native integrations

| Integration | Implementation | Evidence | Release meaning |
| --- | --- | --- | --- |
| Assessment result validation | `app/lib/assessment-delivery-contract.ts`; the existing protected `/api/assessment/email` uses the same parser as `/__source-verify/assessment`. Native Assessment performs one POST before a **local** unlock. | [11/11 functional tests](https://github.com/bjuta/hummin/actions/runs/40566564266); [3/3 browser widths, 69 question interactions](https://github.com/bjuta/hummin/actions/runs/40567004385). | Contract and native-to-Preview integration accepted. **No Turnstile challenge, email enqueue, or subscriber-facing delivery occurs in Preview.** |
| Booking provider client | `app/lib/booking-native-client.ts`, `tests/booking-native-client.test.mjs` | [Booking client and backend suite](https://github.com/bjuta/hummin/actions/runs/40568254267). | Client accepts only real provider-supplied slots. A reservation requires an explicit request, Turnstile token, and successful server response including an event ID. **Not mounted as a booking UI in Preview.** |
| Newsletter validation | `app/lib/newsletter-contract.ts`; public `/newsletter` reuses the parser; isolated `/__source-verify/newsletter` only checks syntax and same-origin request. Native Insights subscribes to this Preview check, not real newsletter service. | [3/3 real-browser acceptance](https://github.com/bjuta/hummin/actions/runs/40568619572); [88/88 offline tests](https://github.com/bjuta/hummin/actions/runs/40568254267). | Native-to-Preview contract accepted. **No subscribers created, confirmation emails queued or real opt-ins submitted.** |
| Existing Contact | Native `/__source-preview/contact` -> `/__source-verify/contact`. | [3/3 browser widths](https://github.com/bjuta/hummin/actions/runs/40563600130). | Safe request/response verified, no real enquiries submitted. |
| Insights source navigation | Source-derived React state, search, tabs, approved article, navigation and no-delivery newsletter. | [3/3 interactive checks](https://github.com/bjuta/hummin/actions/runs/40568619572). | Selected source views functional, all CMS routes not yet integrated. |

These are test-specific assurances, not claims of production transactional acceptance. The preview-only validation endpoints reject `hummin.org` and `www.hummin.org`, require same origin, report no delivery and do not import outbox, Calendar, or D1 mutations. Turnstile **is not simulated as successful** in these endpoints.

## Production protections retained

- Public website routes still resolve to the legacy source restoration in `app/routes/fidelity.ts`; no automatic public React cutover, PR merge, DNS change or HTML retirement.
- Existing `/api/assessment/email` still requires Turnstile hostname verification, D1 and outbox.
- Existing `/api/booking/slots` only returns provider-derived availability if booking prerequisites are configured, and `/api/booking/reserve` still requires origin/rate/Turnstile validation, a Google event and D1 persistence.
- Existing newsletter route requires Turnstile, outbox enqueue and explicit double-opt-in confirmation.
- A Preview-only 200 response must **never** be labelled a sent email, created subscriber, or booked slot.

## Remaining integration gates, in priority order

1. **Provider-isolated staging:** Verify that Preview has a dedicated non-production D1 database, Turnstile preview hostname/site key, sandbox/test email delivery and separately designated calendar before any live route is enabled. Fail closed if these cannot be verified.
2. **Native real enquiry and assessment email flows:** Integrate Turnstile widgets and secure POST with idempotency, data retention and outbox tests; verify non-delivery/sandbox outcomes and error recovery before controlled live delivery.
3. **Booking UI and explicit reservation:** Display real `/api/booking/slots` output only when verified in dedicated staging; fetch latest availability before reserve. Confirm only on `ok:true` + provider event id; handle 409 conflict and provider/D1 reconciliation. No original deterministic mock slots.
4. **Newsletter:** Connect live double-opt-in only after isolated provider and Turnstile verification. Never subscribe someone automatically when they use contact or assessment.
5. **Full Insights/CMS and Admin:** All published articles, author/topic pages, downloads, editorial workflows and authenticated role-based staging browser tests.
6. **Final release:** Run strict 42-case visual gate on final candidate, functional and security regressions, accessibility and SEO checks, rollout/rollback drill and owner approval. Keep public restoration fallback until cutover is accepted.

## Acceptance criteria

The complete release cannot pass merely because visual screenshots match or a no-delivery validator returns 200. The final approval requires separate factual evidence of successful, legitimate delivery and Google Calendar reservations on a dedicated isolated environment before any live production action. Do not claim these presently exist.
