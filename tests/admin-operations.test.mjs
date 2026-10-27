import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {operationsData,operationsMutation} from "../app/lib/admin-operations.server.ts";
const actor=(role)=>({id:"a0000000-0000-4000-8000-000000000001",name:"Staff",email:"staff@hummin.org",role,status:"active"});
const id="a0000000-0000-4000-8000-000000000002";
const f=(value)=>{const data=new FormData();for(const [k,v] of Object.entries(value))data.set(k,String(v));return data;};
function fakeDb(){
 const writes=[],reads=[];
 const D={
  prepare(sql){reads.push(sql);return {bind(...args){return {sql,args,run:async()=>({meta:{changes:1}}),first:async()=>({id,revision:1}),all:async()=>({results:[]})};},
    first:async()=>({revision:1}),all:async()=>({results:[]})};},
  async batch(queries){writes.push(...queries);return [];}
 };
 return {env:{DB:D},writes,reads};
}
test("Client creation is restricted and audited, with no seed records",async()=>{
 const x=fakeDb(),input=f({name:"Real Business",contact_name:"Contact",contact_email:"person@example.com"});
 assert.equal((await operationsMutation(x.env,actor("editor"),"client_create","",input)).ok,false);
 assert.equal(x.writes.length,0);
 const result=await operationsMutation(x.env,actor("sales"),"client_create","",input);
 assert.equal(result.ok,true);
 assert.equal(x.writes.length,2);
 assert.match(x.writes[0].sql,/INSERT INTO admin_clients/);
 assert.match(x.writes[1].sql,/INSERT INTO admin_audit/);
});
test("Engagement and milestone operations require existing parent records",async()=>{
 const x=fakeDb();
 assert.equal((await operationsMutation(x.env,actor("sales"),"engagement_create",id,f({title:"Operational Review",kind:"review",summary:"Improve flow"}))).ok,true);
 assert.match(x.writes[0].sql,/admin_engagements/);
 x.writes.length=0;
 assert.equal((await operationsMutation(x.env,actor("owner"),"milestone_create",id,f({title:"Baseline established"}))).ok,true);
 assert.match(x.writes[0].sql,/admin_milestones/);
 assert.match(x.writes[1].sql,/admin_audit/);
});
test("Email copy remains disabled and subject edits cannot carry newline headers",async()=>{
 const x=fakeDb();
 assert.equal((await operationsMutation(x.env,actor("sales"),"email_settings_save","",f({kind:"account-sign-in",subject:"New",preheader:"One time",revision:1}))).ok,false);
 const invalid=await operationsMutation(x.env,actor("owner"),"email_settings_save","",f({kind:"account-sign-in",subject:"Bad\nHeader",preheader:"One time",revision:1}));
 assert.equal(invalid.ok,false);
 assert.equal(x.writes.length,0);
 const ok=await operationsMutation(x.env,actor("owner"),"email_settings_save","",f({kind:"account-sign-in",subject:"Your secure code",preheader:"Valid 10 minutes",revision:1}));
 assert.equal(ok.ok,true);
 assert.match(x.writes[0].sql,/enabled,revision/);
 assert.match(x.writes[0].sql,/VALUES\(\?,\?,\?,0,1,\?\)/);
});
test("Assessment draft cannot be saved by non-owners or activated publicly",async()=>{
 const x=fakeDb(),input=f({assumptions_json:'{"monthlyEnquiries":40}',weights_json:"{}",revision:1});
 assert.equal((await operationsMutation(x.env,actor("sales"),"assessment_draft_save","",input)).ok,false);
 assert.equal((await operationsMutation(x.env,actor("owner"),"assessment_draft_save","",input)).ok,true);
 assert.match(x.writes[0].sql,/admin_assessment_drafts/);
 assert.ok(!fs.readFileSync("app/routes/assessment.email.ts","utf8").includes("admin_assessment_drafts"));
 assert.ok(!fs.readFileSync("app/lib/email-brand.server.ts","utf8").includes("admin_email_template_settings"));
});
