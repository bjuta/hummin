/** HUMMIN destructive-removal gate.
 * Independent React builds are necessary but NOT sufficient: the original
 * HTML is still the fallback for public hummin.org routes until cutover.
 *
 * Default: fail if the legacy source cannot safely be removed.
 * --assert-removed: additionally ensure the legacy files are really absent.
 * This script does not delete, deploy, route traffic or modify files.
 */
import fs from "node:fs";
import path from "node:path";
const exists=path=>fs.existsSync(path);
const read=path=>fs.readFileSync(path,"utf8");
const errors=[];
const hasLegacyReference=(value)=>/originalLoader|from\s*["']\.\/fidelity["']|\/design\/(site|assessment|insights)\/index\.html/.test(value);
const routeDir="app/routes";
for(const file of fs.readdirSync(routeDir).filter(n=>n.endsWith(".gated.tsx"))){
 const source=read(path.join(routeDir,file));
 if(hasLegacyReference(source))errors.push("Public route still selects legacy HTML: "+file);
}
const fidelity="app/routes/fidelity.ts";
if(exists(fidelity)&&hasLegacyReference(read(fidelity)))
 errors.push("Legacy fidelity loader still fetches /design/ HTML.");
const scripts=JSON.parse(read("package.json")).scripts;
for(const name of ["dev","prebuild","build","pretypecheck","typecheck"]){
 const value=scripts[name]||"";
 if(/restore-original|extract-react-(assets|insights)|sync-source-foundation|design\/sources/.test(value))
  errors.push("Normal npm "+name+" still reads legacy design sources.");
}
// The owner-approved media and editorial data must be committed as normal
// assets before anyone is permitted to destroy the original design archive.
for(const file of [
 "app/components/source-foundation.css",
 "app/lib/react-original-insights.json",
 "public/brand/home-hero.webp",
 "public/brand/about-founder.webp",
 "public/brand/hummin-symbol.svg",
 "public/brand/insights-hero-mark.svg",
 "public/brand/fonts/hummin-figtree-latin.woff2",
 "public/brand/fonts/hummin-newsreader-regular-latin.woff2",
 "public/brand/fonts/hummin-newsreader-italic-latin.woff2"
])if(!exists(file))errors.push("Standalone React asset missing: "+file);
// Archive deletion is permitted only after a separately reviewed public
// React cutover. A standalone build alone does not confer release approval.
const releaseSwitch="app/lib/react-cutover.server.ts";
if(!exists(releaseSwitch)||!/export const PUBLIC_REACT_CUTOVER_APPROVED\s*=\s*true\b/.test(read(releaseSwitch)))
 errors.push("Public React cutover has not been expressly approved in source.");
const assertRemoved=process.argv.includes("--assert-removed");
if(assertRemoved){
 if(exists("design/sources"))errors.push("The archived HTML design sources still exist.");
 if(exists("public/design"))errors.push("Legacy /design static HTML files still exist.");
}
if(errors.length){
 console.error("BLOCKED: HUMMIN legacy HTML is not safe to delete.");
 for(const message of errors)console.error(" - "+message);
 console.error("Keep the owner archive and public fallback until explicit React cutover and rollback verification.");
 process.exitCode=1;
}else console.log(assertRemoved?"PASS: React is independent and legacy HTML has been removed.":"PASS: public route gates and React assets no longer require legacy HUMMIN HTML.");
