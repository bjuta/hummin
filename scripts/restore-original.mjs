import fs from 'node:fs';
import path from 'node:path';
const folder='design/sources';
const read=(name)=>fs.readdirSync(folder).filter(n=>n.startsWith(name+'.')&&n.endsWith('.part')).sort().map(n=>fs.readFileSync(path.join(folder,n),'utf8')).join('');
const need=(s,old,replace)=>{if(!s.includes(old))throw Error('Original design anchor missing: '+old.slice(0,85));return s.replace(old,replace)};
function patch(html, fn){
 const re=/(<script\s+type="__bundler\/template"[^>]*>\s*)([\s\S]*?)(\s*<\/script>)/;
 const m=html.match(re);if(!m)throw Error('Embedded design template missing');
 const tpl=fn(JSON.parse(m[2].trim()));
 return html.replace(re,(_whole,start,_body,end)=>start+JSON.stringify(tpl).replaceAll('</','<\\/')+end);
}
function site(t){
 t=need(t,'<dc-import name="HUMMIN Assessment v2" on-contact="{{ go_contact }}" hint-size="100%,900px"></dc-import>','<iframe title="HUMMIN Business Assessment" src="/design/assessment/index.html" style="width:100%;min-height:960px;border:0;display:block;background:#1E272A" loading="lazy"></iframe>');
 t=need(t,"page: 'home', menu: false","page: ({'/':'home','/contact':'contact','/about':'about','/assessment':'assess','/how-we-work':'how','/applied-expertise':'core','/engagements':'eng','/who-we-work-with':'who'}[window.location.pathname] || 'home'), menu: false");
 const original=["    this.setState({ sending: true });","    setTimeout(() => { this.setState({ sending: false, sent: true, err: {} }); setTimeout(() => { const h = this.sentRef.current; if (h) h.focus(); }, 60); }, 700);"].join('\n');
 const replacement=["    this.setState({ sending: true });",
 "    const data=new FormData();data.set('name',f.name.trim());data.set('businessName',f.biz.trim());data.set('email',f.email.trim());data.set('message',f.msg.trim());",
 "    if(window.turnstile?.getResponse)data.set('cf-turnstile-response',window.turnstile.getResponse()||'');",
 "    fetch('/contact',{method:'POST',body:data,headers:{'Accept':'application/json'}}).then(async response=>{",
 "      const result=await response.json().catch(()=>({}));if(!response.ok||result.ok!==true)throw Error(result.message||'Online enquiries are not available. Please email sales@hummin.org.');",
 "      this.setState({sending:false,sent:true,err:{}});setTimeout(()=>{this.sentRef.current?.focus()},60);",
 "    }).catch(err=>this.setState({sending:false,sent:false,err:{msg:err.message||'Please email sales@hummin.org.'}}));"].join('\n');
 return need(t,original,replacement);
}
function assessment(t){
 t=need(t,"const full = x => ((x.getDate() * 7 + x.getMonth() * 3) % 6) === 0;","const full = x => true;");
 t=need(t,"const SL = [[9, 0], [9, 30], [10, 0], [11, 0], [11, 30], [14, 0], [14, 30], [15, 30], [16, 0]];","const SL = [];");
 const start=t.indexOf('      v.confirmBooking = () => {'),end=t.indexOf('\n      v.notBooked = ',start);
 if(start<0||end<0)throw Error('Original booking handler missing');
 t=t.slice(0,start)+"      v.confirmBooking = () => { this.setState({bookErr:{email:'No booking was made. Please contact sales@hummin.org while live availability is being connected.'},booked:false}); };"+t.slice(end);
 t=need(t,"v.showBooking = showBook;","v.liveBookingNotice = 'Live booking is not configured yet. No reservations can be made from this preview.'; v.showBooking = showBook;");
 t=need(t,'<sc-if value="{{ showBooking }}"','<p role="status" style="font-family:Figtree,sans-serif;font-size:14px;color:#B5532C;padding:8px 0 18px">{{ liveBookingNotice }}</p>\n      <sc-if value="{{ showBooking }}"');
 return t;
}
for(const [name,fn] of [['site',site],['assessment',assessment]]){
 const src=read(name);if(!src)throw Error('Source missing: '+name);
 let html=patch(src,fn);html=html.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">');
 const dir=path.join('public','design',name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
 console.log('Restored high-fidelity '+name+' ('+html.length+' characters)');
}