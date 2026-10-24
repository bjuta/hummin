# HUMMIN

HUMMIN is an embedded advisory and execution partner for established, owner-led businesses.

## Website application

This repository is being prepared as the canonical source for HUMMIN's full-stack website. **No production application is deployed from this repository yet.**

Proposed runtime: React Router (server-rendered, TypeScript) on Cloudflare Workers; D1 for structured data; Cloudflare Turnstile for abuse prevention; Resend for website-generated transactional email; Google Workspace remains the human inbox for `sales@hummin.org`.

The design/content starting point is `HUMMIN Website v2 export.dc.html`, which requires conversion from its proprietary runtime into application components. It must not be deployed verbatim.

Development work and production setup will be reviewed through GitHub pull requests. Production deployment will only be enabled after forms, assessment, privacy, and assets are ready.

See the upcoming architecture and deployment proposal in the open pull requests.
