/** Source-derived, native React HUMMIN copy and data.
 * Transcribed from the owner's design. No HTML template executes at runtime.
 */
export const HEADS = {
  how: { label: 'How We Work', icon: 'route', iconPaper: 'route', title: 'Understand the problem. Then fix it.', lead: 'We begin by understanding the business. Then we agree what needs to change, who will do the work, and how progress will be measured.' },
  core: { label: 'Applied Expertise', icon: 'layers', iconPaper: 'layers', title: 'The skills we bring to the work.', lead: 'Most business problems touch more than one area. We bring in the skills each problem needs and manage them as one team, so you deal with one point of contact.' },
  eng: { label: 'Engagements', icon: 'handshake', iconPaper: 'handshake', title: 'Review. Project. Residency.', lead: 'Three ways to work with us. Each one stands alone, and many clients start with a Review.' },
  who: { label: 'Who We Work With', icon: 'users', iconPaper: 'users', title: 'You know your business.', lead: 'We bring another set of eyes and the people needed to act. We work with established, owner-led businesses that want to grow but are short of time or skills.' },
  about: { label: 'About', icon: 'building-2', iconPaper: 'building-2', title: 'About HUMMIN.', lead: 'Businesses rarely encounter problems in neat categories. We work alongside owners to understand what is happening, bring in the right expertise, and stay involved in the work.' },
  contact: { label: 'Contact', icon: 'mail', iconPaper: 'mail', title: 'Discuss a business challenge.', lead: 'Tell us what you would like to work on. You don’t need to know which discipline it falls under.' }
};
export const HERO_STYLE = {
  how: { bg: 'radial-gradient(circle at 70% 20%,#5E6967 0%,#2A3538 40%,#1E272A 72%)', glow: 'radial-gradient(circle at 12% 95%,rgba(30,39,42,0.6),transparent 45%)', chip: 'Four steps', img: 'Image: reviewing a process with the people who run it.' },
  core: { bg: 'radial-gradient(circle at 30% 15%,#5E6967 0%,#2A3538 42%,#1E272A 75%)', glow: 'radial-gradient(circle at 90% 90%,rgba(30,39,42,0.6),transparent 45%)', chip: 'Seven areas', img: 'Image: a working session with specialists.' },
  eng: { bg: 'radial-gradient(circle at 80% 30%,#434F4F 0%,#2A3538 40%,#1E272A 72%)', glow: 'radial-gradient(circle at 20% 90%,rgba(30,39,42,0.6),transparent 48%)', chip: 'Review · Project · Residency', img: 'Image: a HUMMIN professional on site.' },
  who: { bg: 'radial-gradient(circle at 65% 25%,#5E6967 0%,#2A3538 42%,#1E272A 74%)', glow: 'radial-gradient(circle at 10% 90%,rgba(30,39,42,0.6),transparent 45%)', chip: 'Owner-led businesses', img: 'Image: an owner in their place of business.' },
  about: { bg: 'radial-gradient(circle at 75% 20%,#5E6967 0%,#2A3538 40%,#1E272A 72%)', glow: 'radial-gradient(circle at 15% 95%,rgba(30,39,42,0.6),transparent 45%)', chip: 'Nairobi, Kenya', img: 'Image: the HUMMIN team at work.' },
  contact: { bg: 'radial-gradient(circle at 70% 30%,#434F4F 0%,#2A3538 40%,#1E272A 72%)', glow: 'radial-gradient(circle at 85% 95%,rgba(30,39,42,0.6),transparent 45%)', chip: 'sales@hummin.org', img: '' }
};
export const STAGES = [
  { name: 'Understand', short: 'We find the cause behind the symptom.', what: 'We talk to you and your team, look at how the work gets done, and review the numbers. We look for the cause behind the symptom.', out: 'a clear statement of the problem and what it costs the business.' },
  { name: 'Architect', short: 'We agree the plan, the people, and the cost.', what: 'We agree what needs to change, who will do it, what it will cost, and how we will measure it.', out: 'a plan with roles, costs, and measures.' },
  { name: 'Execute', short: 'We do the work with your team.', what: 'We do the work alongside your team and report progress to the person who makes decisions.', out: 'the agreed work, done and measured.' },
  { name: 'Institutionalise', short: 'We write it down and hand it over.', what: 'We write down the new way of working, train the people who will run it, and hand it over.', out: 'written processes, trained staff, and measures you can keep using.' }
];
export const DOMAINS = [
  { name: 'Strategy', icon: 'compass', lead: 'Decide which problems to solve first, and why.', jobs: 'We review how the business makes money and where it loses it, set clear priorities for the next 12 months, and turn the plan into a schedule of work with named owners.' },
  { name: 'Technology', icon: 'monitor-smartphone', lead: 'Make your systems fit the way the business works.', jobs: 'We build or fix websites, set up CRMs so every enquiry is recorded, and automate repeated admin tasks.' },
  { name: 'Marketing', icon: 'megaphone', lead: 'Bring in the right customers, and keep track of them.', jobs: 'We clarify who you sell to and what you say, plan and run advertising, and check what happens to each enquiry after it arrives.' },
  { name: 'Operations', icon: 'workflow', lead: 'Make everyday work run smoothly.', jobs: 'We map how work moves through the business, remove the steps that slow it down, and set up simple reports on how it is going.' },
  { name: 'Talent', icon: 'user-round-check', lead: 'Put the right people in the right roles.', jobs: 'We write clear roles and responsibilities, help recruit for key positions, and train staff on new processes and tools.' },
  { name: 'Data', icon: 'chart-column', lead: 'Base decisions on records you can trust.', jobs: 'We choose the figures worth tracking, build simple monthly dashboards, and measure whether a change worked.' },
  { name: 'Specialist Partners', icon: 'briefcase', lead: 'Bring in qualified experts when the work needs them.', jobs: 'Accountants, financial advisers, lawyers, HR professionals, software engineers, and recruiters, managed by HUMMIN under one agreement.', ext: true }
];
export const ENGS = [
  { tag: 'Short engagement', icon: 'search', name: 'Review', body: 'We investigate a problem and give you a clear plan to fix it.', itemsText: 'You get a review of the area that is not working, our findings in order of priority, and a practical plan with costs and measures.', comm: 'a fixed fee for an agreed scope.' },
  { tag: 'Defined work', icon: 'hammer', name: 'Project', body: 'We design and deliver a defined piece of work.', itemsText: 'You get agreed deliverables and milestones, a clear definition of done, any specialist partners managed by us, and regular progress reports.', comm: 'paid at milestones. Any extra costs are agreed in advance.' },
  { tag: 'Ongoing', icon: 'door-open', name: 'Residency', body: 'A HUMMIN professional works inside your team, with support from Applied Expertise.', itemsText: 'They coordinate the agreed work day to day, bring in HUMMIN specialists when needed, and are managed by HUMMIN. Their role and reporting lines are set in the contract.', comm: 'a monthly fee based on scope and the people involved.' }
];
export const TOPICS = [
  { title: 'Enquiries that go unanswered.', area: 'Marketing · Operations', lead: 'Enquiries arrive, but no one owns the follow-up. Some never get a reply.', look: 'How enquiries arrive, who answers them, how quickly, and what gets recorded.', start: 'A Review. It shows where enquiries are lost and what to fix first.' },
  { title: 'A website that loses visitors.', area: 'Technology', lead: 'People visit the site but do not call, write, or buy.', look: 'What visitors look for, where they leave, and how the site asks them to get in touch.', start: 'A Review, then a Project to rebuild the pages that matter.' },
  { title: 'Systems the team does not use.', area: 'Technology · Talent', lead: 'The business paid for tools, but the team works around them.', look: 'How the work is done today, where the tools get in the way, and what training is missing.', start: 'A Review. Often followed by a Project to set the tools up properly.' },
  { title: 'Too much still runs through the owner.', area: 'Strategy · Operations', lead: 'Decisions and approvals wait for one person, so work slows down.', look: 'Which decisions can be handed over, to whom, and within what limits.', start: 'A Review, then a Residency to make the change stick.' },
  { title: 'Figures that arrive too late to act on.', area: 'Data', lead: 'Reports come weeks after the month ends, when it is too late to act.', look: 'Which figures matter, where they come from, and how to get them sooner.', start: 'A Project to set up a simple monthly dashboard.' },
  { title: 'A team stretched too thin.', area: 'Talent', lead: 'Good people are doing too many jobs, and some work is not getting done.', look: 'Who does what today, what can be removed, and which roles are missing.', start: 'A Review of roles and workload.' }
];
export const VALUES = [
  { short: 'Understanding', t: 'Understanding before intervention.', b: 'We investigate before prescribing.', not: 'Recommend a fix before we understand the problem.' },
  { short: 'Action', t: 'Intelligence in action.', b: 'We connect insight to implementation.', not: 'Hand over a report and walk away when the work is ours to do.' },
  { short: 'Independence', t: 'Proximity with independence.', b: 'We work closely with clients without surrendering professional judgement.', not: 'Tell you what you want to hear.' },
  { short: 'Discipline', t: 'Adaptability with discipline.', b: 'We tailor solutions without compromising quality or accountability.', not: 'Sell every client the same solution.' },
  { short: 'Responsibility', t: 'Partnership with responsibility.', b: 'We treat trust as an obligation and agreed outcomes as a shared priority.', not: 'Share your information without your permission.' },
  { short: 'Capability', t: 'Capability beyond dependency.', b: 'We build systems and people that become stronger through our involvement.', not: 'Make the business depend on us.' }
];
export const NEEDS = [
  { icon: 'user-round-check', v: 'A decision-maker', k: 'One person who can approve changes.' },
  { icon: 'key-round', v: 'Access', k: 'To the information and systems the work depends on.' },
  { icon: 'clock', v: 'Time', k: 'With the people who do the work every day.' },
  { icon: 'target', v: 'A measure', k: 'Agreed at the start, so we both know what a good result looks like.' }
];
export const TIERS = [
  { name: 'Review', tag: 'Short engagement', best: 'You know something is wrong, but not exactly what.', what: 'We investigate the problem and set out a clear plan to fix it.', get: 'Findings in order of priority, and a practical plan with costs and measures.', ends: 'When the plan is delivered to you.', role: 'Share information and give us time with your team.', fees: 'A fixed fee for an agreed scope.' },
  { name: 'Project', tag: 'Defined work', best: 'You know what needs to change and need it done.', what: 'We design and deliver a defined piece of work, managing any specialists involved.', get: 'Agreed deliverables, milestones, and regular progress reports.', ends: 'When the agreed work meets its definition of done.', role: 'Approve the plan and make decisions on time.', fees: 'Paid at milestones. Extra costs are agreed in advance.' },
  { name: 'Residency', tag: 'Ongoing', best: 'You need someone close to the work, week after week.', what: 'A HUMMIN professional works inside your team, supported by our Applied Expertise.', get: 'Day-to-day coordination, and access to HUMMIN specialists when needed.', ends: 'Ongoing, reviewed on dates we agree.', role: 'Set direction and agree the role and reporting lines.', fees: 'A monthly fee based on scope and the people involved.' }
];
export const TIER_ROWS = [['Best when', 'best'], ['What happens', 'what'], ['You get', 'get'], ['Ends', 'ends'], ['Your part', 'role'], ['Fees', 'fees']];
export const FIELDS = [
  { k: 'name', label: 'Name', type: 'text', ph: 'Your full name' },
  { k: 'biz', label: 'Business Name', type: 'text', ph: 'Registered or trading name' },
  { k: 'email', label: 'Work Email', type: 'email', ph: 'name@business.com' },
  { k: 'msg', label: 'What Would You Like to Work On?', type: 'text', ph: 'A few sentences about the challenge', multi: true }
];
