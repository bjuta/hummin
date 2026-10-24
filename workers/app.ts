import { createRequestHandler } from "react-router";
import type { D1Database, ExecutionContext } from "@cloudflare/workers-types";

export interface HumminEnv {
  DB?: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  SITE_URL?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  CONTACT_ENABLED?: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: { env: HumminEnv; ctx: ExecutionContext };
  }
}


type HumminDesign = "site" | "assessment";
const cachedPages: Partial<Record<HumminDesign, Promise<string>>> = {};
const designPaths: Record<string, HumminDesign> = {
  "/":"site", "/how-we-work":"site", "/applied-expertise":"site",
  "/engagements":"site", "/who-we-work-with":"site", "/about":"site", "/contact":"site",
  "/assessment":"assessment"
};
async function faithfulDesign(type: HumminDesign, request: Request, env: HumminEnv): Promise<Response> {
  if (!env.ASSETS) return new Response("HUMMIN design assets are unavailable", {status:503});
  if(!cachedPages[type]) {
    cachedPages[type] = (async () => {
      const count = type==="site" ? 18 : 3;
      const parts = await Promise.all(Array.from({length:count},async (_,i) => {
        const target = new URL("/design-parts/"+type+"-"+String(i).padStart(2,"0")+".txt",request.url);
        const response=await env.ASSETS!.fetch(new Request(target.toString(), {method:"GET"}));
        if(!response.ok)throw new Error("Design chunk missing "+i);
        return response.text();
      }));
      return parts.join("");
    })().catch(err=>{ delete cachedPages[type]; throw err; });
  }
  try {
    const document=await cachedPages[type];
    return new Response(document,{status:200,headers:{
      "Content-Type":"text/html; charset=utf-8",
      "Cache-Control":"private, no-cache",
      "X-Robots-Tag":"noindex,nofollow",
      "X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"strict-origin-when-cross-origin",
      "X-Hummin-Design":"source-faithful-reference"
    }});
  } catch {
    console.error("Faithful HUMMIN document could not be loaded",type);
    return new Response("Design preview temporarily unavailable",{status:503});
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  fetch(request: Request, env: HumminEnv, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';
    if(request.method==='GET' && designPaths[path]) return faithfulDesign(designPaths[path],request,env);
    return requestHandler(request, { cloudflare: { env, ctx } });
  }
};
