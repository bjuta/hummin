import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {canView,resolveView} from "../app/lib/admin-permissions.ts";
import {loadAdminView,updateEnquiry,enquiryNotes} from "../app/lib/admin-data.server.ts";

const user=(role)=>({id:"10000000-0000-4000-8000-000000000001",email:"staff@example.org",name:"Staff",role,status:"active"});
test("Admin role permissions enforce least privilege",()=>{
 assert.equal(canView("partner","inbox"),false);
 assert.equal(canView("staff","leads"),false);
 assert.equal(canView("editor","leads"),false);
 assert.equal(canView("editor","posts"),true);
 assert.equal(canView("sales","team"),false);
 assert.equal(canView("sales","email"),false);
 assert.equal(canView("owner","team"),true);
 assert.equal(resolveView("not-a-page"),"dash");
});
test("Unauthorised views do not execute personal-data queries",async()=>{
 let calls=0;
 const db={prepare:()=>{calls++;throw Error("restricted view queried database")}};
 const x=await loadAdminView({DB:db},user("editor"),"inbox");
 assert.equal(x.restricted,true);
 assert.equal(calls,0);
 const y=await loadAdminView({DB:db},user("sales"),"team");
 assert.equal(y.restricted,true);
 assert.equal(calls,0);
 const n=await enquiryNotes({DB:db},user("editor"),"10000000-0000-4000-8000-000000000001");
 assert.deepEqual(n,[]);
});
test("Enquiry stage transitions are audited and never change provider status",async()=>{
 let queried=[],batched=[];
 const db={
  prepare(sql){queried.push(sql);return {bind(...args){return {first:async()=>({id:args[0]}),sql,params:args};}};},
  async batch(statements){batched=statements;return [];}
 };
 const id="20000000-0000-4000-8000-000000000002";
 const x=await updateEnquiry({DB:db},user("sales"),"stage",id,"contacted");
 assert.equal(x.ok,true);
 assert.equal(batched.length,2);
 assert.match(batched[0].sql,/admin_enquiry_workflow/);
 assert.match(batched[1].sql,/admin_audit/);
 assert.ok(!batched[0].sql.includes("UPDATE enquiries SET status"));
 const denied=await updateEnquiry({DB:db},user("editor"),"stage",id,"won");
 assert.equal(denied.ok,false);
 const invalid=await updateEnquiry({DB:db},user("sales"),"stage",id,"arbitrary");
 assert.equal(invalid.ok,false);
});
test("Enquiry notes are bounded and audit recorded",async()=>{
 const batch=[];
 const db={prepare(sql){return {bind(...args){return {first:async()=>({id:args[0]}),sql,params:args};}};},async batch(cmd){batch.push(...cmd);}};
 const id="20000000-0000-4000-8000-000000000002";
 assert.equal((await updateEnquiry({DB:db},user("owner"),"note",id," ".repeat(2002))).ok,false);
 assert.equal((await updateEnquiry({DB:db},user("owner"),"note",id,"Follow up with team")).ok,true);
 assert.match(batch[0].sql,/admin_enquiry_notes/);
 assert.match(batch[1].sql,/admin_audit/);
});
test("Private email rendering and sample CRM data are never exposed by Admin",()=>{
 const data=fs.readFileSync("app/lib/admin-data.server.ts","utf8");
 assert.match(data,/SELECT id,kind,recipient,status,attempts,created_at,sent_at,next_attempt_at,last_error/);
 assert.doesNotMatch(data,/SELECT\s+\*/);
 assert.match(data,/SELECT email,status,subscribed_at,unsubscribed_at,created_at/);
 const ui=fs.readFileSync("app/routes/admin.index.tsx","utf8");
 assert.doesNotMatch(ui,/LEADS0|THREADS0|BOOK0|SUBS0|TPLS0/);
 const ddl=fs.readFileSync("migrations/0005_admin_workflow.sql","utf8");
 assert.match(ddl,/admin_enquiry_notes/);
 assert.match(ddl,/admin_audit/);
});
