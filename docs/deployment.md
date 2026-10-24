# Cloudflare deployment runbook — NOT YET PRODUCTION READY

1. Confirm repo branch checks green; review content, accessibility and browser QA.
2. In Cloudflare, create Workers/D1 and run `npx wrangler d1 create hummin-web`.
3. Edit `wrangler.jsonc`: add comma after `vars` and a real `d1_databases` binding:
   ```json
   "d1_databases": [{"binding": "DB", "database_name": "hummin-web", "database_id": "COPY_REAL_D1_UUID", "migrations_dir": "migrations"}]
   ```
4. Run `npm run db:local`; verify local form against D1.
5. Create Turnstile site. Set allowed domains for preview and hummin.org; configure `TURNSTILE_SITE_KEY` in `wrangler.jsonc` and `TURNSTILE_SECRET_KEY` as a Worker secret. Production submissions reject missing Turnstile.
6. Register Resend account and verify `notify.hummin.org` (recommended sender `HUMMIN Website <website@notify.hummin.org>`). Add the verification DKIM/SPF DNS records according to Resend. **Do not remove Google Workspace MX records for hummin.org**.
7. Configure `RESEND_API_KEY` and `EMAIL_FROM` as Worker secrets. Check with a real submission received at `sales@hummin.org`; test Resend bounce/failure monitoring.
8. Run `npm run db:remote` against production after review; use a separate preview D1 database for non-production.
9. Connect GitHub repo in Cloudflare Workers Builds and configure build and deploy commands. Enable preview on feature branches before a main deployment.
10. Add custom domain hummin.org only after DNS review, TLS, analytics, end-to-end tests, approved photos, assessment, and privacy notice.
11. Configure data retention and access controls, backups/export of D1, alerting for failed notifications, and a recovery process.
12. Record the first successful production deployment revision and roll back plan.

### Launch blockers

- Exact brand/logo assets and final photographs not committed yet
- Original assessment (20 questions, answers, scoring, persistence and result messaging) is missing
- Resend verification / secret keys not configured
- Turnstile configured domain and secret not available
- D1 binding not provisioned
- Privacy/consent and retention terms need approval
- Connected environment dependency install, CI and live integration tests

No `.dev.vars`, Resend tokens, Cloudflare API tokens, Google Workspace OAuth credentials, or private keys belong in Git.
