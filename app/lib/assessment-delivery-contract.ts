/** The payload boundary used by the transactional Assessment route and no-delivery Preview.
 * Validation only: never queues mail, accesses D1, or invokes Turnstile.
 * Security token verification is a separate compulsory public-route step.
 */
export type AssessmentDeliveryInput={
 name:string;business:string;email:string;goal:string;score:number;
 priorities:[string,string,string];token:string;monthlyCost?:number;
};
export function parseAssessmentDeliveryInput(value:unknown):AssessmentDeliveryInput|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const x=value as Record<string,unknown>;
 const name=typeof x.name==="string"?x.name.trim():"";
 const business=typeof x.business==="string"?x.business.trim():"";
 const email=typeof x.email==="string"?x.email.trim().toLowerCase():"";
 const goal=typeof x.goal==="string"?x.goal.trim():"";
 const score=typeof x.score==="number"?x.score:NaN;
 const token=typeof x.token==="string"?x.token:"";
 const priorities=Array.isArray(x.priorities)?x.priorities:[];
 if(name.length<2||name.length>120||business.length<2||business.length>160||
    email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
    goal.length<2||goal.length>100||
    !Number.isInteger(score)||score<0||score>100||
    priorities.length!==3||
    priorities.some(p=>typeof p!=="string"||p.length<2||p.length>90)||
    token.length>2048)return null;
 const cost=x.monthlyCost;
 const monthlyCost=typeof cost==="number"&&Number.isFinite(cost)&&cost>=0&&cost<=1e11?
  Math.round(cost):undefined;
 return {name,business,email,goal,score,priorities:priorities as [string,string,string],
  token,...(monthlyCost===undefined?{}:{monthlyCost})};
}
