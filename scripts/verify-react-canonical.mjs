/** Read-only canonical React Preview website acceptance.
 * Never posts to /api or submits forms. Public hostname remains legacy.\n * Recheck refreshed source-faithful React design, assessment prompts and legal text contrast.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
const preview="https://hummin-web-preview.grimpossible.workers.dev";
const live="https://hummin.org";
const pages=[
 ["/","home"],["/how-we-work","how"],["/applied-expertise","core"],
 ["/engagements","eng"],["/who-we-work-with","who"],["/about","about"],
 ["/contact","contact"],["/assessment","assessment"],["/insights","insights"],
 ["/insights/enquiries-30-day-fix","article"],
 ["/insights/topic/marketing","topic"],["/insights/author/team","author"],
 ["/privacy","privacy"],["/terms","terms"]
];
const failures=[],results=[];
fs.mkdirSync("artifacts/react-canonical",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const width of [390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1,locale:"en-KE",timezoneId:"Africa/Nairobi"});
 await context.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
 for(const [path,kind] of pages){
  const page=await context.newPage();const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   const response=await page.goto(preview+path,{waitUntil:"domcontentloaded",timeout:30000});
   assert.equal(response?.status(),200,path+" HTTP 200");
   await page.locator("h1").first().waitFor({state:"visible",timeout:12000});
   const details=await page.evaluate(()=>({
    h1:document.querySelectorAll("h1").length,
    iframe:document.querySelectorAll("iframe").length,
    documentScroll:document.scrollingElement?.tagName,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    heading:document.querySelector("h1")?.innerText?.slice(0,100),
    title:document.title,
    bodyLength:document.body.innerText.length,
    header:document.querySelectorAll(".hm-site-header").length,
    htmlDesign:!!document.querySelector("script[type='__bundler/template']"),
    logo:document.querySelector(".hm-site-brand img")?.getAttribute("src"),
    hero:!!document.querySelector(".hr-hero")
   }));
   assert.equal(details.h1,1,path+" single H1");
   assert.equal(details.iframe,0,path+" iframe-free");
   assert.equal(details.documentScroll,"HTML",path+" native scrolling");
   assert.equal(details.header,1,path+" shared React header");
   assert.ok(details.overflow<=3,path+" unexpected horizontal overflow");
   assert.ok(details.bodyLength>230,path+" should have substantial content");
   assert.equal(details.htmlDesign,false,path+" must not ship original HTML app");
   assert.equal(errors.length,0,path+" JS errors: "+errors.join(";"));
   assert.match(response?.headers()["x-robots-tag"]||"",/noindex/,path+" Preview not indexable");
   if(["home","how","core","eng","who","about"].includes(kind)){
    assert.ok(details.hero,path+" React hero");
    const image=await page.locator(".hr-hero-photo").count();
    assert.equal(image,1,path+" original artwork should load");
    const loaded=await page.locator(".hr-hero-photo").evaluate(async el=>{await el.decode();return el.naturalWidth>30});
    assert.ok(loaded,path+" original photograph decodes");
   }
   // The original HUMMIN design includes a dismissible floating assessment
   // invitation and a terracotta assessment band across content pages.
   if(["home","how","core","eng","who","about","insights","article","topic","author"].includes(kind)){
    assert.equal(await page.locator(".hr-assessment-band").count(),1,path+" original site-wide assessment band");
    assert.equal(await page.locator(".hr-assessment-float-content").count(),1,path+" original sticky assessment invitation");
    assert.ok(await page.locator('.hr-assessment-float-content a[href="/assessment"]').count());
   }
   if(["assessment","contact"].includes(kind))assert.equal(await page.locator(".hr-assessment-float").count(),0);
   if(width===390&&["home","how","core","eng","who","about"].includes(kind)){
    const height=await page.locator(".hr-hero").evaluate(x=>x.getBoundingClientRect().height);
    assert.ok(Math.abs(height-(kind==="home"?620:480))<=3,path+" source mobile hero height mismatch "+height);
   }
   if(kind==="home"){
    assert.ok(await page.getByText("Keep us close with a",{exact:false}).count(),"Original Residency language");
    assert.equal(await page.locator(".hr-problem-card").count(),6,"All six source problem cards");
    assert.equal(await page.locator(".hr-engagement-card").count(),3,"Source engagements");
    assert.equal(await page.locator(".hr-home-insight-card").count(),3,"Source homepage editorial teasers");
    assert.equal(await page.locator(".hr-bottom-cta").count(),0,"No invented dark homepage CTA");
   }
   if(kind==="how"){
    assert.equal(await page.locator(".hr-stage-card").count(),4,"Four original stage posters");
    assert.ok(await page.locator(".hr-stage-source-0").count(),"Original first mist-coloured poster");
    assert.equal(await page.getByText("Ready to make progress?",{exact:true}).count(),0,"No invented engagement section");
   }
   if(kind==="core"){
    assert.equal(await page.locator(".hr-core-card").count(),7,"Seven original expertise cards");
    assert.equal(await page.locator("#core-detail").count(),1,"Full-width expertise detail");
    assert.equal(await page.locator(".hr-expertise-menu").count(),0,"Do not replace original shelf with menu");
   }
   if(kind==="assessment")assert.ok(await page.getByRole("button",{name:/Start the Assessment/}).count());
   if(kind==="contact")assert.ok(await page.locator(".hr-contact-form").count()||await page.getByText("temporarily unavailable").count());
   if(kind==="insights"){assert.equal(await page.locator(".hr-insights-featured").count(),1,"Original featured Insights hero");assert.ok(await page.locator(".hr-insights-landing-card").count()>=3,"Original latest editorial cards");assert.equal(await page.locator(".hr-insights-download-card").count(),2,"Original downloadable tools");assert.equal(await page.locator(".ra-source-newsletter").count(),1,"Original inline newsletter");}
   if(kind==="article")assert.ok(await page.locator(".ra-source-article").innerText().then(x=>x.includes("When sales slow down")));
   if(kind==="article"){for(const selector of [".ra-source-hero",".ra-source-figure",".ra-source-ol",".ra-source-download",".ra-source-assessment",".ra-source-sidebar",".ra-source-share",".ra-source-author",".ra-source-read-next",".ra-source-newsletter"])assert.equal(await page.locator(selector).count(),1,path+" missing original editorial feature: "+selector);}
   if(kind==="terms")assert.equal(await page.locator(".hummin-legal-section").count(),12);
   if(kind==="privacy")assert.equal(await page.locator(".hummin-legal-section").count(),8);
   // The legal article enters with a short opacity/translation animation.
   // Axe must inspect its final text contrast, not an intermediate translucent frame.
   if(kind==="privacy"||kind==="terms"){
    await page.locator(".hummin-legal-body").evaluate(async el=>{
      await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));
    });
   }
   const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
   const blocking=axe.violations.filter(v=>v.impact==="serious"||v.impact==="critical");
   assert.equal(blocking.length,0,path+" accessibility "+JSON.stringify(blocking.map(v=>({id:v.id,targets:v.nodes.slice(0,2).map(n=>n.target)}))));
   if(width!==768)await page.screenshot({path:"artifacts/react-canonical/"+width+"-"+(path==="/ "?"root":path.replaceAll("/","_")||"home")+".png",fullPage:kind!=="assessment",animations:"disabled"});
   results.push({path,width,kind,...details,otherAxe:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});
   console.log("CANONICAL PASS",path,width,details.heading);
  }catch(e){const msg=path+" @"+width+" "+String(e).slice(0,420);failures.push(msg);console.error("CANONICAL FAIL",msg)}
  finally{await page.close()}
 }
 await context.close();
}
await browser.close();
for(const path of ["/","/assessment","/insights","/contact"]){
 try{
  const res=await fetch(live+path,{signal:AbortSignal.timeout(25000)});
  const html=await res.text();
  assert.equal(res.status,200);
  assert.ok(!html.includes("hr-page"),"Public "+path+" must not yet serve incomplete React migration");
  console.log("PUBLIC UNCHANGED",path,res.status,html.length);
 }catch(e){failures.push("Public continuity "+path+" "+String(e).slice(0,300))}
}
fs.writeFileSync("artifacts/react-canonical/summary.json",JSON.stringify({results,failures},null,2));
console.log("CANONICAL SUMMARY",JSON.stringify({passes:results.length,failures:failures.length,details:failures}));
assert.equal(failures.length,0,"Canonical React website Preview acceptance failed");
