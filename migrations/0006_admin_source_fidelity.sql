-- Source-faithful Admin backing data. No prototype/sample records.
CREATE TABLE IF NOT EXISTS admin_assessment_pipeline (
 assessment_id TEXT PRIMARY KEY REFERENCES assessment_deliveries(id) ON DELETE CASCADE,
 stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new','contacted','call_booked','proposal_sent','won','lost')),
 estimated_value_kes INTEGER,
 assigned_user_id TEXT REFERENCES admin_users(id),
 updated_by TEXT REFERENCES admin_users(id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_assessment_notes (
 id TEXT PRIMARY KEY,
 assessment_id TEXT NOT NULL REFERENCES assessment_deliveries(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES admin_users(id),
 note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 2000),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_assessment_notes ON admin_assessment_notes(assessment_id,created_at DESC);

CREATE TABLE IF NOT EXISTS admin_inbox_threads (
 enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','replied','closed')),
 assigned_user_id TEXT REFERENCES admin_users(id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_inbox_replies (
 id TEXT PRIMARY KEY,
 enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES admin_users(id),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 8000),
 mail_id TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_inbox_replies ON admin_inbox_replies(enquiry_id,created_at);

CREATE TABLE IF NOT EXISTS admin_insights_posts (
 id TEXT PRIMARY KEY,
 source_slug TEXT UNIQUE,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL DEFAULT '',
 excerpt TEXT NOT NULL DEFAULT '',
 type TEXT NOT NULL DEFAULT 'Guide' CHECK(type IN ('Guide','Opinion','News','Guest partner')),
 author TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','in_review','published')),
 topics_json TEXT NOT NULL DEFAULT '[]',
 blocks_json TEXT NOT NULL DEFAULT '[]',
 revision INTEGER NOT NULL DEFAULT 1,
 updated_by TEXT NOT NULL REFERENCES admin_users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_insights_status ON admin_insights_posts(status,updated_at DESC);
CREATE TABLE IF NOT EXISTS admin_insights_revisions (
 id TEXT PRIMARY KEY,
 post_id TEXT NOT NULL REFERENCES admin_insights_posts(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL,
 data_json TEXT NOT NULL,
 editor_id TEXT NOT NULL REFERENCES admin_users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_insights_revisions ON admin_insights_revisions(post_id,revision DESC);
