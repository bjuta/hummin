import {Link} from "react-router";
import {insightsAuthors} from "../lib/react-insights-meta";
import type {ReactPost} from "./ReactInsights";

/** One authoritative editorial card renderer for index, archives and related.
 * Each visual variant keeps the owner's exact class hooks and markup.
 * Data/routing is shared, not transcribed differently per page.
 */
type Variant="latest"|"archive"|"related";
type Props={post:ReactPost;base:string;variant:Variant};
const headlineType=(post:ReactPost)=>post.type==="guide"?"Guide":post.type==="opinion"?"Opinion":"News";
const published=(date:string)=>new Date(date+"T12:00:00Z").toLocaleDateString("en-KE",{day:"numeric",month:"short",timeZone:"UTC"});
function readingMinutes(post:ReactPost,variant:Variant){
 if(post.slug==="enquiries-30-day-fix")return 2;
 if(post.slug==="five-monday-figures")return variant==="related"?3:2;
 if(post.type==="news")return 1;
 return variant==="latest"?2:3;
}
export function SourceEditorialCard({post,base,variant}:Props){
 const path=base+"/"+post.slug,minutes=readingMinutes(post,variant);
 if(variant==="related")return <Link to={path} className={"ra-source-related-card ra-source-related-"+post.type}>
  <span className="ra-related-top"><span>{headlineType(post)}</span><span>{minutes} min read</span></span><strong>{post.title}</strong>
 </Link>;
 if(variant==="archive")return <Link to={path} className={"hr-insights-source-list-card hr-insights-landing-"+post.type}>
  <span className="hr-insights-source-list-card-top"><span>{headlineType(post)}</span><span>{minutes} min read</span></span>
  <span className="hr-insights-source-list-card-middle"><strong>{post.title}</strong><span>{post.excerpt}</span></span>
  <span className="hr-insights-source-list-card-foot"><strong>{insightsAuthors[post.author].name}</strong><time dateTime={post.date}>{published(post.date)}</time></span>
 </Link>;
 return <Link to={path} className={"hr-insights-landing-card hr-insights-landing-"+post.type}>
  <div className="hr-insights-landing-card-top"><span>{headlineType(post)}</span><span>{minutes} min read</span></div>
  <div className="hr-insights-landing-card-copy">{post.slug==="five-monday-figures"?<span className="hr-insights-guide-caption">FIVE FIGURES, TEN MINUTES</span>:post.type==="news"?<span className="hr-insights-guide-date">{published(post.date)}</span>:post.type==="opinion"?<span className="hr-insights-opinion-quote" aria-hidden="true">“</span>:null}
   <h3>{post.title}</h3><p>{post.excerpt}</p></div>
  <div className="hr-insights-landing-card-author"><span className="hr-insights-landing-avatar"><img src="/brand/hummin-symbol.svg" alt=""/></span><strong>{insightsAuthors[post.author].name}</strong><time dateTime={post.date}>{published(post.date)}</time></div>
 </Link>;
}
