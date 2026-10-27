import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {parse} from "parse5";
const dir="design/sources";
const parts=name=>fs.readdirSync(dir).filter(x=>x.startsWith(name+".")&&x.endsWith(".part")).sort().map(x=>fs.readFileSync(path.join(dir,x),"utf8")).join("");
const a=parts("assessment"),ins=gunzipSync(Buffer.from(fs.readFileSync(path.join(dir,"insights-v4.html.gz.b64"),"utf8").replace(/\s/g,""),"base64")).toString("utf8");
const docs={assessment:JSON.parse(a.match(/<script\s+type="__bundler\/template"[^>]*>([\s\S]*?)<\/script>/)[1]),insights:ins};
for(const [key,html] of Object.entries(docs)){
 const tree=parse(html,{sourceCodeLocationInfo:true});
 const xc=[];
 const find=node=>{if(node.tagName==="x-dc")for(const c of node.childNodes||[])xc.push({tag:c.tagName,first:c.sourceCodeLocation?.startOffset,end:c.sourceCodeLocation?.endOffset,attrs:c.attrs?.map(a=>a.name+"="+a.value.slice(0,100))});for(const x of node.childNodes||[])find(x);};
 find(tree);
 const script=html.match(/<script\s+type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1]||"";
 const state=script.match(/state\s*=\s*\{.{0,550}/)?.[0]||"";
 const render=script.indexOf("renderVals()");
 const manifest=key==="assessment"?JSON.parse(a.match(/<script\s+type="__bundler\/manifest"[^>]*>([\s\S]*?)<\/script>/)?.[1]||"{}"):{};
 const ids=[...new Set([...html.matchAll(/(?:src|href|url\()["']?([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/ig)].map(x=>x[1]))];
 const fonts=[...new Set([...html.matchAll(/url\(["']?([a-f0-9-]{36})/g)].map(x=>x[1]))];
 console.log("SOURCE-DOC",key,JSON.stringify({bytes:html.length,root:xc.slice(0,20),scripts:script.length,state,renderContext:script.slice(render,render+1500),manifestCount:Object.keys(manifest).length,missingIds:ids.filter(id=>!manifest[id]).slice(0,15),ids:ids.slice(0,25),fonts:fonts.length}));
}
