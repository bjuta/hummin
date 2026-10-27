import assert from "node:assert/strict";
import fs from "node:fs";
import {pathToFileURL} from "node:url";
import * as React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const folder="artifacts/source-native-transcription";
const generated=await import(pathToFileURL(process.cwd()+"/"+folder+"/renderable.mjs").href);
const states=JSON.parse(fs.readFileSync(folder+"/remaining-viewmodels.json","utf8"));
const assets=JSON.parse(fs.readFileSync(folder+"/asset-map.json","utf8"));
const cases=[
 ["assessment","intro","ApprovedAssessmentRoot","See what is holding the business back"],
 ["assessment","first","ApprovedAssessmentRoot","Question 1 of"],
 ["insights","index","ApprovedInsightsRoot","Insights"],
 ["insights","article","ApprovedInsightsRoot","enquiries"],
 ["insights","topic","ApprovedInsightsRoot","Marketing"],
 ["insights","author","ApprovedInsightsRoot","HUMMIN"]
];
for(const [source,state,component,expected] of cases){
 const data=states[source].views[state];
 assert.ok(data&&typeof generated[component]==="function",source+"/"+state+" unavailable");
 const html=renderToStaticMarkup(React.createElement(generated[component],{scope:{...data,__assets:assets}}));
 assert.ok(html.length>500,source+"/"+state+" returned incomplete HTML");
 assert.ok(html.toLowerCase().includes(expected.toLowerCase()),source+"/"+state+" missing approved text "+expected);
 assert.ok(!html.includes("{{ "),source+"/"+state+" source bindings leaked");
 const broken=[...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map(x=>x[1]).filter(v=>/^[a-f\d]{8}-/.test(v));
 if(broken.length)throw Error(source+"/"+state+" missing original assets "+broken.join(","));
 console.log("REMAINING ROOT PASS",source,state,"bytes",html.length);
}
