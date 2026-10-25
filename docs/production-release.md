# HUMMIN production staging and controlled cutover

Prepared 25 October 2026. **Production site and Google Workspace DNS are not changed by these steps.**

## Verified environment inventory
- Existing website: `hummin.org` is an active Cloudflare zone. Apex A record currently points to `68.65.120.91`, proxied. `www` CNAME targets apex.
- No HUMMIN Worker routes or custom Worker domains are installed. MX records continue to point to Google Workspace.
- Preview Worker: `hummin-web-preview`, preview D1 `a6fb62df-824e-4231-8630-34ce1e6c27f4`.
- New isolated production D1: `hummin-web-production`, `acd04e85-a433-463b-865f-a01f8aac3e27`. Do not copy preview account sessions, invented test records, OTP challenges, or test bookings.
- Staging Worker intended name: `hummin-web-production`; public custom domain routing **not configured**.

## Safe sequence
1. Verify `npm run check:production:config` and all CI steps, confirm precise commit SHA.
2. Run `npm run db:production` from the approved branch with authenticated Cloudflare operator access. This applies all tracked migrations using Wrangler (do not execute raw migration SQL without recording Wrangler migration state).
3. Review D1 migration results, ensure fresh empty operational/customer tables. Confirm retention, least-privilege policy, backups/time-travel recovery capability.
4. Create a standalone staging Worker only with `npm run deploy:production:staging`. Ensure no custom hostname routes are assigned. It uses `workers.dev` and the isolated database; contact, booking, availability and Admin authentication are explicitly OFF.
5. Configure `RESEND_API_KEY`, `EMAIL_FROM`, Turnstile and calendar credentials only when authorised. Never commit tokens. Explicitly enable services only after real end-to-end tests; do not copy the preview Admin pepper or customer records.
6. Test homepage, assessment, Insights index/article/author/topic/SEO, newsletter, downloads, forms, OTP, security and accessibility at desktop/mobile sizes. Verify any published CMS articles and redirect behaviour, canonical links, no indexing of staging and no unexpected outbound email.
7. Provision `sales@hummin.org` as Owner in production through an authorised workflow. Do not assume preview identities exist in production.
8. Capture the pre-cutover apex A record and public response; document an operator who can roll back the site rapidly. Confirm HTTPS, www redirect, caching, robots, sitemap, logging and traffic monitoring.
9. **Separate owner approval required:** attach production Worker routes/domains to `hummin.org` and `www.hummin.org` only after service/visual/security gates succeed. Keep MX/SPF/DKIM/DMARC records untouched.
10. Post-cutover, test each public workflow, email deliverability, live booking, Admin login, CMS publication, and restore procedures. Roll back routing to prior server immediately for critical failures.

## Outstanding hard gates
- Google Calendar booking is disabled on preview. Preview documentation records API event creation but not the full published assessment-to-calendar flow.
- Automated CI success is not a substitute for device-sized visual parity testing of the supplied website and Admin HTML.
- Verify legal/privacy/retention review and final brand assets.
- Verify production sender deliverability, abuse prevention, booking/replay protection, OTP session protection and newsletter unsubscribe.
- Verify analytics with actual recorded events.
- Approve the public domain cutover explicitly, after the above.
