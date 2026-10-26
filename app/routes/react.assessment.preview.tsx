import {ReactAssessment} from "../components/ReactAssessment";
import {isHumminPublicHost} from "../lib/seo.server";
export async function loader({request}:{request:Request}){
 if(isHumminPublicHost(new URL(request.url).hostname))throw new Response("Not found",{status:404});
 return null;
}
export const meta=()=>[{title:"HUMMIN Business Assessment · React acceptance"},{name:"robots",content:"noindex,nofollow"}];
export default ReactAssessment;
