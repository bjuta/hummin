import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {parse} from "parse5";

const dir="design/sources";
const output="artifacts/source-component-catalog";
const joined=(name)=>fs.readdirSync(dir).filter(f=>f.startsWith(name+".")&&f.endsWith(".part")).sort().map(f=>fs.readFileSync(path.join(dir,f),"utf8")).join("");
const fromBundle=text=>{
 const x=text.match(/<script\s+type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/);
 if(!x)throw Error("Assessment bundle lacks its source template");
 return JSON.parse(x[1].trim());
};
const originals={
 site:JSON.parse(fs.readFileSync(path.join(dir,"site-v4.template.json"),"utf8")),
 assessment:fromBundle(joined("assessment")),
 insights:gunzipSync(Buffer.from(fs.readFileSync(path.join(dir,"insights-v4.html.gz.b64"),"utf8").replace(/\s/g,""),"base64")).toString("utf8")
};
const structural=new Set(["header","nav","main","section","article","aside","footer","form","dc-import","sc-if","sc-for","style","template","h1","h2","h3"]);
fs.mkdirSync(output,{recursive:true});
const summary={};
for(const [name,html] of Object.entries(originals)){
 const root=path.join(output,name);
 fs.mkdirSync(path.join(root,"fragments"),{recursive:true});
 fs.mkdirSync(path.join(root,"css"),{recursive:true});
 const doc=parse(html,{sourceCodeLocationInfo:true});
 const inventory=[],fragments=[],styles=[];
 const visit=(node,parent=null)=>{
  const tag=node.tagName,loc=node.sourceCodeLocation;
  let id=parent;
  if(tag&&loc?.startOffset!==undefined){
   id=inventory.length;
   const props=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
   const row={id,parent,tag,attrs:props,startLine:loc.startLine,endLine:loc.endLine,startOffset:loc.startOffset,endOffset:loc.endOffset};
   inventory.push(row);
   if(structural.has(tag)&&loc.endOffset!==undefined){
    const filename="fragments/"+String(id).padStart(4,"0")+"-"+tag+".html";
    fs.writeFileSync(path.join(root,filename),html.slice(loc.startOffset,loc.endOffset));
    fragments.push({id,file:filename});
    if(tag==="style"&&loc.startTag&&loc.endTag){
     const css="css/"+String(id).padStart(4,"0")+".css";
     fs.writeFileSync(path.join(root,css),html.slice(loc.startTag.endOffset,loc.endTag.startOffset));
     styles.push({id,file:css});
    }
   }
  }
  for(const child of node.childNodes||[])visit(child,id);
  if(node.content)visit(node.content,id);
 };
 visit(doc);
 fs.writeFileSync(path.join(root,"original.html"),html);
 fs.writeFileSync(path.join(root,"inventory.json"),JSON.stringify({source:name,elements:inventory,fragments,styles},null,2));
 const byTag={};
 for(const el of inventory)byTag[el.tag]=(byTag[el.tag]||0)+1;
 summary[name]={characters:html.length,elements:inventory.length,verbatimFragments:fragments.length,styleBlocks:styles.length,tags:byTag};
 console.log("APPROVED SOURCE",name,JSON.stringify(summary[name]));
}
fs.writeFileSync(path.join(output,"summary.json"),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(output,"README.md"),"Verbatim owner-approved source extraction. HTML and CSS fragments are byte-exact slices; inventory preserves complete original attributes, parent references and source offsets. sc-* and dc-* runtime directives are preserved, not converted to React.\n");
