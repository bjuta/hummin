import {insightsAuthors,insightTopics,insightTopicSlug} from "./insights.server";
import {publishedInsights} from "./insights-public.server";
import {isHumminPublicHost} from "./seo.server";
import originalPosts from "./react-original-insights.json";
import type {AppLoadContext} from "react-router";
import type {ReactPost} from "../components/ReactInsights";
export async function loadReactInsights({request,context}:{request:Request;context:AppLoadContext},canonical=false){
 const url=new URL(request.url);
 if(!canonical&&isHumminPublicHost(url.hostname))throw new Response("Not found",{status:404});
 const prefix=canonical?"/insights":"/__react/insights";
 if(url.pathname!==prefix&&!url.pathname.startsWith(prefix+"/"))throw new Response("Not found",{status:404});
 const suffix=url.pathname.slice(prefix.length);
 const components=suffix.split("/").filter(Boolean);
 const valid=(s:string)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)&&s.length<121;
 let view:"index"|"article"|"topic"|"author"="index",selected="";
 if(components.length){
  if(components.length===2&&components[0]==="topic"&&insightTopics.some(t=>insightTopicSlug(t)===components[1])){view="topic";selected=components[1]}
  else if(components.length===2&&components[0]==="author"&&Object.keys(insightsAuthors).includes(components[1])){view="author";selected=components[1]}
  else if(components.length===1&&valid(components[0])){view="article";selected=components[0]}
  else throw new Response("Insight not found",{status:404});
 }
 // Preserve source article bodies while allowing the published Admin CMS to
 // replace a prior revision by its sourceSlug, exactly like existing Insights.
 const base=(originalPosts as unknown as ReactPost[]).map(p=>({...p,blocks:p.blocks.map(b=>({...b}))}));
 const latest=await publishedInsights(context.cloudflare.env);
 for(const post of latest){
  const idx=base.findIndex(p=>p.slug===(post.sourceSlug||post.slug));
  if(idx>=0)base.splice(idx,1,post);
  else base.push(post);
 }
 base.sort((a,b)=>b.date.localeCompare(a.date));
 if(view==="article"&&!base.some(p=>p.slug===selected))throw new Response("Insight not found",{status:404});
 return {posts:base,view,selected,preview:!canonical};
}
