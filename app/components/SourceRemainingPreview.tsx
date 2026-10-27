import * as React from "react";
import {ApprovedAssessmentRoot,ApprovedInsightsRoot} from "./ApprovedSourceTranscription.generated";
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
 const [assessmentStage,setAssessmentStage]=React.useState<"intro"|"first"|"choice">("intro");
 const [insightView,setInsightView]=React.useState<"index"|"article"|"topic"|"author">(
   view==="assessment"||view==="insights"?"index":view
 );
 const [message,setMessage]=React.useState("");
 const assessmentScope:SourceScope={
  ...sources.assessment.views[assessmentStage],__assets:sourceAssets,
  start:()=>setAssessmentStage("first"),
  next:()=>setAssessmentStage("choice"),
  back:()=>setAssessmentStage("intro"),
  restart:()=>setAssessmentStage("intro"),
  toContact:()=>setMessage("Contact submissions are disabled on this isolated Preview.")
 };
 const editorialScope:SourceScope={
  ...sources.insights.views[insightView],__assets:sourceAssets,
  goIndex:()=>setInsightView("index"),
  toAssess:()=>setMessage("Open the dedicated Assessment Preview route."),
  toContact:()=>setMessage("Use the live HUMMIN site for enquiries."),
  toCore:()=>setMessage("See Applied Expertise in the marketing Preview.")
 };
 const OriginalAssessment=()=>React.createElement("div",{
  className:"hm-frame-shell",
  style:{position:"relative",height:"900px",minHeight:0,overflowY:"auto",overscrollBehavior:"contain",background:"#1E272A"}
 },React.createElement(ApprovedAssessmentRoot,{scope:assessmentScope}));
 const OriginalInsights=()=>React.createElement("div",{
  className:"hm-frame-shell",
  style:{position:"relative",minHeight:"580px",marginBottom:"calc(-1 * clamp(64px, 8cqw, 112px))",background:"#F4F5F1"}
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
