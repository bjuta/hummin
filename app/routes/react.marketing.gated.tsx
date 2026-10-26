import {useLoaderData} from "react-router";
import type {AppLoadContext} from "react-router";
import {ReactMarketing} from "../components/ReactMarketing";
import {loader as originalLoader} from "./fidelity";
import {isHumminPublicHost} from "../lib/seo.server";

const routes={"/":"home","/how-we-work":"how","/applied-expertise":"core","/engagements":"eng","/who-we-work-with":"who","/about":"about"} as const;
type Kind=typeof routes[keyof typeof routes];
export async function loader(args:{request:Request;context:AppLoadContext}){
 const url=new URL(args.request.url);
 if(isHumminPublicHost(url.hostname))return originalLoader(args);
 const kind=routes[url.pathname as keyof typeof routes];
 if(!kind)throw new Response("Not found",{status:404});
 return {kind};
}
export const meta=()=>[{title:"HUMMIN | Embedded Advisory and Execution"},{name:"robots",content:"noindex,nofollow"}];
export default function Marketing(){const result=useLoaderData<typeof loader>() as {kind:Kind};return <ReactMarketing page={result.kind}/>;}
