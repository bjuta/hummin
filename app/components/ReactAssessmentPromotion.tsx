import {useEffect,useState} from "react";
import {Link} from "react-router";
import "./react-promotion.css";

/** The two site-wide assessment invitations from the owner's original HTML:
 * the dismissible sticky prompt and the terracotta assessment band.
 * Native React links and browser scrolling; no HTML template runtime.
 */
export function ReactAssessmentPromotion(){
 const [dismissed,setDismissed]=useState(false);
 useEffect(()=>{try{setDismissed(sessionStorage.getItem("hummin-assessment-prompt-dismissed")==="1")}catch{}},[]);
 const close=()=>{setDismissed(true);try{sessionStorage.setItem("hummin-assessment-prompt-dismissed","1")}catch{}};
 return <>
  {!dismissed?<div className="hr-assessment-float">
   <div className="hr-assessment-float-content" role="complementary" aria-label="Business Assessment">
    <span>What is holding the business back? <em>8 minutes</em></span>
    <Link to="/assessment" aria-label="Start the business assessment">Start</Link>
    <button type="button" aria-label="Dismiss the assessment prompt" onClick={close}>×</button>
   </div>
  </div>:null}
  <section className="hr-assessment-band" aria-labelledby="hr-assessment-band-title">
   <div>
    <h2 id="hr-assessment-band-title">Find out what is holding your business back.</h2>
    <p>Answer 23 short questions. See where the gaps are, what they may be costing you, and what to fix first.</p>
   </div>
   <div className="hr-assessment-band-action"><Link to="/assessment">Take the Assessment</Link><span>About 8 minutes · No cost</span></div>
  </section>
 </>;
}
