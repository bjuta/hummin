import { isConfigured, liveSlots } from "../lib/calendar.server";
import type { AppLoadContext } from "react-router";
export async function loader({context}:{context:AppLoadContext}){
 const env=context.cloudflare.env;
 const disabled=()=>Response.json({enabled:false,days:[],message:"Live booking is not configured."},{headers:{"Cache-Control":"no-store"}});
 // Never display bookable times when appointment creation is disabled.
 if(!isConfigured(env))return disabled();
 try{return Response.json({enabled:true,days:await liveSlots(env)},{headers:{"Cache-Control":"no-store"}});}
 catch{console.error("HUMMIN booking availability failed");return Response.json({enabled:false,days:[],message:"Availability is temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});}
}