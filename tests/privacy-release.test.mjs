import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source=(path)=>fs.readFileSync(path,"utf8");
test("Published privacy notice accurately describes actual HUMMIN services",()=>{
 const page=source("app/routes/privacy.tsx");
 for(const term of ["Privacy notice.","Enquiries:","Business Assessment:","Appointments:","Notes from HUMMIN:","Cloudflare","Google Calendar","Resend","Kenya's Data Protection Act","Office of the Data Protection Commissioner","sales@hummin.org","Your choices and rights","How long information is kept"])
   assert.ok(page.includes(term),"Privacy disclosure missing: "+term);
 assert.doesNotMatch(page,/Privacy notice under review|Publication required before launch|This placeholder is not a completed privacy policy/i);
 assert.doesNotMatch(page,/noindex,nofollow/,"Privacy itself must not hardcode a public noindex");
 assert.match(page,/Newsletter|Newsletters/);
});
test("The original full fidelity site adds a privacy notice link to its footer",()=>{
 const restore=source("scripts/restore-original.mjs");
 assert.match(restore,/href="\/privacy"/);
 const root=source("app/root.tsx");
 assert.match(root,/<Link to="\/privacy">Privacy<\/Link>/);
});
test("Staging must enforce notice completeness before treating deployment as green",()=>{
 const stage=source("scripts/check-production-staging.mjs");
 assert.match(stage,/const privacy=await read\("\/privacy"\)/);
 assert.match(stage,/Privacy notice under review/);
 assert.match(stage,/assert\.doesNotMatch\(privacy\.body/);
});
