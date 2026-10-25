-- Independent CRM workflow: never overwrite provider-delivery status on enquiries.
CREATE TABLE IF NOT EXISTS admin_enquiry_workflow (
 enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id) ON DELETE CASCADE,
 stage TEXT NOT NULL DEFAULT 'new' CHECK(stage IN ('new','contacted','exploring','proposal','won','lost')),
 assigned_user_id TEXT REFERENCES admin_users(id),
 updated_by TEXT NOT NULL REFERENCES admin_users(id),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_enquiry_notes (
 id TEXT PRIMARY KEY,
 enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES admin_users(id),
 note TEXT NOT NULL CHECK(length(note) BETWEEN 1 AND 2000),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_enquiry_notes ON admin_enquiry_notes(enquiry_id,created_at DESC);
CREATE TABLE IF NOT EXISTS admin_audit (
 id TEXT PRIMARY KEY,
 actor_id TEXT NOT NULL REFERENCES admin_users(id),
 operation TEXT NOT NULL,
 resource_type TEXT NOT NULL,
 resource_id TEXT NOT NULL,
 detail TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit(created_at DESC);
