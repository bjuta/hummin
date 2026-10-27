import {useParams} from "react-router";
import {isHumminPublicHost} from "../lib/seo.server";
import {SourceLegalPreview} from "../components/SourceLegalPreview";
const docs=new Set(["privacy","terms"]);
export async function loader({request,params}:{request:Request;params:Record<string,string|undefined>}){
 const hostname=new URL(request.url).hostname;
 if(isHumminPublicHost(hostname)||!docs.has(params.document||""))
  throw new Response("Not found",{status:404,headers:{"X-Robots-Tag":"noindex, nofollow"}});
 return {document:params.document};
}
export const links=()=>[
 {rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Figtree:wght@400;500;600;700&display=swap"}
];
export const meta=()=>[{title:"Internal HUMMIN owner-source legal preview"},{name:"robots",content:"noindex,nofollow"}];
export default function LegalSourceRoute(){
 const document=useParams().document||"";
 return document==="privacy"||document==="terms"?<SourceLegalPreview document={document}/>:null;
}
