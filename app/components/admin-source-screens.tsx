import {Form,Link,useNavigation,useSubmit} from "react-router";
import {useEffect,useState} from "react";

export const stages=["new","contacted","call_booked","proposal_sent","won","lost"];
export const stageNames=["New","Contacted","Call booked","Proposal sent","Won","Lost"];
const panel:React.CSSProperties={background:"#fff",border:"1px solid #D0D8D2",borderRadius:16,padding:18};
const muted:React.CSSProperties={color:"#5E6967",fontSize:12};
const btn:React.CSSProperties={minHeight:40,padding:"0 16px",border:0,borderRadius:999,background:"#B5532C",color:"#fff",fontWeight:600,cursor:"pointer"};
const field:React.CSSProperties={minHeight:40,padding:"0 12px",borderRadius:10,border:"1px solid #D0D8D2",background:"#fff",width:"100%",fontSize:14};
const nice=(v:unknown)=>v==null?"":String(v);
const date=(v:unknown)=>v?new Date(String(v)).toLocaleString("en-KE",{timeZone:"Africa/Nairobi",dateStyle:"medium",timeStyle:"short"}):"";
const money=(v:unknown)=>v==null?"Not recorded":"KES "+Math.round(Number(v)||0).toLocaleString("en-KE");
type RecordRow=Record<string,unknown>;
type Data={records:RecordRow[];notes?:RecordRow[];replies?:RecordRow[];members?:RecordRow[];restricted?:boolean};
function PanelEmpty({description}:{description:string}){return <div style={{padding:"40px 15px",textAlign:"center",color:"#5E6967",fontSize:14}}>{description}</div>}
function SubmitAction({operation,id,value,children,disabled}:{operation:string;id:string;value:string;children:React.ReactNode;disabled?:boolean}){
 return <Form method="post" style={{display:"inline-flex"}}><input type="hidden" name="operation" value={operation}/><input type="hidden" name="id" value={id}/><input type="hidden" name="value" value={value}/><button disabled={disabled} type="submit" style={{minWidth:32,height:32,borderRadius:99,border:operation==="move_assessment"&&children==="→"?"none":"1px solid #D0D8D2",background:children==="→"?"#1E272A":"#fff",color:children==="→"?"white":"#1E272A",opacity:disabled?.4:1,cursor:disabled?"not-allowed":"pointer"}} aria-label={children==="→"?"Move forward a stage":"Move back a stage"}>{children}</button></Form>;
}
export function PipelineScreen({data}:{data:Data}){
 const rows=data.records||[];
 return <div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 0 16px",alignItems:"stretch"}}>
 {stages.map((stage,i)=>{
  const cards=rows.filter(r=>r.stage===stage);
  return <div key={stage} style={{flex:"0 0 260px",borderRadius:16,background:"#E7EBE6",padding:12,display:"grid",gap:8,alignContent:"start"}}>
   <div style={{display:"grid",padding:"2px 4px 6px",gap:2}}><strong style={{fontSize:14}}>{stageNames[i]} <span style={{fontWeight:500,color:"#5E6967"}}>{cards.length}</span></strong><span style={{...muted,fontWeight:600}}>{money(cards.reduce((n,r)=>n+(Number(r.estimated_value_kes)||0),0))} <span style={{fontWeight:400}}>(recorded values)</span></span></div>
   {cards.map(r=><div key={nice(r.id)} style={{padding:12,background:"#fff",borderRadius:12,display:"grid",gap:8,boxShadow:"0 1px 2px rgba(30,39,42,.06)"}}>
    <Link to={"/admin?view=lead&item="+encodeURIComponent(nice(r.id))} style={{display:"grid",gap:2,color:"#1E272A"}}><strong style={{fontSize:14}}>{nice(r.business_name)}</strong><span style={muted}>{nice(r.name)} · score {nice(r.score)}</span></Link>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6}}><strong style={{fontSize:13}}>{money(r.estimated_value_kes)}</strong><div style={{display:"flex",gap:4}}>
    <SubmitAction operation="move_assessment" id={nice(r.id)} value={stages[Math.max(0,i-1)]} disabled={i===0}>←</SubmitAction>
    <SubmitAction operation="move_assessment" id={nice(r.id)} value={stages[Math.min(stages.length-1,i+1)]} disabled={i===stages.length-1}>→</SubmitAction>
    </div></div></div>)}
   {!cards.length?<div style={{height:64,border:"1px dashed #BAC4BE",borderRadius:12,display:"grid",placeItems:"center",fontSize:12,color:"#65716E"}}>No assessments</div>:null}
  </div>;
 })}
 </div>;
}
export function LeadsScreen({data}:{data:Data}){
 const [q,setQ]=useState(""),[filter,setFilter]=useState("All");
 const records=data.records||[];
 const routes=["All","New","Contacted","Call booked","Proposal sent","Won","Lost"];
 const filtered=records.filter(r=>(filter==="All"||r.stage===stages[routes.indexOf(filter)-1])&&(!q||(nice(r.name)+" "+nice(r.business_name)).toLowerCase().includes(q.toLowerCase())));
 return <><div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center",marginBottom:12}}>
 {routes.map(label=><button key={label} onClick={()=>setFilter(label)} aria-pressed={filter===label} style={{...btn,minHeight:38,background:filter===label?"#1E272A":"#fff",color:filter===label?"#fff":"#1E272A",border:"1px solid #D0D8D2"}}>{label} <span style={{opacity:.6}}>{label==="All"?records.length:records.filter(r=>r.stage===stages[routes.indexOf(label)-1]).length}</span></button>)}
 <input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search business or name" aria-label="Search leads" style={{...field,marginLeft:"auto",maxWidth:320,borderRadius:999}}/></div>
 <div style={{...panel,padding:0,overflow:"hidden"}}>{filtered.length?filtered.map(r=><Link key={nice(r.id)} to={"/admin?view=lead&item="+encodeURIComponent(nice(r.id))} style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:"8px 16px",padding:"14px 16px",borderBottom:"1px solid #E7EBE6",color:"#1E272A"}}>
 <span style={{width:44,height:44,borderRadius:99,background:Number(r.score)>=70?"#2E6B5C":Number(r.score)>=45?"#5E6967":"#B5532C",display:"grid",placeItems:"center",fontWeight:700,color:"white"}}>{nice(r.score)}</span>
 <span style={{flex:"2 1 180px"}}><strong style={{display:"block",fontSize:15}}>{nice(r.business_name)}</strong><small style={muted}>{nice(r.name)} · {date(r.created_at)}</small></span>
 <span style={{flex:"1 1 130px"}}><small style={{...muted,display:"block"}}>Gaps may cost</small><strong>Not recorded</strong></span>
 <span style={{flex:"1 1 130px"}}><small style={{...muted,display:"block"}}>Goal</small>{nice(r.goal)}</span>
 <span style={{border:"1px solid #D0D8D2",borderRadius:99,padding:"5px 10px",fontSize:12}}>{stageNames[stages.indexOf(nice(r.stage))]||"New"}</span>
 </Link>):<PanelEmpty description="No assessment leads match. Clear the search or pick another filter."/>}</div></>;
}
export function LeadDetailScreen({data,selected}:{data:Data;selected:string}){
 const r=data.records.find(x=>x.id===selected);
 if(!r)return <PanelEmpty description="Select an assessment from Leads or Pipeline."/>;
 return <div style={{display:"flex",flexWrap:"wrap",alignItems:"start",gap:12}}>
 <div style={{flex:"2 1 460px",display:"grid",gap:12}}>
 <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
 <div style={{...panel,flex:"1 1 180px",background:"#1E272A",color:"#fff",display:"grid",gap:4}}><span style={{color:"#E58A5F",fontSize:12}}>Score · goal: {nice(r.goal)}</span><span style={{fontFamily:"Newsreader,serif",fontSize:56,lineHeight:1}}>{nice(r.score)} <small style={{fontSize:18}}>/ 100</small></span></div>
 <div style={{...panel,flex:"1 1 180px",background:"#B5532C",color:"white",display:"grid",gap:4}}><span style={{fontSize:12}}>Gaps may cost</span><span style={{fontFamily:"Newsreader,serif",fontSize:36}}>Not recorded</span><small>Use figures from the complete assessment</small></div></div>
 <div style={{...panel,display:"grid",gap:10}}><strong>Assessment summary</strong><p style={{whiteSpace:"pre-wrap",lineHeight:1.6}}>{nice(r.summary)}</p><div style={{borderTop:"1px solid #E7EBE6",paddingTop:12,fontSize:13}}>Goal: {nice(r.goal)}</div></div></div>
 <div style={{flex:"1 1 300px",display:"grid",gap:12}}>
 <div style={{...panel,display:"grid",gap:10}}><strong>{nice(r.name)}</strong><span style={muted}>{nice(r.email)}</span><Form method="post" style={{display:"grid",gap:6}}><input type="hidden" name="operation" value="move_assessment"/><input type="hidden" name="id" value={nice(r.id)}/><label style={muted}>Pipeline stage</label><select style={field} name="value" defaultValue={nice(r.stage)}>{stages.map((x,i)=><option key={x} value={x}>{stageNames[i]}</option>)}</select><button style={btn}>Save stage</button></Form><a href={"mailto:"+nice(r.email)} style={{...btn,textAlign:"center",lineHeight:"40px"}}>Email</a></div>
 <div style={{...panel,display:"grid",gap:10}}><strong>Notes and activity</strong><Form method="post" style={{display:"grid",gap:8}}><input type="hidden" name="operation" value="assessment_note"/><input type="hidden" name="id" value={nice(r.id)}/><textarea style={{...field,padding:10,minHeight:90}} maxLength={2000} name="value" required placeholder="Add a note"/><button style={{...btn,justifySelf:"start",background:"#1E272A"}}>Add Note</button></Form>{(data.notes||[]).map((n,i)=><div key={i} style={{borderTop:"1px solid #E7EBE6",paddingTop:8,fontSize:13,whiteSpace:"pre-wrap"}}>{nice(n.note)}<div style={muted}>{nice(n.author)} · {date(n.created_at)}</div></div>)}</div></div></div>;
}
const replies=[
 ["Suggest a call","Thanks for getting in touch. This sounds like something we can help with. Would a 30-minute call this week work? You can choose a time on our website."],
 ["Ask for detail","Thanks for your note. Could you tell us a little more about how this shows up day to day, and roughly how many people are involved?"],
 ["Not a fit","Thank you for thinking of us. This needs a licensed specialist, which we are not. We would be happy to suggest someone who can help."]
];
export function InboxScreen({data,selected}:{data:Data;selected:string}){
 const [reply,setReply]=useState("");
 const rows=data.records||[],thread=rows.find(x=>x.id===selected)||rows[0],active=nice(thread?.id);
 const navigation=useNavigation();
 return <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"start"}}>
 <div style={{flex:"1 1 300px",...panel,padding:0,overflow:"hidden"}}>
 {rows.length?rows.map(r=><Link key={nice(r.id)} to={"/admin?view=inbox&item="+encodeURIComponent(nice(r.id))} style={{display:"grid",gap:3,padding:"14px 16px",border:0,borderBottom:"1px solid #E7EBE6",borderLeft:"3px solid "+(active===r.id?"#B5532C":"transparent"),background:active===r.id?"#F4F5F1":"#fff",color:"#1E272A"}}>
 <span style={{display:"flex",justifyContent:"space-between",gap:8}}><strong>{nice(r.name)}</strong><strong style={{fontSize:11,color:r.thread_status==="new"?"#B5532C":"#2E6B5C"}}>{nice(r.thread_status).replace(/^./,s=>s.toUpperCase())}</strong></span>
 <span style={{fontSize:13,fontWeight:600}}>{nice(r.business_name)}</span><span style={{...muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{nice(r.message)}</span></Link>):<PanelEmpty description="No real contact enquiries have been received."/>}</div>
 <div style={{flex:"2 1 420px",...panel,display:"grid",gap:14}}>
 {thread?<><div style={{display:"flex",flexWrap:"wrap",justifyContent:"space-between",gap:10}}>
 <div><strong style={{fontSize:16}}>{nice(thread.name)} · {nice(thread.business_name)}</strong><div style={muted}>{nice(thread.email)} · received {date(thread.submitted_at)}</div></div>
 <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
 <Form method="post" style={{display:"flex",gap:4}}><input type="hidden" name="operation" value="inbox_assign"/><input type="hidden" name="id" value={active}/><select style={{...field,width:150}} name="value" defaultValue={nice(thread.assigned_user_id)} aria-label="Owner"><option value="">Unassigned</option>{(data.members||[]).map(m=><option key={nice(m.id)} value={nice(m.id)}>{nice(m.name)}</option>)}</select><button style={{...btn,padding:"0 10px"}}>Assign</button></Form>
 <Form method="post" style={{display:"flex",gap:4}}><input type="hidden" name="operation" value="inbox_status"/><input type="hidden" name="id" value={active}/><select style={{...field,width:120}} name="value" defaultValue={nice(thread.thread_status)} aria-label="Status"><option value="new">New</option><option value="replied">Replied</option><option value="closed">Closed</option></select><button style={{...btn,padding:"0 10px"}}>Save</button></Form>
 </div></div>
 <div style={{display:"grid",gap:12,padding:"8px 0"}}>
 <div style={{justifySelf:"start",maxWidth:"88%",background:"#E7EBE6",borderRadius:14,padding:"12px 14px"}}><small style={{fontWeight:700,color:"#5E6967"}}>{nice(thread.name)} · {date(thread.submitted_at)}</small><div style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.55,marginTop:5}}>{nice(thread.message)}</div></div>
 {(data.replies||[]).map(r=><div key={nice(r.id)} style={{justifySelf:"end",maxWidth:"88%",background:"#1E272A",color:"#fff",borderRadius:14,padding:"12px 14px"}}><small style={{fontWeight:700,opacity:.75}}>{nice(r.author)} · {date(r.created_at)} · {nice(r.mail_status)||"Queued"}</small><div style={{whiteSpace:"pre-wrap",fontSize:14,lineHeight:1.55,marginTop:5}}>{nice(r.body)}</div></div>)}
 </div>
 <Form method="post" style={{display:"grid",gap:8,borderTop:"1px solid #E7EBE6",paddingTop:16}}><input type="hidden" name="operation" value="inbox_reply"/><input type="hidden" name="id" value={active}/><input type="hidden" name="value" value={reply}/>
 <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{replies.map(([label,msg])=><button key={label} type="button" onClick={()=>setReply("Hello "+nice(thread.name).split(" ")[0]+",\n\n"+msg+"\n\nHUMMIN")} style={{...btn,minHeight:32,background:"#F4F5F1",border:"1px solid #D0D8D2",color:"#1E272A",fontSize:12}}>{label}</button>)}</div>
 <textarea style={{...field,padding:12,minHeight:110,lineHeight:1.5}} aria-label="Reply" placeholder="Write a reply. Delivered from HUMMIN's verified sender with sales@hummin.org as the reply address." maxLength={8000} value={reply} onChange={e=>setReply(e.target.value)}/>
 <button disabled={!reply.trim()||navigation.state!=="idle"} style={{...btn,justifySelf:"end",opacity:reply.trim()?1:.5}}>{navigation.state==="submitting"?"Queuing…":"Send Reply"}</button>
 </Form></>:<PanelEmpty description="Select a conversation from the inbox."/>}
 </div></div>;
}
const topicOptions=["Strategy","Technology","Marketing","Operations","Talent","Data","Specialist Partners"];
type EditorPost={id?:string;source_slug?:string;slug:string;title:string;excerpt:string;type:string;author:string;status:string;topics:string[];blocks:{t:string;text:string}[]};
function toPost(p:RecordRow):EditorPost{
 let topics:string[]=[],blocks:{t:string;text:string}[]=[];
 try{topics=JSON.parse(nice(p.topics_json)||"[]");}catch{}
 try{blocks=JSON.parse(nice(p.blocks_json)||"[]");}catch{}
 return {id:nice(p.id),source_slug:nice(p.source_slug),slug:nice(p.slug),title:nice(p.title),excerpt:nice(p.excerpt),type:nice(p.type)||"Guide",author:nice(p.author),status:nice(p.status),topics,blocks};
}
const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export function InsightsListScreen({data,original}:{data:Data;original:RecordRow[]}){
 const posts=data.records||[];
 const existing=new Set(posts.map(p=>nice(p.source_slug)).filter(Boolean));
 const rows:RecordRow[]=[...posts.map(p=>({...p,origin:"CMS"})),...original.filter(p=>!existing.has(nice(p.slug))).map(p=>({...p,id:"",source_slug:p.slug,origin:"Bundled",status:"published"}))];
 return <div style={{display:"grid",gap:12}}><div style={{display:"flex",justifyContent:"flex-end"}}><Link to="/admin?view=post&item=new" style={{...btn,lineHeight:"42px",color:"white"}}>New Post</Link></div>
 <div style={{...panel,padding:0,overflow:"hidden"}}>{rows.map((p,i)=><Link key={nice(p.id)||nice(p.slug)} to={"/admin?view=post&item="+encodeURIComponent(nice(p.id)||"original:"+nice(p.slug))} style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"8px 14px",padding:"14px 16px",borderBottom:"1px solid #E7EBE6",color:"#1E272A"}}>
 <span style={{borderRadius:99,padding:"4px 10px",fontSize:11,fontWeight:700,color:p.status==="published"?"#2E6B5C":"#434F4F",background:p.status==="published"?"#DCEBE5":"#E7EBE6"}}>{p.status==="published"?"Published":nice(p.status)}</span>
 <span style={{flex:"2 1 220px"}}><strong style={{display:"block",fontSize:15}}>{nice(p.title)||"Untitled"}</strong><small style={muted}>{nice(p.type)} · {nice(p.author)} · {nice(p.origin)}</small></span><span style={muted}>{date(p.updated_at||p.date)}</span></Link>)}
 {!rows.length?<PanelEmpty description="No posts yet. Create the first draft with New Post."/>:null}</div></div>;
}
export function InsightsEditorScreen({data,original,selected}:{data:Data;original:RecordRow[];selected:string}){
 const found=data.records.find(r=>r.id===selected),seed=selected.startsWith("original:")?original.find(p=>p.slug===selected.slice(9)):null;
 const starting=found?toPost(found):seed?{slug:nice(seed.slug),source_slug:nice(seed.slug),title:nice(seed.title),excerpt:nice(seed.excerpt),type:nice(seed.type).replace(/^./,x=>x.toUpperCase()),author:nice(seed.author),status:"published",topics:(seed.topics as string[])||[],blocks:[]}: {slug:"",title:"",excerpt:"",type:"Guide",author:"HUMMIN",status:"draft",topics:[],blocks:[{t:"p",text:""}]};
 const [post,setPost]=useState<EditorPost>(starting);
 const [publish,setPublish]=useState(false);
 const navigation=useNavigation(),pending=navigation.state!=="idle";
 const change=(x:Partial<EditorPost>)=>setPost(p=>({...p,...x}));
 const block=(i:number,patch:Partial<{t:string;text:string}>)=>change({blocks:post.blocks.map((b,k)=>k===i?{...b,...patch}:b)});
 const move=(i:number,offset:number)=>{const b=[...post.blocks],j=i+offset;if(j<0||j>=b.length)return;[b[i],b[j]]=[b[j],b[i]];change({blocks:b});};
 const words=post.blocks.reduce((sum,b)=>sum+b.text.trim().split(/\s+/).filter(Boolean).length,0);
 return <div style={{display:"flex",flexWrap:"wrap",gap:16,alignItems:"start"}}>
 <Form method="post" id="insights-editor-form" style={{display:"contents"}}>
 <input type="hidden" name="operation" value={publish?"post_publish":"post_save"}/><input type="hidden" name="id" value={post.id||""}/><input type="hidden" name="source_slug" value={post.source_slug||""}/><input type="hidden" name="blocks" value={JSON.stringify(post.blocks)}/><input type="hidden" name="topics" value={JSON.stringify(post.topics)}/><input type="hidden" name="title" value={post.title}/><input type="hidden" name="excerpt" value={post.excerpt}/><input type="hidden" name="type" value={post.type}/><input type="hidden" name="slug" value={post.slug}/>
 <div style={{...panel,flex:"3 1 520px",maxWidth:820,display:"grid",gap:10,padding:"clamp(16px,3vw,36px)"}}>
 <input aria-label="Title" placeholder="Title" value={post.title} onChange={e=>change({title:e.target.value,...(!post.id&&!post.source_slug?{slug:slugify(e.target.value)}:{})})} style={{border:0,outline:0,font:"400 clamp(28px,3.4vw,40px)/1.1 Newsreader,serif",width:"100%"}}/>
 <textarea aria-label="Summary" value={post.excerpt} rows={2} placeholder="One-sentence summary" onChange={e=>change({excerpt:e.target.value})} style={{border:0,outline:0,resize:"vertical",fontSize:16,lineHeight:1.5,padding:"0 0 10px",borderBottom:"1px solid #E7EBE6"}}/>
 {seed&&!found?<p style={{...muted,padding:12,background:"#FFF4F0"}}>This article is bundled with the website. Import or recreate its full body before saving an edited version; saving here will not silently replace the current public article.</p>:null}
 {post.blocks.map((b,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"28px minmax(0,1fr) auto",gap:8,padding:"6px 0",alignItems:"start"}}>
 <span style={{color:"#BAC4BE",fontSize:12,paddingTop:8}}>{({p:"¶",h:"H",ul:"•",dl:"↓",as:"★"} as Record<string,string>)[b.t]}</span>
 {b.t==="dl"?<select style={{...field,background:"#B5532C",color:"white"}} value={b.text} onChange={e=>block(i,{text:e.target.value})}><option value="30-day enquiry log">30-day enquiry log</option><option value="Monday figures template">Monday figures template</option></select>:
 b.t==="as"?<div style={{padding:"12px 14px",borderRadius:12,background:"#1E272A",color:"#F4F5F1",fontSize:13}}>Assessment prompt · “See where your business stands.”</div>:
 <textarea aria-label={b.t==="h"?"Heading":b.t==="ul"?"List":"Paragraph"} rows={b.t==="h"?1:3} value={b.text} onChange={e=>block(i,{text:e.target.value})} placeholder={b.t==="h"?"Heading":b.t==="ul"?"One item per line":"Write here"} style={{border:0,width:"100%",outline:0,resize:"vertical",background:"transparent",font:b.t==="h"?"400 24px/1.55 Newsreader,serif":"16px/1.55 Figtree,sans-serif",padding:"6px 0"}}/>}
 <div style={{display:"flex",gap:2,paddingTop:4}}>{([["↑",-1],["↓",1]] as const).map(([label,k])=><button key={label} type="button" onClick={()=>move(i,k)} aria-label={k===-1?"Move block up":"Move block down"} style={{border:0,width:28,height:28,background:"transparent",cursor:"pointer"}}>{label}</button>)}<button type="button" aria-label="Delete block" onClick={()=>change({blocks:post.blocks.filter((_,k)=>k!==i)})} style={{border:0,width:28,height:28,color:"#B5532C",background:"transparent",cursor:"pointer"}}>×</button></div></div>)}
 <div style={{display:"flex",gap:6,flexWrap:"wrap",borderTop:"1px dashed #D0D8D2",paddingTop:12,alignItems:"center"}}><span style={muted}>Add</span>{([["p","Paragraph"],["h","Heading"],["ul","List"],["dl","Download"],["as","Assessment prompt"]] as const).map(([t,label])=><button type="button" key={t} style={{minHeight:32,padding:"0 12px",border:"1px solid #D0D8D2",background:"#F4F5F1",borderRadius:99,fontSize:12,cursor:"pointer"}} onClick={()=>change({blocks:[...post.blocks,{t,text:t==="dl"?"30-day enquiry log":""}]})}>+ {label}</button>)}</div>
 </div>
 <div style={{flex:"1 1 260px",display:"grid",gap:12,position:"sticky",top:84}}>
 <div style={{...panel,display:"grid",gap:12,padding:16}}>
 <div style={{display:"flex",justifyContent:"space-between"}}><strong>Status</strong><span style={{fontSize:11,borderRadius:99,background:"#E7EBE6",padding:"4px 10px"}}>{post.status}</span></div>
 <label style={muted}>Type<select style={field} value={post.type} onChange={e=>change({type:e.target.value})}>{["Guide","Opinion","News","Guest partner"].map(t=><option key={t}>{t}</option>)}</select></label>
 <label style={muted}>URL slug<input style={field} value={post.slug} onChange={e=>change({slug:slugify(e.target.value)})} maxLength={120}/></label>
 <div><span style={muted}>Topics</span><div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>{topicOptions.map(t=><button key={t} type="button" aria-pressed={post.topics.includes(t)} onClick={()=>change({topics:post.topics.includes(t)?post.topics.filter(x=>x!==t):[...post.topics,t]})} style={{padding:"6px 10px",borderRadius:99,fontSize:12,fontWeight:600,border:"1px solid #D0D8D2",background:post.topics.includes(t)?"#1E272A":"white",color:post.topics.includes(t)?"white":"#1E272A"}}>{t}</button>)}</div></div>
 <span style={muted}>{post.author||"HUMMIN"} · {words} words · {Math.max(1,Math.ceil(words/220))} min read</span>
 <button type="submit" style={btn} disabled={pending} onClick={()=>setPublish(false)}>Save Draft</button>
 <button type="submit" style={{...btn,background:"#1E272A"}} disabled={pending} onClick={()=>setPublish(true)}>{post.status==="published"?"Update":"Publish"}</button>
 <small style={{...muted,lineHeight:1.6}}>CMS records are stored and versioned. Public article rendering still uses the current bundled source; publishing to the public site will only be enabled after the rendering adapter is validated.</small>
 </div></div></Form></div>;
}
