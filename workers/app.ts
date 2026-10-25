import { createRequestHandler } from "react-router";
import {runMailWorker} from "../app/lib/mail-cron.server.ts";
import type { D1Database, ExecutionContext, Fetcher } from "@cloudflare/workers-types";

export interface HumminEnv {
  DB?: D1Database;
  ASSETS?: Fetcher;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_SYSTEM?: string;
  EMAIL_FROM_PEOPLE?: string;
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
  fetch(request: Request, env: HumminEnv, ctx: ExecutionContext) {
    return requestHandler(request, { cloudflare: { env, ctx } });
  },
  async scheduled(_controller:ScheduledController,env:HumminEnv,ctx:ExecutionContext){
    ctx.waitUntil(runMailWorker(env).then(()=>undefined).catch(e=>console.error("Scheduled email delivery failed",e instanceof Error?e.message:"unknown")));
  }
};
