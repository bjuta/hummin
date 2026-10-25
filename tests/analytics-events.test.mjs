import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {validPage,channelFromReferrer} from "../app/routes/analytics.event.ts";
test("Anonymous pageview allowlist rejects Admin, API, querystrings and arbitrary paths",()=>{
 for(const path of ["/","/insights","/insights/article-slug","/assessment","/contact"])assert.equal(validPage(path),true,path);
 for(const path of ["/admin","/admin/login","/api/email/config","/assessment?email=a","/arbitrary","/../admin"])assert.equal(validPage(path),false,path);
});
test("Referrer classification is coarse and does not retain addresses",()=>{
 const base="https://hummin-web-preview.grimpossible.workers.dev";
 assert.equal(channelFromReferrer("",base),"direct");
 assert.equal(channelFromReferrer(base+"/about",base),"internal");
 assert.equal(channelFromReferrer("https://www.linkedin.com/feed/?id=private",base),"social");
 assert.equal(channelFromReferrer("https://www.google.com/search?q=private",base),"search");
 assert.equal(channelFromReferrer("https://example.com/private?token=abc",base),"referral");
});
test("Analytics queries are scoped and only display measured pageviews",()=>{
 const sql=fs.readFileSync("app/lib/admin-operations.server.ts","utf8");
 const view=fs.readFileSync("app/components/admin-other-screens.tsx","utf8");
 assert.match(sql,/web_analytics_daily/);
 assert.match(sql,/enquiries WHERE submitted_at/);
 assert.match(view,/not unique visitors/);
 const route=fs.readFileSync("app/routes/analytics.event.ts","utf8");
 assert.doesNotMatch(route,/ip_address|user_agent|cookie/i);
 assert.match(route,/ON CONFLICT\(day,path,channel\)/);
});
