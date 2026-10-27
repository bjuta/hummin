/** Convert captured, owner-approved production legal DOM into native React nodes.
 * Reads only the independent, six-viewport legal source capture. Preserves the
 * existing legal markup, exact words, attributes, nesting and authored CSS.
 * Never embeds production HTML at runtime or imports the discarded React pages.
 */
import fs from "node:fs";
import path from "node:path";
import {parse} from "parse5";
import {createHash} from "node:crypto";
const artifacts="artifacts/source-legal-reference";
const target="app/components";
const cssOut=target+"/approved-source-css";
fs.mkdirSync(cssOut,{recursive:true});
const cssNames={root:"root-DdvrNREf.css",document:"LegalDocument-Dw4lY_RN.css"};
for(const [key,name] of Object.entries(cssNames)){
 const source=path.join(artifacts,name);
 if(!fs.existsSync(source))throw Error("Original legal CSS not captured: "+source);
 const content=fs.readFileSync(source,"utf8");
 if(content.length<1000||!content.includes("{")||!content.includes("}"))throw Error("Invalid or incomplete original CSS "+name);
 fs.writeFileSync(path.join(cssOut,"legal-"+key+".css"),content);
}
const attrs={
 "class":"className","for":"htmlFor","tabindex":"tabIndex",
 "readonly":"readOnly","maxlength":"maxLength","srcset":"srcSet",
 "stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin",
 "stroke-width":"strokeWidth","fill-rule":"fillRule","clip-rule":"clipRule",
 "viewbox":"viewBox","preserveaspectratio":"preserveAspectRatio",
 "colspan":"colSpan","rowspan":"rowSpan","autofocus":"autoFocus"
};
const voids=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
function render(node,scope="{}"){
 if(node.nodeName==="#text")return JSON.stringify(node.value||"");
 if(node.nodeName==="#comment"||node.nodeName==="#documentType"||node.tagName==="script"||node.tagName==="style")return null;
 if(!node.tagName){
  const children=(node.childNodes||[]).map(n=>render(n,scope)).filter(Boolean);
  return "React.createElement(React.Fragment,null"+(children.length?","+children.join(","):"")+")";
 }
 const props=[];
 const raw=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
 for(const a of node.attrs||[]){
  if(a.name==="data-discover")continue;
  const key=attrs[a.name]||a.name;
  if(a.name==="style"){
   const o=Object.fromEntries(a.value.split(";").filter(Boolean).map(entry=>{
    const idx=entry.indexOf(":");return idx<0?null:[entry.slice(0,idx).trim().replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),entry.slice(idx+1).trim()];
   }).filter(Boolean));
   props.push(JSON.stringify(key)+":"+JSON.stringify(o));
  }else if(a.name==="inert")props.push(JSON.stringify(key)+":true");
  else props.push(JSON.stringify(key)+":"+JSON.stringify(a.value));
 }
 if(raw.class?.split(" ").includes("hm-site-menu-toggle")){
  const i=props.findIndex(p=>p.startsWith('"aria-expanded":'));
  if(i>=0)props[i]='"aria-expanded":String(menuOpen)';
  props.push('"onClick":onMenuToggle');
 }
 if(raw.id==="site-nav"){
  const i=props.findIndex(p=>p.startsWith('"inert":'));
  if(i>=0)props[i]='"inert":!menuOpen';
  const classIndex=props.findIndex(p=>p.startsWith('"className":'));
  if(classIndex>=0)props[classIndex]='"className":menuOpen?"hm-site-drawer hm-site-drawer-open":"hm-site-drawer"';
 }
 const children=voids.has(node.tagName)?[]:(node.childNodes||[]).map(n=>render(n,scope)).filter(v=>v!==null);
 return "React.createElement("+JSON.stringify(node.tagName)+",{"+props.join(",")+"}"+(children.length?","+children.join(","):"")+")";
}
const roots={};
for(const name of ["privacy","terms"]){
 const file=path.join(artifacts,name+"-1440.json");
 const obj=JSON.parse(fs.readFileSync(file,"utf8"));
 if(obj.url!=="/"+name||obj.headline?.length!==1)throw Error("Captured legal source invalid "+name);
 const dom=parse(obj.bodyHTML);
 const body=(function find(n){return n.tagName==="body"?n:(n.childNodes||[]).map(find).find(Boolean)})(dom);
 const top=(tag)=>(body.childNodes||[]).find(n=>n.tagName===tag);
 if(!top("header")||!top("main")||!top("footer"))throw Error(name+" source missing site shell");
 roots[name]={header:top("header"),main:top("main"),footer:top("footer"),hash:createHash("sha256").update(obj.mainHTML).digest("hex")};
}
const code=[
 '/* Generated from the approved, actually rendered HUMMIN Privacy and Terms source. */',
 'import * as React from "react";',
 'export function ApprovedLegalSiteHeader({menuOpen=false,onMenuToggle=()=>{}}:{menuOpen?:boolean;onMenuToggle?:()=>void}){return '+render(roots.privacy.header)+';}',
 'export function ApprovedLegalSiteFooter(){return '+render(roots.privacy.footer)+';}',
 'export function ApprovedLegalPrivacyMain(){return '+render(roots.privacy.main)+';}',
 'export function ApprovedLegalTermsMain(){return '+render(roots.terms.main)+';}',
 'export const approvedLegalSourceHash='+JSON.stringify({privacy:roots.privacy.hash,terms:roots.terms.hash})+';',
 ''
].join("\n");
fs.writeFileSync(target+"/ApprovedLegalSource.generated.tsx",code);
console.log("EXACT LEGAL NATIVE TRANSCRIPTION",JSON.stringify({
 bytes:code.length,rootCSS:fs.statSync(cssOut+"/legal-root.css").size,
 legalCSS:fs.statSync(cssOut+"/legal-document.css").size,
 hash:{privacy:roots.privacy.hash.slice(0,12),terms:roots.terms.hash.slice(0,12)}
}));
