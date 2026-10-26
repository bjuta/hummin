/** Read-only reference captures of the approved live HUMMIN HTML design.
 * No form submissions, no mutations, no user data, no legacy CSS edits.
 */
import {chromium} from "playwright";
import fs from "node:fs";
const base="https://hummin.org";
const paths=["/","/how-we-work","/applied-expertise","/engagements","/who-we-work-with","/about","/contact","/assessment","/insights"];
fs.mkdirSync("artifacts/original-parity",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1,locale:"en-KE"});
 for(const path of paths){
  const page=await context.newPage();
  try{
   const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:32000});
   await page.waitForTimeout(2800);
   const body=await page.evaluate(()=>({title:document.title,height:document.scrollingElement.scrollHeight,h1:document.querySelector("h1")?.innerText.slice(0,90),hasOriginal:!!document.querySelector("[data-dc-tpl]"),iframe:document.querySelectorAll("iframe").length}));
   console.log("REFERENCE",path,width,response.status(),JSON.stringify(body));
   await page.screenshot({path:"artifacts/original-parity/"+width+"-"+(path.replaceAll("/","_")||"root")+".png",animations:"disabled",fullPage:false});
  }catch(e){console.log("REFERENCE ERROR",path,width,String(e).slice(0,240))}
  finally{await page.close()}
 }
 await context.close();
}
await browser.close();
