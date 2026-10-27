import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {releaseFromEditor,parsePublicInsight,publishedInsights,publicInsightBySlug} from "../app/lib/insights-public.server.ts";

const article={
 slug:"working-with-hummin",sourceSlug:null,title:"A Practical HUMMIN Guide",
 excerpt:"A practical guide for growing an established business.",type:"Guide",author:"team",
 topics:["Strategy"],date:"2026-10-25",
 blocks:[{t:"h",text:"The principle"},{t:"p",text:"Build with care."},{t:"ol",text:"First action\nSecond action"},{t:"as",text:""}]
};
test("Editor release converts blocks into the exact existing public Insights contract",()=>{
 const out=releaseFromEditor(article);
 assert.ok(out);
 assert.equal(out.type,"guide");
 assert.equal(out.author,"team");
 assert.deepEqual(out.blocks[2],{t:"ol",items:["First action","Second action"]});
 assert.deepEqual(out.blocks[3],{t:"assess"});
 assert.deepEqual(parsePublicInsight(out),out);
});
test("Published release rejects invalid slugs, scripts and unsupported blocks",()=>{
 assert.equal(parsePublicInsight({...article,type:"news",author:"team",blocks:[{t:"script",text:"bad"}]}),null);
 assert.equal(releaseFromEditor({...article,slug:"../admin"}),null);
 assert.equal(releaseFromEditor({...article,blocks:[{t:"dl",text:"Unknown download"}]}),null);
 assert.equal(releaseFromEditor({...article,type:"Guest partner"}),null);
});
test("Only immutable publication rows enter public feeds, never drafts",async()=>{
 const release=releaseFromEditor(article);
 const queries=[];
 const db={prepare(sql){queries.push(sql);return {
  all:async()=>({results:[{data_json:JSON.stringify(release)},{data_json:'{bad json'}]}),
  bind(){return {first:async()=>({data_json:JSON.stringify(release)})};}
 };}};
 const list=await publishedInsights({DB:db});
 assert.equal(list.length,1);
 assert.equal((await publicInsightBySlug({DB:db},article.slug))?.title,article.title);
 assert.ok(queries.every(q=>q.includes("admin_insights_publications")));
 assert.equal(await publicInsightBySlug({DB:db},"../../admin"),null);
});
test("Design restoration hydrates published records without replacing its original editorial template",()=>{
 const restored=fs.readFileSync("scripts/restore-original.mjs","utf8");
 assert.match(restored,/HUMMIN_applyPublishedPosts/);
 assert.match(restored,/api\/insights\/publications/);
 assert.match(restored,/SORTED\.splice/);
 assert.match(restored,/Static editorial catalogue stays visible/);
 const fidelity=fs.readFileSync("app/routes/fidelity.ts","utf8");
 assert.match(fidelity,/publicInsightBySlug/);
 const form=fs.readFileSync("app/components/admin-source-screens.tsx","utf8");
 assert.match(form,/published_revision/);
 assert.match(form,/name="revision"/);
 const mutations=fs.readFileSync("app/lib/admin-source.server.ts","utf8");
 assert.match(mutations,/admin_insights_publications/);
 assert.match(mutations,/newer version of this article/);
});
