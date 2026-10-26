import {Link,useLoaderData} from "react-router";
import {useMemo,useState} from "react";
import {insightsAuthors,insightTopics,insightTopicSlug} from "../lib/insights.server";
import "./react-insights.css";
type Block={t:"p"|"h"|"ul"|"ol"|"dl"|"assess";text?:string;items?:string[];id?:string};
export type ReactPost={slug:string;title:string;excerpt:string;type:"guide"|"opinion"|"news";author:"team"|"muiruri";date:string;topics:string[];blocks:Block[];featured?:boolean;steps?:string};
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
export function ReactInsights({posts,view,selected="",preview=false}:ReactInsightsProps){
 const [q,setQ]=useState(""),[type,setType]=useState("all");
 const base=preview?"/__react/insights":"/insights";
 const filtered=useMemo(()=>posts.filter(p=>{
  if(view==="author"&&p.author!==selected)return false;
  if(view==="topic"&&!p.topics.some(t=>insightTopicSlug(t)===selected))return false;
  if(view==="index"&&type!=="all"&&p.type!==type)return false;
  const needle=q.toLowerCase().trim();
  return !needle||[p.title,p.excerpt,...p.topics].join(" ").toLowerCase().includes(needle);
 }),[posts,view,selected,q,type]);
 const active=posts.find(p=>p.slug===selected);
 const author=view==="author"?insightsAuthors[selected as keyof typeof insightsAuthors]:null;
 const topic=view==="topic"?topicName(selected):null;
 return <div className="hr-insights-page">
  <section className="hr-insights-hero">
   <div className="hr-insights-hero-inner">
    <p className="hr-insights-kicker">{view==="article"?"HUMMIN / ARTICLE":view==="index"?"HUMMIN / INSIGHTS":view==="author"?"HUMMIN / AUTHORS":"HUMMIN / TOPICS"}</p>
    {view==="article"&&active?<><h1>{active.title}</h1><p>{active.excerpt}</p></>:
     view==="author"&&author?<><h1>{author.name}</h1><p>{author.bio}</p></>:
     view==="topic"&&topic?<><h1>{topic}.</h1><p>Practical notes and guidance on {topic.toLowerCase()} for owner-led businesses.</p></>:
     <><h1>Practical notes for owners.</h1><p>Guides, perspectives and news from inside HUMMIN. Useful ideas for people building stronger businesses.</p></>}
   </div>
  </section>
  <div className="hr-insights-main">
  {view==="article"&&active?<div className="hr-insights-article-layout">
   <article className="hr-insights-article">
    <div className="hr-insights-byline"><span>{typeLabel(active.type)}</span><span>{fmtDate(active.date)}</span><Link to={base+"/author/"+active.author}>{insightsAuthors[active.author].name}</Link></div>
    {active.blocks.map((block,i)=><BlockView key={i} block={block}/>)}
    <div className="hr-insights-topics">{active.topics.map(t=><Link key={t} to={base+"/topic/"+insightTopicSlug(t)}>{t}</Link>)}</div>
   </article>
   <aside className="hr-insights-sidebar"><h2>More from HUMMIN</h2>{posts.filter(p=>p.slug!==active.slug).slice(0,3).map(p=><Link key={p.slug} to={base+"/"+p.slug}>{p.title}<span aria-hidden="true">↗</span></Link>)}<Link to={base}>All Insights →</Link></aside>
  </div>:<>
   <nav className="hr-insights-breadcrumb" aria-label="Insights breadcrumb"><Link to={base}>All Insights</Link>{view==="author"&&author?<span>/ {author.name}</span>:view==="topic"&&topic?<span>/ {topic}</span>:null}</nav>
   {view==="index"?<div className="hr-insights-filters">
     <div role="group" aria-label="Filter articles by type">{[["all","All"],["guide","Guides"],["opinion","Perspectives"],["news","News"]].map(([val,label])=><button type="button" key={val} className={type===val?"active":""} onClick={()=>setType(val)} aria-pressed={type===val}>{label}</button>)}</div>
     <label className="hr-insights-search">Search <input type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Find an article…"/></label>
   </div>:null}
   <div className="hr-insights-grid">{filtered.map(p=><InsightCard key={p.slug} p={p} base={base}/>)}</div>
   {filtered.length===0?<p role="status" className="hr-insights-empty">No articles match this selection.</p>:null}
   {view==="index"?<div className="hr-insights-topiclinks"><h2>Explore by topic</h2>{insightTopics.map(t=><Link key={t} to={base+"/topic/"+insightTopicSlug(t)}>{t}</Link>)}</div>:null}
  </>}
  </div>
 </div>;
}
export function ReactInsightsRoute(){
 const data=useLoaderData() as ReactInsightsProps;
 return <ReactInsights {...data}/>;
}
