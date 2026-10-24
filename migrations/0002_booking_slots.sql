CREATE TABLE IF NOT EXISTS booking_slots (
 id TEXT PRIMARY KEY,
 start_utc TEXT NOT NULL UNIQUE,
 end_utc TEXT NOT NULL,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 phone TEXT,
 status TEXT NOT NULL CHECK(status IN ('held','confirmed')),
 google_event_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_booking_slots_created ON booking_slots(created_at DESC);
