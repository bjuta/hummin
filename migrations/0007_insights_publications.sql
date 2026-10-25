-- Published releases are immutable snapshots independent of editable drafts.
-- Bundled original articles remain live until explicitly republished.
CREATE TABLE IF NOT EXISTS admin_insights_publications (
 post_id TEXT PRIMARY KEY REFERENCES admin_insights_posts(id) ON DELETE RESTRICT,
 slug TEXT NOT NULL UNIQUE,
 data_json TEXT NOT NULL,
 revision INTEGER NOT NULL,
 published_by TEXT NOT NULL REFERENCES admin_users(id),
 published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_insights_release_time ON admin_insights_publications(published_at DESC);
