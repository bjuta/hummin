# HUMMIN HTML retirement — safe, explicit, reversible

## Status on 26 October 2026

**The React source build is standalone; the public website has not cut over.**
The owner-authored legacy HTML is still in `design/sources` and is still
used by public routing through `app/routes/fidelity.ts` on `hummin.org`.
Deleting it before an approved public cutover would break the active fallback.
Do not confuse a Preview deploy with public release approval.

### What no longer requires the archived HTML

- React typography and artwork are committed under `public/brand/`,
  including production WebP photography, original SVGs and local WOFF2 fonts.
- Source-authored Insights article bodies are committed in
  `app/lib/react-original-insights.json`.
- The design foundation is committed as `app/components/source-foundation.css`.
- `npm run prebuild` only generates the independent Insights downloads.
- `npm run typecheck` no longer invokes an HTML extraction step.
- The Preview workflow physically hides `design/sources` during build and
  runs React source-contract, asset, SEO and TypeScript checks.

### What must remain until owner-approved public cutover

- `design/sources/**` (the immutable reference archive)
- `scripts/restore-original.mjs` and `app/routes/fidelity.ts`
  while public `*.gated.tsx` routes still select the original loader.
- The currently active production Worker route configuration and production
  database bindings. Neither is altered by this preparation.

## Retirement procedure

1. **Release approval:** obtain explicit owner sign-off on production-faithful
   React layout and functionality, including the assessment, Insights, contact,
   appointment calendar, newsletter, accessibility, SEO and responsive views.
   No actual test emails or appointments to real recipients.
2. **Preserve rollback:** record the last known good production Worker
   version and commit SHA and preserve the design archive in Git history
   (prefer an immutable release tag). Record the existing public route
   and D1 bindings before changing anything.
3. **Cut over public routes as a separate, reviewable commit:** only after explicit owner approval, switch the reviewed literal `PUBLIC_REACT_CUTOVER_APPROVED` in `app/lib/react-cutover.server.ts` from `false` to `true`. The four canonical route gates are prepared for that change, including native Insights CMS data and canonical metadata. This is deliberately **not a runtime flag** or a Cloudflare dashboard variable. Retain the correct form actions, SEO headers and rollback path. Do not change DNS, traffic routing, database bindings or email secrets as part of this preparation.
4. **Run one consolidated production-staging gate:** test with a truly
   source-free checkout, including native routes, images, responsive
   behavior, backend integration, data migration state and secure API
   protections. Do not create real bookings or send emails in smoke tests.
5. **Deploy only after sign-off:** verify real public traffic goes to React,
   and that the previously functional enquiry/booking/newsletter routes,
   structured metadata, and rollback process still work.
6. **Check readiness:** run `npm run verify:html-removal-ready`.
   It intentionally fails while the legacy public fallback is present.
   Do not bypass, suppress or weaken the guard to obtain a green result.
7. **Remove archived source in a separate commit:** only after step 6 passes,
   delete `design/sources/**`, any unused `public/design/**` and the
   now-dead restoration and loader code. Update tests and documentation
   which describe that old fallback. Do not remove any `public/brand/**`
   asset or versioned Insights JSON.
8. **Prove removal:** run
   `node scripts/check-legacy-html-detach.mjs --assert-removed`, normal
   React build/typecheck plus one minimal functional regression check.
   Retain the Git tag/commit and Worker rollback for recovery.

**Current release decision:** no deletion, no public cutover. A green
standalone build is necessary but not a replacement for visual and
interaction sign-off.
