/** External side effects are forbidden on Workers Preview by default.
 * A release cutover to an owner-approved public hostname is required before any
 * enquiry, assessment email, opt-in, calendar reservation, or scheduled mail.
 * This module has no provider access and must fail closed on unknown hosts.
 */
const approvedPublicHosts=new Set(["hummin.org","www.hummin.org"]);
export function isAuthorizedTransactionalHost(host:string):boolean{
 return approvedPublicHosts.has(host.trim().toLowerCase());
}
export function transactionalHostBlock(request:Request):Response|null{
 let allowed=false;
 try{allowed=isAuthorizedTransactionalHost(new URL(request.url).hostname);}catch{}
 if(allowed)return null;
 return Response.json({ok:false,message:"Transactional services are disabled on isolated Preview."},
  {status:503,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
}
export function mayRunScheduledTransactions(siteUrl:unknown):boolean{
 if(typeof siteUrl!=="string")return false;
 try{return isAuthorizedTransactionalHost(new URL(siteUrl).hostname);}catch{return false;}
}
