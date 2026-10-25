import {useState} from "react";
import {Form,Link} from "react-router";
import type {ReactNode} from "react";

const palette={slate:"#1E272A",mist:"#F4F5F1",line:"#D0D8D2",ember:"#B5532C",muted:"#5E6967"};
export const adminCss = `
.hm-admin-scope{min-height:100vh;background:#F4F5F1;color:#1E272A;font:14px/1.5 Figtree,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.hm-admin-scope *{box-sizing:border-box}
.hm-admin-scope a{color:#B5532C;text-decoration:none}
.hm-admin-scope button,.hm-admin-scope input,.hm-admin-scope textarea,.hm-admin-scope select{font:inherit}
.hm-admin-scope :focus-visible{outline:2px solid #B5532C;outline-offset:3px}
.hm-admin-top{position:sticky;top:0;z-index:35;background:rgba(244,245,241,.96);backdrop-filter:blur(12px);border-bottom:1px solid #D0D8D2}
.hm-admin-top-inner{display:flex;align-items:center;gap:12px;padding:10px clamp(16px,3vw,32px);min-height:68px}
.hm-menu-button{width:44px;height:44px;border-radius:50%;border:1px solid #D0D8D2;background:#fff;display:grid;place-items:center;cursor:pointer;flex-shrink:0;color:#1E272A}
.hm-menu-button:hover{background:#E7EBE6}
.hm-brand{display:flex;align-items:center;gap:10px;color:#1E272A!important;font-weight:600;letter-spacing:.18em;font-size:13px}
.hm-mark{width:38px;height:38px;border-radius:50%;border:1.5px solid #1E272A;display:grid;place-items:center;font:400 26px Newsreader,Georgia,serif;letter-spacing:0}
.hm-admin-tag{font-size:11px;font-weight:700;letter-spacing:0;padding:3px 9px;border-radius:100px;background:#1E272A;color:#F4F5F1}
.hm-menu-backdrop{position:fixed;inset:68px 0 0;background:rgba(30,39,42,.25);z-index:29;border:0;cursor:default}
.hm-menu-popover{position:absolute;z-index:36;top:calc(100% + 8px);left:clamp(8px,2vw,24px);width:min(320px,calc(100vw - 16px));max-height:calc(100vh - 90px);overflow:auto;padding:10px;background:#fff;border:1px solid #D0D8D2;border-radius:20px;box-shadow:0 24px 48px rgba(30,39,42,.18);display:grid;gap:2px}
.hm-menu-popover a{display:flex;align-items:center;gap:12px;min-height:44px;padding:0 12px;border-radius:10px;font-size:14px;color:#1E272A;font-weight:500}
.hm-menu-popover a:hover,.hm-menu-popover a[aria-current=page]{background:#E7EBE6}
.hm-menu-popover .hm-menu-icon{width:18px;height:18px;display:grid;place-items:center;opacity:.8}
.hm-admin-action{border:1px solid #D0D8D2;background:white;border-radius:999px;padding:9px 16px;font-weight:600;cursor:pointer;color:#1E272A}
.hm-admin-action:hover{background:#E7EBE6}
.hm-auth-main{min-height:calc(100vh - 68px);display:grid;place-items:center;padding:clamp(24px,5vw,56px) 16px 64px}
.hm-auth-card{background:#FFFFFF;width:min(100%,460px);border:1px solid #D0D8D2;border-radius:20px;padding:clamp(25px,4vw,40px);box-shadow:0 10px 35px rgba(30,39,42,.04)}
.hm-kicker{color:#B5532C!important;letter-spacing:.12em;text-transform:uppercase;font-size:11px!important;font-weight:700!important;margin:0 0 12px}
.hm-auth-title{font:400 clamp(35px,5vw,46px)/1.06 Newsreader,Georgia,serif;margin:0 0 18px;letter-spacing:-.015em}
.hm-auth-copy{font-size:14px;color:#5E6967;line-height:1.65;margin:0 0 24px}
.hm-label{font-size:13px;font-weight:600;display:block;margin-bottom:7px}
.hm-field{width:100%;height:50px;border:1px solid #D0D8D2;background:#FFFFFF;border-radius:11px;padding:13px 15px;outline-offset:3px;color:#1E272A}
.hm-field:focus{border-color:#B5532C;box-shadow:0 0 0 3px rgba(181,83,44,.12)}
.hm-primary{display:flex;justify-content:center;align-items:center;gap:10px;width:100%;min-height:48px;padding:12px 18px;background:#B5532C;color:#fff;border:0;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer}
.hm-primary:hover{background:#9d4625}.hm-primary:disabled{opacity:.65;cursor:wait}
.hm-status{padding:16px;border:1px solid #B8D3C6;border-radius:12px;background:#EFF6F2;color:#28594A;margin-bottom:20px;font-size:14px;line-height:1.55}
.hm-error{padding:13px 15px;border:1px solid #E1B1A1;border-radius:12px;background:#FFF4F0;color:#8A3119;margin:16px 0;font-size:13px}
.hm-otp-frame{position:relative;height:58px;margin:13px 0 12px;cursor:text}
.hm-otp-slots{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;height:100%;pointer-events:none}
.hm-otp-slot{display:flex;align-items:center;justify-content:center;border:1px solid #D0D8D2;border-radius:10px;background:white;color:#1E272A;font-size:25px;font-weight:600;transition:border-color .15s,box-shadow .15s}
.hm-otp-frame:focus-within .hm-otp-slot{border-color:#B5532C}
.hm-otp-frame:focus-within .hm-otp-slot.hm-otp-active{box-shadow:0 0 0 3px rgba(181,83,44,.15)}
.hm-otp-input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:text}
.hm-auth-foot{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-top:1px solid #E7EBE6;margin-top:22px;padding-top:18px;font-size:13px}
.hm-auth-foot a{font-weight:600}
@media(max-width:450px){.hm-otp-slots{gap:6px}.hm-otp-slot{font-size:22px}.hm-admin-top-inner{gap:8px}.hm-admin-tag{display:none}}
@media(prefers-reduced-motion:reduce){.hm-admin-scope *{transition:none!important}}
`;

export function AdminChrome({children,menuItems=[],current="",userName,signOut=false}:{children:ReactNode;menuItems?:{id:string;label:string;href:string}[];current?:string;userName?:string;signOut?:boolean}){
 const [open,setOpen]=useState(false);
 return <div className="hm-admin-scope"><style>{adminCss}</style>
 <header className="hm-admin-top"><div className="hm-admin-top-inner">
 {menuItems.length?<button type="button" className="hm-menu-button" aria-label={open?"Close Admin menu":"Open Admin menu"} aria-expanded={open} aria-controls="hm-admin-menu" onClick={()=>setOpen(v=>!v)}><span aria-hidden="true" style={{fontSize:19,lineHeight:1}}>{open?"×":"☰"}</span></button>:null}
 <Link to="/admin" className="hm-brand" aria-label="HUMMIN Admin home"><img src="/email/mark-dark.png" width={38} height={38} alt="" style={{width:38,height:38,objectFit:"contain"}}/><span>HUMMIN</span><span className="hm-admin-tag">Admin</span></Link>
 <span style={{flex:1}}/>
 {userName?<span aria-label={"Signed in as "+userName} title={userName} style={{width:36,height:36,borderRadius:"50%",background:"#1E272A",color:"#F4F5F1",fontWeight:700,fontSize:12,display:"grid",placeItems:"center",flexShrink:0}}>{userName.split(/\s+/).map(w=>w[0]).join("").slice(0,2).toUpperCase()}</span>:<span style={{fontSize:12,color:"#5E6967"}}>Secure staff access</span>}
 {signOut?<Form method="post" action="/admin/logout"><button className="hm-admin-action" type="submit">Sign out</button></Form>:null}
 </div>
 {open?<><button type="button" className="hm-menu-backdrop" aria-label="Close Admin menu" onClick={()=>setOpen(false)}/><nav className="hm-menu-popover" id="hm-admin-menu" aria-label="Admin">
 {menuItems.map((m,i)=><Link key={m.id} to={m.href} aria-current={m.id===current?"page":undefined} onClick={()=>setOpen(false)}><span className="hm-menu-icon" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>{m.label}</Link>)}
 <span style={{margin:"8px 12px 4px",paddingTop:12,borderTop:"1px solid #E7EBE6",color:"#5E6967",fontSize:12}}>Next round: Invoices, Reports, Assessment settings</span>
 </nav></>:null}</header>{children}</div>;
}
export function AdminAuthCard({kicker,title,description,children}:{kicker:string;title:string;description:string;children:ReactNode}){
 return <AdminChrome><main className="hm-auth-main" id="admin-content"><section className="hm-auth-card" aria-label="HUMMIN Admin authentication"><p className="hm-kicker">{kicker}</p><h1 className="hm-auth-title">{title}</h1><p className="hm-auth-copy">{description}</p>{children}</section></main></AdminChrome>;
}
