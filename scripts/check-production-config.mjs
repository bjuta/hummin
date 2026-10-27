import assert from "node:assert/strict";
import fs from "node:fs";
const conf=JSON.parse(fs.readFileSync("wrangler.production.jsonc","utf8"));
const preview=JSON.parse(fs.readFileSync("wrangler.preview.jsonc","utf8"));
assert.equal(conf.name,"hummin-web-production");
assert.equal(conf.vars.SITE_URL,"https://hummin.org");
assert.equal(conf.vars.CONTACT_ENABLED,"true");
assert.equal(conf.vars.BOOKING_ENABLED,"true");
assert.equal(conf.vars.BOOKING_AVAILABILITY_ENABLED,"false");
assert.equal(conf.vars.ADMIN_AUTH_ENABLED,"true");
assert.equal(conf.keep_vars,true,"Keep dashboard-managed production variables across deployments");
assert.ok(!("TURNSTILE_SITE_KEY" in conf.vars),"Turnstile site key is dashboard-managed");
assert.equal(conf.workers_dev,true);
assert.equal(conf.d1_databases.length,1);
assert.notEqual(conf.d1_databases[0].database_id,preview.d1_databases[0].database_id);
assert.equal(conf.d1_databases[0].database_name,"hummin-web-production");
assert.ok(!JSON.stringify(conf).includes("routes"));
assert.ok(!JSON.stringify(conf).includes("hummin.org/*"));
assert.ok(!("RESEND_API_KEY" in conf.vars));
assert.ok(!("ADMIN_AUTH_PEPPER" in conf.vars));
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
assert.match(pkg.scripts["db:production"],/--config wrangler.production.jsonc --remote/);
// Build selection must be explicit; Wrangler must deploy the generated SSR
// output, never rebundle the raw worker.ts entry with an unresolved virtual import.
assert.match(pkg.scripts["deploy:production:staging"],/HUMMIN_DEPLOY_TARGET=production/);
assert.match(pkg.scripts["deploy:production:staging"],/--config build\/server\/wrangler\.json/);
assert.doesNotMatch(pkg.scripts["deploy:production:staging"],/--config wrangler\.preview\.jsonc/);
console.log("PASS: isolated, non-public production staging with enabled service configuration");
