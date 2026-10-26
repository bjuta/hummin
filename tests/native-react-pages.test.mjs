import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {HEADS,STAGES,DOMAINS,ENGS,TOPICS,VALUES,TIERS,NEEDS} from "../app/lib/react-site-content.ts";

const read=path=>fs.readFileSync(path,"utf8");
test("Six marketing routes are genuine React components preserving HUMMIN source copy",()=>{
 const comp=read("app/components/ReactMarketing.tsx");
 assert.match(comp,/export function ReactMarketing/);
 for(const component of ["Home","How","Expertise","Engagements","Who","About"])assert.match(comp,new RegExp("function "+component+"\\("));
 for(const phrase of ["Inside your business.","Behind your progress.","Good businesses encounter problems that do not fit neatly into departments.","We find the cause","Four steps, in order.","Seven areas","Six principles for how we work.","Inside your team. Employed by HUMMIN.","Muiruri Beautah"]) {
  const found=comp.includes(phrase)||JSON.stringify({HEADS,STAGES,DOMAINS,ENGS,TOPICS,VALUES,TIERS}).includes(phrase);
  assert.ok(found,"Missing reference copy: "+phrase);
 }
 assert.equal(STAGES.length,4);
 assert.equal(DOMAINS.length,7);
 assert.equal(ENGS.length,3);
 assert.equal(TOPICS.length,6);
 assert.equal(VALUES.length,6);
 assert.equal(TIERS.length,3);
 assert.equal(NEEDS.length,4);
 assert.match(comp,/src="\/brand\/hummin-symbol.svg"/);
 assert.doesNotMatch(comp,/<iframe|dangerouslySetInnerHTML|design\/site\/index\.html|dc-import|__bundler\/template/);
});
test("Native React source photography is real build-time extracted brand media",()=>{
 const assets=read("scripts/extract-react-assets.mjs");
 for(const art of ["home-hero","how-hero","expertise-hero","engagements-hero","who-hero","who-owner","about-hero","about-founder","residency"])assert.ok(assets.includes("'"+art+"'"));
 assert.match(assets,/item\.mime!=='image\/webp'/);
 assert.match(read("package.json"),/extract-react-assets\.mjs/);
});
test("Staging route cannot accidentally expose incomplete React migration on public hostname",()=>{
 const stage=read("app/routes/react.preview.tsx");
 assert.match(stage,/isHumminPublicHost\(host\)/);
 assert.match(stage,/status:404/);
 assert.match(stage,/noindex,nofollow/);
 const config=read("app/routes.ts");
 assert.match(config,/route\("__react\/:page","routes\/react.preview.tsx"\)/);
 assert.match(config,/index\("routes\/fidelity.ts"\)/,"Legacy public routes kept until parity approval");
});
