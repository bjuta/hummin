import type {AppLoadContext} from "react-router";
import {isHumminPublicHost} from "../lib/seo.server.ts";
import {parseNewsletterEmail} from "../lib/newsletter-contract.ts";

/** Only validates an email address. No subscription, token, D1 or outbox mutation. */
export async function action({request}:{request:Request;context:AppLoadContext}){
 const url=new URL(request.url);
 const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"};
 const err=(message:string,status:number)=>Response.json({ok:false,subscribed:false,queued:false,message},{status,headers});
 if(isHumminPublicHost(url.hostname))return err("Not found.",404);
 if(request.method!=="POST")return err("Method not allowed.",405);
 if(Number(request.headers.get("content-length")||0)>4096)return err("Request too large.",413);
 const origin=request.headers.get("origin");if(!origin)return err("Origin required.",403);
 try{if(new URL(origin).origin!==url.origin)return err("Invalid origin.",403);}
 catch{return err("Invalid origin.",403);}
 let form:FormData;
 try{form=await request.formData();}catch{return err("Invalid submission.",400);}
 if(form.get("website"))return err("Invalid submission.",400);
 if(!parseNewsletterEmail(form.get("email")))return err("Enter a valid email address.",400);
 return Response.json({ok:true,validated:true,subscribed:false,queued:false,
  securityVerification:"not-performed-in-preview",
  message:"Email format validated in isolated Preview. No subscription was created and no email was sent."
 },{headers});
}
