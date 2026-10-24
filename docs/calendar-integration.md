# Google Workspace appointment booking

The original assessment includes a 30-minute Nairobi-time booking interface, but its export originally invented days/slots and confirmed only a downloadable ICS file. These behaviours are not a live reservation.

The Worker has two endpoints: `GET /api/booking/slots` queries Google Calendar FreeBusy and subtracts D1 booking holds, while `POST /api/booking/reserve` checks the slot again, creates a D1 hold, creates a Google Calendar event with attendee invitation and Meet request, and confirms only after Google returns an event ID.

**All booking is disabled by default.** `BOOKING_ENABLED=false` means no slots and no personal data collection.

To connect:
1. In Google Cloud create an OAuth client authorised for Calendar access. Authorise the actual Workspace calendar owner, then obtain an offline refresh token covering Google Calendar event creation and free/busy. ChatGPT's Google Calendar connection does NOT automatically grant OAuth credentials to this Worker.
2. Add Worker secrets via Cloudflare dashboard: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`. Calendar ID must be one you are authorised to read/write (often sales@hummin.org, but verify in Google Calendar).
3. Apply `migrations/0002_booking_slots.sql` to preview D1, then production D1 separately.
4. Verify calendar availability, timezone, double-booking prevention, event creation and attendee delivery with real bookings to your own test account.
5. Approve HUMMIN privacy notice and retention policy, rate limiting/Turnstile, and booking policy. Only then set `BOOKING_ENABLED=true`.
6. Roll back immediately to false if event insertion, invitations or free/busy checks fail.

No Google OAuth credentials, tokens or private client data should ever be stored in GitHub. Current app preview must not claim appointments are booked while booking is disabled.
