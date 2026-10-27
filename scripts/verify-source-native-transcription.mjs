/** Structural acceptance for first source-native transcription.
 * Runs after the SHA-pinned extraction and esbuild syntax check.
 * Compares real rendered React DOM with original source HTML for static,
 * state-free primitives, and tests conditional and loop compilation.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import {pathToFileURL} from "node:url";
import * as React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {parseFragment} from "parse5";

const base="artifacts/source-component-blueprints/components/";
const filename="artifacts/source-native-transcription/renderable.mjs";
const modules=await import(pathToFileURL(process.cwd()+"/"+filename).href);

function structural(html){
 const nodes=[];
 const walk=(element)=>{
  if(element.tagName && element.tagName!=="link" && element.tagName!=="sc-if"){
   nodes.push(element.tagName);
  }
  for(const child of element.childNodes||[])walk(child);
  if(element.content)walk(element.content);
 };
 walk(parseFragment(html));
 return nodes;
}
function visibleText(html){
 const parts=[];
 const walk=node=>{
  if(node.nodeName==="#text"&&node.value.trim())parts.push(node.value.trim());
  for(const child of node.childNodes||[])walk(child);
  if(node.content)walk(node.content);
 };
 walk(parseFragment(html));
 return parts.join(" ").replace(/\s+/g," ").trim();
}
for(const [name,component] of [
 ["shell.footer","ApprovedShellFooter"],
 ["conversion.assessment-band","ApprovedConversionAssessmentBand"]
]){
 const original=fs.readFileSync(base+name+".html","utf8");
 const output=renderToStaticMarkup(React.createElement(modules[component],{scope:{}}));
 assert.deepEqual(structural(output),structural(original),name+" rendered DOM hierarchy diverges");
 assert.equal(visibleText(output),visibleText(original),name+" exact visible wording diverges");
 for(const essential of ["background","padding"]){
  if(original.includes(essential+":"))assert.ok(output.includes(essential+":"),name+" missing source property "+essential);
 }
 console.log("SOURCE STRUCTURE PASS",name,structural(output).length,"elements");
}
const person=renderToStaticMarkup(React.createElement(modules.ApprovedMarketingWhoWeWorkWith,{scope:{is_who:true}}));
assert.match(person,/We work best with businesses where/);
assert.match(person,/Take the Assessment/);
const absent=renderToStaticMarkup(React.createElement(modules.ApprovedMarketingWhoWeWorkWith,{scope:{is_who:false}}));
assert.ok(!absent.includes("We work best with businesses"),"Original sc-if false condition was ignored");
const nav=renderToStaticMarkup(React.createElement(modules.ApprovedShellHeader,{scope:{
 headShadow:"none",drawerX:"translateX(0)",drawerVis:"visible",menuOpenStr:"true",
 nav:[{label:"How We Work",current:"page",bg:"transparent",icon:"/brand/icons/route.svg",fg:"#1E272A",weight:"600",color:"#1E272A",op:1}]
}}));
assert.match(nav,/How We Work/,"Original sc-for navigation was not translated");
assert.match(nav,/aria-expanded="true"/,"Original binding did not reach HTML");
const srcMeta=JSON.parse(fs.readFileSync("artifacts/source-native-transcription/transcription-manifest.json","utf8"));
assert.equal(srcMeta.count,45);
assert.equal(srcMeta.functions.length,45);
assert.ok(srcMeta.hoverStates>=15,"Original authored hover styles were dropped");
console.log("SOURCE NATIVE FIRST-PASS STRUCTURE",srcMeta.count,"original components");
