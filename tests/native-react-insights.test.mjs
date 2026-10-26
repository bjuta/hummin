import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(path,"utf8");
const posts=JSON.parse(read("app/lib/react-original-insights.json"));
test("Original authored Insights corpus is shipped as JSON",()=>{
 assert.equal(posts.length,4);
 const slugs=posts.map(p=>p.slug).sort();
 const meta=[...read("app/lib/insights.server.ts").matchAll(/\bslug:"([^"]+)"/g)].map(m=>m[1]).sort();
 assert.deepEqual(slugs,meta);
 for(const p of posts){assert.ok(p.title&&p.excerpt);assert.ok(p.blocks.length>=7)}
});
test("Native Insights serves archives, articles and authors without legacy HTML",()=>{
 const routes=read("app/routes.ts");
 const view=read("app/components/ReactInsights.tsx");
 const article=read("app/components/ReactInsightArticle.tsx");
 const cards=read("app/components/SourceEditorialCard.tsx");
 for(const route of ["insights/:slug","insights/author/:author","insights/topic/:topic"])
   assert.ok(routes.includes(route));
 assert.ok(view.includes("ReactInsightArticle"));
 for(const variant of ['variant="latest"','variant="archive"'])assert.ok(view.includes(variant));
 assert.ok(article.includes('variant="related"'));
 assert.ok(cards.includes("hr-insights-source-list-card"));
 assert.doesNotMatch(view,/<iframe|dc-import|__bundler\/template/);
 assert.doesNotMatch(article,/<iframe|dc-import|__bundler\/template/);
});
