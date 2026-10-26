import {ReactInsightsRoute} from "../components/ReactInsights";
import {loadReactInsights} from "../lib/react-insights-loader.server";
import type {AppLoadContext} from "react-router";
export async function loader(args:{request:Request;context:AppLoadContext}){
 return loadReactInsights(args,false);
}
export const meta=()=>[{title:"HUMMIN Insights React acceptance"},{name:"robots",content:"noindex,nofollow"}];
export default ReactInsightsRoute;
