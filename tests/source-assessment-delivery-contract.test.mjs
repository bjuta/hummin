import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parseAssessmentDeliveryInput} from "../app/lib/assessment-delivery-contract.ts";
import {action as checkAssessment} from "../app/routes/source.assessment.verify.ts";

const preview="https://hummin-web-preview.grimpossible.workers.dev/__source-verify/assessment";
const valid={
 name:"Preview Visitor",business:"Sample Trading",email:"hello@example.test",
 goal:"Grow sales",score:67,priorities:["Direction","Customers","Operations"],
 token:"",monthlyCost:12500
};
const invoke=async(input=valid,{url=preview,origin=new URL(url).origin,method="POST"}={})=>
 checkAssessment({request:new Request(url,{
  method,headers:{"Origin":origin,"Content-Type":"application/json"},
  ...(method==="POST"?{body:JSON.stringify(input)}:{})
 }),context:{}});

test("Assessment email contract normalizes source-derived payload without mislabelling currency",()=>{
 const payload=parseAssessmentDeliveryInput({...valid,email:" HELLO@EXAMPLE.TEST ",monthlyCost:12500.7});
 assert.equal(payload?.email,"hello@example.test");
 assert.equal(payload?.monthlyCost,12501);
 assert.equal(payload?.priorities.length,3);
 assert.equal(parseAssessmentDeliveryInput({...valid,monthlyCost:Infinity})?.monthlyCost,undefined);
 assert.equal(parseAssessmentDeliveryInput({...valid,monthlyCost:-1})?.monthlyCost,undefined);
 assert.equal(parseAssessmentDeliveryInput({...valid,monthlyCost:"12500"})?.monthlyCost,undefined);
});
test("Reject malformed scores, identities, goals, priorities and excessively long tokens",()=>{
 for(const patch of [{name:""},{business:"X"},{email:"bad"},{goal:"?"},{score:101},
   {score:1.5},{score:"60"},{priorities:["only one"]},
   {priorities:["Valid","Also valid",0]},{token:"x".repeat(2049)}]){
  assert.equal(parseAssessmentDeliveryInput({...valid,...patch}),null,JSON.stringify(patch).slice(0,100));
 }
 assert.equal(parseAssessmentDeliveryInput("string"),null);
 assert.equal(parseAssessmentDeliveryInput(null),null);
});
test("Safe Assessment Preview round-trip accepts a valid payload without acknowledging delivery",async()=>{
 const response=await invoke();
 const data=await response.json();
 assert.equal(response.status,200);
 assert.equal(response.headers.get("cache-control"),"no-store");
 assert.match(response.headers.get("x-robots-tag")||"",/noindex/);
 assert.deepEqual([data.ok,data.validated,data.delivered,data.queued],[true,true,false,false]);
 assert.equal(data.securityVerification,"not-performed-in-preview");
 assert.ok(!JSON.stringify(data).includes(valid.email),"PII must never be echoed");
});
test("Reject live public hostname, cross-origin, missing origin and malformed body",async()=>{
 let res=await invoke(valid,{url:"https://hummin.org/__source-verify/assessment",origin:"https://hummin.org"});
 assert.equal(res.status,404);
 res=await invoke(valid,{origin:"https://evil.example"});
 assert.equal(res.status,403);
 res=await checkAssessment({request:new Request(preview,{method:"POST",body:JSON.stringify(valid),
  headers:{"Content-Type":"application/json"}}),context:{}});
 assert.equal(res.status,403);
 res=await invoke({...valid,score:Infinity});
 assert.equal(res.status,400);
});
test("Public transactional route still requires Cloudflare Turnstile before D1/outbox",()=>{
 const publicRoute=fs.readFileSync("app/routes/assessment.email.ts","utf8");
 assert.match(publicRoute,/parseAssessmentDeliveryInput\(raw\)/);
 assert.match(publicRoute,/TURNSTILE_SECRET_KEY/);
 assert.match(publicRoute,/result\.hostname!==new URL\(request.url\)\.hostname/);
 assert.match(publicRoute,/INSERT INTO assessment_deliveries/);
 assert.match(publicRoute,/INSERT INTO email_outbox/);
 const previewRoute=fs.readFileSync("app/routes/source.assessment.verify.ts","utf8");
 assert.doesNotMatch(previewRoute,/RESEND_API_KEY|deliverDue|INSERT INTO|\.DB\./);
 const routes=fs.readFileSync("app/routes.ts","utf8");
 assert.match(routes,/route\("__source-verify\/assessment","routes\/source.assessment.verify.ts"/);
 assert.match(routes,/route\("assessment","routes\/fidelity.ts"/);
});
