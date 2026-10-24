# Cloudflare Preview — current connected account

> Updated 2026-10-25. The preview D1 database is provisioned; the live Worker and Git deployment are NOT yet connected.

## Account and domain

- Cloudflare account: `Grimpossible@gmail.com's Account` (ID: `3ee7354d0459679068dad17fd5f712f5`).
- Zone `hummin.org` is **active** with zone ID `c05e2bede28379b85348b756abc5b015`.
- Do **not** change `hummin.org` or `www.hummin.org` routing, and do **not** modify the Google Workspace MX records. The website is not ready to replace current hosting.
- Worker preview target: `hummin-web-preview.grimpossible.workers.dev` (not deployed; do not treat as a live URL).

## Provisioned

- D1 preview database: `hummin-web-preview`
- D1 UUID: `a6fb62df-824e-4231-8630-34ce1e6c27f4`
- Primary-location hint: `WEUR`.
- Applied `migrations/0001_enquiries.sql` schema using the D1 API. Confirmed `enquiries` table exists, with zero records.
- Wrangler preview configuration: `wrangler.preview.jsonc`. DB binding `DB`, worker name `hummin-web-preview`.
- Form is **off** by default via `CONTACT_ENABLED=false` and rejects POSTs until explicitly activated.

## GitHub ↔ Cloudflare prerequisite (requires user authorization)

Attempting a Cloudflare Builds API repository connection to `bjuta/hummin` returned **HTTP 404 (8000008): disconnected from Git account**. The GitHub connector in ChatGPT does not grant Cloudflare's separate GitHub App authorization.

To authorize:
1. In Cloudflare Dashboard → **Workers & Pages**, choose **Create application** → **Import a repository** (or a Worker's Settings → Builds → Connect).
2. Choose **GitHub** and approve/install the **Cloudflare GitHub App** for account `bjuta`, granting access to repository `bjuta/hummin`.
3. Once authorization exists, connect this repo to Worker **hummin-web-preview** (a dedicated preview Worker; NOT your production HUMMIN domain).
4. For the preview app use **production branch** `feat/fullstack-workers-foundation`, build command `npm run build`, deploy command `npm run deploy:preview`, and root `/`.
5. Do not attach `hummin.org` and do not create a production build trigger for `main` yet.

If Workers Builds tries to infer a Worker name from default `wrangler.jsonc`, explicitly configure the preview deploy command `npm run deploy:preview` so the worker is `hummin-web-preview`, matching the preview Wrangler file.

## Next cloud resources

- Once preview hostname and Git build exist, provision a separate **preview** Turnstile widget for `hummin-web-preview.grimpossible.workers.dev`. Supply the secret directly to Cloudflare Workers secrets (not GitHub source).
- Verify an outbound sending subdomain in Resend (e.g. `notify.hummin.org`), adding **only** Resend-required records. Never overwrite Workspace MX, SPF, or DKIM on `hummin.org`.
- Worker secrets: `RESEND_API_KEY`, `EMAIL_FROM`, `TURNSTILE_SECRET_KEY`; Worker variable: `TURNSTILE_SITE_KEY`. Activate CONTACT_ENABLED only after privacy notice, validation, successful real delivery, monitoring and retention controls are approved.
- Create a separate production D1 database later, rather than reusing development customer records.

## Migration caution

The preview schema was applied once through the D1 API; migration history is not yet managed by Wrangler. Its SQL is idempotent (`IF NOT EXISTS`), so initial `npm run db:preview` should be safe, but verify Wrangler's tracking and reconcile before adding subsequent schema migrations.

## Release checklist

See `docs/launch-gates.md`. Passing CI does not mean production readiness. Approved photos, branding, real assessment and privacy notices still need completion.
