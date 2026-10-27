/** Pure, source-derived Assessment computations for the isolated native React flow.
 * Original authored question/score data: ApprovedAssessmentContract.generated.json.
 * No original HTML or embedded DCLogic executes in the browser.
 */
import original from "../data/ApprovedAssessmentContract.generated.json" with {type:"json"};
type AreaKey="direction"|"customers"|"operations"|"people"|"information";
export type AnswerMap=Record<string,string>;
type Option={label:string;pts?:number};
export type Question={type:"choice"|"numbers"|"text";area:string;id:string;text:string;why:string;ph?:string;options?:Option[]};
type Area={k:AreaKey;name:string};
type Goal={label:string;w:Record<AreaKey,number>};
type PlanItem={diy:string;help:string};
const source=original as unknown as {
 AREAS:Area[];GOALS:Goal[];STEPS:Question[];SECTIONS:{k:string;name:string}[];
 SEG:{k:string}[];CURRENCIES:[string,string][];NUMS:{k:string;label:string;ph:string;unit:string;money?:boolean;help:string}[];
 GAP:number[];PLAN:Record<AreaKey,PlanItem>;
 PT:{bg:string;fg:string;chipBg:string;chipBd:string}[];
};
export const assessmentQuestions=source.STEPS;
export const assessmentCurrencies=source.CURRENCIES;
export const assessmentNumberFields=source.NUMS;
export const assessmentQuestionCount=assessmentQuestions.length;
export type AssessmentStage="intro"|"flow"|"results";
export type AssessmentState={
 stage:AssessmentStage;step:number;ans:AnswerMap;text:string;cur:string;
 nums:Record<string,string>;unknown:Record<string,boolean>;
 gate:{name:string;email:string;biz:string};gateErr:Record<string,string>;unlocked:boolean;
};
export function initialAssessmentState():AssessmentState{
 return {stage:"intro",step:0,ans:{},text:"",cur:"KES",
  nums:{sale:"",enq:"",conv:"",hours:""},unknown:{},
  gate:{name:"",email:"",biz:""},gateErr:{},unlocked:false};
}
export function assessmentCanAdvance(s:AssessmentState):boolean{
 const question=assessmentQuestions[s.step];
 if(!question)return false;
 if(question.type==="choice")return !!question.options?.some(o=>o.label===s.ans[question.id]);
 if(question.type==="numbers")return source.NUMS.every(f=>{
  const val=s.nums[f.k]?.trim()??"";
  if(s.unknown[f.k])return true;
  if(!val)return false;
  const number=Number(val);
  return Number.isFinite(number)&&number>=0&&number<=1e11&&
    (f.k!=="conv"||number<=10)&&(f.k!=="hours"||number<=168);
 });
 return true; // The source's 90-day text answer is optional.
}
export function assessmentScore(s:AssessmentState){
 const goal=source.GOALS.find(g=>g.label===s.ans.goal)||source.GOALS[0];
 const areas=source.AREAS.map(a=>{
  let pts=0,n=0;
  for(const q of source.STEPS){
   if(q.area!==a.k)continue;
   n++;
   const chosen=q.options?.find(o=>o.label===s.ans[q.id]);
   pts+=chosen?.pts||0;
  }
  let pct=Math.round(pts/(n*3)*100);
  if(a.k==="information")pct=Math.max(0,pct-8*Object.values(s.unknown).filter(Boolean).length);
  return {...a,pct,w:goal.w[a.k]};
 });
 const wsum=areas.reduce((v,a)=>v+a.w,0);
 const score=Math.round(areas.reduce((v,a)=>v+a.pct*a.w,0)/wsum);
 const num=(k:string)=>s.unknown[k]?null:(Number.parseFloat(s.nums[k])||null);
 const sale=num("sale"),enq=num("enq"),conv=num("conv"),hours=num("hours");
 const c1=source.STEPS.find(q=>q.id==="c1")!,c2=source.STEPS.find(q=>q.id==="c2")!;
 const gi=Math.max(0,c1.options!.findIndex(o=>o.label===s.ans.c1));
 const rec2=c2.options!.findIndex(o=>o.label===s.ans.c2)>=2?0.1:0;
 const gap=Math.min(0.6,source.GAP[gi]+rec2);
 const close=conv!=null?Math.min(10,conv)/10:0.2;
 const monthly=sale&&enq?enq*gap*close*sale:null;
 const hoursBack=hours!=null?Math.round(Math.max(0,hours-15)*0.5*4.33):null;
 return {goal,areas,score,monthly,hoursBack,gap,close,convKnown:conv!=null,sale,enq,hours};
}
export function assessmentRoute(s:AssessmentState,r:ReturnType<typeof assessmentScore>){
 const a=s.ans,decides=a.decide!=="Someone else";
 const ready=a.timing==="This month"||a.timing==="In the next three months";
 const help=!!a.help&&a.help!=="Myself, with a clear plan";
 return !decides?"share":ready&&help&&r.score<80?"book":"nurture";
}
export function assessmentFlowModel(s:AssessmentState){
 const q=assessmentQuestions[s.step];
 if(!q)throw Error("Assessment step out of bounds");
 const segOf=(item:Question)=>["goal","direction","customers","operations","people","information"].includes(item.area)?item.area:"tail";
 const disabled=q.type==="numbers"&&!assessmentCanAdvance(s);
 return {
  stepKey:q.id,qText:q.text,qWhy:q.why,
  sectionLabel:source.SECTIONS.find(x=>x.k===q.area)?.name||"",
  stepLabel:"Question "+(s.step+1)+" of "+assessmentQuestionCount,
  progressNow:Math.round(s.step/assessmentQuestionCount*100),
  segs:source.SEG.map(sg=>{
   const indexes=source.STEPS.map((item,i)=>segOf(item)===sg.k?i:-1).filter(i=>i>=0);
   const done=indexes.filter(i=>i<s.step).length;
   return {name:sg.k,fill:Math.round(done/indexes.length*100)+"%",color:segOf(q)===sg.k?"#B5532C":"#1E272A"};
  }),
  isChoice:q.type==="choice",isNumbers:q.type==="numbers",isText:q.type==="text",
  options:(q.options||[]).map((o,i)=>{
   const chosen=s.ans[q.id]===o.label;
   return {key:i+1,label:o.label,checked:String(chosen),
    bg:chosen?"#1E272A":"#FFFFFF",fg:chosen?"#F4F5F1":"#1E272A",
    bd:chosen?"#1E272A":"#D0D8D2",
    keyBd:chosen?"rgba(244,245,241,0.4)":"#BAC4BE"};
  }),
  keyHint:q.type==="choice"?"Press 1–"+q.options?.length+" to answer":"",
  showNext:q.type!=="choice"||!!s.ans[q.id],
  nextDisabledStr:String(disabled),nextBg:disabled?"#BAC4BE":"#B5532C",
  nextLabel:s.step===assessmentQuestionCount-1?"See My Results":"Next",
  cur:s.cur,curCode:s.cur,currencies:source.CURRENCIES.map(([code,label])=>({code,label})),
  numFields:source.NUMS.map(f=>{
   const unknown=!!s.unknown[f.k];
   return {...f,id:"n-"+f.k,value:unknown?"":s.nums[f.k],
    unknown,unknownStr:String(unknown),op:unknown?0.4:1,money:!!f.money,
    ckBg:unknown?"#1E272A":"transparent",
    ckFg:unknown?"#F4F5F1":"#1E272A",ckBd:unknown?"#1E272A":"#BAC4BE"};
  }),
  textVal:s.text,textPh:q.ph||""
 };
}
const formatMoney=(currency:string,value:number)=>{
 try{return new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:0}).format(Math.round(value));}
 catch{return currency+" "+Math.round(value).toLocaleString();}
};
export function assessmentResultsModel(s:AssessmentState){
 const r=assessmentScore(s),fmt=(n:number)=>formatMoney(s.cur,n);
 const rt=assessmentRoute(s,r);
 const ranked=r.areas.slice().sort((a,b)=>(a.pct-(a.w-1)*20)-(b.pct-(b.w-1)*20)).slice(0,3);
 const minA=r.areas.slice().sort((a,b)=>a.pct-b.pct)[0];
 const rec=s.ans.help==="Have it done, working with my team"?
   (["operations","people"].includes(minA.k)&&/time|without me/.test(r.goal.label)
    ?{name:"Residency",why:"Your goal depends on day-to-day work running without you. Someone close to the work makes that stick."}
    :{name:"Project",why:"You know you want it done. A defined piece of work on "+minA.name.toLowerCase()+" is the quickest route."})
   :{name:"Review",why:"A short, fixed-fee look at "+minA.name.toLowerCase()+" and your other gaps, ending in a plan with costs."};
 const route=rt==="book"?
  {bg:"#1E272A",fg:"#F4F5F1",label:"#E58A5F",ghost:"rgba(244,245,241,0.3)",kicker:"Next step",title:"Talk through your results with us.",body:"A free 30-minute video call. We go through your answers, check the cost estimate against your real figures, and tell you honestly whether we can help. No preparation needed."}
 :rt==="share"?
  {bg:"#E7EBE6",fg:"#1E272A",label:"#B5532C",ghost:"#BAC4BE",kicker:"Next step",title:"Share this with the person who decides.",body:"Your plan is most useful in the hands of whoever approves work like this. Open the plan above to get a copy you can forward."}
 :{bg:"#E7EBE6",fg:"#1E272A",label:"#B5532C",ghost:"#BAC4BE",kicker:"Next step",
  title:s.ans.help==="Myself, with a clear plan"?"Start with the plan above.":"Start with the plan, and come back when the timing is right.",
  body:s.ans.help==="Myself, with a clear plan"?"You said you would rather fix this yourself. The 30-day plan is written for that. If you get stuck, we are happy to talk.":"Work through the 30-day plan. When you are ready to start, book a call and we will pick up from your results."};
 return {
  goalLabel:r.goal.label,score:r.score,
  band:r.score>=75?{title:"Strong foundations.",body:"Most of what your goal depends on is in place. The gains now come from one or two specific areas."}
   :r.score>=50?{title:"A working business with clear gaps.",body:"The business runs, but parts of it rely on effort rather than structure. The lowest areas below are where the next gains are."}
   :{title:"Effort is carrying the business.",body:"Much of the work depends on people covering gaps. This is common when a business grows faster than its systems, and it is fixable."},
  areaScores:r.areas.map(a=>({name:a.name,score:a.pct,width:Math.max(a.pct,2)+"%",
   weightLabel:a.w>=1.4?"key for your goal":a.w<=0.8?"less critical":"standard",
   color:a.pct>=70?"#2E6B5C":a.pct>=45?"#5E6967":"#B5532C"})),
  hasCost:r.monthly!=null&&r.monthly>0,noCost:!(r.monthly!=null&&r.monthly>0),
  costMonthly:r.monthly?fmt(r.monthly):"",costYearly:r.monthly?fmt(r.monthly*12):"",
  hasHours:r.hoursBack!=null&&r.hoursBack>0,hoursBack:r.hoursBack,
  assumptions:[
   "Late or missed replies: we assume about "+Math.round(r.gap*100)+"% of enquiries are not followed up in time, based on your answers about reply speed and record-keeping.",
   "Of those, "+Math.round(r.close*10)+" in 10 could have become customers"+(r.convKnown?", using your own figure.":", a typical figure, because you were not sure of yours."),
   "Each lost customer is worth one average sale. Repeat purchases are not counted, so the real figure is likely higher.",
   "Owner time: hours over 15 a week on day-to-day work, of which about half could be handed over with clear roles and processes."
  ],
  plan:ranked.map((a,i)=>({n:i+1,name:a.name,score:a.pct,diy:source.PLAN[a.k].diy,
   help:source.PLAN[a.k].help,...source.PT[i]})),
  unlocked:s.unlocked,locked:!s.unlocked,gateEmail:s.gate.email,
  route,rec,showRec:rt==="book",
  // The source's standalone mock calendar fabricates availability. Never render it as bookable.
  showBooking:false,showBookAnyway:false,notBooked:true,booked:false,
  bookAnywayLabel:"Booking is not enabled in isolated Preview.",
  gateFields:([
   ["name","Name","text","name","Your full name"],
   ["email","Work Email","email","email","name@business.com"],
   ["biz","Business Name","text","organization","Trading name"]
  ] as const).map(([k,label,type,ac,ph])=>({
   id:"g-"+k,label,type,ac,ph,value:s.gate[k],err:s.gateErr[k]||"",
   inv:String(!!s.gateErr[k]),bd:s.gateErr[k]?"#B5532C":"#BAC4BE"
  }))
 };
}
export function validateAssessmentGate(gate:AssessmentState["gate"]):Record<string,string>{
 const errors:Record<string,string>={};
 if(gate.name.trim().length<2)errors.name="Enter your name.";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gate.email.trim())||gate.email.length>254)
  errors.email="Enter a valid email, such as name@business.com.";
 if(gate.biz.trim().length<2)errors.biz="Enter your business name.";
 return errors;
}
