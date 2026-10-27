-- All timestamps are ISO-8601 UTC. Avoid collecting unnecessary personal data.
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','failed')),
  provider_message_id TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  provider_accepted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_enquiries_submitted_at ON enquiries(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
