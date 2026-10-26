import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const ROOT="public/brand";
const files=[
 "home-hero.webp","how-hero.webp","expertise-hero.webp","engagements-hero.webp",
 "who-hero.webp","who-owner.webp","about-hero.webp","about-founder.webp","residency.webp",
 "hummin-symbol.svg","hummin-mark-mist.svg","hummin-mark-tone.svg",
 "insights-article-figure.svg","insights-assessment-mark.svg","insights-hero-mark.svg","insights-team-avatar.svg"
];
const fontFiles=["hummin-figtree-latin.woff2","hummin-newsreader-regular-latin.woff2","hummin-newsreader-italic-latin.woff2"];
const iconNames=["route","layers","handshake","users","building-2","mail","map-pin","compass",
 "monitor-smartphone","megaphone","workflow","user-round-check","chart-column",
 "briefcase","key-round","clock","target","arrow-left"];
test("React presentation assets are vendored and independently readable",()=>{
 for(const name of files){
  const buffer=fs.readFileSync(path.join(ROOT,name));
  assert.ok(buffer.length>30,name+" empty");
  if(name.endsWith(".webp"))assert.equal(buffer.toString("ascii",8,12),"WEBP",name);
  if(name.endsWith(".svg"))assert.match(buffer.toString("utf8"),/<svg\b/,name);
 }
 for(const name of fontFiles)assert.equal(fs.readFileSync(path.join(ROOT,"fonts",name)).toString("ascii",0,4),"wOF2",name);
 for(const name of iconNames){
  for(const variant of [name+".svg",name+"-light.svg"]){
   if((name==="arrow-left"||name==="map-pin") && variant.includes("-light"))continue;
   const p=path.join(ROOT,"icons",variant);
   assert.match(fs.readFileSync(p,"utf8"),/<svg\b/,p);
  }
 }
 assert.match(fs.readFileSync(path.join(ROOT,"icons","arrow-right-light.svg"),"utf8"),/<svg\b/);
});
test("Insights content is a versioned JSON asset, not extracted from HTML at build time",()=>{
 const posts=JSON.parse(fs.readFileSync("app/lib/react-original-insights.json","utf8"));
 assert.equal(posts.length,4);
 for(const p of posts){assert.ok(p.slug&&p.title);assert.ok(Array.isArray(p.blocks)&&p.blocks.length>=7);}
});
test("Normal build and typecheck do not read the legacy HTML source",()=>{
 const scripts=JSON.parse(fs.readFileSync("package.json","utf8")).scripts;
 for(const key of ["prebuild","build","typecheck","pretypecheck","verify:design-source"]){
  const value=scripts[key]||"";
  for(const forbidden of ["restore-original","extract-react","sync-source-foundation","design/sources"])assert.ok(!value.includes(forbidden),key+" depends on "+forbidden);
 }
 const imports=fs.readFileSync("app/site.css","utf8");
 assert.ok(!imports.includes("generated.css")&&!imports.includes("design/sources"));
});

test("Retirement gate cannot authorise deletion while public React approval is off",()=>{
 const policy=fs.readFileSync("app/lib/react-cutover.server.ts","utf8");
 assert.match(policy,/PUBLIC_REACT_CUTOVER_APPROVED\s*=\s*false/);
 const guard=fs.readFileSync("scripts/check-legacy-html-detach.mjs","utf8");
 assert.match(guard,/PUBLIC_REACT_CUTOVER_APPROVED/);
 assert.match(guard,/originalLoader/);
 assert.match(guard,/--assert-removed/);
});
