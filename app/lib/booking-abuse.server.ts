import type {HumminEnv} from "../../workers/app.ts";
const RULES={slots:{seconds:600,limit:36},reserve:{seconds:3600,limit:8},email:{seconds:86400,limit:4}} as const;
const ip=(r:Request)=>r.headers.get("cf-connecting-ip")?.trim().slice(0,128)||"unknown";
async function hash(secret:string,value:string){
 const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function bookingLimit(e:HumminEnv,r:Request,kind:keyof typeof RULES,email?:string){
 if(!e.DB||!e.TURNSTILE_SECRET_KEY)throw Error("Booking rate limit unavailable");
 const rule=RULES[kind],now=Math.floor(Date.now()/1000),bucket=Math.floor(now/rule.seconds);
 const identity=kind==="email"?(email||"").trim().toLowerCase():ip(r);
 const key=await hash(e.TURNSTILE_SECRET_KEY,"booking:"+kind+":"+bucket+":"+identity);
 const row=await e.DB.prepare("INSERT INTO booking_rate_limits(key_hash,requests,expires_at) VALUES(?,1,?) ON CONFLICT(key_hash) DO UPDATE SET requests=requests+1 RETURNING requests").bind(key,new Date((bucket+1)*rule.seconds*1000).toISOString()).first<{requests:number}>();
 if(!row)throw Error("Booking quota update unavailable");
 return {ok:row.requests<=rule.limit,retryAfter:Math.max(1,(bucket+1)*rule.seconds-now)};
}
export async function verifyBookingTurnstile(e:HumminEnv,r:Request,token:string){
 if(!e.TURNSTILE_SECRET_KEY||!e.TURNSTILE_SITE_KEY||!token||token.length>2048)return false;
 try{
  const data=new URLSearchParams({secret:e.TURNSTILE_SECRET_KEY,response:token,remoteip:ip(r)});
  const res=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:data,signal:AbortSignal.timeout(10000)});
  if(!res.ok)return false;
  const result=await res.json() as {success?:boolean;hostname?:string;action?:string};
  return result.success===true&&result.hostname===new URL(r.url).hostname&&result.action==="hummin-booking";
 }catch{return false;}
}
export async function pruneBookingRateLimits(e:HumminEnv){
 if(e.DB)await e.DB.prepare("DELETE FROM booking_rate_limits WHERE expires_at<?").bind(new Date().toISOString()).run();
}
