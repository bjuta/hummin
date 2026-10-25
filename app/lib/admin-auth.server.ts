import type {HumminEnv} from "../../workers/app";
import {signInCodeEmail} from "./email-templates.server.ts";
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
