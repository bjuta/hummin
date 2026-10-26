import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
const origin=(process.env.HUMMIN_URL||"https://hummin-web-preview.grimpossible.workers.dev").replace(/\/$/,"");
if(!/^https:\/\/(hummin\.org|hummin-web-preview\.grimpossible\.workers\.dev)$/.test(origin))throw Error("Unexpected audit origin");
fs.mkdirSync("artifacts/react-header",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390});
 const basePage=await context.newPage();
 await basePage.goto(origin+"/",{waitUntil:"domcontentloaded",timeout:30000});
 await basePage.waitForSelector("header button[aria-label]",{timeout:20000});
 await basePage.waitForTimeout(2000);
 const original=await basePage.evaluate(()=>{
  const h=document.querySelector("header");
  const b=h?.querySelector("button[aria-controls='site-nav']");
  const c=[...h?.querySelectorAll("button")||[]].find(x=>x.textContent?.includes("Get in Touch"));
  return {height:h?.getBoundingClientRect().height,menuSize:b?.getBoundingClientRect().width,buttonHeight:c?.getBoundingClientRect().height};
 });
 console.log("ORIGINAL",width,JSON.stringify(original));
 assert.ok(original.height>55&&original.height<95,"Original header expected");
 for(const path of ["/privacy","/terms"]){
  const page=await context.newPage();
  const response=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:30000});
  assert.equal(response?.status(),200);
  await page.locator(".hm-site-header").waitFor({state:"visible",timeout:10000});
  await page.locator(".hm-site-brand img").evaluate(img=>img.decode());
  const info=await page.evaluate(()=>{
   const h=document.querySelector(".hm-site-header"),b=document.querySelector(".hm-site-menu-toggle"),cta=document.querySelector(".hm-site-cta");
   const logo=document.querySelector(".hm-site-brand img");
   return {height:h.getBoundingClientRect().height,menuSize:b.getBoundingClientRect().width,ctaHeight:cta.getBoundingClientRect().height,logoLoaded:logo.complete&&logo.naturalWidth>0,scrollRoot:document.scrollingElement?.tagName,canScroll:document.scrollingElement.scrollHeight>innerHeight+400,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,headerPosition:getComputedStyle(h).position,bodyOverflow:getComputedStyle(document.body).overflowY};
  });
  console.log("REACT LEGAL",path,width,JSON.stringify(info));
  assert.ok(Math.abs(info.height-original.height)<5,"React header must match original header height");
  assert.equal(info.menuSize,44);
  assert.equal(info.ctaHeight,44);
  assert.equal(info.logoLoaded,true);
  assert.equal(info.scrollRoot,"HTML");
  assert.equal(info.canScroll,true);
  assert.ok(info.overflow<=3);
  assert.equal(info.headerPosition,"sticky");
  assert.notEqual(info.bodyOverflow,"hidden");
  const menu=page.locator(".hm-site-menu-toggle");
  await menu.click();
  assert.equal(await menu.getAttribute("aria-expanded"),"true");
  assert.equal(await page.locator(".hm-site-drawer").isVisible(),true);
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"),"false");
  await page.screenshot({path:"artifacts/react-header/"+width+"-"+path.slice(1)+".png",animations:"disabled"});
  if(width===390){
   await page.evaluate(()=>scrollTo(0,0));
   await page.locator(".hummin-legal-hero h1").scrollIntoViewIfNeeded();
   const heading=await page.locator(".hummin-legal-hero h1").boundingBox();
   const x=Math.round(Math.min(250,heading.x+heading.width/2)),y=Math.round(Math.min(550,Math.max(200,heading.y+heading.height/2)));
   const cdp=await context.newCDPSession(page);
   const point=yy=>[{x,y:Math.max(22,yy),id:0,radiusX:3,radiusY:3,force:1}];
   await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:point(y)});
   for(let i=1;i<=8;i++){await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:point(y-24*i)});await page.waitForTimeout(25)}
   await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
   await page.waitForTimeout(450);
   const top=await page.evaluate(()=>scrollY);
   console.log("NATIVE MOBILE SWIPE",path,top);
   assert.ok(top>35,"Mobile legal page should scroll normally from headline");
  }
  await page.close();
 }
 await basePage.close();await context.close();
}
await browser.close();
console.log("PASS: React Privacy and Terms share original HUMMIN header geometry, navigation and native mobile scrolling.");
