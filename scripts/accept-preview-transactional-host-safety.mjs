/** Read-only release-safety probe with intentionally INVALID, fictional requests.
 * Requires the transactional-host guard deployment to pass; sends no valid
 * email, booking, or enquiry payload, and never changes production.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
const origin="https://hummin-web-preview.grimpossible.workers.dev";
const checks=[];
const cases=[
 {path:"/contact",method:"POST",body:new URLSearchParams({}),contentType:"application/x-www-form-urlencoded"},
 {path:"/api/assessment/email",method:"POST",body:"{}",contentType:"application/json"},
 {path:"/api/booking/reserve",method:"POST",body:"{}",contentType:"application/json"},
 {path:"/newsletter",method:"POST",body:new URLSearchParams({}),contentType:"application/x-www-form-urlencoded"}
];
for(const test of cases){
 const res=await fetch(origin+test.path,{
  method:test.method,redirect:"manual",headers:{
   "Origin":origin,"Content-Type":test.contentType,"Accept":"application/json"
  },body:test.body
 });
 const text=await res.text();
 assert.equal(res.status,503,test.path+" must fail closed before any transactional work");
 assert.match(text,/Transactional services are disabled on isolated Preview/);
 assert.match(res.headers.get("cache-control")||"",/no-store/);
 checks.push({path:test.path,status:res.status,guarded:true});
 console.log("PREVIEW TRANSACTION BLOCKED",JSON.stringify(checks.at(-1)));
}
const slots=await fetch(origin+"/api/booking/slots",{headers:{"Accept":"application/json"},cache:"no-store"});
assert.equal(slots.status,200);
const availability=await slots.json();
assert.equal(availability.enabled,false);
assert.deepEqual(availability.days,[]);
checks.push({path:"/api/booking/slots",enabled:false,slots:0});
console.log("PREVIEW AVAILABILITY DISABLED",JSON.stringify(checks.at(-1)));
const paths=["contact","assessment","newsletter"];
for(const path of paths){
 const res=await fetch(origin+"/__source-verify/"+path,{method:"POST",headers:{
  "Origin":origin,"Content-Type":"application/json"
 },body:"{}"});
 assert.notEqual(res.status,404,path+" safe Preview contract endpoint remains available");
}
fs.mkdirSync("artifacts/preview-transaction-guard",{recursive:true});
fs.writeFileSync("artifacts/preview-transaction-guard/summary.json",JSON.stringify(checks,null,2));
assert.equal(checks.length,5);
console.log("PREVIEW EXTERNAL TRANSACTION SAFETY 5/5 PASS");
