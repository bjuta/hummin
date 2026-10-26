import {ReactAssessment} from "../components/ReactAssessment";
import {loader as originalLoader} from "./fidelity";
import {isHumminPublicHost} from "../lib/seo.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 if(isHumminPublicHost(new URL(args.request.url).hostname))return originalLoader(args);
 return null;
}
export const meta=()=>[{title:"HUMMIN Business Assessment"},{name:"robots",content:"noindex,nofollow"}];
export default ReactAssessment;
