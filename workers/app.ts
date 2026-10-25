import { createRequestHandler } from "react-router";
import {runMailWorker} from "../app/lib/mail-cron.server.ts";
import {isHumminPublicHost,robotsPolicy,sitemapXml} from "../app/lib/seo.server.ts";
import type { D1Database, ExecutionContext, Fetcher } from "@cloudflare/workers-types";

export interface HumminEnv {
  DB?: D1Database;
  ASSETS?: Fetcher;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_SYSTEM?: string;
  EMAIL_FROM_PEOPLE?: string;
  EMAIL_FROM_NEWSLETTER?: string;
  ADMIN_AUTH_ENABLED?: string;
  ADMIN_AUTH_PEPPER?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  SITE_URL?: string;
  CONTACT_ENABLED?: string;
  BOOKING_ENABLED?: string;
  GOOGLE_CALENDAR_ID?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: { env: HumminEnv; ctx: ExecutionContext };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: HumminEnv, ctx: ExecutionContext) {
    // These two paths must run Worker-first even when the asset bundle contains
    // robots.txt. Host-based indexation prevents search engines finding staging.
    if(request.method==="GET"){
      const url=new URL(request.url);
      if(url.pathname==="/robots.txt"){
        return new Response(robotsPolicy(url.hostname),{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
      }
      if(url.pathname==="/sitemap.xml"){
        if(!isHumminPublicHost(url.hostname))
          return new Response("Not found",{status:404,headers:{"X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store"}});
        return new Response(await sitemapXml(env),{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=300"}});
      }
    }
    return requestHandler(request, { cloudflare: { env, ctx } });
  },
  async scheduled(_controller:ScheduledController,env:HumminEnv,ctx:ExecutionContext){
    ctx.waitUntil(runMailWorker(env).then(()=>undefined).catch(e=>console.error("Scheduled email delivery failed",e instanceof Error?e.message:"unknown")));
  }
};
