import {sourceProductionSite} from "./source-production-template.mjs";
/** Compute original HUMMIN marketing view-model states in an isolated,
 * build-time Node VM. Only data snapshots are committed; the original
 * DCLogic class and design runtime are never shipped to the browser.
 */
import fs from "node:fs";
import vm from "node:vm";
import {createHash} from "node:crypto";
const html=sourceProductionSite();
const source=html.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
if(!source||!source.includes("class Component extends DCLogic")||!source.includes("renderVals()"))
 throw Error("Approved HUMMIN view model missing");
const sha256=createHash("sha256").update(source).digest("hex");
const files=fs.readdirSync("public/brand/icons").filter(n=>n.endsWith(".svg"));
const icons=files.map(n=>n.replace(/\.svg$/,""));
const resources={mark_mist:"/brand/hummin-mark-mist.svg",mark_tone:"/brand/hummin-mark-tone.svg"};
for(const icon of icons){
 if(icon.endsWith("-light"))resources["pp_"+icon.slice(0,-6)]="/brand/icons/"+icon+".svg";
 else resources["ic_"+icon]="/brand/icons/"+icon+".svg";
}
const sandbox=vm.createContext({
 DCLogic:class {setState(next){this.state={...this.state,...(typeof next==="function"?next(this.state):next)}}},
 React:{createRef:()=>({current:null})},
 window:{__resources:resources,matchMedia:()=>({matches:false}),HUMMIN_CONTACT_READY:true,location:{pathname:"/"}},
 console:{log:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},Date,
});
const Component=vm.runInContext(source+"\nComponent",sandbox,{timeout:5000});
const pages=["home","how","core","eng","who","about","contact"];
const snapshot=(page,changes={})=>{
 const model=new Component();
 model.state={...model.state,page,...changes};
 const sourceView=model.renderVals();
 return JSON.parse(JSON.stringify(sourceView,(_key,value)=>typeof value==="function"?undefined:value));
};
const snapshots={
 sourceSha256:sha256,
 pages:Object.fromEntries(pages.map(p=>[p,snapshot(p)])),
 menu:Object.fromEntries(pages.map(p=>[p,snapshot(p,{menu:true})])),
 core:Array.from({length:7},(_,i)=>snapshot("core",{core:i})),
 tier:Array.from({length:3},(_,i)=>snapshot("eng",{tier:i})),
 values:Array.from({length:6},(_,i)=>snapshot("about",{val:i})),
 topicPeek:Array.from({length:6},(_,i)=>snapshot("home",{peek:{kind:"topic",i},peekOpen:true})),
 tierPeek:Array.from({length:3},(_,i)=>snapshot("home",{peek:{kind:"tier",i},peekOpen:true})),
 sent:snapshot("contact",{sent:true}),
 floatOff:snapshot("home",{floatOff:true}),
 copied:snapshot("home",{copied:true})
};
for(const [page,state] of Object.entries(snapshots.pages)){
 if(state.nav?.length!==9||typeof state.is_home!=="boolean")throw Error("Corrupted source model: "+page);
}
fs.mkdirSync("artifacts/source-native-transcription",{recursive:true});
fs.writeFileSync("artifacts/source-native-transcription/marketing-viewmodels.json",JSON.stringify(snapshots,null,2)+"\n");
console.log("APPROVED VIEWMODEL",pages.length,"pages",snapshots.core.length,"domain variants",snapshots.tier.length,"tier variants",snapshots.values.length,"values variants","source",sha256.slice(0,12));
