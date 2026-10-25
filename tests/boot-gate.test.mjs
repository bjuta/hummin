import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const restore=fs.readFileSync("scripts/restore-original.mjs","utf8");
test("Every restored interactive screen has one shared branded bootstrap gate",()=>{
 assert.match(restore,/function brandedBoot\(html,kind\)/);
 assert.match(restore,/brandedBoot\(html,name\)/);
 assert.match(restore,/brandedBoot\(patch\(insightSource,insightTemplate,fullInsight\)/);
 assert.match(restore,/id="hummin-boot"/);
 assert.match(restore,/src="\/brand\/hummin-symbol.svg"/);
 assert.match(restore,/officialSymbol\.mime!==['"]image\/svg\+xml['"]/);
 assert.match(restore,/document\.fonts\.ready/);
 assert.match(restore,/humminDesignReady:true/);
 assert.match(restore,/prefers-reduced-motion:reduce/);
});
test("Loader cannot permanently trap users and avoids early unstyled disclosure",()=>{
 assert.match(restore,/document\.readyState==='loading'/);
 assert.match(restore,/obs\.disconnect\(\)/);
 assert.match(restore,/document\.documentElement\.classList\.remove\('hm-booting'\)/);
 assert.match(restore,/setTimeout\(function\(\)\{if\(ended\)return;ended=true/);
 assert.match(restore,/html\.hm-booting body>x-dc\{visibility:hidden!important\}/);
});
test("Insights deep links select the requested page on the first paint",()=>{
 assert.match(restore,/Resolve deep links before the first React render/);
 assert.match(restore,/view:'post',slug:path\[1\]/);
 assert.match(restore,/view:'author',author:path\[2\]/);
 assert.match(restore,/view:'topic',topic:topic\.name/);
});

test("Global splash waits for mounted component and active nested route before fade",()=>{
 assert.match(restore,/window\.__HUMMIN_DESIGN_MOUNTED__===?true|window\.__HUMMIN_DESIGN_MOUNTED__!==true/);
 assert.match(restore,/window\.dispatchEvent\(new Event\('hummin-design-mounted'\)\)/);
 assert.match(restore,/hummin-assessment-frame/);
 assert.match(restore,/hummin-insights-frame/);
 assert.match(restore,/document\.fonts\.ready/);
});

test("A lost iframe ready message cannot leave Insights or Assessment permanently hidden",()=>{
 assert.match(restore,/function recoverFrame\(\)/);
 assert.match(restore,/child\.__HUMMIN_DESIGN_MOUNTED__!==true/);
 assert.match(restore,/doc\.getElementById\('hummin-boot'\)/);
 assert.match(restore,/f\.style\.visibility='visible'/);
 assert.match(restore,/setInterval\(function\(\)/);
});
