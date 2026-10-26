import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const article=fs.readFileSync("app/components/ReactInsightArticle.tsx","utf8");
const insights=fs.readFileSync("app/components/ReactInsights.tsx","utf8");
const primitive=fs.readFileSync("app/components/SourceEditorialCard.tsx","utf8");
test("All HUMMIN editorial views share one source-faithful card primitive",()=>{
 for(const variant of ["latest","archive"])assert.ok(insights.includes('variant="'+variant+'"'),"Missing "+variant+" view");
 assert.ok(article.includes('variant="related"'),"Missing related article view");
 for(const cls of ["hr-insights-landing-card-top","hr-insights-source-list-card-top","ra-related-top"])assert.ok(primitive.includes(cls),"Source CSS hook missing "+cls);
 assert.ok(!insights.includes("function SourceLandingCard("));
 assert.ok(!insights.includes("function SourceListCard("));
 assert.ok(!article.includes("function EditorialCard("));
});

test("Native Insights loaders have a dedicated server boundary",()=>{
 const server=fs.readFileSync("app/lib/react-insights-loader.server.ts","utf8");
 const preview=fs.readFileSync("app/routes/react.insights.preview.tsx","utf8");
 const canonical=fs.readFileSync("app/routes/react.insights.gated.tsx","utf8");
 assert.match(server,/export async function loadReactInsights/);
 assert.match(server,/publishedInsights/);
 assert.match(server,/preview:!canonical/);
 for(const route of [preview,canonical]){
  assert.match(route,/react-insights-loader\.server/);
  assert.doesNotMatch(route,/from "\.\.\/lib\/insights\.server"/);
  assert.doesNotMatch(route,/export async function loadReactInsights/);
 }
 assert.match(canonical,/react-insights-meta/);
 assert.match(canonical,/PUBLIC_REACT_CUTOVER_APPROVED/);
});
