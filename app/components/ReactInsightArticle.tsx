import {useEffect,useState} from "react";
import {Link} from "react-router";
import {ReactTurnstile} from "./ReactTurnstile";
import type {ReactPost} from "./ReactInsights";
import "./react-article.css";

type Props={post:ReactPost;posts:ReactPost[];base:string};
const articleId=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const niceDate=(s:string)=>new Date(s+"T12:00:00Z").toLocaleDateString("en-KE",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
const shortDate=(s:string)=>new Date(s+"T12:00:00Z").toLocaleDateString("en-KE",{day:"numeric",month:"short",timeZone:"UTC"});
const authors={team:"HUMMIN Team",muiruri:"Muiruri Beautah"};
const minutes=(p:ReactPost)=>p.slug==="enquiries-30-day-fix"?2:p.slug==="five-monday-figures"?3:p.type==="news"?1:3;
const safeShare=(u:string)=>encodeURIComponent(u);
function SourceBlock({b}:{b:ReactPost["blocks"][number]}){
 if(b.t==="p")return <p className="ra-source-p">{b.text}</p>;
 if(b.t==="h")return <h2 id={articleId(b.text||"")} className="ra-source-h">{b.text}</h2>;
 if(b.t==="ul")return <ul className="ra-source-ul">{b.items?.map((x,i)=><li key={i}>{x}</li>)}</ul>;
 if(b.t==="ol")return <ol className="ra-source-ol">{b.items?.map((x,i)=><li key={i}><span>{i+1}</span><p>{x}</p></li>)}</ol>;
 if(b.t==="assess")return <aside className="ra-source-assessment"><div><h3>See where your business stands.</h3><p>23 short questions, about 8 minutes. You get a score, an estimate of what the gaps cost, and a 30-day plan.</p></div><Link to="/assessment">Take the Assessment</Link></aside>;
 if(b.t==="dl"){
  const pdf=b.id==="enquiry-log";
  return <aside className={"ra-source-download"+(pdf?" ra-source-pdf":"")}><div><span>{pdf?"CHECKLIST · FREE DOWNLOAD":"TEMPLATE · EMAIL DELIVERY"}</span><h3>{pdf?"30-day enquiry log":"Monday figures template"}</h3><p>{pdf?"A one-page sheet to record every enquiry for 30 days, with a Friday review checklist.":"A ready-made sheet for the five weekly figures, with 12 weeks of history and a simple chart."}</p></div>
   <Link to={pdf?"/downloads/enquiry-log.pdf":"/insights/download/monday-template"} reloadDocument={pdf}>{pdf?"Download PDF ↓":"Request template ↓"}</Link>
  </aside>;
 }
 return null;
}
function EditorialCard({post,base}:{post:ReactPost;base:string}){
 return <Link to={base+"/"+post.slug} className={"ra-source-related-card ra-source-related-"+post.type}><span className="ra-related-top"><span>{post.type==="guide"?"Guide":post.type==="opinion"?"Opinion":"News"}</span><span>{minutes(post)} min read</span></span><strong>{post.title}</strong></Link>;
}
function Newsletter(){
 const [email,setEmail]=useState(""),[token,setToken]=useState(""),[key,setKey]=useState(""),[busy,setBusy]=useState(false),[challenge,setChallenge]=useState(false),[status,setStatus]=useState(""),[done,setDone]=useState(false);
 useEffect(()=>{fetch("/api/email/config",{cache:"no-store"}).then(r=>r.json()).then((raw:unknown)=>{const d=raw as {ready?:boolean;siteKey?:string};if(d.ready&&d.siteKey)setKey(d.siteKey)}).catch(()=>{});},[]);
 const subscribe=async(e:React.FormEvent)=>{
  e.preventDefault();if(!email.trim()||busy)return;
  if(!challenge){setChallenge(true);setStatus("Complete the security verification to confirm your request.");return;}
  if(!token){setStatus("Complete verification to subscribe.");return;}
  setBusy(true);setStatus("");
  try{
   const form=new FormData();form.set("email",email.trim());form.set("cf-turnstile-response",token);
   const response=await fetch("/newsletter",{method:"POST",body:form});
   const d=await response.json() as {ok?:boolean;message?:string};
   if(!response.ok||!d.ok)throw Error(d.message||"Subscription request failed.");
   setDone(true);setStatus(d.message||"Check your inbox to confirm your subscription.");
  }catch(err){setStatus(err instanceof Error?err.message:"Subscription temporarily unavailable.");setToken("");}
  finally{setBusy(false);}
 };
 return <section className="ra-source-newsletter" aria-label="Newsletter"><div className="ra-source-newsletter-copy"><span>NOTES FROM HUMMIN</span><h2>Get new Insights by email.</h2><p>Sent when we publish something useful, not on a schedule. Unsubscribe in one click.</p></div>
  <div className="ra-source-newsletter-entry">{done?<p role="status">{status}</p>:key?<form onSubmit={subscribe}><div><label><span className="ra-visually-hidden">Work email</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@business.com" maxLength={254}/></label><button type="submit" disabled={busy}>{busy?"Subscribing…":challenge?"Confirm subscription":"Subscribe"}</button></div>{challenge?<ReactTurnstile siteKey={key} onToken={setToken}/>:null}<p role="status">{status}</p></form>:<Link to="/newsletter">Subscribe to Notes from HUMMIN</Link>}</div>
 </section>;
}
export function ReactInsightArticle({post,posts,base}:Props){
 const [copied,setCopied]=useState(false);
 const headings=post.blocks.filter(b=>b.t==="h").map(b=>b.text||"");
 const readNext=posts.filter(p=>p.slug!==post.slug).slice(0,3);
 const url="https://hummin.org/insights/"+post.slug;
 const share=[{label:"LinkedIn",url:"https://www.linkedin.com/sharing/share-offsite/?url="+safeShare(url)},{label:"WhatsApp",url:"https://wa.me/?text="+safeShare(post.title+" "+url)},{label:"X",url:"https://twitter.com/intent/tweet?url="+safeShare(url)+"&text="+safeShare(post.title)},{label:"Email",url:"mailto:?subject="+safeShare(post.title)+"&body="+safeShare(url)}];
 return <div className="ra-source-page">
  <header className="ra-source-hero">
   <div className="ra-source-hero-inner">
    <Link to={base} className="ra-source-back">← All Insights</Link>
    <div className="ra-source-pills"><span>{post.type==="guide"?"Guide":post.type==="opinion"?"Opinion":"News"}</span>{post.topics.map(t=><Link key={t} to={base+"/topic/"+articleId(t)}>{t}</Link>)}</div>
    <h1>{post.title}</h1><p>{post.excerpt}</p>
    <div className="ra-source-byline"><Link to={base+"/author/"+post.author} className="ra-source-avatar" aria-label={"Read more about "+authors[post.author]}><img src="/brand/hummin-symbol.svg" alt=""/></Link><Link to={base+"/author/"+post.author}>{authors[post.author]}</Link><time dateTime={post.date}>{niceDate(post.date)}</time><span>{minutes(post)} min read</span></div>
   </div>
  </header>
  <div className="ra-source-body">
   <div className="ra-source-article-grid">
    <article className="ra-source-article">
     {post.figure?<figure className="ra-source-figure"><div><img src="/brand/insights-article-figure.svg" alt="" aria-hidden="true"/></div><figcaption>{post.figure}</figcaption></figure>:null}
     {post.blocks.map((b,i)=><SourceBlock key={i} b={b}/>)}
     <div className="ra-source-share"><span>Share</span>{share.map(s=><a key={s.label} href={s.url} target={s.label==="Email"?undefined:"_blank"} rel={s.label==="Email"?undefined:"noopener noreferrer"}>{s.label}</a>)}<button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopied(true)}catch{setCopied(false)}}}>{copied?"Copied ✓":"Copy link"}</button></div>
     <div className="ra-source-author"><div className="ra-source-author-avatar"><img src="/brand/hummin-symbol.svg" alt=""/></div><div><strong>{authors[post.author]}</strong><p>{post.author==="team"?"Guides and news from the people who do the work.":"Founder and Managing Director, HUMMIN"}</p></div><Link to={base+"/author/"+post.author}>More from {post.author==="team"?"the team":"Muiruri"}</Link></div>
    </article>
    <aside className="ra-source-sidebar">
     {headings.length>0?<nav aria-label="On this page"><strong>ON THIS PAGE</strong>{headings.map(h=><a key={h} href={"#"+articleId(h)}>{h}</a>)}</nav>:null}
     <div className="ra-source-help"><h2>Want help with this?</h2><p>Tell us what you are working on. You don't need to know which discipline it falls under.</p><Link to="/contact">Discuss a Business Challenge</Link></div>
    </aside>
   </div>
   {readNext.length?<section className="ra-source-read-next"><h2>Read next.</h2><div>{readNext.map(p=><EditorialCard key={p.slug} post={p} base={base}/>)}</div></section>:null}
   <Newsletter/>
  </div>
 </div>;
}
