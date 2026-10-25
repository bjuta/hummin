import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
const folder='design/sources';
const read=(name)=>fs.readdirSync(folder).filter(n=>n.startsWith(name+'.')&&n.endsWith('.part')).sort().map(n=>fs.readFileSync(path.join(folder,n),'utf8')).join('');
const need=(s,old,replace)=>{if(!s.includes(old))throw Error('Original design anchor missing: '+old.slice(0,85));return s.replace(old,replace)};
function patch(html, fn, override){
 const re=/(<script\s+type="__bundler\/template"[^>]*>\s*)([\s\S]*?)(\s*<\/script>)/;
 const m=html.match(re);if(!m)throw Error('Embedded design template missing');
 const tpl=fn(override===undefined?JSON.parse(m[2].trim()):override);
 return html.replace(re,(_whole,start,_body,end)=>start+JSON.stringify(tpl).replaceAll('</','<\\/')+end);
}
function site(t){
 t=need(t,'<dc-import name="HUMMIN Insights" on-contact="{{ go_contact }}" on-assess="{{ go_assess }}" on-nav="{{ goPage }}" open-post="{{ insightPost }}" open-nonce="{{ insightNonce }}" hint-size="100%,1200px"></dc-import>',
 '<div class="hm-frame-shell" style="position:relative;min-height:580px;background:#F4F5F1"><div class="hm-frame-placeholder" role="status" style="position:absolute;inset:0;padding:clamp(28px,5vw,68px);background:#F4F5F1;color:#1E272A"><span style="font:600 12px Figtree,Arial,sans-serif;letter-spacing:.12em;color:#B5532C">HUMMIN / INSIGHTS</span><p style="font:400 clamp(32px,4vw,52px) Newsreader,Georgia,serif;margin:18px 0 0">Practical notes for owners.</p></div><iframe title="HUMMIN Insights articles and author profiles" src="/design/insights/index.html" style="width:100%;height:1250px;min-height:400px;border:0;display:block;background:#F4F5F1;visibility:hidden" loading="eager" id="hummin-insights-frame"></iframe></div>');
 t=need(t,"open: () => this.go('insights', { insightPost: x.slug, insightNonce: Date.now() })","open: () => this.go('insights', { insightPost: x.slug, insightNonce: Date.now() })");

 // Browser-safe fallback: unresolved template expressions are invalid CSS.
 // Without a valid initial visibility the modal and drawer render visibly
 // with raw {{ ... }} placeholders before the design runtime binds them.
 t=need(t,'visibility:{{ peekVis }};pointer-events:{{ peekEvents }}','visibility:hidden;visibility:{{ peekVis }};pointer-events:none;pointer-events:{{ peekEvents }}');
 t=need(t,'transform:{{ drawerX }};visibility:{{ drawerVis }}','transform:{{ drawerX }};visibility:hidden;visibility:{{ drawerVis }}');
 t=need(t,'opacity:{{ scrimOpacity }};pointer-events:{{ scrimEvents }}','opacity:0;opacity:{{ scrimOpacity }};pointer-events:none;pointer-events:{{ scrimEvents }}');
 t=need(t,'<span>© 2026 HUMMIN</span>','<a href="/newsletter" style="color:#E7EBE6;text-decoration:underline;text-underline-offset:4px">Notes from HUMMIN</a><span>© 2026 HUMMIN</span>');
 t=need(t,'<dc-import name="HUMMIN Assessment v2" on-contact="{{ go_contact }}" hint-size="100%,900px"></dc-import>','<div class="hm-frame-shell" style="position:relative;min-height:960px;background:#1E272A"><div class="hm-frame-placeholder" role="status" style="position:absolute;inset:0;padding:clamp(28px,5vw,68px);background:#1E272A;color:#F4F5F1"><span style="font:600 12px Figtree,Arial,sans-serif;letter-spacing:.12em;color:#E58A5F">HUMMIN / ASSESSMENT</span><p style="font:400 clamp(32px,4vw,52px) Newsreader,Georgia,serif;margin:18px 0 0">Understand what is holding your business back.</p></div><iframe title="HUMMIN Business Assessment" src="/design/assessment/index.html" style="width:100%;min-height:960px;border:0;display:block;background:#1E272A;visibility:hidden" loading="eager" id="hummin-assessment-frame"></iframe></div>');
 t=need(t,"page: 'home', menu: false","page: ({'/':'home','/contact':'contact','/about':'about','/assessment':'assess','/how-we-work':'how','/applied-expertise':'core','/engagements':'eng','/who-we-work-with':'who','/insights':'insights'}[window.location.pathname] || (window.location.pathname.startsWith('/insights/')?'insights':'home')), menu: false");
 t=need(t,"class Component extends DCLogic {","const HUMMIN_ROUTE_PATHS = {home:'/',how:'/how-we-work',core:'/applied-expertise',eng:'/engagements',who:'/who-we-work-with',assess:'/assessment',about:'/about',insights:'/insights',contact:'/contact'};\nconst HUMMIN_PATH_PAGES = Object.fromEntries(Object.entries(HUMMIN_ROUTE_PATHS).map(([page,url])=>[url,page]));\nclass Component extends DCLogic {");
 t=need(t,"    this._lastPage = this.state.page;","    this.onPopState = () => { const next=HUMMIN_PATH_PAGES[window.location.pathname]||(window.location.pathname.startsWith('/insights/')?'insights':'home'); this.setState({page:next,menu:false,peekOpen:false}); window.scrollTo({top:0,behavior:'instant'}); };\n    window.addEventListener('popstate', this.onPopState);\n    this.onTurnstileReady = () => this.mountTurnstile(); window.addEventListener('hummin-turnstile-ready',this.onTurnstileReady); requestAnimationFrame(() => this.mountTurnstile());\n    window.__HUMMIN_DESIGN_MOUNTED__=true;window.dispatchEvent(new Event('hummin-design-mounted'));\n    this._lastPage = this.state.page;");
 t=need(t,"window.removeEventListener('keydown', this.onKey); if (this.io) this.io.disconnect();","window.removeEventListener('keydown', this.onKey); window.removeEventListener('popstate', this.onPopState);window.removeEventListener('hummin-turnstile-ready',this.onTurnstileReady); if(this._bookingChallengeTimer)clearInterval(this._bookingChallengeTimer);if (this.io) this.io.disconnect();");
 t=need(t,"  _go(p, extra) {\n    this.setState({ page: p, menu: false, ...(extra || {}) });","  _go(p, extra) {\n    const path=p==='insights'&&extra?.insightPost?'/insights/'+extra.insightPost:HUMMIN_ROUTE_PATHS[p]; if(path && window.location.pathname!==path)window.history.pushState({humminPage:p},'',path);\n    this.setState({ page: p, menu: false, ...(extra || {}) });\n    window.dispatchEvent(new Event('hummin-route-change'));");
 t=need(t,"  submit() {","  mountTurnstile() {\n    if (this.state.page !== 'contact' || window.HUMMIN_CONTACT_READY !== true) return;\n    const host = document.getElementById('hummin-turnstile');\n    if (!host || host.dataset.widget || !window.turnstile?.render) return;\n    try {\n      const id = window.turnstile.render(host,{ sitekey: window.HUMMIN_TURNSTILE_SITE_KEY, theme:'light' });\n      if(id!==undefined){ this._turnstileWidgetId=id; host.dataset.widget='ready'; }\n    }catch(e){ console.error('Turnstile could not render'); }\n  }\n"+"  submit() {");
 t=need(t,"  componentDidUpdate() { if (this._lastPage !== this.state.page) { this._lastPage = this.state.page; requestAnimationFrame(() => this.rise()); } }","  componentDidUpdate() { if (this._lastPage !== this.state.page) { this._lastPage = this.state.page; requestAnimationFrame(() => this.rise()); } if(this.state.page==='contact')requestAnimationFrame(() => this.mountTurnstile()); }");
 t=need(t,"<sc-if value=\"{{ not_sent }}\" hint-placeholder-val=\"{{ true }}\">","<sc-if value=\"{{ contactInactive }}\" hint-placeholder-val=\"{{ true }}\"><div role=\"status\" style=\"display:grid;gap:18px;max-width:620px;padding:30px;border:1px solid #D0D8D2;border-radius:20px;background:#E7EBE6;color:#1E272A\"><h2 style=\"margin:0;font-family:Newsreader,serif;font-weight:400;font-size:clamp(28px,3cqw,40px)\">Start a conversation directly.</h2><p style=\"margin:0;font-size:16px;line-height:1.65\">The online enquiry form is not accepting submissions in this preview. Email us directly and we will take it from there.</p><a href=\"mailto:sales@hummin.org\" style=\"justify-self:start;display:inline-flex;align-items:center;min-height:52px;padding:0 24px;background:#B5532C;color:#FFFFFF;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none\">Email sales@hummin.org</a></div></sc-if><sc-if value=\"{{ contactReady }}\" hint-placeholder-val=\"{{ false }}\"><sc-if value=\"{{ not_sent }}\" hint-placeholder-val=\"{{ true }}\">");
 t=need(t,"<div style=\"display:flex;gap:16px;align-items:center;flex-wrap:wrap\"><button type=\"button\" sc-camel-on-click=\"{{ submit }}\"","<div id=\"hummin-turnstile\" style=\"min-height:65px\"></div><p role=\"alert\" style=\"font-size:14px;color:#B5532C\">{{ contactStatus }}</p><div style=\"display:flex;gap:16px;align-items:center;flex-wrap:wrap\"><button type=\"button\" sc-camel-on-click=\"{{ submit }}\"");
 t=need(t,"<sc-if value=\"{{ sent }}\" hint-placeholder-val=\"{{ false }}\">\n            <div role=\"status\" style=\"display:grid;gap:16px;max-width:520px;animation:hmFade 420ms cubic-bezier(0.2,0,0,1)\">\n              <span aria-hidden=\"true\" style=\"display:grid;place-items:center;width:52px;height:52px;border-radius:999px;background:#DCEBE5;color:#2E6B5C;font-size:24px;animation:hmPop 420ms cubic-bezier(0.2,0,0,1)\">✓</span>\n              <span ref=\"{{ sentRef }}\" sc-camel-tab-index=\"-1\" style=\"outline:none;font-family:'Newsreader',serif;font-size:clamp(32px,3.6cqw,48px);line-height:1.05\">Thanks for reaching out.</span>\n              <p style=\"margin:0;font-size:17px;line-height:1.65;color:#434F4F\">We’ll review your note and get back to you using the details you shared.</p>\n              <button type=\"button\" style-active=\"transform:scale(0.97)\" sc-camel-on-click=\"{{ reset }}\" style=\"font:inherit;color:inherit;border:none;background:none;padding:0;margin:0;text-align:inherit;justify-self:start;font-weight:600;font-size:15px;color:#B5532C;cursor:pointer;border-bottom:1px solid #B5532C\">Send Another Enquiry</button>\n            </div>\n          </sc-if>","<sc-if value=\"{{ sent }}\" hint-placeholder-val=\"{{ false }}\">\n            <div role=\"status\" aria-label=\"Enquiry received\" style=\"display:grid;gap:28px;max-width:620px;animation:hmFade 420ms cubic-bezier(0.2,0,0,1)\">\n              <div style=\"display:flex;align-items:center;gap:12px\">\n                <span aria-hidden=\"true\" style=\"display:grid;place-items:center;width:32px;height:32px;flex:none;border-radius:50%;background:#DCEBE5;color:#2E6B5C;font-size:18px;font-weight:600;animation:hmPop 420ms cubic-bezier(0.2,0,0,1)\">✓</span>\n                <span style=\"font-family:Figtree,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#2E6B5C\">Enquiry received</span>\n              </div>\n              <div style=\"display:grid;gap:14px\">\n                <h2 ref=\"{{ sentRef }}\" sc-camel-tab-index=\"-1\" style=\"margin:0;outline:none;font-family:'Newsreader',serif;font-weight:400;font-size:clamp(38px,4.2cqw,56px);line-height:1.03;letter-spacing:-0.025em;color:#1E272A\">We'll take it from here.</h2>\n                <p style=\"margin:0;max-width:560px;font-size:16px;line-height:1.75;color:#434F4F\">We've received your note. We'll consider the business behind the challenge before suggesting what, if anything, HUMMIN can do.</p>\n              </div>\n              <div style=\"padding-top:24px;border-top:1px solid #D0D8D2;display:grid;gap:20px\">\n                <span style=\"font-family:Figtree,sans-serif;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;color:#65716E\">What happens next</span>\n                <div style=\"display:grid;grid-template-columns:34px minmax(0,1fr);column-gap:16px;row-gap:7px;align-items:start\">\n                  <span aria-hidden=\"true\" style=\"font-family:'Newsreader',serif;font-size:24px;line-height:1;color:#B5532C\">01</span>\n                  <div style=\"display:grid;gap:5px\">\n                    <strong style=\"font-size:15px;font-weight:650;color:#1E272A\">We read what you've shared.</strong>\n                    <p style=\"margin:0;font-size:14px;line-height:1.65;color:#5E6967\">We'll look at the challenge, what you've told us about your business and where we might help.</p>\n                  </div>\n                  <span aria-hidden=\"true\" style=\"font-family:'Newsreader',serif;font-size:24px;line-height:1;color:#B5532C;padding-top:9px\">02</span>\n                  <div style=\"display:grid;gap:5px;padding-top:9px\">\n                    <strong style=\"font-size:15px;font-weight:650;color:#1E272A\">If HUMMIN is a good fit, we'll suggest a conversation.</strong>\n                    <p style=\"margin:0;font-size:14px;line-height:1.65;color:#5E6967\">We'll discuss your priorities, what needs to change and where it makes sense to start.</p>\n                  </div>\n                </div>\n              </div>\n              <div style=\"display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding-top:2px\">\n                <a href=\"/how-we-work\" style=\"display:inline-flex;align-items:center;gap:12px;min-height:44px;border-bottom:1px solid #B5532C;color:#B5532C;text-decoration:none;font-family:Figtree,sans-serif;font-weight:650;font-size:14px\">See how HUMMIN works <span aria-hidden=\"true\">↗</span></a>\n                <button type=\"button\" style-active=\"transform:scale(0.97)\" sc-camel-on-click=\"{{ reset }}\" style=\"font:inherit;background:none;border:none;padding:10px 0;color:#65716E;cursor:pointer;font-size:14px;text-decoration:underline;text-underline-offset:4px\">Send another enquiry</button>\n              </div>\n            </div>\n          </sc-if>");
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
  t=need(t,"class Component extends DCLogic {","class Component extends DCLogic {\n  componentDidMount() {\n    window.__HUMMIN_DESIGN_MOUNTED__=true;window.dispatchEvent(new Event('hummin-design-mounted'));\n    fetch('/api/email/config',{cache:'no-store'}).then(r=>r.json()).then(cfg=>{this._emailConfig=cfg;this.mountEmailChallenge();}).catch(()=>{this._emailConfig={ready:false};});\n    this._mailObserver=new MutationObserver(()=>this.mountEmailChallenge());\n    this._mailObserver.observe(document.body,{childList:true,subtree:true});\n    this._emailReady=()=>this.mountEmailChallenge();\n    window.addEventListener('hummin-assessment-turnstile',this._emailReady);\n  }\n  mountEmailChallenge(){\n    if(!this._emailConfig?.ready||!window.turnstile?.render)return;\n    const el=document.getElementById('assessment-turnstile');\n    if(!el||el.dataset.rendered)return;\n    el.dataset.rendered='true';\n    this._emailWidget=window.turnstile.render(el,{sitekey:this._emailConfig.siteKey,theme:'light'});\n  }\n");
  t=need(t,"componentWillUnmount() { if (this._ics) URL.revokeObjectURL(this._ics); }","componentWillUnmount() { if(this._mailObserver)this._mailObserver.disconnect();if(this._emailReady)window.removeEventListener('hummin-assessment-turnstile',this._emailReady);if (this._ics) URL.revokeObjectURL(this._ics); }");
  t=need(t,"v.unlocked = s.unlocked; v.locked = !s.unlocked; v.gateEmail = s.gate.email;","v.unlocked = s.unlocked; v.locked = !s.unlocked; v.gateEmail = s.gate.email; v.assessmentStatus=s.assessmentStatus;");
  t=need(t,"v.unlock = () => { const g = s.gate, e = {}; if (!g.name.trim()) e.name = 'Enter your name.'; if (!EMAIL_RE.test(g.email.trim())) e.email = 'Enter a valid email, such as name@business.com.'; if (!g.biz.trim()) e.biz = 'Enter your business name.'; if (Object.keys(e).length) { this.setState({ gateErr: e }); const el = document.getElementById('g-' + Object.keys(e)[0]); if (el) el.focus(); return; } this.setState(st => ({ unlocked: true, book: { ...st.book, name: st.book.name || g.name, email: st.book.email || g.email } })); };","v.unlock = async () => {\n  if (this.state.assessmentSending) return;\n  const g=this.state.gate,errors={};\n  if(!g.name.trim())errors.name='Enter your name.';\n  if(!EMAIL_RE.test(g.email.trim()))errors.email='Enter a valid email.';\n  if(!g.biz.trim())errors.biz='Enter your business name.';\n  if(Object.keys(errors).length){this.setState({gateErr:errors});return;}\n  const token=window.turnstile?.getResponse(this._emailWidget)||'';\n  if(!token){this.setState({assessmentStatus:'Complete the verification to email your plan.'});return;}\n  this.setState({assessmentSending:true,assessmentStatus:'Queuing a copy of your results...'});\n  try{\n   const r=this.results();\n   const ranked=r.areas.slice().sort((a,b)=>(a.pct-(a.w-1)*20)-(b.pct-(b.w-1)*20)).slice(0,3);\n   const response=await fetch('/api/assessment/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({\n    name:g.name.trim(),business:g.biz.trim(),email:g.email.trim(),goal:r.goal.label,score:r.score,\n    monthlyCost:this.state.cur==='KES'?r.monthly:null,priorities:ranked.map(x=>x.name),token\n   })});\n   const body=await response.json().catch(()=>({}));\n   if(!response.ok||body.ok!==true)throw Error(body.message||'Could not queue the assessment email.');\n   this.setState(st=>({unlocked:true,assessmentSending:false,assessmentStatus:body.message,\n    book:{...st.book,name:st.book.name||g.name,email:st.book.email||g.email}}));\n  }catch(error){\n   if(window.turnstile?.reset)window.turnstile.reset(this._emailWidget);\n   this.setState({assessmentSending:false,assessmentStatus:error.message||'Email delivery is unavailable. Please try again.'});\n  }\n};");
  t=need(t,"<button type=\"button\" sc-camel-on-click=\"{{ unlock }}\"","<div id=\"assessment-turnstile\" style=\"grid-column:1/-1;min-height:65px\"></div><p role=\"alert\" style=\"grid-column:1/-1;font-size:13px;color:#B5532C\">{{ assessmentStatus }}</p><button type=\"button\" sc-camel-on-click=\"{{ unlock }}\"");
  t=need(t,"bookErr: {}, booked: false }","bookErr: {}, booked: false, assessmentSending: false, assessmentStatus: null }");
  t=need(t,"A copy of your plan is on its way to {{ gateEmail }}.","A copy of your plan has been queued for delivery to {{ gateEmail }}.");
  const oldState="bookErr: {}, booked: false, assessmentSending: false, assessmentStatus: null }";
  t=need(t,oldState,"bookErr: {}, booked: false, assessmentSending: false, assessmentStatus: null, bookingDays: [], bookingLoading: false, bookingEnabled: false, bookingStatus: '', bookingSaving: false }");
  const loadMethod=String.raw`
  installBookingChallenge() {
    if (!window.HUMMIN_BOOKING_SITE_KEY || !window.turnstile?.render) return;
    const button=document.getElementById('hummin-booking-submit');
    if(!button)return;
    let host=document.getElementById('hummin-booking-turnstile');
    if(!host){
      host=document.createElement('div');host.id='hummin-booking-turnstile';
      host.style.cssText='min-height:65px;margin:16px 0;';
      button.parentNode.insertBefore(host,button);
    }
    if(host.dataset.widget)return;
    try{
      const id=window.turnstile.render(host,{sitekey:window.HUMMIN_BOOKING_SITE_KEY,action:'hummin-booking'});
      host.dataset.widget=String(id);this._bookingWidget=id;
    }catch(_ignored){}
  }
  loadBookingSlots(preserveStatus = false) {
    const seq = (this._bookingRequestSeq || 0) + 1; this._bookingRequestSeq = seq;
    this.setState({ bookingLoading: true, ...(preserveStatus ? {} : { bookingStatus: '' }) });
    fetch('/api/booking/slots', { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.enabled !== true || !Array.isArray(data.days) || typeof data.siteKey !== 'string') throw Error(data.message || 'Live bookings are not available yet.');
        window.HUMMIN_BOOKING_SITE_KEY=data.siteKey;
        if(!document.getElementById('hummin-booking-api')){
          const script=document.createElement('script');script.id='hummin-booking-api';
          script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
          document.head.appendChild(script);
        }
        if(!this._bookingChallengeTimer)this._bookingChallengeTimer=setInterval(()=>this.installBookingChallenge(),350);
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
        const challenge=window.turnstile?.getResponse?.(this._bookingWidget);
        if(!challenge){this.setState({bookingStatus:'Complete the booking security check before confirming.'});return;}
        this.setState({bookingSaving:true,bookingStatus:'Confirming your appointment…',bookErr:{}});
        try {
          const response=await fetch('/api/booking/reserve',{method:'POST',credentials:'same-origin',cache:'no-store',
            headers:{'Content-Type':'application/json','Accept':'application/json'},
            body:JSON.stringify({start:s.slot,name:b.name.trim(),email:b.email.trim(),phone:b.phone.trim(),turnstileToken:challenge})});
          const data=await response.json().catch(()=>({}));
          if(!response.ok||data.ok!==true||!data.eventId)throw Error(data.message||'Appointment could not be confirmed.');
          const st=new Date(s.slot),en=new Date(st.getTime()+30*60000),z=x=>x.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
          const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HUMMIN//Assessment//EN','BEGIN:VEVENT',
            'UID:'+data.eventId+'@hummin.org','DTSTAMP:'+z(new Date()),'DTSTART:'+z(st),'DTEND:'+z(en),
            'SUMMARY:HUMMIN results review','DESCRIPTION:Your appointment was confirmed by HUMMIN.',
            'ORGANIZER;CN=HUMMIN:mailto:sales@hummin.org','END:VEVENT','END:VCALENDAR'].join('\r\n');
          if(this._ics) URL.revokeObjectURL(this._ics);
          this._ics=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
          window.turnstile?.reset?.(this._bookingWidget);
          this.setState({booked:true,bookingSaving:false,bookingStatus:'',gcal:data.calendarUrl||''});
        } catch(error) {
          window.turnstile?.reset?.(this._bookingWidget);
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
  t=need(t,'sc-camel-on-click="{{ confirmBooking }}"','id="hummin-booking-submit" sc-camel-on-click="{{ confirmBooking }}" aria-busy="{{ bookSubmitDisabled }}"');
  t=need(t,"<sc-if value=\"{{ showBooking }}\" hint-placeholder-val=\"{{ false }}\">",
    "<sc-if value=\"{{ showBooking }}\" hint-placeholder-val=\"{{ false }}\"><p role=\"status\" style=\"font-family:Figtree,sans-serif;font-size:14px;color:#B5532C;padding:8px 0 18px\">{{ liveBookingNotice }}</p>");
  return t;
}
// Shared boot coordinator for every restored design: site, Insights, assessment.
// A deterministic overlay masks the raw custom-element bootstrap, including
// brief unstyled template and hydration frames across all routes.
function brandedBoot(html,kind){
 const script=String.raw`<style id="hummin-boot-css">
 html.hm-booting,html.hm-booting body{background:#1E272A!important}
 html.hm-booting body>x-dc{visibility:hidden!important}
 #hummin-boot{position:fixed;inset:0;z-index:2147483000;background:#1E272A;display:grid;place-items:center;opacity:1;transition:opacity .28s ease;pointer-events:auto}
 #hummin-boot.hm-ready{opacity:0;pointer-events:none}
 .hm-boot-inner{display:grid;justify-items:center;gap:21px;padding:24px}
 .hm-boot-symbol{width:clamp(76px,11vw,116px);height:auto;display:block;animation:hm-breathe 1.8s ease-in-out infinite}
 .hm-boot-name{font-family:Figtree,Arial,sans-serif;color:#F4F5F1;font-size:clamp(15px,2.6vw,22px);font-weight:650;letter-spacing:.24em}
 .hm-boot-track{width:72px;height:2px;background:rgba(244,245,241,.18);overflow:hidden;border-radius:10px}
 .hm-boot-track:after{content:"";display:block;width:35%;height:100%;background:#B5532C;animation:hm-progress 1.45s ease-in-out infinite}
 @keyframes hm-breathe{50%{opacity:.78;transform:translateY(-3px)}}@keyframes hm-progress{0%{transform:translateX(-100%)}100%{transform:translateX(310%)}}
 @media(prefers-reduced-motion:reduce){.hm-boot-symbol,.hm-boot-track:after{animation:none}#hummin-boot{transition:none}}
 </style>
 <script>document.documentElement.classList.add('hm-booting');window.__HUMMIN_BOOT_KIND__=__KIND__;</script>`;
 const cover=String.raw`<div id="hummin-boot" role="status" aria-label="HUMMIN is loading"><div class="hm-boot-inner"><img class="hm-boot-symbol" src="/brand/hummin-symbol.svg" alt=""><span class="hm-boot-name">HUMMIN</span><span class="hm-boot-track" aria-hidden="true"></span></div></div>
 <script id="hummin-boot-control">(function(){
   var ended=false,started=Date.now(),max=12000;
   function frame(){return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(resolve)})})}
   function fonts(){return document.fonts&&document.fonts.ready?Promise.race([document.fonts.ready,new Promise(function(resolve){setTimeout(resolve,1800)})]):Promise.resolve()}
   function ready(){
     if(ended||document.readyState==='loading'||Date.now()-started<450||window.__HUMMIN_DESIGN_MOUNTED__!==true)return;
     var root=document.querySelector('x-dc');
     if(!root||!root.children.length)return;
     // Wait for the runtime to leave a visual page subtree. At minimum two
     // animation frames are allowed after document parsing and style loading.
     var text=root.textContent||'';
     if(text.indexOf('HUMMIN')<0)return;
     // For the main site, wait for the Insights iframe when present. It shares
     // the same boot protocol and exposes a loaded state.
     var iframe=document.getElementById('hummin-insights-frame')||document.getElementById('hummin-assessment-frame');
     if(iframe&&!iframe.dataset.hmLoaded&&Date.now()-started<5500)return;
     ended=true;obs.disconnect();
     Promise.resolve(fonts()).then(frame).then(function(){
       document.documentElement.classList.remove('hm-booting');
       var splash=document.getElementById('hummin-boot');
       if(splash)splash.classList.add('hm-ready');
       setTimeout(function(){
         if(splash)splash.remove();
         try{if(window.parent!==window)window.parent.postMessage({humminDesignReady:true,kind:window.__HUMMIN_BOOT_KIND__},window.location.origin)}catch(e){}
       },350);
     });
   }
   var obs=new MutationObserver(ready);
   obs.observe(document.documentElement,{childList:true,subtree:true});
   document.addEventListener('DOMContentLoaded',function(){setTimeout(ready,460)});
   window.addEventListener('hummin-design-mounted',function(){setTimeout(ready,160)},{once:true});
   window.addEventListener('load',ready,{once:true});
   function syncInsights(){
     var f=document.getElementById('hummin-insights-frame');
     if(f&&f.dataset.hmLoaded==='true'&&window.location.pathname.startsWith('/insights'))
       f.contentWindow.postMessage({humminNavigate:window.location.pathname},window.location.origin);
   }
   window.addEventListener('popstate',syncInsights);
   window.addEventListener('hummin-route-change',syncInsights);
   window.addEventListener('message',function(e){
     if(e.origin!==location.origin||!e.data)return;
     var child=document.getElementById('hummin-insights-frame')||document.getElementById('hummin-assessment-frame');
     if(!child||e.source!==child.contentWindow)return;
     if(typeof e.data.humminInsightsHeight==='number'&&child.id==='hummin-insights-frame'){
       var size=Math.ceil(e.data.humminInsightsHeight);
       if(Number.isFinite(size)&&size>=400&&size<=30000)child.style.height=size+'px';
       return;
     }
     if(typeof e.data.humminPublicRoute==='string'&&child.id==='hummin-insights-frame'){
       var page=e.data.humminPublicRoute;
       if(['/assessment','/contact','/applied-expertise'].includes(page)){
         if(page!==window.location.pathname)window.history.pushState({humminPage:page},'',page);
         window.dispatchEvent(new Event('popstate'));
       }
       return;
     }
     if(typeof e.data.humminRoute==='string'&&child.id==='hummin-insights-frame'){
       var newPath=e.data.humminRoute;
       if(/^\/insights(?:\/(?:[a-z0-9-]+|author\/[a-z0-9-]+|topic\/[a-z0-9-]+))?$/.test(newPath)&&newPath!==window.location.pathname){
         window.history.pushState({humminPage:'insights'},'',newPath);
       }
       return;
     }
     if(e.data.humminDesignReady!==true)return;
     child.dataset.hmLoaded='true';
     child.style.visibility='visible';
     var placeholder=child.previousElementSibling;
     if(placeholder&&placeholder.classList.contains('hm-frame-placeholder'))placeholder.remove();
     syncInsights();
     ready();
   });
   // Frame readiness is observable on the same origin. postMessage may be
   // missed during early parent/child boot; do not leave a finished page hidden.
   function recoverFrame(){
     var f=document.getElementById('hummin-insights-frame')||document.getElementById('hummin-assessment-frame');
     if(!f||f.dataset.hmLoaded==='true')return;
     try{
       var child=f.contentWindow;
       var doc=child&&child.document;
       if(!doc||doc.readyState!=='complete'||child.__HUMMIN_DESIGN_MOUNTED__!==true||doc.getElementById('hummin-boot')||doc.documentElement.classList.contains('hm-booting'))return;
       f.dataset.hmLoaded='true';
       f.style.visibility='visible';
       var placeholder=f.previousElementSibling;
       if(placeholder&&placeholder.classList.contains('hm-frame-placeholder'))placeholder.remove();
       syncInsights();
       ready();
     }catch(_ignored){}
   }
   var frameCheck=setInterval(function(){
     recoverFrame();
     var f=document.getElementById('hummin-insights-frame')||document.getElementById('hummin-assessment-frame');
     if(f&&f.dataset.hmLoaded==='true')clearInterval(frameCheck);
   },180);
   window.addEventListener('load',recoverFrame);
   function correctInsightsHeight(){
     var f=document.getElementById('hummin-insights-frame');
     if(!f||f.dataset.hmLoaded!=='true')return;
     try{
       var w=f.contentWindow,d=w.document;
       var sections=Array.from(d.querySelectorAll('main,section,article,footer')).filter(function(el){return el.getClientRects().length&&w.getComputedStyle(el).position!=='fixed'});
       var ends=sections.map(function(el){return el.getBoundingClientRect().bottom+w.scrollY});
       if(!ends.length)return;
       var target=Math.ceil(Math.max(400,...ends));
       if(target>30000)return;
       if(Math.abs(f.getBoundingClientRect().height-target)>2)f.style.height=target+'px';
     }catch(_ignored){}
   }
   var lastRouteHeight='';
   setInterval(function(){
     var f=document.getElementById('hummin-insights-frame');
     if(!f||f.dataset.hmLoaded!=='true')return;
     correctInsightsHeight();
     var route=window.location.pathname;
     if(route!==lastRouteHeight){lastRouteHeight=route;setTimeout(correctInsightsHeight,100);}
   },550);

   // Gracefully reveal even if a remote asset or iframe stalls. A stalled
   // child must never leave the user permanently blocked.
   setTimeout(function(){if(ended)return;ended=true;obs.disconnect();document.documentElement.classList.remove('hm-booting');var splash=document.getElementById('hummin-boot');if(splash)splash.remove();},max);
   ready();
 })();</script>`;
 const init=script.replace('__KIND__',JSON.stringify(kind));
 html=html.replace('<head>','<head>'+init);
 html=html.replace('<body>','<body>'+cover);
 return html;
}
const newSiteTemplate=JSON.parse(fs.readFileSync(path.join(folder,'site-v4.template.json'),'utf8'));
const newManifest=read('site-v4.manifest');
if(!newManifest||newManifest.length<4000000)throw Error('Latest HUMMIN site bundle resources are incomplete');
const bundleAsset=JSON.parse(newManifest);
// Extract the exact official hummingbird symbol already used in the website
// navigation. Never substitute a re-drawn or typography-only approximation.
const officialSymbol=bundleAsset['69600b5c-99d3-4ec0-9520-3db39d09fc81'];
if(!officialSymbol||officialSymbol.mime!=='image/svg+xml'||!officialSymbol.compressed)throw Error('Canonical HUMMIN symbol missing from design bundle');
const symbolSvg=zlib.gunzipSync(Buffer.from(officialSymbol.data,'base64')).toString('utf8');
if(!symbolSvg.trimStart().startsWith('<svg ')||/<script\b/i.test(symbolSvg))throw Error('Canonical HUMMIN symbol is not safe SVG');
fs.mkdirSync('public/brand',{recursive:true});
fs.writeFileSync('public/brand/hummin-symbol.svg',symbolSvg);
console.log('Extracted official HUMMIN logo symbol ('+symbolSvg.length+' characters)');
const fullInsight=zlib.gunzipSync(Buffer.from(bundleAsset['cc88240e-e27d-4718-b37a-5fab22025705'].data,'base64')).toString('utf8');
function insightTemplate(t){
 t=need(t,'<script src="./support.js"></script>','<script src="cc0357d2-2a09-4861-907c-461f1ee3894d"></script>');
 t=need(t,"class Component extends DCLogic {",`function HUMMIN_applyPublishedPosts(newPosts){
  if(!Array.isArray(newPosts)||!newPosts.length)return false;
  const all=POSTS.slice();let changed=false;
  for(const item of newPosts){
    if(!item||typeof item.slug!=='string'||!Array.isArray(item.blocks))continue;
    const originalIndex=all.findIndex(p=>p.slug===(item.sourceSlug||item.slug));
    const original=originalIndex>=0?all[originalIndex]:null;
    const replacement={...(original||{}),...item};
    if(!['guide','opinion','news'].includes(replacement.type)||!AUTHORS[replacement.author])continue;
    if(originalIndex>=0)all.splice(originalIndex,1,replacement);
    else all.push(replacement);
    changed=true;
  }
  if(changed){POSTS.splice(0,POSTS.length,...all);SORTED.splice(0,SORTED.length,...all.slice().sort((a,b)=>b.date.localeCompare(a.date)));}
  return changed;
}
class Component extends DCLogic {`);
 // Resolve deep links before the first React render, not after componentDidMount.
 // Rendering the index first caused a brief full-screen article-navigation flash.
 t=need(t,"state = { view: 'index', slug: null, topic: null, author: null, type: 'all', q: '', dl: {}, dlEmail: {}, subEmail: '', subErr: '', subDone: false, copied: false };",
 `state = (()=>{
   const path=(window.parent!==window?window.parent.location.pathname:window.location.pathname).split('/').filter(Boolean);
   let initial={view:'index',slug:null,topic:null,author:null};
   if(path[0]==='insights'){
     if(path[1]==='author'&&AUTHORS[path[2]])initial={...initial,view:'author',author:path[2]};
     else if(path[1]==='topic'){
       const topic=TOPICS.find(t=>slugify(t.name)===path[2]);
       if(topic)initial={...initial,view:'topic',topic:topic.name};
     }else if(path[1]&&POSTS.some(p=>p.slug===path[1]))initial={...initial,view:'post',slug:path[1]};
   }
   return {...initial,type:'all',q:'',dl:{},dlEmail:{},subEmail:'',subErr:'',subDone:false,copied:false};
 })();`);
 const oldMount="  componentDidMount() { this._nonce = this.props.openNonce; if (this.props.openPost) this.setState({ view: 'post', slug: this.props.openPost }); }";
 const mounted=`  componentDidMount() {
    window.__HUMMIN_DESIGN_MOUNTED__=true;window.dispatchEvent(new Event('hummin-design-mounted'));
    this._insightsAlive=true;
    this._onHumminRouteMessage=(event)=>{
      if(event.origin!==window.location.origin||event.source!==window.parent)return;
      const path=event.data?.humminNavigate;
      if(typeof path!=='string'||(path!=='/insights'&&!path.startsWith('/insights/')))return;
      const parts=path.split('/').filter(Boolean);
      if(parts[1]==='author'&&AUTHORS[parts[2]])this.setState({view:'author',slug:null,author:parts[2],topic:null});
      else if(parts[1]==='topic'){
        const topic=TOPICS.find(x=>slugify(x.name)===parts[2]);
        if(topic)this.setState({view:'topic',slug:null,author:null,topic:topic.name});
      }else if(parts[1]&&POSTS.some(x=>x.slug===parts[1]))this.setState({view:'post',slug:parts[1],author:null,topic:null});
      else this.setState({view:'index',slug:null,author:null,topic:null});
      requestAnimationFrame(()=>this.sendHeight());
    };
    window.addEventListener('message',this._onHumminRouteMessage);
    const locationPath = window.parent!==window ? window.parent.location.pathname : window.location.pathname;
    const parts=locationPath.split('/').filter(Boolean);
    if(parts[0]==='insights' && parts[1]==='author' && ['team','muiruri'].includes(parts[2]))this.setState({view:'author',author:parts[2]});
    else if(parts[0]==='insights' && parts[1]==='topic'){
      const name=TOPICS.find(x=>slugify(x.name)===parts[2]);if(name)this.setState({view:'topic',topic:name.name});
    }else if(parts[0]==='insights' && parts[1] && POSTS.some(x=>x.slug===parts[1]))this.setState({view:'post',slug:parts[1]});
    this._heightObserver=new ResizeObserver(()=>this.sendHeight());
    this._heightObserver.observe(document.body);
    window.addEventListener('resize',this._onInsightsResize=()=>this.sendHeight());
    requestAnimationFrame(()=>this.sendHeight());
    fetch('/api/insights/publications',{cache:'no-store'})
      .then(r=>r.ok?r.json():Promise.reject(Error('Insights publication feed unavailable')))
      .then(data=>{
        if(!this._insightsAlive||!HUMMIN_applyPublishedPosts(data.posts))return;
        const here=window.parent!==window?window.parent.location.pathname:window.location.pathname;
        const articleSlug=here.split('/').filter(Boolean)[1];
        if(articleSlug&&POSTS.some(p=>p.slug===articleSlug))this.setState({view:'post',slug:articleSlug});
        else this.forceUpdate();
        requestAnimationFrame(()=>this.sendHeight());
      })
      .catch(()=>{ /* Static editorial catalogue stays visible if the CMS feed is unavailable. */ });
  }
  sendHeight(){
    if(window.parent===window)return;
    // Measure the final rendered content rather than the body height, which
    // inherits the iframe viewport and previously caused a resize feedback loop.
    // The bottom of the final real section is independent of the iframe
    // viewport. Avoid document/body scrollHeight, which feeds back on itself.
    const elements=Array.from(document.querySelectorAll('main, section, article, footer'));
    const bottoms=elements.filter(el=>el.getClientRects().length && getComputedStyle(el).position!=='fixed').map(el=>el.getBoundingClientRect().bottom+window.scrollY);
    const height=Math.ceil(Math.max(400,...bottoms));
    if(this._lastSentInsightsHeight!==height){
      this._lastSentInsightsHeight=height;
      window.parent.postMessage({humminInsightsHeight:height},window.location.origin);
    }
  }
 `;
 t=need(t,oldMount,mounted);
 t=need(t,"  componentWillUnmount() { clearTimeout(this._ct); }","  componentWillUnmount() { this._insightsAlive=false;clearTimeout(this._ct);this._heightObserver?.disconnect();if(this._onHumminRouteMessage)window.removeEventListener('message',this._onHumminRouteMessage);if(this._onInsightsResize)window.removeEventListener('resize',this._onInsightsResize); }");
 t=need(t,"  go(view, extra) { this.setState({ view, ...(extra || {}) }); const sc = this.scroller(); if (sc) sc.scrollTop = 0; else window.scrollTo({ top: 0 }); }",
 `  go(view,extra){
    const data=extra||{};
    const path=view==='post' ? '/insights/'+data.slug : view==='author' ? '/insights/author/'+data.author : view==='topic' ? '/insights/topic/'+slugify(data.topic||'') : '/insights';
    if(window.parent!==window){
      this.setState({view,...data});
      window.parent.postMessage({humminRoute:path},window.location.origin);
      window.parent.scrollTo({top:0});
      return;
    }
    this.setState({view,...data});
    window.history.pushState({},'',path);
    window.scrollTo({top:0});
  }`);
 t=need(t,"    v.toAssess = () => this.props.onAssess && this.props.onAssess();","    v.toAssess = () => window.parent.postMessage({humminPublicRoute:'/assessment'},window.location.origin);");
 t=need(t,"    v.toContact = () => this.props.onContact && this.props.onContact();","    v.toContact = () => window.parent.postMessage({humminPublicRoute:'/contact'},window.location.origin);");
 t=need(t,"    v.toCore = () => this.props.onNav && this.props.onNav('core');","    v.toCore = () => window.parent.postMessage({humminPublicRoute:'/applied-expertise'},window.location.origin);");
 t=need(t,"const url = 'https://hummin.org/insights/' + p.slug","const url = window.parent.location.origin + '/insights/' + p.slug");
 t=need(t,"    v.copyLink = () => { const done = () => { this.setState({ copied: true }); clearTimeout(this._ct); this._ct = setTimeout(() => this.setState({ copied: false }), 1800); }; if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done(); };","    v.copyLink = async () => {\n      let copied = false;\n      try {\n        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {\n          await navigator.clipboard.writeText(url);\n          copied = true;\n        }\n      } catch (_ignored) {}\n      if (!copied) {\n        const field = document.createElement('textarea');\n        field.value = url;\n        field.setAttribute('readonly', '');\n        field.style.position = 'fixed';\n        field.style.left = '-9999px';\n        document.body.appendChild(field);\n        field.select();\n        try { copied = !!document.execCommand('copy'); } catch (_ignored) {}\n        field.remove();\n      }\n      clearTimeout(this._ct);\n      this.setState({ copied, copyFailed: !copied });\n      this._ct = setTimeout(() => this.setState({ copied: false, copyFailed: false }), 2600);\n      if (!copied && typeof window.prompt === 'function') window.prompt('Copy this article link:', url);\n    };");
 t=need(t,"    v.copyLabel = s.copied ? 'Link copied ✓' : 'Copy link'; v.copyBg = s.copied ? '#DCEBE5' : 'transparent';","    v.copyLabel = s.copied ? 'Link copied ✓' : s.copyFailed ? 'Copy manually' : 'Copy link'; v.copyBg = s.copied ? '#DCEBE5' : 'transparent';");
 const oldSubscribe="    v.subscribe = () => { if (!EMAIL_RE.test(s.subEmail.trim())) { this.setState({ subErr: 'Enter a valid email, such as name@business.com.' }); const el = document.getElementById('sub-email'); if (el) el.focus(); return; } this.setState({ subDone: true }); };";
 t=need(t,oldSubscribe,"    v.subscribe = () => { if (!EMAIL_RE.test(s.subEmail.trim())) { this.setState({ subErr: 'Enter a valid email, such as name@business.com.' }); return; } window.parent.location.assign('/newsletter?email='+encodeURIComponent(s.subEmail.trim())); };");
 t=need(t,"      send: () => this.setState(s => ({ dl: { ...s.dl, [id]: EMAIL_RE.test((s.dlEmail[id] || '').trim()) ? 'sent' : 'err' } })) };",
 "      send: () => { const value=(this.state.dlEmail[id]||'').trim(); if(!EMAIL_RE.test(value)){this.setState(s=>({dl:{...s.dl,[id]:'err'}}));return;}window.parent.location.assign('/insights/download/'+encodeURIComponent(id)+'?email='+encodeURIComponent(value)); } };");
 t=need(t,"act: () => { if (d.gated) { this.setState(s => ({ dl: { ...s.dl, [id]: 'form' } })); setTimeout(() => { const el = document.getElementById('dl-' + id); if (el) el.focus(); }, 60); } else this.setState(s => ({ dl: { ...s.dl, [id]: 'done' } })); },",
 "act: () => { if(d.gated){this.setState(s=>({dl:{...s.dl,[id]:'form'}}));}else{window.open('/downloads/enquiry-log.pdf','_blank','noopener');} },");
 return t;
}
for(const [name,fn] of [['site',site],['assessment',assessment]]){
 let src=read(name);if(!src)throw Error('Source missing: '+name);
 if(name==='site')src=src.replace(/(<script\s+type="__bundler\/manifest"[^>]*>\s*)[\s\S]*?(\s*<\/script>)/,(_m,a,b)=>a+newManifest+b);
 let html=patch(src,fn,name==='site'?newSiteTemplate:undefined);html=html.replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">');html=brandedBoot(html,name);
 if(name==='assessment')html=html.replace('</head>','<script>window.humminAssessmentTurnstile=function(){window.dispatchEvent(new Event("hummin-assessment-turnstile"));};</script><script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=humminAssessmentTurnstile" async defer></script></head>');
 const dir=path.join('public','design',name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
 console.log('Restored high-fidelity '+name+' ('+html.length+' characters)');
}
const insightSource=read('site').replace(/(<script\s+type="__bundler\/manifest"[^>]*>\s*)[\s\S]*?(\s*<\/script>)/,(_m,a,b)=>a+newManifest+b);
const insightHtml=brandedBoot(patch(insightSource,insightTemplate,fullInsight).replace('<head>','<head>\\n<meta name="robots" content="noindex,nofollow">'),'insights');
fs.mkdirSync(path.join('public','design','insights'),{recursive:true});
fs.writeFileSync(path.join('public','design','insights','index.html'),insightHtml);
console.log('Restored original HUMMIN Insights index and articles ('+insightHtml.length+' characters)');
