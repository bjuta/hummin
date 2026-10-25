import {Form,redirect,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {adminReady,completeAdminCode,correctOrigin,privateHeaders,sessionCookie} from "../lib/admin-auth.server.ts";
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const e=context.cloudflare.env;
 return {ready:adminReady(e),email:(new URL(request.url).searchParams.get("email")||"").slice(0,254)};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const e=context.cloudflare.env;
 const fail=(message:string)=>Response.json({ok:false,message},{status:400,headers:privateHeaders});
 if(!adminReady(e))return fail("Admin access is unavailable.");
 if(!correctOrigin(request))return fail("Invalid origin.");
 if(Number(request.headers.get("content-length"))>2048)return fail("Request too large.");
 const form=await request.formData();
 const email=String(form.get("email")||""),code=String(form.get("code")||"");
 const value=await completeAdminCode(e,email,code);
 if(!value)return fail("The code is incorrect or has expired. Request another code.");
 return redirect("/admin",{headers:{...privateHeaders,"Set-Cookie":sessionCookie(value)}});
}
export default function Verify(){
 const {email,ready}=useLoaderData<typeof loader>(),data=useActionData<typeof action>();
 return <section style={{minHeight:"82vh",display:"grid",placeItems:"center",background:"#F4F5F1",padding:24,fontFamily:"Figtree,Arial,sans-serif"}}>
 <div style={{maxWidth:460,width:"100%",padding:36,borderRadius:20,background:"#FFFFFF",border:"1px solid #D0D8D2"}}>
 <p style={{color:"#B5532C",fontWeight:700,letterSpacing:3}}>HUMMIN / VERIFY</p>
 <h1 style={{fontFamily:"Newsreader,Georgia,serif",fontSize:42,fontWeight:400}}>Enter your sign-in code.</h1>
 <p>For provisioned accounts, a six-digit code is sent by email. It expires after 10 minutes.</p>
 {ready?<Form method="post" style={{display:"grid",gap:16}}>
 <label>Email<input required name="email" type="email" defaultValue={email} autoComplete="email" style={{display:"block",width:"100%",padding:12}}/></label>
 <label>Six-digit code<input required name="code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" style={{display:"block",width:"100%",padding:12,letterSpacing:5,fontSize:22}}/></label>
 <button style={{border:0,borderRadius:30,padding:14,background:"#B5532C",color:"white",fontWeight:700}}>Verify and sign in</button>
 </Form>:<p>Admin access is not active.</p>}
 {data&&"message" in data?<p role="alert" style={{color:"#B5532C"}}>{data.message}</p>:null}
 <p><a href="/admin/login">Request another code</a></p>
 </div></section>;
}
