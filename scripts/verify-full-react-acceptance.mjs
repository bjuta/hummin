/** Resume isolated React Preview acceptance after interrupted migration. All transactional endpoints are mocked:
 * this test MUST NOT send real enquiries, assessment emails, or reservations.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import AxeBuilder from "@axe-core/playwright";
// Verify the newly deployed isolated native React Preview; no external side effects.
const base="https://hummin-web-preview.grimpossible.workers.dev";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const failures=[],passed=[];
const futureDate="2026-11-03",futureSlot="2026-11-03T07:00:00.000Z";
const output="artifacts/full-react-acceptance";
fs.mkdirSync(output,{recursive:true});
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
 await context.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
 await context.route("**/api/email/config",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ready:true,siteKey:"test-site-key"})}));
 await context.route("https://challenges.cloudflare.com/turnstile/**",r=>r.fulfill({status:200,contentType:"application/javascript",body:"window.turnstile={render:function(el,opts){el.setAttribute('data-mocked','1');setTimeout(function(){opts.callback('automated-test-token-not-real')},25);return 'test';},remove:function(){},reset:function(){}};"}));
 await context.route("**/api/assessment/email",r=>{if(r.request().method()!=="POST")return r.abort();let payload=JSON.parse(r.request().postData()||"{}");assert.equal(payload.priorities.length,3);return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,queued:true})})});
 await context.route("**/api/booking/slots",r=>r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({enabled:true,days:[{date:futureDate,slots:[futureSlot]}],siteKey:"test-site-key"})}));
 await context.route("**/api/booking/reserve",r=>{if(r.request().method()!=="POST")return r.abort();let p=JSON.parse(r.request().postData()||"{}");assert.equal(p.start,futureSlot);return r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({ok:true,eventId:"test-calendar-no-mutation",meetUrl:"https://meet.google.com/aaa-bbbb-ccc",calendarUrl:"https://calendar.google.com/"})})});
 for(const entry of ["contact","insights","insights/enquiries-30-day-fix","assessment"]){
  const page=await context.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  try{
   const res=await page.goto(base+"/__react/"+entry,{waitUntil:"domcontentloaded",timeout:30000});
   assert.equal(res?.status(),200,entry);
   await page.waitForTimeout(1100);
   const information=await page.evaluate(()=>({h1:document.querySelectorAll("h1").length,iframe:document.querySelectorAll("iframe").length,scrollRoot:document.scrollingElement?.tagName,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,bodyText:document.body.innerText.length,nav:document.querySelectorAll(".hm-site-header").length}));
   assert.equal(information.h1,1);
   assert.equal(information.scrollRoot,"HTML");
   assert.equal(information.nav,1);
   assert.ok(information.overflow<=3,entry+" horizontal overflow "+information.overflow);
   assert.ok(information.bodyText>480,entry+" blank body");
   assert.equal(errors.length,0,entry+" JS errors: "+errors.join(";"));
   const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
   const serious=axe.violations.filter(v=>["serious","critical"].includes(v.impact));
   assert.deepEqual(serious.map(v=>({id:v.id,nodes:v.nodes.slice(0,2).map(n=>n.target)})),[],entry+" serious accessibility");
   if(entry==="contact"){
    await page.locator("#react-c-name").waitFor({state:"visible"});
    assert.ok(await page.locator('a[href="/privacy"]').count());
    assert.equal(information.iframe,0);
   }
   if(entry==="insights"){
    assert.ok(await page.locator(".hr-insights-card").count()>=4,"Original HUMMIN posts");
    await page.getByRole("button",{name:"Guides"}).click();
    assert.ok(await page.locator(".hr-insights-card").count()>=1);
    await page.getByRole("button",{name:"All",exact:true}).click();
    await page.getByPlaceholder("Search guides, opinion, and news").fill("enquiries");
    assert.ok(await page.locator(".hr-insights-card").count()>=1);
   }
   if(entry==="insights/enquiries-30-day-fix"){
    assert.ok(await page.locator(".hr-insights-article").innerText().then(s=>s.includes("When sales slow down")));
    assert.equal(information.iframe,0);
   }
   if(entry==="assessment"&&width===390){
    await page.getByRole("button",{name:/Start the Assessment/}).click();
    for(let i=0;i<23;i++){
     await page.getByText("Question "+(i+1)+" of 23").waitFor({state:"visible",timeout:12000});
     if(await page.locator(".ra-choices button").count()){
      await page.locator(".ra-choices button").first().click();
     }else if(await page.locator(".ra-numbers").count()){
      const checks=page.locator(".ra-unknown input");
      assert.equal(await checks.count(),4);
      for(let j=0;j<4;j++)await checks.nth(j).check();
      await page.getByRole("button",{name:/Next/}).click();
     }else{
      await page.getByRole("button",{name:/See My Results/}).click();
     }
    }
    await page.getByRole("heading",{name:"Your five business areas."}).waitFor({state:"visible",timeout:12000});
    assert.equal(await page.locator(".ra-bar").count(),5);
    await page.locator(".ra-gate input").nth(0).fill("Migration Tester");
    await page.locator(".ra-gate input").nth(1).fill("tester@example.invalid");
    await page.locator(".ra-gate input").nth(2).fill("Demo Business");
    const unlock=page.getByRole("button",{name:/Email & Unlock My Plan/});
    await unlock.waitFor({state:"visible",timeout:5000});
    await page.waitForTimeout(700);
    await unlock.click();
    await page.locator(".ra-plan").first().waitFor({state:"visible",timeout:12000});
    assert.equal(await page.locator(".ra-plan").count(),3);
    await page.getByRole("button",{name:/Book a Results Review/}).click();
    await page.locator(".ra-days button").first().click();
    await page.locator(".ra-times button").first().click();
    await page.waitForTimeout(500);
    await page.getByRole("button",{name:/Confirm Booking/}).click();
    await page.getByRole("heading",{name:"Your consultation is booked."}).waitFor();
    assert.equal(await page.locator('.ra-confirm a[href^="https://meet.google.com/"]').count(),1);
    // A copy of the result screen; all remote side-effects were mocked.
    await page.screenshot({path:output+"/assessment-complete-mobile.png",fullPage:true,animations:"disabled"});
   }
   await page.screenshot({path:output+"/"+entry.replaceAll("/","-")+"-"+width+".png",fullPage:entry!=="assessment",animations:"disabled"});
   const summary={entry,width,...information,axe:axe.violations.map(x=>({id:x.id,impact:x.impact}))};passed.push(summary);console.log("FULL REACT PASS",JSON.stringify(summary));
  }catch(e){failures.push(entry+" "+width+" "+String(e).slice(0,550));console.error("FULL REACT FAIL",failures.at(-1));}
  finally{await page.close()}
 }
 await context.close();
}
await browser.close();
fs.writeFileSync(output+"/results.json",JSON.stringify({passed,failures},null,2));
console.log("FULL REACT SUMMARY",JSON.stringify({passed:passed.length,failed:failures.length,failures}));
assert.equal(failures.length,0,"React full migration preview failed acceptance");
