/** HUMMIN Brand Book, section 17: Staff signature.
 * Real HTML text. No quotes, social icons or banners.
 * A small full-colour bird mark is the only graphic.
 */
const e=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[c]);
export function staffSignature(input:{name:string;role:string;email:string;assetOrigin:string;city?:string}){
 const base=new URL(input.assetOrigin);
 if(base.protocol!=="https:")throw Error("Signature image origin must be HTTPS");
 const email="mailto:"+encodeURIComponent(input.email);
 const name=e(input.name),role=e(input.role),city=e(input.city||"Nairobi, Kenya");
 const link=e("https://hummin.org");
 const mark=e(base.origin+"/email/mark-dark.png");
 const html='<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:2px solid #B5532C;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#1E272A;">'+
 '<tr><td style="padding:15px 15px 5px 0;vertical-align:top;width:56px;"><img src="'+mark+'" width="52" alt="HUMMIN" style="display:block;width:52px;height:auto;border:0;"></td>'+
 '<td style="padding:13px 0 4px;vertical-align:top;">'+
 '<strong style="font-size:15px;font-weight:700;color:#1E272A;">'+name+'</strong><br>'+
 role+'<br><strong style="font-weight:600;color:#1E272A;">HUMMIN</strong><br>'+
 '<a href="'+e(email)+'" style="color:#B5532C;text-decoration:none;">'+e(input.email)+'</a> &nbsp;·&nbsp; '+
 '<a href="'+link+'" style="color:#B5532C;text-decoration:none;">hummin.org</a><br>'+city+
 '</td></tr></table>';
 const text=[input.name,input.role,"HUMMIN",input.email,"https://hummin.org",input.city||"Nairobi, Kenya"].join("\n");
 return {html,text};
}
