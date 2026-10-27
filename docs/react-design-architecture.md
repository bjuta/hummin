# HUMMIN frontend architecture — adopted 26 October 2026

## Binding decision

**React owns all production UI and behaviour. HTML is the original design reference, not the production rendering framework.** Retain the owner's HTML as an immutable visual and content reference while implementing the same typography, palette, spacing, navigation, interactions, responsive layouts, illustrations, section structure and content using React components, CSS and structured data. Preserve design fidelity; do not replace the original design with generic card layouts.

### Confirmed current state — migration not finished

The public routing application already runs on React Router and Cloudflare Workers. However, the following original website routes still return the `/design/site/index.html` compiled HTML runtime from `app/routes/fidelity.ts`:

- `/`, `/how-we-work`, `/applied-expertise`, `/engagements`, `/who-we-work-with`, `/about`, `/contact`
- `/assessment` and `/insights` additionally mount their original design documents via iframes.

In contrast, `/privacy`, `/terms`, `/newsletter`, Admin routes and several backend/API routes use native React or server endpoints. The legal pages now share a **React implementation** of the navigation designed in the source HTML; it does not import the legacy site template. This corrects their inconsistent header without pretending that all of HUMMIN is converted.

## Migration contract

1. Use the HTML design and source templates for **reference only**. Build reusable React `SiteHeader`, `SiteFooter`, `Hero`, navigation drawer, form field, assessment, article and section components; keep copy in structured modules.
2. Migrate the public routes page by page, preserving visual parity and the established business logic. Main content uses native document scrolling; avoid body locking and full-page scroll divs that block native mobile browser chrome collapse.
3. Remove the embedded Assessment and Insights iframes only when their complete React interfaces pass end-to-end behaviour, SEO, browser, accessibility and visual parity tests.
4. On each migrated page, maintain Cloudflare D1/Google/Resend/Turnstile integration, CRM events, and correct success/error/retry handling. Do not change live bindings or booking flags when migrating presentation.
5. Use source and migrated page screenshots at 390, 768 and 1440 px, interaction tests, headings/landmarks and accessibility audits as cutover gates. Source HTML can remain in `design/sources` but must not be used as a runtime route or script when the migration is finished.
6. **Do not remove working HTML routes until the equivalent React route is demonstrably feature complete**. That would regress a live, operational website. After final cutover, remove `app/routes/fidelity.ts` and the `restore-original.mjs` build dependency, stop shipping `/design/**/index.html`, and test there are no iframe or legacy script dependencies.

## Mobile browser chrome

The mobile operating system and browser control its URL and toolbar UI. HUMMIN cannot programmatically guarantee that those bars disappear. Our implementation should preserve native scroll gestures, viewport meta, uninterrupted vertical document scrolling and safe viewport usage so the browser may automatically collapse chrome on supported platforms. Never use fake fullscreen, unsupported JavaScript scroll tricks or a scroll-trapping fixed-height application container to simulate native browser behaviour.
