import {useEffect,useRef,type ReactNode} from "react";
import {Link} from "react-router";

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
export function SourceDialog({id,title,eyebrow,onClose,children,closeLabel="Close details"}:{
 id:string;title:string;eyebrow?:string;onClose:()=>void;children:ReactNode;closeLabel?:string
}){
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  button.current?.focus();
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();onClose();}};
  document.addEventListener("keydown",onKey);
  return ()=>{document.removeEventListener("keydown",onKey);previous?.focus()};
 },[onClose]);
 return <div className="hr-dialog-backdrop" onClick={onClose} role="presentation">
  <div role="dialog" aria-modal="true" aria-labelledby={id} className="hr-dialog" onClick={event=>event.stopPropagation()}>
   <button ref={button} className="hr-dialog-close" type="button" onClick={onClose} aria-label={closeLabel}>×</button>
   {eyebrow?<span className="hr-eyebrow">{eyebrow}</span>:null}<h2 id={id}>{title}</h2>
   {children}
  </div>
 </div>;
}
