# HUMMIN architectural decisions

## Now: a server-rendered application, not a static export

Cloudflare Workers hosts the SSR React Router app and route actions. D1 persists enquiries. Turnstile challenge verification happens **server-side**. Resend sends transactional messages to sales@hummin.org; replies remain in Google Workspace. No client secrets are embedded in browser code.

The GitHub repository is the canonical source and production branch is main. A PR is required for application changes. In this phase, there is **no automatic production deployment** configured or approved.

## Keep the implementation portable

- Routes, validation, content, and business rules should not import Cloudflare bindings directly.
- Only the Worker entry and D1 adapter are Cloudflare-specific.
- The outbound email adapter uses HTTPS and can be replaced.
- Keep data migrations tracked in source control.
- Images live in static build assets initially; use R2 when upload workflows actually exist.

## Future growth

A client portal with long-lived sessions, complex reporting and multi-tenant relational data may justify managed PostgreSQL. Background document/AI processing can run independently on AWS ECS/Fargate or EC2 without relocating the marketing site. Moving from D1/SQLite to Postgres is **not zero-work** and would require a migration.

## Operating principles

No email-sending claims without provider acknowledgment. No database writes without validation. No faux assessment scores. Do not store client financial statements or sensitive data until permissions, retention and access controls exist. Cloudflare request logs must not include personal form data.
