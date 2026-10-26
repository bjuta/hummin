import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const root=fs.readFileSync("app/root.tsx","utf8");
const css=fs.readFileSync("app/site.css","utf8");
const compiled=fs.readFileSync("app/components/source-foundation.css","utf8");
test("Native React root boot has no iframe or legacy HTML bootstrap",()=>{
 assert.match(root,/function Layout\(/);
 assert.match(root,/<Meta\/><Links\/>/);
 assert.match(root,/<ScrollRestoration\/><Scripts\/>/);
 assert.match(root,/<Header\/><main id="main"/);
 assert.doesNotMatch(root,/<iframe|__bundler\/template|hummin-boot/);
});
test("First paint uses vendored brand fonts and independent design rules",()=>{
 for(const family of ["hummin-figtree-latin.woff2","hummin-newsreader-regular-latin.woff2","hummin-newsreader-italic-latin.woff2"]){
  assert.ok(css.includes(family),"Missing local font "+family);
  assert.equal(fs.readFileSync("public/brand/fonts/"+family).toString("ascii",0,4),"wOF2");
 }
 assert.ok(compiled.includes("--hummin-ink: #1E272A"));
 assert.ok(compiled.includes("--hummin-rust: #B5532C"));
 assert.ok(fs.readFileSync("public/brand/hummin-symbol.svg","utf8").includes("<svg"));
});
test("Native Insights and Assessment are actual React components",()=>{
 for(const path of ["app/components/ReactInsights.tsx","app/components/ReactAssessment.tsx"]){
  const source=fs.readFileSync(path,"utf8");
  assert.doesNotMatch(source,/<iframe|__bundler\/template|dc-import/);
 }
});
