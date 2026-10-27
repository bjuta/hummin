/** Offline, verifiable approved-source-to-React transcription.
 * Does not import the discarded React page implementation or ship the design runtime.
 * Requires catalog-approved-source.mjs and extract-source-blueprints.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import {parseFragment} from "parse5";

const sourceDir="artifacts/source-component-blueprints";
const targetDir="artifacts/source-native-transcription";
const manifest=JSON.parse(fs.readFileSync(path.join(sourceDir,"manifest.json"),"utf8"));
if(manifest.summary.count!==45)throw Error("Expected 45 checksum-validated components");
fs.mkdirSync(targetDir,{recursive:true});
const hover=new Map();
const active=new Map();
const warnings=[];
let serial=0;

function quoted(x){return JSON.stringify(String(x));}
function expr(value,scope){
 const exact=value.match(/^\{\{\s*([^{}]+?)\s*\}\}$/);
 if(exact)return "sourceRead("+scope+","+quoted(exact[1].trim())+")";
 const regex=/\{\{\s*([^{}]+?)\s*\}\}/g;
 let pos=0,match,parts=[];
 while((match=regex.exec(value))){
  if(match.index>pos)parts.push(quoted(value.slice(pos,match.index)));
  parts.push("String(sourceRead("+scope+","+quoted(match[1].trim())+") ?? '')");
  pos=match.index+match[0].length;
 }
 if(pos===0)return quoted(value);
 if(pos<value.length)parts.push(quoted(value.slice(pos)));
 return parts.join("+");
}
function declarations(style){
 const results=[];let part="",depth=0,quote=null;
 for(const ch of style){
  if(quote){
   part+=ch;
   if(ch===quote)quote=null;
   continue;
  }
  if(ch==="'"||ch==='"'){quote=ch;part+=ch;continue;}
  if(ch==="(")depth++;
  if(ch===")")depth--;
  if(ch===";"&&depth===0){results.push(part);part="";}
  else part+=ch;
 }
 if(part)results.push(part);
 return results;
}
function cssProp(key){
 if(key.startsWith("--"))return key;
 return key.replace(/^-webkit-/,"Webkit-").replace(/-([a-z])/g,(_,ch)=>ch.toUpperCase());
}
function styleProps(text,scope){
 const entries=[];
 for(const part of declarations(text)){
  const colon=part.indexOf(":");if(colon<0)continue;
  const key=part.slice(0,colon).trim(),value=part.slice(colon+1).trim();
  if(!key||!value)continue;
  entries.push(quoted(cssProp(key))+":"+expr(value,scope));
 }
 return "{"+entries.join(",")+"}";
}
function renderChildren(node,scope){
 const children=node.childNodes||node.content?.childNodes||[];
 return children.map(child=>render(child,scope)).filter(v=>v!==null);
}
function render(node,scope){
 if(node.nodeName==="#text")return expr(node.value||"",scope);
 if(node.nodeName==="#comment"||node.nodeName==="#documentType")return null;
 if(!node.tagName){
  const kids=renderChildren(node,scope);
  return "React.createElement(React.Fragment,null"+(kids.length?","+kids.join(","):"")+")";
 }
 const tag=node.tagName;
 const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
 if(tag==="sc-if"){
  const test=expr(attrs.value||"{{ false }}",scope);
  const kids=renderChildren(node,scope);
  return "(sourceTruthy("+test+")?React.createElement(React.Fragment,null"+(kids.length?","+kids.join(","):"")+"):null)";
 }
 if(tag==="sc-for"){
  const alias=attrs.as||"item";
  if(!/^[A-Za-z_$][\w$]*$/.test(alias))throw Error("Invalid original loop alias "+alias);
  const serialNo=++serial;
  const local="__scope"+serialNo;
  const kids=renderChildren(node,local);
  return "(sourceItems("+expr(attrs.list||"{{ [] }}",scope)+").map((__item,__index)=>{const "+local+"={..."+scope+","+quoted(alias)+":__item};return React.createElement(React.Fragment,{key:__index}"+(kids.length?","+kids.join(","):"")+");}))";
 }
 if(tag==="helmet"||tag==="script"||tag==="style")return null;
 if(tag==="dc-import"){
  return "React.createElement(SourceImport,{name:"+quoted(attrs.name||"")+",scope:"+scope+"})";
 }
 if(tag==="image-slot"){
  return "React.createElement(SourceImageSlot,{id:"+quoted(attrs.id||"")+",source:"+quoted(attrs.src||"")+",shape:"+quoted(attrs.shape||"")+",radius:"+quoted(attrs.radius||"")+",scope:"+scope+"})";
 }
 const nativeTag=tag==="sc-raw-select"?"select":tag;
 const props=[];
 for(const [key,value] of Object.entries(attrs)){
  if(key==="style")props.push("style:"+styleProps(value,scope));
  else if(key.startsWith("sc-camel-on-")||key.startsWith("sc-on-")){
   const raw=key.replace(/^sc-(?:camel-)?on-/,"");
   const event="on"+raw.split("-").map(x=>x[0].toUpperCase()+x.slice(1)).join("");
   props.push(quoted(event)+":(__event:unknown)=>sourceInvoke("+expr(value,scope)+",__event)");
  }else if(key==="style-hover"){
   if(!hover.has(value))hover.set(value,"source-hover-"+hover.size);
   props.push(quoted("data-source-hover")+":"+quoted(hover.get(value)));
  }else if(key==="style-active"){
   if(!active.has(value))active.set(value,"source-active-"+active.size);
   props.push(quoted("data-source-active")+":"+quoted(active.get(value)));
  }else if(key.startsWith("hint-placeholder-"))continue;
  else if(key==="src")props.push("src:sourceAsset("+scope+","+expr(value,scope)+")");
  else if(key==="class")props.push("className:"+expr(value,scope));
  else if(key==="for")props.push("htmlFor:"+expr(value,scope));
  else if(key==="tabindex")props.push("tabIndex:"+expr(value,scope));
  else if(key==="checked")props.push("defaultChecked:"+expr(value,scope));
  else if(key==="value"&&(nativeTag==="input"||nativeTag==="textarea")){
   props.push("defaultValue:"+expr(value,scope));
  }else props.push(quoted(key)+":"+expr(value,scope));
 }
 const children=renderChildren(node,scope);
 return "React.createElement("+quoted(nativeTag)+",{"+props.join(",")+"}"+(children.length?","+children.join(","):"")+")";
}
const output=[];
output.push('import * as React from "react";');
output.push('import {sourceRead,sourceTruthy,sourceItems,sourceInvoke,sourceAsset,SourceImageSlot,SourceImport} from "../../app/components/source-native-bridge";');
output.push('import type {SourceScope} from "../../app/components/source-native-bridge";');
const functions=[];
for(const component of manifest.components){
 const fragment=fs.readFileSync(path.join(sourceDir,component.file),"utf8");
 const tree=parseFragment(fragment);
 const kids=renderChildren(tree,"scope");
 const fn="Approved"+component.name.split(/[.-]/).map(p=>p[0].toUpperCase()+p.slice(1)).join("");
 functions.push({name:component.name,export:fn,source:component.source,originalHash:component.sha256});
 output.push("export function "+fn+"({scope={}}:{scope?:SourceScope}){return React.createElement(React.Fragment,null"+(kids.length?","+kids.join(","):"")+");}");
}
const text=output.join("\n")+"\n";
fs.writeFileSync(path.join(targetDir,"approved-components.tsx"),text);
const hoverCss=Array.from(hover,([css,id])=>"["+quoted("data-source-hover")+"="+quoted(id)+"]:hover{"+css+"}").join("\n")+"\n";
fs.writeFileSync(path.join(targetDir,"source-hover.css"),hoverCss);
const activeCss=Array.from(active,([css,id])=>"["+quoted("data-source-active")+"="+quoted(id)+"]:active{"+css+"}").join("\n")+"\n";
fs.writeFileSync(path.join(targetDir,"source-active.css"),activeCss);
const details={count:functions.length,generatedBytes:Buffer.byteLength(text),hoverStates:hover.size,activeStates:active.size,functions,status:"unwired source transcription, not visually accepted"};
fs.writeFileSync(path.join(targetDir,"transcription-manifest.json"),JSON.stringify(details,null,2));
console.log("SOURCE NATIVE TRANSCRIPTION",functions.length,"components",details.generatedBytes,"bytes",hover.size,"original hover treatments");
