# HUMMIN native integration acceptance — 27 October 2026

**Branch:** `feat/fullstack-workers-foundation`  
**Public release:** BLOCKED; production `main`, email providers, D1 and Calendar untouched.

## Final restored visual release gate

- Consolidated **42/42 PASS** on the latest isolated Preview: [run 40573986728](https://github.com/bjuta/hummin/actions/runs/40573986728), evidence [artifact 12766756996](https://github.com/bjuta/hummin/actions/runs/40573986728/artifacts/12766756996).
- Seven marketing routes 21/21, Assessment and four Insights states 15/15, Privacy/Terms 6/6.
- Previously intermittent 390px Insights mismatch was a frame-settling race in screenshot capture, not a durable page-height mismatch: original/native comparison now reports **0px height difference and 0.816% pixel difference**. The strict thresholds remain 8% pixel difference and 12px page height.
- Independent three-session mobile original/native frame stability [run 40574448080](https://github.com/bjuta/hummin/actions/runs/40574448080) proves identical **3,683px frame heights and 4,348px pages** in all three checks, with no horizontal overflow.
- Audit script now waits for steady actual frame metrics before capturing evidence. It does not edit the page, screenshots, styling or release thresholds.

## Source-backed native integrations

| Integration | Implementation | Evidence | Release meaning |
| --- | --- | --- | --- |
| Assessment result validation | `app/lib/assessment-delivery-contract.ts`; the existing protected `/api/assessment/email` uses the same parser as `/__source-verify/assessment`. Native Assessment performs one POST before a **local** unlock. | [11/11 functional tests](https://github.com/bjuta/hummin/actions/runs/40566564266); [3/3 browser widths, 69 question interactions](https://github.com/bjuta/hummin/actions/runs/40567004385). | Contract and native-to-Preview integration accepted. **No Turnstile challenge, email enqueue, or subscriber-facing delivery occurs in Preview.** |
| Booking provider client | `app/lib/booking-native-client.ts`, `tests/booking-native-client.test.mjs` | [Booking client and backend suite](https://github.com/bjuta/hummin/actions/runs/40568254267). | Client accepts only real provider-supplied slots. A reservation requires an explicit request, Turnstile token, and successful server response including an event ID. **Not mounted as a booking UI in Preview.** |
| Newsletter validation | `app/lib/newsletter-contract.ts`; public `/newsletter` reuses the parser; isolated `/__source-verify/newsletter` only checks syntax and same-origin request. Native Insights subscribes to this Preview check, not real newsletter service. | [3/3 real-browser acceptance](https://github.com/bjuta/hummin/actions/runs/40568619572); [88/88 offline tests](https://github.com/bjuta/hummin/actions/runs/40568254267). | Native-to-Preview contract accepted. **No subscribers created, confirmation emails queued or real opt-ins submitted.** |
| Existing Contact | Native `/__source-preview/contact` -> `/__source-verify/contact`. | [3/3 browser widths](https://github.com/bjuta/hummin/actions/runs/40563600130). | Safe request/response verified, no real enquiries submitted. |
| Insights source navigation | Source-derived React state, search, tabs, approved article, navigation and no-delivery newsletter. | [3/3 interactive checks](https://github.com/bjuta/hummin/actions/runs/40568619572). | Selected source views functional, all CMS routes not yet integrated. |

These are test-specific assurances, not claims of production transactional acceptance. The preview-only validation endpoints reject `hummin.org` and `www.hummin.org`, require same origin, report no delivery and do not import outbox, Calendar, or D1 mutations. Turnstile **is not simulated as successful** in these endpoints.

## Verified Preview configuration

`wrangler.preview.jsonc` names an independent Workers deployment (`hummin-web-preview`) and D1 binding (`hummin-web-preview`), rather than the public Worker/database names. Its configured `BOOKING_ENABLED` is explicitly `"false"`, and no availability-enable flag is declared. The source-native booking client is **not wired to a real booking button**. Therefore this checkpoint has no authorized live booking path.

The repository cannot prove whether externally stored Preview secrets or calendars are truly sandboxed; verify them separately before activating any transactional endpoint. No booking flag, real email provider, secret or Google Calendar credential has been enabled or changed here.

## Verified Preview external-effect isolation — 27 October 2026

A read-only inspection of the **deployed** Cloudflare `hummin-web-preview` Worker confirmed that its D1 binding matches the repository Preview database, booking is switched off, and its base URL points to the isolated Worker. The account also has **Resend, Turnstile and Google Calendar credentials configured**, and `CONTACT_ENABLED` is on. Credential presence does **not** establish that those external providers are sandbox accounts.

To close that exposure without changing secrets or provider state, development code now explicitly blocks live transactions on every hostname except the owner-approved public `hummin.org` and `www.hummin.org`. This includes `/contact`, `/api/assessment/email`, `/api/booking/reserve`, `/newsletter`, and external calendar availability queries. The original contact-page fallback no longer advertises an active transactional form on Preview. Scheduled mail dispatch, newsletter queues and calendar reconciliation are disabled when the Worker `SITE_URL` is not an approved public hostname. All three no-delivery `/__source-verify/...` endpoints remain independently usable for UI testing.

- [Five deployed safety probes — 5/5 PASS](https://github.com/bjuta/hummin/actions/runs/40576903097): all four fake invalid transactional POST requests rejected HTTP 503, and booking slots reported disabled with no slots. No real recipient, booking or provider mutation was submitted.
- [Existing service and host-safety regression — 92/92 PASS](https://github.com/bjuta/hummin/actions/runs/40576152047).
- External provider credentials were neither read in plaintext nor modified. No staging/provider delivery is claimed and no production host cutover was approved.

**This is a deliberate fail-closed barrier**: isolated transaction testing must use separately authorized sandbox providers and a separately reviewed route/mode. Do not remove it merely to make real service calls from Preview. The presence of previously configured secret bindings is a reason for stricter isolation, not permission to use them.

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
