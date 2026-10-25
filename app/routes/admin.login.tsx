import {Form,redirect,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {adminReady,correctOrigin,privateHeaders,sendAdminCode,sessionUser} from "../lib/admin-auth.server.ts";

export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 if(await sessionUser(env,request))throw redirect("/admin");
 return {ready:adminReady(env)};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env;
 if(!adminReady(env))return Response.json({ok:false,message:"Staff access has not been activated."},{status:503,headers:privateHeaders});
 if(!correctOrigin(request))return Response.json({ok:false,message:"Invalid origin."},{status:403,headers:privateHeaders});
 if(Number(request.headers.get("content-length"))>2048)return Response.json({ok:false,message:"Request too large."},{status:413,headers:privateHeaders});
 const form=await request.formData(),email=String(form.get("email")||"").trim().toLowerCase();
 if(email.length>254||!email.includes("@"))return Response.json({ok:false,message:"Enter a valid email."},{status:400,headers:privateHeaders});
 try{await sendAdminCode(env,email,new URL(request.url).origin,p=>context.cloudflare.ctx.waitUntil(p));}
 catch{console.error("Unable to queue HUMMIN staff sign-in");}
 return redirect("/admin/verify?email="+encodeURIComponent(email),{headers:privateHeaders});
}
export default function AdminLogin(){
 const {ready}=useLoaderData<typeof loader>();
 const result=useActionData<typeof action>();
 return <section style={{minHeight:"82vh",display:"grid",placeItems:"center",background:"#F4F5F1",padding:24,fontFamily:"Figtree,Arial,sans-serif"}}>
 <div style={{maxWidth:460,width:"100%",background:"#FFFFFF",padding:36,borderRadius:20,border:"1px solid #D0D8D2"}}>
 <p style={{color:"#B5532C",letterSpacing:3,fontWeight:700,fontSize:12}}>HUMMIN / STAFF</p>
 <h1 style={{fontFamily:"Newsreader,Georgia,serif",fontSize:46,fontWeight:400}}>Sign in to Admin.</h1>
 <p style={{lineHeight:1.6,color:"#434F4F"}}>Invitation-only access for HUMMIN team members. We will email a one-time code to your registered address.</p>
 {!ready?<p role="status">Admin access is not activated on this preview.</p>:<Form method="post" style={{display:"grid",gap:15}}>
 <label>Email address<input required name="email" type="email" autoComplete="email" maxLength={254} style={{display:"block",width:"100%",padding:14,border:"1px solid #D0D8D2",marginTop:8}}/></label>
 <button style={{background:"#B5532C",color:"white",padding:15,border:0,borderRadius:30,fontWeight:700}}>Send sign-in code</button>
 </Form>}
 {result?<p role="alert">Sign-in request could not be completed.</p>:null}
 </div></section>;
}
