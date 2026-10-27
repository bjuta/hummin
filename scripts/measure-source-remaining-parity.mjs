/** Read-only benchmark of the owner-approved marketing pages vs new source-native
 * staging routes. Preserves strict 8% pixel / 12px height acceptance criteria.
 * This benchmark is diagnostic: 21 cases are not the complete 42-case release.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import pixelmatch from "pixelmatch";
import {PNG} from "pngjs";
const origin="https://hummin.org";
const preview="https://hummin-web-preview.grimpossible.workers.dev";
const routes=[
 ["/assessment","assessment"],["/insights","insights"],
 ["/insights/enquiries-30-day-fix","article"],
 ["/insights/topic/marketing","topic"],
 ["/insights/author/team","author"]
];
const widths=[390,768,1440],dir="artifacts/source-remaining-parity";
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const checks=[];
function padded(src,width,height){
 const result=new PNG({width,height});
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;
  result.data[i]=244;result.data[i+1]=245;result.data[i+2]=241;result.data[i+3]=255;
 }
 PNG.bitblt(src,result,0,0,src.width,Math.min(height,src.height),0,0);
 return result;
}
async function capture(ctx,url,file){
 const page=await ctx.newPage();
 await page.route("**/api/analytics/event",route=>route.fulfill({status:204,body:""}));
 try{
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(),200,url+" HTTP status");
  await page.waitForTimeout(500);
  for(const frame of page.frames()){
   try{
    await frame.evaluate(async()=>{
     const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
     await document.fonts.ready;
     const root=document.scrollingElement||document.documentElement;
     const height=root.scrollHeight,step=Math.max(450,innerHeight*.7);
     for(let i=0;i<height;i+=step){scrollTo(0,i);await pause(60)}
     for(const el of [...document.querySelectorAll("[data-rise]")]){
      if(el.getClientRects().length>0&&getComputedStyle(el).opacity==="0"){
       el.scrollIntoView({block:"center",behavior:"instant"});await pause(65);
      }
     }
     scrollTo(0,0);
     await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
     await pause(300);
    });
   }catch{}
  }
  await page.waitForTimeout(500);
  const meta=await page.evaluate(()=>({
   height:document.documentElement.scrollHeight,
   width:document.documentElement.scrollWidth,
   viewport:document.documentElement.clientWidth,
   h1:[...document.querySelectorAll("h1")].filter(el=>el.getClientRects().length).map(el=>el.textContent?.trim()).slice(0,2),
   images:[...document.images].filter(el=>el.getClientRects().length).map(el=>({src:el.getAttribute("src"),loaded:el.naturalWidth>0})).slice(0,20),
   fonts:document.fonts.status,
   runtimeMarkers:document.body.innerText?.includes("{{ ")||false,
   hiddenReveals:[...document.querySelectorAll("[data-rise]")].filter(el=>el.getClientRects().length>0&&(getComputedStyle(el).opacity==="0"||getComputedStyle(el).visibility==="hidden")).length
  }));
  const buf=await page.screenshot({path:file,fullPage:true,animations:"disabled",timeout:40000});
  return {png:PNG.sync.read(buf),meta};
 }finally{await page.close()}
}
try{
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,isMobile:width===390,hasTouch:width===390,reducedMotion:"reduce",locale:"en-KE",timezoneId:"Africa/Nairobi"});
  for(const [path,slug] of routes){
   const id=slug+"-"+width;
   try{
    const original=await capture(ctx,origin+path,dir+"/"+id+"-original.png");
    const candidate=await capture(ctx,preview+"/__source-review/"+slug,dir+"/"+id+"-candidate.png");
    const height=Math.max(original.png.height,candidate.png.height),p=padded(original.png,width,height),c=padded(candidate.png,width,height);
    const diff=new PNG({width,height});
    const changed=pixelmatch(p.data,c.data,diff.data,width,height,{threshold:.12,includeAA:false});
    fs.writeFileSync(dir+"/"+id+"-diff.png",PNG.sync.write(diff));
    const mismatch=changed/(width*height),heightDelta=Math.abs(original.png.height-candidate.png.height);
    const pass=original.meta.hiddenReveals===0&&candidate.meta.hiddenReveals===0&&mismatch<=.08&&heightDelta<=12&&candidate.meta.width-candidate.meta.viewport<=3&&!candidate.meta.runtimeMarkers;
    const result={route:path,slug,width,pass,mismatch:Number(mismatch.toFixed(5)),heightDelta,original:original.meta,candidate:candidate.meta};
    checks.push(result);
    console.log("SOURCE REMAINING PIXEL CHECK",JSON.stringify({slug,width,pass,mismatch:result.mismatch,heightDelta,loadedImages:candidate.meta.images.filter(i=>i.loaded).length}));
   }catch(error){checks.push({route:path,width,pass:false,error:String(error)});console.error("SOURCE REMAINING CAPTURE ERROR",path,width,String(error))}
  }
  await ctx.close();
 }
}finally{await browser.close()}
fs.writeFileSync(dir+"/summary.json",JSON.stringify({original:origin,candidate:preview,criteria:{pixelMismatch:.08,heightDelta:12},checks},null,2));
console.log("SOURCE REMAINING SUMMARY",checks.filter(r=>r.pass).length+"/"+checks.length,"passed strict visual thresholds");
