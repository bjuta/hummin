import {insightDetails,insightsAuthors} from "../lib/insights.server.ts";
import { action as contactAction } from "./contact";
import type { AppLoadContext } from "react-router";
export async function loader({ request, context }: { request: Request; context: AppLoadContext }) {
 const env=context.cloudflare.env;
 const pathname=new URL(request.url).pathname;
 const insight=pathname.startsWith('/insights')?insightDetails(pathname):null;
 if(pathname.startsWith('/insights')&&!insight)return new Response('Insight not found',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 if(!env.ASSETS) return new Response("Design assets not available",{status:503});
 const assetUrl=new URL("/design/site/index.html",request.url);
 const response=await env.ASSETS.fetch(assetUrl.toString());
 if(!response.ok) return new Response("Design could not load",{status:503});
 const contactReady=env.CONTACT_ENABLED==="true"&&!!(env.DB&&env.RESEND_API_KEY&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY&&env.EMAIL_FROM);
 // Inject only runtime configuration; retain the original site template and its design.
 const config='<script>window.HUMMIN_CONTACT_READY='+JSON.stringify(contactReady)+';window.HUMMIN_TURNSTILE_SITE_KEY='+JSON.stringify(contactReady?env.TURNSTILE_SITE_KEY:'')+';window.humminTurnstileLoaded=function(){window.dispatchEvent(new Event("hummin-turnstile-ready"));};</script>';
 const script=contactReady?'<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=humminTurnstileLoaded&render=explicit" async defer></script>':'';
 const esc=(v:string)=>v.replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[x]);
 const meta=insight?(()=>{
  const base='<title>'+esc(insight.title)+'</title><meta name="description" content="'+esc(insight.description)+'"><link rel="canonical" href="'+esc(insight.canonical)+'">'+
    '<meta property="og:type" content="'+(insight.type==='article'?'article':'website')+'"><meta property="og:title" content="'+esc(insight.title)+'">'+
    '<meta property="og:description" content="'+esc(insight.description)+'"><meta property="og:url" content="'+esc(insight.canonical)+'">'+
    '<meta name="twitter:card" content="summary"><meta name="twitter:title" content="'+esc(insight.title)+'">';
  if(insight.type!=='article')return base;
  const article=insight.post;
  const author=insightsAuthors[article.author];
  const data={"@context":"https://schema.org","@type":"BlogPosting",headline:article.title,description:article.excerpt,datePublished:article.date,
   author:{"@type":article.author==='team'?"Organization":"Person",name:author.name,url:"https://hummin.org/insights/author/"+article.author},
   publisher:{"@type":"Organization",name:"HUMMIN",url:"https://hummin.org"},mainEntityOfPage:insight.canonical,keywords:article.topics.join(", ")};
  return base+'<meta property="article:published_time" content="'+article.date+'"><script type="application/ld+json">'+JSON.stringify(data)+'</script>';
 })():'';
 const resize='<script>window.addEventListener("message",function(e){if(e.origin!==window.location.origin||!e.data||!Number.isFinite(e.data.humminInsightsHeight))return;var f=document.getElementById("hummin-insights-frame");if(f)f.style.height=Math.min(40000,Math.max(800,e.data.humminInsightsHeight+8))+"px";});</script>';
 const html=(await response.text()).replace("</head>",meta+config+script+resize+"</head>");
 return new Response(html,{status:response.status,headers:{"Content-Type":"text/html; charset=utf-8","X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store"}});
}
export async function action(args:{request:Request;context:AppLoadContext}) {
 if(new URL(args.request.url).pathname!=="/contact") return new Response("Method not allowed",{status:405});
 return contactAction(args);
}