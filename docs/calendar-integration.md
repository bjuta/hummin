# HUMMIN Google Calendar booking — configuration and verification

## What already exists

The original high-fidelity assessment layout uses real Worker endpoints, rather than the original exported booking simulation.

- `GET /api/booking/slots` reads Google Calendar FreeBusy and D1 holds.
- `POST /api/booking/reserve` rechecks availability, writes a temporary D1 hold, inserts a real Google Calendar event, requests Meet, invites the attendee, and shows confirmation only after Google returns an event ID.
- Preview D1 `hummin-web-preview` already has `booking_slots` and `idx_booking_slots_created` applied on 2026-10-25.
- `BOOKING_ENABLED=false` until secrets, protections, and real end-to-end test pass.
- `hummin.org` and Workspace MX must not be changed during preview work.

## Exact Google Cloud OAuth setup

Use a Google Cloud project controlled by HUMMIN, and a calendar actually owned/writable by the account that authorises OAuth. The ChatGPT Google Calendar connector does not issue Worker credentials.

1. Enable **Google Calendar API** in the project: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
2. Under **Google Auth Platform → Audience** choose Internal *only if* the project belongs to the appropriate Google Workspace organisation and allows it. Otherwise use External; in Testing add the actual authorising account as a test user.
3. Under **Google Auth Platform → Clients → Create client**:
   - Application type: **Web application**
   - Name: **HUMMIN Calendar Booking Backend**
   - Authorized JavaScript origins: **blank**. Browser-side OAuth is not used.
   - Authorized redirect URIs: `https://developers.google.com/oauthplayground`
4. Create the client and privately retain **Client ID** and **Client Secret**.
5. At https://developers.google.com/oauthplayground/ open the settings gear and enable **Use your own OAuth credentials**. Enter the client's ID and secret. Keep OAuth flow Server-side and access type Offline.
6. Under Step 1, authorise **both**:
   - `https://www.googleapis.com/auth/calendar.events` — add events, invite guests.
   - `https://www.googleapis.com/auth/calendar.freebusy` — check calendar availability.
7. Sign in as the **HUMMIN calendar account**, select **Authorize APIs**, then **Exchange authorization code for tokens** in Step 2.
8. Privately retain the resulting **refresh token**. Do not submit client secret, access token or refresh token through GitHub or chat.
9. Find the calendar ID in Google Calendar → Settings → select the booking calendar → Integrate calendar → Calendar ID. The booking calendar must be writable by the authorised Google account. Never assume an email alias automatically refers to a calendar.
10. A Google OAuth External app in **Testing** generally has a seven-day refresh-token expiry when requesting Calendar scopes. Resolve authorisation/publishing for long-lived use before launch. Internal apps depend on correct Workspace and project ownership; external apps using sensitive scopes may need Google verification.

Google documentation:
- https://developers.google.com/oauthplayground/
- https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query
- https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
- https://developers.google.com/identity/protocols/oauth2

## Cloudflare preview configuration

Open Cloudflare dashboard → Workers & Pages → **hummin-web-preview** → Settings → **Variables and Secrets**.

Add these four bindings, using **Secret** for client ID, client secret and refresh token; calendar ID is not a secret but may also be entered privately as one:

| Exact binding | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth Web application Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Web application Client Secret |
| `GOOGLE_REFRESH_TOKEN` | Offline OAuth refresh token |
| `GOOGLE_CALENDAR_ID` | Calendar ID of the actual HUMMIN booking calendar |

The Worker reads these names directly. **Do not set `BOOKING_ENABLED=true` yet.** Avoid overwriting the existing build/asset/D1 bindings when adding variables.

## Actual acceptance test, not a placeholder milestone

Once secrets are configured and the consent token is durable:

1. Confirm the Worker can refresh Google credentials using the selected OAuth client.
2. Enable booking in a controlled *preview-only* test after adding booking abuse controls (rate limiting / Turnstile), and confirm `GET /api/booking/slots` reflects Google Calendar conflicts in **Africa/Nairobi** time.
3. Test a booking with a HUMMIN-owned test account, verify event ID, attendee invite, Google Meet link and D1 confirmed row.
4. Test two simultaneous attempts for one slot and verify at most one real booking.
5. Confirm expired `held` rows no longer permanently block available times.
6. Verify failure states never display booked confirmation and visitors are shown a working contact fallback.
7. Review data retention, privacy wording, booking cancellation/rescheduling policy.
8. Only after passing and owner approval, configure equivalent **production** secrets and D1 separately, then consider production launch.

This is an implementation checklist, not a claim that live booking has already passed.
