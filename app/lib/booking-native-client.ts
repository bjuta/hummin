/** Native booking client for the existing provider-backed API.
 * No mock availability. All network access is explicit and user-initiated.
 * Preview must not call reserveLiveBookingSlot without a dedicated isolated provider.
 */
export type SlotDay={date:string;slots:string[]};
export type Availability={enabled:boolean;days:SlotDay[];siteKey?:string;message?:string};
export type BookingInput={
 start:string;name:string;email:string;phone:string;turnstileToken:string;
};
export type BookingConfirmation={
 eventId:string;calendarUrl:string;meetUrl:string;emailQueued:boolean;
};
export type BookingAttempt=
 |{ok:true;confirmation:BookingConfirmation}
 |{ok:false;message:string;status:number};
export type FetchLike=(input:string,init?:RequestInit)=>Promise<Response>;
const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const day=/^\d{4}-\d{2}-\d{2}$/;
const safeSlot=(value:unknown,now:number):value is string=>
 typeof value==="string"&&iso.test(value)&&Number.isFinite(Date.parse(value))&&Date.parse(value)>now;

export function decodeProviderAvailability(raw:unknown,now=Date.now()):Availability{
 if(!raw||typeof raw!=="object")return {enabled:false,days:[],message:"Availability is unavailable."};
 const value=raw as Record<string,unknown>;
 if(value.enabled!==true)return {enabled:false,days:[],
  message:typeof value.message==="string"?value.message:"Live booking is not configured."};
 if(!Array.isArray(value.days)||value.days.length>30)return {enabled:false,days:[],message:"Invalid availability response."};
 const seen=new Set<string>();
 const days:SlotDay[]=[];
 for(const entry of value.days){
  if(!entry||typeof entry!=="object")return {enabled:false,days:[],message:"Invalid availability response."};
  const d=entry as Record<string,unknown>;
  if(typeof d.date!=="string"||!day.test(d.date)||!Array.isArray(d.slots)||
     d.slots.length>48)return {enabled:false,days:[],message:"Invalid availability response."};
  const slots:string[]=[];
  for(const candidate of d.slots){
   if(!safeSlot(candidate,now)||seen.has(candidate))
    return {enabled:false,days:[],message:"Invalid availability response."};
   seen.add(candidate);slots.push(candidate);
  }
  days.push({date:d.date,slots});
 }
 return {enabled:true,days,
  siteKey:typeof value.siteKey==="string"?value.siteKey:undefined};
}
export async function requestLiveBookingSlots(fetcher:FetchLike=fetch):Promise<Availability>{
 try{
  const response=await fetcher("/api/booking/slots",{
   method:"GET",credentials:"same-origin",cache:"no-store",headers:{"Accept":"application/json"}
  });
  if(!response.ok)return {enabled:false,days:[],message:"Live availability is temporarily unavailable."};
  return decodeProviderAvailability(await response.json());
 }catch{return {enabled:false,days:[],message:"Live availability could not be checked."};}
}
export function validateBookingInput(input:BookingInput):boolean{
 return !!(safeSlot(input.start,Date.now())&&input.name.trim().length>=2&&input.name.trim().length<=120&&
  input.email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())&&
  input.phone.length<=40&&input.turnstileToken.length>0&&input.turnstileToken.length<=2048);
}
/** Explicitly invoked after Turnstile and provider availability are present.
 * Only a successful response with a provider event id is a confirmed booking.
 */
export async function reserveLiveBookingSlot(input:BookingInput,
 fetcher:FetchLike=fetch):Promise<BookingAttempt>{
 if(!validateBookingInput(input))return {ok:false,status:400,message:"Please complete the booking details and security check."};
 try{
  const res=await fetcher("/api/booking/reserve",{
   method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept":"application/json"},
   body:JSON.stringify(input)
  });
  const result=await res.json() as {
   ok?:boolean;message?:string;eventId?:string;calendarUrl?:string;meetUrl?:string;emailQueued?:boolean
  };
  if(!res.ok||result.ok!==true||!result.eventId?.trim())
   return {ok:false,status:res.status,message:result.message||"Booking could not be confirmed."};
  return {ok:true,confirmation:{
   eventId:result.eventId,calendarUrl:result.calendarUrl||"",
   meetUrl:result.meetUrl||"",emailQueued:result.emailQueued===true
  }};
 }catch{return {ok:false,status:503,message:"Booking verification is unavailable. No appointment is confirmed."};}
}
