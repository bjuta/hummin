import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import { enquiryNotification, enquiryAcknowledgement } from "../lib/enquiry-email.server";
import type { AppLoadContext } from "react-router";
import { enquiryNotification } from "../lib/enquiry-email.server";

type Result = { ok:boolean; message:string };
type Visitor = { name:string; businessName:string; email:string; message:string };
const clean = (value: FormDataEntryValue | null) => typeof value==="string" ? value.trim() : "";
export const meta=()=>[{title:"Contact HUMMIN · Discuss a Business Challenge"},{name:"description",content:"Tell HUMMIN about a challenge in your owner-led business."}];

function validate(form:FormData):Visitor | null {
 const v={name:clean(form.get("name")),businessName:clean(form.get("businessName")),email:clean(form.get("email")),message:clean(form.get("message"))};
 if(v.name.length<2||v.name.length>120||v.businessName.length<2||v.businessName.length>160||v.email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)||v.message.length<10||v.message.length>4000) return null;
 return v;
}
async function verifyTurnstile(secret:string,token:string,hostname:string):Promise<boolean>{
 if(!token||token.length>2048) return false;
 try {
  const data = new URLSearchParams({secret,response:token});
  const res=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:data});
  if(!res.ok)return false;
  const body=await res.json() as {success?:boolean;hostname?:string};
  return body.success===true && body.hostname===hostname;
 }catch{return false;}
}
async function sendEmail(message:{recipient:string;subject:string;html:string;text:string;replyTo?:string},id:string,apiKey:string,from:string) {
 const res=await fetch("https://api.resend.com/emails",{
  method:"POST",
  headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":id},
  body:JSON.stringify({
   from,to:[message.recipient],reply_to:message.replyTo||"sales@hummin.org",
   subject:message.subject,html:message.html,text:message.text
  })
 });
 if(!res.ok)throw Error("Resend rejected the message ("+res.status+")");
 const body=await res.json() as {id?:string};
 if(!body.id)throw Error("Resend returned no message ID");
 return body.id;
}

export async function loader({context}:{context:AppLoadContext}){
 const env=context.cloudflare.env;
 return { formReady:!!(env.CONTACT_ENABLED==='true'&&env.DB&&env.RESEND_API_KEY&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY&&env.EMAIL_FROM), siteKey:env.TURNSTILE_SITE_KEY||"" };
}
export async function action({request,context}:{request:Request;context:AppLoadContext}):Promise<Response>{
 const env=context.cloudflare.env;
 const error=(message:string,status:number)=>Response.json({ok:false,message} satisfies Result,{status});
 if(env.CONTACT_ENABLED!=='true'||!env.DB||!env.RESEND_API_KEY||!env.TURNSTILE_SECRET_KEY||!env.TURNSTILE_SITE_KEY||!env.EMAIL_FROM)
  return error("Online enquiries are not configured yet. Please email sales@hummin.org.",503);
 if(request.headers.get("content-length")&&Number(request.headers.get("content-length"))>10000)return error("Message is too large.",413);
 const origin=request.headers.get("origin");
 if(origin){try{if(new URL(origin).origin!==new URL(request.url).origin)return error("Invalid submission origin.",403);}catch{return error("Invalid submission origin.",403);}}
 let form:FormData;
 try{form=await request.formData();}catch{return error("Invalid form submission.",400);}
 if(clean(form.get("website")))return error("We couldn't process this enquiry.",400);
 const visitor=validate(form);
 if(!visitor)return error("Please check your name, business, email and message.",400);
 const hostname=new URL(request.url).hostname;
 if(!await verifyTurnstile(env.TURNSTILE_SECRET_KEY,clean(form.get("cf-turnstile-response")),hostname))
   return error("Verification was unsuccessful. Please try again.",400);
 const id=crypto.randomUUID();
 try{
  await env.DB.prepare("INSERT INTO enquiries (id,name,business_name,email,message,status) VALUES (?,?,?,?,?,'pending')")
   .bind(id,visitor.name,visitor.businessName,visitor.email,visitor.message).run();
 }catch{
  console.error("Failed to persist HUMMIN enquiry");
  return error("We couldn't save your enquiry. Please email sales@hummin.org.",503);
 }
 try{
  const origin=env.SITE_URL||new URL(request.url).origin;
  const internal=enquiryNotification(visitor,id,origin,new Date());
  const providerId=await sendEmail(internal,id+":internal",env.RESEND_API_KEY,env.EMAIL_FROM);
  try{await env.DB.prepare("UPDATE enquiries SET status='accepted', provider_message_id=?, provider_accepted_at=CURRENT_TIMESTAMP WHERE id=?")
    .bind(providerId,id).run();}
  catch{console.error("Provider accepted enquiry but D1 status update failed",id);}
  // The internal enquiry is already safely stored and accepted.
  // A sender acknowledgement is helpful but must not falsely turn a successful enquiry into a failed one.
  try {
   const acknowledgement=enquiryAcknowledgement(visitor,origin);
   await sendEmail(acknowledgement,id+":sender",env.RESEND_API_KEY,env.EMAIL_FROM);
  }catch{console.error("Sender acknowledgement could not be accepted by the email provider",id);}
  return Response.json({ok:true,message:"Your enquiry has been accepted. HUMMIN will review it and respond using the contact details provided."} satisfies Result,{status:200});
 }catch{
  try{await env.DB.prepare("UPDATE enquiries SET status='failed' WHERE id=?").bind(id).run();}
  catch{console.error("Could not mark failed enquiry",id);}
  console.error("Notification service did not confirm acceptance",id);
  return error("We couldn't confirm delivery of your enquiry. Please email sales@hummin.org directly.",503);
 }
}
export default function Contact(){
 const {formReady,siteKey}=useLoaderData<typeof loader>();
 const result=useActionData() as Result|undefined;
 const navigation=useNavigation();
 const sending=navigation.state==="submitting";
 return <>
  <section className="inner-hero"><div className="wrap"><p className="eyebrow" style={{color:"#e7ebe6"}}>Contact</p><h1 className="h1">Discuss a business challenge.</h1><p className="lead">Tell us what you would like to work on. You do not need to know which discipline it falls under.</p></div></section>
  <section className="section wrap split">
   <div>
    <h2 className="h2">Start a conversation.</h2>
    {!formReady&&<p className="form-alert" role="status">The online form is not activated yet. Please contact HUMMIN directly by email. No test submissions are being accepted.</p>}
    {result&&<p className={result.ok?"form-success":"form-alert"} role="status">{result.message}</p>}
    {formReady&& !result?.ok &&<Form method="post" className="form">
      <div className="visually-hidden" aria-hidden="true"><label htmlFor="website">Leave this field blank</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
      <div className="field"><label htmlFor="name">Name *</label><input id="name" name="name" type="text" minLength={2} maxLength={120} autoComplete="name" required/></div>
      <div className="field"><label htmlFor="businessName">Business Name *</label><input id="businessName" name="businessName" type="text" minLength={2} maxLength={160} autoComplete="organization" required/></div>
      <div className="field"><label htmlFor="email">Work Email *</label><input id="email" name="email" type="email" maxLength={254} autoComplete="email" required/></div>
      <div className="field"><label htmlFor="message">What would you like to work on? *</label><textarea id="message" name="message" minLength={10} maxLength={4000} required/></div>
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer/>
      <button className="button button-dark" type="submit" disabled={sending}>{sending?"Sending…":"Send Enquiry"}</button>
      <p className="privacy-note">The details you provide are processed to respond to your enquiry. Our full privacy notice is being finalised. For now, you can also <a href="mailto:sales@hummin.org" style={{color:"#b5532c"}}>email us directly</a>.</p>
     </Form>}
    {result?.ok&&<Link className="button button-dark" to="/">Return home</Link>}
   </div>
   <aside><p className="eyebrow">Direct contact</p><h2 className="h3"><a style={{color:"#b5532c",overflowWrap:"anywhere"}} href="mailto:sales@hummin.org">sales@hummin.org</a></h2><p className="lead">Nairobi, Kenya</p><p className="muted">We review your note. If we can help, we'll suggest a first conversation.</p></aside>
  </section>
 </>;
}
