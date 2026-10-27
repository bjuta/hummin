/** Reproduce exactly the approved source-restoration transformations used
 * to render hummin.org. Never import or execute the original browser runtime.
 * Import only the original, repository-authored site(t) string patch function
 * into a time-bounded build-only Node VM with a strict need() contract.
 */
import fs from "node:fs";
import vm from "node:vm";
const source=fs.readFileSync("scripts/restore-original.mjs","utf8");
const begin=source.indexOf("function site(t){");
const end=source.indexOf("function assessment(t){",begin);
if(begin<0||end<begin)throw Error("Approved production source patch boundaries changed");
const original=JSON.parse(fs.readFileSync("design/sources/site-v4.template.json","utf8"));
const need=(html,from,to)=>{
 if(!html.includes(from))throw Error("Approved restore anchor missing: "+String(from).slice(0,90));
 return html.replace(from,to);
};
const sandbox=vm.createContext({need});
const patch=vm.runInContext("("+source.slice(begin,end).trim()+")",sandbox,{timeout:3000});
const restored=patch(original);
if(!restored.includes('href="/privacy"')||!restored.includes("v.contactReady"))
 throw Error("Approved production restoration omitted footer or contact state");
export const sourceProductionSite=()=>restored;
