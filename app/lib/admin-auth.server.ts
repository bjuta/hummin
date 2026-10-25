import type {HumminEnv} from "../../workers/app";
import {signInCodeEmail,staffAccountActivatedEmail} from "./email-templates.server.ts";
import {queueEmail} from "./mail-outbox.server.ts";
import {deliverDue} from "./mail-outbox.server.ts";

export type AdminUser={id:string;email:string;name:string;role:"owner"|"sales"|"editor"|"partner"|"staff";status:string};
export const adminReady=(e:HumminEnv)=>e.ADMIN_AUTH_ENABLED==="true"&&!!(e.DB&&e.ADMIN_AUTH_PEPPER&&e.RESEND_API_KEY&&e.EMAIL_FROM);
export const privateHeaders={"Cache-Control":"no-store","X-Frame-Options":"DENY","Referrer-Policy":"no-referrer"};
const COOKIE="__Host-hummin_admin",AGE=28800;
const validEmail=(x:string)=>x.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
export function correctOrigin(r:Request){const o=r.headers.get("origin");try{return !o||new URL(o).origin===new URL(r.url).origin;}catch{return false;}}
export const clearCookie=()=>COOKIE+"=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
export const sessionCookie=(v:string)=>COOKIE+"="+v+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+AGE;
const hex=(buffer:ArrayBuffer)=>Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,"0")).join("");
async function mac(env:HumminEnv,purpose:string,value:string){
 if(!env.ADMIN_AUTH_PEPPER)throw Error("Admin authentication not configured");
 const secret=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.ADMIN_AUTH_PEPPER),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 return hex(await crypto.subtle.sign("HMAC",secret,new TextEncoder().encode(purpose+":"+value)));
}
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
const code=()=>{const bytes=crypto.getRandomValues(new Uint32Array(1));return String(bytes[0]%1000000).padStart(6,"0");};
function cookieValue(request:Request){
 const v=request.headers.get("cookie")?.split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="))?.slice(COOKIE.length+1)||"";
 return /^[a-f0-9]{64}$/.test(v)?v:null;
}
export async function sessionUser(e:HumminEnv,r:Request):Promise<AdminUser|null>{
 if(!adminReady(e))return null;
 const value=cookieValue(r);if(!value)return null;
 return e.DB!.prepare("SELECT u.id,u.email,u.name,u.role,u.status FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND s.revoked_at IS NULL AND u.status='active'")
 .bind(await mac(e,"session",value),new Date().toISOString()).first<AdminUser>();
}
export async function revoke(e:HumminEnv,r:Request){
 const value=cookieValue(r);
 if(value&&adminReady(e))await e.DB!.prepare("UPDATE admin_sessions SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=?").bind(await mac(e,"session",value)).run();
}

export async function sendAdminCode(e:HumminEnv,emailInput:string,origin:string,wait:(p:Promise<unknown>)=>void){
 if(!adminReady(e))return;
 const email=emailInput.trim().toLowerCase();
 if(!validEmail(email))return;
 const user=await e.DB!.prepare("SELECT id,email,name,role,status FROM admin_users WHERE email=? AND status IN ('active','invited')").bind(email).first<AdminUser>();
 if(!user)return;
 const latest=await e.DB!.prepare("SELECT COUNT(*) n FROM admin_auth_challenges WHERE user_id=? AND created_at>datetime('now','-15 minutes')").bind(user.id).first<{n:number}>();
 if((latest?.n||0)>=3)return;
 const value=code(),id=crypto.randomUUID();
 const digest=await mac(e,"code:"+user.id,value);
 const message=signInCodeEmail({recipient:user.email,name:user.name,code:value,expiresMinutes:10,assetOrigin:origin});
 const payload=JSON.stringify(message);
 if(payload.length>35000)throw Error("Account email too large");
 await e.DB!.batch([
  e.DB!.prepare("UPDATE admin_auth_challenges SET used_at=CURRENT_TIMESTAMP WHERE user_id=? AND used_at IS NULL").bind(user.id),
  e.DB!.prepare("INSERT INTO admin_auth_challenges(id,user_id,code_hash,expires_at) VALUES(?,?,?,?)").bind(id,user.id,digest,new Date(Date.now()+600000).toISOString()),
  e.DB!.prepare("INSERT INTO email_outbox(id,kind,recipient,payload) VALUES(?,?,?,?)").bind("admin-login:"+id,message.type,message.recipient,payload)
 ]);
 wait(deliverDue(e,3).catch(()=>({sent:0,failed:1})));
}
export async function completeAdminCode(e:HumminEnv,emailInput:string,input:string):Promise<string|null>{
 if(!adminReady(e))return null;
 const email=emailInput.trim().toLowerCase(),value=input.trim();
 if(!validEmail(email)||!/^\d{6}$/.test(value))return null;
 const user=await e.DB!.prepare("SELECT id,email,name,role,status FROM admin_users WHERE email=? AND status IN ('invited','active')").bind(email).first<AdminUser>();
 if(!user)return null;
 const challenge=await e.DB!.prepare("SELECT id,code_hash FROM admin_auth_challenges WHERE user_id=? AND used_at IS NULL AND expires_at>? AND attempts<5 ORDER BY created_at DESC LIMIT 1").bind(user.id,new Date().toISOString()).first<{id:string;code_hash:string}>();
 if(!challenge)return null;
 const attempts=await e.DB!.prepare("UPDATE admin_auth_challenges SET attempts=attempts+1 WHERE id=? AND used_at IS NULL AND attempts<5 AND expires_at>?").bind(challenge.id,new Date().toISOString()).run();
 if(attempts.meta?.changes!==1)return null;
 if(await mac(e,"code:"+user.id,value)!==challenge.code_hash)return null;
 const consumed=await e.DB!.prepare("UPDATE admin_auth_challenges SET used_at=CURRENT_TIMESTAMP WHERE id=? AND used_at IS NULL AND attempts<=5").bind(challenge.id).run();
 if(consumed.meta?.changes!==1)return null;
 const session=token(),hash=await mac(e,"session",session);
 await e.DB!.batch([
  e.DB!.prepare("INSERT INTO admin_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(hash,user.id,new Date(Date.now()+AGE*1000).toISOString()),
  e.DB!.prepare("UPDATE admin_users SET status='active',verified_at=COALESCE(verified_at,CURRENT_TIMESTAMP) WHERE id=? AND status IN ('invited','active')").bind(user.id)
 ]);
 if(user.status==="invited"){
  try{
   const base=e.SITE_URL||"https://hummin.org";
   await queueEmail(e,"admin-welcome:"+user.id,staffAccountActivatedEmail({recipient:user.email,name:user.name,role:user.role,assetOrigin:base}));
  }catch{console.error("Staff activation succeeded but welcome email could not be queued");}
 }
 return session;
}
