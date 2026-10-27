import * as React from "react";

/** Binding-only helpers for source-transcribed React elements.
 * The original design runtime is not imported or executed.
 */
export type SourceScope = Record<string, unknown>;

export function sourceRead(scope:SourceScope, path:string):unknown {
 const key=path.trim();
 if(key==="true") return true;
 if(key==="false") return false;
 if(key==="null") return null;
 if(key==="[]") return [];
 if(/^[0-9]+$/.test(key)) return Number(key);
 return key.split(".").reduce<unknown>((value,segment)=>
  value&&typeof value==="object"?(value as SourceScope)[segment]:undefined,scope);
}
export const sourceTruthy=(value:unknown):boolean=>Boolean(value)&&value!=="false";
export const sourceItems=(value:unknown):unknown[]=>Array.isArray(value)?value:[];
export function sourceInvoke(handler:unknown,event:unknown):void {
 if(typeof handler==="function")(handler as (event:unknown)=>void)(event);
}
export function sourceAsset(scope:SourceScope,original:unknown):string {
 const key=String(original??"");
 const assets=scope.__assets;
 if(assets&&typeof assets==="object"&&(assets as SourceScope)[key])
  return String((assets as SourceScope)[key]);
 return key;
}
export function SourceImageSlot({id,source,shape,radius,scope}:{
 id:string;source:string;shape:string;radius:string;scope:SourceScope
}){
 const slots=scope.__slots;
 const mapped=slots&&typeof slots==="object"?(slots as SourceScope)[id]:undefined;
 const src=sourceAsset(scope,mapped??source);
 return React.createElement("img",{
  src,alt:"",loading:"lazy",
  style:{display:"block",width:"100%",height:"100%",objectFit:"cover",
   borderRadius:shape==="rounded"?(Number(radius)||20)+"px":undefined}
 });
}
export function SourceImport({name,scope}:{name:string;scope:SourceScope}){
 const imports=scope.__imports;
 const component=imports&&typeof imports==="object"?(imports as SourceScope)[name]:undefined;
 return typeof component==="function"?
  React.createElement(component as React.ComponentType):null;
}
