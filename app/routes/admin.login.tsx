import {Form,redirect,useActionData,useLoaderData,useNavigation} from "react-router";
import type {AppLoadContext} from "react-router";
import {adminReady,correctOrigin,privateHeaders,sendAdminCode,sessionUser} from "../lib/admin-auth.server.ts";
import {AdminAuthCard} from "../components/admin-chrome.tsx";

export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 if(await sessionUser(env,request))throw redirect("/admin");
 const prefill=(new URL(request.url).searchParams.get("email")||"sales@hummin.org").slice(0,254);
 return {ready:adminReady(env),prefill};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 const fail=(message:string,status:number)=>Response.json({ok:false,message},{status,headers:privateHeaders});
 if(!adminReady(env))return fail("Staff sign-in is unavailable.",503);
 if(!correctOrigin(request))return fail("Invalid request origin.",403);
 if(Number(request.headers.get("content-length"))>2048)return fail("Request too large.",413);
 let form:FormData;
 try{form=await request.formData();}catch{return fail("Invalid request.",400);}
 const email=String(form.get("email")||"").trim().toLowerCase();
 if(email.length>254||!/^([^\s@]+)@([^\s@]+)\.([^\s@]+)$/.test(email))return fail("Enter a valid email address.",400);
 try{await sendAdminCode(env,email,new URL(request.url).origin,p=>context.cloudflare.ctx.waitUntil(p));}
 catch{console.error("HUMMIN Admin sign-in email could not be queued");return fail("We couldn't prepare a sign-in email right now. Please try again.",503);}
 // A non-enumerating response: the same screen appears for known and unknown staff addresses.
 return redirect("/admin/verify?email="+encodeURIComponent(email)+"&issued="+Date.now(),{headers:privateHeaders});
}
export default function AdminLogin(){
 const {ready,prefill}=useLoaderData<typeof loader>();
 const response=useActionData() as {message?:string}|undefined;
 const navigation=useNavigation(),sending=navigation.state==="submitting";
 return <AdminAuthCard kicker="HUMMIN / STAFF ACCESS" title="Welcome back." description="Sign in to your HUMMIN workspace using a secure, one-time code. Access is available to invited team members only.">
 {!ready?<p role="status" className="hm-error">Staff access is not currently available.</p>:<Form method="post" style={{display:"grid",gap:19}}>
 <div><label className="hm-label" htmlFor="admin-email">Work email</label><input id="admin-email" className="hm-field" name="email" type="email" autoComplete="username email" defaultValue={prefill} required maxLength={254}/></div>
 <button className="hm-primary" type="submit" disabled={sending}>{sending?"Preparing your code…":"Send sign-in code"}<span aria-hidden="true">→</span></button>
 </Form>}
 {response?.message?<p className="hm-error" role="alert">{response.message}</p>:null}
 <p style={{fontSize:12,color:"#5E6967",lineHeight:1.6,margin:"20px 0 0"}}>For security, codes expire 10 minutes after issue and can be used only once.</p>
 <div className="hm-auth-foot"><a href="/">← HUMMIN website</a><a href="mailto:sales@hummin.org">Need help?</a></div>
 </AdminAuthCard>;
}
