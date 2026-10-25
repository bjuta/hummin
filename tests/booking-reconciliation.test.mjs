import test from "node:test";
import assert from "node:assert/strict";
import {reconcileConfirmedBookingChanges} from "../app/lib/calendar.server.ts";
import fs from "node:fs";

function harness(state="cancelled"){
 const start=new Date(Date.now()+3*86400000).toISOString();
 const movedStart=new Date(Date.parse(start)+3600000).toISOString();
 const booking={id:"booking-test-1",google_event_id:"testevent001",email:"owner@example.org",start_utc:start,status:"confirmed"};
 const discrepancy=new Map(),audits=[],batchCalls=[];
 let booked=true;
 const db={
  prepare(sql){return {
   bind(...args){return {
    async all(){
     if(sql.startsWith("SELECT id,start_utc,email,google_event_id FROM booking_slots"))return {results:booked?[booking]:[]};
     throw Error("Unexpected all query: "+sql);
    },
    async first(){
     if(sql.startsWith("SELECT observed_state,observed_start,first_seen_at FROM booking_discrepancies"))return discrepancy.get(args[0])||null;
     throw Error("Unexpected first query: "+sql);
    },
    async run(){
     if(sql.startsWith("DELETE FROM booking_discrepancies")){discrepancy.delete(args[0]);return {meta:{changes:1}};}
     if(sql.startsWith("INSERT INTO booking_discrepancies")){
      const previous=discrepancy.get(args[0]);
      const matches=previous?.observed_state===args[2]&&previous?.observed_start===args[3];
      discrepancy.set(args[0],{observed_state:args[2],observed_start:args[3],first_seen_at:matches?previous.first_seen_at:"2000-01-01 00:00:00"});
      return {meta:{changes:1}};
     }
     throw Error("Unexpected run query: "+sql);
    }};},
   async all(){throw Error("Unbound all");}
  };},
  async batch(queries){
   batchCalls.push(queries.map(q=>q.sql));
   assert.equal(queries.length,4);
   const first=queries[0];
   audits.push(first.args);
   booked=false;discrepancy.clear();
   return queries.map(()=>({meta:{changes:1}}));
  }
 };
 // Return statements with data visible to the batch mock.
 const orig=db.prepare.bind(db);
 db.prepare=(sql)=>{
  const stmt=orig(sql),bind=stmt.bind.bind(stmt);
  stmt.bind=(...args)=>({...bind(...args),sql,args});
  return stmt;
 };
 const env={DB:db,GOOGLE_CLIENT_ID:"test-id",GOOGLE_CLIENT_SECRET:"test-secret",GOOGLE_REFRESH_TOKEN:"test-token",GOOGLE_CALENDAR_ID:"test-calendar"};
 const request=async url=>{
  if(url.includes("oauth2.googleapis.com"))return {ok:true,async json(){return {access_token:"test-access"}}};
  if(url.includes("googleapis.com/calendar/v3/calendars/")){
   if(state==="cancelled")return {status:404,ok:false};
   if(state==="moved")return {status:200,ok:true,async json(){return {status:"confirmed",start:{dateTime:movedStart},end:{dateTime:new Date(Date.parse(movedStart)+1800000).toISOString()},attendees:[{email:booking.email}]}}};
   if(state==="unchanged")return {status:200,ok:true,async json(){return {status:"confirmed",start:{dateTime:start},attendees:[{email:booking.email}]}}};
  }
  throw Error("Unexpected external call");
 };
 return {env,request,discrepancy,audits,batchCalls,booked:()=>booked,start,movedStart};
}
for(const mode of ["cancelled","moved"]){
 test("Google "+mode+" requires repeat observation and archives the old slot",async()=>{
  const h=harness(mode),original=globalThis.fetch;
  globalThis.fetch=h.request;
  try{
   assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,deferred:1});
   assert.equal(h.booked(),true);
   assert.equal(h.discrepancy.size,1);
   assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:1,deferred:0});
   assert.equal(h.booked(),false);
   assert.equal(h.audits.length,1);
   assert.equal(h.audits[0][4],mode);
   if(mode==="moved")assert.equal(h.audits[0][3],h.movedStart);
  }finally{globalThis.fetch=original;}
 });
}
test("Stable Google event never archives a booking",async()=>{
 const h=harness("unchanged"),original=globalThis.fetch;
 globalThis.fetch=h.request;
 try{assert.deepEqual(await reconcileConfirmedBookingChanges(h.env),{archived:0,deferred:0});assert.equal(h.booked(),true);}
 finally{globalThis.fetch=original;}
});
test("Booking emails validate current Google state before sending",()=>{
 const src=fs.readFileSync("app/lib/mail-outbox.server.ts","utf8");
 assert.match(src,/row.kind==="booking-reminder"\|\|row.kind==="booking-confirmation"/);
 assert.match(src,/Date.parse\(calendar.start\)!==Date.parse\(booked.start_utc\)/);
 assert.match(src,/DELETE FROM email_outbox WHERE id=\?/);
});
