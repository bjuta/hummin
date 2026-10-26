import {ReactContact} from "../components/ReactContact";
import {loader as originalLoader} from "./fidelity";
import {loader as contactLoader,action as contactAction} from "./contact";
import {isHumminPublicHost} from "../lib/seo.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 if(isHumminPublicHost(new URL(args.request.url).hostname))return originalLoader(args);
 return contactLoader(args);
}
export async function action(args:{request:Request;context:AppLoadContext}){return contactAction(args);}
export const meta=()=>[{title:"Contact HUMMIN · Discuss a Business Challenge"},{name:"robots",content:"noindex,nofollow"}];
export default ReactContact;
