/** Article and author metadata transcribed from the supplied HUMMIN Insights source. */
export type InsightPost={slug:string;title:string;excerpt:string;type:"guide"|"opinion"|"news";date:string;author:"team"|"muiruri";topics:string[]};
export const insightsPosts:InsightPost[]=[
 {slug:"enquiries-30-day-fix",title:"Why enquiries go unanswered, and a 30-day fix",excerpt:"Most owners get more enquiries than they think. The problem is what happens next. Here is a simple routine to find where enquiries are lost.",type:"guide",date:"2026-10-20",author:"team",topics:["Marketing","Operations"]},
 {slug:"five-monday-figures",title:"Five figures every owner should see on Monday",excerpt:"Monthly accounts arrive too late to act on. A short set of weekly figures shows problems while you can still do something about them.",type:"guide",date:"2026-10-13",author:"team",topics:["Data","Strategy"]},
 {slug:"runs-through-the-owner",title:"When the business still runs through the owner",excerpt:"Owners often become the bottleneck in the business they built. It is a sign the business has grown, and it needs to change.",type:"opinion",date:"2026-10-06",author:"muiruri",topics:["Strategy","Talent"]},
 {slug:"introducing-hummin",title:"Introducing HUMMIN",excerpt:"HUMMIN works with established, owner-led businesses to understand what is holding them back and put practical changes to work.",type:"news",date:"2026-10-01",author:"team",topics:["Strategy"]}
];
export const insightsAuthors={
 team:{name:"HUMMIN Team",role:"Guides and news from the people who do the work",bio:"Practical guides from the HUMMIN team, based on what we see inside the businesses we work with, and news about the company."},
 muiruri:{name:"Muiruri Beautah",role:"Founder and Managing Director, HUMMIN",bio:"Muiruri founded HUMMIN to give owners of established businesses a partner that understands the whole business and helps carry out the work. He writes about ownership, priorities, and handing over the day-to-day."}
};
export const insightTopics=["Strategy","Technology","Marketing","Operations","Talent","Data","Specialist Partners"];
export function insightTopicSlug(topic:string){return topic.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function insightDetails(path:string){
 const segments=path.split("/").filter(Boolean);
 if(segments[0]!=="insights")return null;
 const canonical="https://hummin.org"+path;
 if(segments.length===1)return {title:"Insights | HUMMIN",description:"Practical guides, opinion, downloads and news for owners of established businesses.",canonical,type:"index" as const};
 if(segments[1]==="author"&&segments.length===3){
  const author=insightsAuthors[segments[2] as keyof typeof insightsAuthors];
  return author?{title:author.name+" | Insights | HUMMIN",description:author.bio,canonical,type:"author" as const,author}:null;
 }
 if(segments[1]==="topic"&&segments.length===3){
  const topic=insightTopics.find(x=>insightTopicSlug(x)===segments[2]);
  return topic?{title:topic+" | Insights | HUMMIN",description:"HUMMIN insights and practical guidance on "+topic+".",canonical,type:"topic" as const,topic}:null;
 }
 if(segments.length===2){
  const post=insightsPosts.find(x=>x.slug===segments[1]);
  return post?{title:post.title+" | HUMMIN Insights",description:post.excerpt,canonical,type:"article" as const,post}:null;
 }
 return null;
}
