/** Read-only original-vs-native Insights boundary diagnostics.
 * Measure source iframe and candidate native shells, orange CTA, footer
 * at three exact acceptance widths; do not submit, mutate or approximate.
 */
import fs from "node:fs";
import assert from "node:assert/strict";
import {chromium} from "playwright";
const preview="https://hummin-web-preview.grimpossible.workers.dev";
const cases=[["insights","/insights"],["article","/insights/enquiries-30-day-fix"],["topic","/insights/topic/marketing"]];
const widths=[390,768,1440],out="artifacts/source-insights-geometry";
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const rows=[];
async function inspect(context,url){
 const page=await context.newPage();
 await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
 try{
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(),200,url+" status");
  await page.waitForTimeout(700);
  for(const frame of page.frames()){
   await frame.evaluate(async()=>{
    const pause=ms=>new Promise(r=>setTimeout(r,ms));
    await document.fonts.ready;
    for(let y=0;y<document.documentElement.scrollHeight;y+=Math.max(450,innerHeight*.7)){
     scrollTo(0,y);await pause(50);
    }
    scrollTo(0,0);
    await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
   }).catch(()=>{});
  }
  await page.waitForTimeout(450);
  const data=await page.evaluate(()=>{
   const fmt=el=>{
    if(!el)return null;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {tag:el.tagName,class:typeof el.className==="string"?el.className:"",
     id:el.id||"",text:(el.innerText||"").trim().slice(0,100),
     top:Math.round(r.top+window.scrollY),bottom:Math.round(r.bottom+window.scrollY),
     height:Math.round(r.height),marginTop:s.marginTop,marginBottom:s.marginBottom,
     paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,background:s.backgroundColor,
     display:s.display,overflow:s.overflow};
   };
   const all=[...document.querySelectorAll("body *")];
   const rust=all.filter(el=>{
    const s=getComputedStyle(el),r=el.getBoundingClientRect();
    return s.backgroundColor==="rgb(181, 83, 44)"&&r.width>=innerWidth*.7&&r.height>160;
   }).map(fmt);
   const frames=[...document.querySelectorAll("iframe")].map(fmt);
   const shells=[...document.querySelectorAll(".hm-frame-shell")].map(el=>({
    self:fmt(el),parent:fmt(el.parentElement),next:fmt(el.parentElement?.nextElementSibling),
    grandparent:fmt(el.parentElement?.parentElement)
   }));
   const fontDoc=document.getElementById("hummin-insights-frame")?.contentDocument||document;
   const heroText=[...fontDoc.querySelectorAll("p")].find(p=>p.textContent?.startsWith("Practical guides, opinion"));
   const heroTypography=heroText?(()=>{
     const r=heroText.getBoundingClientRect(),s=fontDoc.defaultView.getComputedStyle(heroText);
     return {x:r.x,y:r.y,width:r.width,height:r.height,
      fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,
      lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,maxWidth:s.maxWidth,
      text:heroText.textContent};
   })():null;
   const fontResources=fontDoc.defaultView.performance.getEntriesByType("resource")
    .map(item=>item.name).filter(url=>/woff2|fonts.googleapis|fonts.gstatic/.test(url)).slice(0,35);
   const fontFaces=[...fontDoc.fonts].filter(font=>/Figtree|Newsreader/.test(font.family))
    .map(font=>({family:font.family,weight:font.weight,status:font.status})).slice(0,14);
   return {height:document.documentElement.scrollHeight,viewport:innerWidth,
    footer:fmt(document.querySelector("footer")),rust,frames,shells,heroTypography,fontResources,fontFaces,
    h1:[...document.querySelectorAll("h1")].map(e=>e.innerText)};
  });
  return data;
 }finally{await page.close()}
}
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},
   deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390,reducedMotion:"reduce",
   locale:"en-KE",timezoneId:"Africa/Nairobi"});
  for(const [slug,path] of cases){
   const a=await inspect(context,"https://hummin.org"+path);
   const b=await inspect(context,preview+"/__source-review/"+slug);
   const row={slug,width,source:a,candidate:b};
   rows.push(row);console.log("INSIGHTS GEOMETRY",JSON.stringify(row));
  }
  await context.close();
 }
}finally{await browser.close()}
fs.writeFileSync(out+"/summary.json",JSON.stringify(rows,null,2));
assert.equal(rows.length,9,"All Insights geometry pairs are required");
