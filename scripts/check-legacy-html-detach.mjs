/** Release guard. Never delete design/sources or its rollback scripts while
 * public requests can still select the HTML-based legacy loader.
 *
 * This intentionally FAILS until owner-approved public React cutover.
 * No network access, deployment, mutation or GitHub Actions required.
 */
import fs from "node:fs";
const read=path=>fs.readFileSync(path,"utf8");
const routeDir="app/routes";
const gates=fs.readdirSync(routeDir).filter(n=>n.endsWith(".gated.tsx"));
const violations=[];
for(const file of gates){
 const source=read(routeDir+"/"+file);
 if(source.includes("originalLoader")||source.includes("from \"./fidelity\"")||source.includes("from './fidelity'"))
  violations.push("Live route gate still selects legacy HTML: "+file);
}
const legacy=read("app/routes/fidelity.ts");
if(legacy.includes("/design/site/index.html"))violations.push("Legacy fidelity loader still fetches /design/site/index.html");
const scripts=JSON.parse(read("package.json")).scripts;
for(const key of ["prebuild","build","typecheck","pretypecheck"]){
 const script=scripts[key]||"";
 for(const legacyCmd of ["restore-original.mjs","extract-react-assets.mjs","extract-react-insights.mjs","sync-source-foundation.mjs"])
  if(script.includes(legacyCmd))violations.push("HTML dependency in npm "+key+": "+legacyCmd);
}
if(violations.length){
 console.error("BLOCKED: Do not remove HUMMIN's original HTML bundle yet.");
 for(const reason of violations)console.error(" - "+reason);
 console.error("Approve and verify the public React cutover and source-independent build before deletion.");
 process.exitCode=1;
}else console.log("PASS: public route gates and standard build scripts no longer require legacy HUMMIN HTML");
