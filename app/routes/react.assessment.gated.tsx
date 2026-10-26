import {ReactAssessment} from "../components/ReactAssessment";
import {loader as originalLoader} from "./fidelity";
import {isHumminPublicHost} from "../lib/seo.server";
import {PUBLIC_REACT_CUTOVER_APPROVED} from "../lib/react-cutover.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 if(isHumminPublicHost(new URL(args.request.url).hostname)&&!PUBLIC_REACT_CUTOVER_APPROVED)return originalLoader(args);
 return null;
}
export const meta=()=>[
 {title:"HUMMIN Business Assessment"},
 {name:"description",content:"A practical assessment to understand what may be holding your business back."},
 {tagName:"link",rel:"canonical",href:"https://hummin.org/assessment"}
];
export default ReactAssessment;
