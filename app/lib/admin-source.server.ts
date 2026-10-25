import type {HumminEnv} from "../../workers/app.ts";
import type {AdminUser} from "./admin-permissions.ts";

export const PIPE_STAGES=["new","contacted","call_booked","proposal_sent","won","lost"] as const;
export const TOPICS=["Strategy","Technology","Marketing","Operations","Talent","Data","Specialist Partners"];
export const BLOCKS=["p","h","ul","ol","dl","as"] as const;
export type PostBlock={t:string;text:string};
const identifier=(s:string)=>/^[a-f0-9-]{8,64}$/i.test(s);
const canManage=(u:AdminUser)=>u.role==="owner"||u.role==="sales";
const canWrite=(u:AdminUser)=>u.role==="owner"||u.role==="editor";
const db=(e:HumminEnv)=>{if(!e.DB)throw Error("Database unavailable");return e.DB;};
const audit=(e:HumminEnv,u:AdminUser,op:string,type:string,id:string,detail="")=>db(e).prepare("INSERT INTO admin_audit(id,actor_id,operation,resource_type,resource_id,detail) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),u.id,op,type,id,detail);
export async function adminPageData(e:HumminEnv,u:AdminUser,view:string,selected:string){
 const D=db(e);
 if(["pipe","leads","lead"].includes(view)){
  if(!canManage(u))return {records:[],restricted:true};
  const result=await D.prepare("SELECT a.id,a.name,a.email,a.business_name,a.score,a.goal,a.summary,a.created_at,a.sent_at,COALESCE(p.stage,'new') stage,p.estimated_value_kes FROM assessment_deliveries a LEFT JOIN admin_assessment_pipeline p ON p.assessment_id=a.id ORDER BY a.created_at DESC LIMIT 150").all();
  const notes=view==="lead"&&identifier(selected)?await D.prepare("SELECT n.note,n.created_at,u.name author FROM admin_assessment_notes n JOIN admin_users u ON u.id=n.author_id WHERE n.assessment_id=? ORDER BY n.created_at DESC LIMIT 50").bind(selected).all():null;
  return {records:result.results||[],notes:notes?.results||[]};
 }
 if(view==="inbox"){
  if(!canManage(u))return {records:[],restricted:true};
  const rows=await D.prepare("SELECT e.id,e.name,e.business_name,e.email,e.message,e.submitted_at,COALESCE(t.status,'new') thread_status,t.assigned_user_id FROM enquiries e LEFT JOIN admin_inbox_threads t ON t.enquiry_id=e.id ORDER BY e.submitted_at DESC LIMIT 100").all();
  const replies=identifier(selected)?await D.prepare("SELECT r.id,r.body,r.created_at,a.name author,o.status mail_status FROM admin_inbox_replies r JOIN admin_users a ON a.id=r.author_id LEFT JOIN email_outbox o ON o.id=r.mail_id WHERE r.enquiry_id=? ORDER BY r.created_at LIMIT 100").bind(selected).all():null;
  const members=await D.prepare("SELECT id,name FROM admin_users WHERE status='active' AND role IN ('owner','sales') ORDER BY name").all();
  return {records:rows.results||[],replies:replies?.results||[],members:members.results||[]};
 }
 if(view==="posts"||view==="post"){
  if(!canWrite(u))return {records:[],restricted:true};
  const posts=await D.prepare("SELECT id,source_slug,slug,title,excerpt,type,author,status,topics_json,blocks_json,revision,updated_at FROM admin_insights_posts ORDER BY updated_at DESC LIMIT 150").all();
  return {records:posts.results||[]};
 }
 return {records:[]};
}
export async function adminPageMutation(e:HumminEnv,u:AdminUser,operation:string,id:string,value:string,form:FormData){
 const D=db(e);
 if(["move_assessment","assessment_note"].includes(operation)){
  if(!canManage(u)||!identifier(id))return {ok:false,message:"Forbidden"};
  const a=await D.prepare("SELECT id FROM assessment_deliveries WHERE id=?").bind(id).first();
  if(!a)return {ok:false,message:"Assessment not found"};
  if(operation==="move_assessment"){
   if(!PIPE_STAGES.includes(value as typeof PIPE_STAGES[number]))return {ok:false,message:"Invalid stage"};
   await D.batch([
    D.prepare("INSERT INTO admin_assessment_pipeline(assessment_id,stage,updated_by) VALUES(?,?,?) ON CONFLICT(assessment_id) DO UPDATE SET stage=excluded.stage,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP").bind(id,value,u.id),
    audit(e,u,"stage_change","assessment",id,value)
   ]);
   return {ok:true,message:"Pipeline updated"};
  }
  if(value.trim().length<1||value.length>2000)return {ok:false,message:"Invalid note"};
  await D.batch([D.prepare("INSERT INTO admin_assessment_notes(id,assessment_id,author_id,note) VALUES(?,?,?,?)").bind(crypto.randomUUID(),id,u.id,value.trim()),audit(e,u,"note","assessment",id)]);
  return {ok:true,message:"Note saved"};
 }
 if(operation==="inbox_status"||operation==="inbox_assign"){
  if(!canManage(u)||!identifier(id))return {ok:false,message:"Forbidden"};
  if(!(await D.prepare("SELECT id FROM enquiries WHERE id=?").bind(id).first()))return {ok:false,message:"Enquiry missing"};
  if(operation==="inbox_status"&&!["new","replied","closed"].includes(value))return {ok:false,message:"Invalid status"};
  if(operation==="inbox_assign"&&value&&!(await D.prepare("SELECT id FROM admin_users WHERE id=? AND status='active' AND role IN ('owner','sales')").bind(value).first()))return {ok:false,message:"Invalid owner"};
  if(operation==="inbox_status")await D.batch([
   D.prepare("INSERT INTO admin_inbox_threads(enquiry_id,status) VALUES(?,?) ON CONFLICT(enquiry_id) DO UPDATE SET status=excluded.status,updated_at=CURRENT_TIMESTAMP").bind(id,value),
   audit(e,u,"thread_status","enquiry",id,value)
  ]);
  else await D.batch([
   D.prepare("INSERT INTO admin_inbox_threads(enquiry_id,assigned_user_id) VALUES(?,?) ON CONFLICT(enquiry_id) DO UPDATE SET assigned_user_id=excluded.assigned_user_id,updated_at=CURRENT_TIMESTAMP").bind(id,value||null),
   audit(e,u,"thread_owner","enquiry",id,value)
  ]);
  return {ok:true,message:"Conversation updated"};
 }
 if(operation==="inbox_reply"){
  if(!canManage(u)||!identifier(id)||!e.RESEND_API_KEY||!e.EMAIL_FROM)return {ok:false,message:"Reply sender unavailable"};
  if(value.trim().length<1||value.length>8000)return {ok:false,message:"Reply must contain 1–8,000 characters"};
  const person=await D.prepare("SELECT name,email FROM enquiries WHERE id=?").bind(id).first<{name:string;email:string}>();
  if(!person)return {ok:false,message:"Enquiry not found"};
  const {renderBrandEmail}=await import("./email-brand.server.ts");
  const mail=renderBrandEmail({type:"contact-received",recipient:person.email,sender:"people",replyTo:"sales@hummin.org",subject:"Re: Your enquiry to HUMMIN",preheader:"A reply from HUMMIN.",kicker:"A note from HUMMIN",title:"Following up.",paragraphs:[value.trim()],footer:"This is a reply to the enquiry you submitted to HUMMIN."},e.SITE_URL||"https://hummin.org");
  const key="admin-reply:"+crypto.randomUUID();
  await D.batch([
   D.prepare("INSERT INTO email_outbox(id,kind,recipient,payload) VALUES(?,?,?,?)").bind(key,mail.type,person.email,JSON.stringify(mail)),
   D.prepare("INSERT INTO admin_inbox_replies(id,enquiry_id,author_id,body,mail_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,u.id,value.trim(),key),
   D.prepare("INSERT INTO admin_inbox_threads(enquiry_id,status) VALUES(?,'replied') ON CONFLICT(enquiry_id) DO UPDATE SET status='replied',updated_at=CURRENT_TIMESTAMP").bind(id),
   audit(e,u,"reply_queued","enquiry",id,key)
  ]);
  return {ok:true,message:"Reply queued for delivery"};
 }
 if(["post_save","post_publish"].includes(operation)){
  if(!canWrite(u))return {ok:false,message:"Forbidden"};
  const title=String(form.get("title")||"").trim(),excerpt=String(form.get("excerpt")||"").trim(),type=String(form.get("type")||"Guide");
  const raw=String(form.get("blocks")||"[]"),topicsRaw=String(form.get("topics")||"[]");
  if(title.length>180||excerpt.length>400||!["Guide","Opinion","News","Guest partner"].includes(type)||raw.length>65000)return {ok:false,message:"Invalid content"};
  let blocks:PostBlock[],topics:string[];try{
    const b=JSON.parse(raw),t=JSON.parse(topicsRaw);
    if(!Array.isArray(b)||b.length>100||!Array.isArray(t)||t.length>7)throw Error();
    blocks=b.map(x=>({t:String(x.t),text:String(x.text||"")}));
    if(blocks.some(b=>!BLOCKS.includes(b.t as typeof BLOCKS[number])||b.text.length>8000))throw Error();
    topics=t.filter(x=>TOPICS.includes(x));
  }catch{return {ok:false,message:"Invalid editor blocks"};}
  if(operation==="post_publish"&&!title)return {ok:false,message:"A title is required to publish"};
  const slug=String(form.get("slug")||"").trim().toLowerCase();
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120)return {ok:false,message:"Enter a valid URL slug"};
  const postId=identifier(id)?id:crypto.randomUUID();
  const old=identifier(id)?await D.prepare("SELECT id,source_slug,revision,status FROM admin_insights_posts WHERE id=?").bind(postId).first<{id:string;source_slug:string|null;revision:number;status:string}>():null;
  const origSlug=String(form.get("source_slug")||"");
  if(!old&&origSlug&&!(await D.prepare("SELECT slug FROM admin_insights_posts WHERE source_slug=?").bind(origSlug).first())){
   if(!["enquiries-30-day-fix","five-monday-figures","runs-through-the-owner","introducing-hummin"].includes(origSlug))return {ok:false,message:"Unknown original"};
  }
  const status=operation==="post_publish"?"published":"draft";
  const rev=(old?.revision||0)+1;
  const payload={title,excerpt,type,topics,blocks,status,slug};
  try{
   await D.batch([
    D.prepare("INSERT INTO admin_insights_posts(id,source_slug,slug,title,excerpt,type,author,status,topics_json,blocks_json,revision,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,title=excluded.title,excerpt=excluded.excerpt,type=excluded.type,status=excluded.status,topics_json=excluded.topics_json,blocks_json=excluded.blocks_json,revision=excluded.revision,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP").bind(postId,old?.source_slug||origSlug||null,slug,title,excerpt,type,u.name,status,JSON.stringify(topics),JSON.stringify(blocks),rev,u.id),
    D.prepare("INSERT INTO admin_insights_revisions(id,post_id,revision,data_json,editor_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),postId,rev,JSON.stringify(payload),u.id),
    audit(e,u,operation,"insights",postId,slug)
   ]);
  }catch{return {ok:false,message:"Could not save. Check that the slug is unique."};}
  return {ok:true,message:operation==="post_publish"?"Post saved as published in CMS; public publishing integration pending":"Draft saved",id:postId};
 }
 return {ok:false,message:"This control has not been connected yet"};
}
