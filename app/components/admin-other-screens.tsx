import {useState} from "react";
import {Form,Link} from "react-router";
import {canView,type AdminRole} from "../lib/admin-permissions.ts";
type R=Record<string,unknown>;
const P:React.CSSProperties={borderRadius:16,background:"#fff",border:"1px solid #D0D8D2",padding:18,display:"grid",gap:12,alignContent:"start"};
const label:React.CSSProperties={fontSize:12,color:"#5E6967",lineHeight:1.5};
const button:React.CSSProperties={border:"1px solid #D0D8D2",minHeight:38,padding:"0 14px",borderRadius:999,background:"#fff",fontSize:13,fontWeight:600};
const head:React.CSSProperties={fontWeight:700,fontSize:14};
const n=(v:unknown)=>v==null?"":String(v);
const dt=(v:unknown)=>v?new Date(n(v)).toLocaleString("en-GB",{timeZone:"Africa/Nairobi",dateStyle:"medium",timeStyle:"short"}):"";
function Empty({children}:{children:React.ReactNode}){return <p style={{...label,padding:16,textAlign:"center"}}>{children}</p>}
export function DashboardExact({counts,records}:{counts:Record<string,number>;records:R[]}){
 const cards=[["New leads this week",counts.assessments,"Business Assessment"],["Assessment completion","—","Completion events not yet recorded"],["New subscribers",counts.subscribers,"Confirmed opt-ins"],["Average reply time","—","Reply-time metric not yet available"]];
 return <div style={{display:"grid",gap:12}}>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,200px),1fr))",gap:12}}>{cards.map(([title,value,note],i)=><div key={String(title)} style={{background:i===0?"#1E272A":i===2?"#E7EBE6":i===3?"#B5532C":"white",color:i===0||i===3?"white":"#1E272A",borderRadius:16,padding:18,display:"grid",gap:6}}><span style={{fontSize:12,fontWeight:600,opacity:.75}}>{title}</span><span style={{font:"400 40px/1 Newsreader,serif"}}>{value??0}</span><span style={{fontSize:12,opacity:.8}}>{note}</span></div>)}</div>
 <div style={{display:"flex",flexWrap:"wrap",gap:12}}><div style={{...P,flex:"1 1 320px"}}><strong style={head}>Assessment funnel · last 30 days</strong><Empty>Journey event tracking is not yet connected. No conversion percentages are inferred.</Empty></div><div style={{...P,flex:"1 1 320px"}}><strong style={head}>Average score by area</strong><Empty>Individual area scores are not recorded in the current delivery table.</Empty></div><div style={{...P,flex:"1 1 280px"}}><strong style={head}>Top Insights posts</strong><Empty>Verified article-view analytics are not available yet.</Empty></div></div>
 <div style={{display:"flex",flexWrap:"wrap",gap:12}}><div style={{...P,flex:"2 1 420px"}}><div style={{display:"flex",justifyContent:"space-between"}}><strong style={head}>Newest leads</strong><Link to="/admin?view=leads">All leads →</Link></div>{records.length?records.map(r=><Link to={"/admin?view=inbox&item="+encodeURIComponent(n(r.id))} key={n(r.id)} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"10px 0",borderTop:"1px solid #E7EBE6",fontSize:13,color:"#1E272A"}}><span><strong>{n(r.business_name)}</strong><small style={{...label,display:"block"}}>{n(r.name)} · {dt(r.submitted_at)}</small></span></Link>):<Empty>No enquiries yet.</Empty>}</div><div style={{...P,flex:"1 1 280px",background:"#1E272A",color:"white"}}><strong>Today</strong><Empty>No confirmed calls shown in this dashboard.</Empty></div></div></div>;
}
export function BookingsExact({records}:{records:R[]}){
 const days=Array.from({length:5},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d});
 return <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"start"}}><div style={{flex:"2 1 460px",display:"grid",gap:10}}>{days.map((d,i)=>{const rows=records.filter(r=>new Date(n(r.start_utc)).toDateString()===d.toDateString());return <div key={i} style={{...P,borderColor:i===0?"#1E272A":"#D0D8D2",padding:"14px 16px"}}><strong>{i===0?"Today · ":""}{d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"})} <span style={{...label,fontWeight:500}}>· {rows.length?rows.length+" calls":"No calls"}</span></strong>{rows.map(r=><div key={n(r.id)} style={{display:"flex",gap:14,background:"#F4F5F1",padding:10,borderRadius:10}}><strong>{dt(r.start_utc)}</strong><span>{n(r.name)} · {n(r.email)}</span><small>{n(r.status)}</small></div>)}</div>})}</div><div style={{...P,flex:"1 1 280px"}}><strong style={head}>Weekly availability · EAT</strong><p style={label}>Visitors can book 30-minute calls when the Google Calendar integration is enabled. Availability settings are not editable from this screen yet.</p>{["Mon","Tue","Wed","Thu","Fri"].map(d=><div key={d} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid #E7EBE6"}}><button disabled aria-label={d+" availability not configured"} style={{width:40,height:24,borderRadius:99,border:0,background:"#BAC4BE"}}/><strong>{d}</strong><span style={label}>Managed in Calendar integration</span></div>)}</div></div>;
}
export function EngagementsExact({records,engagements,milestones,selected}:{records:R[];engagements:R[];milestones:R[];selected:string}){
 const [client,setClient]=useState("");
 const chosen=engagements.find(e=>e.id===selected);
 const control={padding:10,border:"1px solid #D0D8D2",borderRadius:9,minWidth:0};
 return <div style={{display:"grid",gap:14}}>
 <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
 <div style={{...P,flex:"1 1 270px"}}><strong>Clients</strong>{records.map(c=><button type="button" key={n(c.id)} onClick={()=>setClient(n(c.id))} style={{...button,textAlign:"left",background:client===c.id?"#DCEBE5":"white"}}>{n(c.name)} · {n(c.status)}</button>)}
 {!records.length?<Empty>No clients recorded yet.</Empty>:null}
 <Form method="post" style={{display:"grid",gap:8,borderTop:"1px solid #D0D8D2",paddingTop:12}}>
 <strong>New client</strong><input type="hidden" name="operation" value="client_create"/>
 <input style={control} name="name" required minLength={2} maxLength={160} placeholder="Business name" aria-label="Business name"/>
 <input style={control} name="contact_name" placeholder="Contact name" aria-label="Contact name"/>
 <input style={control} type="email" name="contact_email" placeholder="Contact email" aria-label="Contact email"/>
 <button style={{...button,background:"#1E272A",color:"white"}}>Create Client</button></Form></div>
 <div style={{...P,flex:"2 1 410px"}}><strong>Engagements</strong>
 {engagements.map(e=><Link to={"/admin?view=clients&item="+encodeURIComponent(n(e.id))} key={n(e.id)} style={{padding:12,border:"1px solid #E7EBE6",borderRadius:10,color:"#1E272A",background:e.id===selected?"#DCEBE5":"white"}}><strong>{n(e.title)}</strong><div style={label}>{n(e.client_name)} · {n(e.kind)} · {n(e.status)}</div></Link>)}
 {!engagements.length?<Empty>There are no engagements recorded yet.</Empty>:null}
 {records.length?<Form method="post" style={{display:"grid",gap:8,borderTop:"1px solid #D0D8D2",paddingTop:12}}>
 <strong>New engagement</strong><input type="hidden" name="operation" value="engagement_create"/>
 <select name="id" required style={control} defaultValue={client||n(records[0].id)}>{records.map(c=><option key={n(c.id)} value={n(c.id)}>{n(c.name)}</option>)}</select>
 <input name="title" required minLength={2} maxLength={180} style={control} placeholder="Engagement title" aria-label="Engagement title"/>
 <select name="kind" style={control}><option value="review">Review</option><option value="project">Project</option><option value="residency">Residency</option></select>
 <textarea name="summary" style={control} placeholder="Scope / outcome" aria-label="Scope" maxLength={3000}/>
 <button style={{...button,background:"#1E272A",color:"white"}}>Create Engagement</button></Form>:null}</div></div>
 {chosen?<div style={P}><strong>{n(chosen.title)} · milestones</strong>
 {milestones.map(m=><Form method="post" key={n(m.id)} style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
 <input type="hidden" name="operation" value="milestone_status"/><input type="hidden" name="id" value={n(chosen.id)}/><input type="hidden" name="milestone_id" value={n(m.id)}/>
 <strong style={{flex:1}}>{n(m.title)}</strong><select style={control} name="status" defaultValue={n(m.status)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></select><button style={button}>Save</button></Form>)}
 <Form method="post" style={{display:"flex",gap:8,flexWrap:"wrap"}}><input type="hidden" name="operation" value="milestone_create"/><input type="hidden" name="id" value={n(chosen.id)}/><input type="text" required minLength={2} maxLength={180} style={{...control,flex:1}} name="title" placeholder="New milestone"/><button style={{...button,background:"#B5532C",color:"white"}}>Add milestone</button></Form></div>:null}
 </div>;
}
export function AnalyticsExact(){
 const ranges=["7 days","30 days","90 days"],[range,setRange]=useState("30 days");
 const cards=["Visitors","Page views","Assessments finished","Leads","Visitor to lead","New clients"];
 return <div style={{display:"grid",gap:12}}>
 <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:12}}><div style={{display:"flex",gap:4,padding:3,borderRadius:99,background:"#E7EBE6"}}>{ranges.map(r=><button key={r} onClick={()=>setRange(r)} aria-pressed={range===r} style={{...button,background:range===r?"#1E272A":"transparent",color:range===r?"white":"#1E272A",border:0}}>{r}</button>)}</div><span style={label}>Traffic from Cloudflare Web Analytics (no cookies). Leads and conversions from HUMMIN events.</span></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,170px),1fr))",gap:12}}>{cards.map((title,i)=><div key={title} style={{padding:16,borderRadius:16,background:i===0?"#1E272A":i===5?"#B5532C":"white",color:i===0||i===5?"white":"#1E272A",display:"grid",gap:4}}><span style={label}>{title}</span><span style={{font:"400 34px Newsreader,serif"}}>—</span><small>Awaiting verified analytics</small></div>)}</div>
 {["Reach, not impressions","Visitors and leads","Sources · visitors to leads to clients","Countries and cities","Sharing","Assessment funnel","Search queries","Audience and speed"].map(title=><div key={title} style={P}><strong style={head}>{title}</strong><Empty>{title==="Search queries"?"Google Search Console data is not connected.":title==="Visitors and leads"?"No fabricated traffic graphs: Cloudflare Analytics data must be connected.":"This module requires measured data before its original visualisation can be populated."}</Empty></div>)}</div>;
}
export function InvoicesExact(){
 const filters=["All","Draft","Issued","Paid","Overdue","Cancelled"];
 const [filter,setFilter]=useState("All");
 return <div style={{display:"grid",gap:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,180px),1fr))",gap:12}}>{["Outstanding","Paid this month","Overdue","Drafts"].map((x,i)=><div key={x} style={{borderRadius:16,background:i===0?"#1E272A":"white",color:i===0?"white":"#1E272A",padding:16,display:"grid",gap:4}}><span style={label}>{x}</span><strong style={{font:"400 30px Newsreader,serif"}}>—</strong><small>eTIMS integration pending</small></div>)}</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{filters.map(f=><button key={f} style={{...button,background:filter===f?"#1E272A":"white",color:filter===f?"white":"#1E272A"}} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}<button disabled style={{...button,marginLeft:"auto",color:"white",background:"#B5532C",opacity:.55}}>New Invoice · not connected</button></div><div style={P}><Empty>No verified invoice records exist in the connected Admin database. Issuing an invoice requires real KRA eTIMS validation and tax status.</Empty></div></div>;
}
export function ReportsExact(){
 const reports=["Leads by month","Pipeline stages","Enquiry response time","Assessment goals","Bookings and conversions","Insights and downloads"];
 return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(100%,380px),1fr))",gap:12}}>{reports.map(title=><div key={title} style={P}><div style={{display:"flex",justifyContent:"space-between"}}><strong style={head}>{title}</strong><button disabled style={{...button,opacity:.5}}>Export CSV</button></div><span style={label}>A report is displayed only when its complete source data is available.</span><Empty>Reporting source not yet connected for this metric.</Empty></div>)}</div>;
}
export function AssessmentSettingsExact({drafts}:{drafts:R[]}){
 const draft=drafts[0];
 const [assumptions,setAssumptions]=useState(()=>n(draft?.assumptions_json)||JSON.stringify({monthlyEnquiries:40,averageSaleKes:25000,conversionRate:0.3,ownerHoursWeekly:10,staffHoursWeekly:10},null,2));
 const [weights,setWeights]=useState(()=>n(draft?.weights_json)||"{}");
 const [bad,setBad]=useState("");
 function check(){try{const a=JSON.parse(assumptions),w=JSON.parse(weights);if(Array.isArray(a)||Array.isArray(w))throw Error();setBad("");return true;}catch{setBad("Enter valid JSON objects before saving");return false;}}
 return <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"start"}}>
 <Form method="post" onSubmit={e=>{if(!check())e.preventDefault();}} style={{...P,flex:"2 1 460px"}}>
 <input type="hidden" name="operation" value="assessment_draft_save"/><input type="hidden" name="revision" value={n(draft?.revision)||0}/>
 <strong style={head}>Cost of gaps · draft assumptions</strong><span style={label}>These are versioned draft values. They do not change the public assessment scoring engine until its calculation adapter is connected and validated.</span>
 <label>Assumptions (JSON)<textarea name="assumptions_json" aria-label="Assessment assumptions JSON" rows={11} value={assumptions} onChange={e=>setAssumptions(e.target.value)} style={{display:"block",width:"100%",padding:12,border:"1px solid #D0D8D2",borderRadius:10,fontFamily:"monospace"}}/></label>
 <label>Goal weights (JSON)<textarea name="weights_json" aria-label="Goal weights JSON" rows={8} value={weights} onChange={e=>setWeights(e.target.value)} style={{display:"block",width:"100%",padding:12,border:"1px solid #D0D8D2",borderRadius:10,fontFamily:"monospace"}}/></label>
 {bad?<span role="alert" style={{color:"#B5532C"}}>{bad}</span>:null}
 <button style={{...button,background:"#1E272A",color:"white"}}>Save draft configuration</button></Form>
 <div style={{...P,flex:"1 1 280px",background:"#1E272A",color:"white"}}><strong>Preview</strong><span style={{color:"#BAC4BE",fontSize:13}}>Public scoring is unchanged. A measured comparison against the original client-side calculation is required before activation.</span><span style={label}>Revision: {n(draft?.revision)||"Not saved yet"}</span><button disabled style={{...button,opacity:.5}}>Activate publicly</button></div></div>;
}
export function TeamExact({records}:{records:R[]}){
 const [selected,setSelected]=useState("");
 const active=records.find(r=>r.id===selected)||records[0];
 const names=[["dash","Dashboard"],["leads","Leads"],["pipe","Pipeline"],["inbox","Inbox"],["book","Bookings"],["clients","Clients and engagements"],["posts","Insights"],["aud","Downloads and subscribers"],["email","Email"],["team","Team and permissions"]];
 return <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"start"}}><div style={{...P,flex:"1 1 260px",padding:0,overflow:"hidden"}}>{records.length?records.map(r=><button key={n(r.id)} onClick={()=>setSelected(n(r.id))} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",border:0,borderLeft:"3px solid "+(active===r?"#B5532C":"transparent"),borderBottom:"1px solid #E7EBE6",background:active===r?"#F4F5F1":"white",textAlign:"left"}}><span style={{width:36,height:36,display:"grid",placeItems:"center",background:"#1E272A",color:"white",borderRadius:99}}>{n(r.name).split(" ").map(x=>x[0]).join("").slice(0,2)}</span><span><strong style={{display:"block"}}>{n(r.name)}</strong><small style={label}>{n(r.role)}</small></span></button>):<Empty>No team accounts.</Empty>}</div><div style={{...P,flex:"3 1 520px"}}>{active?<><strong>{n(active.name)} · permissions</strong><span style={label}>Effective role access shown below. Per-module permission editing is disabled until a persisted permission model is active.</span>{names.map(([id,title])=><div key={id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",borderTop:"1px solid #E7EBE6",paddingTop:10}}><strong style={{fontSize:14}}>{title}</strong><div role="radiogroup" aria-label={title} style={{display:"flex",gap:2,background:"#E7EBE6",borderRadius:99,padding:3}}>{["None","View","Edit","Manage"].map((level,i)=>{const available=canView(n(active.role) as AdminRole,id as any),selected=available?(active.role==="owner"?i===3:i===1):i===0;return <button key={level} role="radio" aria-checked={selected} disabled style={{minHeight:30,border:0,borderRadius:99,padding:"0 10px",background:selected?"#1E272A":"transparent",color:selected?"white":"#434F4F",fontSize:12}}>{level}</button>})}</div></div>)}</>:<Empty>Select a provisioned staff account.</Empty>}</div></div>;
}
export function EmailExact({records,settings}:{records:R[];settings:R[]}){
 const templates=[["contact-internal","Contact form alert"],["contact-received","Enquiry received"],["assessment-results","Assessment results"],["booking-confirmation","Booking confirmation"],["booking-reminder","Booking reminder"],["account-sign-in","Sign-in code"],["account-welcome","Account welcome"],["account-password-reset","Password reset"],["newsletter-monthly","Newsletter"],["newsletter-opt-in","Confirm email"],["insights-download","Insights download"]];
 const [selected,setSelected]=useState("contact-internal");
 const config=settings.find(s=>s.kind===selected);
 return <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"start"}}>
 <div style={{...P,flex:"1 1 280px",padding:0,overflow:"hidden"}}>{templates.map(([kind,title])=><button key={kind} type="button" onClick={()=>setSelected(kind)} style={{display:"grid",gap:3,width:"100%",textAlign:"left",padding:"12px 14px",border:0,borderLeft:"3px solid "+(selected===kind?"#B5532C":"transparent"),borderBottom:"1px solid #E7EBE6",background:selected===kind?"#F4F5F1":"white"}}><strong>{title}</strong><span style={label}>Editorial settings · {config?.enabled?"Configured":"Code-based template"}</span></button>)}</div>
 <div style={{flex:"2 1 460px",display:"grid",gap:12}}>
 <Form key={selected} method="post" style={P}>
 <input type="hidden" name="operation" value="email_settings_save"/><input type="hidden" name="kind" value={selected}/><input type="hidden" name="revision" value={n(config?.revision)||0}/>
 <strong>{templates.find(t=>t[0]===selected)?.[1]}</strong><span style={label}>Sender: verified HUMMIN identity. These settings are saved as an audited draft; they do not override security-sensitive messages or live templates.</span>
 <label>Subject<input style={{display:"block",width:"100%",padding:12,border:"1px solid #D0D8D2",borderRadius:10}} name="subject" required maxLength={180} defaultValue={n(config?.subject)}/></label>
 <label>Preheader<input style={{display:"block",width:"100%",padding:12,border:"1px solid #D0D8D2",borderRadius:10}} name="preheader" maxLength={200} defaultValue={n(config?.preheader)}/></label>
 <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button style={{...button,background:"#1E272A",color:"white"}}>Save template draft</button><button disabled style={{...button,opacity:.5}}>Send test · not activated</button></div></Form>
 <div style={P}><strong>Send log</strong>{records.length?records.map(r=><div key={n(r.id)} style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",borderTop:"1px solid #E7EBE6",paddingTop:9}}><span style={{borderRadius:99,padding:"4px 8px",background:"#E7EBE6"}}>{n(r.status)}</span><span>{n(r.recipient)}</span><span style={label}>{n(r.kind)} · {dt(r.created_at)}</span></div>):<Empty>No emails recorded.</Empty>}</div></div></div>;
}
export function AudienceExact({records}:{records:R[]}){
 return <div style={{display:"grid",gap:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,280px),1fr))",gap:12}}>{[["Checklist · Free","30-day enquiry log","#B5532C"],["Template · Email delivery","Monday figures template","#434F4F"]].map(([type,title,bg])=><div key={title} style={{padding:18,borderRadius:16,background:bg,color:"white",display:"grid",gap:6}}><strong style={{fontSize:12}}>{type}</strong><span style={{font:"400 26px Newsreader,serif"}}>{title}</span><small>Download telemetry not connected</small></div>)}</div><div style={{...P,padding:"8px 16px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}><strong>Subscribers · {records.length}</strong><button disabled style={{...button,opacity:.5}}>Export CSV</button></div>{records.map(r=><div key={n(r.email)} style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:14,borderTop:"1px solid #E7EBE6",padding:"10px 0"}}><strong style={{flex:"1 1 200px",fontSize:13}}>{n(r.email)}</strong><span style={label}>{dt(r.created_at)}</span><span style={{background:"#DCEBE5",padding:"4px 8px",borderRadius:99,fontSize:12}}>{n(r.status)}</span><button disabled style={{...button,opacity:.5}}>Delete data</button></div>)}{!records.length?<Empty>No subscriber records yet.</Empty>:null}</div></div>;
}
