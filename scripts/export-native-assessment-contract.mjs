/** Author-time export only: approved source question/score data, never original runtime code.
 * This script is intentionally absent from prebuild/typecheck and production bundling.
 */
import fs from "node:fs";
import vm from "node:vm";
import {createHash} from "node:crypto";
const dir="design/sources",prefix="assessment.";
const parts=fs.readdirSync(dir).filter(n=>n.startsWith(prefix)&&n.endsWith(".part")).sort();
if(parts.length!==2)throw Error("Expected both immutable original assessment source parts");
const bundled=parts.map(n=>fs.readFileSync(dir+"/"+n,"utf8")).join("");
const wrapper=bundled.match(/<script\s+type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/)?.[1];
if(!wrapper)throw Error("Owner-authored assessment template not found");
const original=JSON.parse(wrapper);
const js=original.match(/<script\s+type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
if(!js)throw Error("Owner-authored assessment logic not found");
const classAt=js.indexOf("class Component extends DCLogic");
if(classAt<1000)throw Error("Source logic structure changed");
const constants=js.slice(0,classAt);
if(/(?:\bfetch\s*\(|\bimport\s*\(|\bprocess\b|\brequire\s*\(|\bglobalThis\b)/.test(constants))
 throw Error("Unexpected capability in assessment data declaration");
const context=vm.createContext(Object.freeze({Math,Date,Intl}));
const data=vm.runInContext(constants+"\n({AREAS,GOALS,STEPS,SECTIONS,SEG,CURRENCIES,NUMS,GAP,PLAN,PT})",context,{timeout:1000});
const plain=JSON.parse(JSON.stringify(data));
if(plain.STEPS.length!==23||plain.AREAS.length!==5||plain.GOALS.length!==4
 ||plain.STEPS[0].id!=="goal"||plain.STEPS.at(-1).id!=="ninety"
 ||plain.STEPS.filter(x=>x.type==="numbers").length!==1)
 throw Error("Source Assessment questions no longer match reviewed 23-step contract");
const out={sourceSha256:createHash("sha256").update(js).digest("hex"),...plain};
fs.mkdirSync("app/data",{recursive:true});
fs.writeFileSync("app/data/ApprovedAssessmentContract.generated.json",JSON.stringify(out,null,2)+"\n");
console.log("APPROVED ASSESSMENT CONTRACT",JSON.stringify({questions:plain.STEPS.length,areas:plain.AREAS.length,goals:plain.GOALS.length,sourceSha256:out.sourceSha256}));
