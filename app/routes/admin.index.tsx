import {Form,Link,redirect,useActionData,useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {correctOrigin,privateHeaders,sessionUser} from "../lib/admin-auth.server.ts";

import {canView,resolveView,type AdminView,type AdminRole} from "../lib/admin-permissions.ts";
import {AdminChrome} from "../components/admin-chrome.tsx";
import {PipelineScreen,LeadsScreen,LeadDetailScreen,InboxScreen,InsightsListScreen,InsightsEditorScreen} from "../components/admin-source-screens.tsx";


import {DashboardExact,BookingsExact,EngagementsExact,AnalyticsExact,InvoicesExact,ReportsExact,AssessmentSettingsExact,TeamExact,EmailExact,AudienceExact} from "../components/admin-other-screens.tsx";

const PAGES:{view:AdminView;label:string;short:string}[]=[
 {view:"dash",label:"Dashboard",short:"Overview"},{view:"leads",label:"Leads",short:"Assessments"},
 {view:"pipe",label:"Pipeline",short:"Pipeline"},{view:"inbox",label:"Inbox",short:"Enquiries"},
 {view:"book",label:"Bookings",short:"Calendar"},{view:"clients",label:"Clients and engagements",short:"Clients"},
 {view:"posts",label:"Insights",short:"Editorial"},{view:"analytics",label:"Analytics",short:"Analytics"},{view:"aud",label:"Downloads and subscribers",short:"Audience"},
 {view:"email",label:"Email",short:"Delivery"},{view:"team",label:"Team and permissions",short:"Team"},
 {view:"invoices",label:"Invoices",short:"Billing"},{view:"reports",label:"Reports",short:"Reporting"},{view:"settings",label:"Assessment settings",short:"Settings"}
];
const SUBTITLES:Record<AdminView,string>={
 dash:"What is happening across HUMMIN this week.",leads:"Business Assessments completed and delivery status.",
 pipe:"Move active enquiries forward as conversations progress.",inbox:"Messages received through the contact form.",
 book:"Confirmed and held appointments from the booking service.",
 clients:"Engagement records will appear once the client module is connected.",
 posts:"Write, review, and publish Insights.",post:"Write, review, and publish Insights.",lead:"Assessment details and next steps.",analytics:"Traffic, sources, and what turns visitors into clients.",invoices:"Billing and eTIMS invoices.",reports:"Reports and exports.",settings:"Scoring and assessment assumptions.",aud:"Confirmed and unconfirmed newsletter subscribers.",
 email:"Provider-backed email delivery; no template secrets exposed.",
 team:"Provisioned staff and their access levels."
};
const date=(v:unknown)=>{if(typeof v!=="string"||!v)return "—";const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString("en-KE",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Nairobi"}):v;};
const text=(v:unknown)=>v==null?"—":String(v);
const item=(v:unknown)=>v as Record<string,unknown>;
export async function loader({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env,u=await sessionUser(env,request);
 if(!u)throw redirect("/admin/login");
 const params=new URL(request.url).searchParams,view=resolveView(params.get("view")),selectedId=params.get("item");
 const {loadAdminView,enquiryNotes}=await import("../lib/admin-data.server.ts");
 const {adminPageData}=await import("../lib/admin-source.server.ts");
 const {insightsPosts}=await import("../lib/insights.server.ts");
 const section=await loadAdminView(env,u,view);
 const {operationsData}=await import("../lib/admin-operations.server.ts");
 const operations=await operationsData(env,u,view,selectedId||"");
 const notes=await enquiryNotes(env,u,null);
 const fidelity=["pipe","leads","lead","inbox","posts","post"].includes(view)&&canView(u.role,view)?await adminPageData(env,u,view,selectedId||""):{records:[]};
 return Response.json({user:{name:u.name,role:u.role},view,section,notes,operations,fidelity,original:insightsPosts,selectedId:selectedId||"",saved:params.get("saved")==="1"},{headers:privateHeaders});
}
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 const env=context.cloudflare.env,u=await sessionUser(env,request);
 if(!u)return new Response("Unauthorised",{status:401,headers:privateHeaders});

 if(!correctOrigin(request))return new Response("Invalid origin",{status:403,headers:privateHeaders});
 const size=Number(request.headers.get("content-length")||0);
 if(size>100000)return new Response("Request too large",{status:413,headers:privateHeaders});
 let f:FormData;try{f=await request.formData();}catch{return new Response("Invalid form",{status:400,headers:privateHeaders});}
 const operation=String(f.get("operation")||""),id=String(f.get("id")||""),value=String(f.get("value")||"");
 const {adminPageMutation}=await import("../lib/admin-source.server.ts");
 const {operationsMutation}=await import("../lib/admin-operations.server.ts");
 const result=operation.startsWith("client_")||operation.startsWith("engagement_")||operation.startsWith("milestone_")||operation==="email_settings_save"||operation==="assessment_draft_save"?await operationsMutation(env,u,operation,id,f):await adminPageMutation(env,u,operation,id,value,f);
 if(result.ok&&operation==="inbox_reply"){const {deliverDue}=await import("../lib/mail-outbox.server.ts");context.cloudflare.ctx.waitUntil(deliverDue(env,3).catch(()=>({sent:0,failed:1})));}
 if(!result.ok)return Response.json(result,{status:400,headers:privateHeaders});
 const view=operation.startsWith("client_")||operation.startsWith("engagement_")||operation.startsWith("milestone_")?"clients":operation==="email_settings_save"?"email":operation==="assessment_draft_save"?"settings":operation.startsWith("post_")?"post":operation==="move_assessment"?"pipe":operation==="assessment_note"?"lead":operation.startsWith("inbox_")?"inbox":"dash";
 return redirect("/admin?view="+view+"&item="+encodeURIComponent(("id" in result&&result.id)?String(result.id):id)+"&saved=1",{headers:privateHeaders});
}
type Load={user:{name:string;role:AdminRole};view:AdminView;section:{restricted:boolean;counts:Record<string,number>;records:Record<string,unknown>[];stats?:Record<string,unknown>[]};notes:Record<string,unknown>[];fidelity:{records:Record<string,unknown>[];notes?:Record<string,unknown>[];replies?:Record<string,unknown>[];members?:Record<string,unknown>[]};operations:{records:Record<string,unknown>[];engagements?:Record<string,unknown>[];details:Record<string,unknown>[]};original:Record<string,unknown>[];selectedId:string;saved:boolean};
const stages=["new","contacted","exploring","proposal","won","lost"];
const stageTitle=(s:unknown)=>text(s).replace(/_/g," ").replace(/^./,c=>c.toUpperCase());
const Head=({columns}:{columns:string[]})=><div className="hm-th">{columns.map(h=><span key={h}>{h}</span>)}</div>;
function Blank({title,description}:{title:string;description:string}){
 return <div className="hm-blank"><span className="hm-blank-symbol">◌</span><h2>{title}</h2><p>{description}</p></div>;
}
function Section({view,records,counts,notes,selectedId}:{view:AdminView;records:Record<string,unknown>[];counts:Record<string,number>;notes:Record<string,unknown>[];selectedId:string}){
 const rowStyle="hm-record";
 if(view==="dash")return <>
 <div className="hm-stats">{([["Enquiries",counts.enquiries],["Assessment deliveries",counts.assessments],["Confirmed bookings",counts.bookings],["Active subscribers",counts.subscribers],["Failed emails",counts.failed_email]] as const).map(([k,v])=>
 <div className="hm-stat" key={k}><span>{k}</span><strong>{v??0}</strong></div>)}</div>
 <div className="hm-panel"><h2>Latest enquiries</h2>{records.length?records.map(d=><Link className={rowStyle} key={text(d.id)} to={"/admin?view=inbox&item="+encodeURIComponent(text(d.id))}><span><strong>{text(d.name)}</strong><small>{text(d.business_name)}</small></span><span>{date(d.submitted_at)}</span><span className="hm-pill">{text(d.status)}</span></Link>):<Blank title="No enquiries recorded yet" description="This view will populate when a visitor submits a real enquiry."/>}</div>
 </>;
 if(view==="inbox"||view==="pipe")return <div className="hm-two">
 <div className="hm-panel"><h2>{view==="inbox"?"Received enquiries":"Current pipeline"}</h2><p className="hm-muted">Contact form enquiries; the pipeline is tracked separately from email delivery status.</p>
 {!records.length?<Blank title="No enquiries yet" description="Only real enquiries from the website appear here."/>:records.map(d=>
 <Link to={"/admin?view="+view+"&item="+encodeURIComponent(text(d.id))} className={"hm-message"+(selectedId===d.id?" hm-selected":"")} key={text(d.id)}>
 <div><strong>{text(d.name)}</strong><small>{date(d.submitted_at)}</small></div>
 <p>{text(d.business_name)} · {text(d.email)}</p>
 <p className="hm-excerpt">{text(d.message)}</p>
 <span className="hm-pill">{stageTitle(d.stage)}</span>
 </Link>)}</div>
 <div className="hm-panel">{(()=>{const d=records.find(x=>x.id===selectedId);return !d?<Blank title="Select an enquiry" description="Choose an item to see the original message, update its pipeline stage or add a private note."/>:<>
 <p className="hm-overline">Enquiry details</p><h2>{text(d.name)}</h2>
 <p><strong>{text(d.business_name)}</strong></p><p><a href={"mailto:"+encodeURIComponent(text(d.email))}>{text(d.email)}</a></p>
 <p className="hm-muted">Received {date(d.submitted_at)} · Delivery status: {text(d.delivery_status)}</p>
 <div className="hm-quote">{text(d.message)}</div>
 <h3>Pipeline stage</h3>
 <Form method="post" className="hm-inline"><input type="hidden" name="operation" value="stage"/><input type="hidden" name="id" value={text(d.id)}/>
 <select name="value" aria-label="Pipeline stage" defaultValue={text(d.stage)}>{stages.map(x=><option key={x} value={x}>{stageTitle(x)}</option>)}</select>
 <button type="submit" className="hm-button">Save stage</button></Form>
 <h3>Internal notes</h3>
 <Form method="post" className="hm-note-form"><input type="hidden" name="operation" value="note"/><input type="hidden" name="id" value={text(d.id)}/>
 <textarea name="value" required maxLength={2000} rows={3} aria-label="Private enquiry note" placeholder="Add an internal note (not sent to the visitor)"/>
 <button type="submit" className="hm-button dark">Add note</button></Form>
 {!notes.length?<p className="hm-muted">No notes recorded.</p>:notes.map(n=><div className="hm-note" key={text(n.id)}><p>{text(n.note)}</p><small>{text(n.author)} · {date(n.created_at)}</small></div>)}
 </>})()}</div></div>;
 if(view==="leads")return <div className="hm-panel"><h2>Assessment leads</h2>
 <p className="hm-muted">Completed, submitted assessments only. Assessments are not automatically converted into engagements.</p>
 {!records.length?<Blank title="No assessment deliveries" description="Assessment leads will appear here once visitors submit their results for email delivery."/>:
 records.map(d=><div key={text(d.id)} className={rowStyle}><span><strong>{text(d.name)}</strong><small>{text(d.business_name)} · {text(d.email)}</small></span><span>Score: {text(d.score)}/100</span><span>{text(d.goal)}</span><span>{date(d.created_at)}</span></div>)}</div>;
 if(view==="book")return <div className="hm-panel"><h2>Results review bookings</h2>
 <p className="hm-muted">Confirmed and held records from the Google Calendar booking workflow. Booking remains disabled on the preview.</p>
 {!records.length?<Blank title="No bookings" description="Appointments will be listed here when booking is enabled and a real reservation exists."/>:records.map(d=>
 <div key={text(d.id)} className={rowStyle}><span><strong>{text(d.name)}</strong><small>{text(d.email)}</small></span><span>{date(d.start_utc)}</span><span className="hm-pill">{text(d.status)}</span><small>Confirmation queued: {d.confirmation_queued?"Yes":"No"}</small></div>)}</div>;
 if(view==="posts")return <div className="hm-panel"><h2>Insights editorial library</h2>
 <p className="hm-muted">These articles currently ship with the website build. Editing and publishing are not yet connected to a content database.</p>
 {records.map(p=><div key={text(p.slug)} className={rowStyle}><span><strong>{text(p.title)}</strong><small>{text(p.type)} · {text(p.topics)}</small></span><span>{date(p.date)}</span><a href={"/insights/"+text(p.slug)} target="_blank" rel="noopener noreferrer">View article</a></div>)}</div>;
 if(view==="aud")return <div className="hm-panel"><h2>Newsletter audience</h2><p className="hm-muted">Only confirmed opt-ins should receive a newsletter. Download recipients are not implicitly subscribers.</p>
 {!records.length?<Blank title="No subscribers yet" description="Confirmed, pending and unsubscribed records will show here, without exposing confirmation tokens."/>:records.map(d=>
 <div className={rowStyle} key={text(d.email)}><span><strong>{text(d.email)}</strong><small>{date(d.created_at)}</small></span><span className="hm-pill">{text(d.status)}</span></div>)}</div>;
 if(view==="email")return <div className="hm-panel"><h2>Email delivery log</h2><p className="hm-muted">Provider status, errors and retry attempts are shown. Verification codes and raw email payloads are never exposed.</p>
 {!records.length?<Blank title="No emails queued" description="The outbox reflects real queued, sent or failed email requests."/>:records.map(d=>
 <div className={rowStyle} key={text(d.id)}><span><strong>{text(d.kind)}</strong><small>{text(d.recipient)}</small></span><span className="hm-pill">{text(d.status)}</span><small>{date(d.created_at)}</small><small>Attempts: {text(d.attempts)}{d.last_error?" · "+text(d.last_error):""}</small></div>)}</div>;
 if(view==="team")return <div className="hm-panel"><h2>Staff accounts</h2><p className="hm-muted">New team members require a separately authorised invitation. Role editing and staff invitations are not enabled in this view.</p>
 {!records.length?<Blank title="No staff provisioned" description="Admin remains disabled until a staff account and secret have been configured."/>:records.map(d=>
 <div className={rowStyle} key={text(d.id)}><span><strong>{text(d.name)}</strong><small>{text(d.email)}</small></span><span className="hm-pill">{stageTitle(d.role)}</span><span className="hm-pill">{text(d.status)}</span></div>)}</div>;
 return <Blank title="Client and engagement management" description="No authoritative client/engagement tables exist yet. We will not present the prototype's sample clients as real HUMMIN accounts."/>;
}
export default function AdminHome(){
 const data=useLoaderData() as Load;
 const response=useActionData() as {ok:boolean;message:string}|undefined;
 const {user,view,section,notes,fidelity,operations,original,selectedId,saved}=data;
 const records=(section.records||[]).map(item),counts=section.counts||{};
 const accessible=PAGES.filter(p=>canView(user.role,p.view));
 const current=PAGES.find(p=>p.view===view);
 const headline=view==="lead"?"Lead detail":view==="post"?"Insights editor":current?.label||"Dashboard";
 return <AdminChrome menuItems={accessible.map(p=>({id:p.view,label:p.label,href:"/admin"+(p.view==="dash"?"":"?view="+p.view)}))} current={view} userName={user.name} signOut><div className="hm-admin">
 <style>{`
 .hm-admin{--slate:#1E272A;--ember:#B5532C;--mist:#F4F5F1;color:var(--slate);font:14px/1.5 Figtree,Arial,sans-serif;background:var(--mist);min-height:calc(100vh - 68px);display:block}
 .hm-admin *, .hm-admin *:before,.hm-admin *:after{box-sizing:border-box}
 .hm-side{background:var(--slate);color:#F4F5F1;padding:28px 16px;display:flex;flex-direction:column;gap:24px}
 .hm-logo{font-size:19px;font-weight:800;letter-spacing:.2em;padding:7px 14px;text-decoration:none;color:inherit}
 .hm-nav{display:grid;gap:4px}.hm-nav a{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:10px;color:#D0D8D2;text-decoration:none;font-weight:600}
 .hm-nav a:hover{background:#344042}.hm-nav a[aria-current=page]{background:#364448;color:white;border-left:3px solid var(--ember)}
 .hm-nav-num{font:600 10px Figtree;color:#A8B4B0;min-width:17px}
 .hm-account{margin-top:auto;padding:15px;border-top:1px solid #435054;color:#C1CAC6;font-size:12px}
 .hm-account strong{display:block;color:white;font-size:14px;margin:5px 0}
 .hm-main{min-width:0;padding:clamp(20px,3vw,36px) clamp(16px,3vw,32px) 64px;display:grid;gap:18px}.hm-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
 .hm-overline{font-size:11px!important;font-weight:800!important;color:var(--ember)!important;letter-spacing:.15em!important;text-transform:uppercase!important}
 .hm-toolbar a{color:var(--slate);font-weight:700}.hm-title{font:400 clamp(32px,4vw,48px)/1 Newsreader,Georgia,serif;letter-spacing:-.015em;margin:0 0 8px}
 .hm-description{color:#5E6967;font-size:14px;margin:0 0 5px}.hm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
 .hm-stat{background:#FFF;border:1px solid #D0D8D2;border-radius:16px;min-height:135px;padding:18px}.hm-stat:first-child{background:#1E272A;color:#F4F5F1;border-color:#1E272A}.hm-stat:nth-child(2){background:#DCEBE5;border-color:#DCEBE5}.hm-stat span{display:block;color:inherit;opacity:.75;font-size:12px;font-weight:600}.hm-stat strong{display:block;font:400 40px/1 Newsreader,Georgia,serif;margin-top:12px}
 .hm-panel{background:white;border:1px solid #D0D8D2;border-radius:16px;padding:clamp(16px,2vw,25px);min-width:0}
 .hm-panel h2,.hm-blank h2{font:400 27px Newsreader,Georgia,serif;margin:0 0 15px}.hm-panel h3{font-size:13px;margin:27px 0 10px}
 .hm-muted{color:#65716E;font-size:13px;line-height:1.6}.hm-record{display:flex;gap:15px 20px;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:15px 2px;border-top:1px solid #E7EBE6;color:var(--slate);text-decoration:none}
 .hm-record span,.hm-record small{min-width:0}.hm-record strong{display:block;font-weight:700}.hm-record small{display:block;color:#65716E;font-size:12px;margin-top:3px}
 .hm-pill{display:inline-flex;padding:5px 10px;background:#E7EBE6;border:1px solid #D0D8D2;border-radius:99px;font-size:11px;font-weight:700;max-width:max-content}
 .hm-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.03fr);gap:18px;align-items:start}
 .hm-message{display:block;text-decoration:none;color:inherit;border-top:1px solid #E7EBE6;padding:15px 12px;border-radius:8px}
 .hm-message:hover,.hm-selected{background:#F4F5F1}.hm-message div{display:flex;gap:8px;align-items:center;justify-content:space-between}
 .hm-message small{font-size:11px;color:#65716E}.hm-message p{margin:5px 0;font-size:12px;color:#65716E}
 .hm-excerpt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
 .hm-quote{padding:18px;background:#F4F5F1;border-left:3px solid var(--ember);white-space:pre-wrap;line-height:1.7;overflow-wrap:anywhere}
 .hm-inline{display:flex;gap:9px;flex-wrap:wrap}.hm-inline select{padding:10px;border:1px solid #D0D8D2;border-radius:8px;min-width:150px}
 .hm-note-form{display:grid;gap:12px}.hm-note-form textarea{font:inherit;padding:12px;border:1px solid #D0D8D2;border-radius:9px;resize:vertical}
 .hm-button{cursor:pointer;border:0;border-radius:24px;padding:11px 16px;background:var(--ember);color:white;font-weight:700}.hm-button.dark{justify-self:start;background:var(--slate)}
 .hm-note{border-top:1px solid #E7EBE6;padding-top:10px;margin-top:10px;white-space:pre-wrap}.hm-note small{color:#65716E}
 .hm-blank{text-align:center;padding:50px 12px}.hm-blank-symbol{color:var(--ember);font-size:46px}
 .hm-blank p{max-width:460px;margin:0 auto;color:#65716E}
 .hm-alert{padding:13px 18px;border:1px solid #D0D8D2;background:white;margin:0 0 20px;border-radius:9px}
 .hm-admin a:focus-visible,.hm-admin button:focus-visible,.hm-admin select:focus-visible{outline:3px solid #B5532C;outline-offset:2px}
 @media(max-width:900px){.hm-admin{display:block}.hm-side{padding:16px;gap:9px}.hm-nav{display:flex;gap:3px;overflow:auto;max-width:100vw;padding:6px 0}.hm-nav a{white-space:nowrap;padding:8px 12px}.hm-nav-num{display:none}.hm-account{display:none}.hm-main{padding:22px 16px 50px}.hm-two{grid-template-columns:1fr}}
 `}</style>
 <main className="hm-main">
 <div className="hm-toolbar"><p className="hm-overline">HUMMIN / ADMIN</p><Link to="/">View website</Link></div>
 <h1 className="hm-title">{headline}</h1>
 <p className="hm-description">{SUBTITLES[view]}</p>
 {saved?<p className="hm-alert" role="status">Your change was saved or queued. Email delivery status is shown in the conversation and Email log.</p>:null}
 {response?<p className="hm-alert" role="alert">{response.message}</p>:null}
 {section.restricted?<Blank title="Restricted to authorised roles" description="This section is not available to your staff access level."/>:
 user.role==="partner"||user.role==="staff"?<Blank title="No assigned operational modules" description="This account is authenticated. Your permissions will expand when an authorised owner assigns specific work."/>:
 view==="dash"?<DashboardExact counts={counts} records={records}/>:
 view==="pipe"?<PipelineScreen data={fidelity}/>:
 view==="leads"?<LeadsScreen data={fidelity}/>:
 view==="lead"?<LeadDetailScreen data={fidelity} selected={selectedId}/>:
 view==="inbox"?<InboxScreen data={fidelity} selected={selectedId}/>:
 view==="posts"?<InsightsListScreen data={fidelity} original={original}/>:
 view==="post"?<InsightsEditorScreen key={selectedId} data={fidelity} original={original} selected={selectedId}/>:
 view==="book"?<BookingsExact records={records}/>:
 view==="clients"?<EngagementsExact records={operations.records} engagements={operations.engagements||[]} milestones={operations.details} selected={selectedId}/>:
 view==="analytics"?<AnalyticsExact records={operations.records} conversion={operations.details}/>:
 view==="invoices"?<InvoicesExact/>:
 view==="reports"?<ReportsExact/>:
 view==="settings"?<AssessmentSettingsExact drafts={operations.records}/>:
 view==="team"?<TeamExact records={records}/>:
 view==="email"?<EmailExact records={records} settings={operations.records}/>:
 view==="aud"?<AudienceExact records={records}/>:
 <Section view={view} records={records} counts={counts} notes={notes} selectedId={selectedId}/>}
 <p className="hm-muted" style={{marginTop:32}}>Only live records are shown. This preview excludes the standalone Admin's fictitious examples.</p>
 </main></div></AdminChrome>;
}
