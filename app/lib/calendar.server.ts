import type { HumminEnv } from "../../workers/app";
export type SlotDay = {date:string;slots:string[]};
const hours:[[number,number],...[number,number][]]=[[9,0],[9,30],[10,0],[11,0],[11,30],[14,0],[14,30],[15,30],[16,0]];
export const hasCalendarCredentials=(e:HumminEnv)=>!!(e.DB&&e.GOOGLE_CALENDAR_ID&&e.GOOGLE_CLIENT_ID&&e.GOOGLE_CLIENT_SECRET&&e.GOOGLE_REFRESH_TOKEN);
export const isConfigured=(e:HumminEnv)=>e.BOOKING_ENABLED==="true"&&e.BOOKING_AVAILABILITY_ENABLED==="true"&&!!(e.TURNSTILE_SITE_KEY&&e.TURNSTILE_SECRET_KEY&&e.RESEND_API_KEY&&e.EMAIL_FROM)&&hasCalendarCredentials(e);
async function accessToken(e:HumminEnv):Promise<string>{
 const body=new URLSearchParams({client_id:e.GOOGLE_CLIENT_ID!,client_secret:e.GOOGLE_CLIENT_SECRET!,refresh_token:e.GOOGLE_REFRESH_TOKEN!,grant_type:"refresh_token"});
 const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
 if(!r.ok)throw Error("Calendar token refresh failed");
 const d=await r.json() as {access_token?:string};if(!d.access_token)throw Error("Calendar token absent");return d.access_token;
}
function ymdNairobi(d:Date){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:"Africa/Nairobi",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
 return p.year+"-"+p.month+"-"+p.day;
}
function dates():string[]{
 const day=ymdNairobi(new Date());const [y,m,d]=day.split("-").map(Number);
 const cursor=new Date(Date.UTC(y,m-1,d+1));const out:string[]=[];
 while(out.length<15){const wd=cursor.getUTCDay();if(wd>=1&&wd<=5)out.push(cursor.toISOString().slice(0,10));cursor.setUTCDate(cursor.getUTCDate()+1);}
 return out;
}
export async function liveSlots(e:HumminEnv):Promise<SlotDay[]>{
 if(!hasCalendarCredentials(e))return [];
 const days=dates();const token=await accessToken(e);
 const min=new Date(days[0]+"T00:00:00+03:00").toISOString();
 const max=new Date(Date.parse(days[days.length-1]+"T00:00:00+03:00")+86400000).toISOString();
 const r=await fetch("https://www.googleapis.com/calendar/v3/freeBusy",{method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({timeMin:min,timeMax:max,items:[{id:e.GOOGLE_CALENDAR_ID}]})});
 if(!r.ok)throw Error("Calendar availability query failed");
 const result=await r.json() as {calendars?:Record<string,{busy?:{start:string;end:string}[];errors?:unknown[]}>};
 const c=result.calendars?.[e.GOOGLE_CALENDAR_ID!];if(!c||c.errors?.length)throw Error("Calendar availability data unavailable");
 const busy=(c.busy||[]).map(b=>[Date.parse(b.start),Date.parse(b.end)]);
 const pending=await e.DB!.prepare("SELECT start_utc FROM booking_slots WHERE status='confirmed' OR (status='held' AND (google_event_id IS NOT NULL OR created_at > datetime('now','-10 minutes')))").all<{start_utc:string}>();
 const reserved=new Set((pending.results||[]).map(r=>r.start_utc));
 const now=Date.now();
 return days.map(date=>{
  const [y,m,d]=date.split("-").map(Number);
  const slots=hours.map(([h,mi])=>new Date(Date.UTC(y,m-1,d,h-3,mi)).toISOString()).filter(iso=>{
   const t=Date.parse(iso);return t>now+24*3600000&&!reserved.has(iso)&&!busy.some(([from,to])=>t<to&&t+1800000>from);
  });
  return {date,slots};
 });
}
export async function reserve(e:HumminEnv,input:{start:string;name:string;email:string;phone:string}):Promise<{eventId:string;calendarUrl:string;meetUrl:string}>{
 if(!isConfigured(e)||!e.DB)throw Error("Booking is not configured");
 const days=await liveSlots(e);
 if(!days.some(d=>d.slots.includes(input.start)))throw Error("That time is no longer available");
 const end=new Date(Date.parse(input.start)+30*60000).toISOString();
 const holdId=crypto.randomUUID(),eventId=holdId.replace(/-/g,"");
 // A hold is temporary. Remove expired holds before attempting the UNIQUE start_utc insert.
 // The insert itself remains the atomic protection against two concurrent reservations.
 await e.DB.prepare("DELETE FROM booking_slots WHERE status='held' AND google_event_id IS NULL AND created_at <= datetime('now','-10 minutes')").run();
 try{
  await e.DB.prepare("INSERT INTO booking_slots (id,start_utc,end_utc,name,email,phone,status,google_event_id) VALUES(?,?,?,?,?,?,'held',?)").bind(holdId,input.start,end,input.name,input.email,input.phone,eventId).run();
 }catch{throw Error("That time has just been selected by another visitor");}
 try{
  const token=await accessToken(e);
  const result=await fetch("https://www.googleapis.com/calendar/v3/calendars/"+encodeURIComponent(e.GOOGLE_CALENDAR_ID!)+"/events?sendUpdates=all&conferenceDataVersion=1",{
   method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify({id:eventId,summary:"HUMMIN business assessment results review",description:"30-minute consultation arranged on hummin.org.",start:{dateTime:input.start},end:{dateTime:end},attendees:[{email:input.email}],conferenceData:{createRequest:{requestId:holdId,conferenceSolutionKey:{type:"hangoutsMeet"}}}})
  });
  if(!result.ok)throw Error("Calendar did not accept the appointment");
  const event=await result.json() as {id?:string;htmlLink?:string;hangoutLink?:string;attendees?:{email?:string}[];conferenceData?:{entryPoints?:{entryPointType?:string;uri?:string}[]}};
  if(event.id!==eventId||!event.attendees?.some(a=>a.email?.toLowerCase()===input.email.toLowerCase()))throw Error("Google did not verify the invited attendee");
  // An event in Google Calendar is not a complete booking until D1 also records it.
  // Leave its hold in place if D1 fails; do not remove it and accidentally free the slot.
  try{
   const saved=await e.DB.prepare("UPDATE booking_slots SET status='confirmed',google_event_id=? WHERE id=? AND status='held'").bind(event.id,holdId).run();
   if(saved.meta?.changes!==1)throw Error("Booking confirmation was not persisted");
  }catch{
   console.error("Calendar event was created but booking persistence failed; manual reconciliation required",holdId);
   throw Error("BOOKING_RECONCILIATION_REQUIRED");
  }
  return {eventId:event.id,calendarUrl:event.htmlLink||"",meetUrl:event.hangoutLink||event.conferenceData?.entryPoints?.find(p=>p.entryPointType==="video")?.uri||""};
 }catch(error){
  // The event may already exist at Google if the insert timed out. Preserve
  // the preallocated event ID and held slot until the reconciliation cron.
  console.error("Booking requires Google reconciliation",holdId);
  throw error;
 }
}
export type CalendarBooking = {
 status:"confirmed"|"cancelled";start?:string;end?:string;meetUrl?:string;calendarUrl?:string;attendees?:string[];
};
/** Read Google as the authority for event cancellation or movement before reminders. */
export async function readBookingEvent(env:HumminEnv,eventId:string):Promise<CalendarBooking>{
 if(!hasCalendarCredentials(env)||!eventId)throw Error("Booking calendar unavailable");
 const token=await accessToken(env);
 const endpoint="https://www.googleapis.com/calendar/v3/calendars/"+encodeURIComponent(env.GOOGLE_CALENDAR_ID!)+"/events/"+encodeURIComponent(eventId);
 const res=await fetch(endpoint,{headers:{Authorization:"Bearer "+token},cache:"no-store"});
 if(res.status===404||res.status===410)return {status:"cancelled"};
 if(!res.ok)throw Error("Google Calendar event read failed");
 const e=await res.json() as {status?:string;start?:{dateTime?:string};end?:{dateTime?:string};hangoutLink?:string;htmlLink?:string;conferenceData?:{entryPoints?:{entryPointType?:string;uri?:string}[]};attendees?:{email?:string}[]};
 if(e.status==="cancelled")return {status:"cancelled"};
 return {status:"confirmed",start:e.start?.dateTime,end:e.end?.dateTime,calendarUrl:e.htmlLink||"",meetUrl:e.hangoutLink||e.conferenceData?.entryPoints?.find(x=>x.entryPointType==="video")?.uri||"",attendees:(e.attendees||[]).map(a=>a.email||"")};
}


/** Resolve uncertain Google inserts and D1 confirmation failures without ghost bookings. */
export async function reconcilePendingBookingHolds(e:HumminEnv){
 if(!hasCalendarCredentials(e)||!e.DB)return {confirmed:0,released:0,deferred:0};
 const pending=await e.DB.prepare("SELECT id,start_utc,email,google_event_id FROM booking_slots WHERE status='held' AND google_event_id IS NOT NULL AND created_at<datetime('now','-3 minutes') ORDER BY created_at LIMIT 20").all<{id:string;start_utc:string;email:string;google_event_id:string}>();
 let confirmed=0,released=0,deferred=0;
 for(const row of pending.results||[]){
  try{
   const event=await readBookingEvent(e,row.google_event_id);
   if(event.status==="cancelled"){
    const result=await e.DB.prepare("DELETE FROM booking_slots WHERE id=? AND status='held'").bind(row.id).run();
    if(result.meta?.changes===1)released++;
   }else if(event.start&&Date.parse(event.start)===Date.parse(row.start_utc)&&event.attendees?.some(a=>a.toLowerCase()===row.email.toLowerCase())){
    const result=await e.DB.prepare("UPDATE booking_slots SET status='confirmed' WHERE id=? AND status='held'").bind(row.id).run();
    if(result.meta?.changes===1)confirmed++;
   }else{deferred++;console.error("Manual booking reconciliation required",row.id);}
  }catch{deferred++;console.error("Google booking reconciliation failed",row.id);}
 }
 return {confirmed,released,deferred};
}
