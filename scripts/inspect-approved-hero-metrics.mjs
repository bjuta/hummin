/** Read-only source-vs-native computed typography and document geometry. */
import fs from "node:fs";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const out=[];
const sources=[
 ["production","https://hummin.org"],
 ["source-native","https://hummin-web-preview.grimpossible.workers.dev"]
];
for(const width of [390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,locale:"en-KE",timezoneId:"Africa/Nairobi"});
 for(const [label,base] of sources)for(const [canonical,page] of [["/about","about"],["/how-we-work","how"],["/","home"]]){
  const url=base+(label==="production"?canonical:"/__source-preview/"+page);
  const tab=await context.newPage();
  try{
   await tab.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
   await tab.evaluate(()=>document.fonts.ready);
   await tab.waitForTimeout(350);
   const result=await tab.evaluate(()=>{
    const measure=sel=>{
     const el=document.querySelector(sel);
     if(!el)return null;
     const r=el.getBoundingClientRect(),s=getComputedStyle(el);
     return {text:(el.textContent||"").trim().slice(0,110),rect:{x:r.x,y:r.y,width:r.width,height:r.height},
      fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,fontStyle:s.fontStyle,
      lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,maxWidth:s.maxWidth,display:s.display,
      padding:s.padding,margin:s.margin,overflow:s.overflow,background:s.backgroundColor};
    };
    const h1=measure("h1");
    const probe=document.createElement("span");
    probe.style.cssText="position:absolute;visibility:hidden;white-space:nowrap;width:13ch";
    const node=document.querySelector("h1");
    if(node)probe.style.font=getComputedStyle(node).font;
    document.body.appendChild(probe);
    const chWidth=probe.getBoundingClientRect().width;probe.remove();
    const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
    if(node)ctx.font=getComputedStyle(node).font;
    const textWidth=ctx.measureText(node?.textContent||"").width;
    const fonts=[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status,style:f.style})).filter(x=>/Figtree|Newsreader/i.test(x.family));
    return {h1,h1Parent:measure("h1")?measure("h1"):null,main:measure("main"),hero:measure("main section"),footer:measure("footer"),
      documentHeight:document.documentElement.scrollHeight,viewport:innerWidth,chWidth,textWidth,fonts};
   });
   const row={source:label,page,width,...result};
   out.push(row);
   console.log("FONT GEOMETRY",JSON.stringify({source:label,page,width,h1:result.h1,zeroWidth13ch:result.chWidth,titleWidth:result.textWidth,documentHeight:result.documentHeight,loadedFonts:result.fonts.filter(x=>x.status==="loaded")}));
  }catch(e){console.error("FONT ERROR",label,page,width,String(e))}
  finally{await tab.close()}
 }
 await context.close();
}
await browser.close();
fs.mkdirSync("artifacts/source-hero-fonts",{recursive:true});
fs.writeFileSync("artifacts/source-hero-fonts/metrics.json",JSON.stringify(out,null,2));
