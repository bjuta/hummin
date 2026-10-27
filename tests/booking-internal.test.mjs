import test from "node:test";
import assert from "node:assert/strict";
import {reconcileBookingEmails} from "../app/lib/booking-mail-recovery.server.ts";
import {deliverDue} from "../app/lib/mail-outbox.server.ts";
import {bookingEmailKey} from "../app/lib/booking-email-keys.server.ts";

const start="2026-10-28T07:00:00.000Z",eventId="22d4e993bbdd4fb0b2ec9532db51ee60";
const booking={start_utc:start,end_utc:"2026-10-28T07:30:00.000Z",name:"J B",
 email:"grimpossible@gmail.com",phone:"0712345678",google_event_id:eventId,status:"confirmed"};
function fixture(){
 const outbox=new Map(),calls=[];
 const guestKey=bookingEmailKey("booking-confirmation",eventId,start);
 const reminderKey=bookingEmailKey("booking-reminder",eventId,start);
 for(const id of [guestKey,reminderKey])outbox.set(id,{id,status:"sent",kind:id.split(":")[0],next_attempt_at:start,attempts:1});
 const db={prepare(sql){return {bind(...args){return {
   async all(){
    if(sql.startsWith("SELECT start_utc,end_utc,name,email,phone,google_event_id"))return {results:[booking]};
    if(sql.startsWith("SELECT id FROM email_outbox WHERE id IN"))return {results:args.filter(x=>outbox.has(x)).map(id=>({id}))};
    if(sql.startsWith("SELECT id,kind,recipient,payload,attempts FROM email_outbox")){
     return {results:[...outbox.values()].filter(x=>x.status==="pending"&&x.next_attempt_at<=new Date().toISOString())};
    }
    throw Error("Unexpected query: "+sql);
   },
   async first(){
    if(sql.startsWith("SELECT start_utc,status FROM booking_slots"))return {start_utc:start,status:"confirmed"};
    throw Error("Unexpected first: "+sql);
   },
   async run(){
    if(sql.startsWith("INSERT OR IGNORE INTO email_outbox")){
     if(!outbox.has(args[0]))outbox.set(args[0],{id:args[0],kind:args[1],recipient:args[2],payload:args[3],next_attempt_at:args[4],status:"pending",attempts:0});
     return {meta:{changes:1}};
    }
    if(sql.startsWith("UPDATE email_outbox SET status='sending'")){const x=outbox.get(args[1]);x.status="sending";x.attempts++;return {meta:{changes:1}};}
    if(sql.startsWith("UPDATE email_outbox SET status='sent'")){const x=outbox.get(args[1]);x.status="sent";x.provider_id=args[0];return {meta:{changes:1}};}
    if(sql.startsWith("DELETE FROM email_outbox")){outbox.delete(args[0]);return {meta:{changes:1}};}
    if(sql.startsWith("UPDATE email_outbox SET status='failed'")){const x=outbox.get(args[2]);x.status="failed";return {meta:{changes:1}};}
    throw Error("Unexpected run: "+sql);
   }
  };}};}};
 const env={DB:db,SITE_URL:"https://hummin-web-production.grimpossible.workers.dev",
 RESEND_API_KEY:"dummy",EMAIL_FROM:"HUMMIN <hello@hummin.org>",EMAIL_FROM_PEOPLE:"HUMMIN <hello@hummin.org>",
 GOOGLE_CLIENT_ID:"test",GOOGLE_CLIENT_SECRET:"test",GOOGLE_REFRESH_TOKEN:"test",GOOGLE_CALENDAR_ID:"test"};
 let cancelled=false;
 const fetcher=async (url,opts)=>{
  if(String(url).includes("oauth2.googleapis.com"))return {ok:true,async json(){return {access_token:"test"}}};
  if(String(url).includes("googleapis.com/calendar/v3/calendars/"))return cancelled?
   {ok:false,status:404}:{ok:true,status:200,async json(){return {status:"confirmed",start:{dateTime:start},end:{dateTime:booking.end_utc},hangoutLink:"https://meet.google.com/abc-defg-hij",htmlLink:"https://calendar.google.com/calendar/event?eid=one",attendees:[{email:booking.email}]}}};
  if(String(url)==="https://api.resend.com/emails"){
   const body=JSON.parse(opts.body);calls.push(body);
   return {ok:true,async json(){return {id:"provider-test"}}};
  }
  throw Error("Unexpected fetch");
 };
 return {env,outbox,calls,fetcher,cancel(){cancelled=true}};
}
test("Missing sales notification is recovered once for an already confirmed booking",async()=>{
 const f=fixture(),original=globalThis.fetch;globalThis.fetch=f.fetcher;
 try{
  assert.equal(await reconcileBookingEmails(f.env),1);
  assert.equal(await reconcileBookingEmails(f.env),0);
  const key=bookingEmailKey("booking-internal",eventId,start),mail=f.outbox.get(key);
  assert.ok(mail);
  assert.equal(mail.recipient,"sales@hummin.org");
  const content=JSON.parse(mail.payload);
  assert.equal(content.replyTo,"grimpossible@gmail.com");
  assert.match(content.subject,/New booking:/);
  assert.match(content.text,/Wednesday, 28 October 2026/);
  assert.match(content.text,/0712345678/);
  assert.match(content.text,/10:00/);
  assert.deepEqual(await deliverDue(f.env),{sent:1,failed:0});
  assert.equal(f.calls.length,1);
  assert.deepEqual(f.calls[0].to,["sales@hummin.org"]);
  assert.equal(f.calls[0].reply_to,"grimpossible@gmail.com");
  assert.match(f.calls[0].html,/HUMMIN/);
  assert.deepEqual(await deliverDue(f.env),{sent:0,failed:0});
 }finally{globalThis.fetch=original;}
});
test("Cancelled booking never delivers its queued internal alert",async()=>{
 const f=fixture(),original=globalThis.fetch;globalThis.fetch=f.fetcher;
 try{
  assert.equal(await reconcileBookingEmails(f.env),1);
  f.cancel();
  assert.deepEqual(await deliverDue(f.env),{sent:0,failed:0});
  assert.equal(f.calls.length,0);
  assert.ok(!f.outbox.has(bookingEmailKey("booking-internal",eventId,start)));
 }finally{globalThis.fetch=original;}
});
