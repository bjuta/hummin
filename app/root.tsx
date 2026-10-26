import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, Links, Meta, Scripts, ScrollRestoration, isRouteErrorResponse, useLocation } from "react-router";
import "./site.css";

const navigation = [
  { to:"/",label:"Home",end:true },
  { to:"/how-we-work",label:"How We Work" },
  { to:"/applied-expertise",label:"Applied Expertise" },
  { to:"/engagements",label:"Engagements" },
  { to:"/who-we-work-with",label:"Who We Work With" },
  { to:"/assessment",label:"Assessment" },
  { to:"/about",label:"About" },
  { to:"/insights",label:"Insights" },
  { to:"/contact",label:"Contact" },
];
export const links = () => [
  { rel:"preconnect",href:"https://fonts.googleapis.com" },
  { rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:"anonymous" as const },
  { rel:"stylesheet",href:"https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Figtree:wght@400;500;600;700&display=swap" }
];
export function Layout({ children }: {children:React.ReactNode}) {
  return <html lang="en-KE"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><Meta/><Links/></head><body>{children}<ScrollRestoration/><Scripts/></body></html>;
}
function Header(){
  const [menu,setMenu]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const {pathname}=useLocation();
  useEffect(()=>setMenu(false),[pathname]);
  useEffect(()=>{
    const update=()=>setScrolled(window.scrollY>12);
    update();window.addEventListener("scroll",update,{passive:true});
    return ()=>window.removeEventListener("scroll",update);
  },[]);
  useEffect(()=>{
    if(!menu)return;
    const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setMenu(false);};
    document.addEventListener("keydown",close);
    return ()=>document.removeEventListener("keydown",close);
  },[menu]);
  return <header className={"hm-site-header"+(scrolled?" hm-site-header-scrolled":"")}>
    <a className="skip" href="#main">Skip to content</a>
    <div className="hm-site-nav-bar">
      <div className="hm-site-nav-left">
        <button className="hm-site-menu-toggle" type="button" aria-label={menu?"Close menu":"Open menu"} aria-expanded={menu} aria-controls="site-nav" onClick={()=>setMenu(open=>!open)}>
          {menu?<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>:
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>}
        </button>
        <Link to="/" className="hm-site-brand" onClick={()=>setMenu(false)} aria-label="HUMMIN, go to home page">
          <img src="/email/mark-dark.png" width="42" height="42" alt=""/>
          <span>HUMMIN</span>
        </Link>
      </div>
      <Link to="/contact" className="hm-site-cta" onClick={()=>setMenu(false)}>Get in Touch</Link>
    </div>
    {menu?<button className="hm-site-menu-backdrop" type="button" tabIndex={-1} aria-label="Close menu" onClick={()=>setMenu(false)}/>:null}
    <nav id="site-nav" aria-label="Main" className={"hm-site-drawer"+(menu?" hm-site-drawer-open":"")} inert={!menu}>
      <div className="hm-site-drawer-links">
        {navigation.map((n,i)=><NavLink key={n.to} end={n.end} to={n.to} onClick={()=>setMenu(false)} className={({isActive})=>"hm-site-drawer-link"+(isActive?" hm-site-drawer-active":"")}>
          <span className="hm-site-nav-index" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>
          <span>{n.label}</span>
        </NavLink>)}
      </div>
      <div className="hm-site-drawer-meta">
        <a href="mailto:sales@hummin.org">sales@hummin.org</a>
        <span>Nairobi, Kenya</span>
      </div>
    </nav>
  </header>;
}

function Footer(){return <footer className="site-footer"><div className="footer-inner"><Link to="/" className="footer-brand">HUMMIN</Link><span>Embedded advisory and execution · Nairobi, Kenya</span><a href="mailto:sales@hummin.org">sales@hummin.org</a><span>© {new Date().getFullYear()} HUMMIN</span><Link to="/privacy">Privacy</Link><Link to="/terms">Terms of Use</Link></div></footer>;}
export default function App(){
 const {pathname}=useLocation();
 useEffect(()=>{
  if(pathname.startsWith("/admin")||pathname.startsWith("/api/"))return;
  fetch("/api/analytics/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:pathname,referrer:document.referrer}),keepalive:true}).catch(()=>{});
 },[pathname]);
 if(pathname==="/admin"||pathname.startsWith("/admin/"))return <Outlet/>;
 return <><Header/><main id="main" tabIndex={-1}><Outlet/></main><Footer/></>;
}
export function ErrorBoundary({error}:{error:unknown}){
 const missing=isRouteErrorResponse(error)&&error.status===404;
 return <div className="section wrap"><p className="eyebrow">{missing?"Page not found":"Something went wrong"}</p><h1>{missing?"This page isn't here.":"We couldn't load this page."}</h1><p>Please return to the homepage or contact us directly.</p><Link className="button button-dark" to="/">Back to HUMMIN</Link></div>;
}
