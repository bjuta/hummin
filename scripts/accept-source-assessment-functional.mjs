/** Interactive end-to-end validation on isolated Preview only.
 * Never submits real contact, assessment email or booking requests.
 * Throws on any attempted mutation endpoint; screenshots are optional artifacts.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import contract from "../app/data/ApprovedAssessmentContract.generated.json" with {type:"json"};
const base="https://hummin-web-preview.grimpossible.workers.dev";
const route=base+"/__source-review/assessment";
const dir="artifacts/source-assessment-functional";
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const widths=[390,768,1440],reports=[];
try{
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},
    deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390,
    reducedMotion:"reduce",locale:"en-KE",timezoneId:"Africa/Nairobi"});
  const page=await ctx.newPage(),mutations=[],previewRequests=[],runtimeErrors=[];
  page.on("pageerror",error=>runtimeErrors.push("pageerror: "+String(error)));
  page.on("console",message=>{if(message.type()==="error")runtimeErrors.push("console: "+message.text());});
  page.on("request",request=>{
   if(new URL(request.url()).pathname==="/__source-verify/assessment")previewRequests.push(request);
   if(/\/(?:api\/assessment\/email|api\/booking\/reserve|api\/booking\/slots|contact)(?:\?|$)/.test(new URL(request.url()).pathname))
    mutations.push(request.url());
  });
  await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
  await page.route("**/api/assessment/email",r=>r.abort("blockedbyclient"));
  await page.route("**/api/booking/reserve",r=>r.abort("blockedbyclient"));
  await page.route("**/api/booking/slots",r=>r.abort("blockedbyclient"));
  let current=0;
  try{
   const res=await page.goto(route,{waitUntil:"domcontentloaded",timeout:45000});
   assert.equal(res?.status(),200,"Only isolated Assessment Preview may run this test");
   assert.match(res.headers()["x-robots-tag"]||"",/noindex/);
   // Server markup is visible before React attaches event handlers. Do not click an inert SSR button.
   await page.waitForFunction(()=>{
    const button=[...document.querySelectorAll("button")].find(x=>x.textContent?.includes("Start the Assessment"));
    return button&&typeof button.onclick==="function";
   },null,{timeout:25000});
   await page.getByRole("button",{name:/Start the Assessment/i}).click();
   await page.waitForTimeout(350);
   console.log("ASSESSMENT START DIAGNOSTIC",JSON.stringify({width,steps:await page.getByText(/Question 1 of 23/).count(),introButtons:await page.getByRole("button",{name:/Start the Assessment/i}).count(),runtimeErrors,js:await page.evaluate(()=>({scripts:[...document.querySelectorAll("script[src]")].map(e=>e.getAttribute("src")).slice(-10),mainButtons:[...document.querySelectorAll("button")].slice(0,6).map(x=>({text:x.innerText.slice(0,42),onclick:typeof x.onclick,outer:x.outerHTML.slice(0,180)})),ready:document.readyState,resources:performance.getEntriesByType("resource").filter(x=>x.name.includes("js")||x.name.includes("source.remaining")).slice(-12).map(x=>x.name)})),dom:(await page.locator("body").innerText()).slice(0,1300)}));
   for(const q of contract.STEPS){
    current++;
    await page.getByText("Question "+current+" of 23",{exact:true}).waitFor({timeout:14000});
    if(q.type==="choice"){
     await page.getByRole("radiogroup").locator('[role="radio"]').first().click();
    } else if(q.type==="numbers"){
     await page.locator("#n-sale").fill("25000");
     await page.locator("#n-enq").fill("40");
     await page.locator("#n-conv").fill("3");
     await page.locator("#n-hours").fill("45");
     await page.getByRole("button",{name:/^Next/}).click();
    } else if(q.type==="text"){
     await page.locator("textarea").fill("Enquiries answered within an hour.");
     console.log("ASSESSMENT LAST STEP",JSON.stringify({width,current,buttons:await page.locator("button").allInnerTexts(),step:await page.getByText(/Question .* of 23/).allInnerTexts(),html:(await page.locator("body").innerText()).slice(-1600)}));
     await page.getByRole("button",{name:/See My Results/}).click();
    }else throw Error("Unsupported authored question kind "+q.type);
   }
   await page.getByText("Strong foundations.",{exact:true}).waitFor({timeout:15000});
   await page.getByText("Three things to fix first.",{exact:true}).waitFor({timeout:8000});
   await page.locator("#g-name").fill("Preview Verification");
   await page.locator("#g-email").fill("preview@example.test");
   await page.locator("#g-biz").fill("Local-only Test");
   const verification=page.waitForResponse(r=>new URL(r.url()).pathname==="/__source-verify/assessment"&&r.request().method()==="POST",{timeout:12000});
   await page.getByRole("button",{name:"Open My Plan"}).click();
   const verified=await verification;
   assert.equal(verified.status(),200,"Preview validation endpoint accepted source model");
   const check=await verified.json();
   assert.deepEqual([check.ok,check.validated,check.delivered,check.queued],[true,true,false,false]);
   assert.equal(previewRequests.length,1,"Only one source-native validation request");
   await page.getByText("Your plan is unlocked in this isolated Preview. No email was sent.").first().waitFor();
   assert.equal(await page.getByText(/A copy of your plan is on its way to/).count(),0,"False email delivery claim");
   assert.equal(await page.getByRole("button",{name:/Confirm .*$/}).count(),0,"Fake booking confirmation remains exposed");
   assert.equal(mutations.length,0,"Preview attempted transactional external operations");
   assert.deepEqual(runtimeErrors,[],"No client errors during async local unlock");
   await page.screenshot({path:dir+"/assessment-"+width+"-results.png",fullPage:true,animations:"disabled"});
   await page.getByRole("button",{name:"Start Again"}).click();
   await page.getByRole("button",{name:/Start the Assessment/i}).waitFor();
   reports.push({width,steps:current,score:100,unlocked:true,restarted:true,previewValidationRequests:1,mutations:0,pass:true});
   console.log("NATIVE ASSESSMENT INTERACTIVE PASS",JSON.stringify(reports.at(-1)));
  }catch(err){
   reports.push({width,current,pass:false,error:String(err),mutations});
   await page.screenshot({path:dir+"/assessment-"+width+"-failure.png",fullPage:true,timeout:15000}).catch(()=>{});
   throw err;
  }finally{await ctx.close();}
 }
}finally{
 await browser.close();
 fs.writeFileSync(dir+"/summary.json",JSON.stringify({cases:reports},null,2));
}
assert.equal(reports.length,3);
assert.ok(reports.every(r=>r.pass),"Assessment interactive browser coverage incomplete");
console.log("NATIVE ASSESSMENT E2E SUMMARY 3/3 PASS — 69 answered questions, no delivery or reservations");
