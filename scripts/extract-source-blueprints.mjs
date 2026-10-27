/** SHA-pinned, byte-exact HUMMIN source component extraction.
 * Requires catalog-approved-source.mjs first. No React code or invented CSS.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
const root="artifacts/source-component-catalog";
const out="artifacts/source-component-blueprints";
const registry=fs.readFileSync("design/source-components.registry","utf8").trim().split("\n").map(x=>x.split("|"));
if(registry.length!==45)throw Error("Expected 45 source component definitions");
const data={};
for(const source of ["site","assessment","insights"]){
 const dir=path.join(root,source);
 data[source]={...JSON.parse(fs.readFileSync(path.join(dir,"inventory.json"),"utf8")),
  original:fs.readFileSync(path.join(dir,"original.html"),"utf8")};
}
fs.mkdirSync(path.join(out,"components"),{recursive:true});
const components=[];
for(const [name,source,num,tag,prefix] of registry){
 const catalog=data[source],id=Number(num),node=catalog?.elements[id];
 if(!node||node.id!==id||node.tag!==tag||node.startOffset==null||node.endOffset==null)
  throw Error("Original source boundary changed: "+name);
 const exact=catalog.original.slice(node.startOffset,node.endOffset);
 const checksum=createHash("sha256").update(exact).digest("hex");
 if(!checksum.startsWith(prefix))throw Error("Original source fragment changed: "+name);
 const file="components/"+name+".html";
 fs.writeFileSync(path.join(out,file),exact);
 const descendants=catalog.elements.filter(n=>n.startOffset>=node.startOffset&&n.endOffset<=node.endOffset);
 const expressions=[...new Set(Array.from(exact.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g),m=>m[1].trim()))].sort();
 const handlers=descendants.flatMap(n=>Object.entries(n.attrs)
  .filter(([key])=>/^(sc-camel-on-|on[a-z]|style-active)/i.test(key))
  .map(([key,value])=>({node:n.id,key,value})));
 const inlineStyles=descendants.filter(n=>typeof n.attrs.style==="string")
  .map(n=>({node:n.id,style:n.attrs.style}));
 const runtime=descendants.filter(n=>n.tag.startsWith("sc-")||n.tag.startsWith("dc-"))
  .map(n=>({node:n.id,tag:n.tag,attrs:n.attrs}));
 components.push({name,source,nodeId:id,tag,file,sha256:checksum,
  sourceLocation:{startLine:node.startLine,endLine:node.endLine,
   startOffset:node.startOffset,endOffset:node.endOffset},
  rootAttributes:node.attrs,dynamicExpressions:expressions,handlers,inlineStyles,
  designRuntimeNodes:runtime});
}
const summary={count:components.length,sources:Object.fromEntries(["site","assessment","insights"]
 .map(s=>[s,components.filter(c=>c.source===s).length])),
 status:"source-extracted-only",reactComponentsCreated:0};
fs.writeFileSync(path.join(out,"manifest.json"),JSON.stringify({summary,components},null,2));
fs.writeFileSync(path.join(out,"README.md"),
 "# HUMMIN source-faithful component blueprints\n\n45 named, SHA-256-pinned original HTML components. Markup, inline styles, bindings and runtime directives are preserved unchanged. Definitions intentionally overlap where source components nest. No new React presentation has been created.\n");
console.log("SOURCE PRIMITIVE EXTRACTION",JSON.stringify(summary));