import {redirect} from "react-router";
import type {AppLoadContext} from "react-router";
import {clearCookie,correctOrigin,privateHeaders,revoke} from "../lib/admin-auth.server.ts";
export async function action({request,context}:{request:Request;context:AppLoadContext}){
 if(!correctOrigin(request))return new Response("Invalid origin",{status:403,headers:privateHeaders});
 await revoke(context.cloudflare.env,request);
 return redirect("/admin/login",{headers:{...privateHeaders,"Set-Cookie":clearCookie()}});
}
