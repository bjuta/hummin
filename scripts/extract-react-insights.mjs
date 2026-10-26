/** Extract owner-authored HUMMIN Insights article bodies as JSON, never
 * executable runtime HTML. Only a literal data array is interpreted in a
 * time-limited isolated VM during build. No legacy scripts ship to browsers.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import vm from "node:vm";
const dir="design/sources";
const files=fs.readdirSync(dir).filter(s=>/^site-v4\.manifest\.\d+\.part$/.test(s)).sort();
if(files.length!==7)throw Error("Original manifest not complete");
const bundle=JSON.parse(files.map(p=>fs.readFileSync(path.join(dir,p),"utf8")).join(""));
const art=bundle["cc88240e-e27d-4718-b37a-5fab22025705"];
if(!art?.data)throw Error("Original HUMMIN Insights reference missing");
const raw=zlib.gunzipSync(Buffer.from(art.data,"base64")).toString("utf8");
const marker="const POSTS = [";
const pos=raw.indexOf(marker);
if(pos<0)throw Error("Original HUMMIN Insight POSTS array not found");
const start=pos+marker.length-1;
let depth=0,quote=null,escaped=false,end=-1;
for(let i=start;i<raw.length;i++){
 const ch=raw[i];
 if(quote){if(escaped){escaped=false;continue;}if(ch==="\\"){escaped=true;continue;}if(ch===quote)quote=null;continue;}
 if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue;}
 if(ch==="[")depth++;
 if(ch==="]"){depth--;if(depth===0){end=i+1;break;}}
}
if(end<0)throw Error("Unterminated original Insights data array");
const literal=raw.slice(start,end);
console.log("INSIGHTS POSTS STRUCTURE",literal.slice(0,2450));
const posts=vm.runInNewContext("("+literal+")",Object.create(null),{timeout:500});
if(!Array.isArray(posts)||posts.length<4)throw Error("Original Insights posts not parsed");
const data=posts.map(p=>{
 if(typeof p.slug!=="string"||typeof p.title!=="string"||!Array.isArray(p.blocks))throw Error("Malformed HUMMIN post");
 return JSON.parse(JSON.stringify(p));
});
fs.mkdirSync("app/lib",{recursive:true});
fs.writeFileSync("app/lib/react-original-insights.json",JSON.stringify(data,null,2)+"\n");
console.log("Extracted",data.length,"owner-designed Insights articles with source-authored blocks:",data.map(x=>[x.slug,x.blocks.length]));
