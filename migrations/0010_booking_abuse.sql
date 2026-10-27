-- Atomic cross-instance booking quotas.
CREATE TABLE IF NOT EXISTS booking_rate_limits (key_hash TEXT PRIMARY KEY, requests INTEGER NOT NULL, expires_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_booking_limit_expiry ON booking_rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_pending_google ON booking_slots(status,created_at,google_event_id);
