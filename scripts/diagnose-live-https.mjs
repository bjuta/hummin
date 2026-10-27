import {chromium} from "playwright";
const hosts=["http://hummin.org/?utm_source=chatgpt.com","https://hummin.org/?utm_source=chatgpt.com","http://www.hummin.org/","https://www.hummin.org/"];
for(const url of hosts){
 for(const method of ["GET"]){
  try{
   const r=await fetch(url,{method,redirect:"manual",signal:AbortSignal.timeout(14000)});
   console.log("FETCH",JSON.stringify({url,method,status:r.status,redirect:r.headers.get("location"),strictTransport:r.headers.get("strict-transport-security"),cfRay:r.headers.get("cf-ray"),server:r.headers.get("server"),contentType:r.headers.get("content-type")}));
  }catch(e){console.log("FETCH ERROR",url,String(e));}
 }
}
const b=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const url of hosts.slice(0,2)){
 const context=await b.newContext({ignoreHTTPSErrors:false});
 const page=await context.newPage();
 const cdp=await context.newCDPSession(page);
 const security=[];
 await cdp.send("Security.enable");
 cdp.on("Security.securityStateChanged",x=>security.push({securityState:x.securityState,summary:x.summary,schemeIsCryptographic:x.schemeIsCryptographic,explanations:x.explanations?.map(y=>({summary:y.summary,description:y.description,mixedContentType:y.mixedContentType})),insecureContentStatus:x.insecureContentStatus}));
 const responses=[],failures=[],messages=[];
 page.on("requestfailed",r=>failures.push({url:r.url(),failure:r.failure()?.errorText}));
 page.on("response",r=>{if(r.url().startsWith("http:")||r.status()>=400)responses.push({url:r.url(),status:r.status()})});
 page.on("console",msg=>{if(["warning","error"].includes(msg.type()))messages.push({type:msg.type(),text:msg.text().slice(0,240)})});
 try{
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForTimeout(5000);
  const state=await page.evaluate(()=>({url:location.href,protocol:location.protocol,isSecureContext:window.isSecureContext,heading:document.title,insecureElements:[...document.querySelectorAll("[src],[href],[action]")].filter(el=>["src","href","action"].some(k=>(el.getAttribute(k)||"").startsWith("http:"))).slice(0,30).map(el=>el.outerHTML.slice(0,160)),resources:performance.getEntriesByType("resource").filter(x=>x.name.startsWith("http:")).slice(0,30).map(x=>x.name)}));
  console.log("BROWSER",JSON.stringify({entry:url,httpStatus:response.status(),state,security:security.slice(-10),failures:failures.slice(0,25),responses:responses.slice(0,30),messages:messages.slice(0,30)}));
 }catch(e){console.log("BROWSER ERROR",url,String(e).slice(0,1100))}
 await context.close();
}
await b.close();
