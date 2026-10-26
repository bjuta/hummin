import {ReactContact} from "../components/ReactContact";
import {loader as contactLoader,action as contactAction} from "./contact";
import {isHumminPublicHost} from "../lib/seo.server";
import type {AppLoadContext} from "react-router";
const check=(request:Request)=>{if(isHumminPublicHost(new URL(request.url).hostname))throw new Response("Not found",{status:404});};
export async function loader(args:{request:Request;context:AppLoadContext}){check(args.request);return contactLoader(args);}
export async function action(args:{request:Request;context:AppLoadContext}){check(args.request);return contactAction(args);}
export const meta=()=>[{title:"Contact · HUMMIN React design acceptance"},{name:"robots",content:"noindex,nofollow"}];
export default ReactContact;
