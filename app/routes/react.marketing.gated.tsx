import {useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {ReactMarketing} from "../components/ReactMarketing";
import {loader as originalLoader} from "./fidelity";
import {isHumminPublicHost} from "../lib/seo.server";
import {HEADS} from "../lib/react-site-content";
import {PUBLIC_REACT_CUTOVER_APPROVED} from "../lib/react-cutover.server";

const routes={"/":"home","/how-we-work":"how","/applied-expertise":"core","/engagements":"eng","/who-we-work-with":"who","/about":"about"} as const;
type Kind=typeof routes[keyof typeof routes];
export async function loader(args:{request:Request;context:AppLoadContext}){
 const url=new URL(args.request.url);
 if(isHumminPublicHost(url.hostname)&&!PUBLIC_REACT_CUTOVER_APPROVED)return originalLoader(args);
 const kind=routes[url.pathname as keyof typeof routes];
 if(!kind)throw new Response("Not found",{status:404});
 return {kind};
}
export const meta=({location}:{location:{pathname:string}})=>{
 const kind=routes[location.pathname as keyof typeof routes];
 const head=kind&&kind!=="home"?HEADS[kind]:null;
 return [
  {title:head?head.label+" | HUMMIN":"HUMMIN | Embedded Advisory and Execution"},
  {name:"description",content:head?head.lead:"Embedded advisory and execution for established owner-led businesses."},
  {tagName:"link",rel:"canonical",href:"https://hummin.org"+location.pathname}
 ];
};
export default function Marketing(){const result=useLoaderData<typeof loader>() as {kind:Kind};return <ReactMarketing page={result.kind}/>;}
