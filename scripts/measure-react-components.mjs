/** Read-only cross-route component geometry audit.
 * Runs independently of the 42 screenshot acceptance gate. Never modifies
 * production, dispatches forms, or depends on archived HTML files.
 * Usage: node scripts/measure-react-components.mjs [--paths=/,/insights]
 */
import fs from "node:fs";
import {chromium} from "playwright";
const production="https://hummin.org";
const preview="https://hummin-web-preview.grimpossible.workers.dev";
const allPaths=["/","/how-we-work","/applied-expertise","/engagements","/who-we-work-with","/about","/contact","/assessment","/insights","/insights/enquiries-30-day-fix","/insights/topic/marketing","/insights/author/team","/privacy","/terms"];
const arg=process.argv.find(v=>v.startsWith("--paths="));
const paths=arg?arg.slice(8).split(",").filter(x=>allPaths.includes(x)):allPaths;
const widths=[390,768,1440];
const families={
 header:"header, .hm-site-header",
 hero:".hr-hero, .hm-source-editorial-hero, .ra-source-hero, .hummin-legal-hero",
 content:"main",
 sections:"section",
 cards:".hr-stage-card, .hr-insights-featured, .hr-insights-source-list-card, .hr-comparison, .ra-source-related-card",
 assessment:".hr-assessment-band, .hr-assessment-float, .ra-root",
 newsletter:".ra-source-newsletter, .hr-insights-source-newsletter-wrap",
 footer:"footer, .hm-site-footer",
 landmarks:"h1, h2, h3, [role=heading]",
 buttons:"button, a[role=button]",
 images:"main img, article img, section img"
};
const outDir="artifacts/react-component-geometry";
fs.mkdirSync(outDir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
async function sample(context,base,path){
 const page=await context.newPage();
 await page.route("**/api/analytics/event",route=>route.fulfill({status:204,body:""}));
 try{
  const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:45000});
  if(response?.status()!==200)throw Error("HTTP "+response?.status());
  await page.evaluate(async()=>{
   await document.fonts.ready;
   for(const image of document.images)await image.decode().catch(()=>{});
   const scrolling=document.scrollingElement;
   const max=scrolling?.scrollHeight||0;
   for(let y=0;y<max;y+=Math.max(500,innerHeight*.8)){
    scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,25));
   }
   scrollTo(0,0);
  });
  await page.waitForTimeout(450);
  const frames=[];
  for(const frame of page.frames()){
   try{
    const result=await frame.evaluate((families)=>{
     const measure=el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      return {tag:el.tagName.toLowerCase(),className:typeof el.className==="string"?el.className.slice(0,160):"",text:(el.innerText||"").trim().slice(0,70),
       x:Math.round(r.left+scrollX),y:Math.round(r.top+scrollY),width:Math.round(r.width),height:Math.round(r.height),
       font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,padding:s.padding,display:s.display,
       background:s.backgroundColor,objectFit:s.objectFit||null};
     };
     const result={pathname:location.pathname,documentHeight:document.documentElement.scrollHeight,viewportWidth:innerWidth,families:{}};
     for(const [family,selector] of Object.entries(families)){
      result.families[family]=Array.from(document.querySelectorAll(selector))
       .filter(el=>el.getClientRects().length>0).slice(0,family==="sections"?30:family==="landmarks"?45:15).map(measure);
     }
     return result;
    },families);
    const owner=frame.parentFrame();
    let frameOffset={x:0,y:0};
    if(owner){try{const element=await frame.frameElement();const rect=await element.boundingBox();if(rect)frameOffset={x:rect.x,y:rect.y};}catch{}}
    frames.push({...result,frameOffset,embedded:!!owner});
   }catch(error){frames.push({error:String(error).slice(0,180)})}
  }
  return {frames};
 }finally{await page.close()}
}
function delta(prod,react){
 if(!prod||!react)return {status:"missing",production:!!prod,preview:!!react};
 const fields=["x","y","width","height"],changes={};
 for(const key of fields)changes[key]=react[key]-prod[key];
 return {status:"matched",changes,fontChanged:prod.font!==react.font,fontSizeChanged:prod.fontSize!==react.fontSize,production:prod,preview:react};
}
const report=[];
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,locale:"en-KE",timezoneId:"Africa/Nairobi"});
  for(const path of paths){
   const p=await sample(context,production,path),r=await sample(context,preview,path);
   // Choose the most component-rich frame, retaining all frames in raw output.
   const richness=f=>Object.values(f.families||{}).reduce((n,x)=>n+x.length,0);
   const embeddedReference=p.frames.some(frame=>frame.embedded);
   const pf=[...p.frames].sort((a,b)=>richness(b)-richness(a))[0]||{};
   const rf=[...r.frames].sort((a,b)=>richness(b)-richness(a))[0]||{};
   // Embeds can use entirely different CSS hooks, and iframe content may be
   // taller than its clipping viewport. Do not compare unrelated elements by
   // list index. Match headings by normalized visible text, in page coords.
   const headings=frames=>{
    const list=[];
    for(const frame of frames)for(const heading of frame.families?.landmarks||[]){
     const key=heading.text.toLowerCase().replace(/\s+/g," ").trim();
     if(!key)continue;
     list.push({...heading,key,y:heading.y+(frame.frameOffset?.y||0),x:heading.x+(frame.frameOffset?.x||0),frame:frame.pathname});
    }
    return list;
   };
   const sourceHeadings=headings(p.frames),reactHeadings=headings(r.frames);
   const used=new Set();
   const matchedHeadings=sourceHeadings.map(source=>{
    const index=reactHeadings.findIndex((candidate,i)=>!used.has(i)&&candidate.key===source.key);
    if(index<0)return {status:"missing",text:source.text,production:true,preview:false};
    used.add(index);
    return {text:source.text,...delta(source,reactHeadings[index])};
   });
   const groups={};
   for(const family of Object.keys(families)){
    if(family==="landmarks"){groups[family]=matchedHeadings;continue}
    const left=pf.families?.[family]||[],right=rf.families?.[family]||[];
    groups[family]=embeddedReference?[]:Array.from({length:Math.max(left.length,right.length)},(_,i)=>delta(left[i],right[i]));
   }
   const row={path,width,measurementStatus:embeddedReference?"frame-aware-headings":"standard",productionHeight:p.frames[0]?.documentHeight??null,previewHeight:r.frames[0]?.documentHeight??null,matchedHeadings:matchedHeadings.filter(x=>x.status==="matched").length,missingHeadings:matchedHeadings.filter(x=>x.status!=="matched").map(x=>x.text),groups,sourceFrames:p.frames,previewFrames:r.frames};
   report.push(row);
   console.log("COMPONENT GEOMETRY",path,width,"delta",row.productionHeight==null||row.previewHeight==null?"unknown":row.previewHeight-row.productionHeight);
  }
  await context.close();
 }
}finally{await browser.close()}
const flat=[];
for(const row of report)for(const [family,items] of Object.entries(row.groups))for(const item of items){
 if(item.status!=="matched")continue;
 flat.push({path:row.path,width:row.width,family,dy:item.changes.y,dh:item.changes.height,dw:item.changes.width,fontChanged:item.fontChanged,fontSizeChanged:item.fontSizeChanged});
}
const summary={screens:report.length,standardScreens:report.filter(r=>r.measurementStatus==="standard").length,frameAwareScreens:report.filter(r=>r.measurementStatus==="frame-aware-headings").length,unmatchedHeadings:report.flatMap(r=>r.missingHeadings.map(text=>({path:r.path,width:r.width,text}))),measurementCount:flat.length,families:Object.fromEntries(Object.keys(families).map(f=>{
 const rows=flat.filter(r=>r.family===f);
 return [f,{instances:rows.length,largeVerticalDifferences:rows.filter(r=>Math.abs(r.dy)>12||Math.abs(r.dh)>12).length,fontDifferences:rows.filter(r=>r.fontChanged||r.fontSizeChanged).length}];
}))};
fs.writeFileSync(outDir+"/measurements.json",JSON.stringify({production,preview,report},null,2));
fs.writeFileSync(outDir+"/summary.json",JSON.stringify(summary,null,2));
fs.writeFileSync(outDir+"/triage.json",JSON.stringify(flat.filter(r=>Math.abs(r.dy)>12||Math.abs(r.dh)>12||r.fontChanged||r.fontSizeChanged).sort((a,b)=>Math.max(Math.abs(b.dy),Math.abs(b.dh))-Math.max(Math.abs(a.dy),Math.abs(a.dh))),null,2));
console.log("COMPONENT GEOMETRY SUMMARY",JSON.stringify(summary));
