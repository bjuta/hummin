/** Original HUMMIN Insights author and topic metadata available to React browsers. */
export const insightsAuthors={
 team:{name:"HUMMIN Team",role:"Guides and news from the people who do the work",bio:"Practical guides from the HUMMIN team, based on what we see inside the businesses we work with, and news about the company."},
 muiruri:{name:"Muiruri Beautah",role:"Founder and Managing Director, HUMMIN",bio:"Muiruri founded HUMMIN to give owners of established businesses a partner that understands the whole business and helps carry out the work. He writes about ownership, priorities, and handing over the day-to-day."}
};
export const insightTopics=["Strategy","Technology","Marketing","Operations","Talent","Data","Specialist Partners"];
export function insightTopicSlug(topic:string){return topic.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
