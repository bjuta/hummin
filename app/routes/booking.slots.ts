import { isConfigured, liveSlots } from "../lib/calendar.server";
import {transactionalHostBlock} from "../lib/transactional-host-guard.ts";
import type { AppLoadContext } from "react-router";
import {bookingLimit} from "../lib/booking-abuse.server.ts";
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 const disabled=()=>Response.json({enabled:false,days:[],message:"Live booking is not configured."},{headers:{"Cache-Control":"no-store"}});
 // Preview must not query a possibly production-linked Calendar even in read-only mode.
 if(transactionalHostBlock(request))return disabled();
 // Never display bookable times when appointment creation is disabled.
 if(!isConfigured(env))return disabled();
 try{
  const limit=await bookingLimit(env,request,"slots");
  if(!limit.ok)return Response.json({enabled:false,days:[],message:"Too many availability requests."},{status:429,headers:{"Cache-Control":"no-store","Retry-After":String(limit.retryAfter)}});
  return Response.json({enabled:true,days:await liveSlots(env),siteKey:env.TURNSTILE_SITE_KEY},{headers:{"Cache-Control":"no-store"}});
 }
 catch{console.error("HUMMIN booking availability failed");return Response.json({enabled:false,days:[],message:"Availability is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});}
}