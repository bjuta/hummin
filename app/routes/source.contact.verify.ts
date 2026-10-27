import {isHumminPublicHost} from "../lib/seo.server";
import {cleanContactField,validateContactVisitor} from "../lib/contact-contract";
import type {AppLoadContext} from "react-router";

/** Non-delivery preview-only validation. Never imports email, D1, or booking services.
 * This route must never be made accessible on the public HUMMIN hostname.
 */
export async function action({request}:{request:Request;context:AppLoadContext}){
 const url=new URL(request.url),noStore={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
 const fail=(message:string,status:number)=>Response.json({ok:false,delivered:false,message},{status,headers:noStore});
 if(isHumminPublicHost(url.hostname))return fail("Not found.",404);
 if(request.method!=="POST")return fail("Method not allowed.",405);
 if(Number(request.headers.get("content-length")||0)>10000)return fail("Request too large.",413);
 const origin=request.headers.get("origin");
 if(!origin)return fail("Origin required.",403);
 try{if(new URL(origin).origin!==url.origin)return fail("Invalid submission origin.",403);}
 catch{return fail("Invalid submission origin.",403);}
 let form:FormData;
 try{form=await request.formData();}catch{return fail("Invalid form submission.",400);}
 if(cleanContactField(form.get("website")))return fail("Invalid enquiry.",400);
 if(!validateContactVisitor(form))return fail("Please check your name, business, email and message.",400);
 return Response.json({
  ok:true,delivered:false,validated:true,
  message:"Details validated in isolated Preview. No enquiry was stored and no email was sent."
 },{headers:noStore});
}
