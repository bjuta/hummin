import type {AppLoadContext} from "react-router";
import {assessmentResultsEmail} from "../lib/email-templates.server.ts";
import {deliverDue} from "../lib/mail-outbox.server.ts";
import {parseAssessmentDeliveryInput} from "../lib/assessment-delivery-contract";
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 const err=(message:string,status:number)=>Response.json({ok:false,message},{status,headers:{"Cache-Control":"no-store"}});
 if(!env.DB||!env.TURNSTILE_SECRET_KEY||!env.RESEND_API_KEY||!env.EMAIL_FROM)return err("Email delivery is unavailable.",503);
 if(Number(request.headers.get("content-length"))>12000)return err("Request too large.",413);
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return err("Invalid origin.",403);
 let raw:unknown;
 try{raw=await request.json();}catch{return err("Invalid request.",400);}
 const input=parseAssessmentDeliveryInput(raw);
 if(!input)return err("Please check the details and results.",400);
 const {name,business,email,goal,score,token,priorities}=input;
 if(!token)return err("Please complete verification.",400);
 try{
  const check=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token})});
  const result=await check.json() as {success?:boolean;hostname?:string};
  if(!result.success||result.hostname!==new URL(request.url).hostname)return err("Verification failed. Please try again.",403);
 }catch{return err("Verification could not be completed.",503);}
 const id=crypto.randomUUID();
 // Assessment figures are an on-device estimate. Never label them as independently audited.
 const cost=input.monthlyCost;
 const mail=assessmentResultsEmail({recipient:email,name,goal,score,estimatedCostKes:cost,
  priorities:priorities.map((p,i)=>({label:"Priority "+(i+1),value:p as string})),
  bookingUrl:(env.SITE_URL||new URL(request.url).origin)+"/assessment",resultsUrl:(env.SITE_URL||new URL(request.url).origin)+"/assessment",
  assetOrigin:env.SITE_URL||new URL(request.url).origin});
 try{
  const payload=JSON.stringify(mail);
  if(payload.length>35000)throw Error("Assessment email too large");
  await env.DB.batch([
   env.DB.prepare("INSERT INTO assessment_deliveries(id,email,name,business_name,score,goal,summary) VALUES(?,?,?,?,?,?,?)")
    .bind(id,email,name,business,score,goal,JSON.stringify({priorities,cost})),
   env.DB.prepare("INSERT INTO email_outbox(id,kind,recipient,payload) VALUES(?,?,?,?)")
    .bind("assessment-results:"+id,mail.type,mail.recipient,payload)
  ]);
  context.cloudflare.ctx.waitUntil(deliverDue(env,3).catch(()=>({sent:0,failed:0})));
  return Response.json({ok:true,queued:true,message:"Your plan is unlocked. We have queued a copy for email delivery."},{headers:{"Cache-Control":"no-store"}});
 }catch{console.error("Assessment email could not be queued",id);return err("We could not queue your email. Please try again.",503);}
}
