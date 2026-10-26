import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const foundation=fs.readFileSync("app/components/source-foundation.css","utf8");
const marketing=fs.readFileSync("app/components/ReactMarketing.tsx","utf8");
const primitives=fs.readFileSync("app/components/SourcePrimitives.tsx","utf8");
const palette=[["ink","#1E272A"],["body","#2A3538"],["slate","#434F4F"],["stone","#5E6967"],["paper","#F4F5F1"],["mist","#E7EBE6"],["muted","#D0D8D2"],["line","#BAC4BE"],["rust","#B5532C"],["rust-dark","#9A4524"],["moss","#2E6B5C"]];
test("self-contained owner design tokens remain intact without an HTML source",()=>{
 for(const [name,hex] of palette)assert.ok(foundation.includes("--hummin-"+name+": "+hex+";"),"Missing token "+name);
 for(const needle of ["font-family:'Figtree'","@keyframes hmRise","--hummin-page-gutter"])assert.ok(foundation.includes(needle),"Missing design foundation "+needle);
 assert.ok(fs.readFileSync("app/site.css","utf8").includes('source-foundation.css'));
});
test("shared React primitives replace page-local controls",()=>{
 for(const name of ["SourceButton","SourceSectionTitle","SourceShelf","SourceDialog","SourceIcon","SourceChip"])assert.match(primitives,new RegExp("export function "+name+"\\("));
 for(const old of ["function HButton(","function SectionTitle(","function Shelf("])assert.ok(!marketing.includes(old),old);
 for(const hook of ["<SourceDialog","<SourceIcon","<SourceChip","<Shelf","<HButton","<SectionTitle"])assert.ok(marketing.includes(hook),hook);
});

test("Source-dialog renders the original two-tone, paired-CTA structure without a legacy HTML dependency",()=>{
 const code=fs.readFileSync("app/components/SourcePrimitives.tsx","utf8");
 const css=fs.readFileSync("app/components/source-dialog.css","utf8");
 const root=fs.readFileSync("app/root.tsx","utf8");
 const marketing=fs.readFileSync("app/components/ReactMarketing.tsx","utf8");
 assert.match(code,/hm-source-peek-hero/);
 assert.match(code,/hm-source-peek-rows/);
 assert.match(code,/hm-source-peek-primary/);
 assert.match(code,/hm-source-peek-secondary/);
 assert.match(code,/createPortal\(/);
 assert.match(css,/width:min\(560px,100%\)/);
 assert.match(css,/blur\(4px\)/);
 assert.match(root,/hm-site-nav-icon/);
 assert.match(root,/\/brand\/icons\/map-pin.svg/);
 assert.match(marketing,/Where most clients start/);
 assert.match(marketing,/Discuss This Challenge/);
 assert.match(marketing,/Compare All Three/);
 assert.match(marketing,/useSearchParams/);
 const contact=fs.readFileSync("app/components/ReactContact.tsx","utf8");
 assert.match(contact,/defaultValue=\{startingMessage\}/);
});
