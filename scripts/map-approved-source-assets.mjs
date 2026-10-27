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
if(missing.length)throw Error("Unmatched original site media: "+missing.join(", "));
fs.mkdirSync("artifacts/source-native-transcription",{recursive:true});
fs.writeFileSync("artifacts/source-native-transcription/asset-map.json",JSON.stringify(mappings,null,2)+"\n");
console.log("APPROVED ASSET MAP",imageIds.length,"site media ids",Object.keys(mappings).length,"exactly matched assets");
