import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=f=>fs.readFileSync(f,"utf8");
test("All Insights page classes use the same dark hero shell",()=>{
 const primitive=read("app/components/SourcePrimitives.tsx"), index=read("app/components/ReactInsights.tsx"),article=read("app/components/ReactInsightArticle.tsx");
 const shared=read("app/components/source-editorial-hero.css"),layout=read("app/components/SourceEditorialLayout.tsx");
 assert.match(primitive,/export function SourceEditorialHero/);
 assert.match(index,/<SourceEditorialHeading/);
 assert.match(layout,/export function SourceEditorialHeading/);
 assert.match(layout,/<SourceEditorialHero as=\{article\?/);
 assert.match(article,/<SourceEditorialHeading article/);
 assert.match(shared,/circle at 74% 22%/);
 assert.match(shared,/max\(560px,60cqw\)/);
 for(const file of ["app/components/react-insights.css","app/components/react-insights-source-index.css","app/components/react-article.css"]){
  assert.doesNotMatch(read(file),/radial-gradient\(circle at 74% 22%/,"Hero shell geometry must not drift in "+file);
 }
});
