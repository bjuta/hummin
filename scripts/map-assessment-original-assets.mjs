/** Exact approved Assessment media, including embedded original font faces. */
import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";
const dir="design/sources";
const parts=fs.readdirSync(dir).filter(n=>/^assessment\.\d+\.part$/.test(n)).sort().map(n=>fs.readFileSync(path.join(dir,n),"utf8")).join("");
const match=parts.match(/<script\s+type="__bundler\/manifest"[^>]*>([\s\S]*?)<\/script>/);
if(!match)throw Error("Original Assessment manifest missing");
const manifest=JSON.parse(match[1]);
const mapping=JSON.parse(fs.readFileSync("app/data/ApprovedSourceAssets.generated.json","utf8"));
const out="public/brand/source-resources";
fs.mkdirSync(out,{recursive:true});
for(const [id,file] of Object.entries(manifest)){
 if(!file?.mime?.match(/^(image|font)\//)||!file.data)continue;
 let bytes=Buffer.from(file.data,"base64");
 if(file.compressed)bytes=gunzipSync(bytes);
 const ext=file.mime==="font/woff2"?"woff2":file.mime==="image/svg+xml"?"svg":file.mime==="image/png"?"png":file.mime==="image/webp"?"webp":null;
 if(!ext)throw Error("Unknown approved Assessment media "+id+" "+file.mime);
 if(ext==="woff2"&&bytes.toString("ascii",0,4)!=="wOF2")throw Error("Invalid original font "+id);
 if(ext==="svg"&&(!bytes.toString("utf8",0,512).includes("<svg")||/<script\b/i.test(bytes.toString("utf8"))))throw Error("Invalid original SVG "+id);
 const full=path.join(out,id+"."+ext);
 if(fs.existsSync(full)&&!fs.readFileSync(full).equals(bytes))throw Error("Source media byte mismatch "+id);
 fs.writeFileSync(full,bytes);
 mapping[id]="/brand/source-resources/"+id+"."+ext;
}
const original=fs.readFileSync("app/components/approved-source-css/assessment-fonts.css","utf8");
const ids=[...original.matchAll(/url\(["']?([a-f0-9-]{36})["']?\)/gi)];
if(ids.length!==17)throw Error("Assessment source font count changed: "+ids.length);
const css=original.replace(/url\(["']?([a-f0-9-]{36})["']?\)/gi,(_whole,id)=>{
 if(!mapping[id]?.endsWith(".woff2"))throw Error("Missing original Assessment font "+id);
 return 'url("'+mapping[id]+'")';
});
fs.writeFileSync("app/components/ApprovedAssessmentFonts.runtime.css",css);
fs.writeFileSync("app/data/ApprovedSourceAssets.generated.json",JSON.stringify(mapping,null,2)+"\n");
console.log("ASSESSMENT MEDIA",Object.keys(manifest).length,"approved resources",ids.length,"original font references");
