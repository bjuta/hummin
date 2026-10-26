import {ReactInsightsRoute} from "../components/ReactInsights";
import {loader as originalLoader} from "./fidelity";
import {loadReactInsights} from "./react.insights.preview";
import {isHumminPublicHost} from "../lib/seo.server";
import {insightDetails} from "../lib/insights.server";
import type {ReactPost} from "../components/ReactInsights";
import {PUBLIC_REACT_CUTOVER_APPROVED} from "../lib/react-cutover.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 const url=new URL(args.request.url);
 if(isHumminPublicHost(url.hostname)&&!PUBLIC_REACT_CUTOVER_APPROVED)return originalLoader(args);
 return loadReactInsights(args,true);
}
type MetaData={posts:ReactPost[];view:"index"|"article"|"topic"|"author";selected:string};
export const meta=({location,data}:{location:{pathname:string};data?:MetaData})=>{
 const pathname=location.pathname;
 const original=insightDetails(pathname);
 const published=data?.view==="article"?data.posts.find(p=>p.slug===data.selected):null;
 const title=published?published.title+" | HUMMIN Insights":original?.title||"HUMMIN Insights";
 const description=published?published.excerpt:original?.description||"Practical business guides and perspectives from HUMMIN.";
 return [
  {title},
  {name:"description",content:description},
  {tagName:"link",rel:"canonical",href:"https://hummin.org"+pathname}
 ];
};
export default ReactInsightsRoute;
