import fs from "node:fs";
import {gunzipSync} from "node:zlib";
const raw=fs.readFileSync("design/sources/insights-v4.html.gz.b64","utf8");
const html=gunzipSync(Buffer.from(raw.trim(),"base64")).toString("utf8");
fs.mkdirSync("artifacts/approved-source-extraction/insights",{recursive:true});
fs.writeFileSync("artifacts/approved-source-extraction/insights/original.html",html);
console.log("Insights original source extracted",html.length);
