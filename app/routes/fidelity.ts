import { action as contactAction } from "./contact";
import type { AppLoadContext } from "react-router";
export async function loader({ request, context }: { request: Request; context: AppLoadContext }) {
 const env=context.cloudflare.env;
 if(!env.ASSETS) return new Response("Design assets not available",{status:503});
 const assetUrl=new URL("/design/site/index.html",request.url);
 const response=await env.ASSETS.fetch(assetUrl.toString());
 if(!response.ok) return new Response("Design could not load",{status:503});
 const contactReady=env.CONTACT_ENABLED==="true"&&!!(env.DB&&env.RESEND_API_KEY&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY&&env.EMAIL_FROM);
 // Inject only runtime configuration; retain the original site template and its design.
 const config='<script>window.HUMMIN_CONTACT_READY='+JSON.stringify(contactReady)+';window.HUMMIN_TURNSTILE_SITE_KEY='+JSON.stringify(contactReady?env.TURNSTILE_SITE_KEY:'')+';window.humminTurnstileLoaded=function(){window.dispatchEvent(new Event("hummin-turnstile-ready"));};</script>';
 const script=contactReady?'<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=humminTurnstileLoaded&render=explicit" async defer></script>':'';
 const html=(await response.text()).replace("</head>",config+script+"</head>");
 return new Response(html,{status:response.status,headers:{"Content-Type":"text/html; charset=utf-8","X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store"}});
}
export async function action(args:{request:Request;context:AppLoadContext}) {
 if(new URL(args.request.url).pathname!=="/contact") return new Response("Method not allowed",{status:405});
 return contactAction(args);
}