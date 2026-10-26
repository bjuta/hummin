/** Deterministically sync the owner-authored HTML presentation foundation. */
import fs from "node:fs";
const html=JSON.parse(fs.readFileSync("design/sources/site-v4.template.json","utf8"));
const styles=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
if(styles.length!==2)throw new Error("Original HUMMIN owner stylesheet pair missing");
const palette=[["ink","#1E272A"],["body","#2A3538"],["slate","#434F4F"],["stone","#5E6967"],["paper","#F4F5F1"],["mist","#E7EBE6"],["muted","#D0D8D2"],["line","#BAC4BE"],["rust","#B5532C"],["rust-dark","#9A4524"],["moss","#2E6B5C"]];
for(const [,value] of palette)if(!html.toUpperCase().includes(value.toUpperCase()))throw new Error("Source palette mismatch: "+value);
const content=[
"/* GENERATED FROM design/sources/site-v4.template.json.",
" * Keep the owner's original base stylesheet intact; do not edit by hand.",
" */",
":root {",
...palette.map(([key,value])=>"  --hummin-"+key+": "+value+";"),
"  --hummin-sans: 'Figtree', system-ui, sans-serif;",
"  --hummin-serif: 'Newsreader', Georgia, serif;",
"  --hummin-page-gutter: clamp(20px, 5cqw, 64px);",
"  --hummin-card-radius: 20px;",
"  --hummin-pill-radius: 999px;",
"}",
"@layer hummin-owner-source {",
styles[1][1].trim(),
"}",
""
].join("\n");
fs.writeFileSync("app/components/source-foundation.generated.css",content);
