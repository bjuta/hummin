import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {validateContactVisitor,cleanContactField} from "../app/lib/contact-contract.ts";

const form=(name="Sample Visitor",businessName="Example Company",email="person@example.test",message="Please help us establish a better enquiry process.")=>{
 const x=new FormData();
 x.set("name",name);x.set("businessName",businessName);
 x.set("email",email);x.set("message",message);
 return x;
};
test("Preview validation uses public handler's exact required field names",()=>{
 assert.deepEqual(validateContactVisitor(form()),{
  name:"Sample Visitor",businessName:"Example Company",
  email:"person@example.test",message:"Please help us establish a better enquiry process."
 });
 assert.equal(cleanContactField("  Test  "),"Test");
});
test("Production-shaped contact input boundaries fail closed",()=>{
 assert.equal(validateContactVisitor(form("A")),null);
 assert.equal(validateContactVisitor(form("Sample","B")),null);
 assert.equal(validateContactVisitor(form("Sample","Business","invalid")),null);
 assert.equal(validateContactVisitor(form("Sample","Business","person@example.test","too short")),null);
 assert.equal(validateContactVisitor(form("Sample","Business","person@example.test","a".repeat(4001))),null);
 assert.equal(validateContactVisitor(form("S".repeat(121))),null);
 assert.equal(validateContactVisitor(form("Sample","B".repeat(161))),null);
});
test("Preview handler has zero transactional service imports or sends",()=>{
 const route=fs.readFileSync("app/routes/source.contact.verify.ts","utf8");
 assert.match(route,/isHumminPublicHost\(url.hostname\)/);
 assert.match(route,/origin\)\.origin!==url.origin/);
 assert.match(route,/validateContactVisitor\(form\)/);
 assert.match(route,/delivered:false/);
 assert.doesNotMatch(route,/RESEND_API_KEY|TURNSTILE_SECRET_KEY|\.DB\.|queueEmail|deliverDue|reserve\(/);
 const ui=fs.readFileSync("app/components/SourceMarketingPreview.tsx","utf8");
 assert.match(ui,/fetch\("\/__source-verify\/contact"/);
 assert.doesNotMatch(ui,/fetch\("\/contact"|fetch\("\/api\/booking/);
});
test("Public site still routes contact through original handler",()=>{
 const routes=fs.readFileSync("app/routes.ts","utf8");
 assert.match(routes,/route\("contact","routes\/fidelity.ts"/);
 assert.match(routes,/route\("__source-verify\/contact","routes\/source.contact.verify.ts"/);
});
