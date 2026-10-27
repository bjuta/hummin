import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {HERO_STYLE,HEADS,STAGES,DOMAINS,ENGS,TOPICS,VALUES,TIERS,NEEDS} from "../app/lib/react-site-content.ts";

const read=path=>fs.readFileSync(path,"utf8");
test("Six marketing routes are genuine React components preserving HUMMIN source copy",()=>{
 const comp=read("app/components/ReactMarketing.tsx");
 const hero=read("app/components/SourceMarketingHero.tsx");
 const comparison=read("app/components/SourceEngagementComparison.tsx");
 assert.match(comp,/SourceMarketingHero as Hero/);
 assert.match(comp,/SourceEngagementComparison/);
 assert.match(hero,/export function SourceMarketingHero/);
 assert.match(comparison,/export function SourceEngagementComparison/);
 assert.match(comp,/export function ReactMarketing/);
 for(const component of ["Home","How","Expertise","Engagements","Who","About"])assert.match(comp,new RegExp("function "+component+"\\("));
 for(const phrase of ["Inside your business.","Behind your progress.","Good businesses encounter problems that do not fit neatly into departments.","We find the cause","Four steps, in order.","Seven areas","Six principles for how we work.","Inside your team. Employed by HUMMIN.","Muiruri Beautah"]) {
  const found=comp.includes(phrase)||hero.includes(phrase)||comparison.includes(phrase)||JSON.stringify({HEADS,HERO_STYLE,STAGES,DOMAINS,ENGS,TOPICS,VALUES,TIERS}).includes(phrase);
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
test("Native React photography and icons are independently versioned assets",()=>{
 for(const art of ["home-hero","how-hero","expertise-hero","engagements-hero","who-hero","who-owner","about-hero","about-founder","residency"]){
  const file=fs.readFileSync("public/brand/"+art+".webp");
  assert.equal(file.toString("ascii",8,12),"WEBP",art);
 }
 assert.ok(fs.existsSync("public/brand/hummin-symbol.svg"));
 assert.doesNotMatch(read("package.json"),/restore-original[.]mjs|extract-react-assets[.]mjs|sync-source-foundation[.]mjs/);
});
test("Staging route cannot accidentally expose incomplete React migration on public hostname",()=>{
 const stage=read("app/routes/react.preview.tsx");
 assert.match(stage,/isHumminPublicHost\(host\)/);
 assert.match(stage,/status:404/);
 assert.match(stage,/noindex,nofollow/);
 const config=read("app/routes.ts");
 assert.match(config,/route\("__react\/:page","routes\/react.preview.tsx"\)/);
 assert.match(config,/index\("routes\/react.marketing.gated.tsx"\)/,"Canonical paths are routed through the reversible hostname gate");
 for(const route of ["marketing","assessment","contact","insights"]){const gate=read("app/routes/react."+route+".gated.tsx");assert.match(gate,/isHumminPublicHost/);assert.match(gate,/originalLoader/);}
 const release=read("app/lib/react-cutover.server.ts");
 assert.match(release,/PUBLIC_REACT_CUTOVER_APPROVED = false/,"Public cutover must remain disabled without owner approval");
 for(const route of ["marketing","assessment","contact","insights"]){
  const gate=read("app/routes/react."+route+".gated.tsx");
  assert.match(gate,/!PUBLIC_REACT_CUTOVER_APPROVED/,"Explicit reviewed rollback on "+route);
  assert.match(gate,/canonical/,"Native public metadata must be configured for "+route);
 }
 const insights=read("app/routes/react.insights.preview.tsx");
 assert.match(insights,/loadReactInsights/,"Insights uses one native CMS loader on Preview and canonical routes");
 assert.match(insights,/react-insights-loader\.server/);
 const shared=read("app/lib/react-insights-loader.server.ts");
 assert.match(shared,/preview:!canonical/);
 assert.match(shared,/publishedInsights/);

 assert.match(read("app/routes/fidelity.ts"),/\/design\/site\/index.html/,"Live public host legacy responses remain until acceptance");
});


test("Assessment and Insights retain owner-authored first-fold design and site-wide assessment invitations",()=>{
 const assessment=read("app/components/ReactAssessment.tsx");
 const insight=read("app/components/ReactInsights.tsx");
 const promos=read("app/components/ReactAssessmentPromotion.tsx");
 assert.match(assessment,/See what is holding the business back/);
 assert.match(assessment,/And what it costs/);
 assert.match(assessment,/Business Assessment · About 8 minutes · No cost/);
 assert.match(assessment,/23 short questions about how the business runs today/);
 assert.match(assessment,/Have your monthly enquiries and average sale value to hand/);
 assert.match(insight,/Guides · Opinion · Downloads · News/);
 assert.match(insight,/Practical guides, opinion, and news for owners of established businesses/);
 assert.match(insight,/Search guides, opinion, and news/);
 assert.match(insight,/hr-insights-source-topics/);
 assert.match(promos,/What is holding the business back/);
 assert.match(promos,/Find out what is holding your business back/);
 assert.doesNotMatch(assessment,/<iframe|dangerouslySetInnerHTML/);
 assert.doesNotMatch(insight,/<iframe|dangerouslySetInnerHTML/);
});
