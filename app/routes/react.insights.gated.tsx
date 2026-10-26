import {ReactInsightsRoute} from "../components/ReactInsights";
import {loader as originalLoader} from "./fidelity";
import {loadReactInsights} from "../lib/react-insights-loader.server";
import {isHumminPublicHost} from "../lib/seo.server";
import {insightsAuthors,insightTopics,insightTopicSlug,insightTopicLeads} from "../lib/react-insights-meta";
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
 const published=data?.view==="article"?data.posts.find(p=>p.slug===data.selected):null;
 const author=data?.view==="author"?insightsAuthors[data.selected as keyof typeof insightsAuthors]:undefined;
 const topic=data?.view==="topic"?insightTopics.find(t=>insightTopicSlug(t)===data.selected):undefined;
 const title=published?published.title+" | HUMMIN Insights":author?author.name+" | Insights | HUMMIN":topic?topic+" | Insights | HUMMIN":"Insights | HUMMIN";
 const description=published?published.excerpt:author?author.bio:topic?insightTopicLeads[topic]:"Practical guides, opinion, downloads and news for owners of established businesses.";
 return [
  {title},
  {name:"description",content:description},
  {tagName:"link",rel:"canonical",href:"https://hummin.org"+pathname}
 ];
};
export default ReactInsightsRoute;
