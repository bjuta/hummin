import {renderBrandEmail, type BrandEmail, type EmailSpec} from "./email-brand.server.ts";

export type ContactDetails = {name:string;businessName:string;email:string;message:string};
export type ContactEmailOptions = {assetOrigin:string;sentAt?:Date;reference:string};

const first = (name:string)=>name.trim().split(/\s+/)[0]||"there";
const time = (value:Date,zone="Africa/Nairobi") =>
 new Intl.DateTimeFormat("en-GB",{timeZone:zone,weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(value)+" EAT";
const dayAndTime = (value:Date)=>
 new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(value)+" EAT";
const clock=(value:Date)=>new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",hour:"2-digit",minute:"2-digit",hour12:false}).format(value)+" EAT";
const render=(d:EmailSpec,origin:string):BrandEmail=>renderBrandEmail(d,origin);

/** Brand Book 17.1: Contact form, internal. Only sent to HUMMIN. */
export function contactInternalEmail(person:ContactDetails,options:ContactEmailOptions){
 return render({
  type:"contact-internal",sender:"system",recipient:"sales@hummin.org",replyTo:person.email,
  subject:"New enquiry: "+person.name+", "+person.businessName.replace(/[\r\n\t]/g," ").slice(0,110),
  preheader:"Sent from the contact form"+(options.sentAt?" at "+clock(options.sentAt):" on hummin.org")+".",
  kicker:"New enquiry",title:person.name+" wants to talk.",
  paragraphs:["Sent from the contact form on hummin.org. Reply to this email to answer them directly."],
  rows:[{label:"Name",value:person.name},{label:"Business",value:person.businessName},
    {label:"Email",value:person.email},
    {label:"Reference",value:options.reference},
    ...(options.sentAt?[{label:"Sent",value:time(options.sentAt)}]:[])],
  quote:person.message,
  primary:{label:"Reply to "+first(person.name),url:"mailto:"+person.email},
  footer:"Internal alert. Sent to sales@hummin.org only."
 },options.assetOrigin);
}

/** Brand Book 17.2: Contact form, acknowledgement to sender. */
export function contactReceivedEmail(person:ContactDetails,assetOrigin:string){
 return render({
  type:"contact-received",sender:"people",recipient:person.email,replyTo:"sales@hummin.org",
  subject:"We received your enquiry",
  preheader:"We will review your note and get back to you.",
  kicker:"Enquiry received",title:"Thanks for getting in touch.",
  paragraphs:["Hello "+first(person.name)+",",
   "We have your note and will review it. If we can help, we will suggest a first conversation. Here is what you sent:"],
  quote:person.message,
  primary:{label:"Take the Business Assessment",url:"https://hummin.org/assessment"},
  note:"While you wait, the Business Assessment takes about 8 minutes and shows where the gaps are and what they may be costing you.",
  footer:"You received this because you sent an enquiry on hummin.org."
 },assetOrigin);
}

type AssessmentInput = {
 recipient:string;name:string;goal:string;score:number;estimatedCostKes?:number;
 priorities:{label:string;value:string}[];bookingUrl:string;resultsUrl:string;
 assetOrigin:string;
};
/** Brand Book 17.3: Assessment results. Only use measured values and real links. */
export function assessmentResultsEmail(a:AssessmentInput){
 if(!Number.isFinite(a.score)||a.score<0||a.score>100)throw Error("Assessment score out of range");
 return render({
  type:"assessment-results",sender:"people",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Your Business Assessment results",
  preheader:"Your score, what the gaps may cost, and three things to fix first.",
  kicker:"Business Assessment",title:"Your results and 30-day plan.",
  paragraphs:["Hello "+first(a.name)+", here is a copy of your results, weighted for your goal: "+a.goal+"."],
  score:{value:a.score,...(a.estimatedCostKes!==undefined?{cost:"KES "+a.estimatedCostKes.toLocaleString("en-KE"),context:"a month in estimated missed sales"}:{})},
  rows:a.priorities,
  primary:{label:"Book a Results Review",url:a.bookingUrl},
  secondary:{label:"See Full Results",url:a.resultsUrl},
  note:"The cost estimate uses the figures you entered and the assumptions listed on your results page.",
  footer:"You received this because you took the Business Assessment on hummin.org."
 },a.assetOrigin);
}

type Appointment = {recipient:string;name:string;start:Date;end:Date;host:string;meetUrl:string;assetOrigin:string;calendarUrl?:string};
/** Brand Book 17.4: Booking confirmation, with actual appointment details. */
export function bookingConfirmationEmail(a:Appointment){
 return render({
  type:"booking-confirmation",sender:"people",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Confirmed: results review, "+dayAndTime(a.start),
  preheader:"30 minutes on Google Meet with "+a.host+".",
  kicker:"Booking confirmed",title:"You are booked in.",
  paragraphs:["We will go through your assessment answers, check the cost estimate against your real figures, and tell you honestly whether we can help. No preparation needed."],
  rows:[{label:"When",value:dayAndTime(a.start)+" to "+clock(a.end)},{label:"Where",value:"Google Meet. The link is in your calendar invitation."},{label:"With",value:a.host}],
  primary:{label:"Join the Call",url:a.meetUrl},
  ...(a.calendarUrl?{secondary:{label:"Add to Calendar",url:a.calendarUrl}}:{}),
  note:"Need to change the time? Reply to this email and we will find another slot.",
  footer:"You received this because you booked a call on hummin.org."
 },a.assetOrigin);
}
/** Brand Book 17.5: Reminder, intended to be scheduled 24 hours before the call. */
export function bookingReminderEmail(a:Appointment){
 return render({
  type:"booking-reminder",sender:"people",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Tomorrow at "+clock(a.start)+": your results review",
  preheader:"A reminder of your call with HUMMIN.",
  kicker:"Reminder",title:"See you tomorrow at "+clock(a.start).replace(" EAT","")+".",
  paragraphs:["A quick reminder of your 30-minute results review with "+a.host+", "+dayAndTime(a.start)+"."],
  primary:{label:"Join the Call",url:a.meetUrl},
  note:"Can no longer make it? Reply to this email and we will rearrange.",
  footer:"Sent 24 hours before your booking."
 },a.assetOrigin);
}

type AccountCode={recipient:string;name:string;code:string;expiresMinutes:number;assetOrigin:string};
const formattedCode=(raw:string)=>{
 if(!/^\d{6}$/.test(raw))throw Error("Account code must contain six digits");
 return raw.slice(0,3)+" "+raw.slice(3);
};
/** Brand Book 17.6: Account sign-in code. No account sender is active yet. */
export function signInCodeEmail(a:AccountCode){
 const code=formattedCode(a.code);
 return render({
  type:"account-sign-in",sender:"system",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Your HUMMIN sign-in code is "+a.code,
  preheader:"The code expires in "+a.expiresMinutes+" minutes.",
  kicker:"Sign in",title:"Your sign-in code.",
  paragraphs:["Enter this code on hummin.org to sign in."],
  code:{value:code,expiry:"Expires in "+a.expiresMinutes+" minutes"},
  note:"If you did not try to sign in, you can ignore this email. Nobody can sign in without this code.",
  footer:"Sent because someone tried to sign in with this email address."
 },a.assetOrigin);
}
/** Brand Book 17.7: Welcome and address verification. */
export function accountWelcomeEmail(a:AccountCode){
 return render({
  type:"account-welcome",sender:"system",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Confirm your email address",
  preheader:"One step to finish setting up your HUMMIN account.",
  kicker:"Welcome",title:"Confirm your email address.",
  paragraphs:["Hello "+first(a.name)+", your HUMMIN account is almost ready. Enter this code to confirm the email address is yours."],
  code:{value:formattedCode(a.code),expiry:"Expires in "+a.expiresMinutes+" minutes"},
  note:"If you did not create an account, ignore this email and the account will not be activated.",
  footer:"Sent because this address was used to create an account on hummin.org."
 },a.assetOrigin);
}
/** Brand Book 17.8: Password reset, only relevant if password accounts are introduced. */
export function accountPasswordResetEmail(a:{recipient:string;resetUrl:string;expiresMinutes:number;assetOrigin:string}){
 return render({
  type:"account-password-reset",sender:"system",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Reset your HUMMIN password",
  preheader:"The link expires in "+a.expiresMinutes+" minutes.",
  kicker:"Password reset",title:"Reset your password.",
  paragraphs:["We received a request to reset the password for this account. Use the button below to choose a new one."],
  primary:{label:"Reset Password",url:a.resetUrl},
  note:"The link expires in "+a.expiresMinutes+" minutes. If you did not ask for this, ignore this email. Your password will not change.",
  footer:"Sent because a password reset was requested for this address."
 },a.assetOrigin);
}
/** Brand Book 17.9: Monthly note. Only for subscribed contacts with one-click unsubscribe. */
export function monthlyNewsletterEmail(a:{
 recipient:string;month:string;title:string;preheader:string;paragraphs:string[];
 articleUrl:string;unsubscribeUrl:string;assetOrigin:string;heroUrl?:string;heroAlt?:string
}){
 return render({
  type:"newsletter-monthly",sender:"people",recipient:a.recipient,replyTo:"sales@hummin.org",
  subject:"Notes from HUMMIN · "+a.month,
  preheader:a.preheader,
  kicker:"Notes from HUMMIN · "+a.month,
  title:a.title,paragraphs:a.paragraphs,
  ...(a.heroUrl?{heroImage:{url:a.heroUrl,alt:a.heroAlt||"Editorial photograph"}}:{}),
  primary:{label:"Read the Full Note",url:a.articleUrl},
  footer:"You receive this because you subscribed on hummin.org. Unsubscribe: "+a.unsubscribeUrl
 },a.assetOrigin);
}
