# HUMMIN source-native visual acceptance — 27 October 2026

## Verified result

- **Unified source-native visual gate: 42 / 42 PASS.**
- GitHub Actions run: https://github.com/bjuta/hummin/actions/runs/40550335703
- Workflow: `.github/workflows/hummin-source-full-42.yml`
- Verified development commit: `e1b6ff3cf0ff23f1452c62a10749829c5a5c6392`
- Development branch: `feat/fullstack-workers-foundation`
- Reference: `https://hummin.org`; candidate: `https://hummin-web-preview.grimpossible.workers.dev`
- Read-only viewport captures: **390px, 768px, 1440px** at 1x device scale, reduced-motion.
- Acceptance: pixel mismatch <= 8%, page-height difference <= 12px, no clipped horizontal overflow or unresolved source markers/hidden reveals as enforced by the family scripts.

| Family | Cases | Result |
|---|---:|---|
| Marketing (seven routes) | 21 | PASS |
| Assessment + Insights (five routes) | 15 | PASS |
| Privacy + Terms (two routes) | 6 | PASS |
| **Total** | **42** | **PASS** |

The full gate ran the three source-versus-native suites **sequentially in one workflow**. Each script wrote its summary and full-page original/candidate/difference captures. The aggregate script required the expected number of unique cases, zero rejected cases and successful subprocess exit codes.

- Run artifact: `hummin-source-native-42-visual-release-evidence` (artifact ID `12754797252`, retains captures per GitHub Actions artifact policy).
- Direct artifact page: https://github.com/bjuta/hummin/actions/runs/40550335703/artifacts/12754797252

## Scope and production safety

This certifies **visual fidelity only** for the isolated source-native Preview routes. It does **not** certify feature completeness or authorization to change public traffic. The public `hummin.org` site still uses the reversible legacy HTML fallback; the preview routes reject public hosts and carry noindex instructions.

The native source-verification Preview deliberately does not submit real enquiries, send email, reserve calendar slots, or run production data changes. The Assessment Preview exposes only selected static/partial source-model states; the complete 23-question assessment, scoring and downstream booking services require functional integration and non-delivery checks. Insights source-native editorial views require interaction, navigation and CMS/newsletter integration verification. Contact, Admin, security, SEO, accessibility and production migration/rollback checks must also be accepted before any public cutover.

**Release decision:** Visual gate accepted; **public React cutover not approved**. Keep `main`, production domains, databases, secrets, email and booking integrations unchanged. Do not remove `design/sources` or the legacy fallback while production depends on them.

## Reproduction and subsequent changes

Run `node scripts/measure-source-full-42.mjs` with the workflow's Playwright, pixelmatch and pngjs dependencies against a **deployed, fixed Preview candidate**. New UI/CSS/route changes require a new Preview deployment and complete fresh gate; do not carry forward these results to changed code or stale deployment artifacts. Preserve the original screenshots when diagnosing subsequent regressions.
