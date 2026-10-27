import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parseNewsletterEmail} from "../app/lib/newsletter-contract.ts";
import {action as previewOptIn} from "../app/routes/source.newsletter.verify.ts";

const url="https://hummin-web-preview.grimpossible.workers.dev/__source-verify/newsletter";
async function call(value="visitor@example.test",{endpoint=url,origin=new URL(endpoint).origin}={}){
 const form=new FormData();form.set("email",value);
 return previewOptIn({request:new Request(endpoint,{method:"POST",headers:{"Origin":origin},body:form}),context:{}});
}
test("Newsletter parser uses the production contract and normalizes valid addresses",()=>{
 assert.equal(parseNewsletterEmail(" Visitor@Example.TEST "),"visitor@example.test");
 assert.equal(parseNewsletterEmail("missing-at"),null);
 assert.equal(parseNewsletterEmail("a@b"),null);
 assert.equal(parseNewsletterEmail("x".repeat(255)+"@example.test"),null);
 assert.equal(parseNewsletterEmail(new Blob(["file"])),null);
});
test("Preview endpoint checks input without creating subscription or email",async()=>{
 const response=await call();
 const payload=await response.json();
 assert.equal(response.status,200);
 assert.deepEqual([payload.ok,payload.validated,payload.subscribed,payload.queued],[true,true,false,false]);
 assert.equal(payload.securityVerification,"not-performed-in-preview");
 assert.match(payload.message,/No subscription was created and no email was sent/);
 assert.equal(response.headers.get("cache-control"),"no-store");
 assert.ok(!JSON.stringify(payload).includes("visitor@example.test"));
});
test("Preview newsletter route rejects public hosts and CSRF",async()=>{
 assert.equal((await call("visitor@example.test",{endpoint:"https://hummin.org/__source-verify/newsletter",origin:"https://hummin.org"})).status,404);
 assert.equal((await call("visitor@example.test",{origin:"https://evil.example"})).status,403);
 assert.equal((await call("invalid email")).status,400);
 const noOrigin=await previewOptIn({request:new Request(url,{method:"POST",body:new URLSearchParams({email:"visitor@example.test"})}),context:{}});
 assert.equal(noOrigin.status,403);
});
test("Public newsletter still requires Turnstile, D1, opt-in and subscriber confirmation",()=>{
 const server=fs.readFileSync("app/routes/newsletter.tsx","utf8");
 assert.match(server,/parseNewsletterEmail\(form.get\("email"\)\)/);
 assert.match(server,/TURNSTILE_SECRET_KEY/);
 assert.match(server,/result.hostname|x.hostname!==new URL\(request.url\)\.hostname/);
 assert.match(server,/INSERT INTO newsletter_subscribers/);
 assert.match(server,/INSERT INTO email_outbox/);
 const preview=fs.readFileSync("app/routes/source.newsletter.verify.ts","utf8");
 assert.doesNotMatch(preview,/RESEND_API_KEY|deliverDue|INSERT INTO|\.DB\./);
 const routes=fs.readFileSync("app/routes.ts","utf8");
 assert.match(routes,/route\("__source-verify\/newsletter","routes\/source.newsletter.verify.ts"/);
});
