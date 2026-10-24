# HUMMIN — website application

Full-stack HUMMIN website for established, owner-led businesses. **This is an implementation branch, not a live deployment.**

## Architecture

- React Router (server-side rendering) + React 19 + TypeScript
- Cloudflare Workers with the Cloudflare Vite plugin
- Cloudflare D1 for enquiries, with version-controlled SQL migrations
- Cloudflare Turnstile for server-verified form submissions
- Resend for transactional notifications to `sales@hummin.org`
- Google Workspace remains the human mailbox; **do not change existing MX records**
- GitHub as source of truth; CI for pull requests; deployment controlled through Cloudflare Workers Builds

The former `*.dc.html` design export requires conversion from a proprietary runtime. The application is being rebuilt as real URL-based routes and React components; the export is **not** used at runtime.

## Local development

Install Node.js 22 and run:

```bash
npm install
npm run dev
```

Server-backed enquiry submissions deliberately **fail closed** until Cloudflare D1, Turnstile and Resend are configured. Do not promise enquiries are delivered before verifying end-to-end.

Copy `.dev.vars.example` to `.dev.vars` for local secrets. Never commit `.dev.vars`.

## Set up Cloudflare services

1. Create a D1 database: `npx wrangler d1 create hummin-web`
2. Copy its `database_id` to the `d1_databases` array in `wrangler.jsonc` (see example in `docs/deployment.md`).
3. Apply schema locally: `npx wrangler d1 migrations apply hummin-web --local`.
4. Configure Cloudflare Turnstile and verify its hostname; create `TURNSTILE_SITE_KEY` (public) and `TURNSTILE_SECRET_KEY` (secret).
5. Verify a sending domain in Resend (recommended: `notify.hummin.org`) without disturbing Workspace MX on `hummin.org`.
6. Set Worker secrets via `npx wrangler secret put RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `EMAIL_FROM`. Set public `TURNSTILE_SITE_KEY` as a Worker variable.
7. Apply schema to production: `npx wrangler d1 migrations apply hummin-web --remote`.
8. Configure Cloudflare Workers Builds with this repository, production branch `main`, build `npm run build` and deploy `npm run deploy`. Keep production builds disabled until the review branch is tested.
9. Verify end-to-end submissions, anti-spam, email delivery, domain and privacy pages before attaching `hummin.org`.

See `docs/deployment.md` for the checklist and `docs/architecture.md` for future AWS migration considerations.

## Known outstanding work

- Approved HUMMIN photos, exact SVG brand assets, and image licensing
- Real 20-question assessment (original export and scoring logic have not been provided)
- Privacy, retention and consent policy approval
- Actual Cloudflare/Resend credentials and production D1 binding
- Build/typecheck and device QA in a connected environment
- No AWS instance is necessary for this stage.
