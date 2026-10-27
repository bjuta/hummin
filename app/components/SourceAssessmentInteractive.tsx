import * as React from "react";
import {ApprovedAssessmentRoot} from "./ApprovedSourceTranscription.generated";
import sourceAssets from "../data/ApprovedSourceAssets.generated.json";
import sourceModels from "../data/ApprovedRemainingViewmodels.generated.json";
import type {SourceScope} from "./source-native-bridge";
import {assessmentQuestions,assessmentQuestionCount,assessmentFlowModel,assessmentResultsModel,
 assessmentCanAdvance,assessmentScore,validateAssessmentGate,initialAssessmentState} from "../lib/assessment-native";
import type {AssessmentState} from "../lib/assessment-native";

/** Fully local source-faithful Assessment state machine, never submitting in isolated Preview.
 * No fabricated appointment slots, no email delivery, no original runtime HTML.
 */
export function SourceAssessmentInteractive(){
 const [state,setState]=React.useState<AssessmentState>(initialAssessmentState);
 const [message,setMessage]=React.useState("");
 const [validating,setValidating]=React.useState(false);
 const validatingRef=React.useRef(false);
 const root=React.useRef<HTMLDivElement>(null);
 const qRef=React.useRef<HTMLHeadingElement>(null);
 const bookRef=React.useRef<HTMLElement>(null);
 const pending=React.useRef<ReturnType<typeof setTimeout>|null>(null);
 React.useEffect(()=>()=>{if(pending.current)clearTimeout(pending.current);},[]);
 React.useEffect(()=>{
  if(state.stage!=="flow")return;
  const id=window.setTimeout(()=>qRef.current?.focus({preventScroll:true}),65);
  return ()=>clearTimeout(id);
 },[state.stage,state.step]);
 const top=()=>{
  const panel=root.current?.closest<HTMLElement>(".hm-frame-shell");
  if(panel)panel.scrollTo({top:0});
  else window.scrollTo({top:0});
 };
 const move=(step:number)=>{
  if(pending.current){clearTimeout(pending.current);pending.current=null;}
  setState(old=>({...old,stage:step>=assessmentQuestionCount?"results":"flow",
   step:Math.min(step,assessmentQuestionCount-1)}));
  top();
 };
 const pick=(label:string)=>{
  const current=state.step,q=assessmentQuestions[current];
  if(!q?.options?.some(o=>o.label===label))return;
  if(pending.current)clearTimeout(pending.current);
  setState(old=>({...old,ans:{...old.ans,[q.id]:label}}));
  pending.current=setTimeout(()=>{
   pending.current=null;
   setState(old=>{
    if(old.stage!=="flow"||old.step!==current)return old;
    return {...old,stage:current+1>=assessmentQuestionCount?"results":"flow",
     step:Math.min(current+1,assessmentQuestionCount-1)};
   });
   top();
  },260);
 };
 const back=()=>state.step===0?(setState(old=>({...old,stage:"intro",step:0})),top()):move(state.step-1);
 const next=()=>{if(assessmentCanAdvance(state))move(state.step+1);};
 const onKey=(event:React.KeyboardEvent)=>{
  if(state.stage!=="flow")return;
  const target=event.target;
  if(target instanceof HTMLElement&&/INPUT|TEXTAREA|SELECT/.test(target.tagName))return;
  const q=assessmentQuestions[state.step];
  if(q?.type!=="choice")return;
  const k=Number.parseInt(event.key,10);
  if(Number.isInteger(k)&&k>=1&&k<=(q.options?.length||0)){
   event.preventDefault();pick(q.options![k-1].label);
  }
 };
 const unlock=async ()=>{
  if(validatingRef.current||state.unlocked)return;
  const errors=validateAssessmentGate(state.gate);
  if(Object.keys(errors).length){
   setState(old=>({...old,gateErr:errors}));
   window.setTimeout(()=>document.getElementById("g-"+Object.keys(errors)[0])?.focus(),0);
   return;
  }
  validatingRef.current=true;
  setValidating(true);
  setMessage("");
  try{
   const result=assessmentResultsModel(state);
   const priorities=(result.plan as {name:string}[]).map(item=>item.name);
   const r=assessmentScore(state);
   const payload={
    name:state.gate.name.trim(),business:state.gate.biz.trim(),
    email:state.gate.email.trim(),goal:r.goal.label,score:r.score,
    priorities,token:"",
    // The email endpoint's historical cost field is specifically KES.
    // Never mislabel estimates entered in another currency as KES.
    ...(state.cur==="KES"&&r.monthly!=null?{monthlyCost:r.monthly}:{})
   };
   const response=await fetch("/__source-verify/assessment",{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json","Accept":"application/json"},
    body:JSON.stringify(payload)
   });
   const outcome=await response.json() as {
    ok?:boolean;validated?:boolean;delivered?:boolean;queued?:boolean;message?:string
   };
   if(outcome.delivered||outcome.queued)throw Error("Unexpected delivery claim in Preview");
   if(!response.ok||!outcome.ok||!outcome.validated){
    setMessage(outcome.message||"Preview assessment validation failed. No email was sent.");
    return;
   }
   setState(old=>({...old,gateErr:{},unlocked:true}));
   setMessage(outcome.message||"Results validated locally. No email was sent.");
  }catch{
   setMessage("Preview assessment validation is unavailable. No email was sent or queued.");
  }finally{
   validatingRef.current=false;
   setValidating(false);
  }
 };
 let data:SourceScope;
 if(state.stage==="intro"){
  data={...(sourceModels as {assessment:{views:{intro:SourceScope}}}).assessment.views.intro};
 }else if(state.stage==="flow"){
  data=assessmentFlowModel(state);
  const q=assessmentQuestions[state.step];
  const options=(data.options as SourceScope[]||[]);
  data.options=options.map(o=>({...o,pick:()=>pick(String(o.label))}));
  const fields=(data.numFields as SourceScope[]||[]);
  data.numFields=fields.map(f=>({
   ...f,
   onChange:(event:React.ChangeEvent<HTMLInputElement>)=>{
    const val=event.currentTarget.value,k=String(f.k);
    setState(old=>({...old,nums:{...old.nums,[k]:val}}));
   },
   toggle:()=>{
    const k=String(f.k);
    setState(old=>({...old,unknown:{...old.unknown,[k]:!old.unknown[k]}}));
   }
  }));
  data.cur=state.cur;
  data.setCur=(event:React.ChangeEvent<HTMLSelectElement>)=>{
   const value=event.currentTarget.value;
   setState(old=>({...old,cur:value}));
  };
  data.setText=(event:React.ChangeEvent<HTMLTextAreaElement>)=>{
   const value=event.currentTarget.value;
   setState(old=>({...old,text:value}));
  };
  data.next=next;
  data.back=back;
  data.onKey=onKey;
  // The original choice button advances automatically; Next exists for keyboard/back navigation.
  data.showNext=q.type==="choice"?!!state.ans[q.id]:data.showNext;
 }else{
  data=assessmentResultsModel(state);
  data.gateFields=(data.gateFields as SourceScope[]).map(f=>({
   ...f,
   onChange:(event:React.ChangeEvent<HTMLInputElement>)=>{
    const key=String(f.id).slice(2) as keyof AssessmentState["gate"];
    const value=event.currentTarget.value;
    setState(old=>({...old,gate:{...old.gate,[key]:value},
     gateErr:{...old.gateErr,[key]:""}}));
   }
  }));
  data.deliveryMessage="Your plan is unlocked in this isolated Preview. No email was sent.";
  data.unlock=unlock;
  data.unlockPending=validating;
  data.restart=()=>{
   setState(initialAssessmentState());
   setMessage("");
   top();
  };
  data.openBooking=()=>{
   setMessage("Real appointment availability is not enabled in this isolated Preview. No booking was created.");
  };
 }
 const scope:SourceScope={...data,__assets:sourceAssets,root,qRef,bookRef,
  is_intro:state.stage==="intro",is_flow:state.stage==="flow",is_results:state.stage==="results",
  start:()=>move(0)};
 return <>
  <ApprovedAssessmentRoot key={"assessment-"+state.stage+"-"+(state.stage==="flow"?state.step:0)} scope={scope}/>
  {state.stage==="results"&&<div role="status" style={{
   padding:"16px 20px",fontSize:14,lineHeight:1.5,
   color:"#1E272A",background:"#E7EBE6",borderTop:"1px solid #BAC4BE"
  }}>
   <strong>Isolated Preview.</strong> Results and priorities are calculated locally using HUMMIN's
   original scoring rules. No assessment email is sent, and no appointment is booked.
   {message&&<p>{message}</p>}
  </div>}
 </>;
}
