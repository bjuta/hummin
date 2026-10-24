# HUMMIN launch gates

The full-stack website is not yet production-ready.

- [ ] GitHub CI passes: npm install, typecheck, server build
- [ ] Test mobile, desktop, keyboard navigation and form accessibility
- [ ] Commit approved HUMMIN logo files and photographs
- [ ] Restore original 20-question assessment (questions, scoring, outcomes, tests)
- [ ] Approve a complete privacy notice and retention policy
- [ ] Provision preview/production D1, apply migrations and configure backups
- [ ] Configure Cloudflare Turnstile site key + secret and allowed hostnames
- [ ] Verify a Resend sending domain; send a genuine test enquiry to sales@hummin.org
- [ ] Confirm Google Workspace MX records are unchanged
- [ ] Validate bad-input, failed Turnstile, provider failures and successful submissions
- [ ] Establish an operational review for pending/failed D1 enquiries
- [ ] Approve PR and Cloudflare preview deployment before using hummin.org
- [ ] Remove robots.txt Disallow and draft privacy placeholder only at launch

**Security default:** the online contact form is disabled while any of D1, Resend, Turnstile site key, Turnstile secret, or sender address are missing. The website does not show a false success message. No secrets belong in GitHub.
