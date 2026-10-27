import type {HumminEnv} from "../../workers/app";
import {deliverDue} from "../lib/mail-outbox.server.ts";
import {queueApprovedNewsletters} from "../lib/newsletter-runner.server.ts";
import {reconcileBookingEmails} from "../lib/booking-mail-recovery.server.ts";
import {reconcilePendingBookingHolds,reconcileConfirmedBookingChanges} from "./calendar.server.ts";
import {pruneBookingRateLimits} from "./booking-abuse.server.ts";
export async function runMailWorker(env:HumminEnv){
 if(!env.DB)return {sent:0,failed:0};
 await reconcilePendingBookingHolds(env).catch(e=>console.error("Pending booking reconciliation deferred",e instanceof Error?e.message:"unknown"));
 await reconcileConfirmedBookingChanges(env).catch(e=>console.error("Confirmed booking reconciliation deferred",e instanceof Error?e.message:"unknown"));
 await pruneBookingRateLimits(env).catch(e=>console.error("Booking quota cleanup deferred",e instanceof Error?e.message:"unknown"));
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM)return {sent:0,failed:0};
 await reconcileBookingEmails(env).catch(e=>console.error("Booking reconciliation deferred",e instanceof Error?e.message:"unknown"));
 await queueApprovedNewsletters(env).catch(e=>console.error("Newsletter queue deferred",e instanceof Error?e.message:"unknown"));
 return deliverDue(env,15);
}
