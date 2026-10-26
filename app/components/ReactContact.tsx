import {Form,Link,useActionData,useLoaderData,useNavigation,useSearchParams} from "react-router";
import {Hero} from "./ReactMarketing";
import {ReactTurnstile} from "./ReactTurnstile";
import {useState} from "react";
import type {FormEvent} from "react";
import "./react-marketing.css";
import "./react-contact.css";
type Result={ok:boolean;message:string};
type Field="name"|"businessName"|"email"|"message";
type ContactErrors=Partial<Record<Field,string>>;
export function ReactContact(){
 const {formReady,siteKey}=useLoaderData() as {formReady:boolean;siteKey:string};
 const result=useActionData() as Result|undefined;
 const navigation=useNavigation();
 const submitting=navigation.state==="submitting";
 const [params]=useSearchParams();
 const startingMessage=params.has("challenge")
  ?"I would like to talk about this: "+String(params.get("challenge")||"").slice(0,180)
  :params.has("engagement")?"I would like to discuss a "+String(params.get("engagement")||"").slice(0,70)+".":"";

 const [token,setToken]=useState("");
 const [errors,setErrors]=useState<ContactErrors>({});
 const clear=(field:Field)=>setErrors(prev=>{if(!prev[field])return prev;const next={...prev};delete next[field];return next});
 const validate=(event:FormEvent<HTMLFormElement>)=>{
  const form=event.currentTarget,values=new FormData(form);
  const name=String(values.get("name")||"").trim(),biz=String(values.get("businessName")||"").trim(),
   email=String(values.get("email")||"").trim(),message=String(values.get("message")||"").trim();
  const next:ContactErrors={};
  if(!name)next.name="Enter your name.";
  if(!biz)next.businessName="Enter your business name.";
  if(!email)next.email="Enter your work email.";
  else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))next.email="Enter a valid email address, such as name@business.com.";
  if(!message)next.message="Tell us briefly what you would like to work on.";
  if(Object.keys(next).length){
   event.preventDefault();setErrors(next);
   const first=(Object.keys(next) as Field[])[0];
   window.setTimeout(()=>form.querySelector<HTMLElement>('[name="'+first+'"]')?.focus(),0);
  }
 };
 return <div className="hr-page"><Hero page="contact"/><section className="hr-contact-content">
  <div className="hr-contact-form-wrap">
   {result?.ok?<div role="status" className="hr-contact-success"><span aria-hidden="true">✓</span><h2>Thanks for reaching out.</h2><p>We’ll review your note and get back to you using the details you shared.</p><Link className="hr-text-link" to="/contact">Send Another Enquiry</Link></div>:<>
    {!formReady?<p role="status">The online form is temporarily unavailable. Please email <a href="mailto:sales@hummin.org">sales@hummin.org</a> directly.</p>:null}
    {result&&!result.ok?<p role="alert" className="hr-contact-error">{result.message}</p>:null}
    {formReady?<Form method="post" className="hr-contact-form" aria-label="Discuss a business challenge" noValidate onSubmit={validate}>
      <div className="hr-contact-honeypot" aria-hidden="true"><label htmlFor="react-c-website">Leave blank</label><input id="react-c-website" name="website" autoComplete="off" tabIndex={-1}/></div>
      <label htmlFor="react-c-name"><span>Name <em>*</em></span><input id="react-c-name" name="name" type="text" aria-invalid={!!errors.name} aria-describedby={errors.name?"hr-contact-error-name":undefined} onChange={()=>clear("name")} autoComplete="name" placeholder="Your full name" minLength={2} maxLength={120} required/>{errors.name?<span role="alert" id="hr-contact-error-name" className="hr-contact-field-error">{errors.name}</span>:null}</label>
      <label htmlFor="react-c-business"><span>Business Name <em>*</em></span><input id="react-c-business" name="businessName" type="text" aria-invalid={!!errors.businessName} aria-describedby={errors.businessName?"hr-contact-error-businessName":undefined} onChange={()=>clear("businessName")} autoComplete="organization" placeholder="Registered or trading name" minLength={2} maxLength={160} required/>{errors.businessName?<span role="alert" id="hr-contact-error-businessName" className="hr-contact-field-error">{errors.businessName}</span>:null}</label>
      <label htmlFor="react-c-email"><span>Work Email <em>*</em></span><input id="react-c-email" name="email" type="email" aria-invalid={!!errors.email} aria-describedby={errors.email?"hr-contact-error-email":undefined} onChange={()=>clear("email")} autoComplete="email" placeholder="name@business.com" maxLength={254} required/>{errors.email?<span role="alert" id="hr-contact-error-email" className="hr-contact-field-error">{errors.email}</span>:null}</label>
      <label htmlFor="react-c-message"><span>What Would You Like to Work On? <em>*</em></span><textarea id="react-c-message" name="message" rows={4} defaultValue={startingMessage} aria-invalid={!!errors.message} aria-describedby={errors.message?"hr-contact-error-message":undefined} onChange={()=>clear("message")} placeholder="A few sentences about the challenge" minLength={10} maxLength={4000} required/>{errors.message?<span role="alert" id="hr-contact-error-message" className="hr-contact-field-error">{errors.message}</span>:null}</label>
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
