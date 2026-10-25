import {Form,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {newsletterOptInEmail} from "../lib/email-templates.server.ts";
import {deliverDue} from "../lib/mail-outbox.server.ts";
type Result={ok:boolean;message:string};
export async function loader({context}:{context:AppLoadContext}){
 const env=context.cloudflare.env;
 return {ready:!!(env.DB&&env.RESEND_API_KEY&&env.EMAIL_FROM&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY),siteKey:env.TURNSTILE_SITE_KEY||""};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const e=context.cloudflare.env;
 const fail=(msg:string,status:number)=>Response.json({ok:false,message:msg} satisfies Result,{status});
 if(!e.DB||!e.RESEND_API_KEY||!e.EMAIL_FROM||!e.TURNSTILE_SECRET_KEY||!e.TURNSTILE_SITE_KEY)return fail("Newsletter sign-up is unavailable.",503);
 if(Number(request.headers.get("content-length"))>4096)return fail("Request too large.",413);
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return fail("Invalid origin.",403);
 let form:FormData;try{form=await request.formData();}catch{return fail("Invalid form.",400);}
 const email=String(form.get("email")||"").trim().toLowerCase(),token=String(form.get("cf-turnstile-response")||"");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return fail("Enter a valid email address.",400);
 if(!token||token.length>2048)return fail("Complete the verification.",400);
 try{
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:e.TURNSTILE_SECRET_KEY,response:token})});
  const x=await r.json() as {success?:boolean;hostname?:string};
  if(!x.success||x.hostname!==new URL(request.url).hostname)return fail("Verification failed.",403);
 }catch{return fail("Verification unavailable.",503);}
 const present=await e.DB.prepare("SELECT status FROM newsletter_subscribers WHERE email=?").bind(email).first<{status:string}>();
 if(present?.status==="active")return Response.json({ok:true,message:"If you have a subscription, it is already active."} satisfies Result);
 const key=crypto.randomUUID(),assetOrigin=e.SITE_URL||new URL(request.url).origin;
 try{
  const message=newsletterOptInEmail({recipient:email,confirmUrl:assetOrigin+"/newsletter/confirm?token="+encodeURIComponent(key),assetOrigin});
  const payload=JSON.stringify(message);
  if(payload.length>35000)throw Error("Email too large");
  await e.DB.batch([
   e.DB.prepare("INSERT INTO newsletter_subscribers(email,status,token) VALUES(?,'pending',?) ON CONFLICT(email) DO UPDATE SET status='pending',token=excluded.token,subscribed_at=NULL,unsubscribed_at=NULL").bind(email,key),
   e.DB.prepare("INSERT INTO email_outbox(id,kind,recipient,payload) VALUES(?,?,?,?)").bind("newsletter-optin:"+key,message.type,email,payload)
  ]);
  context.cloudflare.ctx.waitUntil(deliverDue(e,3).catch(()=>({sent:0,failed:0})));
  return Response.json({ok:true,message:"Check your inbox and confirm your subscription. We will not send newsletters until you confirm."} satisfies Result);
 }catch{console.error("Newsletter opt-in could not be queued");return fail("We could not send a confirmation email. Please try again.",503);}
}
export default function Newsletter(){
 const {ready,siteKey}=useLoaderData<typeof loader>(),data=useActionData() as Result|undefined;
 return <main style={{background:"#F4F5F1",minHeight:"100vh",fontFamily:"Figtree,Arial,sans-serif",color:"#1E272A",padding:"48px 20px"}}>
 <section style={{maxWidth:620,margin:"0 auto"}}><a href="/" style={{fontWeight:700,letterSpacing:"0.18em",textDecoration:"none",color:"#1E272A"}}>HUMMIN</a>
 <p style={{marginTop:70,fontSize:12,letterSpacing:2,textTransform:"uppercase",color:"#B5532C"}}>Notes from HUMMIN</p>
 <h1 style={{fontFamily:"Newsreader,Georgia,serif",fontSize:"clamp(38px,6vw,64px)",fontWeight:400,lineHeight:1.1}}>A useful note, occasionally.</h1>
 <p style={{fontSize:17,lineHeight:1.7,color:"#434F4F"}}>Ideas and practical observations about running and growing a business. No automatic subscription when you contact us or take the assessment.</p>
 {data&&<p role="status" style={{color:data.ok?"#2E6B5C":"#B5532C"}}>{data.message}</p>}
 {!ready?<p>Newsletter subscriptions are not accepting requests. Email <a href="mailto:sales@hummin.org">sales@hummin.org</a>.</p>:!data?.ok?<Form method="post" style={{display:"grid",gap:18}}>
 <label style={{display:"grid",gap:8,fontWeight:600}}>Email address<input required type="email" name="email" maxLength={254} autoComplete="email" style={{font:"inherit",padding:15,border:"1px solid #BAC4BE",borderRadius:6,background:"#FFFFFF"}}/></label>
 <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light"/>
 <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer/>
 <button type="submit" style={{background:"#B5532C",color:"#FFFFFF",font:"inherit",padding:"16px 22px",border:0,borderRadius:99,fontWeight:600,cursor:"pointer"}}>Request subscription</button>
 <small>You will receive a confirmation email. We only send Notes from HUMMIN after you confirm, and every edition includes an unsubscribe link.</small>
 </Form>:null}
 <p style={{marginTop:45}}><a href="/" style={{color:"#B5532C"}}>Back to HUMMIN</a></p></section></main>;
}
