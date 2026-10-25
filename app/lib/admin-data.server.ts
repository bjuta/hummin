import type {HumminEnv} from "../../workers/app.ts";
import {canView,type AdminView,type AdminUser} from "./admin-permissions.server.ts";

export type EnquiryRow={
 id:string;name:string;business_name:string;email:string;message:string;
 submitted_at:string;delivery_status:string;stage:string;assigned_user_id:string|null;updated_at:string|null;
};
const readEnquiries=(env:HumminEnv)=>
 env.DB!.prepare(`SELECT e.id,e.name,e.business_name,e.email,e.message,e.submitted_at,e.status AS delivery_status,
 COALESCE(w.stage,'new') AS stage,w.assigned_user_id,w.updated_at FROM enquiries e
 LEFT JOIN admin_enquiry_workflow w ON w.enquiry_id=e.id ORDER BY e.submitted_at DESC LIMIT 75`).all<EnquiryRow>();
export async function loadAdminView(env:HumminEnv,user:AdminUser,view:AdminView){
 if(!env.DB)throw new Error("Database is unavailable");
 if(!canView(user.role,view))return {restricted:true,records:[],counts:{}};
 const db=env.DB;
 if(view==="dash"){
  if(user.role!=="owner"&&user.role!=="sales")return {restricted:false,records:[],counts:{}};
  const totals=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM enquiries) enquiries,
    (SELECT COUNT(*) FROM assessment_deliveries) assessments,
    (SELECT COUNT(*) FROM booking_slots WHERE status='confirmed') bookings,
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE status='active') subscribers,
    (SELECT COUNT(*) FROM email_outbox WHERE status='failed') failed_email`).first<Record<string,number>>();
  const recent=await db.prepare("SELECT id,name,business_name,submitted_at,status FROM enquiries ORDER BY submitted_at DESC LIMIT 5").all();
  return {restricted:false,counts:totals||{},records:recent.results||[]};
 }
 if(view==="inbox"||view==="pipe")return {restricted:false,counts:{},records:(await readEnquiries(env)).results||[]};
 if(view==="leads"){
  const r=await db.prepare("SELECT id,name,business_name,email,score,goal,created_at,sent_at FROM assessment_deliveries ORDER BY created_at DESC LIMIT 75").all();
  return {restricted:false,counts:{},records:r.results||[]};
 }
 if(view==="book"){
  const r=await db.prepare(`SELECT b.id,b.start_utc,b.end_utc,b.name,b.email,b.phone,b.status,b.created_at,
    m.confirmation_queued,m.reminder_queued FROM booking_slots b
    LEFT JOIN booking_mail_meta m ON m.booking_id=b.id ORDER BY b.start_utc DESC LIMIT 75`).all();
  return {restricted:false,counts:{},records:r.results||[]};
 }
 if(view==="posts"){
  const {insightsPosts}=await import("./insights.server.ts");
  return {restricted:false,counts:{},records:insightsPosts.map(x=>({...x,publication:"bundled"}))};
 }
 if(view==="aud"){
  const subs=await db.prepare("SELECT email,status,subscribed_at,unsubscribed_at,created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 75").all();
  const cnt=await db.prepare("SELECT status,COUNT(*) AS total FROM newsletter_subscribers GROUP BY status").all();
  return {restricted:false,counts:{},records:subs.results||[],stats:cnt.results||[]};
 }
 if(view==="email"){
  const outbox=await db.prepare(`SELECT id,kind,recipient,status,attempts,created_at,sent_at,next_attempt_at,last_error
    FROM email_outbox ORDER BY created_at DESC LIMIT 75`).all();
  return {restricted:false,counts:{},records:outbox.results||[]};
 }
 if(view==="team"){
  const members=await db.prepare("SELECT id,name,email,role,status,verified_at,created_at FROM admin_users ORDER BY created_at DESC LIMIT 75").all();
  return {restricted:false,counts:{},records:members.results||[]};
 }
 // Neither clients nor engagements currently has an authoritative database table.
 return {restricted:false,counts:{},records:[]};
}
export async function updateEnquiry(env:HumminEnv,user:AdminUser,operation:string,enquiryId:string,value:string){
 if(!env.DB||!canView(user.role,"pipe"))return {ok:false,message:"Not authorised."};
 if(!/^[\da-f-]{8,64}$/i.test(enquiryId))return {ok:false,message:"Invalid enquiry."};
 const exists=await env.DB.prepare("SELECT id FROM enquiries WHERE id=?").bind(enquiryId).first();
 if(!exists)return {ok:false,message:"Enquiry not found."};
 if(operation==="stage"){
  if(!["new","contacted","exploring","proposal","won","lost"].includes(value))return {ok:false,message:"Invalid stage."};
  await env.DB.batch([
   env.DB.prepare(`INSERT INTO admin_enquiry_workflow(enquiry_id,stage,updated_by) VALUES(?,?,?)
    ON CONFLICT(enquiry_id) DO UPDATE SET stage=excluded.stage,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).bind(enquiryId,value,user.id),
   env.DB.prepare("INSERT INTO admin_audit(id,actor_id,operation,resource_type,resource_id,detail) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),user.id,"set_stage","enquiry",enquiryId,value)
  ]);
  return {ok:true,message:"Pipeline stage saved."};
 }
 if(operation==="note"){
  const trimmed=value.trim();
  if(trimmed.length<1||trimmed.length>2000)return {ok:false,message:"Note must be between 1 and 2,000 characters."};
  await env.DB.batch([
   env.DB.prepare("INSERT INTO admin_enquiry_notes(id,enquiry_id,author_id,note) VALUES(?,?,?,?)").bind(crypto.randomUUID(),enquiryId,user.id,trimmed),
   env.DB.prepare("INSERT INTO admin_audit(id,actor_id,operation,resource_type,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,"add_note","enquiry",enquiryId)
  ]);
  return {ok:true,message:"Note saved."};
 }
 return {ok:false,message:"Unsupported action."};
}
export async function enquiryNotes(env:HumminEnv,user:AdminUser,id:string|null){
 if(!id||!env.DB||!canView(user.role,"inbox")||!/^[\da-f-]{8,64}$/i.test(id))return [];
 const rows=await env.DB.prepare(`SELECT n.id,n.note,n.created_at,a.name AS author
  FROM admin_enquiry_notes n JOIN admin_users a ON a.id=n.author_id
  WHERE n.enquiry_id=? ORDER BY n.created_at DESC LIMIT 50`).bind(id).all();
 return rows.results||[];
}
