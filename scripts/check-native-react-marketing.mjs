import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base="https://hummin-web-preview.grimpossible.workers.dev";
const slugs=["home","how","core","eng","who","about"];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
fs.mkdirSync("artifacts/react-marketing",{recursive:true});
const failures=[],results=[];
for(const width of [390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1});
 for(const slug of slugs){
  const page=await context.newPage();
  const faults=[];page.on("pageerror",e=>faults.push(e.message));
  try{
   const r=await page.goto(base+"/__react/"+slug,{waitUntil:"domcontentloaded",timeout:30000});
   assert.equal(r?.status(),200,slug+" native React route");
   await page.locator(".hr-hero h1").waitFor({state:"visible",timeout:12000});
   const loaded=await page.locator(".hr-hero-photo").evaluate(async e=>{await e.decode();return e.naturalWidth>40});
   const dims=await page.evaluate(()=>({
    h1:document.querySelectorAll("h1").length,
    root:document.scrollingElement?.tagName,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    pageHeight:document.scrollingElement?.scrollHeight,
    documentHeight:window.innerHeight,
    hero:Math.round(document.querySelector(".hr-hero").getBoundingClientRect().height),
    body:document.querySelector(".hr-page")?.innerText.length,
    doubleHeader:document.querySelectorAll(".hm-site-header").length
   }));
   if(width!==768){
    await page.screenshot({path:"artifacts/react-marketing/"+slug+"-"+width+".png",fullPage:true,animations:"disabled"});
   }
   assert.equal(loaded,true,slug+" source hero photography should load");
   assert.equal(dims.h1,1);
   assert.equal(dims.root,"HTML");
   assert.ok(dims.overflow<=3,slug+" overflow "+dims.overflow);
   assert.ok(dims.pageHeight>dims.documentHeight+300);
   assert.ok(dims.body>350,slug+" unexpected blank content");
   assert.equal(dims.doubleHeader,1);
   assert.equal(faults.length,0,slug+" page errors "+faults.join(";"));
   const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
   const serious=axe.violations.filter(v=>v.impact==="serious"||v.impact==="critical");
   assert.deepEqual(serious.map(v=>({id:v.id,nodes:v.nodes.slice(0,2).map(n=>n.target)})),[],slug+" serious accessibility issues");
   if(slug==="about"){
    await page.getByRole("tab",{name:"Action"}).click();
    assert.match(await page.locator("#hr-value-panel").innerText(),/Intelligence in action/);
   }
   if(slug==="eng"){
    await page.getByRole("tab",{name:"Residency"}).click();
    assert.match(await page.locator("#hr-tier-panel").innerText(),/monthly fee/);
   }
   if(slug==="core"){
    await page.getByRole("button",{name:/Technology/}).click();
    assert.match(await page.locator(".hr-expertise-detail").innerText(),/systems fit/);
   }
   results.push({slug,width,...dims,axe:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});
   console.log("NATIVE PASS",JSON.stringify(results.at(-1)));
  }catch(e){const message=slug+" "+width+": "+String(e).slice(0,350);failures.push(message);console.error("NATIVE FAIL",message);}
  finally{await page.close();}
 }
 await context.close();
}
await browser.close();
fs.writeFileSync("artifacts/react-marketing/summary.json",JSON.stringify({results,failures},null,2));
console.log("NATIVE REACT SUMMARY",JSON.stringify({passed:results.length,failed:failures.length,failures}));
assert.equal(failures.length,0,"React migration preview acceptance failed");
