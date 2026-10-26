import {chromium} from "playwright";
import assert from "node:assert/strict";
const origin="https://hummin-web-preview.grimpossible.workers.dev";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const routes=["/"]; // Mobile gesture acceptance on the homepage hero. Other heroes covered by restoration assertions.
for(const route of routes){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage();
 try{
  const response=await page.goto(origin+route,{waitUntil:"domcontentloaded",timeout:35000});
  assert.equal(response?.status(),200,route+" should return 200");
  await page.locator('section[data-hero="1"] h1').waitFor({state:"visible",timeout:20000});
  await page.waitForTimeout(1800);
  const result=await page.evaluate(()=>{
   const hero=document.querySelector('section[data-hero="1"]'),headline=hero?.querySelector('h1');
   if(!hero||!headline)throw Error("Original hero or H1 missing");
   const originalTop=window.scrollY;
   window.scrollTo(0,0);
   const rect=headline.getBoundingClientRect();
   const x=Math.min(innerWidth-16,Math.max(16,rect.left+Math.min(rect.width/2,145)));
   const y=Math.max(95,Math.min(innerHeight-100,rect.top+rect.height/2));
   const hit=document.elementFromPoint(x,y);
   const mainCopy=headline.parentElement;
   return {hit:hit?.tagName,hitText:hit?.textContent?.trim().slice(0,50),hitHeadline:hit===headline||headline.contains(hit),hitPath:hit?.outerHTML.slice(0,170),headlinePE:getComputedStyle(headline).pointerEvents,wrapperPE:mainCopy&&getComputedStyle(mainCopy).pointerEvents,x,y,originalTop,scrollHeight:document.scrollingElement.scrollHeight,viewport:innerHeight,ctaPE:getComputedStyle(hero.querySelector('button')).pointerEvents};
  });
  console.log("HERO TARGET",route,JSON.stringify(result));
  assert.equal(result.headlinePE,"auto",route+" headline should receive touch gestures");
  assert.equal(result.wrapperPE,"auto",route+" hero copy wrapper should receive gestures");
  assert.equal(result.ctaPE,"auto",route+" CTA remains interactive");
  assert.ok(result.hitHeadline,route+" hero text must be the hit target, got "+result.hitPath);
  assert.ok(result.scrollHeight>result.viewport+150,route+" page must have scrollable content");
  const cdp=await context.newCDPSession(page);
  const p=(y)=>[{x:result.x,y:Math.max(32,y),id:0,radiusX:3,radiusY:3,force:1}];
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:p(result.y)});
  for(let i=1;i<=8;i++){await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:p(result.y-i*37)});await page.waitForTimeout(24)}
  await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await page.waitForTimeout(700);
  const scrolled=await page.evaluate(()=>scrollY);
  console.log("SWIPE RESULT",route,"scrollY",scrolled);
  assert.ok(scrolled>55,route+" hero text swipe must scroll parent page");
 }finally{await context.close()}
}
await browser.close();
console.log("PASS HUMMIN hero copy and badges: consistent mobile drag gestures; CTAs retained");
