import {SourceButton as HButton,SourceSectionTitle as SectionTitle} from "./SourcePrimitives";
import {TIERS,TIER_ROWS} from "../lib/react-site-content";

/** Single source-faithful engagement selector/table for all three service tiers.
 * Presentation, semantics and original class hooks remain authoritative here.
 */
export function SourceEngagementComparison({active,onChange}:{active:number;onChange:(index:number)=>void}){
 const keys=["best","what","get","ends","role","fees"] as const;
 return <>
  <div className="hr-section-headline"><SectionTitle>Compare the three.</SectionTitle><div className="hr-pill-tabs" role="tablist" aria-label="Choose an engagement">{TIERS.map((t,i)=><button key={t.name} role="tab" aria-selected={active===i} id={"hr-tier-tab-"+i} aria-controls="hr-tier-panel" onClick={()=>onChange(i)} className={active===i?"active":""}>{t.name}</button>)}</div></div>
  <div className="hr-comparison-scroll" role="tabpanel" id="hr-tier-panel" aria-labelledby={"hr-tier-tab-"+active} tabIndex={0}><div className="hr-comparison">
   <div/><>{TIERS.map((t,i)=><button key={t.name} type="button" className={"hr-comparison-head hr-tier-"+i+(active===i?" active":"")} onClick={()=>onChange(i)}><span>{t.tag}</span><strong>{t.name}</strong></button>)}</>
   {TIER_ROWS.map(([label,key])=><div className="hr-comparison-row" key={label}><strong>{label}</strong>{TIERS.map((t,i)=><div key={t.name} className={"hr-comparison-cell hr-tier-"+i+(active===i?" active":"")}>{t[key as typeof keys[number]]}</div>)}</div>)}
  </div></div><div className="hr-engagement-cta"><HButton to="/contact">Discuss a {TIERS[active].name}</HButton><span>Not sure which fits? Most clients start with a Review.</span></div>

 </>;
}
