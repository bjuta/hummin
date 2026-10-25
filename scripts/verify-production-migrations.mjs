import { DatabaseSync } from "node:sqlite";
import { readdirSync,readFileSync } from "node:fs";
import assert from "node:assert/strict";
const migrations=readdirSync("migrations").filter(f=>/^\d+_.+\.sql$/.test(f)).sort();
assert.equal(migrations.length,11,"Expected all eleven migrations");
const db=new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys=ON");
for(const migration of migrations){
 const sql=readFileSync("migrations/"+migration,"utf8");
 try{db.exec("BEGIN TRANSACTION;\n"+sql+"\nCOMMIT;");}
 catch(error){db.exec("ROLLBACK");throw new Error("Migration "+migration+" failed: "+error.message,{cause:error});}
 console.log("PASS "+migration);
}
const names=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name));
for(const table of ["enquiries","booking_slots","assessment_deliveries","email_outbox","admin_users","admin_sessions","admin_insights_posts","admin_insights_publications","admin_clients","admin_engagements","admin_milestones","admin_assessment_drafts","admin_email_template_settings","web_analytics_daily"]){
 assert.ok(names.has(table),"Missing production table "+table);
}
assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(),[],"Foreign-key violations");
assert.equal(db.prepare("SELECT count(*) AS total FROM admin_users").get().total,0,"Do not seed privileged accounts");
assert.equal(db.prepare("SELECT count(*) AS total FROM enquiries").get().total,0,"Do not seed visitor enquiries");
for(const name of ["booking_rate_limits","booking_discrepancies","booking_change_audit"])assert.ok(names.has(name),"Missing booking protection/reconciliation table "+name);
console.log("PASS: eleven migrations apply on empty SQLite with all required tables, valid FKs and no fabricated records");
