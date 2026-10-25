import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(path,"utf8");
test("Every supplied Admin section has a dedicated visual implementation",()=>{
 const route=read("app/routes/admin.index.tsx");
 const modules=read("app/components/admin-other-screens.tsx");
 const workbench=read("app/components/admin-source-screens.tsx");
 for(const label of ["DashboardExact","BookingsExact","EngagementsExact","AnalyticsExact","InvoicesExact","ReportsExact","AssessmentSettingsExact","TeamExact","EmailExact","AudienceExact"])
  assert.ok(modules.includes("function "+label),label);
 for(const label of ["PipelineScreen","LeadsScreen","LeadDetailScreen","InboxScreen","InsightsListScreen","InsightsEditorScreen"])
  assert.ok(workbench.includes("function "+label),label);
 assert.ok(route.includes("view===\"analytics\""));
 assert.ok(route.includes("view===\"settings\""));
 assert.ok(route.includes("view===\"reports\""));
 assert.ok(route.includes("view===\"invoices\""));
});
test("Pipeline is the six-column assessment deal board from the source design",()=>{
 const ui=read("app/components/admin-source-screens.tsx"),service=read("app/lib/admin-source.server.ts");
 for(const name of ["new","contacted","call_booked","proposal_sent","won","lost"])assert.ok(service.includes(name));
 assert.ok(ui.includes('flex:"0 0 260px"'));
 assert.ok(ui.includes('operation="move_assessment"'));
 assert.ok(service.includes("admin_assessment_pipeline"));
 assert.ok(service.includes("admin_assessment_notes"));
});
test("Inbox uses a two-pane conversation model and only queues actual email delivery",()=>{
 const ui=read("app/components/admin-source-screens.tsx"),service=read("app/lib/admin-source.server.ts"),route=read("app/routes/admin.index.tsx");
 for(const term of ['thread_status','inbox_status','inbox_assign','inbox_reply','admin_inbox_replies','email_outbox','admin_audit'])assert.ok(service.includes(term));
 assert.ok(ui.includes('flex:"1 1 300px"')&&ui.includes('flex:"2 1 420px"'));
 assert.ok(ui.includes("Suggested")==false);
 assert.ok(route.includes('deliverDue(env,3)'));
});
test("Insights has versioned block editor, no fake public publish or mock article data",()=>{
 const ui=read("app/components/admin-source-screens.tsx"),service=read("app/lib/admin-source.server.ts");
 for(const block of ["Paragraph","Heading","List","Numbered list","Download","Assessment prompt"])assert.ok(ui.includes(block));
 for(const term of ["admin_insights_posts","admin_insights_revisions","source_slug","topics_json","blocks_json"])assert.ok(service.includes(term));
 assert.ok(service.includes('operation==="post_save"||operation==="post_publish"'));
 assert.ok(ui.includes('name="operation" value="post_publish"'));
 const sql=read("migrations/0006_admin_source_fidelity.sql");
 assert.ok(sql.includes("admin_insights_revisions"));
 for(const fake of ["LEADS0","THREADS0","POSTS0","BOOK0","TPLS0"])assert.ok(!ui.includes(fake));
});
