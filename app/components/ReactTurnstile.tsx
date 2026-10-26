import {useEffect,useRef} from "react";
type TurnstileApi={
 render:(node:HTMLElement,options:Record<string,unknown>)=>string;
 remove:(id:string)=>void;
 reset:(id:string)=>void;
};
declare global {interface Window {turnstile?:TurnstileApi}}
/** Shared explicit-render challenge for client-routed React forms.
 * Tokens are single-use; remount with a new key for subsequent submissions.
 */
export function ReactTurnstile({siteKey,onToken}:{siteKey:string;onToken:(token:string)=>void}){
 const host=useRef<HTMLDivElement|null>(null);
 const cb=useRef(onToken);
 useEffect(()=>{cb.current=onToken},[onToken]);
 useEffect(()=>{
  if(!siteKey)return;
  let cancelled=false,id:string|undefined;
  const mount=()=>{
   if(cancelled||!host.current||!window.turnstile||id)return;
   id=window.turnstile.render(host.current,{
    sitekey:siteKey,theme:"light",size:"normal",
    callback:(token:string)=>cb.current(token),
    "expired-callback":()=>cb.current(""),
    "error-callback":()=>cb.current("")
   });
  };
  let script=document.getElementById("hummin-turnstile-loader") as HTMLScriptElement|null;
  if(!script){
   script=document.createElement("script");
   script.id="hummin-turnstile-loader";
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;script.defer=true;document.head.appendChild(script);
  }
  script.addEventListener("load",mount);
  const timer=window.setInterval(mount,250);
  mount();
  return ()=>{
   cancelled=true;
   window.clearInterval(timer);
   script?.removeEventListener("load",mount);
   if(id&&window.turnstile){try{window.turnstile.remove(id)}catch{}}
  };
 },[siteKey]);
 return <div className="hr-turnstile" ref={host} aria-label="Security verification" role="group"/>;
}
