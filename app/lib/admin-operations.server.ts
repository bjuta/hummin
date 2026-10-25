import type {HumminEnv} from "../../workers/app.ts";
import type {AdminUser} from "./admin-permissions.ts";
const isId=(v:string)=>/^[a-f0-9-]{8,64}$/i.test(v);
const safe=(f:FormData,k:string,max:number)=>String(f.get(k)||"").trim().slice(0,max+1);
const audit=(env:HumminEnv,u:AdminUser,op:string,resource:string,id:string)=>env.DB!.prepare("INSERT INTO admin_audit(id,actor_id,operation,resource_type,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),u.id,op,resource,id);
export async function operationsData(env:HumminEnv,u:AdminUser,view:string,selected:string){
 if(!env.DB)return {records:[],details:[]};
 const db=env.DB;
 if(view==="clients"&&(u.role==="owner"||u.role==="sales")){
  const clients=await db.prepare("SELECT id,name,contact_name,contact_email,status,created_at FROM admin_clients ORDER BY updated_at DESC LIMIT 100").all();
  const engagements=await db.prepare("SELECT e.id,e.client_id,e.title,e.kind,e.status,e.summary,e.start_date,e.target_date,c.name client_name FROM admin_engagements e JOIN admin_clients c ON c.id=e.client_id ORDER BY e.updated_at DESC LIMIT 150").all();
  const milestones=isId(selected)?await db.prepare("SELECT id,title,due_date,status FROM admin_milestones WHERE engagement_id=? ORDER BY created_at").bind(selected).all():null;
  return {records:clients.results||[],engagements:engagements.results||[],details:milestones?.results||[]};
 }
 if(view==="email"&&u.role==="owner"){
  const settings=await db.prepare("SELECT kind,subject,preheader,enabled,revision,updated_at FROM admin_email_template_settings ORDER BY kind").all();
  return {records:settings.results||[],details:[]};
 }
 if(view==="analytics"&&(u.role==="owner"||u.role==="sales")){
  const daily=await db.prepare("SELECT day,path,channel,views FROM web_analytics_daily WHERE day>=date('now','-90 days') ORDER BY day DESC,views DESC LIMIT 1000").all();
  const conversion=await db.prepare("SELECT (SELECT COUNT(*) FROM enquiries WHERE submitted_at>=datetime('now','-30 days')) AS enquiries,(SELECT COUNT(*) FROM assessment_deliveries WHERE created_at>=datetime('now','-30 days')) AS assessments,(SELECT COUNT(*) FROM booking_slots WHERE created_at>=datetime('now','-30 days') AND status='confirmed') AS bookings").first();
  return {records:daily.results||[],details:conversion?[conversion]:[]};
 }
 if(view==="settings"&&u.role==="owner"){
  const draft=await db.prepare("SELECT assumptions_json,weights_json,revision,updated_at FROM admin_assessment_drafts WHERE id=1").first();
  return {records:draft?[draft]:[],details:[]};
 }
 return {records:[],details:[]};
}
export async function operationsMutation(env:HumminEnv,u:AdminUser,op:string,id:string,form:FormData){
 if(!env.DB)return {ok:false,message:"Database unavailable"};
 const db=env.DB;
 if(op==="client_create"){
  if(!["owner","sales"].includes(u.role))return {ok:false,message:"Forbidden"};
  const name=safe(form,"name",160),contact=safe(form,"contact_name",120),email=safe(form,"contact_email",254);
  if(name.length<2||name.length>160||contact.length>120||email.length>254||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return {ok:false,message:"Check client details"};
  const key=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO admin_clients(id,name,contact_name,contact_email,created_by) VALUES(?,?,?,?,?)").bind(key,name,contact,email,u.id),
   audit(env,u,"client_create","client",key)
  ]);
  return {ok:true,id:key};
 }
 if(op==="engagement_create"){
  if(!["owner","sales"].includes(u.role))return {ok:false,message:"Forbidden"};
  const title=safe(form,"title",180),kind=safe(form,"kind",20),summary=safe(form,"summary",3000);
  if(!isId(id)||title.length<2||title.length>180||summary.length>3000||!["review","project","residency"].includes(kind))return {ok:false,message:"Invalid engagement"};
  if(!await db.prepare("SELECT id FROM admin_clients WHERE id=? AND status!='archived'").bind(id).first())return {ok:false,message:"Client not found"};
  const key=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO admin_engagements(id,client_id,title,kind,summary,created_by) VALUES(?,?,?,?,?,?)").bind(key,id,title,kind,summary,u.id),
   audit(env,u,"engagement_create","engagement",key)
  ]);
  return {ok:true,id:key};
 }
 if(op==="milestone_create"||op==="milestone_status"){
  if(!["owner","sales"].includes(u.role)||!isId(id))return {ok:false,message:"Forbidden"};
  if(!await db.prepare("SELECT id FROM admin_engagements WHERE id=?").bind(id).first())return {ok:false,message:"Engagement not found"};
  if(op==="milestone_create"){
   const title=safe(form,"title",180);
   if(title.length<2||title.length>180)return {ok:false,message:"Milestone title required"};
   const key=crypto.randomUUID();
   await db.batch([db.prepare("INSERT INTO admin_milestones(id,engagement_id,title,created_by) VALUES(?,?,?,?)").bind(key,id,title,u.id),audit(env,u,op,"milestone",key)]);
  }else{
   const milestone=safe(form,"milestone_id",64),status=safe(form,"status",24);
   if(!isId(milestone)||!["open","in_progress","done"].includes(status))return {ok:false,message:"Invalid milestone"};
   const result=await db.prepare("UPDATE admin_milestones SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND engagement_id=?").bind(status,milestone,id).run();
   if(!result.meta?.changes)return {ok:false,message:"Milestone not found"};
   await audit(env,u,op,"milestone",milestone).run();
  }
  return {ok:true,id};
 }
 if(op==="email_settings_save"){
  if(u.role!=="owner")return {ok:false,message:"Forbidden"};
  const kind=safe(form,"kind",60),subject=safe(form,"subject",180),preheader=safe(form,"preheader",200);
  const allowed=["contact-internal","contact-received","assessment-results","booking-confirmation","booking-reminder","account-sign-in","account-welcome","account-password-reset","newsletter-monthly","newsletter-opt-in","insights-download"];
  if(!allowed.includes(kind)||!subject||subject.length>180||preheader.length>200||/[\r\n]/.test(subject))return {ok:false,message:"Invalid template settings"};
  const old=await db.prepare("SELECT revision FROM admin_email_template_settings WHERE kind=?").bind(kind).first<{revision:number}>();
  const expected=Number(form.get("revision")||0);
  if((old?.revision||0)!==expected)return {ok:false,message:"Template was changed elsewhere. Reload and try again"};
  await db.batch([
   db.prepare("INSERT INTO admin_email_template_settings(kind,subject,preheader,enabled,revision,updated_by) VALUES(?,?,?,0,1,?) ON CONFLICT(kind) DO UPDATE SET subject=excluded.subject,preheader=excluded.preheader,revision=admin_email_template_settings.revision+1,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP").bind(kind,subject,preheader,u.id),
   audit(env,u,op,"email_template",kind)
  ]);
  return {ok:true,id:kind};
 }
 if(op==="assessment_draft_save"){
  if(u.role!=="owner")return {ok:false,message:"Forbidden"};
  const assumptions=safe(form,"assumptions_json",12000),weights=safe(form,"weights_json",12000);
  let a:unknown,w:unknown;
  try{a=JSON.parse(assumptions);w=JSON.parse(weights);}catch{return {ok:false,message:"Invalid assessment JSON"};}
  if(!a||typeof a!=="object"||Array.isArray(a)||!w||typeof w!=="object"||Array.isArray(w))return {ok:false,message:"Invalid assessment configuration"};
  const obj=a as Record<string,unknown>,wo=w as Record<string,unknown>;
  if(Object.keys(obj).length>30||Object.keys(wo).length>30||Object.values(obj).some(v=>typeof v!=="number"||!Number.isFinite(v)||v<0||v>1e9))return {ok:false,message:"Assumptions out of range"};
  const old=await db.prepare("SELECT revision FROM admin_assessment_drafts WHERE id=1").first<{revision:number}>();
  if((old?.revision||0)!==Number(form.get("revision")||0))return {ok:false,message:"A newer assessment draft exists"};
  await db.batch([
   db.prepare("INSERT INTO admin_assessment_drafts(id,assumptions_json,weights_json,revision,updated_by) VALUES(1,?,?,1,?) ON CONFLICT(id) DO UPDATE SET assumptions_json=excluded.assumptions_json,weights_json=excluded.weights_json,revision=admin_assessment_drafts.revision+1,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP").bind(assumptions,weights,u.id),
   audit(env,u,op,"assessment_config","1")
  ]);
  return {ok:true,id:"1"};
 }
 return {ok:false,message:"Unsupported operation"};
}
