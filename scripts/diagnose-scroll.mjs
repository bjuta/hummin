import {chromium} from "playwright";
const base="https://hummin.org";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const routes=["/","/how-we-work","/assessment","/insights","/contact","/admin/login","/privacy"];
for(const path of routes){
 const context=await browser.newContext({viewport:{width:1440,height:900},locale:"en-KE"});
 const page=await context.newPage();
 try{
  const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:35000});
  await page.waitForTimeout(path==="/assessment"||path==="/insights"?6000:3500);
  const dimensions=await page.evaluate(()=>({total:document.scrollingElement?.scrollHeight,view:innerHeight,scrollTop:scrollY,scroller:document.scrollingElement?.tagName,bodyCss:getComputedStyle(document.body).overflowY,htmlCss:getComputedStyle(document.documentElement).overflowY}));
  const points=[[0.5,0.4],[0.5,0.7],[0.2,0.55],[0.8,0.55]];
  for(const [x,y] of points){
   const xPx=Math.round(x*1440),yPx=Math.round(y*900);
   await page.evaluate(()=>{const d=document.scrollingElement;window.scrollTo(0,Math.round((d.scrollHeight-innerHeight)*0.33))});
   await page.waitForTimeout(300);
   const before=await page.evaluate(({x,y})=>{const el=document.elementFromPoint(x,y);return {y:window.scrollY,target:el?.outerHTML.slice(0,260),tag:el?.tagName,frame:el?.closest("iframe")?.id}}, {x:xPx,y:yPx});
   const frames=await Promise.all(page.frames().filter(f=>f!==page.mainFrame()).map(async f=>({url:f.url(),y:await f.evaluate(()=>scrollY).catch(()=>null),max:await f.evaluate(()=>document.scrollingElement?.scrollHeight-innerHeight).catch(()=>null)})));
   await page.mouse.move(xPx,yPx);await page.mouse.wheel(0,360);await page.waitForTimeout(550);
   const after=await page.evaluate(()=>({y:window.scrollY}));
   const afterFrames=await Promise.all(page.frames().filter(f=>f!==page.mainFrame()).map(async f=>({url:f.url(),y:await f.evaluate(()=>scrollY).catch(()=>null)})));
   console.log("SCROLL",JSON.stringify({path,http:response.status(),dimensions,position:[xPx,yPx],before,after,delta:after.y-before.y,frames,afterFrames}));
  }
 }catch(e){console.log("ERROR",path,String(e).slice(0,700))}
 finally{await context.close()}
}
await browser.close();
