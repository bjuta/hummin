import {Form,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
type Result={ok:boolean;message:string};
const tokenFrom=(request:Request)=>new URL(request.url).searchParams.get("token")||"";
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const token=tokenFrom(request),db=context.cloudflare.env.DB;
 if(!db||!/^[0-9a-f-]{36}$/.test(token))return {valid:false};
 const row=await db.prepare("SELECT status FROM newsletter_subscribers WHERE token=?").bind(token).first<{status:string}>();
 return {valid:row?.status==="active"};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const token=tokenFrom(request),db=context.cloudflare.env.DB;
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return Response.json({ok:false,message:"Invalid origin."},{status:403});
 if(!db||!/^[0-9a-f-]{36}$/.test(token))return Response.json({ok:false,message:"Invalid link."},{status:400});
 await db.prepare("UPDATE newsletter_subscribers SET status='unsubscribed',unsubscribed_at=CURRENT_TIMESTAMP WHERE token=? AND status='active'").bind(token).run();
 await db.prepare("DELETE FROM email_outbox WHERE kind='newsletter-monthly' AND status IN ('pending','failed') AND recipient IN (SELECT email FROM newsletter_subscribers WHERE token=?)").bind(token).run();
 return Response.json({ok:true,message:"You have been unsubscribed from Notes from HUMMIN."} satisfies Result);
}
export default function Unsubscribe(){
 const {valid}=useLoaderData<typeof loader>(),result=useActionData() as Result|undefined;
 return <main style={{fontFamily:"Figtree,Arial,sans-serif",background:"#F4F5F1",padding:"8vw",minHeight:"100vh",color:"#1E272A"}}><div style={{maxWidth:600,margin:"auto"}}>
 <p style={{fontWeight:700,letterSpacing:3}}>HUMMIN</p><h1 style={{fontFamily:"Newsreader,Georgia,serif",fontSize:48,fontWeight:400}}>Manage Notes from HUMMIN.</h1>
 {result?<p role="status">{result.message}</p>:valid?<Form method="post"><p>Stop receiving future newsletters from HUMMIN. Your transactional emails, such as replies to enquiries and bookings, are separate.</p><button style={{background:"#B5532C",color:"white",border:0,borderRadius:30,padding:"14px 28px",cursor:"pointer"}}>Unsubscribe</button></Form>:<p>This link is no longer active, or your subscription has already ended.</p>}
 <p><a href="/" style={{color:"#B5532C"}}>Return to HUMMIN</a></p></div></main>;
}
