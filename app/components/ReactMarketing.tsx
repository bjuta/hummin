import {useState} from "react";
import {SourceButton as HButton,SourceSectionTitle as SectionTitle,SourceShelf as Shelf,SourceDialog,SourceIcon,SourceChip} from "./SourcePrimitives";
import {Link,useSearchParams} from "react-router";
import {STAGES,DOMAINS,ENGS,TOPICS,VALUES,NEEDS,TIERS,TIER_ROWS} from "../lib/react-site-content";
import "./react-marketing.css";
import {ReactAssessmentPromotion} from "./ReactAssessmentPromotion";
import {SourceEngagementComparison} from "./SourceEngagementComparison";
import {SourceMarketingHero as Hero} from "./SourceMarketingHero";
export {SourceMarketingHero as Hero} from "./SourceMarketingHero";

const sourceDomain=(area:string)=>area.split(" · ")[0];
function ProblemModal({index,onClose}:{index:number;onClose:()=>void}){
 const topic=TOPICS[index],domain=sourceDomain(topic.area);
 const target=new URLSearchParams({challenge:topic.title}).toString();
 const chosen=new URLSearchParams({area:domain}).toString();
 return <SourceDialog id="hr-problem-dialog" tone={index%3===0?"mist":index%3===1?"ink":"slate"}
  title={topic.title} eyebrow={topic.area} lead={topic.lead}
  rows={[{label:"What we look at",text:topic.look},{label:"Where most clients start",text:topic.start}]}
  primary={{label:"Discuss This Challenge",to:"/contact?"+target}}
  secondary={{label:"See "+domain,to:"/applied-expertise?"+chosen}} onClose={onClose}/>;
}
function TierModal({index,onClose}:{index:number;onClose:()=>void}){
 const tier=TIERS[index];
 return <SourceDialog id="hr-tier-dialog" glow tone={index===0?"mist":index===1?"slate":"ink"}
  title={tier.name} eyebrow={tier.tag} lead={tier.what}
  rows={[{label:"Best when",text:tier.best},{label:"You get",text:tier.get},{label:"Fees",text:tier.fees}]}
  primary={{label:"Discuss a "+tier.name,to:"/contact?"+new URLSearchParams({engagement:tier.name}).toString()}}
  secondary={{label:"Compare All Three",to:"/engagements?"+new URLSearchParams({tier:tier.name}).toString()}}
  onClose={onClose}/>;
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
      <span className="hr-problem-mark" aria-hidden="true"/><SourceChip>{p.area}</SourceChip><span className="hr-problem-bottom"><span className="hr-card-title">{p.title}</span><span className="hr-card-more">Read more <span aria-hidden="true">+</span></span></span>
    </button>)}</Shelf>
  </section>
  <section className="hr-section"><span className="hr-eyebrow">Ways to work with us</span>
    <p className="hr-statement">Start with a <button type="button" onClick={()=>setTier(0)} aria-haspopup="dialog">Review</button>. Fix it with a <button type="button" onClick={()=>setTier(1)} aria-haspopup="dialog">Project</button>. Keep us close with a <button type="button" onClick={()=>setTier(2)} aria-haspopup="dialog">Residency</button>.</p>
    <div className="hr-three-grid">{ENGS.map((p,i)=><button type="button" onClick={()=>setTier(i)} aria-haspopup="dialog" className={"hr-engagement-card hr-eng-source-"+i} key={p.name}>
      <SourceChip>{p.tag}</SourceChip><span className="hr-engagement-copy"><strong>{p.name}</strong><p>{["Find the problem and get a clear plan.","Design and deliver a defined piece of work.","A HUMMIN professional inside your team."][i]}</p><span className="hr-card-more">Read more <span aria-hidden="true">+</span></span></span>
     </button>)}</div>
  </section>
  <section className="hr-section"><div className="hr-section-headline"><SectionTitle>How a piece of work runs.</SectionTitle><Link to="/how-we-work" className="hr-text-link">See How We Work</Link></div><div className="hr-four-grid">{STAGES.map(s=><div className="hr-step-min" key={s.name}><strong>{s.name}</strong><p>{s.short}</p></div>)}</div></section>
  <section className="hr-section hr-home-insights"><div className="hr-section-headline"><SectionTitle eyebrow="Insights">Practical notes for owners.</SectionTitle><Link className="hr-text-link" to="/insights">All Insights</Link></div>
   <div className="hr-three-grid hr-home-editorial">{homeTeasers.map((entry,i)=>{
     return <Link key={entry.slug} to={"/insights/"+entry.slug} className={"hr-home-insight-card hr-home-insight-"+i}>
      <span className="hr-insight-card-top"><SourceChip>{entry.type}</SourceChip><span>{entry.read}</span></span>
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
  <Shelf title="Four steps, in order.">{STAGES.map((s,i)=><article className={"hr-stage-card hr-stage-source-"+i} key={s.name}><SourceChip>Step {i+1} of 4</SourceChip><div><h3>{s.name}</h3><p>{s.what}</p><p className="hr-stage-out">You receive: {s.out}</p></div></article>)}</Shelf>
 </section><section className="hr-dark-section"><div className="hr-section-headline"><SectionTitle eyebrow="What we need from you">Four things we ask of every client.</SectionTitle><p>We agree these with you at the start of every engagement.</p></div><div className="hr-four-grid">{NEEDS.map(n=><div className="hr-need" key={n.v}><span className="hr-need-icon" aria-hidden="true"><SourceIcon name={n.icon} light/></span><h3>{n.v}</h3><p>{n.k}</p></div>)}</div></section></div>;
}
function Expertise(){
 const [search]=useSearchParams();
 const initial=Math.max(0,DOMAINS.findIndex(d=>d.name.toLowerCase()===search.get("area")?.toLowerCase()));
 const [active,setActive]=useState(initial),domain=DOMAINS[active];
 return <div className="hr-page"><Hero page="core"/>
  <section className="hr-section hr-core-section">
   <Shelf title="Seven areas. Pick one.">{DOMAINS.map((d,i)=><button
    type="button" key={d.name} className={"hr-core-card hr-core-tone-"+(active===i?"active":i%3)}
    aria-pressed={active===i} aria-controls="core-detail" onClick={()=>setActive(i)}>
     <SourceIcon className="hr-core-card-icon" name={d.icon} light={active===i||i%3!==0}/>
     <span className="hr-core-card-label"><strong>{d.name}</strong>{d.ext?<small>External partners</small>:null}</span>
    </button>)}</Shelf>
  </section>
  <section id="core-detail" className="hr-core-source-detail" aria-live="polite">
   <div key={domain.name} className="hr-core-detail-content"><div><SourceIcon className="hr-core-detail-icon" name={domain.icon} light/><h2>{domain.name}</h2></div>
    <div><h3>{domain.lead}</h3><p>{domain.jobs}</p></div>
   </div>
  </section>
  <p className="hr-expertise-note hr-core-note">Specialist partners are external professionals hired for a defined piece of work. We tell you who they are, what they are responsible for, and how they are paid. We do not take on work that needs qualifications or licences we do not hold.</p>
 </div>;
}
function Engagements(){
 const [search]=useSearchParams();
 const initial=Math.max(0,TIERS.findIndex(t=>t.name.toLowerCase()===search.get("tier")?.toLowerCase()));
 const [active,setActive]=useState(initial);
 return <div className="hr-page"><Hero page="eng"/><section className="hr-section hr-engagements-source-section">
  <SourceEngagementComparison active={active} onChange={setActive}/>
 </section><section className="hr-residency"><img src="/brand/residency.webp" alt="A HUMMIN professional working at a client desk" loading="lazy"/><div><span className="hr-eyebrow">About Residency</span><h2>Inside your team. Employed by HUMMIN.</h2><p>Resident professionals stay HUMMIN employees. We manage and support them. Their role, hours, access to information, and who they report to are agreed in writing before they start. Final decisions stay with you.</p></div></section></div>;
}
function Who(){
 return <div className="hr-page"><Hero page="who"/><section className="hr-section hr-who-body"><figure><div className="hr-who-photo"><img src="/brand/who-owner.webp" alt="An established business owner in their workplace" loading="lazy"/></div></figure><div><p className="hr-big">We work best with businesses where <em>decisions sit with the owners</em>, the business is <em>already established</em>, and the owners <em>want more from it</em> than the current team has time or skills to deliver.</p><p>It also helps if you are ready to share information and take part in the change. The work goes faster when the people closest to it are involved.</p><HButton to="/assessment">Take the Assessment</HButton></div></section></div>;
}
function About(){
 const [active,setActive]=useState(0),value=VALUES[active];
 return <div className="hr-page"><Hero page="about"/><section className="hr-section"><SectionTitle eyebrow="What we hold to">Six principles for how we work.</SectionTitle>
  <div className="hr-values-tabs" role="tablist" aria-label="Our values">{VALUES.map((v,i)=><button key={v.short} role="tab" id={"hr-value-tab-"+i} aria-selected={active===i} aria-controls="hr-value-panel" className={active===i?"active":""} onClick={()=>setActive(i)}>{v.short}</button>)}</div>
  <div id="hr-value-panel" role="tabpanel" aria-labelledby={"hr-value-tab-"+active} className="hr-value-panel"><div><span className="hr-eyebrow">What we do</span><div className="hr-value-do-copy"><h3>{value.t}</h3><p>{value.b}</p></div></div><div><span className="hr-eyebrow">What we avoid</span><p>{value.not}</p><small>{active+1} of {VALUES.length}</small></div></div>
  <div className="hr-founder"><img src="/brand/about-founder.webp" alt="Portrait of the HUMMIN founder" loading="lazy"/><div><h3>Muiruri Beautah</h3><p>Founder and Managing Director</p></div><p>Muiruri founded HUMMIN to give owners of established businesses a partner that understands the whole business and helps carry out the work.</p></div>
 </section><section className="hr-definition"><div><div className="hr-definition-wordline"><p className="hr-definition-word">hum·min</p><p>/ˈhʌm.ɪn/</p></div><div className="hr-definition-entries"><p><b>1</b> <em>noun</em> An embedded advisory and execution partner for owner-led businesses.</p><p><b>2</b> <em>verb, informal</em> To work steadily and well in the background.</p></div></div><img src="/brand/hummin-symbol.svg" alt="" aria-hidden="true"/></section></div>;
}
export function ReactMarketing({page}:{page:Page}){
 const views={home:Home,how:How,core:Expertise,eng:Engagements,who:Who,about:About};
 const Content=views[page];
 return <><Content/><ReactAssessmentPromotion/></>;
}
