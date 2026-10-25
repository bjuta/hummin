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
 t=need(t,"class Component extends DCLogic {","const HUMMIN_ROUTE_PATHS = {home:'/',how:'/how-we-work',core:'/applied-expertise',eng:'/engagements',who:'/who-we-work-with',assess:'/assessment',about:'/about',contact:'/contact'};\nconst HUMMIN_PATH_PAGES = Object.fromEntries(Object.entries(HUMMIN_ROUTE_PATHS).map(([page,url])=>[url,page]));\nclass Component extends DCLogic {");
 t=need(t,"    this._lastPage = this.state.page;","    this.onPopState = () => { const next=HUMMIN_PATH_PAGES[window.location.pathname]||'home'; this.setState({page:next,menu:false,peekOpen:false}); window.scrollTo({top:0,behavior:'instant'}); };\n    window.addEventListener('popstate', this.onPopState);\n    this.onTurnstileReady = () => this.mountTurnstile(); window.addEventListener('hummin-turnstile-ready',this.onTurnstileReady); requestAnimationFrame(() => this.mountTurnstile());\n    this._lastPage = this.state.page;");
 t=need(t,"window.removeEventListener('keydown', this.onKey); if (this.io) this.io.disconnect();","window.removeEventListener('keydown', this.onKey); window.removeEventListener('popstate', this.onPopState);window.removeEventListener('hummin-turnstile-ready',this.onTurnstileReady); if (this.io) this.io.disconnect();");
 t=need(t,"  _go(p, extra) {\n    this.setState({ page: p, menu: false, ...(extra || {}) });","  _go(p, extra) {\n    const path=HUMMIN_ROUTE_PATHS[p]; if(path && window.location.pathname!==path)window.history.pushState({humminPage:p},'',path);\n    this.setState({ page: p, menu: false, ...(extra || {}) });");
 t=need(t,"  submit() {","  mountTurnstile() {\n    if (this.state.page !== 'contact' || window.HUMMIN_CONTACT_READY !== true) return;\n    const host = document.getElementById('hummin-turnstile');\n    if (!host || host.dataset.widget || !window.turnstile?.render) return;\n    try {\n      const id = window.turnstile.render(host,{ sitekey: window.HUMMIN_TURNSTILE_SITE_KEY, theme:'light' });\n      if(id!==undefined){ this._turnstileWidgetId=id; host.dataset.widget='ready'; }\n    }catch(e){ console.error('Turnstile could not render'); }\n  }\n"+"  submit() {");
 t=need(t,"  componentDidUpdate() { if (this._lastPage !== this.state.page) { this._lastPage = this.state.page; requestAnimationFrame(() => this.rise()); } }","  componentDidUpdate() { if (this._lastPage !== this.state.page) { this._lastPage = this.state.page; requestAnimationFrame(() => this.rise()); } if(this.state.page==='contact')requestAnimationFrame(() => this.mountTurnstile()); }");
 t=need(t,"<sc-if value=\"{{ not_sent }}\" hint-placeholder-val=\"{{ true }}\">","<sc-if value=\"{{ contactInactive }}\" hint-placeholder-val=\"{{ true }}\"><div role=\"status\" style=\"display:grid;gap:18px;max-width:620px;padding:30px;border:1px solid #D0D8D2;border-radius:20px;background:#E7EBE6;color:#1E272A\"><h2 style=\"margin:0;font-family:Newsreader,serif;font-weight:400;font-size:clamp(28px,3cqw,40px)\">Start a conversation directly.</h2><p style=\"margin:0;font-size:16px;line-height:1.65\">The online enquiry form is not accepting submissions in this preview. Email us directly and we will take it from there.</p><a href=\"mailto:sales@hummin.org\" style=\"justify-self:start;display:inline-flex;align-items:center;min-height:52px;padding:0 24px;background:#B5532C;color:#FFFFFF;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none\">Email sales@hummin.org</a></div></sc-if><sc-if value=\"{{ contactReady }}\" hint-placeholder-val=\"{{ false }}\"><sc-if value=\"{{ not_sent }}\" hint-placeholder-val=\"{{ true }}\">");
 t=need(t,"<div style=\"display:flex;gap:16px;align-items:center;flex-wrap:wrap\"><button type=\"button\" sc-camel-on-click=\"{{ submit }}\"","<div id=\"hummin-turnstile\" style=\"min-height:65px\"></div><p role=\"alert\" style=\"font-size:14px;color:#B5532C\">{{ contactStatus }}</p><div style=\"display:flex;gap:16px;align-items:center;flex-wrap:wrap\"><button type=\"button\" sc-camel-on-click=\"{{ submit }}\"");
 t=need(t,"<sc-if value=\"{{ sent }}\" hint-placeholder-val=\"{{ false }}\">\n            <div role=\"status\" style=\"display:grid;gap:16px;max-width:520px;animation:hmFade 420ms cubic-bezier(0.2,0,0,1)\">\n              <span aria-hidden=\"true\" style=\"display:grid;place-items:center;width:52px;height:52px;border-radius:999px;background:#DCEBE5;color:#2E6B5C;font-size:24px;animation:hmPop 420ms cubic-bezier(0.2,0,0,1)\">✓</span>\n              <span ref=\"{{ sentRef }}\" sc-camel-tab-index=\"-1\" style=\"outline:none;font-family:'Newsreader',serif;font-size:clamp(32px,3.6cqw,48px);line-height:1.05\">Thanks for reaching out.</span>\n              <p style=\"margin:0;font-size:17px;line-height:1.65;color:#434F4F\">We’ll review your note and get back to you using the details you shared.</p>\n              <button type=\"button\" style-active=\"transform:scale(0.97)\" sc-camel-on-click=\"{{ reset }}\" style=\"font:inherit;color:inherit;border:none;background:none;padding:0;margin:0;text-align:inherit;justify-self:start;font-weight:600;font-size:15px;color:#B5532C;cursor:pointer;border-bottom:1px solid #B5532C\">Send Another Enquiry</button>\n            </div>\n          </sc-if>","<sc-if value=\"{{ sent }}\" hint-placeholder-val=\"{{ false }}\">\n            <div role=\"status\" aria-label=\"Enquiry received\" style=\"display:grid;gap:28px;max-width:620px;animation:hmFade 420ms cubic-bezier(0.2,0,0,1)\">\n              <div style=\"display:flex;align-items:center;gap:12px\">\n                <span aria-hidden=\"true\" style=\"display:grid;place-items:center;width:32px;height:32px;flex:none;border-radius:50%;background:#DCEBE5;color:#2E6B5C;font-size:18px;font-weight:600;animation:hmPop 420ms cubic-bezier(0.2,0,0,1)\">✓</span>\n                <span style=\"font-family:Figtree,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#2E6B5C\">Enquiry received</span>\n              </div>\n              <div style=\"display:grid;gap:14px\">\n                <h2 ref=\"{{ sentRef }}\" sc-camel-tab-index=\"-1\" style=\"margin:0;outline:none;font-family:'Newsreader',serif;font-weight:400;font-size:clamp(38px,4.2cqw,56px);line-height:1.03;letter-spacing:-0.025em;color:#1E272A\">We'll take it from here.</h2>\n                <p style=\"margin:0;max-width:560px;font-size:16px;line-height:1.75;color:#434F4F\">We've received your note. Our starting point is the business behind the challenge — not a predefined solution.</p>\n              </div>\n              <div style=\"padding-top:24px;border-top:1px solid #D0D8D2;display:grid;gap:20px\">\n                <span style=\"font-family:Figtree,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;color:#65716E\">What happens next</span>\n                <div style=\"display:grid;grid-template-columns:34px minmax(0,1fr);column-gap:16px;row-gap:7px;align-items:start\">\n                  <span aria-hidden=\"true\" style=\"font-family:'Newsreader',serif;font-size:24px;line-height:1;color:#B5532C\">01</span>\n                  <div style=\"display:grid;gap:5px\">\n                    <strong style=\"font-size:15px;font-weight:650;color:#1E272A\">We consider what you've shared.</strong>\n                    <p style=\"margin:0;font-size:14px;line-height:1.65;color:#5E6967\">We'll look at the challenge, its context and where HUMMIN might be useful.</p>\n                  </div>\n                  <span aria-hidden=\"true\" style=\"font-family:'Newsreader',serif;font-size:24px;line-height:1;color:#B5532C;padding-top:9px\">02</span>\n                  <div style=\"display:grid;gap:5px;padding-top:9px\">\n                    <strong style=\"font-size:15px;font-weight:650;color:#1E272A\">If we can help, we'll suggest a conversation.</strong>\n                    <p style=\"margin:0;font-size:14px;line-height:1.65;color:#5E6967\">A chance to understand your priorities, what needs to change, and what a useful next step could look like.</p>\n                  </div>\n                </div>\n              </div>\n              <div style=\"display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding-top:2px\">\n                <a href=\"/how-we-work\" style=\"display:inline-flex;align-items:center;gap:12px;min-height:44px;border-bottom:1px solid #B5532C;color:#B5532C;text-decoration:none;font-family:Figtree,sans-serif;font-weight:650;font-size:14px\">See how HUMMIN works <span aria-hidden=\"true\">↗</span></a>\n                <button type=\"button\" style-active=\"transform:scale(0.97)\" sc-camel-on-click=\"{{ reset }}\" style=\"font:inherit;background:none;border:none;padding:10px 0;color:#65716E;cursor:pointer;font-size:14px;text-decoration:underline;text-underline-offset:4px\">Send another enquiry</button>\n              </div>\n            </div>\n          </sc-if>");
 t=need(t,"<div style=\"flex:1 1 260px;display:grid;gap:20px;align-content:start\">","</sc-if><div style=\"flex:1 1 260px;display:grid;gap:20px;align-content:start\">");
 t=need(t,"    v.sent = s.sent; v.not_sent = !s.sent;","    v.contactReady = window.HUMMIN_CONTACT_READY === true; v.contactInactive = !v.contactReady; v.contactStatus = s.contactStatus || ''; v.sent = s.sent; v.not_sent = !s.sent;");
 const original=["    this.setState({ sending: true });","    setTimeout(() => { this.setState({ sending: false, sent: true, err: {} }); setTimeout(() => { const h = this.sentRef.current; if (h) h.focus(); }, 60); }, 700);"].join('\n');
 const replacement=["    this.setState({ sending: true });",
 "    const data=new FormData();data.set('name',f.name.trim());data.set('businessName',f.biz.trim());data.set('email',f.email.trim());data.set('message',f.msg.trim());",
 "    if(window.turnstile?.getResponse)data.set('cf-turnstile-response',window.turnstile.getResponse(this._turnstileWidgetId)||'');",
 "    fetch('/contact',{method:'POST',body:data,headers:{'Accept':'application/json'}}).then(async response=>{",
 "      const result=await response.json().catch(()=>({}));if(!response.ok||result.ok!==true)throw Error(result.message||'Online enquiries are not available. Please email sales@hummin.org.');",
 "      this.setState({sending:false,sent:true,err:{},contactStatus:''});setTimeout(()=>{this.sentRef.current?.focus()},60);",
 "    }).catch(err=>{if(window.turnstile?.reset&&this._turnstileWidgetId)window.turnstile.reset(this._turnstileWidgetId);this.setState({sending:false,sent:false,contactStatus:err.message||'Please email sales@hummin.org.'});});"].join('\n');
 return need(t,original,replacement);
}
function assessment(t){
  // Restore the exported assessment rather than redrawing its design.
  t=need(t,"A copy of your plan is on its way to {{ gateEmail }}.","Your plan is unlocked in this browser. No email has been sent.");
  const oldState="bookErr: {}, booked: false }";
  t=need(t,oldState,"bookErr: {}, booked: false, bookingDays: [], bookingLoading: false, bookingEnabled: false, bookingStatus: '', bookingSaving: false }");
  const loadMethod=String.raw`
  loadBookingSlots(preserveStatus = false) {
    const seq = (this._bookingRequestSeq || 0) + 1; this._bookingRequestSeq = seq;
    this.setState({ bookingLoading: true, ...(preserveStatus ? {} : { bookingStatus: '' }) });
    fetch('/api/booking/slots', { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.enabled !== true || !Array.isArray(data.days)) throw Error(data.message || 'Live bookings are not available yet.');
        const days = data.days.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Array.isArray(d.slots)).map(d => ({ date: d.date, slots: d.slots.filter(x => typeof x === 'string') }));
        if (seq !== this._bookingRequestSeq) return;
        this.setState(s => ({
          bookingDays: days, bookingLoading: false, bookingEnabled: true, bookingStatus: preserveStatus ? s.bookingStatus : '',
          day: days.some(d => d.date === s.day) ? s.day : null,
          slot: days.some(d => d.date === s.day && d.slots.includes(s.slot)) ? s.slot : null
        }));
      })
      .catch(error => {
        if (seq !== this._bookingRequestSeq) return;
        this.setState({ bookingDays: [], bookingLoading: false, bookingEnabled: false,
          bookingStatus: 'Live appointment booking is unavailable. Please email sales@hummin.org.', day: null, slot: null });
      });
  }
`;
  t=need(t,"  go(step) { if (step >= STEPS.length) { this.setState({ stage: 'results' }); this.top(); return; }",
    loadMethod+"  go(step) { if (step >= STEPS.length) { this.setState({ stage: 'results' }); this.loadBookingSlots(); this.top(); return; }");
  t=need(t,"v.openBooking = () => { this.setState({ forceBook: true });","v.openBooking = () => { this.loadBookingSlots(); this.setState({ forceBook: true });");
  t=need(t,"booked: false }); this.top();","booked: false, bookingDays: [], bookingLoading: false, bookingEnabled: false, bookingStatus: '', bookingSaving: false }); this.top();");
  const booking=String.raw`
      // Availability comes from the Worker/Google Calendar, never a generated formula.
      const available = s.bookingEnabled ? s.bookingDays : [];
      const dayDate = value => new Date(value + 'T12:00:00');
      const days = available.map(item => dayDate(item.date));
      const lead = days.length ? (days[0].getDay() + 6) % 7 : 0;
      const cells = []; for (let i = 0; i < lead; i++) cells.push(null); days.forEach(x => cells.push(x));
      const isoDay = x => [x.getFullYear(), String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-');
      const localTime = t => new Date(t).toLocaleTimeString('en-KE', {timeZone:'Africa/Nairobi',hour:'2-digit',minute:'2-digit',hour12:false});
      const localDay = (t, opts) => new Date(t).toLocaleDateString('en-KE', {timeZone:'Africa/Nairobi',...opts});
      v.weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      v.monthLabel = days.length ? days[0].toLocaleDateString('en-KE',{month:'long',year:'numeric'}) +
        (days[days.length-1].getMonth() !== days[0].getMonth() ? ' – ' + days[days.length-1].toLocaleDateString('en-KE',{month:'long'}) : '') : 'Availability';
      v.days = cells.map(x => {
        if (!x) return { num:'',sub:'',disabled:true,selStr:'false',aria:'Empty',bg:'transparent',bd:'transparent',fg:'transparent',cursor:'default',pick:()=>{} };
        const date = isoDay(x), item = available.find(d => d.date === date);
        const isFull = !item || item.slots.length === 0, sel = s.day === date;
        return {num:x.getDate(),sub:isFull?'Full':x.toLocaleDateString('en-KE',{month:'short'}),disabled:isFull,selStr:sel?'true':'false',
          aria:x.toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long'})+(isFull?', no appointments available':''),
          bg:sel?'#1E272A':isFull?'transparent':'#FFFFFF',fg:sel?'#F4F5F1':isFull?'#BAC4BE':'#1E272A',
          bd:sel?'#1E272A':isFull?'#E7EBE6':'#D0D8D2',cursor:isFull?'not-allowed':'pointer',
          pick:()=>{if(!isFull)this.setState({day:date,slot:null,bookingStatus:''});}};
      });
      const dayObj = s.day ? dayDate(s.day) : null;
      v.hasDay = !!dayObj;
      v.dayLabel = dayObj ? dayObj.toLocaleDateString('en-KE',{weekday:'long',day:'numeric',month:'long'}) : 'Choose a day';
      v.tzLabel = 'Nairobi time (EAT)';
      const daySlots = available.find(d => d.date === s.day);
      v.slots = daySlots ? daySlots.slots.map(key => { const sel = s.slot === key; return {
        label: localTime(key),selStr:sel?'true':'false',bg:sel?'#B5532C':'#FFFFFF',fg:sel?'#FFFFFF':'#1E272A',
        bd:sel?'#B5532C':'#D0D8D2',pick:()=>this.setState({slot:key,bookingStatus:''})
      };}) : [];
      v.hasSlot = !!s.slot && s.bookingEnabled;
      const slotDate = s.slot ? new Date(s.slot) : null;
      v.slotShort = slotDate ? localDay(s.slot,{weekday:'short',day:'numeric',month:'short'}) + ', ' + localTime(s.slot) + ' EAT' : '';
      v.liveBookingNotice = s.bookingLoading ? 'Checking live appointment availability…' :
        (s.bookingStatus || (s.bookingEnabled ? 'Select an available time. Bookings are confirmed only after Google Calendar accepts the appointment.' :
         'Live appointment booking is not yet available. Please email sales@hummin.org.'));
      v.bookFields = [['name','Name','text','name','Your full name'],['email','Work Email','email','email','name@business.com'],['phone','Phone (optional)','tel','tel','+254 7…']].map(([k,label,type,ac,ph])=>({
        id:'b-'+k,label,type,ac,ph,value:s.book[k],err:s.bookErr[k]||'',inv:s.bookErr[k]?'true':'false',
        bd:s.bookErr[k]?'#B5532C':'#BAC4BE',
        onChange:e=>{const val=e.target.value;this.setState(st=>({book:{...st.book,[k]:val},bookErr:{...st.bookErr,[k]:''}}));}
      }));
      v.bookSubmitLabel = s.bookingSaving ? 'Confirming appointment…' : 'Confirm ' + v.slotShort;
      v.bookSubmitDisabled = s.bookingSaving ? 'true' : 'false';
      v.confirmBooking = async () => {
        if (this.state.bookingSaving || !s.bookingEnabled || !s.slot) return;
        const b=this.state.book, errors={};
        if(!b.name.trim()) errors.name='Enter your name.';
        if(!EMAIL_RE.test(b.email.trim())) errors.email='Enter a valid email, such as name@business.com.';
        if(Object.keys(errors).length){this.setState({bookErr:errors});const el=document.getElementById('b-'+Object.keys(errors)[0]);if(el)el.focus();return;}
        this.setState({bookingSaving:true,bookingStatus:'Confirming your appointment…',bookErr:{}});
        try {
          const response=await fetch('/api/booking/reserve',{method:'POST',credentials:'same-origin',cache:'no-store',
            headers:{'Content-Type':'application/json','Accept':'application/json'},
            body:JSON.stringify({start:s.slot,name:b.name.trim(),email:b.email.trim(),phone:b.phone.trim()})});
          const data=await response.json().catch(()=>({}));
          if(!response.ok||data.ok!==true||!data.eventId)throw Error(data.message||'Appointment could not be confirmed.');
          const st=new Date(s.slot),en=new Date(st.getTime()+30*60000),z=x=>x.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
          const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HUMMIN//Assessment//EN','BEGIN:VEVENT',
            'UID:'+data.eventId+'@hummin.org','DTSTAMP:'+z(new Date()),'DTSTART:'+z(st),'DTEND:'+z(en),
            'SUMMARY:HUMMIN results review','DESCRIPTION:Your appointment was confirmed by HUMMIN.',
            'ORGANIZER;CN=HUMMIN:mailto:sales@hummin.org','END:VEVENT','END:VCALENDAR'].join('\r\n');
          if(this._ics) URL.revokeObjectURL(this._ics);
          this._ics=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
          this.setState({booked:true,bookingSaving:false,bookingStatus:'',gcal:data.calendarUrl||''});
        } catch(error) {
          this.setState({bookingSaving:false,bookingStatus:(error&&error.message)||'We could not confirm this appointment. Please email sales@hummin.org.'});
          this.loadBookingSlots(true);
        }
      };
`;
  const start=t.indexOf('      // booking\n'), end=t.indexOf('\n      v.notBooked = ',start);
  if(start<0||end<0)throw Error('Original booking block not found');
  t=t.slice(0,start)+booking+t.slice(end);
  t=need(t,"<sc-if value=\"{{ showBooking }}\"",
    "<sc-if value=\"{{ showBooking }}\""); // Retain the existing original conditional and calendar layout.
  t=need(t,"Confirm {{ slotShort }}","{{ bookSubmitLabel }}");
  t=need(t,'sc-camel-on-click="{{ confirmBooking }}"','sc-camel-on-click="{{ confirmBooking }}" aria-busy="{{ bookSubmitDisabled }}"');
  t=need(t,"<sc-if value=\"{{ showBooking }}\" hint-placeholder-val=\"{{ false }}\">",
    "<sc-if value=\"{{ showBooking }}\" hint-placeholder-val=\"{{ false }}\"><p role=\"status\" style=\"font-family:Figtree,sans-serif;font-size:14px;color:#B5532C;padding:8px 0 18px\">{{ liveBookingNotice }}</p>");
  return t;
}
for(const [name,fn] of [['site',site],['assessment',assessment]]){
 const src=read(name);if(!src)throw Error('Source missing: '+name);
 let html=patch(src,fn);html=html.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">');
 const dir=path.join('public','design',name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
 console.log('Restored high-fidelity '+name+' ('+html.length+' characters)');
}