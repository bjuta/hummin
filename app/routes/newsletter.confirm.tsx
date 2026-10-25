import {Form,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
type Result={ok:boolean;message:string};
const key=(request:Request)=>new URL(request.url).searchParams.get("token")||"";
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const token=key(request);const db=context.cloudflare.env.DB;
 if(!db||!/^[0-9a-f-]{36}$/.test(token))return {valid:false,token};
 const sub=await db.prepare("SELECT status FROM newsletter_subscribers WHERE token=?").bind(token).first<{status:string}>();
 return {valid:sub?.status==="pending",token};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const token=key(request);const db=context.cloudflare.env.DB;
 if(!db||!/^[0-9a-f-]{36}$/.test(token))return Response.json({ok:false,message:"Confirmation link is invalid."} satisfies Result,{status:400});
 const updated=await db.prepare("UPDATE newsletter_subscribers SET status='active',subscribed_at=CURRENT_TIMESTAMP,unsubscribed_at=NULL WHERE token=? AND status='pending'").bind(token).run();
 return Response.json({ok:updated.meta?.changes===1,message:updated.meta?.changes===1?"Your subscription is confirmed.":"This confirmation link is no longer active."} satisfies Result);
}
export default function Confirm(){
 const data=useLoaderData<typeof loader>(),result=useActionData() as Result|undefined;
 return <main style={{fontFamily:"Figtree,Arial,sans-serif",background:"#F4F5F1",padding:"8vw",minHeight:"100vh",color:"#1E272A"}}><div style={{maxWidth:600,margin:"auto"}}>
 <p style={{letterSpacing:3,fontWeight:700}}>HUMMIN</p><h1 style={{fontFamily:"Newsreader,Georgia,serif",fontSize:48,fontWeight:400}}>Confirm your subscription.</h1>
 {result?<p role="status">{result.message}</p>:data.valid?<Form method="post"><p>Confirm that you want to receive Notes from HUMMIN. You can unsubscribe from any edition.</p><button style={{background:"#B5532C",color:"white",border:0,borderRadius:30,padding:"14px 28px",cursor:"pointer"}}>Confirm subscription</button></Form>:<p>This confirmation link has expired or has already been used.</p>}
 <p><a href="/" style={{color:"#B5532C"}}>Return to HUMMIN</a></p></div></main>;
}
