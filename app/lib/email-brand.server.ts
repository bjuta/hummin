/**
 * HUMMIN Brand Book, section 17: Email.
 * One 600px column, Slate bird header, mist footer, one Ember primary action.
 * All nine types use this renderer. The supplied fields are plain text, never HTML.
 */
export type MailType =
 | "contact-internal" | "contact-received" | "assessment-results"
 | "booking-confirmation" | "booking-reminder"
 | "account-sign-in" | "account-welcome" | "account-password-reset"
 | "newsletter-monthly" | "newsletter-opt-in" | "insights-download";

export type BrandEmail = {
 type: MailType;
 subject: string;
 preheader: string;
 html: string;
 text: string;
 recipient: string;
 sender: "people" | "system" | "newsletter";
 replyTo?: string;
 unsubscribeUrl?: string;
};

export type EmailSpec = {
 type: MailType;
 recipient: string;
 sender: "people" | "system" | "newsletter";
 replyTo?: string;
 subject: string;
 preheader: string;
 kicker: string;
 title: string;
 paragraphs?: string[];
 rows?: {label:string;value:string}[];
 quote?: string;
 score?: {value:number;cost?:string;context?:string};
 code?: {value:string;expiry:string};
 primary?: {label:string;url:string};
 secondary?: {label:string;url:string};
 note?: string;
 footer: string;
 unsubscribeUrl?: string;
 heroImage?: {url:string;alt:string};
};

export const emailTypes: readonly MailType[] = [
 "contact-internal","contact-received","assessment-results",
 "booking-confirmation","booking-reminder",
 "account-sign-in","account-welcome","account-password-reset","newsletter-monthly","newsletter-opt-in","insights-download"
] as const;

const e = (s:string):string => s.replace(/[&<>"']/g, x =>
 ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[x]);
const newlines=(s:string)=>e(s).replace(/\r\n|\n|\r/g,"<br>");
const url=(s:string):string=>{
 try { const parsed=new URL(s); if(parsed.protocol==="https:"||parsed.protocol==="mailto:")return parsed.href; }catch {}
 throw Error("Email actions require an absolute HTTPS or mailto URL");
};
const normalizeBase=(s:string):string=>{
 const parsed=new URL(s);
 if(parsed.protocol!=="https:")throw Error("Email asset origin must use HTTPS");
 return parsed.origin;
};
const inline=(css:string,content:string)=>'<span style="'+css+'">'+content+'</span>';
const SLATE="#1E272A", EMBER="#B5532C", MIST="#E7EBE6", TEXT="#434F4F";

function cta(action:{label:string;url:string},secondary=false){
 const href=e(url(action.url)), label=e(action.label);
 if(secondary) return '<a href="'+href+'" style="display:inline-block;line-height:22px;padding:12px 20px;border-radius:999px;border:1.5px solid '+SLATE+';color:'+SLATE+';font-size:15px;font-weight:600;text-decoration:none;">'+label+'</a>';
 return '<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="'+href+'" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="50%" strokecolor="'+EMBER+'" fillcolor="'+EMBER+'"><w:anchorlock xmlns:w="urn:schemas-microsoft-com:office:word"/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">'+label+'</center></v:roundrect><![endif]-->'+
 '<!--[if !mso]><!--><a href="'+href+'" style="display:inline-block;min-height:20px;line-height:20px;padding:14px 24px;border-radius:999px;background:'+EMBER+';color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;">'+label+'</a><!--<![endif]-->';
}

export function renderBrandEmail(spec:EmailSpec,assetOrigin:string):BrandEmail {
 if(!emailTypes.includes(spec.type))throw Error("Unknown HUMMIN brand email type");
 if(spec.primary && !spec.primary.url)throw Error("A primary action must have a real destination");
 if(spec.secondary && !spec.primary)throw Error("Secondary action requires a primary action");
 const origin=normalizeBase(assetOrigin);
 const light=e(origin+"/email/mark-light.png"), dark=e(origin+"/email/mark-dark.png");
 const motif=e(origin+"/email/motif.svg");
 const paragraphs=spec.paragraphs||[];
 const rows=spec.rows||[];
 const messageParts=[
  spec.kicker,spec.title,...paragraphs,
  ...rows.map(r=>r.label+": "+r.value),
  ...(spec.quote?[spec.quote]:[]),
  ...(spec.score?["Your score: "+spec.score.value+" / 100",...(spec.score.cost?["Estimated gap cost: "+spec.score.cost]:[])]:[]),
  ...(spec.code?[spec.code.value,spec.code.expiry]:[]),
  ...(spec.primary?[spec.primary.label+": "+url(spec.primary.url)]:[]),
  ...(spec.secondary?[spec.secondary.label+": "+url(spec.secondary.url)]:[]),
  ...(spec.note?[spec.note]:[]),
  spec.footer,
  ...(spec.unsubscribeUrl?["Unsubscribe: "+url(spec.unsubscribeUrl)]:[])
 ];
 const text=[
  "HUMMIN", "", ...messageParts.filter(Boolean),"",
  "Embedded advisory and execution. Nairobi, Kenya",
  "https://hummin.org", "sales@hummin.org"
 ].join("\n\n");
 const paras=paragraphs.map(p=>'<p style="margin:0 0 18px;font-family:Figtree,Arial,Helvetica,sans-serif;color:'+TEXT+';font-size:16px;line-height:1.6;">'+newlines(p)+'</p>').join("");
 const rowsHtml=rows.length?'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:6px 0;">'+rows.map(r=>'<tr><td valign="top" style="width:125px;padding:12px 12px 12px 0;border-top:1px solid '+MIST+';color:#5E6967;font-size:13px;font-weight:600;">'+e(r.label)+'</td><td valign="top" style="padding:12px 0;border-top:1px solid '+MIST+';font-size:15px;line-height:1.5;color:'+SLATE+';overflow-wrap:anywhere;">'+newlines(r.value)+'</td></tr>').join("")+'</table>':"";
 const quote=spec.quote?'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F5F1;border-radius:10px;"><tr><td style="padding:16px 18px;font-size:15px;line-height:1.6;color:'+TEXT+';overflow-wrap:anywhere;">'+newlines(spec.quote)+'</td></tr></table>':"";
 const code=spec.code?'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:'+MIST+';border-radius:10px;"><tr><td align="center" style="padding:20px;"><div style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:38px;letter-spacing:0.12em;user-select:all;-webkit-user-select:all;color:'+SLATE+';">'+e(spec.code.value)+'</div><div style="font-size:13px;color:#5E6967;padding-top:6px;">'+e(spec.code.expiry)+'</div></td></tr></table>':"";
 const score=spec.score?'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td valign="top" width="50%" bgcolor="'+SLATE+'" style="padding:18px;color:#FFFFFF;"><div style="font-size:11px;color:#E58A5F;font-weight:bold;text-transform:uppercase;">Your score</div><div style="font-family:Newsreader,Georgia,serif;font-size:44px;line-height:1.2;">'+e(String(spec.score.value))+' <span style="font-size:18px;color:#BAC4BE;">/ 100</span></div></td><td width="12"></td><td valign="top" width="50%" bgcolor="'+EMBER+'" style="padding:18px;color:#FFFFFF;"><div style="font-size:11px;font-weight:bold;text-transform:uppercase;">'+e(spec.score.cost?"Gaps may be costing":"Your results")+'</div><div style="font-family:Newsreader,Georgia,serif;font-size:28px;line-height:1.2;margin-top:6px;">'+e(spec.score.cost||"Review your priorities")+'</div><div style="font-size:13px;">'+e(spec.score.context||"")+'</div></td></tr></table>':"";
 const hero=spec.heroImage?'<img src="'+e(url(spec.heroImage.url))+'" width="520" alt="'+e(spec.heroImage.alt)+'" style="display:block;width:100%;height:auto;border-radius:10px;max-width:520px;" />':"";
 const buttons=spec.primary?'<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td valign="middle" style="padding:5px 12px 5px 0;">'+cta(spec.primary)+'</td>'+(spec.secondary?'<td valign="middle" style="padding:5px 0;">'+cta(spec.secondary,true)+'</td>':"")+'</tr></table>':"";
 const note=spec.note?'<div style="border-top:1px solid '+MIST+';padding-top:16px;color:#5E6967;font-size:14px;line-height:1.6;">'+newlines(spec.note)+'</div>':"";
 const sections=[paras,hero,code,score,rowsHtml,quote,buttons,note].filter(Boolean)
  .map(block=>'<tr><td style="padding:0 0 18px;">'+block+'</td></tr>').join("");
 const html='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(spec.subject)+'</title>'+
 '<style>@media only screen and (max-width:620px){.hm-pad{padding-left:20px!important;padding-right:20px!important}.hm-title{font-size:28px!important}.hm-head{height:84px!important}} </style></head>'+
 '<body style="margin:0;padding:0;background:#F4F5F1;font-family:Figtree,Arial,Helvetica,sans-serif;color:'+SLATE+';">'+
 '<div style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">'+e(spec.preheader)+'</div>'+
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:#F4F5F1;"><tr><td align="center" style="padding:24px 10px 36px;">'+
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;border-radius:18px;overflow:hidden;">'+
 '<tr><td class="hm-pad hm-head" style="background:'+SLATE+' url('+motif+') no-repeat right -65px center;background-size:300px auto;padding:24px 40px;height:104px;box-sizing:border-box;border-radius:18px 18px 0 0;overflow:hidden;">'+
 '<img src="'+light+'" width="38" alt="HUMMIN" style="display:inline-block;width:38px;height:auto;vertical-align:middle;border:0;"/>'+
 inline('color:#F4F5F1;font-size:13px;font-weight:600;letter-spacing:0.18em;vertical-align:middle;margin-left:10px;', 'HUMMIN')+
 '</td></tr>'+
 '<tr><td class="hm-pad" style="background:#FFFFFF;padding:32px 40px 36px;">'+
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">'+
 '<tr><td style="padding:0 0 16px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:'+EMBER+';">'+e(spec.kicker)+'</td></tr>'+
 '<tr><td style="padding:0 0 24px;"><h1 class="hm-title" style="margin:0;font-family:Newsreader,Georgia,serif;font-weight:400;font-size:34px;line-height:1.1;letter-spacing:-0.01em;color:'+SLATE+';">'+e(spec.title)+'</h1></td></tr>'+
 sections+'</table></td></tr>'+
 '<tr><td class="hm-pad" style="background:'+MIST+';padding:22px 40px;color:#5E6967;font-size:12px;line-height:1.6;">'+
 '<img src="'+dark+'" alt="" aria-hidden="true" width="24" style="width:24px;height:auto;vertical-align:middle;border:0;"/>'+
 inline('font-weight:600;letter-spacing:0.14em;color:'+SLATE+';vertical-align:middle;margin-left:8px;','HUMMIN')+
 '<div style="padding-top:9px;">Embedded advisory and execution. Nairobi, Kenya</div>'+
 '<div style="padding-top:5px;"><a href="https://hummin.org" style="color:'+EMBER+';font-weight:600;text-decoration:none;">hummin.org</a> &nbsp;·&nbsp; <a href="mailto:sales@hummin.org" style="color:'+EMBER+';font-weight:600;text-decoration:none;">sales@hummin.org</a></div>'+
 '<div style="padding-top:8px;">'+e(spec.footer)+'</div>'+
 (spec.unsubscribeUrl?'<div style="padding-top:10px;"><a href="'+e(url(spec.unsubscribeUrl))+'" style="color:'+EMBER+';text-decoration:underline;text-underline-offset:3px;">Unsubscribe from Notes from HUMMIN</a></div>':"")+
 '</td></tr></table></td></tr></table></body></html>';
 return {type:spec.type,recipient:spec.recipient, sender:spec.sender,
  ...(spec.replyTo?{replyTo:spec.replyTo}:{}),
  ...(spec.unsubscribeUrl?{unsubscribeUrl:url(spec.unsubscribeUrl)}:{}),
  subject:spec.subject,preheader:spec.preheader,html,text};
}
