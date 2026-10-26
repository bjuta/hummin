/** Read-only Production Staging browser acceptance. No form submission or deployment.
 * Post language-label staging deployment: identify remaining text contrast issues.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const base=(process.env.HUMMIN_STAGING_URL||"https://hummin-web-production.grimpossible.workers.dev").replace(/\/$/,"");
assert.match(base,/^https:\/\/hummin-web-production\.[a-z0-9-]+\.workers\.dev$/);
const output="artifacts/browser-audit";fs.mkdirSync(output,{recursive:true});
const result={url:base,checkedAt:new Date().toISOString(),pages:[],failures:[],warnings:[]};
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const variants=[
 {name:"mobile",width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1},
 {name:"tablet",width:768,height:1024,deviceScaleFactor:1},
 {name:"desktop",width:1440,height:900,deviceScaleFactor:1}
];
const paths=["/","/privacy","/terms","/contact","/assessment","/insights"];
for(const variant of variants){
 const context=await browser.newContext({viewport:{width:variant.width,height:variant.height},isMobile:!!variant.isMobile,hasTouch:!!variant.hasTouch,deviceScaleFactor:1,locale:"en-KE",timezoneId:"Africa/Nairobi"});
 for(const path of paths){
  const page=await context.newPage();
  const id=variant.name+":"+path;
  const item={viewport:variant.name,path,status:0,headingCount:0,overflow:0,axeSerious:[],consoleErrors:[]};
  result.pages.push(item);
  page.on("pageerror",err=>item.consoleErrors.push(err.message.slice(0,180)));
  try{
   const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:35000});
   item.status=response?.status()||0;
   if(item.status!==200){result.failures.push(id+" HTTP "+item.status);continue;}
   await page.waitForTimeout(path==="/"||path==="/assessment"||path==="/insights"?2000:650);
   const metrics=await page.evaluate(()=>({
     htmlWidth:document.documentElement.scrollWidth,
     viewportWidth:document.documentElement.clientWidth,
     bodyWidth:document.body.scrollWidth,
     headingCount:document.querySelectorAll("h1").length,
     legalSectionCount:document.querySelectorAll(".hummin-legal-section").length,
     navCount:document.querySelectorAll(".hummin-legal-toc a").length,
     footerTerms:!!document.querySelector('a[href="/terms"]'),
     footerPrivacy:!!document.querySelector('a[href="/privacy"]')
   }));
   item.headingCount=metrics.headingCount;
   item.overflow=Math.max(0,Math.max(metrics.htmlWidth,metrics.bodyWidth)-metrics.viewportWidth);
   if(item.overflow>4)result.failures.push(id+" horizontal overflow "+item.overflow+" px (document "+metrics.htmlWidth+" / viewport "+metrics.viewportWidth+")");
   if(["/privacy","/terms"].includes(path)){
     const wanted=path==="/privacy"?8:12;
     if(metrics.legalSectionCount!==wanted)result.failures.push(id+" expected "+wanted+" legal sections; found "+metrics.legalSectionCount);
     if(metrics.navCount!==wanted)result.failures.push(id+" expected "+wanted+" TOC links; found "+metrics.navCount);
     if(metrics.headingCount!==1)result.failures.push(id+" expected exactly one H1, got "+metrics.headingCount);
     if(!metrics.footerTerms||!metrics.footerPrivacy)result.failures.push(id+" missing Privacy/Terms navigation");
     await page.screenshot({path:output+"/"+variant.name+"-"+path.slice(1)+".png",fullPage:true,animations:"disabled"});
     const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
     item.axeSerious=axe.violations.filter(v=>v.impact==="serious"||v.impact==="critical").map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help,selector:v.nodes[0]?.target}));
     item.axeOther=axe.violations.filter(v=>v.impact!=="serious"&&v.impact!=="critical").map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));
     if(item.axeSerious.length)result.failures.push(id+" serious/critical axe findings "+JSON.stringify(item.axeSerious));
     if(item.axeOther.length)result.warnings.push(id+" minor/moderate axe findings "+JSON.stringify(item.axeOther));
   }
   if(path==="/assessment"||path==="/insights"){
     const wanted=path==="/assessment"?"hummin-assessment-frame":"hummin-insights-frame";
     const frameElement=page.locator("#"+wanted);
     await frameElement.waitFor({state:"attached",timeout:12000});
     const src=await frameElement.getAttribute("src");
     await page.waitForTimeout(5000);
     const handle=await frameElement.elementHandle();
     const frame=await handle?.contentFrame()||null;
     item.iframeSrc=src;
     item.frames=page.frames().map(f=>f.url().slice(0,200));
     item.iframeUrl=frame?.url()||null;
     const direct=await page.request.get(base+src,{timeout:15000}).catch(()=>null);
     item.iframeDirectStatus=direct?.status()||null;
     if(!frame){result.failures.push(id+" frame contentWindow missing (src "+src+", frames "+JSON.stringify(item.frames)+", assetHTTP "+item.iframeDirectStatus+")");}
     else{
       await frame.waitForLoadState("domcontentloaded",{timeout:15000});
       const frameStats=await frame.evaluate(()=>({
         viewport:document.documentElement.clientWidth,
         scroll:document.documentElement.scrollWidth,
         bodyScroll:document.body.scrollWidth,
         visibleText:document.body.innerText.trim().length,
         h1:document.querySelectorAll("h1").length,
         visibleSections:document.querySelectorAll("section").length,
         documentTitle:document.title,
         designMounted:window.__HUMMIN_DESIGN_MOUNTED__===true
       }));
       item.iframe=frameStats;
       const over=Math.max(frameStats.scroll,frameStats.bodyScroll)-frameStats.viewport;
       if(over>4)result.failures.push(id+" embedded "+path+" document horizontal overflow "+over+"px");
       if(frameStats.visibleText<150)result.failures.push(id+" embedded document appears blank; visible text "+frameStats.visibleText);
       if(!frameStats.designMounted)result.failures.push(id+" embedded design runtime did not mount");
       // Analyse the complete outer document including same-origin child frames.
       const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
       const serious=axe.violations.filter(v=>["serious","critical"].includes(v.impact));
       item.axeSerious=serious.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help,
         evidence:v.nodes.slice(0,5).map(n=>({target:n.target,html:n.html?.slice(0,300),contrast:n.any?.map(c=>({id:c.id,data:c.data})),summary:n.failureSummary?.slice(0,400)}))
       }));
       if(serious.length)result.failures.push(id+" embedded experience WCAG serious/critical "+JSON.stringify(item.axeSerious));
       item.axeOther=axe.violations.filter(v=>!["serious","critical"].includes(v.impact)).map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));
       if(item.axeOther.length)result.warnings.push(id+" other WCAG issues "+JSON.stringify(item.axeOther));
     }
   }
   if(["/privacy","/terms"].includes(path)){
     const firstTOC=page.locator(".hummin-legal-toc a").first();
     await firstTOC.focus();
     await page.keyboard.press("Enter");
     const hash=await page.evaluate(()=>location.hash);
     if(!hash)result.failures.push(id+" keyboard activation did not navigate within legal document");
   }
   if(item.consoleErrors.length)result.warnings.push(id+" JS errors "+JSON.stringify(item.consoleErrors.slice(0,3)));
   console.log("AUDIT",JSON.stringify(item));
  }catch(e){result.failures.push(id+" "+String(e?.message||e).slice(0,230));console.log("AUDIT ERROR",id,String(e).slice(0,400));}
  finally{await page.close();}
 }
 await context.close();
}
await browser.close();
fs.writeFileSync(output+"/summary.json",JSON.stringify(result,null,2));
console.log("BROWSER AUDIT SUMMARY",JSON.stringify({checked:result.pages.length,failures:result.failures,warnings:result.warnings},null,2));
assert.equal(result.failures.length,0,"Staging browser acceptance found blocking failures");
