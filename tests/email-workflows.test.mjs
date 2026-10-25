import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {queueEmail,deliverDue} from '../app/lib/mail-outbox.server.ts';
import {contactReceivedEmail} from '../app/lib/email-templates.server.ts';

const origin='https://hummin-web-preview.grimpossible.workers.dev';
const email=contactReceivedEmail({name:'Sample Owner',businessName:'Sample Ltd',email:'owner@example.org',message:'We need better follow-up.'},origin);

function memoryEnv(){
 const outbox=new Map(),subscribers=new Map(),issues=new Map();
 const db={prepare(sql){return {bind(...args){
  return {
   async run(){
    if(sql.startsWith('INSERT OR IGNORE INTO email_outbox')){
     if(!outbox.has(args[0]))outbox.set(args[0],{id:args[0],kind:args[1],recipient:args[2],payload:args[3],next_attempt_at:args[4],status:'pending',attempts:0});
     return {meta:{changes:1}};
    }
    if(sql.startsWith("UPDATE email_outbox SET status='sending'")){
     const row=outbox.get(args[1]);if(!row||!['pending','failed','sending'].includes(row.status))return {meta:{changes:0}};
     row.status='sending';row.attempts++;return {meta:{changes:1}};
    }
    if(sql.startsWith("UPDATE email_outbox SET status='sent'")){const row=outbox.get(args[1]);row.status='sent';row.provider_id=args[0];return {meta:{changes:1}};}
    if(sql.startsWith("UPDATE email_outbox SET status='failed'")){const row=outbox.get(args[2]);row.status='failed';row.last_error=args[0];row.next_attempt_at=args[1];return {meta:{changes:1}};}
    if(sql.startsWith('DELETE FROM email_outbox')){outbox.delete(args[0]);return {meta:{changes:1}};}
    return {meta:{changes:0}};
   },
   async all(){
    if(sql.includes('SELECT id,kind,recipient,payload,attempts FROM email_outbox')){
     const now=new Date().toISOString();
     return {results:[...outbox.values()].filter(x=>x.next_attempt_at<=now&&['pending','failed'].includes(x.status))};
    }
    return {results:[]};
   },
   async first(){
    if(sql.includes('FROM newsletter_subscribers'))return {status:subscribers.get(args[0])||'pending'};
    if(sql.includes('FROM newsletter_issues'))return {status:issues.get(args[0])||'draft'};
    return null;
   }
  };
 }};}};
 return {DB:db,RESEND_API_KEY:'test-key',EMAIL_FROM:'HUMMIN <hello@notify.hummin.org>',outbox,subscribers,issues};
}

test('Enqueued mail is sent once with the same idempotency key',async()=>{
 const env=memoryEnv(),savedFetch=globalThis.fetch,headers=[];
 globalThis.fetch=async (_url,opts)=>{headers.push(opts.headers['Idempotency-Key']);return {ok:true,async json(){return {id:'provider-001'}}};};
 try{
  await queueEmail(env,'contact-received:case-001',email);
  assert.equal(env.outbox.get('contact-received:case-001').status,'pending');
  const first=await deliverDue(env);
  assert.deepEqual(first,{sent:1,failed:0});
  assert.equal(env.outbox.get('contact-received:case-001').status,'sent');
  const second=await deliverDue(env);
  assert.deepEqual(second,{sent:0,failed:0});
  assert.deepEqual(headers,['contact-received:case-001']);
 }finally{globalThis.fetch=savedFetch;}
});

test('Provider failures are retained for retry with the same idempotency key',async()=>{
 const env=memoryEnv(),savedFetch=globalThis.fetch;let calls=0;
 globalThis.fetch=async (_url,options)=>{calls++;assert.equal(options.headers['Idempotency-Key'],'contact-received:retry');return calls===1?{ok:false,status:503}:{ok:true,async json(){return {id:'provider-002'}}};};
 try{
  await queueEmail(env,'contact-received:retry',email);
  assert.deepEqual(await deliverDue(env),{sent:0,failed:1});
  assert.equal(env.outbox.get('contact-received:retry').status,'failed');
  env.outbox.get('contact-received:retry').next_attempt_at='2000-01-01T00:00:00.000Z';
  assert.deepEqual(await deliverDue(env),{sent:1,failed:0});
  assert.equal(env.outbox.get('contact-received:retry').attempts,2);
 }finally{globalThis.fetch=savedFetch;}
});

test('Future reminders are not sent before their scheduled time',async()=>{
 const env=memoryEnv(),savedFetch=globalThis.fetch;let called=false;
 globalThis.fetch=async()=>{called=true;throw Error('unexpected call');};
 try{
  await queueEmail(env,'contact-received:later',email,new Date(Date.now()+86400000));
  assert.deepEqual(await deliverDue(env),{sent:0,failed:0});
  assert.equal(called,false);
 }finally{globalThis.fetch=savedFetch;}
});

test('Unconfirmed newsletter subscribers never receive queued editions',async()=>{
 const env=memoryEnv(),savedFetch=globalThis.fetch;let called=false;
 env.subscribers.set('owner@example.org','pending');
 env.issues.set('issue-001','approved');
 globalThis.fetch=async()=>{called=true;throw Error('Unsubscribed subscriber must not be emailed');};
 try{
  const newsletter={...email,type:'newsletter-monthly',recipient:'owner@example.org'};
  await queueEmail(env,'newsletter:issue-001:aabb',newsletter);
  assert.deepEqual(await deliverDue(env),{sent:0,failed:0});
  assert.equal(called,false);
  assert.equal(env.outbox.size,0);
 }finally{globalThis.fetch=savedFetch;}
});


test('Production sender identities route through distinct verified domains',async()=>{
 const env=memoryEnv(),savedFetch=globalThis.fetch,captured=[];
 env.EMAIL_FROM='HUMMIN <hello@hummin.org>';
 env.EMAIL_FROM_PEOPLE='HUMMIN <hello@hummin.org>';
 env.EMAIL_FROM_SYSTEM='HUMMIN Security <security@notify.hummin.org>';
 env.EMAIL_FROM_NEWSLETTER='Notes from HUMMIN <notes@letters.hummin.org>';
 globalThis.fetch=async (_url,options)=>{
  captured.push(JSON.parse(options.body));
  return {ok:true,async json(){return {id:'provider-'+captured.length}}};
 };
 try{
  const contact={...email,type:'contact-internal',sender:'people',recipient:'sales@hummin.org',replyTo:'owner@example.org'};
  const otp={...email,type:'account-sign-in',sender:'system',recipient:'owner@example.org'};
  const optin={...email,type:'newsletter-opt-in',sender:'newsletter',recipient:'owner@example.org'};
  for(const [key,item] of [['contact:sender',contact],['security:sender',otp],['newsletter-optin:sender',optin]]){
   await queueEmail(env,key,item);
   assert.deepEqual(await deliverDue(env),{sent:1,failed:0});
  }
  assert.deepEqual(captured.map(x=>x.from),[
   'HUMMIN <hello@hummin.org>',
   'HUMMIN Security <security@notify.hummin.org>',
   'Notes from HUMMIN <notes@letters.hummin.org>'
  ]);
  assert.equal(captured[0].reply_to,'owner@example.org');
  assert.equal(captured[1].reply_to,'sales@hummin.org');

  env.issues.set('issue-verified','approved');
  env.subscribers.set('owner@example.org','active');
  const issue={...optin,type:'newsletter-monthly',unsubscribeUrl:'https://hummin.org/newsletter/unsubscribe?token=test'};
  await queueEmail(env,'newsletter:issue-verified:recipient',issue);
  assert.deepEqual(await deliverDue(env),{sent:1,failed:0});
  assert.equal(captured[3].from,env.EMAIL_FROM_NEWSLETTER);
  assert.match(captured[3].headers['List-Unsubscribe'],/^<https:\/\/hummin.org\//);
 }finally{globalThis.fetch=savedFetch;}
});

test('Every active email workflow has a real trigger or explicit feature gate',()=>{
 const read=p=>fs.readFileSync(p,'utf8');
 assert.match(read('app/routes/contact.tsx'),/email_outbox/);
 assert.match(read('app/routes/assessment.email.ts'),/assessmentResultsEmail/);
 assert.match(read('app/routes/booking.reserve.ts'),/bookingConfirmationEmail/);
 assert.match(read('app/lib/booking-mail-recovery.server.ts'),/bookingReminderEmail/);
 assert.match(read('app/routes/newsletter.tsx'),/status='pending'/);
 assert.match(read('app/routes/newsletter.confirm.tsx'),/status='active'/);
 assert.match(read('app/routes/newsletter.unsubscribe.tsx'),/status='unsubscribed'/);
 assert.match(read('app/lib/newsletter-runner.server.ts'),/status='approved'/);
 assert.match(read('workers/app.ts'),/scheduled\(/);
});
