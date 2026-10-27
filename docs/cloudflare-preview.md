# Cloudflare Preview — current connected account

> Updated 2026-10-25. The preview D1 database and an isolated placeholder Worker are provisioned; a Git-driven application deployment is NOT yet configured.

## Account and domain

- Cloudflare account: `Grimpossible@gmail.com's Account` (ID: `3ee7354d0459679068dad17fd5f712f5`).
- Zone `hummin.org` is **active** with zone ID `c05e2bede28379b85348b756abc5b015`.
- Do **not** change `hummin.org` or `www.hummin.org` routing, and do **not** modify the Google Workspace MX records. The website is not ready to replace current hosting.
- Worker preview target: `hummin-web-preview.grimpossible.workers.dev` (placeholder Worker uploaded; actual site still **not** deployed).

## Provisioned

- D1 preview database: `hummin-web-preview`
- D1 UUID: `a6fb62df-824e-4231-8630-34ce1e6c27f4`
- Primary-location hint: `WEUR`.
- Applied `migrations/0001_enquiries.sql` schema using the D1 API. Confirmed `enquiries` table exists, with zero records.
- Wrangler preview configuration: `wrangler.preview.jsonc`. DB binding `DB`, worker name `hummin-web-preview`.
- Form is **off** by default via `CONTACT_ENABLED=false` and rejects POSTs until explicitly activated.

## GitHub ↔ Cloudflare prerequisite (requires user authorization)

The Cloudflare GitHub App was authorised and a repository connection for `bjuta/hummin` was successfully created (ID `c04a439d-b8c6-4dc4-8e97-b538f9999552`). A Worker was created under name `hummin-web-preview` (tag `1909baafb46a4078acde412c5c2a7b6c`), currently containing only a 503/noindex placeholder, not the website build. The Cloudflare account still has **no Workers Builds deployment token**, so it cannot yet run a Git-triggered deploy.

To authorize:
1. In Cloudflare Dashboard → **Workers & Pages** → **hummin-web-preview** → **Settings** → **Builds** → **Connect**. The GitHub App is already authorised; select `bjuta/hummin`.
2. Select branch `feat/fullstack-workers-foundation` as the deployment branch for this *preview-only* Worker.
3. Configure build `npm run build`, deploy `npm run deploy:preview`, root `/`; allow the dashboard to generate an API/build token.
4. Once the account has a build token, inspect generated trigger, run a branch build and verify actual SSR pages on a preview URL.
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

## First real full-stack deployment — succeeded

- Cloudflare Builds trigger `56a037a2-d366-4506-b34c-3e72c0ab78c1` created for branch `feat/fullstack-workers-foundation`.
- First attempt failed because `wrangler deploy --config wrangler.preview.jsonc` re-bundled the uncompiled Worker entry and could not resolve `virtual:react-router/server-build`.
- Fixed by setting Vite Cloudflare plugin `configPath` to `./wrangler.preview.jsonc` and using `wrangler deploy` without `--config` so it uses Vite's compiled output manifest.
- Successful build `ba1e6319-d09a-4d23-99ad-43b3267d819a` outcome **success**.
- Deployed Worker version `fb61418a-c5a0-4249-82c6-2496955eb8ae`.
- Preview URL: `https://hummin-web-preview.grimpossible.workers.dev`.
- Deployment logs confirm attached D1 binding `env.DB (hummin-web-preview)` and `CONTACT_ENABLED=false`.
- Cloudflare deployment confirmed; independent HTTP/browser check not completed because this execution environment could not resolve the preview hostname.
- Remaining: user browser QA, final photography, missing original assessment, approved privacy policy, Turnstile + Resend credentials and real contact delivery tests. Main branch and `hummin.org` remain untouched.
