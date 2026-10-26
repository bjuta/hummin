import {ReactContact} from "../components/ReactContact";
import {loader as originalLoader} from "./fidelity";
import {loader as contactLoader,action as contactAction} from "./contact";
import {isHumminPublicHost} from "../lib/seo.server";
import {PUBLIC_REACT_CUTOVER_APPROVED} from "../lib/react-cutover.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 if(isHumminPublicHost(new URL(args.request.url).hostname)&&!PUBLIC_REACT_CUTOVER_APPROVED)return originalLoader(args);
 return contactLoader(args);
}
export async function action(args:{request:Request;context:AppLoadContext}){return contactAction(args);}
export const meta=()=>[
 {title:"Contact HUMMIN · Discuss a Business Challenge"},
 {name:"description",content:"Tell HUMMIN about a challenge in your owner-led business."},
 {tagName:"link",rel:"canonical",href:"https://hummin.org/contact"}
];
export default ReactContact;
