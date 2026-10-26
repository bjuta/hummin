/** Visual source-of-truth audit. This is intentionally NOT a generic React smoke test.
 * Compare the approved live source at hummin.org with the migration Preview.
 * Read-only: no booking, enquiry, assessment, newsletter, or Admin submission.
 * Release must be blocked until every required comparison meets parity.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import pixelmatch from "pixelmatch";
import {PNG} from "pngjs";

const production="https://hummin.org";
const react="https://hummin-web-preview.grimpossible.workers.dev";
const paths=[
 "/", "/how-we-work", "/applied-expertise", "/engagements",
 "/who-we-work-with", "/about", "/contact", "/assessment", "/insights",
 "/insights/enquiries-30-day-fix", "/insights/topic/marketing",
 "/insights/author/team", "/privacy", "/terms"
];
const widths=[390,768,1440];
const maxMismatch=.08; // Includes shared art, colour, type, spacing and page height.
const maxHeightDifference=12;
const dir="artifacts/react-visual-parity";
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const report=[];
function pad(src,width,height){
 const target=new PNG({width,height});
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;target.data[i]=244;target.data[i+1]=245;target.data[i+2]=241;target.data[i+3]=255;
 }
 PNG.bitblt(src,target,0,0,src.width,Math.min(src.height,height),0,0);
 return target;
}
async function capture(context,origin,path){
 const page=await context.newPage();
 await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
 try{
  const response=await page.goto(origin+path,{waitUntil:"domcontentloaded",timeout:45000});
  assert.equal(response?.status(),200,origin+path+" HTTP status");
  // Production Insights may render in an internal design iframe. Compare the
  // composed page pixels, not only top-document heading selectors.
  if(path==="/")await page.locator("h1:visible").first().waitFor({state:"visible",timeout:20000});
  // Original HUMMIN pages can host the owner's design inside nested frames.
  // Warm the *actual* scroll containers in all frames; top-window scrolling
  // alone leaves source reveal sections blank and produces false pixel failures.
  async function settleFrame(frame){
    try{return await frame.evaluate(async()=>{
      const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
      const root=document.scrollingElement||document.documentElement;
      const scrollY=window.scrollY;
      const smooth=document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior="auto";
      let maxHeight=Math.max(root.scrollHeight,document.body?.scrollHeight||0);
      const step=Math.max(400,Math.floor(window.innerHeight*.78));
      // Two short traversals let IntersectionObserver and lazy images settle.
      for(let pass=0;pass<2;pass++){
        for(let y=0;y<maxHeight;y+=step){window.scrollTo(0,y);await sleep(55)}
        window.scrollTo(0,maxHeight);await sleep(320);
        maxHeight=Math.max(root.scrollHeight,document.body?.scrollHeight||0);
      }
      // Source app reveals individual sub-sections via IntersectionObserver
      // as they enter the *frame* viewport. Traverse these exact source nodes
      // once more instead of making blank sections appear via CSS overrides.
      const unrevealed=Array.from(document.querySelectorAll('[data-rise]')).filter(el=>{
        const st=getComputedStyle(el);
        return el.getClientRects().length>0&&(st.opacity==="0"||st.visibility==="hidden");
      }).slice(0,36);
      for(const el of unrevealed){el.scrollIntoView({block:"center",behavior:"instant"});await sleep(80)}
      await sleep(400);
      window.scrollTo(0,scrollY);
      document.documentElement.style.scrollBehavior=smooth;
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{})));
      const reveals=Array.from(document.querySelectorAll('[data-rise]'));
      const hiddenReveals=reveals.filter(el=>{
        const style=getComputedStyle(el);
        return style.opacity==="0"||style.visibility==="hidden";
      }).length;
      return {frameUrl:location.pathname,reveals:reveals.length,hiddenReveals,scrollHeight:maxHeight};
    })}catch(e){return {error:String(e).slice(0,250)}}
  }
  const frameReport=[];
  for(const frame of page.frames()){
    frameReport.push(await settleFrame(frame));
  }
  await page.waitForTimeout(700);
  const meta=await page.evaluate(()=>({h1:Array.from(document.querySelectorAll("h1")).find(h=>h.getClientRects().length>0)?.innerText?.trim()||"",height:document.documentElement.scrollHeight,fonts:document.fonts.status,scrollOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
  meta.frameReport=frameReport;
  const png=PNG.sync.read(await page.screenshot({fullPage:true,animations:"disabled",type:"png"}));
  return {png,meta};
 }finally{await page.close();}
}
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,locale:"en-KE",timezoneId:"Africa/Nairobi"});
  for(const path of paths){
   const id=(path==="/"?"home":path.replaceAll("/","-")||"home")+"-"+width;
   try{
    const p=await capture(context,production,path),r=await capture(context,react,path);
    fs.writeFileSync(dir+"/"+id+"-production.png",PNG.sync.write(p.png));
    fs.writeFileSync(dir+"/"+id+"-react.png",PNG.sync.write(r.png));
    assert.equal(p.png.width,r.png.width,"Viewport width mismatch");
    const height=Math.max(p.png.height,r.png.height),prod=pad(p.png,width,height),prev=pad(r.png,width,height),diff=new PNG({width,height});
    const count=pixelmatch(prod.data,prev.data,diff.data,width,height,{threshold:.12,includeAA:false});
    fs.writeFileSync(dir+"/"+id+"-diff.png",PNG.sync.write(diff));
    const mismatch=count/(width*height),heightDelta=Math.abs(p.png.height-r.png.height);
    const incompleteReference=p.meta.frameReport.some(f=>f.hiddenReveals>0);
    const passed=!incompleteReference&&mismatch<=maxMismatch&&heightDelta<=maxHeightDifference&&(path!=="/"||p.meta.h1===r.meta.h1)&&p.meta.scrollOverflow<=3&&r.meta.scrollOverflow<=3;
    const item={path,width,passed,referenceIncomplete:incompleteReference,production:p.meta,react:r.meta,heightDelta,mismatchRate:Number(mismatch.toFixed(5)),allowedMismatchRate:maxMismatch,allowedHeightDelta:maxHeightDifference};
    report.push(item);console.log(passed?"SOURCE PARITY PASS":"SOURCE PARITY FAIL",JSON.stringify(item));
   }catch(error){const item={path,width,passed:false,error:String(error)};report.push(item);console.error("SOURCE PARITY ERROR",JSON.stringify(item));}
  }
  await context.close();
 }
}finally{await browser.close();}
fs.writeFileSync(dir+"/summary.json",JSON.stringify({production,react,checks:report},null,2));
const failures=report.filter(p=>!p.passed);
console.log("VISUAL FIDELITY SUMMARY",report.length,"checks,",failures.length,"failures");
assert.equal(failures.length,0,"React release lacks production design fidelity. Compare attached full-page screenshots and diff images; do not cut over.");
