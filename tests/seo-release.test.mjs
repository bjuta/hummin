import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {isHumminPublicHost,robotsPolicy,sitemapXml,protectNonPublicResponse} from "../app/lib/seo.server.ts";
const read=p=>fs.readFileSync(p,"utf8");
test("Only public HUMMIN hostnames can be indexed",()=>{
 for(const host of ["hummin.org","www.hummin.org"])assert.equal(isHumminPublicHost(host),true);
 for(const host of ["hummin-web-preview.grimpossible.workers.dev","hummin-web-production.grimpossible.workers.dev","evil-hummin.org","other.example"])assert.equal(isHumminPublicHost(host),false);
 assert.match(robotsPolicy("hummin-web-production.grimpossible.workers.dev"),/Disallow: \/\n/);
 const prod=robotsPolicy("hummin.org");
 assert.match(prod,/Allow: \//);
 assert.match(prod,/Disallow: \/admin/);
 assert.match(prod,/Disallow: \/design\//);
 assert.match(prod,/Sitemap: https:\/\/hummin.org\/sitemap.xml/);
});
test("Public sitemap contains only public pages, authors, topics and published articles",async()=>{
 const mockDb={prepare(){return {all:async()=>({results:[]})}}};
 const text=await sitemapXml({DB:mockDb});
 assert.match(text,/<\?xml version="1.0"/);
 assert.match(text,/<loc>https:\/\/hummin.org\/insights<\/loc>/);
 assert.match(text,/<loc>https:\/\/hummin.org\/insights\/enquiries-30-day-fix<\/loc>/);
 assert.match(text,/<loc>https:\/\/hummin.org\/insights\/author\/muiruri<\/loc>/);
 assert.doesNotMatch(text,/\/admin|\/api\//);
});
test("Worker intercepts SEO routes before static robots, production pages remove design noindex",()=>{
 const worker=read("workers/app.ts"),fidelity=read("app/routes/fidelity.ts");
 assert.match(worker,/url.pathname==="\/robots.txt"/);
 assert.match(worker,/url.pathname==="\/sitemap.xml"/);
 assert.match(worker,/isHumminPublicHost/);
 assert.match(fidelity,/if\(isPublicHost\)html=html.replace/);
 assert.match(fidelity,/if\(!isPublicHost\)headers\["X-Robots-Tag"\]/);
 for(const file of ["wrangler.preview.jsonc","wrangler.production.jsonc"]){
  const cfg=JSON.parse(read(file));
  assert.deepEqual(cfg.assets.run_worker_first,["/robots.txt","/sitemap.xml"]);
 }
 assert.match(read("public/robots.txt"),/Disallow: \//);
});

test("Staging includes noindex on privacy, Admin, booking and error responses",async()=>{
 for(const status of [200,400,404,503]){
  const response=new Response("test",{status,headers:{"Cache-Control":"no-store","Content-Type":"text/html"}});
  const wrapped=protectNonPublicResponse("hummin-web-production.grimpossible.workers.dev",response);
  assert.equal(wrapped.status,status);
  assert.equal(wrapped.headers.get("X-Robots-Tag"),"noindex, nofollow");
  assert.equal(wrapped.headers.get("Cache-Control"),"no-store");
  assert.equal(await wrapped.text(),"test");
 }
 const noContent=protectNonPublicResponse("hummin-web-production.grimpossible.workers.dev",new Response(null,{status:204}));
 assert.equal(noContent.status,204);
 assert.equal(noContent.headers.get("X-Robots-Tag"),"noindex, nofollow");
});
test("Public domain responses remain unmodified, including publishable privacy",()=>{
 const response=new Response("public",{headers:{"Content-Type":"text/html"}});
 assert.equal(protectNonPublicResponse("hummin.org",response),response);
 assert.equal(protectNonPublicResponse("www.hummin.org",response),response);
 assert.equal(response.headers.get("X-Robots-Tag"),null);
 assert.ok(read("workers/app.ts").includes("protectNonPublicResponse(new URL(request.url).hostname,response)"));
});
