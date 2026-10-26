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
