import { action as contactAction } from "./contact";
import type { AppLoadContext } from "react-router";
export async function loader({ request, context }: { request: Request; context: AppLoadContext }) {
 const env=context.cloudflare.env;
 if(!env.ASSETS) return new Response("Design assets not available",{status:503});
 const assetUrl=new URL("/design/site/index.html",request.url);
 const response=await env.ASSETS.fetch(assetUrl.toString());
 if(!response.ok) return new Response("Design could not load",{status:503});
 return new Response(await response.text(),{status:response.status,headers:{"Content-Type":"text/html; charset=utf-8","X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store"}});
}
export async function action(args:{request:Request;context:AppLoadContext}) {
 if(new URL(args.request.url).pathname!=="/contact") return new Response("Method not allowed",{status:405});
 return contactAction(args);
}