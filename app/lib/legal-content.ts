
/** Transcribed from the user-supplied HUMMIN Website (standalone) (5).html
 * bundled "HUMMIN Legal" component. Maintain copy + section order as source.
 */
export type LegalBlock={t:"p"|"note";text:string}|{t:"dl";items:[string,string][]};
export type LegalSection=[string,LegalBlock[]];
export type LegalDoc={title:string;lead:string;meta:string;other:"privacy"|"terms";otherLabel:string;sections:LegalSection[]};
const P=(text:string):LegalBlock=>({t:"p",text});
const L=(items:[string,string][]):LegalBlock=>({t:"dl",items});
const N=(text:string):LegalBlock=>({t:"note",text});
export const LEGAL_DOCS:Record<"privacy"|"terms",LegalDoc>={
privacy:{
 title:"Privacy notice.",
 lead:"What HUMMIN collects, why we need it, and how to reach us about your information.",
 meta:"Last updated: 26 October 2026 · HUMMIN, Nairobi, Kenya",
 other:"terms",otherLabel:"Read the Terms of Use",
 sections:[
 ["Who is responsible?",[P("HUMMIN provides advisory and execution support to businesses in Kenya. For information submitted through this website, HUMMIN determines how that information is used. Questions and privacy requests can be sent to sales@hummin.org.")]],
 ["Information we receive",[L([
  ["Enquiries","your name, business, email address and the message you send."],
  ["Business Assessment","your name, business, email address, goal, assessment score and the priorities or cost estimates generated from your answers when you request an emailed copy. Your results are estimates, not independently audited financial information."],
  ["Appointments","your name, email address, phone number if provided, selected time, invitation details and Google Meet link."],
  ["Notes from HUMMIN","your email address and subscription or unsubscribe status."],
  ["Website operation","aggregated page-visit counts by page and broad referral category, plus the security and operational information our hosting, email and anti-abuse services need to process requests."],
  ["HUMMIN team access","account identity, authentication and activity records for authorised staff using the administration area."]
 ]),N("Please avoid sending sensitive personal information, passwords, identification documents or confidential third-party records through open enquiry forms or assessment answers.")]],
 ["What we use it for",[
  P("We use information to respond to questions you initiate, provide your requested assessment results, arrange and manage consultations, send booking confirmations and reminders, manage an ongoing business relationship, operate the website and protect it against misuse."),
  P("For those activities we rely, as applicable, on taking steps you request before a business relationship, fulfilling agreed services, and our legitimate interest in managing enquiries and keeping services secure. Where consent is required for a particular activity, we ask for it separately."),
  P("Newsletters are optional. Requesting an assessment, enquiring, or booking does not automatically subscribe you. Notes from HUMMIN is sent only after you confirm a separate subscription, and each edition includes an unsubscribe option.")
 ]],
 ["Providers and international processing",[
  P("We use Cloudflare for website hosting, security and database services; Google Calendar and Meet for appointments; and Resend to send transaction and subscription emails. These providers receive only information needed for the relevant task. Appointment invitations share the details of the booking with the invited attendee through Google Calendar."),
  P("Some providers may process or store information outside Kenya. Cross-border processing is subject to applicable data protection requirements and safeguards. We do not sell the personal information submitted through these forms.")
 ]],
 ["Cookies, security and measurement",[
  P("The administration area uses authentication sessions. Cloudflare Turnstile may process technical information to check that forms are being used by a real visitor. Our website records aggregate daily page counts and broad referral categories rather than building individual visitor profiles from those counts."),
  P("Embedded provider resources, including Google Fonts and calendar or security services, may also receive technical request information. We do not use your enquiry or assessment submission to enrol you in promotional email.")
 ]],
 ["How long information is kept",[
  P("We keep enquiry and assessment information while it is needed to answer you, provide the service you requested, and maintain appropriate business records. Appointment records and related messages are kept as needed to administer meetings and resolve changes or disputes. Newsletter records are maintained while you remain subscribed or as necessary to honour an unsubscribe request. Security records are reviewed and deleted when no longer required."),
  P("Retention depends on the purpose, any ongoing relationship, and legal or record-keeping obligations. You may ask us to review or delete information that is no longer needed. We cannot always delete records immediately when a legal obligation or live service requirement requires their retention.")
 ]],
 ["Your choices and rights",[
  P("Kenya's Data Protection Act provides rights relating to notice, access, correction, objection and deletion. Other rights may apply depending on the circumstances. You can ask us what personal information we hold, request correction or deletion, object to a use, or withdraw consent where processing depends on it."),
  N("Email sales@hummin.org with “Privacy request” in the subject. We may need to verify your identity before acting on the request. You may also raise concerns with Kenya's Office of the Data Protection Commissioner.")
 ]],
 ["Changes to this notice",[P("We may revise this notice when our services or data practices change. The date at the top shows the current version. Material changes will be reflected here.")]]
 ]},
terms:{
 title:"Terms of use.",
 lead:"The rules for using hummin.org, including the Business Assessment, Insights, downloads and booking a call.",
 meta:"Last updated: 26 October 2026 · HUMMIN, Nairobi, Kenya",
 other:"privacy",otherLabel:"Read the Privacy Notice",
 sections:[
 ["About these terms",[
 P("These terms apply when you use hummin.org, run by HUMMIN of Nairobi, Kenya. By using the website you agree to them. If you do not agree, please do not use the website."),
 P("These terms cover the website only. When you engage HUMMIN for a Review, Project or Residency, a separate written agreement sets out the scope, fees and responsibilities for that work. If that agreement and these terms differ, the agreement applies.")
 ]],
 ["Using the website",[
 P("You may use the website to learn about HUMMIN, read Insights, take the Business Assessment, download our tools, contact us and book a call."),
 L([
 ["Please do","give accurate details when you contact us, take the assessment or book a call."],
 ["Please do not","misuse the website, try to gain access to areas you are not authorised to use, interfere with its security, or submit content that is unlawful, misleading or harmful."],
 ["Automated use","do not use bots or scripts to submit forms, scrape content in bulk or test the website without our written permission."]
 ])]],
 ["The Business Assessment",[
 P("The assessment gives a score, an estimate of what gaps may cost your business and a 30-day plan, based only on the answers you give. The results are estimates, not independently audited financial information, and they are not financial, legal, tax or accounting advice."),
 P("Use the results as a starting point for your own decisions. If you need advice for your circumstances, speak to us or to a qualified professional.")
 ]],
 ["Insights and downloads",[
 P("Our articles, checklists and templates are general information for owners of businesses. They may not suit every business, and they do not replace advice for your specific situation."),
 P("You may use our checklists and templates inside your own business, and share links to our articles. Please do not resell them, publish them as your own, or remove the HUMMIN name from them."),
 P("Guest partner articles are written by the named partner. They reflect that partner’s views, and the partner is responsible for their professional content.")
 ]],
 ["Booking a call",[
 P("A first call is free and does not commit you or us to any further work. To change or cancel a booking, reply to the calendar invitation or email sales@hummin.org. Please give us as much notice as you can."),
 P("We may need to move a booking at short notice. If we do, we will contact you to offer another time.")
 ]],
 ["Our content and name",[
 P("The HUMMIN name, logo, hummingbird mark, website design, text, tools and images belong to HUMMIN or to the people who licensed them to us. You may not copy or use them for commercial purposes without our written permission, except as these terms allow.")
 ]],
 ["Other websites and services",[
 P("The website links to and uses other services, including Google Calendar and Meet, LinkedIn and WhatsApp. Those services have their own terms and privacy policies, and we are not responsible for them.")
 ]],
 ["Availability and liability",[
 P("We work to keep the website accurate and available, but we cannot promise it will always be error-free or uninterrupted. We may change, pause or remove any part of it."),
 P("To the extent the law allows, HUMMIN is not liable for loss arising from your use of the website, the assessment, our Insights or our downloads, or from decisions you make based on them. Nothing in these terms limits liability that cannot be limited under Kenyan law.")
 ]],
 ["Your information",[P("Our Privacy Notice explains what we collect through the website, why we need it and how to contact us about it.")]],
 ["Law and disputes",[P("These terms are governed by the laws of Kenya. If a dispute arises, please contact us first so we can try to resolve it. If we cannot, the courts of Kenya will decide it.")]],
 ["Changes to these terms",[P("We may update these terms when the website or our services change. The date at the top shows the current version. Continuing to use the website after a change means you accept the updated terms.")]],
 ["Contact",[N("Questions about these terms can be sent to sales@hummin.org.")]]
 ] }
};
