import { liveSlots, reserve, hasCalendarCredentials } from "../lib/calendar.server";
import type { AppLoadContext } from "react-router";

export async function action({ request, context }: { request: Request; context: AppLoadContext }) {
 const env = context.cloudflare.env;
 const reject=(status:number)=>Response.json({ok:false,message:"Test booking unavailable"},{status,headers:{"Cache-Control":"no-store"}});
 // Deliberately private preview-only route: never enabled in production or when public booking is on.
 if(env.SITE_URL!=="https://hummin-web-preview.grimpossible.workers.dev" || env.BOOKING_ENABLED!=="false" || !env.BOOKING_TEST_TOKEN || !hasCalendarCredentials(env))return reject(404);
 if(request.headers.get("x-hummin-test-token")!==env.BOOKING_TEST_TOKEN)return reject(403);
 if(!env.DB)return reject(503);
 const name="HUMMIN integration test",email="grimpossible@gmail.com";
 try{
  const previous=await env.DB.prepare("SELECT start_utc,google_event_id FROM booking_slots WHERE name=? AND email=? AND status='confirmed' LIMIT 1").bind(name,email).first<{start_utc:string;google_event_id:string}>();
  if(previous)return Response.json({ok:true,alreadyRan:true,start:previous.start_utc,eventId:previous.google_event_id},{headers:{"Cache-Control":"no-store"}});
  const days=await liveSlots(env);
  // Pick a later date, avoiding tomorrow, in the verified Google Calendar availability.
  const target=days.slice(2).find(d=>d.slots.length);
  if(!target) return Response.json({ok:false,message:"No test slot available"},{status:409});
  const start=target.slots[0];
  const created=await reserve(env,{start,name,email,phone:""},{controlledTest:true});
  const persisted=await env.DB.prepare("SELECT status,google_event_id FROM booking_slots WHERE start_utc=?").bind(start).first<{status:string;google_event_id:string}>();
  const after=await liveSlots(env);
  const unavailable=!after.some(d=>d.slots.includes(start));
  let duplicateRejected=false;
  try{await reserve(env,{start,name,email,phone:""},{controlledTest:true});}
  catch(e){duplicateRejected=e instanceof Error&&/no longer available|just been selected/i.test(e.message);}
  return Response.json({ok:!!(persisted?.status==="confirmed"&&persisted?.google_event_id===created.eventId&&unavailable&&duplicateRejected),
   eventCreated:true,attendee:email,start,eventId:created.eventId,calendarUrl:created.calendarUrl,
   stored:!!(persisted?.status==="confirmed"&&persisted?.google_event_id===created.eventId),
   unavailableAfterBooking:unavailable,duplicateRejected},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  console.error("HUMMIN controlled booking test failed",error instanceof Error?error.message:"unknown");
  return Response.json({ok:false,message:"Test booking failed; check Worker logs and D1 for reconciliation"},{status:500,headers:{"Cache-Control":"no-store"}});
 }
}
