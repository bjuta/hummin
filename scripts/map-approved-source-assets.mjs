/** Exact vendor-asset mapping from source manifest to checked-in public media.
 * Never guesses filenames from UUIDs. Fails if an author-approved image
 * cannot be matched byte-for-byte against standalone public files.
 */
import fs from "node:fs";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {createHash} from "node:crypto";
const dir="design/sources";
const parts=fs.readdirSync(dir).filter(f=>/^site-v4\.manifest\.\d+\.part$/.test(f)).sort();
if(parts.length!==7)throw Error("Expected seven original media manifest parts");
const manifest=JSON.parse(parts.map(p=>fs.readFileSync(path.join(dir,p),"utf8")).join(""));
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");
const approved=new Map();
function walk(dir){
 for(const name of fs.readdirSync(dir)){
  const full=path.join(dir,name),stat=fs.statSync(full);
  if(stat.isDirectory())walk(full);
  else if(/\.(?:svg|webp|png|jpg|jpeg|woff2)$/i.test(name)){
   const url="/"+full.replace(/^public\//,"").split(path.sep).join("/");
   const digest=hash(fs.readFileSync(full));
   if(!approved.has(digest))approved.set(digest,[]);
   approved.get(digest).push(url);
  }
 }
}
walk("public/brand");
const mappings={};
for(const [id,item] of Object.entries(manifest)){
 if(!item?.data||!(item.mime||"").match(/^(image|font)\//))continue;
 let bytes=Buffer.from(item.data,"base64");
 if(item.compressed)bytes=gunzipSync(bytes);
 const matches=approved.get(hash(bytes));
 if(matches?.length)mappings[id]=matches.sort((a,b)=>a.length-b.length||a.localeCompare(b))[0];
}
const html=JSON.parse(fs.readFileSync("design/sources/site-v4.template.json","utf8"));
const ids=[...new Set([...html.matchAll(/(?:src|href)="([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})"/gi)].map(m=>m[1]))];
const imageIds=ids.filter(id=>manifest[id]?.mime?.startsWith("image/"));
const missing=imageIds.filter(id=>!mappings[id]);
for(const id of missing){
 const item=manifest[id];
 if(item?.mime!=="image/svg+xml")throw Error("No source-faithful asset for "+id);
 let bytes=Buffer.from(item.data,"base64");
 if(item.compressed)bytes=gunzipSync(bytes);
 if(!bytes.toString("utf8",0,512).includes("<svg")||/<script\b/i.test(bytes.toString("utf8")))
  throw Error("Unsafe original SVG asset "+id);
 const dir="public/brand/source-resources";
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,id+".svg"),bytes);
 mappings[id]="/brand/source-resources/"+id+".svg";
}

const referencedFonts=[...new Set([...html.matchAll(/url\(["']?([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})["']?\)/gi)].map(m=>m[1]))];
for(const id of referencedFonts){
 if(mappings[id])continue;
 const item=manifest[id];
 if(item?.mime!=="font/woff2")throw Error("No approved source font "+id);
 let bytes=Buffer.from(item.data,"base64");
 if(item.compressed)bytes=gunzipSync(bytes);
 if(bytes.toString("ascii",0,4)!=="wOF2")throw Error("Invalid original font "+id);
 const dir="public/brand/source-resources";
 fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,id+".woff2"),bytes);
 mappings[id]="/brand/source-resources/"+id+".woff2";
}
const originalFontCss=fs.readFileSync("app/components/approved-source-css/site-fonts.css","utf8");
const deployedFontCss=originalFontCss.replace(/url\(["']?([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})["']?\)/gi,(_match,id)=>{
 if(!mappings[id])throw Error("Unmapped source font CSS "+id);
 return 'url("'+mappings[id]+'")';
});
const originalFaces=[...originalFontCss.matchAll(/url\\(["']?([a-f0-9-]{36})["']?\\)/gi)];
if(originalFaces.length!==17)throw Error("Expected exactly 17 original font-face URLs, found "+originalFaces.length);
if([...deployedFontCss.matchAll(/url\\(["']?[a-f0-9-]{36}["']?\\)/gi)].length)
 throw Error("Unresolved original font resource IDs remained in runtime CSS");
fs.writeFileSync("app/components/ApprovedSourceFonts.runtime.css",deployedFontCss);

fs.mkdirSync("artifacts/source-native-transcription",{recursive:true});
fs.writeFileSync("artifacts/source-native-transcription/asset-map.json",JSON.stringify(mappings,null,2)+"\n");
console.log("APPROVED ASSET MAP",imageIds.length,"site images",referencedFonts.length,"source fonts",Object.keys(mappings).length,"byte-matched resources");
