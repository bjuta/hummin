import type {AppLoadContext} from "react-router";
import {isHumminPublicHost} from "../lib/seo.server.ts";
import {parseAssessmentDeliveryInput} from "../lib/assessment-delivery-contract.ts";

/** Source-native Assessment contract check; zero delivery capability by construction.
 * A 200 response NEVER means email was queued or a booking was made.
 * Public Turnstile verification and D1/outbox remain exclusive to /api/assessment/email.
 */
export async function action({request}:{request:Request;context:AppLoadContext}){
 const url=new URL(request.url);
 const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
 const error=(message:string,status:number)=>Response.json({ok:false,delivered:false,queued:false,message},{status,headers});
 if(isHumminPublicHost(url.hostname))return error("Not found.",404);
 if(request.method!=="POST")return error("Method not allowed.",405);
 if(Number(request.headers.get("content-length")||0)>12000)return error("Request too large.",413);
 const origin=request.headers.get("origin");
 if(!origin)return error("Origin required.",403);
 try{if(new URL(origin).origin!==url.origin)return error("Invalid origin.",403);}
 catch{return error("Invalid origin.",403);}
 let raw:unknown;
 try{raw=await request.json();}catch{return error("Invalid request.",400);}
 const input=parseAssessmentDeliveryInput(raw);
 if(!input)return error("Please check the details and results.",400);
 // Token verification is intentionally NOT simulated: the response is not a delivery receipt.
 // Never log or echo name, business, email, token, scores, or cost.
 return Response.json({ok:true,validated:true,delivered:false,queued:false,
  securityVerification:"not-performed-in-preview",
  message:"Assessment details validated in isolated Preview. No email was sent or queued."
 },{headers});
}
