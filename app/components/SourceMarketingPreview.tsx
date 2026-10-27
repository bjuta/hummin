import * as React from "react";
import {useNavigate} from "react-router";
import {ApprovedSiteRoot} from "./ApprovedSourceTranscription.generated";
import sourceStates from "../data/ApprovedMarketingViewmodels.generated.json";
import sourceAssets from "../data/ApprovedSourceAssets.generated.json";
import type {SourceScope} from "./source-native-bridge";
import "./ApprovedSourceFonts.runtime.css";
import "./approved-source-css/site-base.css";
import "./ApprovedSourceHover.generated.css";
import "./ApprovedSourceActive.generated.css";

const pages=["home","how","core","eng","who","about","contact"] as const;
export type MarketingPage=typeof pages[number];
export const isMarketingPage=(value:string):value is MarketingPage=>
 (pages as readonly string[]).includes(value);
const paths:Record<string,string>={
 home:"home",how:"how",core:"core",eng:"eng",who:"who",about:"about",contact:"contact",
 assess:"assessment",insights:"insights"
};
type View=SourceScope & {nav?:SourceScope[];domains?:SourceScope[];posters?:SourceScope[];
 topics?:SourceScope[];valueTabs?:SourceScope[];tierTabs?:SourceScope[];
 tierCols?:SourceScope[];fields?:SourceScope[];pk?:SourceScope};
type Snapshot={
 pages:Record<string,View>;menu:Record<string,View>;core:View[];tier:View[];
 values:View[];topicPeek:View[];tierPeek:View[];floatOff:View;copied:View;sent:View;
};
const originals=sourceStates as unknown as Snapshot;
type Peek={kind:"topic"|"tier";index:number}|null;

/** Development-only assembly of the actual owner-approved outer source DOM.
 * All typography, markup and visuals originate in approved-source transcription.
 * The frontend never reads or executes the archived design template.
 */
export function SourceMarketingPreview({page,sourceImports}:{page:MarketingPage|"assess"|"insights";sourceImports?:Record<string,React.ComponentType>}){
 const navigate=useNavigate();
 const [menu,setMenu]=React.useState(false);
 const [core,setCore]=React.useState(0);
 const [tier,setTier]=React.useState(0);
 const [value,setValue]=React.useState(0);
 const [peek,setPeek]=React.useState<Peek>(null);
 const [dismissed,setDismissed]=React.useState(false);
 const [copied,setCopied]=React.useState(false);
 const [fields,setFields]=React.useState<Record<string,string>>({});
 const [notice,setNotice]=React.useState("");
 const [contactErrors,setContactErrors]=React.useState<Record<string,string>>({});
 const [contactSending,setContactSending]=React.useState(false);
 const root=React.useRef<HTMLDivElement>(null);
 const pageRef=React.useRef<HTMLDivElement>(null);
 const lastOpener=React.useRef<HTMLElement|null>(null);
 const hoverTimeout=React.useRef<ReturnType<typeof setTimeout>|null>(null);

 React.useEffect(()=>{setMenu(false);setPeek(null);setNotice("");},[page]);
 React.useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   if(peek)setPeek(null);
   else setMenu(false);
  };
  window.addEventListener("keydown",key);
  return ()=>window.removeEventListener("keydown",key);
 },[peek]);
 React.useEffect(()=>()=>{if(hoverTimeout.current)clearTimeout(hoverTimeout.current)},[]);

 const go=React.useCallback((target:string)=>{
  setMenu(false);
  setPeek(null);
  const path=paths[target]||target;
  const destination=isMarketingPage(path)?"/__source-preview/"+path:
   path==="assessment"?"/__source-review/assessment":
   path==="insights"?"/__source-review/insights":"/"+path;
  navigate(destination);
  window.scrollTo({top:0,behavior:"instant"});
 },[navigate]);
 const openPeek=(kind:"topic"|"tier",index:number)=>{
  lastOpener.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setPeek({kind,index});
 };
 const closePeek=(action?:()=>void)=>{
  setPeek(null);
  if(action)action();
  else queueMicrotask(()=>lastOpener.current?.focus());
 };
 const scrollShelf=(direction:-1|1,event:React.MouseEvent)=>{
  const container=(event.currentTarget as HTMLElement).closest("section")?.querySelector<HTMLElement>("[data-shelf]");
  container?.scrollBy({left:direction*Math.min(320,container.clientWidth*.8),behavior:"smooth"});
 };
 const tabs=(current:number,total:number,set:(index:number)=>void,event:React.KeyboardEvent)=>{
  const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,Home:-current,End:total-1-current};
  const offset=offsets[event.key];
  if(offset===undefined)return;
  event.preventDefault();
  set((current+offset+total)%total);
 };

 let base:View=originals.pages[page];
 if(page==="core")base=originals.core[core];
 if(page==="eng")base=originals.tier[tier];
 if(page==="about")base=originals.values[value];
 const scope:View={...base,__assets:sourceAssets,__imports:sourceImports||{},root,pageRef};
 if(menu){
  const open=originals.menu[page];
  for(const key of ["menuClosed","menuOpenBool","menuAria","menuOpenStr","drawerX","drawerVis",
    "scrimOpacity","scrimEvents","icoMenuOp","icoXOp","icoMenuTf","icoXTf"])scope[key]=open[key];
 }
 if(dismissed)scope.show_float=false;
 if(copied)for(const key of ["copyLabel","copyBg","copyStatus"])scope[key]=originals.copied[key];
 if(peek){
  const state=peek.kind==="topic"?originals.topicPeek[peek.index]:originals.tierPeek[peek.index];
  for(const key of ["pk","peekVis","peekEvents","peekOp","peekTf","peekHidden"])scope[key]=state[key];
 }
 for(const target of [...pages,"assess","insights"])scope["go_"+target]=()=>go(target);
 scope.goPage=go;
 scope.allInsights=()=>go("insights");
 scope.toggleMenu=()=>setMenu(current=>!current);
 scope.hoverOpen=()=>{
  if(!window.matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  if(hoverTimeout.current)clearTimeout(hoverTimeout.current);
  setMenu(true);
 };
 scope.hoverLeave=()=>{
  if(!window.matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  if(hoverTimeout.current)clearTimeout(hoverTimeout.current);
  hoverTimeout.current=setTimeout(()=>setMenu(false),280);
 };
 scope.closeMenu=()=>setMenu(false);
 scope.skipToMain=(event:React.MouseEvent)=>{event.preventDefault();document.getElementById("main")?.focus();};
 scope.dismissFloat=()=>setDismissed(true);
 scope.shelfPrev=(event:React.MouseEvent)=>scrollShelf(-1,event);
 scope.shelfNext=(event:React.MouseEvent)=>scrollShelf(1,event);
 scope.tierKeys=(event:React.KeyboardEvent)=>tabs(tier,3,setTier,event);
 scope.valKeys=(event:React.KeyboardEvent)=>tabs(value,6,setValue,event);
 scope.tierCtaGo=()=>go("contact");
 scope.copyEmail=()=>{
  void navigator.clipboard?.writeText("sales@hummin.org");
  setCopied(true);
 };
 scope.closePeek=()=>closePeek();
 scope.peekKeys=(event:React.KeyboardEvent)=>{
  if(event.key!=="Tab")return;
  const focusables=(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("button");
  if(!focusables.length)return;
  const first=focusables[0],last=focusables[focusables.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 };
 scope.nav=(base.nav||[]).map((entry,i)=>({...entry,onClick:()=>go(
  ["home","how","core","eng","who","assess","about","insights","contact"][i])}));
 scope.domains=(base.domains||[]).map((d,i)=>({...d,pick:()=>setCore(i)}));
 scope.valueTabs=(base.valueTabs||[]).map((d,i)=>({...d,onClick:()=>setValue(i)}));
 scope.tierTabs=(base.tierTabs||[]).map((d,i)=>({...d,onClick:()=>setTier(i)}));
 scope.tierCols=(base.tierCols||[]).map((d,i)=>({...d,onClick:()=>setTier(i)}));
 scope.posters=(base.posters||[]).map((d,i)=>({...d,peek:()=>openPeek("tier",i)}));
 scope.topics=(base.topics||[]).map((d,i)=>({...d,onClick:()=>openPeek("topic",i)}));
 scope.peekTier0=()=>openPeek("tier",0);
 scope.peekTier1=()=>openPeek("tier",1);
 scope.peekTier2=()=>openPeek("tier",2);
 scope.pk={...(scope.pk||{}),
  primary:()=>closePeek(()=>go("contact")),
  secondary:()=>closePeek(()=>go(peek?.kind==="topic"?"core":"eng"))};
 scope.fields=(base.fields||[]).map(d=>({
  ...d,
  value:fields[String(d.k)]??d.value,
  err:contactErrors[String(d.k)]||"",
  inv:String(!!contactErrors[String(d.k)]),
  bd:contactErrors[String(d.k)]?"#B5532C":d.bd,
  onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
   const value=event.currentTarget.value,key=String(d.k);
   setFields(old=>({...old,[key]:value}));
   setContactErrors(old=>({...old,[key]:""}));
  }
 }));
 if(page==="contact"){
  scope.sent=false;
  scope.not_sent=true;
  scope.sending=contactSending;
  scope.sendingStr=String(contactSending);
  scope.sendLabel=contactSending?"Checking…":"Send Enquiry";
  scope.sendOp=contactSending?0.6:1;
  scope.contactStatus=notice;
 }
 scope.submit=async (event:React.MouseEvent)=>{
  event?.preventDefault?.();
  if(page!=="contact"||contactSending)return;
  const name=(fields.name||"").trim(),biz=(fields.biz||"").trim(),
   email=(fields.email||"").trim(),msg=(fields.msg||"").trim();
  const errors:Record<string,string>={};
  if(name.length<2||name.length>120)errors.name="Enter your name.";
  if(biz.length<2||biz.length>160)errors.biz="Enter your business name.";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)
   errors.email="Enter a valid work email.";
  if(msg.length<10||msg.length>4000)
   errors.msg="Please describe the challenge in at least 10 characters.";
  if(Object.keys(errors).length){
   setContactErrors(errors);
   setNotice("Please check the highlighted fields.");
   return;
  }
  setContactErrors({});
  setContactSending(true);
  setNotice("");
  try{
   const form=new FormData();
   form.set("name",name);
   form.set("businessName",biz);
   form.set("email",email);
   form.set("message",msg);
   form.set("website","");
   const response=await fetch("/__source-verify/contact",{
    method:"POST",body:form,credentials:"same-origin",
    headers:{"Accept":"application/json"}
   });
   const result=await response.json() as {ok?:boolean;delivered?:boolean;message?:string};
   if(result.delivered)throw Error("Unexpected delivery from isolated Preview");
   setNotice(result.message||"Validation unavailable.");
  }catch{
   setNotice("Preview validation is unavailable. No enquiry was sent.");
  }finally{
   setContactSending(false);
  }
 };
 scope.reset=()=>{
  setFields({});setContactErrors({});setContactSending(false);setNotice("");
 }; return <><ApprovedSiteRoot scope={scope}/>{notice&&
   <div role="status" style={{position:"fixed",bottom:12,right:12,padding:"12px 16px",
     background:"#1E272A",color:"#F4F5F1",zIndex:100,borderRadius:8,maxWidth:350}}>
     {notice}
   </div>}</>;
}
