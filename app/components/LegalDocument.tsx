import { Link } from "react-router";
import { LEGAL_DOCS, type LegalBlock } from "../lib/legal-content";
import "../legal.css";

type Kind="privacy"|"terms";
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
const label=(i:number)=>String(i+1).padStart(2,"0");

function LegalContentBlock({block}:{block:LegalBlock}){
 if(block.t==="dl")return <dl className="hummin-legal-list">{block.items.map(([heading,body])=>
  <div className="hummin-legal-list-row" key={heading}>
   <dt>{heading}</dt><dd>{body}</dd>
  </div>)}</dl>;
 if(block.t==="note")return <p className="hummin-legal-note">{block.text}</p>;
 return <p className="hummin-legal-paragraph">{block.text}</p>;
}

/** Faithful responsive port of the supplied HUMMIN Legal component.
 * The original uses dc-import/sc-for runtime; these are semantic links instead.
 */
export function LegalDocument({kind}:{kind:Kind}){
 const doc=LEGAL_DOCS[kind];
 const sections=doc.sections.map(([title,blocks],i)=>({
   title,blocks,num:label(i),id:kind+"-"+slug(title)
 }));
 return <div className="hummin-legal">
  <header className="hummin-legal-hero">
   <img className="hummin-legal-watermark" src="/assets/hummin-legal-mark-tone.svg" alt="" aria-hidden="true"/>
   <div className="hummin-legal-hero-inner" key={kind}>
    <nav className="hummin-legal-tabs" aria-label="Legal documents">
     <Link to="/privacy" aria-current={kind==="privacy"?"page":undefined} className={kind==="privacy"?"active":""}>Privacy</Link>
     <Link to="/terms" aria-current={kind==="terms"?"page":undefined} className={kind==="terms"?"active":""}>Terms of Use</Link>
    </nav>
    <h1>{doc.title}</h1>
    <p className="hummin-legal-lead">{doc.lead}</p>
    <p className="hummin-legal-meta">{doc.meta}</p>
   </div>
  </header>
  <div className="hummin-legal-body">
   <aside className="hummin-legal-sidebar" aria-label="On this page">
    <nav className="hummin-legal-toc" aria-label="Document contents">
     <strong>On this page</strong>
     {sections.map(s=><a href={"#"+s.id} key={s.id}><span>{s.num}</span>{s.title}</a>)}
    </nav>
    <div className="hummin-legal-questions">
     <strong>{kind==="privacy"?"Questions about your information?":"Questions about these terms?"}</strong>
     <p>{kind==="privacy"?"Email us with “Privacy request” in the subject.":"Email us with “Terms enquiry” in the subject."}</p>
     <a href={"mailto:sales@hummin.org?subject="+(kind==="privacy"?"Privacy%20request":"Terms%20enquiry")}>sales@hummin.org</a>
    </div>
   </aside>
   <article className="hummin-legal-article">
    {sections.map(s=><section id={s.id} key={s.id} aria-labelledby={s.id+"-heading"} className="hummin-legal-section">
     <div className="hummin-legal-heading">
      <span aria-hidden="true">{s.num}</span>
      <h2 id={s.id+"-heading"}>{s.title}</h2>
     </div>
     {s.blocks.map((b,i)=><LegalContentBlock block={b} key={s.id+"-"+i}/>)}
    </section>)}
    <div className="hummin-legal-actions">
     <Link to="/contact" className="hummin-legal-btn hummin-legal-primary">Contact HUMMIN</Link>
     <Link to={"/"+doc.other} className="hummin-legal-btn hummin-legal-secondary">{doc.otherLabel}</Link>
     <Link to="/" className="hummin-legal-btn hummin-legal-secondary hummin-legal-muted">Back to Home</Link>
    </div>
   </article>
  </div>
 </div>;
}
