import {Form,redirect,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {privateHeaders,sessionUser} from "../lib/admin-auth.server.ts";
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const e=context.cloudflare.env,u=await sessionUser(e,request);
 if(!u)throw redirect("/admin/login");
 const manage=u.role==="owner"||u.role==="sales";
 const counts:Record<string,number>={};
 if(manage&&e.DB){
  const r=await e.DB.prepare("SELECT (SELECT COUNT(*) FROM enquiries) AS enquiries,(SELECT COUNT(*) FROM booking_slots WHERE status='confirmed') AS bookings,(SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active') AS subscribers,(SELECT COUNT(*) FROM email_outbox WHERE status='failed') AS failed_email").first<{enquiries:number;bookings:number;subscribers:number;failed_email:number}>();
  counts.enquiries=r?.enquiries||0;counts.bookings=r?.bookings||0;counts.subscribers=r?.subscribers||0;counts.failed_email=r?.failed_email||0;
 }
 return Response.json({name:u.name,role:u.role,manage,counts},{headers:privateHeaders});
}
export default function AdminHome(){
 const {name,role,manage,counts}=useLoaderData<typeof loader>();
 return <section style={{minHeight:"85vh",background:"#F4F5F1",padding:"clamp(24px,5vw,76px)",fontFamily:"Figtree,Arial,sans-serif",color:"#1E272A"}}>
 <div style={{maxWidth:1100,margin:"auto"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap"}}>
 <p style={{letterSpacing:3,color:"#B5532C",fontSize:12,fontWeight:700}}>HUMMIN / ADMIN</p>
 <Form method="post" action="/admin/logout"><button style={{background:"#1E272A",color:"white",border:0,borderRadius:24,padding:"10px 18px"}}>Sign out</button></Form>
 </div>
 <h1 style={{fontFamily:"Newsreader,Georgia,serif",fontWeight:400,fontSize:"clamp(38px,5vw,64px)"}}>Welcome, {name}.</h1>
 <p style={{fontSize:17,lineHeight:1.6}}>Authenticated staff access · {role} permissions.</p>
 {manage?<><h2 style={{marginTop:36,fontFamily:"Newsreader,Georgia,serif",fontWeight:400,fontSize:32}}>Live operations snapshot.</h2>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14}}>
 {([["Enquiries",counts.enquiries],["Confirmed bookings",counts.bookings],["Newsletter subscribers",counts.subscribers],["Emails requiring review",counts.failed_email]] as const).map(([label,n])=>
 <div key={label} style={{padding:25,border:"1px solid #D0D8D2",background:"white",borderRadius:15}}><p style={{fontSize:13,color:"#434F4F"}}>{label}</p><strong style={{fontFamily:"Newsreader,Georgia,serif",fontSize:46,fontWeight:400}}>{n}</strong></div>)}
 </div></>:<p>Your account is active. Operational dashboards will appear when the corresponding permissions and modules are connected.</p>}
 <div style={{borderTop:"1px solid #D0D8D2",marginTop:45,paddingTop:24,maxWidth:750}}>
 <h2 style={{fontFamily:"Newsreader,Georgia,serif",fontSize:30,fontWeight:400}}>Admin integration</h2>
 <p style={{lineHeight:1.7,color:"#434F4F"}}>This secure foundation uses real HUMMIN database counts, not the standalone prototype's sample records. Editing leads, messages, posts, templates, staff and permissions remains disabled until each action has real backend storage and an audit trail.</p>
 </div>
 </div></section>;
}
