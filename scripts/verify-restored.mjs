import assert from 'node:assert/strict';
import fs from 'node:fs';

const extract = name => {
  const html = fs.readFileSync('public/design/' + name + '/index.html', 'utf8');
  const match = html.match(/<script\s+type="__bundler\/template"[^>]*>\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(match, name + ': bundled design template missing');
  const page = JSON.parse(match[1]);
  assert.ok(page.length > 50000, name + ': original design is unexpectedly small');
  assert.match(html, /noindex,nofollow/, name + ': preview should not be indexed');
  return page;
};

const site = extract('site');
const assessment = extract('assessment');
const original = [
  ['Navigation uses real paths', site.includes('HUMMIN_ROUTE_PATHS') && site.includes("window.history.pushState")],
  ['Navigation follows browser back', site.includes("addEventListener('popstate'")],
  ['Original layout embeds the assessment', site.includes('/design/assessment/index.html')],
  ['Original typography retained', site.includes('Newsreader') && site.includes('Figtree')],
  ['Original slate/rust palette retained', site.includes('#1E272A') && site.includes('#B5532C')],
  ['Contact form follows server-side readiness', site.includes('window.HUMMIN_CONTACT_READY === true') && site.includes('v.contactInactive = !v.contactReady')],
  ['Contact is protected by a real Turnstile widget', site.includes('hummin-turnstile') && site.includes('turnstile.render') && site.includes('cf-turnstile-response')],
  ['Contact backend errors shown in original design', site.includes('contactStatus')],
  ['HUMMIN confirmation copy has no em dash', (() => { const a=site.indexOf('Enquiry received'); const b=site.indexOf('Send another enquiry',a); return a>=0&&b>a&&!site.slice(a,b).includes('—'); })()],
  ['Contact fallback has a real mailto', site.includes('Email sales@hummin.org')],
  ['No simulated contact confirmation', !site.includes("setTimeout(() => { this.setState({ sending: false, sent: true")],
  ['Assessment questions retained', assessment.includes('const STEPS = [') && assessment.includes('const GOALS = [')],
  ['Assessment result calculations retained', assessment.includes('const GAP = [') && assessment.includes('v.costMonthly')],
  ['Live availability fetch used', assessment.includes("fetch('/api/booking/slots'")],
  ['Live booking endpoint used', assessment.includes("fetch('/api/booking/reserve'")],
  ['No generated availability', !assessment.includes('const SL = [[9, 0]') && !assessment.includes('const full = x =>')],
  ['No fake event confirmation', !assessment.includes("UID:' + Date.now()")],
  ['Preview booking status visible', assessment.includes('liveBookingNotice')],
  ['Assessment email is triggered by a real verified request', assessment.includes("fetch('/api/assessment/email'") && assessment.includes('assessment-turnstile') && assessment.includes('queued for delivery')],
];
for (const [label, passed] of original) {
  assert.ok(passed, label);
  process.stdout.write('PASS  ' + label + '\n');
}
const preview = JSON.parse(fs.readFileSync('wrangler.preview.jsonc','utf8'));
assert.ok(['true','false'].includes(preview.vars.CONTACT_ENABLED), 'Contact enabled must be an explicit switch');
if(preview.vars.CONTACT_ENABLED === 'true'){
 const backend = fs.readFileSync('app/routes/contact.tsx','utf8');
 assert.ok(preview.vars.TURNSTILE_SITE_KEY, 'Turnstile site key required before enabling contact');
 assert.match(backend,/verifyTurnstile\(/);
 assert.match(backend,/RESEND_API_KEY/);
 assert.match(backend,/INSERT INTO enquiries/);
}

assert.equal(preview.vars.BOOKING_ENABLED, 'false');
assert.equal(preview.name, 'hummin-web-preview');
console.log('PASS  Preview deployments remain fail-closed');
console.log('HUMMIN design restoration and safety checks complete.');
