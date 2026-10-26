import test from "node:test";
import assert from "node:assert/strict";
import {AREAS,GOALS,STEPS,PLAN,NUMS} from "../app/lib/react-assessment-content.ts";
import {scoreAssessment} from "../app/lib/react-assessment-model.ts";
const blank={sale:"",enq:"",conv:"",hours:""};
function answers(rank=0){const a={goal:GOALS[0].label,help:"Myself, with a clear plan",decide:"Me",timing:"This month"};for(const q of STEPS)if(q.type==="choice"&&q.options)a[q.id]=q.options[Math.min(rank,q.options.length-1)].label;return a;}
test("Assessment input model preserves all source questions, areas and financial inputs",()=>{
 assert.equal(AREAS.length,5);
 assert.equal(GOALS.length,4);
 assert.equal(STEPS.length,23);
 assert.equal(NUMS.length,4);
 assert.equal(Object.keys(PLAN).length,5);
 for(const id of ["d1","d2","d3","c1","c2","c3","o1","o2","o3","p1","p2","p3","i1","i2","i3","nums","size","obstacle","help","timing","decide","ninety"])assert.ok(STEPS.some(q=>q.id===id),id);
});
test("Exact source weighted scoring: complete strengths 100, all weak 0",()=>{
 const high=scoreAssessment(answers(0),blank,{});
 assert.equal(high.score,100);
 assert.deepEqual(high.areas.map(x=>x.pct),[100,100,100,100,100]);
 const low=scoreAssessment(answers(3),blank,{});
 assert.equal(low.score,0);
 assert.deepEqual(low.areas.map(x=>x.pct),[0,0,0,0,0]);
});
test("Unknown financial figures reduce information score, not silently invent costs",()=>{
 const a=answers(0);
 const result=scoreAssessment(a,blank,{sale:true,enq:true,conv:true,hours:true});
 assert.equal(result.areas.find(x=>x.k==="information").pct,68);
 assert.equal(result.monthly,null);
 assert.equal(result.hoursBack,null);
});
test("Source monthly missed-enquiry estimate and owner hours remain exact",()=>{
 const a=answers(0);
 const x=scoreAssessment(a,{sale:"25000",enq:"40",conv:"3",hours:"45"},{});
 assert.equal(x.gap,.05);
 assert.equal(x.close,.3);
 assert.equal(x.monthly,15000);
 assert.equal(x.hoursBack,65);
 const slow=answers(3);slow.c2=STEPS.find(q=>q.id==="c2").options[2].label;
 const y=scoreAssessment(slow,{sale:"25000",enq:"40",conv:"3",hours:"45"},{});
 assert.equal(y.gap,.6);
 assert.equal(y.monthly,180000);
});
test("Results choose exactly three weighted priorities and preserve decision routing",()=>{
 const a=answers(3);
 a.decide="Someone else";assert.equal(scoreAssessment(a,blank,{}).route,"share");
 a.decide="Me";a.help="Have it done, working with my team";
 assert.equal(scoreAssessment(a,blank,{}).route,"book");
 a.timing="I am just exploring";
 assert.equal(scoreAssessment(a,blank,{}).route,"nurture");
 const r=scoreAssessment(a,blank,{});
 assert.equal(r.priorities.length,3);
 for(const p of r.priorities)assert.ok(p.diy&&p.help);
});
