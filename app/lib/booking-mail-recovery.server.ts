import type {HumminEnv} from "../../workers/app";
import {readBookingEvent,hasCalendarCredentials} from "./calendar.server.ts";
import {bookingConfirmationEmail,bookingReminderEmail,bookingInternalEmail} from "./email-templates.server.ts";
import {queueEmail} from "./mail-outbox.server.ts";
import {bookingEmailKey} from "./booking-email-keys.server.ts";
/** Recover messages for booked appointments even when initial enqueue was interrupted. */
export async function reconcileBookingEmails(env:HumminEnv):Promise<number>{
 if(!env.DB||!env.SITE_URL||!env.RESEND_API_KEY||!env.EMAIL_FROM||!hasCalendarCredentials(env))return 0;
 const bookings=await env.DB.prepare("SELECT start_utc,end_utc,name,email,phone,google_event_id FROM booking_slots WHERE status='confirmed' AND google_event_id IS NOT NULL AND name!='HUMMIN integration test' AND start_utc > ? ORDER BY start_utc LIMIT 25")
  .bind(new Date(Date.now()-1800000).toISOString()).all<{start_utc:string;end_utc:string;name:string;email:string;phone:string|null;google_event_id:string}>();
 let queued=0;
 for(const row of bookings.results||[]){
  const confirmationKey=bookingEmailKey("booking-confirmation",row.google_event_id,row.start_utc),reminderKey=bookingEmailKey("booking-reminder",row.google_event_id,row.start_utc),internalKey=bookingEmailKey("booking-internal",row.google_event_id,row.start_utc);
  const tracked=await env.DB.prepare("SELECT id FROM email_outbox WHERE id IN (?,?,?)").bind(confirmationKey,reminderKey,internalKey).all<{id:string}>();
  const keys=new Set((tracked.results||[]).map(x=>x.id));
  const reminderAt=new Date(Date.parse(row.start_utc)-86400000);
  const needsConfirmation=!keys.has(confirmationKey),needsReminder=reminderAt.getTime()>Date.now()+300000&&!keys.has(reminderKey),needsInternal=!keys.has(internalKey);
  if(!needsConfirmation&&!needsReminder&&!needsInternal)continue;
  try{
   const live=await readBookingEvent(env,row.google_event_id);
   if(live.status!=="confirmed"||!live.start||Date.parse(live.start)!==Date.parse(row.start_utc))continue;
   const meeting=live.meetUrl||live.calendarUrl;
   if(!meeting)continue;
   const appointment={recipient:row.email,name:row.name,start:new Date(row.start_utc),end:new Date(row.end_utc),host:"HUMMIN",meetUrl:live.meetUrl,calendarUrl:live.calendarUrl,assetOrigin:env.SITE_URL};
   if(needsConfirmation){await queueEmail(env,confirmationKey,bookingConfirmationEmail(appointment));queued++;}
   if(needsInternal){await queueEmail(env,internalKey,bookingInternalEmail({...appointment,phone:row.phone||undefined}));queued++;}
   if(needsReminder){await queueEmail(env,reminderKey,bookingReminderEmail(appointment),reminderAt);queued++;}
  }catch(err){console.error("Booking email reconciliation deferred",row.google_event_id,err instanceof Error?err.message:"unknown");}
 }
 return queued;
}
