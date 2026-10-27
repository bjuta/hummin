CREATE TABLE IF NOT EXISTS email_outbox (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL, recipient TEXT NOT NULL, payload TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed')),
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 claimed_at TEXT, provider_id TEXT, sent_at TEXT, last_error TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(kind,id)
);
CREATE INDEX IF NOT EXISTS idx_mail_due ON email_outbox(status,next_attempt_at);
CREATE TABLE IF NOT EXISTS assessment_deliveries (
 id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, business_name TEXT NOT NULL,
 score INTEGER NOT NULL, goal TEXT NOT NULL, summary TEXT NOT NULL, sent_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
 email TEXT PRIMARY KEY, status TEXT NOT NULL CHECK(status IN ('pending','active','unsubscribed')),
 token TEXT NOT NULL UNIQUE, subscribed_at TEXT, unsubscribed_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS newsletter_issues (
 id TEXT PRIMARY KEY, month TEXT NOT NULL, title TEXT NOT NULL, preheader TEXT NOT NULL,
 body TEXT NOT NULL, article_url TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','sent')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS booking_mail_meta (
 booking_id TEXT PRIMARY KEY, meet_url TEXT, calendar_url TEXT, confirmation_queued INTEGER NOT NULL DEFAULT 0,
 reminder_queued INTEGER NOT NULL DEFAULT 0
);
