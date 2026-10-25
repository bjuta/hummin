import type {AppLoadContext} from "react-router";
export const validPage=(path:string)=>path==="/"||/^\/(how-we-work|applied-expertise|engagements|who-we-work-with|assessment|about|contact|insights(?:\/[a-z0-9-]+){0,3}|newsletter|privacy)\/?$/.test(path);
const groups=["direct","search","social","referral","internal"];
export function channelFromReferrer(referrer:string,home:string){
 if(!referrer)return "direct";
 try{
  const u=new URL(referrer),host=u.hostname.toLowerCase(),mine=new URL(home).hostname.toLowerCase();
  if(!["https:","http:"].includes(u.protocol))return "direct";
  if(host===mine)return "internal";
  if(/(^|\.)(google\.|bing\.|duckduckgo\.|yahoo\.|ecosia\.)([^.]+\.)?[^.]+$/.test(host))return "search";
  if(/(^|\.)(linkedin\.com|facebook\.com|instagram\.com|t\.co|x\.com|twitter\.com|whatsapp\.com|youtube\.com)$/.test(host))return "social";
  return "referral";
 }catch{return "direct";}
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env,headers={"Cache-Control":"no-store"};
 if(!env.DB)return new Response(null,{status:503,headers});
 const referer=request.headers.get("referer"),origin=request.headers.get("origin");
 const url=new URL(request.url);
 if(origin && origin!==url.origin)return new Response(null,{status:403,headers});
 if(!origin&&!referer)return new Response(null,{status:403,headers});
 if(!origin&&referer&&new URL(referer).origin!==url.origin)return new Response(null,{status:403,headers});
 if(Number(request.headers.get("content-length")||0)>1200)return new Response(null,{status:413,headers});
 let data:unknown;try{data=await request.json();}catch{return new Response(null,{status:400,headers});}
 if(!data||typeof data!=="object")return new Response(null,{status:400,headers});
 const payload=data as Record<string,unknown>;
 const path=payload.path;
 if(typeof path!=="string"||!validPage(path))return new Response(null,{status:400,headers});
 const ref=typeof payload.referrer==="string"&&payload.referrer.length<400?payload.referrer:"";
 const channel=channelFromReferrer(ref,url.origin);
 if(!groups.includes(channel))return new Response(null,{status:400,headers});
 const day=new Date().toISOString().slice(0,10);
 try{
  await env.DB.prepare("INSERT INTO web_analytics_daily(day,path,channel,views) VALUES(?,?,?,1) ON CONFLICT(day,path,channel) DO UPDATE SET views=views+1")
   .bind(day,path,channel).run();
  return new Response(null,{status:204,headers});
 }catch{return new Response(null,{status:503,headers});}
}
