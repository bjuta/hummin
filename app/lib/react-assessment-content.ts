/** Source-exact HUMMIN assessment question model.
 * Extracted from the owner-designed assessment. Not a page HTML runtime.
 * The UI migration must preserve weighted scoring, currency handling,
 * loss estimates, explicit consent, server calendar booking, and email.
 */
export const AREAS = [
  { k: 'direction', name: 'Direction' }, { k: 'customers', name: 'Customers' }, { k: 'operations', name: 'Operations' },
  { k: 'people', name: 'People' }, { k: 'information', name: 'Information' }
];
export const GOALS = [
  { label: 'Grow sales', w: { direction: 1, customers: 1.6, operations: 1, people: 0.8, information: 1 } },
  { label: 'Free up my time', w: { direction: 1, customers: 0.8, operations: 1.4, people: 1.5, information: 1 } },
  { label: 'Improve profit margins', w: { direction: 1, customers: 1, operations: 1.4, people: 0.8, information: 1.4 } },
  { label: 'Prepare it to run without me', w: { direction: 1.4, customers: 0.8, operations: 1.2, people: 1.5, information: 1.2 } }
];
export const C = (area:string,id:string,text:string,why:string,opts:string[]) => ({ type: 'choice', area, id, text, why, options: opts.map((label, i) => ({ label, pts: 3 - i })) });
export const STEPS = [
  { type: 'choice', area: 'goal', id: 'goal', text: 'What do you most want from the business in the next 12 months?', why: 'We weight your results around this goal.', options: GOALS.map(g => ({ label: g.label })) },
  C('direction', 'd1', 'How would your team describe the main goal for this year?', 'If the goal is not clear to the team, effort goes in different directions.', ['They would all say the same thing, in similar words.', 'Most of them would get close.', 'They would give different answers.', 'We have not set one.']),
  C('direction', 'd2', 'How do you decide which projects to take on?', 'Without written priorities, the urgent usually beats the important.', ['Against a short, written list of priorities.', 'We discuss it, but nothing is written down.', 'Mostly on instinct or urgency.', 'Whatever comes up first.']),
  C('direction', 'd3', 'How often do you check progress against your plan?', 'A plan only helps if someone looks at it.', ['Monthly, with figures.', 'Every few months.', 'Once a year, if that.', 'We do not have a plan to check against.']),
  C('customers', 'c1', 'When an enquiry arrives, who replies, and how fast?', 'Speed of reply is one of the strongest signs of whether an enquiry becomes a sale.', ['A named person, within the hour.', 'Someone replies the same day.', 'It depends on who sees it.', 'Nobody tracks this.']),
  C('customers', 'c2', 'Where are enquiries recorded?', 'An enquiry that is not recorded cannot be followed up.', ['In one system the whole team uses.', 'In a spreadsheet.', 'In phones, chats, and inboxes.', 'They are not recorded.']),
  C('customers', 'c3', 'Do you know which channel brings your best customers?', 'Knowing this tells you where to spend time and money.', ['Yes, we track it.', 'We have a good idea.', 'We would be guessing.', 'No.']),
  C('operations', 'o1', 'If a key person were away for two weeks, what would happen?', 'This shows how much of the business lives in people’s heads.', ['Work would continue. It is written down.', 'Some delays, but we would manage.', 'Important work would stop.', 'The business would struggle badly.']),
  C('operations', 'o2', 'How are routine tasks done?', 'Consistent work is easier to check, teach, and improve.', ['The same way each time, from written steps.', 'Mostly the same way, but nothing is written.', 'Each person does it their own way.', 'We fix problems as they happen.']),
  C('operations', 'o3', 'How much of your own week goes on day-to-day running?', 'Time spent running the business is time not spent growing it.', ['Under a quarter.', 'About half.', 'Most of it.', 'Nearly all of it.']),
  C('people', 'p1', 'Does everyone know what they are responsible for?', 'Unclear roles lead to gaps and duplicated work.', ['Yes. Roles are written and up to date.', 'Mostly, but some roles overlap.', 'Roles are unclear.', 'Everyone does a bit of everything.']),
  C('people', 'p2', 'How do new staff learn the job?', 'How people are trained shapes how well the work is done.', ['A planned induction with written guides.', 'They shadow a colleague.', 'They pick it up as they go.', 'We rarely have time to train anyone.']),
  C('people', 'p3', 'When someone is not performing, what happens?', 'How this is handled affects the whole team.', ['We address it quickly, with clear expectations.', 'We talk about it, eventually.', 'We work around it.', 'Nothing changes.']),
  C('information', 'i1', 'How soon after month end do you see your figures?', 'Late figures mean late decisions.', ['Within a week.', 'Within a month.', 'When the accountant sends them.', 'We do not see monthly figures.']),
  C('information', 'i2', 'Which figures do you check every week?', 'A few figures, checked often, beat many figures checked rarely.', ['A short set we agreed on.', 'Sales only.', 'Whatever someone mentions.', 'None.']),
  C('information', 'i3', 'When you make a big decision, what is it based on?', 'Good records make decisions faster and safer.', ['Records we trust.', 'Records, plus judgement.', 'Mostly judgement.', 'Gut feeling.']),
  { type: 'numbers', area: 'numbers', id: 'nums', text: 'A few numbers, so we can estimate what the gaps cost.', why: 'Rough figures are fine. If you do not know one, say so; that tells us something too.' },
  { type: 'choice', area: 'you', id: 'size', text: 'How many people work in the business?', why: 'This helps us compare you with similar businesses.', options: ['1 to 5', '6 to 20', '21 to 50', 'More than 50'].map(label => ({ label })) },
  { type: 'choice', area: 'you', id: 'obstacle', text: 'What has stopped you fixing this so far?', why: 'Most owners already know what needs to change. Something gets in the way.', options: ['Time', 'The right skills in the team', 'Not sure where to start', 'Cost', 'We tried before and it did not stick'].map(label => ({ label })) },
  { type: 'choice', area: 'you', id: 'help', text: 'How would you prefer to fix it?', why: 'There is no wrong answer. It changes what we suggest next.', options: ['Myself, with a clear plan', 'With guidance from someone experienced', 'Have it done, working with my team'].map(label => ({ label })) },
  { type: 'choice', area: 'you', id: 'timing', text: 'When would you like to start?', why: 'This helps us suggest a realistic next step.', options: ['This month', 'In the next three months', 'Later this year', 'I am just exploring'].map(label => ({ label })) },
  { type: 'choice', area: 'you', id: 'decide', text: 'Who makes the final decision on work like this?', why: 'So we know who should be part of the conversation.', options: ['Me', 'Me, with a partner or family', 'Someone else'].map(label => ({ label })) },
  { type: 'text', area: 'you', id: 'ninety', text: 'If the next 90 days went well, what would be different?', why: 'Optional. A sentence or two is plenty.', ph: 'For example: every enquiry gets a reply the same day, and I take a week off.' }
];
export const SECTIONS = [{ k: 'goal', name: 'Your goal' }, ...AREAS, { k: 'numbers', name: 'Your numbers' }, { k: 'you', name: 'About you' }];
export const SEG = [{ k: 'goal' }, { k: 'direction' }, { k: 'customers' }, { k: 'operations' }, { k: 'people' }, { k: 'information' }, { k: 'tail' }];
export const CURRENCIES = [['KES', 'Kenyan shilling (KES)'], ['USD', 'US dollar (USD)'], ['UGX', 'Ugandan shilling (UGX)'], ['TZS', 'Tanzanian shilling (TZS)'], ['RWF', 'Rwandan franc (RWF)'], ['NGN', 'Nigerian naira (NGN)'], ['ZAR', 'South African rand (ZAR)'], ['GBP', 'Pound sterling (GBP)'], ['EUR', 'Euro (EUR)']];
export const NUMS = [
  { k: 'sale', label: 'Average value of a sale or order', ph: '25000', unit: '', money: true, help: 'Roughly what a typical customer spends in one purchase.' },
  { k: 'enq', label: 'New enquiries in a typical month', ph: '40', unit: 'a month', help: 'Calls, messages, emails, and walk-ins from people who might buy.' },
  { k: 'conv', label: 'Of every 10 enquiries, how many become customers?', ph: '3', unit: 'out of 10', help: 'Your best estimate.' },
  { k: 'hours', label: 'Hours a week you spend on day-to-day running', ph: '45', unit: 'hours a week', help: 'Approving, chasing, fixing, and answering questions.' }
];
export const GAP = [0.05, 0.15, 0.35, 0.5];
export const PLAN = {
  direction: { diy: 'Write the one goal for the next 12 months in a single sentence. Share it with the team this week and ask each person how their work supports it.', help: 'A Review to set priorities with figures, then monthly check-ins until the plan runs on its own.' },
  customers: { diy: 'Name one person to own every enquiry. For 30 days, log each one with the date, source, reply time, and outcome.', help: 'A Project to set up a simple CRM and a reply routine your team will use.' },
  operations: { diy: 'Pick the three tasks that go wrong most often. Write the steps for each on one page, and have the person who does them check it.', help: 'A Review of how work moves through the business, then a Project to remove the steps that slow it down.' },
  people: { diy: 'Write a five-line role for each person: what they own, what they decide, and who they report to. Go through it with each of them.', help: 'Clear roles, a hiring plan for gaps, and training on new ways of working.' },
  information: { diy: 'Choose five figures to see every Monday: sales, enquiries, cash in the bank, money owed to you, and one figure for your biggest bottleneck.', help: 'A Project to build a simple monthly dashboard from the records you already have.' }
};
