import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const html = read('public/design/insights/index.html');
const matched = html.match(/<script\s+type="__bundler\/template"[^>]*>\s*([\s\S]*?)\s*<\/script>/);
assert.ok(matched, 'Restored Insights design template must exist');
const insights = JSON.parse(matched[1]);

const start = insights.indexOf('const POSTS = [');
const end = insights.indexOf('\n];', start);
assert.ok(start >= 0 && end > start, 'Insights article corpus must be present');
const corpus = insights.slice(start, end + 3);
const frontSlugs = [...corpus.matchAll(/\bslug:\s*'([^']+)'/g)].map(m => m[1]).sort();
const serverSlugs = [...read('app/lib/insights.server.ts').matchAll(/\bslug:"([^"]+)"/g)].map(m => m[1]).sort();
assert.ok(frontSlugs.length >= 4, 'Expected authored articles are missing');
assert.deepEqual(frontSlugs, serverSlugs, 'Article URLs and server metadata must match');

const routes = read('app/routes.ts');
const loader = read('app/routes/fidelity.ts');
const features = [
 ['Dedicated article URLs', routes.includes('route("insights/:slug"') && insights.includes("'/insights/'+data.slug")],
 ['Author profile URLs', routes.includes('route("insights/author/:author"') && insights.includes("'/insights/author/'+data.author")],
 ['Topic archive URLs', routes.includes('route("insights/topic/:topic"') && insights.includes("'/insights/topic/'+slugify")],
 ['Seamless article navigation (no full document reload)', insights.includes('window.parent.postMessage({humminRoute:path}') && !insights.includes('window.parent.location.assign(path)')],
 ['Article search and filtering', insights.includes('v.noResults') && insights.includes('v.cards = list.map')],
 ['Content-based iframe sizing with no resize feedback', insights.includes('getBoundingClientRect().bottom') && insights.includes('_lastSentInsightsHeight') && !read('app/routes/fidelity.ts').includes('humminInsightsHeight+8')],
 ['Related reading', insights.includes('v.related = rel') && insights.includes('v.hasRelated')],
 ['LinkedIn, WhatsApp, X and email sharing', ['linkedin.com/sharing','wa.me/?text=','x.com/intent/post','mailto:?subject='].every(k => insights.includes(k))],
 ['Copy-link confirms only real success', insights.includes("copied = !!document.execCommand('copy')") && insights.includes('copyFailed: !copied') && !insights.includes('then(done, done)')],
 ['Newsletter uses confirmed subscription page', insights.includes("'/newsletter?email='") && routes.includes('route("newsletter"')],
 ['Downloads use real resources', insights.includes("'/downloads/enquiry-log.pdf'") && insights.includes("'/insights/download/'")],
 ['Server-side article sharing metadata', loader.includes('BlogPosting') && loader.includes('og:title') && loader.includes('og:description') && loader.includes('datePublished')],
 ['Original type and palette preserved', insights.includes('Newsreader') && insights.includes('#B5532C')],
 ['Preview excluded from indexing', html.includes('noindex,nofollow') && loader.includes('X-Robots-Tag')]
];
for (const [label, pass] of features) {
 assert.ok(pass, label);
 console.log('PASS Insights: ' + label);
}
for (const [file, marker] of [['public/downloads/enquiry-log.pdf','%PDF-'], ['public/downloads/monday-figures.xlsx','PK']]) {
 assert.ok(fs.existsSync(file), file + ' not built');
 assert.equal(fs.readFileSync(file).subarray(0, marker.length).toString(), marker, file + ' invalid signature');
}
console.log('PASS Insights: article metadata, navigation, sharing and downloads');