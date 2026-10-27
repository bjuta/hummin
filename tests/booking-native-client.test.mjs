import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {decodeProviderAvailability,requestLiveBookingSlots,reserveLiveBookingSlot,
 validateBookingInput} from "../app/lib/booking-native-client.ts";

const time=new Date(Date.now()+48*3600_000);
time.setUTCSeconds(0,0);
const slot=time.toISOString().replace(/:\d\d\.000Z$/,":00.000Z");
const valid={start:slot,name:"Preview Visitor",email:"visitor@example.test",phone:"",
 turnstileToken:"unit-test-token-not-real"};
const days=[{date:slot.slice(0,10),slots:[slot]}];

test("Only provider-returned UTC slots can be displayed as availability",()=>{
 assert.deepEqual(decodeProviderAvailability({enabled:false,days,siteKey:"x"}).days,[]);
 assert.deepEqual(decodeProviderAvailability({enabled:true,days,siteKey:"x"}).days,days);
 assert.equal(decodeProviderAvailability({enabled:true,days:[{date:"2026-10-30",slots:[slot,slot]}]}).enabled,false);
 assert.equal(decodeProviderAvailability({enabled:true,days:[{date:"not-a-date",slots:[slot]}]}).enabled,false);
 assert.equal(decodeProviderAvailability({enabled:true,days:[{date:"2026-10-30",slots:["09:00"]}]}).enabled,false);
 assert.equal(decodeProviderAvailability({enabled:true,days:[]}).enabled,true);
});
test("Availability makes only a GET; disabled or failed provider creates no fake time slots",async()=>{
 const seen=[];
 const fetcher=async(url,init)=>{seen.push({url,method:init.method});return Response.json({enabled:true,days,siteKey:"test-key"});};
 const response=await requestLiveBookingSlots(fetcher);
 assert.deepEqual(seen,[{url:"/api/booking/slots",method:"GET"}]);
 assert.deepEqual(response.days,days);
 const failed=await requestLiveBookingSlots(async()=>new Response("",{status:503}));
 assert.deepEqual(failed.days,[]);
 assert.equal(failed.enabled,false);
});
test("A missing Turnstile token never submits a reservation",async()=>{
 const seen=[];
 assert.equal(validateBookingInput({...valid,turnstileToken:""}),false);
 const r=await reserveLiveBookingSlot({...valid,turnstileToken:""},async(...args)=>{seen.push(args);throw Error("Must not send");});
 assert.equal(r.ok,false);
 assert.equal(r.status,400);
 assert.equal(seen.length,0);
});
test("409 and misleading HTTP 200 without event ID never claim booking",async()=>{
 const conflict=await reserveLiveBookingSlot(valid,async()=>Response.json({
  ok:false,message:"That time has been taken."},{status:409}));
 assert.equal(conflict.ok,false);
 assert.equal(conflict.status,409);
 const fake=await reserveLiveBookingSlot(valid,async()=>Response.json({ok:true,emailQueued:true}));
 assert.equal(fake.ok,false);
});
test("Only an explicitly requested server-verified event produces a confirmation",async()=>{
 let called=0;
 const fetcher=async(url,init)=>{
  called++;
  assert.equal(url,"/api/booking/reserve");
  assert.equal(init.method,"POST");
  assert.equal(JSON.parse(init.body).start,slot);
  return Response.json({ok:true,eventId:"google-event-confirmed",calendarUrl:"https://calendar.google.com/event",
   meetUrl:"https://meet.google.com/sample",emailQueued:false});
 };
 const response=await reserveLiveBookingSlot(valid,fetcher);
 assert.equal(response.ok,true);
 assert.equal(response.confirmation.eventId,"google-event-confirmed");
 assert.equal(response.confirmation.emailQueued,false);
 assert.equal(called,1);
});
test("Preview retains a disabled booking UI until isolated calendar credentials and consent exist",()=>{
 const assessment=fs.readFileSync("app/lib/assessment-native.ts","utf8");
 const native=fs.readFileSync("app/components/SourceAssessmentInteractive.tsx","utf8");
 assert.match(assessment,/showBooking:false/);
 assert.doesNotMatch(native,/reserveLiveBookingSlot|fetch\("\/api\/booking\/reserve"/);
 const server=fs.readFileSync("app/routes/booking.reserve.ts","utf8");
 assert.match(server,/verifyBookingTurnstile/);
 assert.match(server,/reserve\(env,/);
});
