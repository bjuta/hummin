import type {HumminEnv} from "../../workers/app.ts";

export type PublicBlock={t:"p"|"h"|"ul"|"ol"|"dl"|"assess";text?:string;items?:string[];id?:string};
export type PublicInsight={
 slug:string;sourceSlug:string|null;title:string;excerpt:string;
 type:"guide"|"opinion"|"news";author:"team"|"muiruri";
 date:string;topics:string[];blocks:PublicBlock[];
};
const TOPICS=new Set(["Strategy","Technology","Marketing","Operations","Talent","Data","Specialist Partners"]);
const safeSlug=(s:unknown)=>typeof s==="string"&&s.length<=120&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
export function parsePublicInsight(data:unknown):PublicInsight|null{
 if(!data||typeof data!=="object")return null;
 const x=data as Record<string,unknown>;
 if(!safeSlug(x.slug)||typeof x.title!=="string"||!x.title.trim()||x.title.length>180||
  typeof x.excerpt!=="string"||x.excerpt.length>400||
  !["guide","opinion","news"].includes(String(x.type))||
  !["team","muiruri"].includes(String(x.author))||
  typeof x.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||
  !Array.isArray(x.topics)||x.topics.length>7||x.topics.some(y=>!TOPICS.has(y))||
  !Array.isArray(x.blocks)||x.blocks.length<1||x.blocks.length>100)return null;
 const blocks:PublicBlock[]=[];
 for(const raw of x.blocks){
  if(!raw||typeof raw!=="object")return null;
  const b=raw as Record<string,unknown>,t=b.t;
  if(t==="p"||t==="h"){
   if(typeof b.text!=="string"||b.text.length>8000)return null;
   blocks.push({t,text:b.text});
  }else if(t==="ul"||t==="ol"){
   if(!Array.isArray(b.items)||b.items.length>80||b.items.some(v=>typeof v!=="string"||v.length>2000))return null;
   blocks.push({t,items:b.items});
  }else if(t==="dl"){
   if(!["enquiry-log","monday-template"].includes(String(b.id)))return null;
   blocks.push({t,id:b.id as string});
  }else if(t==="assess")blocks.push({t:"assess"});
  else return null;
 }
 return {slug:x.slug as string,sourceSlug:safeSlug(x.sourceSlug)?x.sourceSlug as string:null,
  title:x.title as string,excerpt:x.excerpt as string,type:x.type as PublicInsight["type"],
  author:x.author as PublicInsight["author"],date:x.date as string,topics:x.topics as string[],blocks};
}
export function releaseFromEditor(value:{
 slug:string;sourceSlug:string|null;title:string;excerpt:string;type:string;author:string;
 topics:string[];blocks:{t:string;text:string}[];date:string;
}):PublicInsight|null{
 const body=value.blocks.map(b=>{
  if(b.t==="ul"||b.t==="ol")return {t:b.t,items:b.text.split("\n").map(s=>s.trim()).filter(Boolean)};
  if(b.t==="dl")return {t:"dl",id:b.text==="30-day enquiry log"?"enquiry-log":b.text==="Monday figures template"?"monday-template":"invalid"};
  if(b.t==="as")return {t:"assess"};
  return {t:b.t,text:b.text};
 });
 return parsePublicInsight({
  ...value,type:value.type.toLowerCase(),
  blocks:body
 });
}
export async function publishedInsights(env:HumminEnv):Promise<PublicInsight[]>{
 if(!env.DB)return [];
 const res=await env.DB.prepare("SELECT data_json FROM admin_insights_publications ORDER BY published_at DESC LIMIT 150").all<{data_json:string}>();
 const out:PublicInsight[]=[];
 for(const row of res.results||[]){
  try{const article=parsePublicInsight(JSON.parse(row.data_json));if(article)out.push(article);}
  catch{ /* malformed historical publication is never served */ }
 }
 return out;
}
export async function publicInsightBySlug(env:HumminEnv,slug:string):Promise<PublicInsight|null>{
 if(!safeSlug(slug)||!env.DB)return null;
 const row=await env.DB.prepare("SELECT data_json FROM admin_insights_publications WHERE slug=?").bind(slug).first<{data_json:string}>();
 if(!row)return null;
 try{return parsePublicInsight(JSON.parse(row.data_json));}catch{return null;}
}
