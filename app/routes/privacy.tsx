import { Link } from "react-router";

export const meta=()=>[
 {title:"Privacy Notice · HUMMIN"},
 {name:"description",content:"How HUMMIN handles enquiries, assessments, consultations and newsletter information."}
];

const sectionStyle={margin:"36px 0"};
const h2Style={fontFamily:"Newsreader,Georgia,serif",fontWeight:400,fontSize:"clamp(28px,4vw,38px)",lineHeight:1.2,marginBottom:12} as const;
const pStyle={fontSize:16,lineHeight:1.75,color:"#434F4F",margin:"10px 0"} as const;
const listStyle={paddingLeft:24,lineHeight:1.75,color:"#434F4F",fontSize:16} as const;

export default function Privacy(){
 return <main className="section wrap" style={{maxWidth:880,paddingBottom:96}}>
  <p className="eyebrow">Your information</p>
  <h1 className="h1">Privacy notice.</h1>
  <p className="lead">What HUMMIN collects, why we need it, and how to reach us about your information.</p>
  <p style={{...pStyle,fontSize:14}}>Last updated: 26 October 2026 · HUMMIN, Nairobi, Kenya</p>

  <section style={sectionStyle} aria-labelledby="who">
   <h2 id="who" style={h2Style}>Who is responsible?</h2>
   <p style={pStyle}>HUMMIN provides advisory and execution support to businesses in Kenya. For information submitted through this website, HUMMIN determines how that information is used. Questions and privacy requests can be sent to <a href="mailto:sales@hummin.org">sales@hummin.org</a>.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="collect">
   <h2 id="collect" style={h2Style}>Information we receive</h2>
   <ul style={listStyle}>
    <li><strong>Enquiries:</strong> your name, business, email address and the message you send.</li>
    <li><strong>Business Assessment:</strong> your name, business, email address, goal, assessment score and the priorities or cost estimates generated from your answers when you request an emailed copy. Your results are estimates, not independently audited financial information.</li>
    <li><strong>Appointments:</strong> your name, email address, phone number if provided, selected time, invitation details and Google Meet link.</li>
    <li><strong>Notes from HUMMIN:</strong> your email address and subscription or unsubscribe status.</li>
    <li><strong>Website operation:</strong> aggregated page-visit counts by page and broad referral category, plus the security and operational information our hosting, email and anti-abuse services need to process requests.</li>
    <li><strong>HUMMIN team access:</strong> account identity, authentication and activity records for authorised staff using the administration area.</li>
   </ul>
   <p style={pStyle}>Please avoid sending sensitive personal information, passwords, identification documents or confidential third-party records through open enquiry forms or assessment answers.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="purpose">
   <h2 id="purpose" style={h2Style}>What we use it for</h2>
   <p style={pStyle}>We use information to respond to questions you initiate, provide your requested assessment results, arrange and manage consultations, send booking confirmations and reminders, manage an ongoing business relationship, operate the website and protect it against misuse.</p>
   <p style={pStyle}>For those activities we rely, as applicable, on taking steps you request before a business relationship, fulfilling agreed services, and our legitimate interest in managing enquiries and keeping services secure. Where consent is required for a particular activity, we ask for it separately.</p>
   <p style={pStyle}><strong>Newsletters are optional.</strong> Requesting an assessment, enquiring, or booking does not automatically subscribe you. Notes from HUMMIN is sent only after you confirm a separate subscription, and each edition includes an unsubscribe option.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="sharing">
   <h2 id="sharing" style={h2Style}>Providers and international processing</h2>
   <p style={pStyle}>We use Cloudflare for website hosting, security and database services; Google Calendar and Meet for appointments; and Resend to send transaction and subscription emails. These providers receive only information needed for the relevant task. Appointment invitations share the details of the booking with the invited attendee through Google Calendar.</p>
   <p style={pStyle}>Some providers may process or store information outside Kenya. We assess applicable safeguards and legal requirements for those transfers. We do not sell the personal information submitted through these forms.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="cookies">
   <h2 id="cookies" style={h2Style}>Cookies, security and measurement</h2>
   <p style={pStyle}>The administration area uses authentication sessions. Cloudflare Turnstile may process technical information to check that forms are being used by a real visitor. Our website records aggregate daily page counts and broad referral categories rather than building individual visitor profiles from those counts.</p>
   <p style={pStyle}>Embedded provider resources, including Google Fonts and calendar or security services, may also receive technical request information. We do not use your enquiry or assessment submission to enrol you in promotional email.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="retention">
   <h2 id="retention" style={h2Style}>How long information is kept</h2>
   <p style={pStyle}>We keep enquiry and assessment information while it is needed to answer you, provide the service you requested, and maintain appropriate business records. Appointment records and related messages are kept as needed to administer meetings and resolve changes or disputes. Newsletter records are maintained while you remain subscribed or as necessary to honour an unsubscribe request. Security records are reviewed and deleted when no longer required.</p>
   <p style={pStyle}>Retention depends on the purpose, any ongoing relationship, and legal or record-keeping obligations. You may ask us to review or delete information that is no longer needed. We cannot always delete records immediately when a legal obligation or live service requirement requires their retention.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="rights">
   <h2 id="rights" style={h2Style}>Your choices and rights</h2>
   <p style={pStyle}>Kenya's Data Protection Act provides rights relating to notice, access, correction, objection and deletion. Other rights may apply depending on the circumstances. You can ask us what personal information we hold, request correction or deletion, object to a use, or withdraw consent where processing depends on it.</p>
   <p style={pStyle}>Email <a href="mailto:sales@hummin.org?subject=Privacy%20request">sales@hummin.org</a> with “Privacy request” in the subject. We may need to verify your identity before acting on the request. You may also raise concerns with Kenya's <a href="https://www.odpc.go.ke/" target="_blank" rel="noopener noreferrer">Office of the Data Protection Commissioner</a>.</p>
  </section>

  <section style={sectionStyle} aria-labelledby="changes">
   <h2 id="changes" style={h2Style}>Changes to this notice</h2>
   <p style={pStyle}>We may revise this notice when our services or data practices change. The date at the top shows the current version. Material changes will be reflected here.</p>
  </section>
  <p style={pStyle}><Link to="/contact">Contact HUMMIN</Link> · <Link to="/">Back to home</Link></p>
 </main>;
}
