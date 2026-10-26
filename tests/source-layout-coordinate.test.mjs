import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const get=p=>fs.readFileSync(p,"utf8");
test("Single source container coordinate system and editorial hero geometry",()=>{
 assert.match(get("app/site.css"),/hr-page,.hr-insights-page,.ra-source-page/);
 assert.match(get("app/site.css"),/container-type:inline-size/);
 const shared=get("app/components/source-editorial-hero.css");
 assert.match(shared,/padding:clamp\(88px,9cqw,128px\)/);
 assert.match(shared,/right:-16cqw/);
 for(const path of ["app/components/react-insights.css","app/components/react-insights-source-index.css","app/components/react-article.css"]){
  const css=get(path);
  assert.doesNotMatch(css,/radial-gradient\(circle at 74% 22%/,"Shared source hero art should not be reimplemented in "+path);
  assert.doesNotMatch(css,/\.hr-insights-hero\{padding-top:75px\}/,"Mobile pages must share source hero rhythm");
 }
});
