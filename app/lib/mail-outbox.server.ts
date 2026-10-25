import type {HumminEnv} from "../../workers/app";
import type {BrandEmail} from "./email-brand.server.ts";
export async function queueEmail(env:HumminEnv,key:string,email:BrandEmail,delay?:Date){
 if(!env.DB)throw Error("Mail database is not available");
 const payload=JSON.stringify(email);
 if(payload.length>35000)throw Error("Email payload exceeds allowed size");
 await env.DB.prepare("INSERT OR IGNORE INTO email_outbox(id,kind,recipient,payload,next_attempt_at) VALUES(?,?,?,?,?)")
 .bind(key,email.type,email.recipient,payload,(delay||new Date()).toISOString()).run();
}
export async function deliverDue(env:HumminEnv,limit=12):Promise<{sent:number;failed:number}>{
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM)throw Error("Email provider unavailable");
 const due=await env.DB.prepare("SELECT id,payload,attempts FROM email_outbox WHERE ((status IN ('pending','failed') AND next_attempt_at <= ?) OR (status='sending' AND claimed_at < ?)) AND attempts < 7 ORDER BY next_attempt_at LIMIT ?")
 .bind(new Date().toISOString(),new Date(Date.now()-15*60000).toISOString(),limit).all<{id:string;payload:string;attempts:number}>();
 let sent=0,failed=0;
 for(const row of due.results||[]){
  const claimed=await env.DB.prepare("UPDATE email_outbox SET status='sending',claimed_at=?,attempts=attempts+1 WHERE id=? AND ((status IN ('pending','failed') AND next_attempt_at<=?) OR (status='sending' AND claimed_at<?))")
    .bind(new Date().toISOString(),row.id,new Date().toISOString(),new Date(Date.now()-15*60000).toISOString()).run();
  if(claimed.meta?.changes!==1)continue;
  try{
   const email=JSON.parse(row.payload) as BrandEmail;
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":row.id},
    body:JSON.stringify({from:env.EMAIL_FROM,to:[email.recipient],subject:email.subject,text:email.text,html:email.html,reply_to:email.replyTo||"sales@hummin.org"})});
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
