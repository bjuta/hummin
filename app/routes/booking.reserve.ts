import { isConfigured, reserve } from "../lib/calendar.server";
import {transactionalHostBlock} from "../lib/transactional-host-guard.ts";
import type { AppLoadContext } from "react-router";
import {bookingConfirmationEmail,bookingReminderEmail,bookingInternalEmail} from "../lib/email-templates.server.ts";
import {queueEmail,deliverDue} from "../lib/mail-outbox.server.ts";
import {bookingLimit,verifyBookingTurnstile} from "../lib/booking-abuse.server.ts";
import {bookingEmailKey} from "../lib/booking-email-keys.server.ts";
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const blocked=transactionalHostBlock(request);if(blocked)return blocked;
 const env=context.cloudflare.env;
 const err=(msg:string,status:number)=>Response.json({ok:false,message:msg},{status,headers:{"Cache-Control":"no-store"}});
 if(!isConfigured(env))return err("Live appointment booking is not yet available.",503);
 if(request.headers.get("content-length")&&Number(request.headers.get("content-length"))>8192)return err("Request too large",413);
 const origin=request.headers.get("origin");
 if(!origin)return err("Request origin required",403);
 try{if(new URL(origin).origin!==new URL(request.url).origin)return err("Invalid origin",403);}catch{return err("Invalid origin",403);}
 try{const rate=await bookingLimit(env,request,"reserve");if(!rate.ok)return Response.json({ok:false,message:"Too many booking attempts."},{status:429,headers:{"Cache-Control":"no-store","Retry-After":String(rate.retryAfter)}});}
 catch{return err("Booking protection is unavailable",503);}
 let x:{start?:unknown;name?:unknown;email?:unknown;phone?:unknown;turnstileToken?:unknown};
 try{x=await request.json();}catch{return err("Invalid request",400);}
 const start=typeof x.start==="string"?x.start:"",name=typeof x.name==="string"?x.name.trim():"",email=typeof x.email==="string"?x.email.trim():"",phone=typeof x.phone==="string"?x.phone.trim():"";
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(start)||!Number.isFinite(Date.parse(start))||name.length<2||name.length>120||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||phone.length>40)return err("Please provide valid booking details",400);
 const token=typeof x.turnstileToken==="string"?x.turnstileToken:"";
 if(!await verifyBookingTurnstile(env,request,token))return err("Complete the booking security check and try again.",403);
 try{const rate=await bookingLimit(env,request,"email",email);if(!rate.ok)return Response.json({ok:false,message:"Too many booking requests for this email."},{status:429,headers:{"Cache-Control":"no-store","Retry-After":String(rate.retryAfter)}});}
 catch{return err("Booking protection is unavailable",503);}
 try{
 const event=await reserve(env,{start,name,email,phone});
 let emailQueued=false;
 if(env.DB&&(event.meetUrl||event.calendarUrl)&&env.RESEND_API_KEY&&env.EMAIL_FROM){
  const appointment={recipient:email,name,start:new Date(start),end:new Date(Date.parse(start)+1800000),host:"HUMMIN",meetUrl:event.meetUrl,calendarUrl:event.calendarUrl,assetOrigin:env.SITE_URL||new URL(request.url).origin};
  try{
   await queueEmail(env,bookingEmailKey("booking-confirmation",event.eventId,start),bookingConfirmationEmail(appointment));
   await queueEmail(env,bookingEmailKey("booking-internal",event.eventId,start),bookingInternalEmail({...appointment,phone}));
   const reminderTime=new Date(Date.parse(start)-86400000);
   if(reminderTime.getTime()>Date.now()+300000)await queueEmail(env,bookingEmailKey("booking-reminder",event.eventId,start),bookingReminderEmail(appointment),reminderTime);
   emailQueued=true;
   context.cloudflare.ctx.waitUntil(deliverDue(env,3).catch(()=>({sent:0,failed:0})));
  }catch(e){console.error("Booking confirmed but email enqueue failed",event.eventId);}
 }else{console.error("Booking confirmed without email prerequisites or a valid Calendar link",event.eventId);}
 return Response.json({ok:true,...event,emailQueued},{headers:{"Cache-Control":"no-store"}});
}
 catch(e){console.error("HUMMIN booking attempt could not be confirmed");return err(e instanceof Error && /no longer available|just been selected/.test(e.message)?"That time has been taken. Choose another slot.":"Booking could not be confirmed. Please email sales@hummin.org.",e instanceof Error && /no longer available|just been selected/.test(e.message)?409:503);}
}