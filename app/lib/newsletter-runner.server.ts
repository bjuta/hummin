import type {HumminEnv} from "../../workers/app";
import {monthlyNewsletterEmail} from "./email-templates.server.ts";
import {queueEmail} from "./mail-outbox.server.ts";
export async function queueApprovedNewsletters(env:HumminEnv):Promise<number>{
 if(!env.DB||!env.SITE_URL)return 0;
 const issues=await env.DB.prepare("SELECT id,month,title,preheader,body,article_url FROM newsletter_issues WHERE status='approved' ORDER BY created_at LIMIT 3")
 .all<{id:string;month:string;title:string;preheader:string;body:string;article_url:string}>();
 let queued=0;
 for(const issue of issues.results||[]){
  const pending=await env.DB.prepare("SELECT email,token FROM newsletter_subscribers WHERE status='active' AND NOT EXISTS(SELECT 1 FROM email_outbox o WHERE o.kind='newsletter-monthly' AND o.recipient=newsletter_subscribers.email AND o.id LIKE ?) ORDER BY subscribed_at LIMIT 25").bind("newsletter:"+issue.id+":%").all<{email:string;token:string}>();
  for(const sub of pending.results||[]){
   const url=env.SITE_URL+"/newsletter/unsubscribe?token="+encodeURIComponent(sub.token);
   const email=monthlyNewsletterEmail({recipient:sub.email,month:issue.month,title:issue.title,preheader:issue.preheader,paragraphs:issue.body.split(/\n\n+/).filter(Boolean),articleUrl:issue.article_url,unsubscribeUrl:url,assetOrigin:env.SITE_URL});
   const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(issue.id+"|"+sub.email));
   const key="newsletter:"+issue.id+":"+Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");
   await queueEmail(env,key,email);
   queued++;
  }
 }
 return queued;
}
