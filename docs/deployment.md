# HUMMIN deployment runbook — preview first

## Current implementation state

- GitHub source: `bjuta/hummin`, draft pull request #1.
- Cloudflare account and active `hummin.org` zone verified.
- **Preview D1 exists and its enquiry schema has been applied**. See [cloudflare-preview.md](cloudflare-preview.md) for exact identifiers and next steps.
- **No Worker deployed**, and **Cloudflare's GitHub App has not yet been authorised** for `bjuta/hummin`. The attempted API repository connection returned HTTP 404 (8000008).
- Existing `hummin.org` website hosting and Google Workspace MX remain unchanged.

## Build

```bash
npm install
npm run typecheck
npm run build
```

After Cloudflare GitHub App authorization, use the **dedicated preview Worker** with:

- Worker name: `hummin-web-preview`
- Source branch: `feat/fullstack-workers-foundation`
- Build: `npm run build`
- Deploy: `npm run deploy:preview` (reads `wrangler.preview.jsonc`)
- Database: `hummin-web-preview` bound as `DB`

Do not deploy the default `wrangler.jsonc` worker `hummin-web` or attach the custom domain before launch approval. Do not change production email DNS records.

## Completing the contact flow

Use Cloudflare Turnstile for the real preview hostname and store `TURNSTILE_SECRET_KEY` as a Worker secret; `TURNSTILE_SITE_KEY` is public. Verify a sending domain on Resend (prefer `notify.hummin.org`) and store `RESEND_API_KEY`, `EMAIL_FROM` securely in the Worker. These credentials are not included in GitHub.

The contact form requires `CONTACT_ENABLED=true` **as well as** valid D1, Resend and Turnstile settings. Keep it false until the privacy notice, retention and security review, and live delivery tests pass. Failed delivery must never display a success message.

## Production launch gates

See [launch-gates.md](launch-gates.md) and [architecture.md](architecture.md). Missing: original assessment questionnaire/scoring, approved imagery and identity SVG, privacy notice, operational email monitoring and live browser testing.

Only once fully tested should a separate production database, Worker builds from `main`, custom-domain routing and indexing be enabled.
