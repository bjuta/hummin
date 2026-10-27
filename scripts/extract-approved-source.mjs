import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {parse} from "parse5";

const sourceDir="design/sources",outDir="artifacts/approved-source-extraction";
const parts=prefix=>fs.readdirSync(sourceDir).filter(p=>p.startsWith(prefix+".")&&p.endsWith(".part")).sort().map(p=>fs.readFileSync(path.join(sourceDir,p),"utf8")).join("");
const bundled=raw=>{
 const match=raw.match(/<script\s+type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/);
 if(!match)throw Error("Source template missing");
 return JSON.parse(match[1].trim());
};
const documents={
 site:JSON.parse(fs.readFileSync(path.join(sourceDir,"site-v4.template.json"),"utf8")),
 assessment:bundled(parts("assessment")),
 insights:bundled(gunzipSync(Buffer.from(fs.readFileSync(path.join(sourceDir,"insights-v4.html.gz.b64"),"utf8").replace(/\s/g,""),"base64")).toString("utf8"))
};
const major=new Set(["header","nav","main","section","article","aside","footer","form","template","dc-import","dc-component","x-dc","sc-for","sc-if","style"]);
const summary={};
fs.mkdirSync(outDir,{recursive:true});
for(const [name,html] of Object.entries(documents)){
 const folder=path.join(outDir,name);
 fs.mkdirSync(path.join(folder,"components"),{recursive:true});
 fs.mkdirSync(path.join(folder,"styles"),{recursive:true});
 const document=parse(html,{sourceCodeLocationInfo:true});
 const nodes=[],components=[],css=[];
 const visit=(node,parentIndex=null)=>{
  const tag=node.tagName,loc=node.sourceCodeLocation;
  const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
  let index=parentIndex;
  if(tag&&loc?.startOffset!==undefined&&loc?.endOffset!==undefined){
   index=nodes.length;
   const record={index,tag,parentIndex,attrs,startLine:loc.startLine,endLine:loc.endLine,startOffset:loc.startOffset,endOffset:loc.endOffset};
   nodes.push(record);
   if(major.has(tag)){
    const id=String(index).padStart(4,"0");
    const filename="components/"+id+"-"+tag+".html";
    fs.writeFileSync(path.join(folder,filename),html.slice(loc.startOffset,loc.endOffset));
    components.push({...record,file:filename});
    if(tag==="style"&&loc.startTag&&loc.endTag){
     const styleFile="styles/"+id+".css";
     fs.writeFileSync(path.join(folder,styleFile),html.slice(loc.startTag.endOffset,loc.endTag.startOffset));
     css.push({index,file:styleFile});
    }
   }
  }
  for(const child of node.childNodes||[])visit(child,index);
  if(node.content)visit(node.content,index);
 };
 visit(document);
 fs.writeFileSync(path.join(folder,"original.html"),html);
 fs.writeFileSync(path.join(folder,"structure.json"),JSON.stringify({name,nodes,components,css},null,2));
 summary[name]={sourceCharacters:html.length,elementCount:nodes.length,structuralComponents:components.length,styleBlocks:css.length,designRuntimeNodes:nodes.filter(n=>n.tag.startsWith("dc-")||n.tag.startsWith("sc-")).length};
 console.log("SOURCE EXTRACTION",name,JSON.stringify(summary[name]));
}
fs.writeFileSync(path.join(outDir,"summary.json"),JSON.stringify(summary,null,2));
fs.writeFileSync(path.join(outDir,"README.md"),"# HUMMIN approved-source component extraction\n\nThese files are original, unmodified source substrings. The inventory preserves ancestor indices, exact attributes, original positions, original CSS and template directives. This is not a reconstructed React application. Source design runtime directives require explicit interpretation before a new implementation.\n");
