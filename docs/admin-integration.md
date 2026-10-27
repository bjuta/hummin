# HUMMIN Admin: integration and activation gates

Status: **preview implementation only; feature disabled.**

## Uploaded standalone reference

The supplied *HUMMIN Admin (standalone)* HTML is a visual and interaction reference. Its main navigation comprises Dashboard, Leads, Pipeline, Inbox, Bookings, Clients and engagements, Insights, Downloads and subscribers, Email, and Team and permissions. Its staff roles are Owner, Sales, Content editor, Guest partner, and Embedded staff.

The standalone file uses hard-coded example leads, clients, bookings, email logs, subscribers and staff. Actions including "Template saved", "Test sent", deleting subscribers and changing permissions currently modify only local demo state or show a success toast. **Never publish the standalone prototype unchanged or represent these actions as connected.**

## Implemented foundation

- Admin routes: `/admin/login`, `/admin/verify`, `/admin`, `/admin/logout`.
- Admin sign-in is **invitation-only**. No self-service user creation.
- An email code is valid for 10 minutes, limited to five verification attempts; at most three requests can be created per staff account within 15 minutes.
- The code is stored as an HMAC digest keyed by `ADMIN_AUTH_PEPPER`. Codes are consumed on successful verification.
- Session cookies are `__Host-` prefixed, `HttpOnly`, `Secure`, `SameSite=Strict`, expiring after eight hours. Only the session's HMAC digest is stored in D1.
- A live-statistics landing page is permission-filtered. It does not expose sample records. Operational write features are **not** claimed to work.
- Account sign-in email uses the brand renderer and existing outbox. On first verified access, an account activation welcome email is queued.
- Password resets remain deliberately unavailable because this phase uses passwordless email codes.

## Activation requirements (not completed)

1. Review the access model, privacy notice, data retention, intended account owners and permitted staff roles.
2. Apply `0004_admin_accounts.sql` to the *preview* D1 database using `npm run db:preview`. Do not apply to production.
3. With owner approval, provision specific staff members in `admin_users` with an explicitly selected role and `status='invited'` through an authenticated operator workflow. **No account is created automatically, including for the website owner.**
4. Configure a randomly generated, privately stored `ADMIN_AUTH_PEPPER` Worker secret on the preview Worker; never commit its value.
5. Verify the email sender domain in Resend and send one controlled account sign-in test to an authorised address.
6. Only then change `ADMIN_AUTH_ENABLED` to `true` in the preview configuration and redeploy. Validate sign-in, expiration, incorrect-code limits, session revocation, forbidden roles, email receipt and delivery logs.
7. Add server-backed, authorised CRUD APIs, audit logging and per-module permissions before enabling the standalone Admin editor, subscriber deletion, inbox replies or staff-management actions.
8. Keep the public HUMMIN site independent of Admin authentication. Client accounts, if needed, require a separate specification and access scope.

## Verified email sender

The preview currently uses `HUMMIN <hello@notify.hummin.org>`. The mail outbox now supports optional `EMAIL_FROM_SYSTEM` and `EMAIL_FROM_PEOPLE` settings and falls back to the verified `EMAIL_FROM` value. Do **not** configure `sales@hummin.org` or `no-reply@hummin.org` as senders until the provider has verified those identities.

## Publication gates

The Insights resizing repair and the existing website are preview-only. Check desktop and mobile layouts, standalone article and author routes, newsletter and download flows, real-time booking, contact delivery, canonical/social metadata, brand review, sender authentication, access controls, and the production privacy notice before migrating the public domain.
