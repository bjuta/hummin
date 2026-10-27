import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {isAuthorizedTransactionalHost,transactionalHostBlock,mayRunScheduledTransactions} from "../app/lib/transactional-host-guard.ts";

test("Only the explicitly approved public host may run live transactions",async()=>{
 for(const url of [
  "https://hummin-web-preview.grimpossible.workers.dev/api/assessment/email",
  "https://staging.hummin.org/api/booking/reserve",
  "http://localhost:8787/contact",
  "https://example.test/newsletter"
 ]){
  const res=transactionalHostBlock(new Request(url,{method:"POST"}));
  assert.equal(res.status,503,url);
  assert.equal(res.headers.get("cache-control"),"no-store");
  assert.match(res.headers.get("x-robots-tag")||"",/noindex/);
  assert.equal((await res.json()).ok,false);
 }
 for(const host of ["hummin.org","www.hummin.org"]){
  assert.equal(isAuthorizedTransactionalHost(host),true);
  assert.equal(transactionalHostBlock(new Request("https://"+host+"/api/booking/reserve")),null);
 }
 assert.equal(isAuthorizedTransactionalHost("hummin.org.evil.example"),false);
});
test("Scheduled mail, calendar reconciliation and newsletter queue fail closed in Preview",()=>{
 assert.equal(mayRunScheduledTransactions("https://hummin-web-preview.grimpossible.workers.dev"),false);
 assert.equal(mayRunScheduledTransactions("https://staging.hummin.org"),false);
 assert.equal(mayRunScheduledTransactions(undefined),false);
 assert.equal(mayRunScheduledTransactions("not a URL"),false);
 assert.equal(mayRunScheduledTransactions("https://hummin.org"),true);
 const worker=fs.readFileSync("workers/app.ts","utf8");
 assert.match(worker,/if\(!mayRunScheduledTransactions\(env\.SITE_URL\)\)return;/);
 assert.ok(worker.indexOf("if(!mayRunScheduledTransactions(env.SITE_URL))return;")<
  worker.indexOf("ctx.waitUntil(runMailWorker(env)"));
});
test("All normal transactional endpoints are guarded before any provider use",()=>{
 const routes=["assessment.email.ts","booking.reserve.ts","contact.tsx","newsletter.tsx"];
 for(const name of routes){
  const content=fs.readFileSync("app/routes/"+name,"utf8");
  assert.match(content,/transactionalHostBlock\(request\)/,name);
  const guardAt=content.indexOf("transactionalHostBlock(request)");
  const serviceAt=Math.max(0,content.indexOf("const env=context.cloudflare.env",guardAt));
  assert.ok(guardAt>=0,name+" missing fail-closed guard");
 }
 const availability=fs.readFileSync("app/routes/booking.slots.ts","utf8");
 assert.match(availability,/if\(transactionalHostBlock\(request\)\)return disabled\(\)/);
 const fallback=fs.readFileSync("app/routes/fidelity.ts","utf8");
 assert.match(fallback,/contactReady=isAuthorizedTransactionalHost\(/);
});
test("Preview-only validations remain accessible and do not call real provider endpoints",()=>{
 const routes=fs.readFileSync("app/routes.ts","utf8");
 for(const path of ["contact","assessment","newsletter"])
  assert.match(routes,new RegExp('route\\("__source-verify/'+path+'"'));
 const source=fs.readFileSync("app/components/SourceAssessmentInteractive.tsx","utf8");
 assert.match(source,/__source-verify\/assessment/);
 assert.doesNotMatch(source,/fetch\("\/api\/assessment\/email"/);
});
