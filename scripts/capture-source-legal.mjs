/** Read-only extraction of the live, owner-approved HUMMIN legal DOM.
 * This is an evidence artifact, not a source replacement or React approximation.
 * No forms are submitted, no storage is written to, and no production changes.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";

const pages=[["privacy","Privacy notice."],["terms","Terms of use."]];
const widths=[390,768,1440];
const output="artifacts/source-legal-reference";
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const captures=[];
try {
 for(const width of widths){
  const context=await browser.newContext({
   viewport:{width,height:width===390?844:900},deviceScaleFactor:1,
   isMobile:width===390,hasTouch:width===390,reducedMotion:"reduce",
   locale:"en-KE",timezoneId:"Africa/Nairobi"
  });
  for(const [route,heading] of pages){
   const page=await context.newPage();
   await page.route("**/api/analytics/event",r=>r.fulfill({status:204,body:""}));
   try{
    const url="https://hummin.org/"+route;
    const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
    assert.equal(response?.status(),200,url+" HTTP response");
    await page.waitForTimeout(1000);
    await page.evaluate(async()=>{
     await document.fonts.ready;
     await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
     const pause=ms=>new Promise(r=>setTimeout(r,ms));
     for(let y=0;y<document.documentElement.scrollHeight;y+=Math.max(450,innerHeight*.7)){
      window.scrollTo(0,y);await pause(40);
     }
     window.scrollTo(0,0);await pause(200);
    });
    const captured=await page.evaluate(()=>{
     const main=document.querySelector("main");
     const root=main||document.body;
     const cssKeys=["display","position","width","maxWidth","minWidth","height",
      "minHeight","boxSizing","margin","padding","gap","gridTemplateColumns",
      "flexDirection","alignItems","justifyContent","fontFamily","fontSize",
      "fontWeight","lineHeight","letterSpacing","color","background",
      "backgroundColor","border","borderRadius","textAlign","textTransform"];
     const styles=[...root.querySelectorAll("*")].map((el,i)=>{
      const st=getComputedStyle(el);
      return {i,tag:el.tagName.toLowerCase(),className:typeof el.className==="string"?el.className:"",
       id:el.id||"",text:(el.children.length?null:(el.textContent||"").trim().slice(0,180)),
       rect:(()=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(n=>Math.round(n*10)/10)})(),
       computed:Object.fromEntries(cssKeys.map(k=>[k,st[k]]))};
     });
     return {title:document.title,headline:[...document.querySelectorAll("h1")].map(h=>h.textContent.trim()),
      url:location.pathname,mainHTML:main?.outerHTML||null,bodyHTML:document.body.outerHTML,
      headStyles:[...document.querySelectorAll("style")].map(s=>s.textContent||""),
      stylesheetLinks:[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.getAttribute("href")),
      pageHeight:document.documentElement.scrollHeight,
      pageWidth:document.documentElement.scrollWidth,
      fonts:document.fonts.status,
      styles};
    });
    assert.ok(captured.headline.some(h=>h.includes(heading)),route+" did not render the expected legal source");
    assert.ok(captured.mainHTML?.length>10000,route+" original legal DOM missing");
    const prefix=output+"/"+route+"-"+width;
    fs.writeFileSync(prefix+".json",JSON.stringify(captured,null,2));
    fs.writeFileSync(prefix+".html",captured.mainHTML);
    await page.screenshot({path:prefix+".png",fullPage:true,animations:"disabled"});
    captures.push({route,width,headings:captured.headline,elements:captured.styles.length,height:captured.pageHeight});
    console.log("LEGAL SOURCE EXTRACTED",JSON.stringify(captures.at(-1)));
   } finally {await page.close()}
  }
  await context.close();
 }
} finally {await browser.close()}
fs.writeFileSync(output+"/summary.json",JSON.stringify({expected:6,captures},null,2));
assert.equal(captures.length,6,"All six original legal references are required");
console.log("LEGAL SOURCE EXTRACTION COMPLETE",captures.length+"/6");
