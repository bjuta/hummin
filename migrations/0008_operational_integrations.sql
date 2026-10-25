-- Client engagements: only user-created or explicitly linked records, never demo clients.
CREATE TABLE IF NOT EXISTS admin_clients (
 id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 160),
 contact_name TEXT NOT NULL DEFAULT '', contact_email TEXT NOT NULL DEFAULT '',
 source_assessment_id TEXT UNIQUE REFERENCES assessment_deliveries(id),
 source_enquiry_id TEXT UNIQUE REFERENCES enquiries(id),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
 created_by TEXT NOT NULL REFERENCES admin_users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_engagements (
 id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES admin_clients(id),
 title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 180),
 kind TEXT NOT NULL CHECK(kind IN ('review','project','residency')),
 status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','active','on_hold','completed','cancelled')),
 summary TEXT NOT NULL DEFAULT '', start_date TEXT, target_date TEXT,
 lead_user_id TEXT REFERENCES admin_users(id), created_by TEXT NOT NULL REFERENCES admin_users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_engagements_client ON admin_engagements(client_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS admin_milestones (
 id TEXT PRIMARY KEY, engagement_id TEXT NOT NULL REFERENCES admin_engagements(id) ON DELETE CASCADE,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 2 AND 180),
 due_date TEXT, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','done')),
 created_by TEXT NOT NULL REFERENCES admin_users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_milestones_engagement ON admin_milestones(engagement_id,created_at);
CREATE TABLE IF NOT EXISTS admin_engagement_notes (
 id TEXT PRIMARY KEY, engagement_id TEXT NOT NULL REFERENCES admin_engagements(id) ON DELETE CASCADE,
 note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 3000),
 author_id TEXT NOT NULL REFERENCES admin_users(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Editable email presentation settings only; never permit untrusted HTML or sender changes.
CREATE TABLE IF NOT EXISTS admin_email_template_settings (
 kind TEXT PRIMARY KEY, subject TEXT NOT NULL CHECK(length(subject) BETWEEN 1 AND 180),
 preheader TEXT NOT NULL CHECK(length(preheader) BETWEEN 1 AND 200),
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1, updated_by TEXT NOT NULL REFERENCES admin_users(id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Draft assessment assumptions, not active public calculation settings.
CREATE TABLE IF NOT EXISTS admin_assessment_drafts (
 id INTEGER PRIMARY KEY CHECK(id=1), assumptions_json TEXT NOT NULL,
 weights_json TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1,
 updated_by TEXT NOT NULL REFERENCES admin_users(id), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
