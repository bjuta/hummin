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
