import {Link,useLoaderData} from "react-router";
import {useMemo,useState} from "react";
import {insightsAuthors,insightTopics,insightTopicSlug,insightTopicLeads} from "../lib/react-insights-meta";
import "./react-insights.css";
import "./react-insights-source-index.css";
import {ReactAssessmentPromotion} from "./ReactAssessmentPromotion";
import {SourceEditorialHero} from "./SourcePrimitives";
import "./source-editorial-hero.css";
import {SourceEditorialCard} from "./SourceEditorialCard";
import {ReactInsightArticle,ReactInsightsNewsletter} from "./ReactInsightArticle";
type Block={t:"p"|"h"|"ul"|"ol"|"dl"|"assess";text?:string;items?:string[];id?:string};
export type ReactPost={slug:string;title:string;excerpt:string;type:"guide"|"opinion"|"news";author:"team"|"muiruri";date:string;topics:string[];blocks:Block[];featured?:boolean;steps?:string;figure?:string};
export type ReactInsightsProps={posts:ReactPost[];view:"index"|"article"|"author"|"topic";selected?:string;preview?:boolean};
const topicName=(slug:string)=>insightTopics.find(t=>insightTopicSlug(t)===slug);
const fmtDate=(date:string)=>new Date(date+"T12:00:00Z").toLocaleDateString("en-KE",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
const typeLabel=(t:string)=>t==="guide"?"Practical guide":t==="opinion"?"Perspective":"News";
function BlockView({block}:{block:Block}){
 switch(block.t){
  case "p":return <p>{block.text}</p>;
  case "h":return <h2>{block.text}</h2>;
  case "ul":return <ul>{block.items?.map((x,i)=><li key={i}>{x}</li>)}</ul>;
  case "ol":return <ol>{block.items?.map((x,i)=><li key={i}>{x}</li>)}</ol>;
  case "assess":return <aside className="hr-insights-assess"><h3>Find out what's holding your business back.</h3><p>Start with HUMMIN's business assessment, then use your results to decide what to work on first.</p><Link to="/assessment">Take the Assessment →</Link></aside>;
  case "dl":return <aside className="hr-insights-download"><h3>{block.id==="monday-template"?"Five figures every Monday":"30-day enquiry log"}</h3>
   <p>{block.id==="monday-template"?"Get the editable HUMMIN workbook to track your weekly business figures.":"Keep a simple record of every enquiry, response and outcome for 30 days."}</p>
   {block.id==="monday-template"?<Link to="/insights/download/monday-template">Request the editable workbook →</Link>:<Link to="/contact">Ask HUMMIN about the enquiry log →</Link>}
  </aside>;
 }
}
function InsightCard({p,base}:{p:ReactPost;base:string}){
 return <Link className="hr-insights-card" to={base+"/"+p.slug}><div className="hr-insights-card-meta"><span>{typeLabel(p.type)}</span><span>{fmtDate(p.date)}</span></div><div><h3>{p.title}</h3><p>{p.excerpt}</p></div><span className="hr-insights-card-end">Read article <span aria-hidden="true">↗</span></span></Link>;
}
function SourceDownloads(){
 const downloads=[
  {kind:"Checklist",access:"Free download",title:"30-day enquiry log",desc:"A one-page sheet to record every enquiry for 30 days, with a Friday review checklist.",format:"PDF · 1 page",url:"/downloads/enquiry-log.pdf",label:"Download PDF ↓"},
  {kind:"Template",access:"Free, sent by email",title:"Monday figures template",desc:"A ready-made sheet for the five weekly figures, with 12 weeks of history and a simple chart.",format:"Spreadsheet · Excel and Google Sheets",url:"/insights/download/monday-template",label:"Email Me the Template ↓"}
 ];
 return <section className="hr-insights-downloads" aria-labelledby="hr-insights-downloads-title">
  <div className="hr-insights-source-section-title"><span>CHECKLISTS AND TEMPLATES</span><h2 id="hr-insights-downloads-title">Tools to use this week.</h2></div>
  <div className="hr-insights-download-cards">{downloads.map((d,i)=><div className={"hr-insights-download-card hr-insights-download-"+i} key={d.title}>
   <div className="hr-insights-download-card-head"><span>{d.kind}</span><span>{d.access}</span></div>
   <div><h3>{d.title}</h3><p>{d.desc}</p><span>{d.format}</span></div>
   <Link to={d.url} reloadDocument={i===0}>{d.label}</Link>
  </div>)}</div>
 </section>;
}
function SourceInsightsLanding({posts,base}:{posts:ReactPost[];base:string}){
 const featured=posts.find(p=>p.featured)||posts.find(p=>p.slug==="enquiries-30-day-fix")||posts[0];
 if(!featured)return null;
 const latest=posts.filter(p=>p.slug!==featured.slug).slice(0,6);
 return <div className="hr-insights-original-index">
  <Link to={base+"/"+featured.slug} className="hr-insights-featured">
   <div className="hr-insights-featured-figure"><img src="/brand/insights-article-figure.svg" alt="" aria-hidden="true"/><span>{featured.figure||"Image: an enquiry book on a shop counter."}</span></div>
   <div className="hr-insights-featured-story"><div className="hr-insights-featured-label"><span>Featured</span><span>Guide</span></div>
    <h2>{featured.title}</h2><p>{featured.excerpt}</p>
    <div className="hr-insights-featured-author"><span>{insightsAuthors[featured.author].name}</span><time dateTime={featured.date}>{fmtDate(featured.date)}</time><span>2 min read</span></div>
   </div>
  </Link>
  <section className="hr-insights-latest"><h2>Latest</h2><div>{latest.map(p=><SourceEditorialCard key={p.slug} post={p} base={base} variant="latest"/>)}</div></section>
  <SourceDownloads/>
 </div>;
}
export function ReactInsights({posts,view,selected="",preview=false}:ReactInsightsProps){
 const [q,setQ]=useState(""),[type,setType]=useState("all");
 const base=preview?"/__react/insights":"/insights";
 const filtered=useMemo(()=>posts.filter(p=>{
  if(view==="author"&&p.author!==selected)return false;
  if(view==="topic"&&!p.topics.some(t=>insightTopicSlug(t)===selected))return false;
  if(view==="index"&&type!=="all"&&!(type==="download"?p.blocks.some(b=>b.t==="dl"):p.type===type))return false;
  const needle=q.toLowerCase().trim();
  return !needle||[p.title,p.excerpt,...p.topics].join(" ").toLowerCase().includes(needle);
 }),[posts,view,selected,q,type]);
 const active=posts.find(p=>p.slug===selected);
 const author=view==="author"?insightsAuthors[selected as keyof typeof insightsAuthors]:null;
 const topic=view==="topic"?topicName(selected):null;
 if(view==="article"&&active)return <ReactInsightArticle post={active} posts={posts} base={base}/>;
 return <div className={"hr-insights-page"+(view==="index"?" hr-insights-index-page":"")}>
  <SourceEditorialHero className={"hr-insights-hero"+(view==="index"?" hr-insights-index-hero":"")} markClassName="hr-insights-watermark" innerClassName="hr-insights-hero-inner">
    {view==="index"?<>
     <span className="hr-insights-source-chip">Guides · Opinion · Downloads · News</span>
     <h1>Insights.</h1>
     <div className="hr-insights-index-intro"><p>Practical guides, opinion, and news for owners of established businesses. Written by the people who do the work.</p>
      <label className="hr-insights-hero-search"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/></svg>
       <input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search guides, opinion, and news" aria-label="Search guides, opinion, and news"/>
      </label>
     </div>
    </>:<>
     <Link className="hr-insights-source-back" to={base}>← All Insights</Link>
     {view==="topic"&&topic?<>
      <span className="hr-insights-source-eyebrow">Topic</span>
      <h1 className="hr-insights-source-list-title">{topic}</h1>
      <p className="hr-insights-source-list-lead">{insightTopicLeads[topic]}</p>
     </>:view==="author"&&author?<>
      <div className="hr-insights-source-author-heading">
       <div className="hr-insights-source-author-avatar">{selected==="muiruri"?<img src="/brand/about-founder.webp" alt="Portrait of Muiruri Beautah"/>:<img src="/brand/insights-team-avatar.svg" alt=""/>}</div>
       <div><span className="hr-insights-source-eyebrow">Author</span><h1 className="hr-insights-source-list-title">{author.name}</h1><span className="hr-insights-source-author-role">{author.role}</span></div>
      </div>
      <p className="hr-insights-source-list-lead">{author.bio}</p>
     </>:null}
    </>}
  </SourceEditorialHero>
  <div className="hr-insights-main">
  {view==="article"&&active?<div className="hr-insights-article-layout">
   <article className="hr-insights-article">
    <div className="hr-insights-byline"><span>{typeLabel(active.type)}</span><span>{fmtDate(active.date)}</span><Link to={base+"/author/"+active.author}>{insightsAuthors[active.author].name}</Link></div>
    {active.blocks.map((block,i)=><BlockView key={i} block={block}/>)}
    <div className="hr-insights-topics">{active.topics.map(t=><Link key={t} to={base+"/topic/"+insightTopicSlug(t)}>{t}</Link>)}</div>
   </article>
   <aside className="hr-insights-sidebar"><h2>More from HUMMIN</h2>{posts.filter(p=>p.slug!==active.slug).slice(0,3).map(p=><Link key={p.slug} to={base+"/"+p.slug}>{p.title}<span aria-hidden="true">↗</span></Link>)}<Link to={base}>All Insights →</Link></aside>
  </div>:<>

   {view==="index"?<div className="hr-insights-source-filters">
     <div className="hr-insights-types" role="group" aria-label="Filter articles by type">
      {([
       ["all","All",posts.length],
       ["guide","Guides",posts.filter(p=>p.type==="guide").length],
       ["opinion","Opinion",posts.filter(p=>p.type==="opinion").length],
       ["download","Downloads",posts.filter(p=>p.blocks.some(b=>b.t==="dl")).length],
       ["news","News",posts.filter(p=>p.type==="news").length]
      ] as [string,string,number][]).map(([val,label,count])=><button type="button" key={val} aria-label={label} className={type===val?"active":""} onClick={()=>setType(val)} aria-pressed={type===val}>{label} <span aria-hidden="true">{count}</span></button>)}
     </div>
     <div className="hr-insights-source-topics"><span>Topics</span><div>{insightTopics.map(t=><Link key={t} to={base+"/topic/"+insightTopicSlug(t)}>{t} <span>{posts.filter(p=>p.topics.includes(t)).length}</span></Link>)}</div></div>
   </div>:null}
   {view==="index"?(type==="all"&&!q.trim()?<SourceInsightsLanding posts={posts} base={base}/>:<div className="hr-insights-grid">{filtered.map(p=><InsightCard key={p.slug} p={p} base={base}/>)}</div>):
     <section className="hr-insights-source-list">
      <span className="hr-insights-source-result" role="status">{filtered.length} {filtered.length===1?"article":"articles"}</span>
      {filtered.length?<div className="hr-insights-source-list-cards">{filtered.map(p=><SourceEditorialCard key={p.slug} post={p} base={base} variant="archive"/>)}</div>:
       <div className="hr-insights-source-no-results"><h2>Nothing here yet.</h2><p>We publish when we have something useful to say. Subscribe below to hear when we do.</p></div>}
      {view==="topic"&&topic?<Link className="hr-insights-source-to-core" to="/applied-expertise">How we help with {topic}</Link>:null}
     </section>}
   {view==="index"&&filtered.length===0?<p role="status" className="hr-insights-empty">No articles match this selection.</p>:null}
   
  </>}
  </div>
  <div className="hr-insights-source-newsletter-wrap"><ReactInsightsNewsletter/></div>
 </div>;
}
export function ReactInsightsRoute(){
 const data=useLoaderData() as ReactInsightsProps;
 return <><ReactInsights {...data}/><ReactAssessmentPromotion/></>;
}
