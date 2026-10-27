import type {ReactNode} from "react";
import {SourceEditorialHero} from "./SourcePrimitives";
import "./source-editorial-hero.css";

/** Shared source-faithful editorial page scaffolding.
 * Retains existing class hooks and DOM nesting so index, topic, author,
 * and article views use one hero/body/newsletter boundary system.
 * All source assets are versioned; no archived HTML is read.
 */
export function SourceEditorialPage({children,article=false,index=false}:{
 children:ReactNode;article?:boolean;index?:boolean
}){
 return <div className={article?"ra-source-page":"hr-insights-page"+(index?" hr-insights-index-page":"")}>{children}</div>;
}
export function SourceEditorialHeading({children,article=false,index=false}:{
 children:ReactNode;article?:boolean;index?:boolean
}){
 return <SourceEditorialHero as={article?"header":"section"}
  className={article?"ra-source-hero":"hr-insights-hero"+(index?" hr-insights-index-hero":"")}
  markClassName={article?"ra-source-hero-mark":"hr-insights-watermark"}
  innerClassName={article?"ra-source-hero-inner":"hr-insights-hero-inner"}>
  {children}
 </SourceEditorialHero>;
}
export function SourceEditorialBody({children,article=false}:{
 children:ReactNode;article?:boolean
}){
 return article?<div className="ra-source-body">{children}</div>:<div className="hr-insights-main">{children}</div>;
}
export function SourceEditorialNewsletter({children,article=false}:{
 children:ReactNode;article?:boolean
}){
 return article?<>{children}</>:<div className="hr-insights-source-newsletter-wrap">{children}</div>;
}
