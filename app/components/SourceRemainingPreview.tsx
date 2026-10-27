import * as React from "react";
import {useNavigate} from "react-router";
import {ApprovedInsightsRoot} from "./ApprovedSourceTranscription.generated";
import {SourceAssessmentInteractive} from "./SourceAssessmentInteractive";
import {SourceMarketingPreview} from "./SourceMarketingPreview";
import sourceAssets from "../data/ApprovedSourceAssets.generated.json";
import sourceModels from "../data/ApprovedRemainingViewmodels.generated.json";
import type {SourceScope} from "./source-native-bridge";
import "./ApprovedAssessmentFonts.runtime.css";
import "./approved-source-css/assessment-base.css";
import "./approved-source-css/insights-base.css";

export type RemainingView="assessment"|"insights"|"article"|"topic"|"author";
type Model=Record<string,SourceScope>;
const sources=sourceModels as unknown as {
 assessment:{views:Model};insights:{views:Model}
};
/** Original nested document layout, translated to native React DOM.
 * Never imports design/sources or a design-runtime script at request time.
 * Deliberately excludes live submit/booking endpoints on this Preview.
 */
export function SourceRemainingPreview({view}:{view:RemainingView}){
 const navigate=useNavigate();
 const [query,setQuery]=React.useState("");
 const [kind,setKind]=React.useState("All");
 const [insightView,setInsightView]=React.useState<"index"|"article"|"topic"|"author">(
   view==="assessment"||view==="insights"?"index":view
 );
 const [message,setMessage]=React.useState("");
 // Mirror the approved Insights frame's actual sendHeight() contract:
 // measure the last non-fixed content section, not the outer body/shell height.
 const insightFrame=React.useRef<HTMLDivElement>(null);
 const [sourceHeight,setSourceHeight]=React.useState<number|null>(null);
 React.useLayoutEffect(()=>{
  if(view==="assessment")return;
  const frame=insightFrame.current;
  if(!frame)return;
  const measure=()=>{
   const sections=[...frame.querySelectorAll<HTMLElement>("main,section,article,footer")];
   if(!sections.length)return; // The original imported root may mount after the site shell.
   const top=frame.getBoundingClientRect().top;
   const bottoms=sections.filter(element=>element.getClientRects().length&&
     getComputedStyle(element).position!=="fixed")
    .map(element=>element.getBoundingClientRect().bottom-top);
   if(!bottoms.length)return;
   const size=Math.ceil(Math.max(400,...bottoms));
   if(Number.isFinite(size)&&size<=30000)setSourceHeight(current=>
     current===size?current:size);
  };
  measure();
  const observer=new ResizeObserver(measure);
  observer.observe(frame);
  const sections=[...frame.querySelectorAll<HTMLElement>("main,section,article,footer")];
  for(const section of sections)observer.observe(section);
  const mutation=new MutationObserver(measure);
  mutation.observe(frame,{childList:true,subtree:true});
  return ()=>{observer.disconnect();mutation.disconnect();};
 },[view,insightView,sourceHeight]);

 const editorialBase=sources.insights.views[insightView];
 const editorialScope:SourceScope={...editorialBase,__assets:sourceAssets};
 const toView=(next:"index"|"article"|"topic"|"author")=>{
  setInsightView(next);
  setMessage("");
  insightFrame.current?.scrollTo({top:0});
 };
 const toArticle=(slug:string)=>{
  if(slug==="enquiries-30-day-fix")toView("article");
  else setMessage("This article needs its own approved native source before it can open in Preview.");
 };
 editorialScope.goIndex=()=>{setQuery("");setKind("All");toView("index");};
 editorialScope.toAssess=()=>navigate("/__source-review/assessment");
 editorialScope.toContact=()=>navigate("/__source-preview/contact");
 editorialScope.toCore=()=>navigate("/__source-preview/core");
 editorialScope.setQ=(event:React.ChangeEvent<HTMLInputElement>)=>setQuery(event.currentTarget.value);
 editorialScope.clearQ=()=>setQuery("");
 editorialScope.q=query;
 editorialScope.hasQ=query.trim().length>0;
 editorialScope.featured=editorialBase.featured&&typeof editorialBase.featured==="object"?
  {...editorialBase.featured as SourceScope,
   open:()=>toArticle(String((editorialBase.featured as SourceScope).slug||""))}:undefined;
 editorialScope.cards=(Array.isArray(editorialBase.cards)?editorialBase.cards:[]).map(card=>{
  const original=card as SourceScope;
  return {...original,open:()=>toArticle(String(original.slug||""))};
 });
 editorialScope.related=(Array.isArray(editorialBase.related)?editorialBase.related:[]).map(card=>{
  const original=card as SourceScope;
  return {...original,open:()=>toArticle(String(original.slug||""))};
 });
 if(editorialBase.post&&typeof editorialBase.post==="object"){
  editorialScope.post={...editorialBase.post as SourceScope,
   openAuthor:()=>toView("author")};
 }
 editorialScope.topicChips=(Array.isArray(editorialBase.topicChips)?editorialBase.topicChips:[]).map(chip=>{
  const original=chip as SourceScope;
  return {...original,open:()=>String(original.name)==="Marketing"?toView("topic"):
   setMessage("This topic needs an approved native route before opening in Preview.")};
 });
 editorialScope.toAssess=()=>navigate("/__source-review/assessment");
 editorialScope.copyLink=()=>{
  void navigator.clipboard?.writeText(window.location.href);
  setMessage("Preview link copied.");
 };
 editorialScope.setSub=(event:React.ChangeEvent<HTMLInputElement>)=>{
  const email=event.currentTarget.value;
  setMessage(email?"Newsletter verification is not connected in this isolated Preview. No email was sent.":"");
 };
 editorialScope.subscribe=()=>setMessage("No newsletter sign-up was sent from isolated Preview.");
 if(insightView==="index"){
  const text=query.trim().toLocaleLowerCase();
  const matches=(item:SourceScope)=>String(item.title||"").toLocaleLowerCase().includes(text)||
   String(item.excerpt||"").toLocaleLowerCase().includes(text);
  const correctKind=(item:SourceScope)=>{
   if(kind==="All")return true;
   if(kind==="Guides")return item.typeLabel==="Guide";
   if(kind==="Opinion")return item.typeLabel==="Opinion";
   if(kind==="News")return item.typeLabel==="News";
   return false;
  };
  const baseCards=Array.isArray(editorialScope.cards)?editorialScope.cards as SourceScope[]:[];
  const newCards=baseCards.filter(card=>matches(card)&&correctKind(card));
  const feat=editorialScope.featured as SourceScope|undefined;
  const hasFeatured=!!feat&&matches(feat)&&correctKind(feat);
  const originalTabs=Array.isArray(editorialBase.typeTabs)?editorialBase.typeTabs:[];
  editorialScope.typeTabs=originalTabs.map(tab=>{
   const original=tab as SourceScope,chosen=String(original.label)===kind;
   return {...original,sel:String(chosen),bg:chosen?"#1E272A":"transparent",
    fg:chosen?"#F4F5F1":"#1E272A",bd:chosen?"#1E272A":"#D0D8D2",
    pick:()=>setKind(String(original.label))};
  });
  editorialScope.cards=newCards;
  editorialScope.showFeatured=kind!=="Downloads"&&hasFeatured;
  editorialScope.showPosts=kind!=="Downloads"&&newCards.length>0;
  editorialScope.showDownloads=kind==="All"||kind==="Downloads";
  editorialScope.noResults=kind!=="Downloads"&&!hasFeatured&&newCards.length===0;
 }
 const OriginalAssessment=()=>React.createElement("div",{
  className:"hm-frame-shell",
  style:{position:"relative",height:"960px",minHeight:0,overflowY:"auto",overscrollBehavior:"contain",background:"#1E272A"}
 },React.createElement(SourceAssessmentInteractive));
 const OriginalInsights=()=>React.createElement("div",{
  className:"hm-frame-shell",ref:insightFrame,
  style:{position:"relative",height:sourceHeight===null?"auto":sourceHeight+"px",minHeight:"580px",overflow:"hidden",background:"#F4F5F1"}
 },React.createElement(ApprovedInsightsRoot,{scope:editorialScope}));
 const imports:Record<string,React.ComponentType>={
  "HUMMIN Assessment v2":OriginalAssessment,
  "HUMMIN Insights":OriginalInsights
 };
 return <>
  <SourceMarketingPreview page={view==="assessment"?"assess":"insights"} sourceImports={imports}/>
  {message&&<div role="status" style={{position:"fixed",zIndex:999,bottom:16,right:16,
   maxWidth:380,padding:"12px 20px",borderRadius:8,background:"#1E272A",
   color:"#F4F5F1"}}>{message}</div>}
 </>;
}
