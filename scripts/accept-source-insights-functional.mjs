/** Read-only native Insights UI acceptance on isolated Preview. */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
const base="https://hummin-web-preview.grimpossible.workers.dev";
const out="artifacts/source-insights-functional";
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const reports=[];
try{
 for(const width of [390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},
   reducedMotion:"reduce",deviceScaleFactor:1,locale:"en-KE",timezoneId:"Africa/Nairobi"});
  const page=await ctx.newPage(),mutations=[],previewOptIns=[],errors=[];
  page.on("pageerror",error=>errors.push(String(error)));
  page.on("request",req=>{
   const u=new URL(req.url());
   if(u.pathname==="/__source-verify/newsletter"&&req.method()==="POST")previewOptIns.push(req.url());
   else if(u.origin===base&&!["GET","HEAD"].includes(req.method())&&
    u.pathname!=="/api/analytics/event")mutations.push(req.url());
  });
  await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
  await page.route("**/api/booking/**",r=>r.abort("blockedbyclient"));
  await page.route("**/api/assessment/email",r=>r.abort("blockedbyclient"));
  try{
   let res=await page.goto(base+"/__source-review/insights",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(res.status(),200);
   const input=page.getByPlaceholder("Search guides, opinion, and news");
   await input.waitFor({timeout:20000});
   await page.waitForFunction(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>x.getAttribute("role")==="tab"&&x.textContent?.includes("Opinion"));
    return b&&typeof b.onclick==="function";
   },null,{timeout:20000});
   await page.getByRole("tab",{name:/Opinion/}).click();
   await page.getByRole("tab",{name:/Opinion/}).getAttribute("aria-selected").then(x=>assert.equal(x,"true"));
   await page.getByRole("tab",{name:/^All/}).click();
   await input.fill("this-exact-query-matches-nothing");
   await page.getByRole("button",{name:"Clear search"}).waitFor({timeout:7000});
   await page.getByRole("button",{name:"Clear search"}).click();
   await input.inputValue().then(v=>assert.equal(v,""));
   const feature=page.locator('button[aria-label*="Why enquiries"]').first();
   await feature.waitFor({timeout:7000});
   await feature.click();
   await page.getByRole("heading",{name:/Why enquiries go unanswered/}).first().waitFor({timeout:7000});
   await page.getByRole("button",{name:/All Insights/}).first().click();
   await page.getByPlaceholder("Search guides, opinion, and news").waitFor({timeout:7000});
   // Real HTTP request to isolated validation service; not a newsletter subscription.
   await page.locator("#sub-email").fill("visitor@example.test");
   const optIn=page.waitForResponse(r=>new URL(r.url()).pathname==="/__source-verify/newsletter"&&r.request().method()==="POST",{timeout:15000});
   await page.getByRole("button",{name:"Subscribe",exact:true}).click();
   const verified=await optIn;
   assert.equal(verified.status(),200);
   const checked=await verified.json();
   assert.deepEqual([checked.ok,checked.validated,checked.subscribed,checked.queued],[true,true,false,false]);
   await page.getByText(/No subscription was created and no email was sent/).first().waitFor();
   assert.equal(previewOptIns.length,1,"Only one validation request was sent");
   assert.equal(mutations.length,0);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:out+"/insights-"+width+".png",fullPage:true,animations:"disabled"});
   reports.push({width,filter:true,search:true,article:true,back:true,newsletterValidated:true,subscribed:false,mutations:0});
   console.log("NATIVE INSIGHTS INTERACTIONS PASS",JSON.stringify(reports.at(-1)));
  }catch(err){
   console.log("INSIGHTS FUNCTIONAL DIAGNOSTIC",JSON.stringify({width,errors,mutations,body:(await page.locator("body").innerText().catch(()=>(""))).slice(0,1600)}));
   await page.screenshot({path:out+"/insights-"+width+"-fail.png",fullPage:true}).catch(()=>{});
   throw err;
  }finally{await ctx.close()}
 }
}finally{await browser.close();fs.writeFileSync(out+"/summary.json",JSON.stringify(reports,null,2));}
assert.equal(reports.length,3);
console.log("NATIVE INSIGHTS INTERACTION SUMMARY 3/3 PASS");
