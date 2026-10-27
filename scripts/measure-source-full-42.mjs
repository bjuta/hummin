/** Canonical source-native 42-case HUMMIN visual release gate.
 * Read-only against live hummin.org and isolated Workers Preview.
 * Never deploys or modifies main/public pages, archives, forms or databases.
 */
import fs from "node:fs";
import {spawnSync} from "node:child_process";
import path from "node:path";
const suites=[
 {name:"marketing",script:"scripts/measure-approved-marketing-parity.mjs",dir:"artifacts/source-marketing-parity",expected:21},
 {name:"assessment-insights",script:"scripts/measure-source-remaining-parity.mjs",dir:"artifacts/source-remaining-parity",expected:15},
 {name:"legal",script:"scripts/measure-source-legal-parity.mjs",dir:"artifacts/source-legal-parity",expected:6}
];
const out="artifacts/source-native-full-42";
fs.mkdirSync(out,{recursive:true});
const result={criteria:{maxMismatch:.08,maxHeightDifferencePx:12},required:42,suites:[],passing:0,measured:0,releaseAccepted:false,productionUnchanged:true};
for(const suite of suites){
 console.log("FULL SOURCE GATE START",suite.name,suite.expected);
 const run=spawnSync(process.execPath,[suite.script],{
  encoding:"utf8",timeout:18*60*1000,maxBuffer:12*1024*1024,env:process.env
 });
 if(run.stdout)process.stdout.write(run.stdout);
 if(run.stderr)process.stderr.write(run.stderr);
 const file=path.join(suite.dir,"summary.json");
 let summary=null,checks=[];
 try{
  summary=JSON.parse(fs.readFileSync(file,"utf8"));
  checks=summary.checks||[];
 }catch(e){console.error("FULL SOURCE GATE MISSING FAMILY RESULT",suite.name,String(e))}
 const passed=checks.filter(row=>row.pass===true).length;
 const keys=new Set(checks.map(row=>(row.slug||row.route)+"|"+row.width));
 const complete=checks.length===suite.expected&&keys.size===suite.expected;
 const accepted=run.status===0&&complete&&passed===suite.expected;
 result.measured+=checks.length;
 result.passing+=passed;
 result.suites.push({name:suite.name,required:suite.expected,measured:checks.length,
  passing:passed,accepted,commandExit:run.status,
  errors:checks.filter(row=>row.pass!==true).map(row=>({
   route:row.slug||row.route,width:row.width,
   mismatch:row.mismatch,heightDelta:row.heightDelta,error:row.error
  }))
 });
 console.log("FULL SOURCE FAMILY",suite.name,passed+"/"+suite.expected,accepted?"ACCEPTED":"BLOCKED");
}
result.releaseAccepted=result.measured===42&&result.passing===42&&result.suites.every(s=>s.accepted);
fs.writeFileSync(out+"/summary.json",JSON.stringify(result,null,2)+"\n");
console.log("HUMMIN FULL SOURCE NATIVE VISUAL GATE",result.passing+"/42",result.releaseAccepted?"PASS":"BLOCKED");
if(!result.releaseAccepted)process.exitCode=1;
