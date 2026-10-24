import { useState } from "react";
import { Link, NavLink, Outlet, Links, Meta, Scripts, ScrollRestoration, isRouteErrorResponse } from "react-router";
import "./site.css";

const navigation = [
  { to:"/",label:"Home",end:true },
  { to:"/how-we-work",label:"How We Work" },
  { to:"/applied-expertise",label:"Applied Expertise" },
  { to:"/engagements",label:"Engagements" },
  { to:"/who-we-work-with",label:"Who We Work With" },
  { to:"/assessment",label:"Assessment" },
  { to:"/about",label:"About" },
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
  return <header className="site-header">
    <a className="skip" href="#main">Skip to content</a>
    <div className="nav-shell">
      <button className="menu-toggle" type="button" onClick={()=>setMenu(!menu)} aria-expanded={menu} aria-controls="site-navigation" aria-label={menu?"Close navigation":"Open navigation"}>{menu?"×":"☰"}</button>
      <Link to="/" className="wordmark" onClick={()=>setMenu(false)} aria-label="HUMMIN home"><span className="mark">H</span><span>HUMMIN</span></Link>
      <Link to="/contact" className="button button-dark nav-contact" onClick={()=>setMenu(false)}>Get in Touch</Link>
    </div>
    {menu&&<button type="button" aria-label="Close navigation overlay" className="menu-scrim" onClick={()=>setMenu(false)}/>}
    <nav id="site-navigation" aria-label="Main navigation" className={menu?"drawer open":"drawer"}>
      {navigation.map(n=><NavLink key={n.to} to={n.to} end={n.end} onClick={()=>setMenu(false)} className={({isActive})=>isActive?"nav-link active":"nav-link"}>{n.label}</NavLink>)}
      <div className="nav-meta"><a href="mailto:sales@hummin.org">sales@hummin.org</a><span>Nairobi, Kenya</span></div>
    </nav>
  </header>;
}
function Footer(){return <footer className="site-footer"><div className="footer-inner"><Link to="/" className="footer-brand">HUMMIN</Link><span>Embedded advisory and execution · Nairobi, Kenya</span><a href="mailto:sales@hummin.org">sales@hummin.org</a><span>© {new Date().getFullYear()} HUMMIN</span><Link to="/privacy">Privacy</Link></div></footer>;}
export default function App(){return <><Header/><main id="main" tabIndex={-1}><Outlet/></main><Footer/></>;}
export function ErrorBoundary({error}:{error:unknown}){
 const missing=isRouteErrorResponse(error)&&error.status===404;
 return <div className="section wrap"><p className="eyebrow">{missing?"Page not found":"Something went wrong"}</p><h1>{missing?"This page isn't here.":"We couldn't load this page."}</h1><p>Please return to the homepage or contact us directly.</p><Link className="button button-dark" to="/">Back to HUMMIN</Link></div>;
}
