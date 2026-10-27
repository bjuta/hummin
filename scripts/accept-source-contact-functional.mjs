/** Preview-only non-delivery form tests: no real HUMMIN messages or writes. */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
const base="https://hummin-web-preview.grimpossible.workers.dev";
const out="artifacts/source-contact-functional";
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try{
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},
    locale:"en-KE",timezoneId:"Africa/Nairobi",reducedMotion:"reduce"});
  const page=await context.newPage();
  const forbidden=[];
  page.on("request",req=>{
   const url=new URL(req.url());
   if(url.origin===base&&req.method()!=="GET"&&req.method()!=="HEAD"
    &&url.pathname!=="/__source-verify/contact"
    &&url.pathname!=="/api/analytics/event")forbidden.push(req.url());
  });
  await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
  await page.route("**/api/booking/**",r=>r.abort("blockedbyclient"));
  await page.route("**/api/assessment/email",r=>r.abort("blockedbyclient"));
  try{
   const response=await page.goto(base+"/__source-preview/contact",{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(response.status(),200);
   assert.match(response.headers()["x-robots-tag"]||"",/noindex/);
   await page.waitForFunction(()=>[...document.querySelectorAll("button")]
    .some(b=>b.textContent?.includes("Send Enquiry")&&typeof b.onclick==="function"),
     null,{timeout:20000});
   await page.getByRole("button",{name:"Send Enquiry"}).click();
   await page.getByText("Please check the highlighted fields.").first().waitFor();
   await page.locator("#f-name").fill("Preview Visitor");
   await page.locator("#f-biz").fill("Example Test Company");
   await page.locator("#f-email").fill("visitor@example.test");
   await page.locator("#f-msg").fill("We want a structured way to handle and track enquiries.");
   const verified=page.waitForResponse(x=>x.url().endsWith("/__source-verify/contact"));
   await page.getByRole("button",{name:"Send Enquiry"}).click();
   const api=await verified;
   assert.equal(api.status(),200);
   const result=await api.json();
   assert.deepEqual([result.ok,result.delivered,result.validated],[true,false,true]);
   await page.getByText(/No enquiry was stored and no email was sent/).first().waitFor();
   assert.equal(forbidden.length,0,"Unexpected production-write request");
   results.push({width,invalidRejected:true,validContract:true,delivered:false,unexpectedRequests:0});
   await page.screenshot({path:out+"/contact-"+width+".png",fullPage:true,animations:"disabled"});
   console.log("NATIVE CONTACT NONDELIVERY PASS",JSON.stringify(results.at(-1)));
  }catch(err){
   await page.screenshot({path:out+"/contact-"+width+"-failure.png",fullPage:true}).catch(()=>{});
   throw err;
  }finally{await context.close();}
 }
}finally{await browser.close();fs.writeFileSync(out+"/summary.json",JSON.stringify(results,null,2));}
assert.equal(results.length,3);
console.log("NATIVE CONTACT NO-DELIVERY 3/3 PASSED");
