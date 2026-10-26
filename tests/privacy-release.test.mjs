import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LEGAL_DOCS } from "../app/lib/legal-content.ts";
const source=path=>fs.readFileSync(path,"utf8");

test("HUMMIN privacy wording comes from uploaded original legal component",()=>{
 const doc=LEGAL_DOCS.privacy;
 assert.equal(doc.title,"Privacy notice.");
 assert.equal(doc.sections.length,8);
 const text=JSON.stringify(doc);
 for(const term of ["Privacy notice.","Enquiries","Business Assessment","Appointments","Notes from HUMMIN","Cloudflare","Google Calendar","Resend","Kenya's Data Protection Act","Office of the Data Protection Commissioner","sales@hummin.org","Your choices and rights","How long information is kept"])
  assert.ok(text.includes(term),"Missing HUMMIN privacy wording: "+term);
 assert.doesNotMatch(text,/Privacy notice under review|Publication required before launch/);
 assert.match(source("app/routes/privacy.tsx"),/<LegalDocument kind="privacy"\/>/);
});
test("User-designed terms page preserves all 12 source sections and website scope",()=>{
 const doc=LEGAL_DOCS.terms;
 assert.equal(doc.title,"Terms of use.");
 assert.equal(doc.sections.length,12);
 const text=JSON.stringify(doc);
 for(const term of ["About these terms","Using the website","The Business Assessment","Insights and downloads","Booking a call","Our content and name","Other websites and services","Availability and liability","Your information","Law and disputes","Changes to these terms","Contact"])
  assert.ok(text.includes(term),"Terms source section missing: "+term);
 assert.match(source("app/routes/terms.tsx"),/<LegalDocument kind="terms"\/>/);
 assert.match(source("app/routes.ts"),/route\("terms","routes\/terms.tsx"\)/);
});
test("Original visual design preserved: hero, legal tabs, sticky TOC, notes and footer",()=>{
 const layout=source("app/components/LegalDocument.tsx");
 const css=source("app/legal.css");
 for(const part of ["hummin-legal-hero","hummin-legal-tabs","hummin-legal-toc","hummin-legal-questions","hummin-legal-list","hummin-legal-actions","hummin-legal-watermark"])
  assert.ok(layout.includes(part)&&css.includes(part),"Missing source design part: "+part);
 // Colours are source-authored, versioned design tokens rather than hardcoded
 // in each page. Verify both the use and the exact owner-approved values.
 const foundation=source("app/components/source-foundation.css");
 const tokens=[
  ["ink","#1E272A"],["rust","#B5532C"],["paper","#F4F5F1"],
  ["mist","#E7EBE6"],["slate","#434F4F"]
 ];
 for(const [name,color] of tokens){
  assert.ok(foundation.includes("--hummin-"+name+": "+color+";"),"Changed source palette: "+name);
  assert.ok(css.includes("var(--hummin-"+name+")"),"Legal page does not use shared "+name+" token");
 }
 assert.ok(source("public/assets/hummin-legal-mark-tone.svg").includes("viewBox"));
 const restore=source("scripts/restore-original.mjs");
 assert.match(restore,/href="\/privacy"/);
 assert.match(restore,/href="\/terms"/);
 const root=source("app/root.tsx");
 assert.match(root,/<Link to="\/privacy">Privacy<\/Link>/);
 assert.match(root,/<Link to="\/terms">Terms of Use<\/Link>/);
});
test("Staging smoke must check both final legal routes",()=>{
 const stage=source("scripts/check-production-staging.mjs");
 assert.match(stage,/const privacy=await read\("\/privacy"\)/);
 assert.match(stage,/const terms=await read\("\/terms"\)/);
 assert.match(stage,/Privacy notice under review/);
 assert.match(stage,/assert\.doesNotMatch\(privacy\.body/);
});
