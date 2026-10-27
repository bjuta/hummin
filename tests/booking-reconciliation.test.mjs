import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {reconcileConfirmedBookingChanges,reconcilePendingBookingHolds} from "../app/lib/calendar.server.ts";
import {bookingEmailKey,bookingEmailIdentity} from "../app/lib/booking-email-keys.server.ts";

function harness(initialState="cancelled"){
 const initial=new Date(Date.now()+3*86400000).toISOString();
 let googleState=initialState,googleStart=new Date(Date.parse(initial)+3600000).toISOString();
 let held={id:"booking-test-1",google_event_id:"testevent001",email:"owner@example.org",start_utc:initial,status:"confirmed"};
 const discrepancy=new Map(),audit=[],deletedEmails=[];
 let conflict=false;
 const db={
  prepare(sql){return {
   bind(...args){return {
    sql,args,
    async all(){
     if(sql.startsWith("SELECT id,start_utc,email,google_event_id FROM booking_slots"))return {results:held?[held]:[]};
     throw Error("Unexpected all query: "+sql);
    },
    async first(){
     if(sql.startsWith("SELECT observed_state,observed_start,first_seen_at FROM booking_discrepancies"))return discrepancy.get(args[0])||null;
     throw Error("Unexpected first: "+sql);
    },
    async run(){
     if(sql.startsWith("DELETE FROM booking_discrepancies")){discrepancy.delete(args[0]);return {meta:{changes:1}};}
     if(sql.startsWith("INSERT INTO booking_discrepancies")){
      const previous=discrepancy.get(args[0]);
      const same=previous?.observed_state===args[2]&&previous?.observed_start===args[3];
      discrepancy.set(args[0],{observed_state:args[2],observed_start:args[3],first_seen_at:same?previous.first_seen_at:new Date().toISOString().replace("T"," ").slice(0,19)});
      return {meta:{changes:1}};
     }
     throw Error("Unexpected run query: "+sql);
    }
   };},
   async all(){throw Error("Unbound all")}
  };},
  async batch(actions){
   assert.equal(actions.length,4,"Booking change and outbox cleanup are one transaction");
   const op=actions[0];
   if(conflict&&op.sql.startsWith("UPDATE booking_slots"))throw Error("UNIQUE constraint failed: booking_slots.start_utc");
   assert.ok(held);
   if(op.sql.startsWith("UPDATE booking_slots")){
    assert.equal(op.args[2],held.id);
    held={...held,start_utc:op.args[0],end_utc:op.args[1]};
   }else if(op.sql.startsWith("DELETE FROM booking_slots")){held=null;}
   else throw Error("Unexpected mutation: "+op.sql);
   assert.match(actions[1].sql,/INSERT INTO booking_change_history/);
   audit.push(actions[1].args);
   assert.match(actions[2].sql,/DELETE FROM email_outbox/);
   deletedEmails.push(actions[2].args);
   discrepancy.clear();
   return actions.map(()=>({meta:{changes:1}}));
  }
 };
 const env={DB:db,GOOGLE_CLIENT_ID:"test-id",GOOGLE_CLIENT_SECRET:"test-secret",GOOGLE_REFRESH_TOKEN:"test-token",GOOGLE_CALENDAR_ID:"test-calendar"};
 const request=async url=>{
  if(url.includes("oauth2.googleapis.com"))return {ok:true,async json(){return {access_token:"test-access"}}};
  if(url.includes("googleapis.com/calendar/v3/calendars/")){
   if(googleState==="cancelled")return {status:404,ok:false};
   if(googleState==="missingEnd")return {status:200,ok:true,async json(){return {status:"confirmed",start:{dateTime:googleStart},attendees:[{email:"owner@example.org"}]}}};
   const start=googleState==="unchanged"?initial:googleStart;
   return {status:200,ok:true,async json(){return {status:"confirmed",start:{dateTime:start},end:{dateTime:new Date(Date.parse(start)+1800000).toISOString()},attendees:[{email:"owner@example.org"}]}}};
  }
  throw Error("Unexpected fetch: "+url);
 };
 return {env,request,discrepancy,audit,deletedEmails,booking:()=>held,initial,movedStart:()=>googleStart,
  setConflict(v){conflict=v;},setGoogle(state,start){googleState=state;if(start)googleStart=start;},
  ageObservation(){discrepancy.get("booking-test-1").first_seen_at="2000-01-01 00:00:00";}
 };
}
for(const mode of ["cancelled","moved"]){
 test("Google "+mode+" needs a second aged observation and an audit record",async()=>{
  const h=harness(mode),original=globalThis.fetch;
  globalThis.fetch=h.request;
  try{
   assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,moved:0,deferred:1});
   assert.ok(h.booking());
   assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,moved:0,deferred:1});
   assert.ok(h.booking(),"Immediate recheck must not change appointment");
   h.ageObservation();
   const result=await reconcileConfirmedBookingChanges(h.env);
   assert.deepEqual(result,mode==="cancelled"?{archived:1,moved:0,deferred:0}:{archived:0,moved:1,deferred:0});
   assert.equal(h.audit.length,1);
   assert.equal(h.audit[0][5],mode);
   assert.equal(h.audit[0][3],h.initial);
   if(mode==="moved"){
    assert.ok(h.booking(),"Moving the event must NOT delete HUMMIN booking");
    assert.equal(h.booking().start_utc,h.movedStart());
    assert.equal(h.booking().google_event_id,"testevent001");
    assert.equal(h.audit[0][4],h.movedStart());
   }else assert.equal(h.booking(),null);
  }finally{globalThis.fetch=original;}
 });
}
test("A second Google reschedule produces an independent audit entry",async()=>{
 const h=harness("moved"),saved=globalThis.fetch;globalThis.fetch=h.request;
 try{
  await reconcileConfirmedBookingChanges(h.env);h.ageObservation();
  assert.equal((await reconcileConfirmedBookingChanges(h.env)).moved,1);
  const second=new Date(Date.parse(h.movedStart())+1800000).toISOString();
  h.setGoogle("moved",second);
  assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,moved:0,deferred:1});
  h.ageObservation();
  assert.equal((await reconcileConfirmedBookingChanges(h.env)).moved,1);
  assert.equal(h.audit.length,2);
  assert.equal(h.audit[1][3],h.audit[0][4]);
  assert.equal(h.audit[1][4],second);
  assert.equal(h.booking().start_utc,second);
 }finally{globalThis.fetch=saved;}
});
test("Unique-slot collision and invalid Google end time never discard the booking",async()=>{
 const h=harness("moved"),saved=globalThis.fetch;globalThis.fetch=h.request;
 try{
  await reconcileConfirmedBookingChanges(h.env);h.ageObservation();
  h.setConflict(true);
  assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,moved:0,deferred:1});
  assert.equal(h.booking().start_utc,h.initial);
  assert.equal(h.audit.length,0);
  h.setGoogle("missingEnd");
  assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,moved:0,deferred:1});
  assert.equal(h.booking().start_utc,h.initial);
 }finally{globalThis.fetch=saved;}
});
test("Unchanged appointment is never archived",async()=>{
 const h=harness("unchanged"),original=globalThis.fetch;globalThis.fetch=h.request;
 try{assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,moved:0,deferred:0});assert.ok(h.booking());}
 finally{globalThis.fetch=original;}
});
test("Booking email keys distinguish changes and reject old-time delivery",()=>{
 const oldStart="2026-11-03T09:00:00.000Z",newStart="2026-11-03T10:00:00.000Z",event="google123";
 const first=bookingEmailKey("booking-reminder",event,oldStart);
 const next=bookingEmailKey("booking-reminder",event,newStart);
 assert.notEqual(first,next);
 assert.deepEqual(bookingEmailIdentity("booking-reminder",first),{eventId:event,startMs:Date.parse(oldStart)});
 assert.deepEqual(bookingEmailIdentity("booking-reminder","booking-reminder:"+event),{eventId:event,startMs:null});
 assert.equal(bookingEmailIdentity("booking-reminder","booking-reminder:google123:notatimestamp"),null);
 const mail=fs.readFileSync("app/lib/mail-outbox.server.ts","utf8");
 assert.match(mail,/bookingEmailIdentity/);
 assert.match(mail,/identity.startMs!==null/);
 const recovery=fs.readFileSync("app/lib/booking-mail-recovery.server.ts","utf8");
 assert.match(recovery,/bookingEmailKey\("booking-reminder"/);
});
test("Booking emails revalidate current Google state before sending",()=>{
 const src=fs.readFileSync("app/lib/mail-outbox.server.ts","utf8");
 assert.match(src,/row.kind==="booking-reminder"\|\|row.kind==="booking-confirmation"/);
 assert.match(src,/Date.parse\(calendar.start\)!==Date.parse\(booked.start_utc\)/);
 assert.match(src,/DELETE FROM email_outbox WHERE id=\?/);
});

function pendingHarness(found=false){
 const date=new Date(Date.now()+3*86400000).toISOString(),id="pending-test-1";
 const row={id,email:"owner@example.org",start_utc:date,google_event_id:"googlepending001"};
 const discrepancy=new Map();let held=true,confirmed=false;
 const db={prepare(sql){return {
  async all(){if(sql.includes("FROM booking_slots WHERE status='held'"))return {results:held?[row]:[]};throw Error("Unexpected select: "+sql);},
  bind(...args){return {
  async all(){if(sql.includes("FROM booking_slots WHERE status='held'"))return {results:held?[row]:[]};throw Error("Unexpected select: "+sql);},
  async first(){if(sql.startsWith("SELECT observed_state"))return discrepancy.get(args[0])||null;throw Error("Unexpected first: "+sql);},
  async run(){
   if(sql.startsWith("INSERT INTO booking_discrepancies")){const prior=discrepancy.get(args[0]);discrepancy.set(args[0],{observed_state:args[2],observed_start:args[3],first_seen_at:prior?.first_seen_at||new Date().toISOString().replace("T"," ").slice(0,19)});return {meta:{changes:1}};}
   if(sql.startsWith("DELETE FROM booking_discrepancies")){discrepancy.delete(args[0]);return {meta:{changes:1}};}
   if(sql.startsWith("DELETE FROM booking_slots")){held=false;return {meta:{changes:1}};}
   if(sql.startsWith("UPDATE booking_slots SET status='confirmed'")){held=false;confirmed=true;return {meta:{changes:1}};}
   throw Error("Unexpected run: "+sql);
  }
 };}};}};
 const env={DB:db,GOOGLE_CLIENT_ID:"test-id",GOOGLE_CLIENT_SECRET:"test-secret",GOOGLE_REFRESH_TOKEN:"test-token",GOOGLE_CALENDAR_ID:"test-calendar"};
 const fetcher=async url=>{
  if(url.includes("oauth2.googleapis.com"))return {ok:true,async json(){return {access_token:"test-access"}}};
  if(url.includes("googleapis.com/calendar/v3/calendars/")){
   return found?{ok:true,status:200,async json(){return {status:"confirmed",start:{dateTime:date},attendees:[{email:row.email}]}}}:{ok:false,status:404};
  }
  throw Error("Unexpected Google route");
 };
 return {env,fetcher,discrepancy,held:()=>held,confirmed:()=>confirmed,id};
}
test("Ambiguous Google inserts are not released on a single 404 or immediate repeat",async()=>{
 const h=pendingHarness(),saved=globalThis.fetch;
 globalThis.fetch=h.fetcher;
 try{
  assert.deepEqual(await reconcilePendingBookingHolds(h.env),{confirmed:0,released:0,deferred:1});
  assert.equal(h.discrepancy.get(h.id).observed_state,"missing");
  assert.deepEqual(await reconcilePendingBookingHolds(h.env),{confirmed:0,released:0,deferred:1});
  assert.equal(h.held(),true);
  h.discrepancy.get(h.id).first_seen_at="2000-01-01 00:00:00";
  assert.deepEqual(await reconcilePendingBookingHolds(h.env),{confirmed:0,released:1,deferred:0});
  assert.equal(h.held(),false);
 }finally{globalThis.fetch=saved;}
});
test("Confirmed Google event recovers pending D1 row without a duplicate insert",async()=>{
 const h=pendingHarness(true),saved=globalThis.fetch;globalThis.fetch=h.fetcher;
 try{assert.deepEqual(await reconcilePendingBookingHolds(h.env),{confirmed:1,released:0,deferred:0});assert.equal(h.confirmed(),true);}
 finally{globalThis.fetch=saved;}
});
