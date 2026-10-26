import {useLoaderData} from "react-router";
import {ReactMarketing} from "../components/ReactMarketing";
import {isHumminPublicHost} from "../lib/seo.server";
import type {AppLoadContext} from "react-router";
const kinds=["home","how","core","eng","who","about"] as const;
type Kind=typeof kinds[number];
export async function loader({request,params}:{request:Request;params:{page?:string};context:AppLoadContext}){
 const host=new URL(request.url).hostname;
 // Do not replace or expose unfinished React routes on the approved public site.
 if(isHumminPublicHost(host)||!kinds.includes(params.page as Kind))
   throw new Response("Not found",{status:404});
 return {page:params.page as Kind};
}
export const meta=()=>[
 {title:"HUMMIN React design acceptance · internal staging"},
 {name:"robots",content:"noindex,nofollow"}
];
export default function ReactPage(){const {page}=useLoaderData<typeof loader>();return <ReactMarketing page={page}/>;}
