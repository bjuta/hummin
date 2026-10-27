import {useParams} from "react-router";
import {isHumminPublicHost} from "../lib/seo.server";
import {isMarketingPage,SourceMarketingPreview} from "../components/SourceMarketingPreview";
import type {AppLoadContext} from "react-router";

/** Internal-only source-grounded interface. Production domain always rejects it. */
export async function loader({request,params}:{request:Request;params:Record<string,string|undefined>;context:AppLoadContext}){
 const {hostname}=new URL(request.url);
 if(isHumminPublicHost(hostname)||!isMarketingPage(params.page||""))
  throw new Response("Not found",{status:404,headers:{"X-Robots-Tag":"noindex, nofollow"}});
 return {page:params.page};
}
export const meta=()=>[
 {title:"Internal source verification · HUMMIN"},
 {name:"robots",content:"noindex,nofollow"}
];
export default function SourceMarketingRoute(){
 const page=useParams().page||"";
 return isMarketingPage(page)?<SourceMarketingPreview page={page}/>:null;
}
