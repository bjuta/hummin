/** Versioned keys prevent rescheduled appointments from reusing an outdated reminder. */
export type BookingEmailKind="booking-confirmation"|"booking-reminder";
export function bookingEmailKey(kind:BookingEmailKind,eventId:string,start:string):string{
 const ms=Date.parse(start);
 if(!eventId||!Number.isFinite(ms))throw Error("Invalid booking email identity");
 return kind+":"+eventId+":"+ms;
}
export function bookingEmailIdentity(kind:BookingEmailKind,id:string):{eventId:string;startMs:number|null}|null{
 const prefix=kind+":";
 if(!id.startsWith(prefix))return null;
 const rest=id.slice(prefix.length);
 const split=rest.lastIndexOf(":");
 if(split<0)return rest?{eventId:rest,startMs:null}:null; // Historic rows have no version.
 const suffix=rest.slice(split+1);
 if(!/^\\d{13}$/.test(suffix))return null;
 const eventId=rest.slice(0,split);
 return eventId?{eventId,startMs:Number(suffix)}:null;
}
