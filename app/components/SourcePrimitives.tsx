import {useEffect,useRef,type ReactNode} from "react";
import {Link} from "react-router";
import "./source-dialog.css";

/** Primitives copied from HUMMIN's owner-authored design structure.
 * CSS class hooks intentionally match the original page implementation.
 */
export function SourceButton({to,children,light=false,outline=false}:{to:string;children:ReactNode;light?:boolean;outline?:boolean}){
 return <Link to={to} className={"hr-link-btn"+(light?" hr-light":outline?" hr-outline":"")}>{children}</Link>;
}
export function SourceSectionTitle({eyebrow,children}:{eyebrow?:string;children:ReactNode}){
 return <div className="hr-section-heading">{eyebrow?<span className="hr-eyebrow">{eyebrow}</span>:null}<h2>{children}</h2></div>;
}
export function SourceShelf({title,children}:{title:string;children:ReactNode}){
 const shelf=useRef<HTMLDivElement>(null);
 const go=(direction:number)=>shelf.current?.scrollBy({left:direction*Math.min(360,shelf.current.clientWidth*.8),behavior:"smooth"});
 return <div className="hr-shelf">
  <div className="hr-shelf-title"><h2>{title}</h2><div className="hr-shelf-actions">
   <button type="button" onClick={()=>go(-1)} aria-label={"Scroll "+title+" backward"}><img src="/brand/icons/arrow-left.svg" alt="" aria-hidden="true"/></button>
   <button type="button" onClick={()=>go(1)} aria-label={"Scroll "+title+" forward"}><img src="/brand/icons/arrow-right-light.svg" alt="" aria-hidden="true"/></button>
  </div></div>
  <div className="hr-shelf-track" ref={shelf} tabIndex={0} role="region" aria-label={title}>{children}</div>
 </div>;
}
export function SourceChip({children,className=""}:{children:ReactNode;className?:string}){
 return <span className={"hr-card-chip"+(className?" "+className:"")}>{children}</span>;
}
export function SourceIcon({name,light=false,className}:{name:string;light?:boolean;className?:string}){
 return <img className={className} src={"/brand/icons/"+name+(light?"-light":"")+".svg"} alt="" aria-hidden="true"/>;
}
/** The original Insights index, topic/author and article pages share one
 * authored radial hero, artwork and spacing system. Variants only customise
 * their text and editorial composition, never replicate the shell CSS.
 */
export function SourceEditorialHero({as="section",className="",markClassName="",innerClassName="",children}:{
 as?:"section"|"header";className?:string;markClassName?:string;innerClassName?:string;children:ReactNode
}){
 const Tag=as;
 return <Tag className={"hm-source-editorial-hero"+(className?" "+className:"")}>
  <img className={"hm-source-editorial-mark"+(markClassName?" "+markClassName:"")} src="/brand/insights-hero-mark.svg" alt="" aria-hidden="true"/>
  <div className={"hm-source-editorial-inner"+(innerClassName?" "+innerClassName:"")}>{children}</div>
 </Tag>;
}
/** HUMMIN's original source "peek" dialog, shared by challenge and
 * engagement cards. Header, details and paired actions are a single primitive.
 */
export function SourceDialog({id,title,eyebrow,lead,rows,primary,secondary,tone="mist",onClose,closeLabel="Close"}:{
 id:string;title:string;eyebrow:string;lead:string;
 rows:ReadonlyArray<{label:string;text:string}>;
 primary:{label:string;to:string};secondary:{label:string;to:string};
 tone?:"mist"|"ink"|"slate";onClose:()=>void;closeLabel?:string
}){
 const button=useRef<HTMLButtonElement>(null);
 const dialog=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const prior=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  button.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();onClose();return;}
   if(event.key!=="Tab")return;
   const controls=Array.from(dialog.current?.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'
   )||[]).filter(el=>el.getClientRects().length>0);
   if(!controls.length){event.preventDefault();button.current?.focus();return;}
   if(event.shiftKey&&document.activeElement===controls[0]){event.preventDefault();controls[controls.length-1].focus();}
   else if(!event.shiftKey&&document.activeElement===controls[controls.length-1]){event.preventDefault();controls[0].focus();}
  };
  document.addEventListener("keydown",onKey);
  return ()=>{document.body.style.overflow=oldOverflow;document.removeEventListener("keydown",onKey);prior?.focus()};
 },[onClose]);
 return <div className="hr-dialog-backdrop hm-source-peek-backdrop" role="presentation">
  <button type="button" className="hm-source-peek-scrim" onClick={onClose} tabIndex={-1} aria-label="Close details"/>
  <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={id} aria-describedby={id+"-lead"} className={"hr-dialog hm-source-peek hm-source-peek-"+tone}>
   <div className="hm-source-peek-hero">
    <div className="hm-source-peek-top">
     <span className="hm-source-peek-chip">{eyebrow}</span>
     <button ref={button} className="hr-dialog-close hm-source-peek-close" type="button" onClick={onClose} aria-label={closeLabel}><span aria-hidden="true">×</span></button>
    </div>
    <h2 id={id}>{title}</h2>
    <p id={id+"-lead"}>{lead}</p>
   </div>
   <dl className="hm-source-peek-rows">{rows.map((row,i)=><div key={i}>
    <dt>{row.label}</dt><dd>{row.text}</dd>
   </div>)}</dl>
   <div className="hm-source-peek-actions">
    <Link className="hm-source-peek-primary" to={primary.to} onClick={onClose}>{primary.label} <span aria-hidden="true">→</span></Link>
    <Link className="hm-source-peek-secondary" to={secondary.to} onClick={onClose}>{secondary.label}</Link>
   </div>
  </div>
 </div>;
}
