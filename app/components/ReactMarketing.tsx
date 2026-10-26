import {useRef,useState} from "react";
import {Link} from "react-router";
import {HEADS,HERO_STYLE,STAGES,DOMAINS,ENGS,TOPICS,VALUES,NEEDS,TIERS,TIER_ROWS} from "../lib/react-site-content";
import "./react-marketing.css";
import {ReactAssessmentPromotion} from "./ReactAssessmentPromotion";

const photos:Record<string,string>={
 home:"/brand/home-hero.webp",how:"/brand/how-hero.webp",core:"/brand/expertise-hero.webp",
 eng:"/brand/engagements-hero.webp",who:"/brand/who-hero.webp",about:"/brand/about-hero.webp"
};
type Page="home"|"how"|"core"|"eng"|"who"|"about";

function HButton({to,children,light=false,outline=false}:{to:string;children:React.ReactNode;light?:boolean;outline?:boolean}){
 return <Link to={to} className={"hr-link-btn"+(light?" hr-light":outline?" hr-outline":"")}>{children}</Link>;
}
export function Hero({page}:{page:Page|"contact"}){
 const h=HEADS[page as keyof typeof HEADS];
 const art=page==="home"?"/brand/home-hero.webp":photos[page];
 const imageAlt=page==="home"?"Established business owners and teams working together":h?.label||"HUMMIN working with clients";
 return <section className={"hr-hero"+(page==="home"?" hr-home-hero":"")} data-hero="1"
   style={{background:page==="home"?"radial-gradient(circle at 72% 28%,#5E6967 0%,#2A3538 38%,#1E272A 70%)":HERO_STYLE[page as keyof typeof HERO_STYLE]?.bg}}>
   {art?<img className="hr-hero-photo" src={art} alt={imageAlt} loading={page==="home"?"eager":"lazy"}/>:null}
   <div className="hr-hero-gradient" aria-hidden="true"/>
   <img className="hr-hero-motif" src="/brand/hummin-symbol.svg" alt="" aria-hidden="true"/>
   <div className="hr-hero-chips">
    <span>{page==="home"?"Embedded advisory and execution":h.label}</span>
    <span>{page==="home"?"Nairobi, Kenya":HERO_STYLE[page as keyof typeof HERO_STYLE]?.chip}</span>
   </div>
   <div className="hr-hero-copy">
    {page==="home"?<>
      <h1>Inside your business.<em>Behind your progress.</em></h1>
      <div className="hr-hero-end"><p>We work with established, owner-led businesses to understand what is holding them back and put practical changes to work.</p>
       <div className="hr-actions"><HButton to="/contact" light>Discuss a Business Challenge <span aria-hidden="true">→</span></HButton><HButton to="/assessment" outline>Take the Assessment</HButton></div>
      </div>
    </>:<><h1>{h.title}</h1><p>{h.lead}</p></>}
   </div>
 </section>;
}
function SectionTitle({eyebrow,children}:{eyebrow?:string;children:React.ReactNode}){
 return <div className="hr-section-heading">{eyebrow?<span className="hr-eyebrow">{eyebrow}</span>:null}<h2>{children}</h2></div>;
}
function Shelf({title,children}:{title:string;children:React.ReactNode}){
 const shelf=useRef<HTMLDivElement>(null);
 const go=(dir:number)=>shelf.current?.scrollBy({left:dir*Math.min(360,shelf.current.clientWidth*.8),behavior:"smooth"});
 return <div className="hr-shelf"><div className="hr-shelf-title"><h2>{title}</h2><div className="hr-shelf-actions"><button type="button" onClick={()=>go(-1)} aria-label={"Scroll "+title+" backward"}>←</button><button type="button" onClick={()=>go(1)} aria-label={"Scroll "+title+" forward"}>→</button></div></div><div className="hr-shelf-track" ref={shelf} tabIndex={0} role="region" aria-label={title}>{children}</div></div>;
}
function ProblemModal({index,onClose}:{index:number;onClose:()=>void}){
 const p=TOPICS[index];
 return <div className="hr-dialog-backdrop" onClick={onClose} role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="hr-problem-dialog" className="hr-dialog" onClick={e=>e.stopPropagation()}>
   <button className="hr-dialog-close" type="button" onClick={onClose} aria-label="Close details">×</button>
   <span className="hr-eyebrow">{p.area}</span><h2 id="hr-problem-dialog">{p.title}</h2>
   <p>{p.lead}</p><h3>What we look at</h3><p>{p.look}</p><h3>Where we'd start</h3><p>{p.start}</p><HButton to="/contact">Discuss this challenge →</HButton>
 </div></div>;
}
function TierModal({index,onClose}:{index:number;onClose:()=>void}){
 const e=ENGS[index];
 return <div className="hr-dialog-backdrop" onClick={onClose} role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="hr-tier-dialog" className="hr-dialog" onClick={ev=>ev.stopPropagation()}>
  <button type="button" className="hr-dialog-close" onClick={onClose} aria-label="Close engagement details">×</button>
  <span className="hr-eyebrow">{e.tag}</span><h2 id="hr-tier-dialog">{e.name}</h2>
  <p>{e.body}</p><h3>What the work includes</h3><p>{e.itemsText}</p><h3>Commercial arrangement</h3><p>{e.comm}</p>
  <HButton to="/contact">Discuss a {e.name} →</HButton>
 </div></div>;
}
const homeTeasers=[
 {slug:"enquiries-30-day-fix",type:"Guide",read:"4 min read",by:"HUMMIN Team · 20 Oct",title:"Why enquiries go unanswered, and a 30-day fix",excerpt:"Most owners get more enquiries than they think. The problem is what happens next."},
 {slug:"five-monday-figures",type:"Guide",read:"3 min read",by:"HUMMIN Team · 13 Oct",title:"Five figures every owner should see on Monday",excerpt:"A short set of weekly figures shows problems while you can still act."},
 {slug:"runs-through-the-owner",type:"Opinion",read:"3 min read",by:"Muiruri Beautah · 6 Oct",title:"When the business still runs through the owner",excerpt:"Owners often become the bottleneck in the business they built."}
] as const;
function Home(){
 const [problem,setProblem]=useState<number|null>(null);
 const [tier,setTier]=useState<number|null>(null);
 return <div className="hr-page">
  <Hero page="home"/>
  <div className="hr-home-sections"><section className="hr-section hr-intro"><p className="hr-big">Good businesses encounter problems that do not fit neatly into departments.</p><div><p>A slow month of enquiries can look like a marketing problem. The cause may sit in how enquiries are answered, the tools the team uses, or who owns the follow-up.</p><p>We find the cause, bring in the people needed to fix it, and stay involved until the work is done.</p></div></section>
  <section className="hr-section"><span className="hr-eyebrow">Where we often start</span>
   <Shelf title="Problems owners bring to us.">{TOPICS.map((p,i)=><button type="button" key={p.title} className={"hr-problem-card hr-source-tone-"+i%3} onClick={()=>setProblem(i)} aria-haspopup="dialog" aria-label={p.title+" Read more"}>
      <span className="hr-problem-mark" aria-hidden="true"/><span className="hr-card-chip">{p.area}</span><span className="hr-problem-bottom"><span className="hr-card-title">{p.title}</span><span className="hr-card-more">Read more <span aria-hidden="true">+</span></span></span>
    </button>)}</Shelf>
  </section>
  <section className="hr-section"><span className="hr-eyebrow">Ways to work with us</span>
    <p className="hr-statement">Start with a <button type="button" onClick={()=>setTier(0)} aria-haspopup="dialog">Review</button>. Fix it with a <button type="button" onClick={()=>setTier(1)} aria-haspopup="dialog">Project</button>. Keep us close with a <button type="button" onClick={()=>setTier(2)} aria-haspopup="dialog">Residency</button>.</p>
    <div className="hr-three-grid">{ENGS.map((p,i)=><button type="button" onClick={()=>setTier(i)} aria-haspopup="dialog" className={"hr-engagement-card hr-eng-source-"+i} key={p.name}>
      <span className="hr-card-chip">{p.tag}</span><span className="hr-engagement-copy"><strong>{p.name}</strong><p>{["Find the problem and get a clear plan.","Design and deliver a defined piece of work.","A HUMMIN professional inside your team."][i]}</p><span className="hr-card-more">Read more <span aria-hidden="true">+</span></span></span>
     </button>)}</div>
  </section>
  <section className="hr-section"><div className="hr-section-headline"><SectionTitle>How a piece of work runs.</SectionTitle><Link to="/how-we-work" className="hr-text-link">See How We Work</Link></div><div className="hr-four-grid">{STAGES.map(s=><div className="hr-step-min" key={s.name}><strong>{s.name}</strong><p>{s.short}</p></div>)}</div></section>
  <section className="hr-section hr-home-insights"><div className="hr-section-headline"><SectionTitle eyebrow="Insights">Practical notes for owners.</SectionTitle><Link className="hr-text-link" to="/insights">All Insights</Link></div>
   <div className="hr-three-grid hr-home-editorial">{homeTeasers.map((entry,i)=>{
     return <Link key={entry.slug} to={"/insights/"+entry.slug} className={"hr-home-insight-card hr-home-insight-"+i}>
      <span className="hr-insight-card-top"><span className="hr-card-chip">{entry.type}</span><span>{entry.read}</span></span>
      <span className="hr-home-insight-copy"><strong>{entry.title}</strong><span>{entry.excerpt}</span></span>
      <span className="hr-home-insight-by">{entry.by}</span>
     </Link>;
   })}</div>
  </section>
  </div>
  {problem!==null?<ProblemModal index={problem} onClose={()=>setProblem(null)}/>:null}
  {tier!==null?<TierModal index={tier} onClose={()=>setTier(null)}/>:null}
 </div>;
}
function How(){
 return <div className="hr-page"><Hero page="how"/><section className="hr-section">
  <Shelf title="Four steps, in order.">{STAGES.map((s,i)=><article className={"hr-stage-card hr-tone-"+i%3} key={s.name}><span className="hr-card-chip">{String(i+1).padStart(2,"0")} / 04</span><div><h3>{s.name}</h3><p>{s.what}</p><p className="hr-stage-out">You receive: {s.out}</p></div></article>)}</Shelf>
 </section><section className="hr-dark-section"><div className="hr-section-headline"><SectionTitle eyebrow="What we need from you">Four things we ask of every client.</SectionTitle><p>We agree these with you at the start of every engagement.</p></div><div className="hr-four-grid">{NEEDS.map(n=><div className="hr-need" key={n.v}><span className="hr-need-icon" aria-hidden="true">◎</span><h3>{n.v}</h3><p>{n.k}</p></div>)}</div></section><section className="hr-section"><SectionTitle>Ready to make progress?</SectionTitle><HButton to="/contact">Discuss a Business Challenge →</HButton></section></div>;
}
function Expertise(){
 const [active,setActive]=useState(0),domain=DOMAINS[active];
 return <div className="hr-page"><Hero page="core"/><section className="hr-section"><div className="hr-expertise-grid"><div className="hr-expertise-menu" aria-label="Areas of applied expertise">{DOMAINS.map((d,i)=><button className={active===i?"active":""} type="button" key={d.name} onClick={()=>setActive(i)} aria-current={active===i?"true":undefined}><span>{String(i+1).padStart(2,"0")}</span>{d.name}<span aria-hidden="true">↗</span></button>)}</div><article className="hr-expertise-detail" aria-live="polite"><span className="hr-eyebrow">{domain.name}</span><h2>{domain.lead}</h2><p>{domain.jobs}</p><HButton to="/contact">Discuss this area →</HButton></article></div><p className="hr-expertise-note">Specialist partners are external professionals hired for a defined piece of work. We tell you who they are, what they are responsible for, and how they are paid. We do not take on work that needs qualifications or licences we do not hold.</p></section></div>;
}
function Engagements(){
 const [active,setActive]=useState(0);
 const keys=["best","what","get","ends","role","fees"] as const;
 return <div className="hr-page"><Hero page="eng"/><section className="hr-section">
  <div className="hr-section-headline"><SectionTitle>Compare the three.</SectionTitle><div className="hr-pill-tabs" role="tablist" aria-label="Choose an engagement">{TIERS.map((t,i)=><button key={t.name} role="tab" aria-selected={active===i} id={"hr-tier-tab-"+i} aria-controls="hr-tier-panel" onClick={()=>setActive(i)} className={active===i?"active":""}>{t.name}</button>)}</div></div>
  <div className="hr-comparison-scroll" role="tabpanel" id="hr-tier-panel" aria-labelledby={"hr-tier-tab-"+active} tabIndex={0}><div className="hr-comparison">
   <div/><>{TIERS.map((t,i)=><button key={t.name} type="button" className={"hr-comparison-head"+(active===i?" active":"")} onClick={()=>setActive(i)}><span>{t.tag}</span><strong>{t.name}</strong></button>)}</>
   {TIER_ROWS.map(([label,key])=><div className="hr-comparison-row" key={label}><strong>{label}</strong>{TIERS.map((t,i)=><div key={t.name} className={active===i?"active":""}>{t[key as typeof keys[number]]}</div>)}</div>)}
  </div></div><div className="hr-engagement-cta"><HButton to="/contact">Discuss a {TIERS[active].name} →</HButton><span>Not sure which fits? Most clients start with a Review.</span></div>
 </section><section className="hr-residency"><img src="/brand/residency.webp" alt="A HUMMIN professional working at a client desk" loading="lazy"/><div><span className="hr-eyebrow">About Residency</span><h2>Inside your team. Employed by HUMMIN.</h2><p>Resident professionals stay HUMMIN employees. We manage and support them. Their role, hours, access to information, and who they report to are agreed in writing before they start. Final decisions stay with you.</p></div></section></div>;
}
function Who(){
 return <div className="hr-page"><Hero page="who"/><section className="hr-section hr-who-body"><img src="/brand/who-owner.webp" alt="An established business owner in their workplace" loading="lazy"/><div><p className="hr-big">We work best with businesses where <em>decisions sit with the owners</em>, the business is <em>already established</em>, and the owners <em>want more from it</em> than the current team has time or skills to deliver.</p><p>It also helps if you are ready to share information and take part in the change. The work goes faster when the people closest to it are involved.</p><HButton to="/assessment">Take the Assessment</HButton></div></section></div>;
}
function About(){
 const [active,setActive]=useState(0),value=VALUES[active];
 return <div className="hr-page"><Hero page="about"/><section className="hr-section"><SectionTitle eyebrow="What we hold to">Six principles for how we work.</SectionTitle>
  <div className="hr-values-tabs" role="tablist" aria-label="Our values">{VALUES.map((v,i)=><button key={v.short} role="tab" id={"hr-value-tab-"+i} aria-selected={active===i} aria-controls="hr-value-panel" className={active===i?"active":""} onClick={()=>setActive(i)}>{v.short}</button>)}</div>
  <div id="hr-value-panel" role="tabpanel" aria-labelledby={"hr-value-tab-"+active} className="hr-value-panel"><div><span className="hr-eyebrow">What we do</span><h3>{value.t}</h3><p>{value.b}</p></div><div><span className="hr-eyebrow">What we avoid</span><p>{value.not}</p><small>{active+1} / {VALUES.length}</small></div></div>
  <div className="hr-founder"><img src="/brand/about-founder.webp" alt="Portrait of the HUMMIN founder" loading="lazy"/><div><h3>Muiruri Beautah</h3><p>Founder and Managing Director</p></div><p>Muiruri founded HUMMIN to give owners of established businesses a partner that understands the whole business and helps carry out the work.</p></div>
 </section><section className="hr-definition"><div><p className="hr-definition-word">hum·min</p><p>/ˈhʌm.ɪn/</p><p><b>1</b> <em>noun</em> An embedded advisory and execution partner for owner-led businesses.</p><p><b>2</b> <em>verb, informal</em> To work steadily and well in the background.</p></div><img src="/brand/hummin-symbol.svg" alt="" aria-hidden="true"/></section></div>;
}
export function ReactMarketing({page}:{page:Page}){
 const views={home:Home,how:How,core:Expertise,eng:Engagements,who:Who,about:About};
 const Content=views[page];
 return <><Content/><ReactAssessmentPromotion/></>;
}
