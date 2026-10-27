import type {AppLoadContext} from "react-router";
import {publishedInsights} from "../lib/insights-public.server.ts";

export async function loader({context}:{context:AppLoadContext}){
 const articles=await publishedInsights(context.cloudflare.env);
 return Response.json({posts:articles},{
  headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Access-Control-Allow-Origin":"none"}
 });
}
