import type {AppLoadContext} from "react-router";
export async function loader({context}:{context:AppLoadContext}){
 const e=context.cloudflare.env;
 const ready=!!(e.DB&&e.RESEND_API_KEY&&e.EMAIL_FROM&&e.TURNSTILE_SECRET_KEY&&e.TURNSTILE_SITE_KEY);
 return Response.json({ready,siteKey:ready?e.TURNSTILE_SITE_KEY:""},{headers:{"Cache-Control":"no-store"}});
}
