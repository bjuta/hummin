/** Extract only approved HUMMIN art assets into native React site static media.
 * The supplied HTML remains a design reference, never the page renderer.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const dir='design/sources';
const parts=fs.readdirSync(dir).filter(x=>/^site-v4\.manifest\.\d+\.part$/.test(x)).sort();
if(parts.length!==7)throw Error('Expected seven original art manifest parts');
const manifest=JSON.parse(parts.map(n=>fs.readFileSync(path.join(dir,n),'utf8')).join(''));
const images={
 'home-hero':'91c0a428-8661-4dcf-b019-808b39798607',
 'how-hero':'681cedc5-813e-490a-a623-c6e0f126ef26',
 'expertise-hero':'d8a9ab9f-bb47-43e2-b6ba-997b43544a7c',
 'engagements-hero':'228293ea-a0f4-4d1a-9bb7-1fe730ff2304',
 'who-hero':'ff9ce80f-8982-47dc-aac0-bd3c1d6972c1',
 'who-owner':'e943bc6c-8fbf-45a5-bb17-de132f6f7e9c',
 'about-hero':'d0335c3d-cb45-4b4a-a60b-a4eaa9667e7d',
 'about-founder':'5f3ebfe3-741c-4f64-8dad-084f0805e0fa',
 'residency':'2d5dffbc-fe2b-478b-b7e8-feef856eac25'
};
fs.mkdirSync('public/brand',{recursive:true});
for(const [name,id] of Object.entries(images)){
 const item=manifest[id];
 if(!item||item.mime!=='image/webp'||!item.data)throw Error('Missing original HUMMIN WebP: '+name);
 let buffer=Buffer.from(item.data,'base64');
 if(item.compressed)buffer=zlib.gunzipSync(buffer);
 if(buffer.subarray(0,4).toString('ascii')!=='RIFF'||buffer.subarray(8,12).toString('ascii')!=='WEBP')throw Error('Unexpected media bytes: '+name);
 fs.writeFileSync('public/brand/'+name+'.webp',buffer);
 console.log('Extracted source HUMMIN art',name,buffer.length);
}

/* The source package contains the exact production font binaries.
 * Keep the same Latin subsets in React instead of relying on a different
 * remote Google Fonts CSS response and potentially different font metrics.
 * The assets are internal web build dependencies, not redistributed files.
 */
const originalFonts={
 'hummin-figtree-latin.woff2':'fec407bc-9813-4d61-af33-2d026611719d',
 'hummin-newsreader-regular-latin.woff2':'7f8e5077-c800-430e-8592-4ae3b8289516',
 'hummin-newsreader-italic-latin.woff2':'d05e75c2-a357-4d57-bf17-f7c5be2b902c'
};
fs.mkdirSync('public/brand/fonts',{recursive:true});
for(const [name,id] of Object.entries(originalFonts)){
 const item=manifest[id];if(!item||item.mime!=='font/woff2'||!item.data)throw Error('Original HUMMIN font missing: '+name);
 let bytes=Buffer.from(item.data,'base64');if(item.compressed)bytes=zlib.gunzipSync(bytes);
 if(bytes.toString('ascii',0,4)!=='wOF2')throw Error('Invalid WOFF2 source: '+name);
 fs.writeFileSync(path.join('public/brand/fonts',name),bytes);
}

/* Recover the exact Lucide v0.460.0 SVGs shipped with HUMMIN's approved
 * design package, including its white-on-dark paper-icon variants.
 * No CDN calls, emoji substitutes, approximate paths or new dependencies. */
const iconDirectory='public/brand/icons';
fs.mkdirSync(iconDirectory,{recursive:true});
const extractedIcons=new Set();
for(const item of Object.values(manifest)){
 if(item.mime!=='image/svg+xml'||!item.data)continue;
 let svg=Buffer.from(item.data,'base64');
 if(item.compressed)svg=zlib.gunzipSync(svg);
 const source=svg.toString('utf8');
 const icon=source.match(/class="lucide lucide-([a-z0-9-]+)"/);
 if(!icon)continue;
 const light=/stroke="#F4F5F1"/i.test(source);
 const name=icon[1]+(light?'-light':'')+'.svg';
 if(/<script\b/i.test(source)||!source.includes('<svg'))throw Error('Unsafe original Lucide icon '+name);
 fs.writeFileSync(path.join(iconDirectory,name),svg);
 extractedIcons.add(name);
}
const requiredIcons=['route','layers','handshake','users','building-2','mail',
 'compass','monitor-smartphone','megaphone','workflow','user-round-check',
 'chart-column','briefcase','key-round','clock','target'];
for(const name of requiredIcons){
 if(!extractedIcons.has(name+'.svg')||!extractedIcons.has(name+'-light.svg'))
  throw Error('Original HUMMIN Lucide icon pair missing: '+name);
}
// The source's dark carousel arrow is a separately coloured, signed SVG
// without a Lucide class attribute; preserve its exact original resource.
const darkArrow=manifest['cdda5423-6a0a-4897-8150-8b83c9da8fcc'];
if(!darkArrow||darkArrow.mime!=='image/svg+xml')throw Error('Original dark carousel arrow missing');
const darkArrowBytes=zlib.gunzipSync(Buffer.from(darkArrow.data,'base64'));
if(!darkArrowBytes.toString('utf8').includes('<svg'))throw Error('Invalid original dark arrow');
fs.writeFileSync(path.join(iconDirectory,'arrow-right-light.svg'),darkArrowBytes);
// Recover the two approved hummingbird motif colours used by the original
// hero and challenge cards; the canonical navigation symbol is separate.
const sourceMarks={
 'hummin-mark-mist.svg':'08f1bf1c-2007-4b2a-88c7-a228a21caea3',
 'hummin-mark-tone.svg':'9381c5d9-b1fa-4f32-ab5d-4815b4e79974'
};
for(const [filename,id] of Object.entries(sourceMarks)){
 const item=manifest[id];
 if(!item||item.mime!=='image/svg+xml')throw Error('Original mark resource missing: '+filename);
 let body=Buffer.from(item.data,'base64');
 if(item.compressed)body=zlib.gunzipSync(body);
 const svg=body.toString('utf8');
 if(!svg.includes('<svg')||/<script\\b/i.test(svg))throw Error('Invalid source HUMMIN motif: '+filename);
 fs.writeFileSync(path.join('public/brand',filename),body);
}
console.log('Recovered original HUMMIN static Lucide icons',extractedIcons.size);
