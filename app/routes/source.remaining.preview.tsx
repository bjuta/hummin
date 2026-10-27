import {useParams} from "react-router";
import {isHumminPublicHost} from "../lib/seo.server";
import {SourceRemainingPreview} from "../components/SourceRemainingPreview";
import type {RemainingView} from "../components/SourceRemainingPreview";
const allowed=new Set(["assessment","insights","article","topic","author"]);
export async function loader({request,params}:{request:Request;params:Record<string,string|undefined>}){
 const hostname=new URL(request.url).hostname;
 if(isHumminPublicHost(hostname)||!allowed.has(params.view||""))
  throw new Response("Not found",{status:404,headers:{"X-Robots-Tag":"noindex, nofollow"}});
 return {view:params.view};
}
export const meta=()=>[{title:"Internal HUMMIN source verification"},{name:"robots",content:"noindex,nofollow"}];
export default function RemainingSourceRoute(){
 const {view}=useParams();
 return view&&allowed.has(view)?<SourceRemainingPreview view={view as RemainingView}/>:null;
}
