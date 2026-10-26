import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const html=JSON.parse(fs.readFileSync("design/sources/site-v4.template.json","utf8"));
const generated=fs.readFileSync("app/components/source-foundation.generated.css","utf8");
const marketing=fs.readFileSync("app/components/ReactMarketing.tsx","utf8");
const primitives=fs.readFileSync("app/components/SourcePrimitives.tsx","utf8");
const palette=[["ink","#1E272A"],["body","#2A3538"],["slate","#434F4F"],["stone","#5E6967"],["paper","#F4F5F1"],["mist","#E7EBE6"],["muted","#D0D8D2"],["line","#BAC4BE"],["rust","#B5532C"],["rust-dark","#9A4524"],["moss","#2E6B5C"]];
test("owner-authored source palette and stylesheet drive React tokens",()=>{
 const sourceSheets=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
 assert.equal(sourceSheets.length,2,"Expected original source stylesheet structure");
 assert.ok(generated.includes(sourceSheets[1][1].trim()),"Full owner baseline stylesheet must be included unchanged");
 for(const [name,hex] of palette){
  assert.ok(html.toUpperCase().includes(hex.toUpperCase()),"Original source missing "+hex);
  assert.ok(generated.includes("--hummin-"+name+": "+hex+";"),"Missing original "+name+" token");
 }
});
test("shared source primitives replace page-local duplicated implementations",()=>{
 for(const name of ["SourceButton","SourceSectionTitle","SourceShelf","SourceDialog","SourceIcon","SourceChip"]){
  assert.match(primitives,new RegExp("export function "+name+"\\("));
 }
 for(const old of ["function HButton(","function SectionTitle(","function Shelf("]){
  assert.ok(!marketing.includes(old),"No page-local primitive: "+old);
 }
 for(const hook of ["<SourceDialog","<SourceIcon","<SourceChip","<Shelf","<HButton","<SectionTitle"]){
  assert.ok(marketing.includes(hook),"Source component missing: "+hook);
 }
});
