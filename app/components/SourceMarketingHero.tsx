import {SourceButton as HButton,SourceIcon} from "./SourcePrimitives";
import {HEADS,HERO_STYLE} from "../lib/react-site-content";

/** One marketing hero implementation for home and all six canonical page types.
 * Preserves original source markup/class hooks; no archive reads at runtime/build.
 */
const photos:Record<string,string>={
 home:"/brand/home-hero.webp",how:"/brand/how-hero.webp",core:"/brand/expertise-hero.webp",
 eng:"/brand/engagements-hero.webp",who:"/brand/who-hero.webp",about:"/brand/about-hero.webp"
};
export type Page="home"|"how"|"core"|"eng"|"who"|"about";

export function SourceMarketingHero({page}:{page:Page|"contact"}){
 const h=HEADS[page as keyof typeof HEADS];
 const art=page==="home"?"/brand/home-hero.webp":photos[page];
 const imageAlt=page==="home"?"Established business owners and teams working together":h?.label||"HUMMIN working with clients";
 return <section className={"hr-hero"+(page==="home"?" hr-home-hero":"")} data-hero="1"
   style={{background:page==="home"?"radial-gradient(circle at 72% 28%,#5E6967 0%,#2A3538 38%,#1E272A 70%)":HERO_STYLE[page as keyof typeof HERO_STYLE]?.bg}}>
   {art?<img className="hr-hero-photo" src={art} alt={imageAlt} loading={page==="home"?"eager":"lazy"}/>:null}
   <div className="hr-hero-gradient" aria-hidden="true"/>
   <img className="hr-hero-motif" src="/brand/hummin-mark-mist.svg" alt="" aria-hidden="true"/>
   <div className="hr-hero-chips">
    <span>{page!=="home"?<SourceIcon className="hr-hero-chip-icon" name={h.iconPaper} light/>:null}{page==="home"?"Embedded advisory and execution":h.label}</span>
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
