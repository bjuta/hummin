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
    if(await stableBookingDiscrepancy(e,row.id,row.google_event_id,"missing","")){
     const result=await e.DB.prepare("DELETE FROM booking_slots WHERE id=? AND status='held'").bind(row.id).run();
     if(result.meta?.changes===1)released++;
     await clearBookingDiscrepancy(e,row.id);
    }else deferred++;
   }else if(event.start&&Date.parse(event.start)===Date.parse(row.start_utc)&&event.attendees?.some(a=>a.toLowerCase()===row.email.toLowerCase())){
    const result=await e.DB.prepare("UPDATE booking_slots SET status='confirmed' WHERE id=? AND status='held'").bind(row.id).run();
    if(result.meta?.changes===1){confirmed++;await clearBookingDiscrepancy(e,row.id);}
   }else{deferred++;console.error("Manual booking reconciliation required",row.id);}
  }catch{deferred++;console.error("Google booking reconciliation failed",row.id);}
 }
 return {confirmed,released,deferred};
}


type BookingMismatch="cancelled"|"moved"|"missing";
async function clearBookingDiscrepancy(e:HumminEnv,id:string){
 await e.DB!.prepare("DELETE FROM booking_discrepancies WHERE booking_id=?").bind(id).run();
}
/**
 * Confirmation on a second cron pass at least five minutes later prevents
 * releasing a slot on one transient Google Calendar 404/incorrect response.
 */
async function stableBookingDiscrepancy(e:HumminEnv,id:string,eventId:string,state:BookingMismatch,start:string){
 const old=await e.DB!.prepare("SELECT observed_state,observed_start,first_seen_at FROM booking_discrepancies WHERE booking_id=?").bind(id).first<{observed_state:string;observed_start:string;first_seen_at:string}>();
 const normalized=old?.first_seen_at?.replace(" ","T");
 const firstSeen=normalized?Date.parse(normalized.endsWith("Z")?normalized:normalized+"Z"):NaN;
 if(old?.observed_state===state&&old.observed_start===start&&Number.isFinite(firstSeen)&&Date.now()-firstSeen>=300000)return true;
 await e.DB!.prepare("INSERT INTO booking_discrepancies(booking_id,google_event_id,observed_state,observed_start) VALUES(?,?,?,?) ON CONFLICT(booking_id) DO UPDATE SET observed_state=excluded.observed_state,observed_start=excluded.observed_start,first_seen_at=CASE WHEN observed_state=excluded.observed_state AND observed_start=excluded.observed_start THEN booking_discrepancies.first_seen_at ELSE CURRENT_TIMESTAMP END,last_seen_at=CURRENT_TIMESTAMP")
 .bind(id,eventId,state,start).run();
 return false;
}
/** Free an old slot only after a Google cancellation or move is confirmed twice. */
export async function reconcileConfirmedBookingChanges(e:HumminEnv){
 if(!hasCalendarCredentials(e)||!e.DB)return {archived:0,deferred:0};
 const rows=await e.DB.prepare("SELECT id,start_utc,email,google_event_id FROM booking_slots WHERE status='confirmed' AND google_event_id IS NOT NULL AND start_utc>? ORDER BY start_utc LIMIT 50")
 .bind(new Date(Date.now()-1800000).toISOString()).all<{id:string;start_utc:string;email:string;google_event_id:string}>();
 let archived=0,deferred=0;
 for(const row of rows.results||[]){
  try{
   const remote=await readBookingEvent(e,row.google_event_id);
   const moved=remote.status==="confirmed"&&remote.start&&Date.parse(remote.start)!==Date.parse(row.start_utc);
   if(remote.status==="confirmed"&&!moved){await clearBookingDiscrepancy(e,row.id);continue;}
   if(remote.status==="confirmed"&&!remote.attendees?.some(x=>x.toLowerCase()===row.email.toLowerCase())){
    deferred++;console.error("Booking attendee mismatch requires review",row.id);continue;
   }
   const reason:BookingMismatch=remote.status==="cancelled"?"cancelled":"moved";
   const observedStart=reason==="moved"?remote.start||"":"";
   if(!await stableBookingDiscrepancy(e,row.id,row.google_event_id,reason,observedStart)){deferred++;continue;}
   await e.DB.batch([
    e.DB.prepare("INSERT OR IGNORE INTO booking_change_audit(booking_id,google_event_id,previous_start,observed_start,reason) VALUES(?,?,?,?,?)").bind(row.id,row.google_event_id,row.start_utc,observedStart,reason),
    e.DB.prepare("DELETE FROM booking_slots WHERE id=? AND status='confirmed'").bind(row.id),
    e.DB.prepare("DELETE FROM email_outbox WHERE id IN (?,?) AND status IN ('pending','failed')").bind("booking-reminder:"+row.google_event_id,"booking-confirmation:"+row.google_event_id),
    e.DB.prepare("DELETE FROM booking_discrepancies WHERE booking_id=?").bind(row.id)
   ]);
   archived++;
  }catch{deferred++;console.error("Booking change reconciliation failed",row.id);}
 }
 return {archived,deferred};
}
