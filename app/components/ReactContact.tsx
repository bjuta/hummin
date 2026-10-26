import {Form,Link,useActionData,useLoaderData,useNavigation} from "react-router";
import {Hero} from "./ReactMarketing";
import {ReactTurnstile} from "./ReactTurnstile";
import {useState} from "react";
import "./react-marketing.css";
import "./react-contact.css";
type Result={ok:boolean;message:string};
export function ReactContact(){
 const {formReady,siteKey}=useLoaderData() as {formReady:boolean;siteKey:string};
 const result=useActionData() as Result|undefined;
 const navigation=useNavigation();
 const submitting=navigation.state==="submitting";
 const [token,setToken]=useState("");
 return <div className="hr-page"><Hero page="contact"/><section className="hr-contact-content">
  <div className="hr-contact-form-wrap">
   {result?.ok?<div role="status" className="hr-contact-success"><span aria-hidden="true">✓</span><h2>Thanks for reaching out.</h2><p>We’ll review your note and get back to you using the details you shared.</p><Link className="hr-text-link" to="/contact">Send Another Enquiry</Link></div>:<>
    {!formReady?<p role="status">The online form is temporarily unavailable. Please email <a href="mailto:sales@hummin.org">sales@hummin.org</a> directly.</p>:null}
    {result&&!result.ok?<p role="alert" className="hr-contact-error">{result.message}</p>:null}
    {formReady?<Form method="post" className="hr-contact-form" aria-label="Discuss a business challenge">
      <div className="hr-contact-honeypot" aria-hidden="true"><label htmlFor="react-c-website">Leave blank</label><input id="react-c-website" name="website" autoComplete="off" tabIndex={-1}/></div>
      <label htmlFor="react-c-name"><span>Name <em>*</em></span><input id="react-c-name" name="name" type="text" autoComplete="name" placeholder="Your full name" minLength={2} maxLength={120} required/></label>
      <label htmlFor="react-c-business"><span>Business Name <em>*</em></span><input id="react-c-business" name="businessName" type="text" autoComplete="organization" placeholder="Registered or trading name" minLength={2} maxLength={160} required/></label>
      <label htmlFor="react-c-email"><span>Work Email <em>*</em></span><input id="react-c-email" name="email" type="email" autoComplete="email" placeholder="name@business.com" maxLength={254} required/></label>
      <label htmlFor="react-c-message"><span>What Would You Like to Work On? <em>*</em></span><textarea id="react-c-message" name="message" rows={4} placeholder="A few sentences about the challenge" minLength={10} maxLength={4000} required/></label>
      <ReactTurnstile siteKey={siteKey} onToken={setToken}/>
      <input type="hidden" name="cf-turnstile-response" value={token} readOnly/>
      <div className="hr-contact-submit"><button type="submit" disabled={submitting||!token}>{submitting?"Sending…":"Send Enquiry"} <span aria-hidden="true">→</span></button><span>All fields are required.</span></div>
    </Form>:null}
   </>}
  </div>
  <aside className="hr-contact-aside">
   <div className="hr-contact-email"><img className="hr-contact-icon" src="/brand/icons/mail.svg" alt="" aria-hidden="true"/><a href="mailto:sales@hummin.org">sales@hummin.org</a><button type="button" onClick={()=>navigator.clipboard?.writeText("sales@hummin.org")} aria-label="Copy HUMMIN email">Copy</button></div>
   <p className="hr-contact-location"><img className="hr-contact-icon" src="/brand/icons/map-pin.svg" alt="" aria-hidden="true"/>Nairobi, Kenya</p><p>We review your note. If we can help, we’ll suggest a first conversation.</p>
  </aside>
 </section></div>;
}
