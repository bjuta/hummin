-- Reconcile Google Calendar changes without losing the original booking audit.
CREATE TABLE IF NOT EXISTS booking_discrepancies (
  booking_id TEXT PRIMARY KEY,
  google_event_id TEXT NOT NULL,
  observed_state TEXT NOT NULL CHECK(observed_state IN ('missing','cancelled','moved')),
  observed_start TEXT NOT NULL DEFAULT '',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS booking_change_audit (
  booking_id TEXT PRIMARY KEY,
  google_event_id TEXT NOT NULL,
  previous_start TEXT NOT NULL,
  observed_start TEXT NOT NULL,
  reason TEXT NOT NULL CHECK(reason IN ('cancelled','moved')),
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_booking_change_audit_date ON booking_change_audit(recorded_at DESC);
