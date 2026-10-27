import type {HumminEnv} from "../../workers/app";
import type {BrandEmail} from "./email-brand.server.ts";
import {readBookingEvent} from "./calendar.server.ts";
import {bookingEmailIdentity} from "./booking-email-keys.server.ts";
export async function queueEmail(env:HumminEnv,key:string,email:BrandEmail,delay?:Date){
 if(!env.DB)throw Error("Mail database is not available");
 const payload=JSON.stringify(email);
 if(payload.length>35000)throw Error("Email payload exceeds allowed size");
 await env.DB.prepare("INSERT OR IGNORE INTO email_outbox(id,kind,recipient,payload,next_attempt_at) VALUES(?,?,?,?,?)")
 .bind(key,email.type,email.recipient,payload,(delay||new Date()).toISOString()).run();
}
export async function deliverDue(env:HumminEnv,limit=12):Promise<{sent:number;failed:number}>{
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM)throw Error("Email provider unavailable");
 const due=await env.DB.prepare("SELECT id,kind,recipient,payload,attempts FROM email_outbox WHERE ((status IN ('pending','failed') AND next_attempt_at <= ?) OR (status='sending' AND claimed_at < ?)) AND attempts < 7 ORDER BY next_attempt_at LIMIT ?")
 .bind(new Date().toISOString(),new Date(Date.now()-15*60000).toISOString(),limit).all<{id:string;kind:string;recipient:string;payload:string;attempts:number}>();
 let sent=0,failed=0;
 for(const row of due.results||[]){
  const claimed=await env.DB.prepare("UPDATE email_outbox SET status='sending',claimed_at=?,attempts=attempts+1 WHERE id=? AND ((status IN ('pending','failed') AND next_attempt_at<=?) OR (status='sending' AND claimed_at<?))")
    .bind(new Date().toISOString(),row.id,new Date().toISOString(),new Date(Date.now()-15*60000).toISOString()).run();
  if(claimed.meta?.changes!==1)continue;
  try{
   // Subscription consent is rechecked at dispatch time, even after an issue was queued.
   if(row.kind==="newsletter-monthly"){
    const approved=await env.DB.prepare("SELECT status FROM newsletter_issues WHERE id=?").bind(row.id.slice("newsletter:".length).split(":")[0]).first<{status:string}>();
    const active=await env.DB.prepare("SELECT status FROM newsletter_subscribers WHERE email=?").bind(row.recipient).first<{status:string}>();
    if(approved?.status!=="approved"||active?.status!=="active"){
     await env.DB.prepare("DELETE FROM email_outbox WHERE id=? AND status='sending'").bind(row.id).run();
     continue;
    }
   }
   if(row.kind==="booking-reminder"||row.kind==="booking-confirmation"||row.kind==="booking-internal"){
    const identity=bookingEmailIdentity(row.kind,row.id);
    if(!identity)throw Error("Invalid booking outbox identity");
    const id=identity.eventId;
    const booked=await env.DB.prepare("SELECT start_utc,status FROM booking_slots WHERE google_event_id=?").bind(id).first<{start_utc:string;status:string}>();
    if(!booked||booked.status!=="confirmed"||(identity.startMs!==null&&Date.parse(booked.start_utc)!==identity.startMs)){
     await env.DB.prepare("DELETE FROM email_outbox WHERE id=?").bind(row.id).run();
     continue;
    }
    const calendar=await readBookingEvent(env,id);
    if(calendar.status!=="confirmed"||!calendar.start||Date.parse(calendar.start)!==Date.parse(booked.start_utc)){
     await env.DB.prepare("DELETE FROM email_outbox WHERE id=?").bind(row.id).run();
     continue;
    }
   }
   const email=JSON.parse(row.payload) as BrandEmail;
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":row.id},
    body:JSON.stringify({from:(email.sender==="system"?env.EMAIL_FROM_SYSTEM:email.sender==="newsletter"?env.EMAIL_FROM_NEWSLETTER:env.EMAIL_FROM_PEOPLE)||env.EMAIL_FROM,to:[email.recipient],subject:email.subject,text:email.text,html:email.html,reply_to:email.replyTo||"sales@hummin.org",
      ...(email.type==="newsletter-monthly"&&email.unsubscribeUrl?{headers:{"List-Unsubscribe":"<"+email.unsubscribeUrl+">","List-Unsubscribe-Post":"List-Unsubscribe=One-Click"}}:{})})});
   if(!res.ok)throw Error("Email provider returned HTTP "+res.status);
   const body=await res.json() as {id?:string};
   if(!body.id)throw Error("Provider did not return an email id");
   await env.DB.prepare("UPDATE email_outbox SET status='sent',provider_id=?,sent_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?").bind(body.id,row.id).run();
   if(row.id.startsWith("contact-internal:")){
    const id=row.id.slice("contact-internal:".length);
    try{await env.DB.prepare("UPDATE enquiries SET status='accepted',provider_message_id=?,provider_accepted_at=CURRENT_TIMESTAMP WHERE id=?").bind(body.id,id).run();}
    catch{console.error("Provider accepted enquiry but enquiry record could not be updated",id);}
   }
   sent++;
  }catch(err){
   failed++;
   const minutes=Math.min(360,Math.pow(2,Math.min(row.attempts,6))*3);
   await env.DB.prepare("UPDATE email_outbox SET status='failed',last_error=?,next_attempt_at=? WHERE id=?")
    .bind(err instanceof Error?err.message.slice(0,200):"Unknown email error",new Date(Date.now()+minutes*60000).toISOString(),row.id).run();
  }
 }
 return {sent,failed};
}
