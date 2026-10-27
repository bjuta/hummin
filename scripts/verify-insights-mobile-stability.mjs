/** Repeatability audit of the original Insights mobile iframe sizing contract.
 * Runs without transactions and never modifies layouts or screenshot pixels.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import {chromium} from "playwright";
const out="artifacts/insights-mobile-stability";fs.mkdirSync(out,{recursive:true});
const urlA="https://hummin.org/insights";
const urlB="https://hummin-web-preview.grimpossible.workers.dev/__source-review/insights";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const iterations=[];
async function read(page,url,type,iteration){
 await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
 const res=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
 assert.equal(res?.status(),200,url+" must be reachable");
 if(type==="approved"){
  await page.waitForFunction(()=>{
   const frame=document.getElementById("hummin-insights-frame");
   return frame?.dataset.hmLoaded==="true"&&getComputedStyle(frame).visibility!=="hidden";
  },null,{timeout:30000});
 }
 await page.waitForTimeout(500);
 for(const frame of page.frames()){
  await frame.evaluate(async()=>{
   await document.fonts.ready;
   const step=Math.max(450,innerHeight*.7);
   for(let y=0;y<document.documentElement.scrollHeight;y+=step){
    scrollTo(0,y);await new Promise(r=>setTimeout(r,55));
   }
   scrollTo(0,0);
   await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
  }).catch(()=>{});
 }
 const info=await page.evaluate(async()=>{
  const frame=document.getElementById("hummin-insights-frame")||
    document.querySelector(".hm-frame-shell");
  if(!frame)throw Error("Insights frame absent");
  let prior="",stable=0;
  for(let i=0;i<45&&stable<6;i++){
   await new Promise(r=>setTimeout(r,160));
   const bounds=frame.getBoundingClientRect();
   const mark=[Math.round(bounds.height*10)/10,
      document.documentElement.scrollHeight,document.fonts.status].join(":");
   stable=prior===mark?stable+1:0;prior=mark;
  }
  if(stable<6)throw Error("Source/native viewport not stable: "+prior);
  return {frameHeight:Math.round(frame.getBoundingClientRect().height),
   pageHeight:document.documentElement.scrollHeight,
   overflowX:Math.max(0,document.documentElement.scrollWidth-innerWidth),
   fonts:document.fonts.status,stableFrames:stable};
 });
 await page.screenshot({path:out+"/"+iteration+"-"+type+".png",fullPage:true,animations:"disabled"});
 return info;
}
try{
 for(let i=0;i<3;i++){
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,
   hasTouch:true,deviceScaleFactor:1,reducedMotion:"reduce",locale:"en-KE",
   timezoneId:"Africa/Nairobi"});
  const a=await ctx.newPage(),b=await ctx.newPage();
  try{
   const approved=await read(a,urlA,"approved",i+1);
   const native=await read(b,urlB,"native",i+1);
   const frameDelta=Math.abs(approved.frameHeight-native.frameHeight);
   const pageDelta=Math.abs(approved.pageHeight-native.pageHeight);
   const accepted=frameDelta<=12&&pageDelta<=12&&native.overflowX<=3&&
     native.fonts==="loaded"&&approved.fonts==="loaded";
   const result={iteration:i+1,approved,native,frameDelta,pageDelta,accepted};
   console.log("MOBILE INSIGHTS FRAME STABILITY",JSON.stringify(result));
   iterations.push(result);
  }finally{await ctx.close();}
 }
}finally{
 await browser.close();
 fs.writeFileSync(out+"/summary.json",JSON.stringify(iterations,null,2));
}
assert.equal(iterations.length,3);
assert.ok(iterations.every(x=>x.accepted),"Mobile frame unstable or out of approved height tolerance");
console.log("MOBILE INSIGHTS STABILITY 3/3 PASS");
