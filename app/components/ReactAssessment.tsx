import {useEffect,useMemo,useRef,useState} from "react";
import type {FormEvent} from "react";
import {Link} from "react-router";
import {AREAS,GOALS,STEPS,SECTIONS,NUMS,CURRENCIES} from "../lib/react-assessment-content";
import {scoreAssessment} from "../lib/react-assessment-model";
import type {AssessmentAnswers,AssessmentNumbers,AssessmentUnknown} from "../lib/react-assessment-model";
import {ReactTurnstile} from "./ReactTurnstile";
import "./react-assessment.css";
type Question={type:"choice"|"numbers"|"text";id:string;area:string;text:string;why:string;options?:{label:string;pts?:number}[];ph?:string};
type SlotDay={date:string;slots:string[]};
type Availability={enabled:boolean;days:SlotDay[];siteKey?:string;message?:string};
type BookingResponse={ok?:boolean;message?:string;eventId?:string;calendarUrl?:string;meetUrl?:string;emailQueued?:boolean};
type Gate={name:string;email:string;biz:string};
const questions=STEPS as Question[];
const blankNumbers:AssessmentNumbers={sale:"",enq:"",conv:"",hours:""};
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function currency(amount:number,code:string){
 try{return new Intl.NumberFormat("en-KE",{style:"currency",currency:code,maximumFractionDigits:0}).format(Math.round(amount))}
 catch{return code+" "+Math.round(amount).toLocaleString("en-KE")}
}
function localDate(s:string){return new Date(s).toLocaleDateString("en-KE",{weekday:"short",day:"numeric",month:"short",timeZone:"Africa/Nairobi"})}
function localTime(s:string){return new Date(s).toLocaleTimeString("en-KE",{hour:"2-digit",minute:"2-digit",timeZone:"Africa/Nairobi"})}
export function ReactAssessment(){
 const [stage,setStage]=useState<"intro"|"flow"|"results">("intro");
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<AssessmentAnswers>({});
 const [numbers,setNumbers]=useState<AssessmentNumbers>(blankNumbers);
 const [unknown,setUnknown]=useState<AssessmentUnknown>({});
 const [notes,setNotes]=useState("");
 const [code,setCode]=useState("KES");
 const [gate,setGate]=useState<Gate>({name:"",email:"",biz:""});
 const [siteKey,setSiteKey]=useState("");
 const [emailToken,setEmailToken]=useState("");
 const [emailError,setEmailError]=useState("");
 const [mailQueued,setMailQueued]=useState(false);
 const [sending,setSending]=useState(false);
 const [unlocked,setUnlocked]=useState(false);
 const [forceBooking,setForceBooking]=useState(false);
 const [availability,setAvailability]=useState<Availability|null>(null);
 const [loadingSlots,setLoadingSlots]=useState(false);
 const [selectedDay,setSelectedDay]=useState("");
 const [selectedSlot,setSelectedSlot]=useState("");
 const [book,setBook]=useState({name:"",email:"",phone:""});
 const [bookToken,setBookToken]=useState("");
 const [bookChallenge,setBookChallenge]=useState(0);
 const [bookingError,setBookingError]=useState("");
 const [bookingBusy,setBookingBusy]=useState(false);
 const [confirmed,setConfirmed]=useState<BookingResponse|null>(null);
 const pending=useRef<ReturnType<typeof setTimeout>|null>(null);
 const root=useRef<HTMLDivElement>(null);
 const qRef=useRef<HTMLHeadingElement>(null);
 const results=useMemo(()=>scoreAssessment(answers,numbers,unknown),[answers,numbers,unknown]);
 useEffect(()=>{fetch("/api/email/config",{cache:"no-store"}).then(r=>r.json()).then((d:{ready?:boolean;siteKey?:string})=>{if(d.ready&&typeof d.siteKey==="string")setSiteKey(d.siteKey)}).catch(()=>{});},[]);
 useEffect(()=>()=>{if(pending.current)clearTimeout(pending.current)},[]);
 const top=()=>window.scrollTo({top:0,behavior:"instant"});
 const goto=(target:number)=>{
  if(pending.current)clearTimeout(pending.current);
  if(target>=questions.length){setStage("results");top();return}
  if(target<0){setStage("intro");top();return}
  setStage("flow");setStep(target);top();
  window.setTimeout(()=>qRef.current?.focus({preventScroll:true}),75);
 };
 const choose=(value:string)=>{
  const q=questions[step];
  setAnswers(old=>({...old,[q.id]:value}));
  if(pending.current)clearTimeout(pending.current);
  pending.current=setTimeout(()=>goto(step+1),260);
 };
 const restart=()=>{
  if(pending.current)clearTimeout(pending.current);
  setAnswers({});setNumbers(blankNumbers);setUnknown({});setNotes("");setStep(0);
  setStage("intro");setUnlocked(false);setMailQueued(false);setGate({name:"",email:"",biz:""});
  setSelectedDay("");setSelectedSlot("");setForceBooking(false);setConfirmed(null);top();
 };
 const numbersReady=NUMS.every(f=>unknown[f.k as keyof AssessmentNumbers]||numbers[f.k as keyof AssessmentNumbers].trim()!=="");
 const q=questions[step];
 const section=SECTIONS.find(s=>s.k===q?.area)?.name||"Assessment";
 const ranked=results.priorities;
 const route=results.route;
 const showBook=route==="book"||forceBooking;
 const band=results.score>=75?{title:"Strong foundations.",text:"Most of what your goal depends on is in place. The gains now come from one or two specific areas."}:
  results.score>=50?{title:"A working business with clear gaps.",text:"The business runs, but parts of it rely on effort rather than structure. The lowest areas below are where the next gains are."}:
  {title:"Effort is carrying the business.",text:"Much of the work depends on people covering gaps. This is common when a business grows faster than its systems, and it is fixable."};
 const unlock=async(e:FormEvent)=>{
  e.preventDefault();
  setEmailError("");
  if(gate.name.trim().length<2||gate.biz.trim().length<2||!emailPattern.test(gate.email.trim())){setEmailError("Enter your name, business and a valid work email.");return}
  if(!emailToken){setEmailError("Complete security verification to receive your assessment plan.");return}
  setSending(true);
  try{
   const response=await fetch("/api/assessment/email",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:gate.name.trim(),business:gate.biz.trim(),email:gate.email.trim(),goal:results.goal.label,score:results.score,
     priorities:ranked.map(p=>p.name),monthlyCost:code==="KES"&&results.monthly!=null?Math.round(results.monthly):undefined,token:emailToken})});
   const body=await response.json() as {ok?:boolean;message?:string};
   if(!response.ok||!body.ok)throw Error(body.message||"We could not queue your email. Please try again.");
   setMailQueued(true);setUnlocked(true);setBook(b=>({...b,name:b.name||gate.name,email:b.email||gate.email}));setEmailToken("");
  }catch(err){setEmailError(err instanceof Error?err.message:"Email delivery is temporarily unavailable.");}
  finally{setSending(false)}
 };
 const loadSlots=async()=>{
  setLoadingSlots(true);setBookingError("");
  try{
   const response=await fetch("/api/booking/slots",{cache:"no-store"});
   const data=await response.json() as Availability;
   setAvailability(data);
   if(!response.ok||!data.enabled){setBookingError(data.message||"Live booking is temporarily unavailable.");}
  }catch{setBookingError("We could not load availability. Please try again.");setAvailability(null)}
  finally{setLoadingSlots(false)}
 };
 const openBooking=()=>{
  setForceBooking(true);setConfirmed(null);
  void loadSlots();
  window.setTimeout(()=>root.current?.querySelector("#hr-booking")?.scrollIntoView({behavior:"smooth",block:"start"}),100);
 };
 const confirm=async(e:FormEvent)=>{
  e.preventDefault();
  if(!selectedSlot||!bookToken||!emailPattern.test(book.email)||book.name.trim().length<2){
   setBookingError("Select an available time, enter your details and complete security verification.");return;
  }
  setBookingBusy(true);setBookingError("");
  try{
   const response=await fetch("/api/booking/reserve",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({start:selectedSlot,name:book.name.trim(),email:book.email.trim(),phone:book.phone.trim(),turnstileToken:bookToken})});
   const body=await response.json() as BookingResponse;
   if(!response.ok||!body.ok)throw new Error(body.message||"Booking could not be confirmed.");
   setConfirmed(body);setBookToken("");
  }catch(err){
   setBookingError(err instanceof Error?err.message:"Booking temporarily unavailable.");
   setBookChallenge(n=>n+1);setBookToken("");
   void loadSlots();
  }finally{setBookingBusy(false)}
 };
 return <div className="ra-root" ref={root}>
  <header className="ra-hero"><p className="ra-eyebrow">HUMMIN / BUSINESS ASSESSMENT</p>
   <h1>{stage==="intro"?"See your business more clearly.":stage==="flow"?"Understand what is holding you back.":"Your business, in clearer focus."}</h1>
   <p>{stage==="intro"?"Answer practical questions about how your business works. See five areas scored against your goal, and a plan to act on what you find.":stage==="flow"?"Be as candid as you can. Your responses stay on this device until you choose to email your plan.":"Five areas scored against your goal, with three priorities and practical next steps."}</p>
  </header>
  {stage==="intro"?<main className="ra-main ra-intro">
   <div className="ra-intro-grid">
    {[
     ["01","Five areas, scored.","Direction, customers, operations, people, and information."],
     ["02","Weighted to your goal.","Growth, time, margins, or handover. The score reflects what matters to you."],
     ["03","What the gaps cost.","Using your own numbers, in your own currency, with the working shown."],
     ["04","A plan you can start alone.","Three priorities, each with something you can do in the next 30 days."]
    ].map(([num,title,body],i)=><article className={"ra-intro-card ra-tone-"+i} key={num}><span>{num} / 04</span><h2>{title}</h2><p>{body}</p></article>)}
   </div><div className="ra-intro-bottom"><div><h2>A practical starting point.</h2><p>About 10 minutes. No jargon. You can choose “I don’t know” for financial figures.</p></div><button className="ra-primary" type="button" onClick={()=>goto(0)}>Start the Assessment <span aria-hidden="true">→</span></button></div>
  </main>:null}
  {stage==="flow"?<main className="ra-main ra-question">
   <div className="ra-progress-title"><span>{section}</span><span>Question {step+1} of {questions.length}</span></div>
   <div className="ra-progress" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={questions.length} aria-label="Assessment progress"><span style={{width:((step)/questions.length*100)+"%"}}/></div>
   <div className="ra-question-layout">
    <section><p className="ra-eyebrow">{q.area==="goal"?"YOUR GOAL":section.toUpperCase()}</p>
     <h2 ref={qRef} tabIndex={-1}>{q.text}</h2><p className="ra-context">{q.why}</p></section>
    <div className="ra-answer">
     {q.type==="choice"?<>
      <div className="ra-choices">{q.options?.map((o,i)=><button key={o.label} className={answers[q.id]===o.label?"selected":""} type="button" onClick={()=>choose(o.label)}><span className="ra-option-num">{i+1}</span><span>{o.label}</span><span aria-hidden="true">↗</span></button>)}</div>
      <p className="ra-hint">Choose an answer to continue.</p>
     </>:null}
     {q.type==="numbers"?<div className="ra-numbers">
      <label htmlFor="ra-currency">Currency <select id="ra-currency" value={code} onChange={e=>setCode(e.target.value)}>{CURRENCIES.map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></label>
      {NUMS.map(n=><div key={n.k} className="ra-number"><label htmlFor={"ra-number-"+n.k}>{n.label}<small>{n.help}</small></label>
       <div><input id={"ra-number-"+n.k} type="number" min="0" max={n.k==="conv"?"10":undefined} step={n.k==="conv"?"0.1":"1"} inputMode="decimal" disabled={!!unknown[n.k as keyof AssessmentNumbers]} placeholder={n.ph} value={unknown[n.k as keyof AssessmentNumbers]?"":numbers[n.k as keyof AssessmentNumbers]}
         onChange={e=>setNumbers(s=>({...s,[n.k]:e.target.value}))}/><span>{n.money?code:n.unit}</span></div>
       <label className="ra-unknown"><input type="checkbox" checked={!!unknown[n.k as keyof AssessmentNumbers]} onChange={e=>setUnknown(s=>({...s,[n.k]:e.target.checked}))}/> I don't know</label>
      </div>)}
     </div>:null}
     {q.type==="text"?<label className="ra-text-answer">Your answer (optional)<textarea rows={4} maxLength={1500} value={notes} placeholder={q.ph} onChange={e=>setNotes(e.target.value)}/></label>:null}
    </div>
   </div><div className="ra-nav"><button type="button" onClick={()=>goto(step-1)}>← Back</button>
    {q.type!=="choice"?<button className="ra-primary" type="button" disabled={q.type==="numbers"&&!numbersReady} onClick={()=>goto(step+1)}>{step===questions.length-1?"See My Results":"Next"} →</button>:null}
   </div>
  </main>:null}
  {stage==="results"?<main className="ra-main ra-results">
   <div className="ra-results-hero"><div><p className="ra-eyebrow">YOUR RESULT</p><h2>{band.title}</h2><p>{band.text}</p><p className="ra-goal">Weighted toward your goal: <strong>{results.goal.label}</strong></p></div><div className="ra-score"><strong>{results.score}<span>/100</span></strong><span>Overall readiness score</span></div></div>
   <section className="ra-section"><h2>Your five business areas.</h2>
    <div className="ra-bars">{results.areas.map(a=><div className="ra-bar" key={a.k}><div><strong>{a.name}</strong><span>{a.pct} / 100</span></div><div className="ra-bar-track"><span style={{width:a.pct+"%",background:a.pct>=70?"#2E6B5C":a.pct>=45?"#5E6967":"#B5532C"}}/></div></div>)}</div>
   </section>
   <section className="ra-section"><h2>What the gaps could cost.</h2>
    {results.monthly!=null&&results.monthly>0?<div className="ra-cost"><div><span>Estimated monthly opportunity</span><strong>{currency(results.monthly,code)}</strong></div><div><span>Annualised estimate</span><strong>{currency(results.monthly*12,code)}</strong></div></div>:<p>We cannot estimate this without enough figures. That is useful information in itself; start by recording enquiries and sales.</p>}
    {results.hoursBack!=null&&results.hoursBack>0?<p>Potential owner time to recover: approximately <strong>{results.hoursBack} hours a month</strong>, based on the weekly hours you provided.</p>:null}
    <details><summary>How this estimate works</summary><p>We estimate the proportion of enquiries not followed up in time from your answers about reply speed and record-keeping ({Math.round(results.gap*100)}%). We estimate what might convert ({Math.round(results.close*10)} out of 10), multiply by your monthly enquiries and typical sale, and show the result in your chosen currency. These are illustrative estimates, not audited financial results or a guarantee.</p></details>
   </section>
   <section className="ra-section"><h2>Three things to fix first.</h2>
    {!unlocked?<form onSubmit={unlock} className="ra-gate">
      <div><h3>Unlock your practical plan.</h3><p>Tell us where to send your results, then get three priorities and a 30-day starting point.</p></div>
      <label>Your name <input required minLength={2} maxLength={120} autoComplete="name" value={gate.name} onChange={e=>setGate(g=>({...g,name:e.target.value}))}/></label>
      <label>Work email <input required type="email" maxLength={254} autoComplete="email" value={gate.email} onChange={e=>setGate(g=>({...g,email:e.target.value}))}/></label>
      <label>Business name <input required minLength={2} maxLength={160} autoComplete="organization" value={gate.biz} onChange={e=>setGate(g=>({...g,biz:e.target.value}))}/></label>
      {siteKey?<ReactTurnstile siteKey={siteKey} onToken={setEmailToken}/>:<p role="status">Security verification is unavailable. We cannot send the plan right now.</p>}
      {emailError?<p role="alert" className="ra-error">{emailError}</p>:null}
      <button className="ra-primary" disabled={sending||!siteKey||!emailToken} type="submit">{sending?"Preparing your plan…":"Email & Unlock My Plan"} →</button>
      <small>Submitting requests a copy of your results by email. Read our <Link to="/privacy">Privacy Notice</Link>.</small>
     </form>:<><p role="status" className="ra-success">{mailQueued?"A copy of your plan has been queued for email delivery to "+gate.email+".":"Your plan is ready."}</p>
      <div className="ra-plans">{ranked.map((a,i)=><article key={a.name} className={"ra-plan ra-tone-"+i}><span>PRIORITY {i+1} / 03</span><h3>{a.name} <small>{a.score}/100</small></h3><p><strong>Start here:</strong> {a.diy}</p><p><strong>With HUMMIN:</strong> {a.help}</p></article>)}</div>
     </>}
   </section>
   {unlocked?<section className="ra-next" id="hr-booking"><p className="ra-eyebrow">NEXT STEP</p><h2>{route==="share"?"Share this with the person who decides.":route==="book"?"Talk through your results with us.":"Start with your practical plan."}</h2>
    <p>{route==="share"?"Your plan is most useful in the hands of whoever approves work like this. You can forward the copy we emailed you.":route==="book"?"A free 30-minute video call. We go through your results, check the estimate against your real figures and discuss the next step.":"Work through the 30-day plan. When you are ready, you can book a free results review."}</p>
    {!showBook?<button className="ra-primary" type="button" onClick={openBooking}>{route==="share"?"Book a Call Anyway":"Book a Results Review"} →</button>:null}
    {showBook&&!confirmed?<div className="ra-booking">
      <h3>Choose a 30-minute results review.</h3><p>Times are retrieved directly from HUMMIN's Google Calendar. All times below are Nairobi time (EAT).</p>
      {loadingSlots?<p role="status">Checking available appointments…</p>:null}
      {bookingError?<p className="ra-error" role="alert">{bookingError}</p>:null}
      {availability?.enabled?<><div className="ra-days" role="group" aria-label="Choose a day">
       {availability.days.filter(d=>d.slots.length).map(d=><button type="button" key={d.date} className={selectedDay===d.date?"selected":""} onClick={()=>{setSelectedDay(d.date);setSelectedSlot("");setBookToken("")}}>{new Date(d.date+"T12:00:00+03:00").toLocaleDateString("en-KE",{weekday:"short",day:"numeric",month:"short",timeZone:"Africa/Nairobi"})}</button>)}
       </div>
       {availability.days.every(d=>d.slots.length===0)?<p>No slots are currently available. Try again later or <a href="mailto:sales@hummin.org">email us</a>.</p>:null}
       {selectedDay?<div className="ra-times" role="group" aria-label="Choose a time">{availability.days.find(d=>d.date===selectedDay)?.slots.map(slot=><button type="button" className={selectedSlot===slot?"selected":""} key={slot} onClick={()=>setSelectedSlot(slot)}>{localTime(slot)} EAT</button>)}</div>:null}
       {selectedSlot?<form className="ra-book-form" onSubmit={confirm}>
        <p>Your selected time: <strong>{localDate(selectedSlot)} at {localTime(selectedSlot)} EAT</strong></p>
        <label>Name <input required minLength={2} maxLength={120} autoComplete="name" value={book.name} onChange={e=>setBook(b=>({...b,name:e.target.value}))}/></label>
        <label>Work Email <input required type="email" maxLength={254} autoComplete="email" value={book.email} onChange={e=>setBook(b=>({...b,email:e.target.value}))}/></label>
        <label>Phone (optional) <input type="tel" maxLength={40} autoComplete="tel" value={book.phone} onChange={e=>setBook(b=>({...b,phone:e.target.value}))}/></label>
        {availability.siteKey?<ReactTurnstile key={bookChallenge+"-"+selectedSlot} siteKey={availability.siteKey} onToken={setBookToken}/>:null}
        <button className="ra-primary" type="submit" disabled={bookingBusy||!bookToken}>{bookingBusy?"Confirming…":"Confirm Booking"} →</button>
       </form>:null}
      </>:null}
      <button type="button" className="ra-refresh" onClick={()=>void loadSlots()} disabled={loadingSlots}>Refresh availability</button>
    </div>:null}
    {confirmed?<div className="ra-confirm" role="status"><h3>Your consultation is booked.</h3><p>A Google Calendar invitation is on its way to <strong>{book.email}</strong>.</p><p>{localDate(selectedSlot)} at {localTime(selectedSlot)} EAT</p>
     {confirmed.meetUrl?<a href={confirmed.meetUrl} target="_blank" rel="noopener noreferrer">Open Google Meet →</a>:null}
     {confirmed.calendarUrl?<a href={confirmed.calendarUrl} target="_blank" rel="noopener noreferrer">Open Calendar Event →</a>:null}
    </div>:null}
   </section>:null}
   <div className="ra-again"><button type="button" onClick={restart}>← Start another assessment</button><Link to="/contact">Contact HUMMIN →</Link></div>
  </main>:null}
 </div>;
}
