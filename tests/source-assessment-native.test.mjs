import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {assessmentQuestions,assessmentQuestionCount,assessmentCurrencies,assessmentNumberFields,
 initialAssessmentState,assessmentCanAdvance,assessmentScore,assessmentRoute,assessmentResultsModel,
 assessmentFlowModel,validateAssessmentGate} from "../app/lib/assessment-native.ts";

const complete=()=>{
 const s=initialAssessmentState();
 for(const q of assessmentQuestions)if(q.type==="choice")s.ans[q.id]=q.options[0].label;
 s.nums={sale:"25000",enq:"40",conv:"3",hours:"45"};
 return s;
};
test("exact 23 owner-authored steps and required final question",()=>{
 assert.equal(assessmentQuestionCount,23);
 assert.equal(assessmentQuestions[0].id,"goal");
 assert.equal(assessmentQuestions.at(-1).id,"ninety");
 assert.equal(assessmentQuestions.filter(q=>q.type==="choice").length,21);
 assert.equal(assessmentQuestions.filter(q=>q.type==="numbers").length,1);
 assert.equal(assessmentQuestions.filter(q=>q.type==="text").length,1);
 assert.equal(assessmentNumberFields.length,4);
 assert.ok(assessmentCurrencies.some(([code])=>code==="KES"));
 assert.deepEqual(Object.keys(assessmentScore(complete()).areas.map(a=>a.name)).length,5);
});
test("required answers gate progression and original optional 90-day response",()=>{
 const s=initialAssessmentState();
 s.stage="flow";
 assert.equal(assessmentCanAdvance(s),false);
 s.ans.goal=assessmentQuestions[0].options[0].label;
 assert.equal(assessmentCanAdvance(s),true);
 s.step=assessmentQuestions.findIndex(q=>q.type==="numbers");
 assert.equal(assessmentCanAdvance(s),false);
 s.unknown={sale:true,enq:true,conv:true,hours:true};
 assert.equal(assessmentCanAdvance(s),true);
 s.unknown={};
 s.nums={sale:"25000",enq:"40",conv:"3",hours:"45"};
 assert.equal(assessmentCanAdvance(s),true);
 s.nums.conv="11";
 assert.equal(assessmentCanAdvance(s),false);
 s.nums.conv="3";
 s.nums.hours="-1";
 assert.equal(assessmentCanAdvance(s),false);
 s.nums.hours="45";
 s.step=22;
 assert.equal(assessmentCanAdvance(s),true);
});
test("source scoring, currency, five areas, gap and owner hours",()=>{
 const s=complete();
 const r=assessmentScore(s);
 assert.equal(r.score,100);
 assert.equal(r.areas.length,5);
 assert.ok(r.areas.every(a=>a.pct===100));
 assert.equal(r.monthly,15000);
 assert.equal(r.hoursBack,65);
 assert.equal(assessmentRoute(s,r),"nurture");
 s.step=1;s.stage="flow";
 const view=assessmentFlowModel(s);
 assert.equal(view.stepLabel,"Question 2 of 23");
 assert.equal(view.options.length,4);
 assert.equal(view.sectionLabel,"Direction");
});
test("unknown figures do not invent cost; information score is penalised",()=>{
 const s=complete();s.unknown={sale:true,enq:true};
 const r=assessmentScore(s);
 assert.equal(r.monthly,null);
 assert.equal(r.areas.find(a=>a.k==="information").pct,84);
 const view=assessmentResultsModel(s);
 assert.equal(view.noCost,true);
 assert.equal(view.plan.length,3);
 assert.equal(view.locked,true);
 assert.equal(view.showBooking,false);
 assert.equal(view.showBookAnyway,false);
});
test("source routing distinguishes a decision-maker and a need for help",()=>{
 const s=complete();
 s.ans.decide="Someone else";
 assert.equal(assessmentRoute(s,assessmentScore(s)),"share");
 s.ans.decide="Me";
 s.ans.help="With guidance from someone experienced";
 s.ans.timing="This month";
 for(const q of assessmentQuestions)if(q.area==="customers")s.ans[q.id]=q.options.at(-1).label;
 assert.ok(assessmentScore(s).score<80);
 assert.equal(assessmentRoute(s,assessmentScore(s)),"book");
 assert.equal(assessmentResultsModel(s).showBooking,false,"no fabricated availability");
});
test("result access validates fields without sending enquiries or reserving calendar slots",()=>{
 assert.ok(Object.keys(validateAssessmentGate({name:"",email:"not-an-email",biz:""})).length===3);
 assert.deepEqual(validateAssessmentGate({name:"Good Name",email:"person@example.test",biz:"Example Trading"}),{});
 const code=fs.readFileSync("app/components/SourceAssessmentInteractive.tsx","utf8");
 assert.ok(code.includes("SourceAssessmentInteractive"));
 assert.match(code,/fetch\("\/__source-verify\/assessment"/,"Native Preview must exercise its no-delivery endpoint");
 assert.doesNotMatch(code,/fetch\("\/api\/booking\/reserve"|fetch\("\/api\/assessment\/email"/,"Preview must not call transactional endpoints");
 const model=fs.readFileSync("app/lib/assessment-native.ts","utf8");
 assert.ok(model.includes("showBooking:false"));
});
