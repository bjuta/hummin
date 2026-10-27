# HUMMIN deployment runbook — preview first

## Verified current state (26 October 2026)

- Repository/branch: `bjuta/hummin` / `feat/fullstack-workers-foundation`.
- **Isolated React Preview successfully deployed**, run [40390575461](https://github.com/bjuta/hummin/actions/runs/40390575461), with archived HTML physically hidden during the entire build and typecheck.
- Preview Worker: `hummin-web-preview` at `https://hummin-web-preview.grimpossible.workers.dev`, using its dedicated preview D1 and no public domain routes.
- The public `hummin.org` pages still select the existing legacy HTML loader on the public host; the React migration is **not approved for production cutover**. Do not delete `design/sources` until [legacy-html-retirement.md](legacy-html-retirement.md) passes.
- No public route, production database, or mail/booking binding changes were made by the Preview workflow.

## Source-free Preview build and release

```bash
npm install
npm run verify:design-source
npm run verify:seo
npm run typecheck
npm run build
```

The dedicated Preview GitHub workflow additionally hides `design/sources` and checks the generated Worker has the correct isolated database binding and no `hummin.org` route before deployment. **Do not substitute a default `wrangler deploy` command or deploy the production worker.** The Preview workflow is deliberately triggered only by an explicit marker-file change to conserve Actions minutes.

## Completing the contact flow

Use Cloudflare Turnstile for the real preview hostname and store `TURNSTILE_SECRET_KEY` as a Worker secret; `TURNSTILE_SITE_KEY` is public. Verify a sending domain on Resend (prefer `notify.hummin.org`) and store `RESEND_API_KEY`, `EMAIL_FROM` securely in the Worker. These credentials are not included in GitHub.

The contact form requires `CONTACT_ENABLED=true` **as well as** valid D1, Resend and Turnstile settings. Keep it false until the privacy notice, retention and security review, and live delivery tests pass. Failed delivery must never display a success message.

## Production launch gates

See [launch-gates.md](launch-gates.md) and [architecture.md](architecture.md). Missing: original assessment questionnaire/scoring, approved imagery and identity SVG, privacy notice, operational email monitoring and live browser testing.

Only once fully tested should a separate production database, Worker builds from `main`, custom-domain routing and indexing be enabled.
