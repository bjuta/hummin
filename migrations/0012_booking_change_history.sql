-- Append-only history for repeated Google Calendar reschedules and cancellations.
-- Keep the earlier booking_change_audit table for legacy audit compatibility.
CREATE TABLE IF NOT EXISTS booking_change_history (
 id TEXT PRIMARY KEY,
 booking_id TEXT NOT NULL,
 google_event_id TEXT NOT NULL,
 previous_start TEXT NOT NULL,
 observed_start TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(reason IN ('cancelled','moved')),
 recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_booking_change_history_event ON booking_change_history(google_event_id,recorded_at DESC);
