import {AREAS,GOALS,STEPS,GAP,PLAN} from "./react-assessment-content";
export type AssessmentAnswers=Record<string,string>;
export type AssessmentNumbers={sale:string;enq:string;conv:string;hours:string};
export type AssessmentUnknown=Partial<Record<keyof AssessmentNumbers,boolean>>;
export type AreaScore={k:string;name:string;pct:number;w:number};
type Choice={type:string;area:string;id:string;options?:{label:string;pts?:number}[]};
export function scoreAssessment(answers:AssessmentAnswers,numbers:AssessmentNumbers,unknown:AssessmentUnknown){
 const goal=GOALS.find(x=>x.label===answers.goal)||GOALS[0];
 const questions=STEPS as Choice[];
 const areas:AreaScore[]=AREAS.map(a=>{
  let points=0,n=0;
  for(const q of questions)if(q.area===a.k){
   n++;
   const chosen=q.options?.find(o=>o.label===answers[q.id]);
   points+=chosen?.pts||0;
  }
  let pct=Math.round(points/(n*3)*100);
  if(a.k==="information")pct=Math.max(0,pct-8*Object.values(unknown).filter(Boolean).length);
  return {...a,pct,w:goal.w[a.k as keyof typeof goal.w]};
 });
 const sum=areas.reduce((n,x)=>n+x.w,0);
 const score=Math.round(areas.reduce((n,x)=>n+x.pct*x.w,0)/sum);
 const number=(k:keyof AssessmentNumbers)=>unknown[k]?null:(parseFloat(numbers[k])||null);
 const sale=number("sale"),enq=number("enq"),conv=number("conv"),hours=number("hours");
 const c1=questions.find(q=>q.id==="c1")!,c2=questions.find(q=>q.id==="c2")!;
 const gi=Math.max(0,c1.options!.findIndex(o=>o.label===answers.c1));
 const rec2=c2.options!.findIndex(o=>o.label===answers.c2)>=2?.1:0;
 const gap=Math.min(.6,GAP[gi]+rec2);
 const close=conv!=null?Math.min(10,conv)/10:.2;
 const monthly=sale&&enq?enq*gap*close*sale:null;
 const hoursBack=hours!=null?Math.round(Math.max(0,hours-15)*.5*4.33):null;
 const priorities=areas.slice().sort((a,b)=>(a.pct-(a.w-1)*20)-(b.pct-(b.w-1)*20)).slice(0,3).map((a,i)=>({
  rank:i+1,name:a.name,score:a.pct,diy:PLAN[a.k as keyof typeof PLAN].diy,help:PLAN[a.k as keyof typeof PLAN].help
 }));
 const route=answers.decide==="Someone else"?"share":
  (["This month","In the next three months"].includes(answers.timing||"")&&
   !!answers.help&&answers.help!=="Myself, with a clear plan"&&score<80)?"book":"nurture";
 return {goal,areas,score,monthly,hoursBack,gap,close,convKnown:conv!=null,sale,enq,conv,hours,priorities,route};
}
