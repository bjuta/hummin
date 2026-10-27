/** Derive initial and interactive Assessment/Insights data from their *original*
 * author-authored DCLogic expressions, in a build-time VM only.
 */
import fs from "node:fs";
import vm from "node:vm";
import {gunzipSync} from "node:zlib";
import {createHash} from "node:crypto";
const dir="design/sources";
const parts=n=>fs.readdirSync(dir).filter(f=>f.startsWith(n+".")&&f.endsWith(".part")).sort().map(f=>fs.readFileSync(dir+"/"+f,"utf8")).join("");
const assessmentBundle=parts("assessment");
const assessment=JSON.parse(assessmentBundle.match(/<script\s+type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/)[1]);
const insights=gunzipSync(Buffer.from(fs.readFileSync(dir+"/insights-v4.html.gz.b64","utf8").replace(/\s/g,""),"base64")).toString("utf8");
const documents={assessment,insights};
const output={};
for(const [name,html] of Object.entries(documents)){
 const js=html.match(/<script\s+type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
 if(!js||!js.includes("class Component extends DCLogic")||!js.includes("renderVals()"))throw Error(name+" original model unavailable");
 const sandbox=vm.createContext({
  DCLogic:class{setState(next){this.state={...this.state,...(typeof next==="function"?next(this.state):next)}}},
  React:{createRef:()=>({current:null})},
  window:{matchMedia:()=>({matches:false}),location:{pathname:"/"},parent:{location:{origin:"https://hummin.org"}}},
  Date,Intl,URL,Math,console:{log:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},fetch:()=>Promise.reject(new Error("No network permitted"))
 });
 const Class=vm.runInContext(js+"\nComponent",sandbox,{timeout:5000});
 const make=changes=>{
  const model=new Class();
  model.props={onContact:()=>{},onAssess:()=>{},onNav:()=>{}};
  model.state={...model.state,...changes};
  const v=model.renderVals();
  const seen=new WeakSet();
  return JSON.parse(JSON.stringify(v,(_key,value)=>{
   if(typeof value==="function")return undefined;
   if(value&&typeof value==="object"){if(seen.has(value))return undefined;seen.add(value);}
   return value;
  }));
 };
 let views;
 if(name==="assessment"){
  views={intro:make({stage:"intro"}),first:make({stage:"flow",step:0}),
   choice:make({stage:"flow",step:1})};
  if(views.intro.is_intro!==true||views.intro.introCards?.length!==4)throw Error("Assessment intro model invalid");
 }else{
  views={index:make({view:"index"}),article:make({view:"post",slug:"enquiries-30-day-fix"}),
   topic:make({view:"topic",topic:"Marketing"}),author:make({view:"author",author:"team"})};
  if(views.index.is_index!==true||views.article.is_post!==true||views.topic.is_topic!==true||views.author.is_author!==true)
   throw Error("Insights initial models invalid");
 }
 output[name]={sourceSha256:createHash("sha256").update(js).digest("hex"),views};
 console.log("ORIGINAL VIEWMODELS",name,Object.fromEntries(Object.entries(views).map(([k,v])=>[k,{keys:Object.keys(v).length,heading:v.title||v.post?.title||v.heroTitle,arrays:Object.keys(v).filter(x=>Array.isArray(v[x])).slice(0,14)}])));
}
fs.mkdirSync("artifacts/source-native-transcription",{recursive:true});
fs.writeFileSync("artifacts/source-native-transcription/remaining-viewmodels.json",JSON.stringify(output,null,2)+"\n");
