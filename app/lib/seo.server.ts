import type {HumminEnv} from "../../workers/app.ts";
import {insightsPosts,insightsAuthors,insightTopics,insightTopicSlug} from "./insights.server.ts";
import {publishedInsights} from "./insights-public.server.ts";

export function isHumminPublicHost(host:string){
 return host.toLowerCase()==="hummin.org"||host.toLowerCase()==="www.hummin.org";
}
export function robotsPolicy(host:string){
 if(!isHumminPublicHost(host))return "User-agent: *\nDisallow: /\n";
 return [
 "User-agent: *",
 "Allow: /",
 "Disallow: /admin",
 "Disallow: /api/",
 "Disallow: /newsletter/confirm",
 "Disallow: /newsletter/unsubscribe",
 "Sitemap: https://hummin.org/sitemap.xml",
 ""
 ].join("\n");
}
const xml=(s:string)=>s.replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"} as Record<string,string>)[x]);
export async function sitemapXml(env:HumminEnv){
 const pages=[
 "/","/how-we-work","/applied-expertise","/engagements","/who-we-work-with",
 "/assessment","/insights","/about","/contact","/privacy"
 ];
 for(const author of Object.keys(insightsAuthors))pages.push("/insights/author/"+author);
 for(const topic of insightTopics)pages.push("/insights/topic/"+insightTopicSlug(topic));
 const releases=await publishedInsights(env).catch(()=>[]);
 const slugs=new Map(insightsPosts.map(p=>[p.slug,p.date]));
 for(const post of releases)slugs.set(post.slug,post.date);
 const items=[...pages.map(path=>({path,date:null as string|null})),...Array.from(slugs.entries(),([slug,date])=>({path:"/insights/"+slug,date}))];
 return '<?xml version="1.0" encoding="UTF-8"?>\n'+
   '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
   items.map(item=>'<url><loc>'+xml("https://hummin.org"+item.path)+'</loc>'+
    (item.date?'<lastmod>'+xml(item.date)+'</lastmod>':"")+'</url>').join("\n")+
   '\n</urlset>\n';
}
