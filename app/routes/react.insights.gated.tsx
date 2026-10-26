import {ReactInsightsRoute} from "../components/ReactInsights";
import {loader as originalLoader} from "./fidelity";
import {loader as reactLoader} from "./react.insights.preview";
import {isHumminPublicHost} from "../lib/seo.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 const url=new URL(args.request.url);
 if(isHumminPublicHost(url.hostname))return originalLoader(args);
 // Reuse the same isolated React article and CMS loader while the
 // public site remains on the currently approved original runtime.
 const updated=new URL(args.request.url);
 updated.pathname="/__react"+updated.pathname;
 const request=new Request(updated.toString(),args.request);
 return reactLoader({request,context:args.context});
}
export const meta=()=>[{title:"HUMMIN Insights"},{name:"robots",content:"noindex,nofollow"}];
export default ReactInsightsRoute;
