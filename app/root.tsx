import {Links,Meta,Outlet,Scripts,ScrollRestoration,isRouteErrorResponse} from "react-router";
export const links=()=>[];
export function Layout({children}:{children:React.ReactNode}){
 return <html lang="en-KE"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><Meta/><Links/></head><body>{children}<ScrollRestoration/><Scripts/></body></html>;
}
export default function App(){return <Outlet/>;}
export function ErrorBoundary({error}:{error:unknown}){
 const status=isRouteErrorResponse(error)?error.status:500;
 return <main><h1>{status===404?"Not found":"Page unavailable"}</h1></main>;
}
