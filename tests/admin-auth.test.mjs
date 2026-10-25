import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {adminReady,sessionUser,correctOrigin,sessionCookie,clearCookie,sendAdminCode,completeAdminCode} from "../app/lib/admin-auth.server.ts";
import {signInCodeEmail,staffAccountActivatedEmail} from "../app/lib/email-templates.server.ts";
const read=p=>fs.readFileSync(p,"utf8");
test("Admin is fail-closed without an enabled and secret-backed environment",async()=>{
 const e={ADMIN_AUTH_ENABLED:"false"};
 assert.equal(adminReady(e),false);
 assert.equal(await sessionUser(e,new Request("https://hummin.org/admin")),null);
 assert.equal(await completeAdminCode(e,"owner@example.org","123456"),null);
 await sendAdminCode(e,"owner@example.org","https://hummin.org",()=>assert.fail("No mail should be sent"));
});
test("Admin sessions are secure and cross-site POST requests are rejected",()=>{
 assert.match(sessionCookie("abcdef"),/HttpOnly/);
 assert.match(sessionCookie("abcdef"),/Secure/);
 assert.match(sessionCookie("abcdef"),/SameSite=Strict/);
 assert.match(sessionCookie("abcdef"),/Max-Age=28800/);
 assert.match(clearCookie(),/Max-Age=0/);
 assert.equal(correctOrigin(new Request("https://hummin.org/admin/verify",{method:"POST",headers:{Origin:"https://evil.example"}})),false);
 assert.equal(correctOrigin(new Request("https://hummin.org/admin/verify",{method:"POST",headers:{Origin:"https://hummin.org"}})),true);
});
test("Preview never exposes public self-registration or mock admin data",()=>{
 const p=JSON.parse(read("wrangler.preview.jsonc"));
 assert.equal(p.vars.ADMIN_AUTH_ENABLED,"true");
 assert.equal(adminReady({ADMIN_AUTH_ENABLED:"true"}),false);
 assert.equal(adminReady({ADMIN_AUTH_ENABLED:"true",DB:{},ADMIN_AUTH_PEPPER:"example-secret",RESEND_API_KEY:"example-api",EMAIL_FROM:"HUMMIN <hello@notify.hummin.org>"}),true);
 const routes=read("app/routes.ts");
 for(const path of ["admin/login","admin/verify","admin/logout","admin"])assert.ok(routes.includes('route("'+path+'"'));
 const migration=read("migrations/0004_admin_accounts.sql");
 assert.match(migration,/CREATE TABLE IF NOT EXISTS admin_users/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS admin_auth_challenges/);
 assert.match(migration,/CREATE TABLE IF NOT EXISTS admin_sessions/);
 assert.match(read("app/lib/admin-auth.server.ts"),/FROM admin_users WHERE email=\?/);
 assert.match(read("app/lib/admin-auth.server.ts"),/attempts<5/);
 assert.match(read("app/lib/admin-auth.server.ts"),/HMAC/);
 assert.match(read("app/routes/admin.index.tsx"),/sessionUser/);
 assert.match(read("app/lib/admin-data.server.ts"),/COUNT\(\*\)/);
 assert.doesNotMatch(read("app/routes/admin.index.tsx"),/LEADS0|THREADS0|BOOK0|TPLS0/);
});
test("Branded account emails use operational links and verified identity fallback",()=>{
 const signIn=signInCodeEmail({recipient:"staff@example.org",name:"Staff Member",code:"123456",expiresMinutes:10,assetOrigin:"https://hummin.org"});
 assert.equal(signIn.type,"account-sign-in");
 assert.match(signIn.text,/123 456/);
 const welcome=staffAccountActivatedEmail({recipient:"staff@example.org",name:"Staff Member",role:"editor",assetOrigin:"https://hummin.org"});
 assert.equal(welcome.type,"account-welcome");
 assert.match(welcome.html,/https:\/\/hummin.org\/admin/);
 const mail=read("app/lib/mail-outbox.server.ts");
 assert.ok(mail.includes('env.EMAIL_FROM_SYSTEM'));
 assert.ok(mail.includes('env.EMAIL_FROM_PEOPLE'));
 assert.ok(mail.includes('||env.EMAIL_FROM'));
});

test("HUMMIN Admin keeps the supplied standalone navigation and removes public site chrome",()=>{
 const shell=read("app/components/admin-chrome.tsx");
 const app=read("app/root.tsx");
 const workbench=read("app/routes/admin.index.tsx");
 assert.match(shell,/hm-menu-popover/);
 assert.match(shell,/hm-menu-button/);
 assert.match(shell,/mark-dark\.png/);
 assert.match(shell,/rgba\(244,245,241/);
 assert.match(shell,/Newsreader/);
 assert.match(workbench,/AdminChrome/);
 assert.match(workbench,/menuItems=\{accessible/);
 assert.match(app,/pathname\.startsWith\("\/admin\/"\)/);
});
test("The OTP is announced, ten-minute limited, autofill compatible and automatically verified",()=>{
 const login=read("app/routes/admin.login.tsx");
 const verify=read("app/routes/admin.verify.tsx");
 assert.match(login,/admin\/verify\?email=/);
 assert.match(login,/issued=/);
 assert.match(verify,/Sign-in code requested/);
 assert.match(verify,/expires 10 minutes/);
 assert.match(verify,/role="timer"/);
 assert.match(verify,/autoComplete="one-time-code"/);
 assert.match(verify,/Array\.from\(\{length:6\}/);
 assert.match(verify,/next\.length===6/);
 assert.match(verify,/submit\(payload,\{method:"post"/);
 assert.match(verify,/change\(e\.target\.value\)/);
 assert.match(verify,/replace\(\/\\D\/g/);
});
test("All branded email headers have rounded top corners",()=>{
 const mail=signInCodeEmail({recipient:"staff@example.org",name:"Staff",code:"123456",expiresMinutes:10,assetOrigin:"https://hummin.org"});
 assert.match(mail.html,/border-radius:18px 18px 0 0/);
 assert.match(mail.html,/max-width:600px/);
 assert.match(mail.html,/border-radius:18px;overflow:hidden/);
});
