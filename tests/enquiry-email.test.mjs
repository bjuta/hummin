import test from 'node:test';
import assert from 'node:assert/strict';
import { enquiryNotification,enquiryAcknowledgement } from '../app/lib/enquiry-email.server.ts';
import {
 contactInternalEmail,contactReceivedEmail,assessmentResultsEmail,
 bookingConfirmationEmail,bookingReminderEmail,signInCodeEmail,
 accountWelcomeEmail,accountPasswordResetEmail,monthlyNewsletterEmail
} from '../app/lib/email-templates.server.ts';
import {emailTypes} from '../app/lib/email-brand.server.ts';
import {newsletterOptInEmail} from '../app/lib/email-templates.server.ts';

const origin='https://hummin-web-preview.grimpossible.workers.dev';
const contact={name:'Wanjiru Kamau',businessName:'Kamau Hardware',email:'wanjiru@example.co.ke',message:'We get plenty of calls but I am not sure how many turn into sales.'};
const appt={recipient:contact.email,name:contact.name,start:new Date('2026-11-04T07:00:00Z'),end:new Date('2026-11-04T07:30:00Z'),host:'Muiruri Beautah',meetUrl:'https://meet.google.com/abc-defg-hij',calendarUrl:'https://calendar.google.com/calendar/event?eid=abc',assetOrigin:origin};

const mails=[
 contactInternalEmail(contact,{reference:'aa11bb22',assetOrigin:origin,sentAt:new Date('2026-10-28T07:42:00Z')}),
 contactReceivedEmail(contact,origin),
 assessmentResultsEmail({recipient:contact.email,name:contact.name,goal:'grow sales',score:58,estimatedCostKes:312000,priorities:[{label:'Priority 1',value:'Customers'},{label:'Priority 2',value:'Information'},{label:'Priority 3',value:'Operations'}],bookingUrl:'https://hummin.org/assessment',resultsUrl:'https://hummin.org/assessment',assetOrigin:origin}),
 bookingConfirmationEmail(appt),
 bookingReminderEmail(appt),
 signInCodeEmail({recipient:contact.email,name:contact.name,code:'482913',expiresMinutes:10,assetOrigin:origin}),
 accountWelcomeEmail({recipient:contact.email,name:contact.name,code:'730418',expiresMinutes:30,assetOrigin:origin}),
 accountPasswordResetEmail({recipient:contact.email,resetUrl:'https://hummin.org/reset?token=sample',expiresMinutes:30,assetOrigin:origin}),
 monthlyNewsletterEmail({recipient:contact.email,month:'November 2026',title:'Why enquiries go unanswered.',preheader:'Why enquiries go unanswered, and a 30-day fix.',paragraphs:['Most owners we meet get more enquiries than they think.'],articleUrl:'https://hummin.org/notes',unsubscribeUrl:'https://hummin.org/unsubscribe?token=sample',assetOrigin:origin})
];
test('All nine brand-book email types are present, unique, and complete',()=>{
 assert.equal(emailTypes.length,11);
 assert.deepEqual(mails.map(x=>x.type),emailTypes.slice(0,9));
 assert.equal(newsletterOptInEmail({recipient:contact.email,confirmUrl:origin+'/newsletter/confirm?token=sample',assetOrigin:origin}).type,'newsletter-opt-in');
 for(const x of mails){
  assert.ok(x.subject && x.preheader && x.text && x.html && x.recipient);
  assert.match(x.html,/max-width:600px/);
  assert.match(x.html,/mark-light\.png/);
  assert.match(x.html,/mark-dark\.png/);
  assert.match(x.html,/motif\.svg/);
  assert.match(x.html,/#1E272A/);
  assert.match(x.html,/#B5532C/);
  assert.match(x.html,/Embedded advisory and execution/);
  assert.match(x.html,/lang="en"/);
  assert.match(x.html,/mso/);
  assert.ok(!x.html.includes('—'));
  assert.ok(!x.text.includes('—'));
 }
});

test('Internal enquiry is addressed only to HUMMIN with correct reply action',()=>{
 const x=enquiryNotification(contact,'aa11bb22',origin);
 assert.equal(x.recipient,'sales@hummin.org');
 assert.equal(x.replyTo,contact.email);
 assert.equal(x.subject,'New enquiry: Wanjiru Kamau, Kamau Hardware');
 assert.match(x.html,/mailto:wanjiru@example.co.ke/);
 assert.match(x.html,/Kamau Hardware/);
 assert.match(x.html,/aa11bb22/);
});

test('Enquiry receipt is addressed to the visitor and includes their message',()=>{
 const x=enquiryAcknowledgement(contact,origin);
 assert.equal(x.recipient,contact.email);
 assert.equal(x.replyTo,'sales@hummin.org');
 assert.equal(x.subject,'We received your enquiry');
 assert.match(x.text,/plenty of calls/);
 assert.match(x.html,/Business Assessment/);
});

test('Dynamic values are escaped, and actionable links cannot use script URLs',()=>{
 const x=contactInternalEmail({...contact,name:'A <script>',businessName:'A & B',message:'<script>alert("hi")</script>'},{reference:'sample',assetOrigin:origin});
 assert.ok(!x.html.includes('<script>alert'));
 assert.match(x.html,/A &lt;script&gt;/);
 assert.match(x.html,/A &amp; B/);
 assert.match(x.text,/<script>alert/);
 assert.throws(()=>accountPasswordResetEmail({recipient:contact.email,resetUrl:'javascript:alert(1)',expiresMinutes:30,assetOrigin:origin}));
});

test('Both account codes are six contiguous digits and have expiries',()=>{
 assert.match(mails[5].html,/482913/);
 assert.match(mails[6].html,/730418/);
 assert.match(mails[5].html,/Expires in 10 minutes/);
 assert.throws(()=>signInCodeEmail({recipient:contact.email,name:contact.name,code:'123',expiresMinutes:10,assetOrigin:origin}));
});
test('Booking and newsletter links are real, and sender rules follow brand book',()=>{
 assert.equal(mails[3].sender,'people');
 assert.equal(mails[5].sender,'system');
 assert.equal(mails[8].sender,'people');
 assert.match(mails[3].html,/meet\.google\.com/);
 assert.match(mails[8].text,/unsubscribe/);
 assert.match(mails[8].html,/Notes from HUMMIN/);
});

test('Newsletter verification is never confused with a monthly edition',()=>{
 const mail=newsletterOptInEmail({recipient:contact.email,confirmUrl:origin+'/newsletter/confirm?token=abc',assetOrigin:origin});
 assert.equal(mail.type,'newsletter-opt-in');
 assert.match(mail.html,/Confirm Subscription/);
 assert.match(mail.text,/confirm/);
});
