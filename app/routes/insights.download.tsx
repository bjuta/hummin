import {Form,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {insightsDownloadEmail} from "../lib/email-templates.server.ts";
import {queueEmail,deliverDue} from "../lib/mail-outbox.server.ts";
type Result={ok:boolean;message:string};
const valid=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 const email=new URL(request.url).searchParams.get("email")||"";
 return {prefill:email.slice(0,254),ready:!!(env.DB&&env.RESEND_API_KEY&&env.EMAIL_FROM&&env.TURNSTILE_SECRET_KEY&&env.TURNSTILE_SITE_KEY),siteKey:env.TURNSTILE_SITE_KEY||""};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 const fail=(message:string,status=400)=>Response.json({ok:false,message} satisfies Result,{status,headers:{"Cache-Control":"no-store"}});
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM||!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY)return fail("Download email is unavailable. Please try again later.",503);
 if(new URL(request.url).pathname!=="/insights/download/monday-template")return fail("Unknown resource.",404);
 if(Number(request.headers.get("content-length"))>4096)return fail("Request too large.",413);
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return fail("Invalid submission origin.",403);
 let data:FormData;try{data=await request.formData();}catch{return fail("Invalid form.");}
 const email=String(data.get("email")||"").trim().toLowerCase(),token=String(data.get("cf-turnstile-response")||"");
 if(!valid(email))return fail("Enter a valid email address.");
 if(!token||token.length>2048)return fail("Complete the verification.");
 try{
  const res=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token})});
  const body=await res.json() as {success?:boolean;hostname?:string};
  if(!body.success||body.hostname!==new URL(request.url).hostname)return fail("Verification unsuccessful.",403);
 }catch{return fail("Verification is temporarily unavailable.",503);}
 const assetOrigin=env.SITE_URL||new URL(request.url).origin;
 const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(email+"|monday-template|"+new Date().toISOString().slice(0,10)));
 const digest=Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
 try{
  await queueEmail(env,"insights-download:"+digest,insightsDownloadEmail({recipient:email,assetOrigin,downloadUrl:assetOrigin+"/downloads/monday-figures.xlsx"}));
  context.cloudflare.ctx.waitUntil(deliverDue(env,3).catch(()=>({sent:0,failed:0})));
  return Response.json({ok:true,message:"Your editable workbook has been queued for delivery. Check your email."} satisfies Result,{headers:{"Cache-Control":"no-store"}});
 }catch{console.error("Insights workbook request could not be queued");return fail("We could not queue the email. Please try again.",503);}
}
export default function Download(){
 const {prefill,ready,siteKey}=useLoaderData<typeof loader>(),state=useActionData() as Result|undefined;
 return <main style={{background:"#F4F5F1",color:"#1E272A",fontFamily:"Figtree,Arial,sans-serif",minHeight:"100vh",padding:"48px 20px"}}>
 <section style={{maxWidth:680,margin:"auto"}}><a href="/insights" style={{fontWeight:700,color:"#1E272A",letterSpacing:"0.16em",textDecoration:"none"}}>HUMMIN</a>
 <p style={{marginTop:72,fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:"#B5532C"}}>INSIGHTS / FREE TEMPLATE</p>
 <h1 style={{fontFamily:"Newsreader,Georgia,serif",fontWeight:400,fontSize:"clamp(38px,5vw,60px)",lineHeight:1.05}}>Five figures every Monday.</h1>
 <p style={{fontSize:18,lineHeight:1.6,color:"#434F4F"}}>An editable Excel workbook to record your weekly sales, enquiries, cash balance, overdue receivables, and the bottleneck that matters most. Works with Excel and Google Sheets.</p>
 {state&&<p role="status" style={{color:state.ok?"#2E6B5C":"#B5532C"}}>{state.message}</p>}
 {ready&&!state?.ok?<Form method="post" style={{display:"grid",gap:20,maxWidth:450}}>
 <label style={{display:"grid",gap:8,fontWeight:600}}>Email address<input required name="email" type="email" maxLength={254} defaultValue={prefill} style={{padding:14,font:"inherit",border:"1px solid #BAC4BE",borderRadius:5}}/></label>
 <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light"/><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer/>
 <button type="submit" style={{background:"#B5532C",color:"white",border:0,borderRadius:99,padding:"14px 24px",fontWeight:700,fontSize:15,cursor:"pointer"}}>Email me the workbook</button>
 <small>This is a one-off download email, not a newsletter subscription.</small></Form>:!ready?<p>The email service is not available right now.</p>:null}
 <p style={{marginTop:50}}><a href="/insights/five-monday-figures" style={{color:"#B5532C"}}>Read the original guide</a></p></section></main>;
}
