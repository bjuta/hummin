import * as React from "react";
import {useNavigate} from "react-router";
import {ApprovedLegalSiteHeader,ApprovedLegalSiteFooter,ApprovedLegalPrivacyMain,ApprovedLegalTermsMain} from "./ApprovedLegalSource.generated";
import "./approved-source-css/legal-root.css";
import "./approved-source-css/legal-document.css";

export type LegalSourceDocument="privacy"|"terms";
const localRoutes:Record<string,string>={
 "/":"/__source-preview/home",
 "/how-we-work":"/__source-preview/how",
 "/applied-expertise":"/__source-preview/core",
 "/engagements":"/__source-preview/eng",
 "/who-we-work-with":"/__source-preview/who",
 "/about":"/__source-preview/about",
 "/contact":"/__source-preview/contact",
 "/assessment":"/__source-review/assessment",
 "/insights":"/__source-review/insights",
 "/privacy":"/__source-legal/privacy",
 "/terms":"/__source-legal/terms"
};
/** Faithful static native React transcription of the actual approved legal pages.
 * All body markup and styles are source-generated, not reconstructed.
 * Navigations stay internal to the isolated Preview and make no submissions.
 */
export function SourceLegalPreview({document}:{document:LegalSourceDocument}){
 const navigate=useNavigate();
 const [menuOpen,setMenuOpen]=React.useState(false);
 React.useEffect(()=>{setMenuOpen(false);},[document]);
 const navigateWithinPreview=(event:React.MouseEvent<HTMLDivElement>)=>{
  const node=event.target;
  if(!(node instanceof Element))return;
  const link=node.closest<HTMLAnchorElement>("a[href]");
  if(!link)return;
  const href=link.getAttribute("href");
  if(!href||!href.startsWith("/")||href.startsWith("//"))return;
  event.preventDefault();
  const target=localRoutes[href];
  if(target){
   navigate(target);
   window.scrollTo({top:0,behavior:"instant"});
  }
  setMenuOpen(false);
 };
 return <div onClickCapture={navigateWithinPreview}>
  <ApprovedLegalSiteHeader menuOpen={menuOpen} onMenuToggle={()=>setMenuOpen(v=>!v)}/>
  {document==="privacy"?<ApprovedLegalPrivacyMain/>:<ApprovedLegalTermsMain/>}
  <ApprovedLegalSiteFooter/>
 </div>;
}
