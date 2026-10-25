import {useEffect,useRef,useState} from "react";
import {Link,redirect,useActionData,useLoaderData,useNavigation,useSubmit} from "react-router";
import type {AppLoadContext} from "react-router";
import {adminReady,completeAdminCode,correctOrigin,privateHeaders,sessionCookie} from "../lib/admin-auth.server.ts";
import {AdminAuthCard} from "../components/admin-chrome.tsx";

export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const e=context.cloudflare.env;
 const query=new URL(request.url).searchParams;
 const issued=Number(query.get("issued"));
 // Client countdown is guidance, not the authority for expiry. D1 validates the actual code deadline.
 const requestedAt=Number.isSafeInteger(issued)&&issued>Date.now()-720000&&issued<Date.now()+30000?issued:null;
 return {ready:adminReady(e),email:(query.get("email")||"").slice(0,254),requestedAt};
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const e=context.cloudflare.env;
 const fail=(message:string,status=400)=>Response.json({ok:false,message},{status,headers:privateHeaders});
 if(!adminReady(e))return fail("Admin access is unavailable.",503);
 if(!correctOrigin(request))return fail("Invalid origin.",403);
 if(Number(request.headers.get("content-length"))>2048)return fail("Request too large.",413);
 let form:FormData;try{form=await request.formData();}catch{return fail("Invalid code request.");}
 const email=String(form.get("email")||""),code=String(form.get("code")||"");
 const session=await completeAdminCode(e,email,code);
 if(!session)return fail("That code is incorrect or has expired. Check the email or request a new code.");
 return redirect("/admin",{headers:{...privateHeaders,"Set-Cookie":sessionCookie(session)}});
}
function displayTime(seconds:number){return Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");}
export default function Verify(){
 const {email,ready,requestedAt}=useLoaderData<typeof loader>();
 const result=useActionData() as {ok:boolean;message:string}|undefined;
 const submit=useSubmit(),navigation=useNavigation();
 const [code,setCode]=useState(""),[now,setNow]=useState(()=>Date.now());
 const [focused,setFocused]=useState(false);
 const submitted=useRef(""),field=useRef<HTMLInputElement>(null);
 const verifying=navigation.state!=="idle";
 const secondsLeft=requestedAt==null?null:Math.max(0,600-Math.floor((now-requestedAt)/1000));
 const expired=secondsLeft===0;
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return ()=>window.clearInterval(timer);},[]);
 useEffect(()=>{if(result?.message){setCode("");submitted.current="";field.current?.focus();}},[result]);
 function change(value:string){
  const next=value.replace(/\D/g,"").slice(0,6);
  setCode(next);
  if(next.length===6&&!expired&&ready&&!verifying&&submitted.current!==next){
   submitted.current=next;
   const payload=new FormData();
   payload.set("email",email);payload.set("code",next);
   submit(payload,{method:"post",action:"/admin/verify"});
  }
 }
 return <AdminAuthCard kicker="HUMMIN / IDENTITY VERIFICATION" title="Check your inbox." description="We requested a six-digit sign-in code for the staff address below. Enter it to continue to your HUMMIN workspace.">
 <div className="hm-status" role="status" aria-live="polite">
 <strong>Sign-in code requested</strong>
 <div style={{marginTop:5,overflowWrap:"anywhere"}}>If this is a registered staff address, a code has been sent to <strong>{email}</strong>.</div>
 <div style={{fontSize:12,marginTop:8}}>The code expires 10 minutes after issue.</div>
 </div>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:12,marginBottom:10}}>
 <span className="hm-label" style={{margin:0}}>Verification code</span>
 <span style={{fontSize:12,color:expired?"#9A4128":"#5E6967",fontWeight:700}} role="timer" aria-live="off">{secondsLeft==null?"Valid for 10 min":expired?"Code window ended":displayTime(secondsLeft)+" remaining"}</span>
 </div>
 {ready&&!expired?<div className="hm-otp-frame" onClick={()=>field.current?.focus()}>
 <div className="hm-otp-slots" aria-hidden="true">{Array.from({length:6},(_,i)=><span key={i} className={"hm-otp-slot"+(focused&&i===Math.min(code.length,5)?" hm-otp-active":"")}>{code[i]||""}</span>)}</div>
 <input ref={field} className="hm-otp-input" autoFocus id="admin-one-time-code" type="text" name="code" aria-label="Six-digit sign-in code" aria-describedby="hm-otp-guidance" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={code} onChange={e=>change(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
 </div>:<p className="hm-error" role="status">{expired?"Your code window has ended. Request a new code to sign in.":"Verification is not available right now."}</p>}
 <p id="hm-otp-guidance" style={{fontSize:12,color:"#5E6967",lineHeight:1.6,margin:0}}>{verifying?"Verifying securely…":"Paste or type all six digits. We’ll verify automatically—no extra button needed."}</p>
 {result?.message?<p className="hm-error" role="alert">{result.message}</p>:null}
 <div className="hm-auth-foot"><Link to={"/admin/login?email="+encodeURIComponent(email)}>← Change email / request new code</Link><Link to="/">HUMMIN website</Link></div>
 </AdminAuthCard>;
}
