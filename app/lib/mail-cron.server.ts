import type {HumminEnv} from "../../workers/app";
import {deliverDue} from "../lib/mail-outbox.server.ts";
export async function runMailWorker(env:HumminEnv){
 if(!env.DB||!env.RESEND_API_KEY||!env.EMAIL_FROM)return {sent:0,failed:0};
 return deliverDue(env,15);
}
