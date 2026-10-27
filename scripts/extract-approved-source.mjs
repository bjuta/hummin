import fs from "node:fs";
const source=JSON.parse(fs.readFileSync("design/sources/site-v4.template.json","utf8"));
fs.mkdirSync("design/extracted-source",{recursive:true});
fs.writeFileSync("design/extracted-source/site-original.html",source);
console.log("Original source copied",source.length);
