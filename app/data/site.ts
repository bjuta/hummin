export const serviceAreas = [
 {name:"Strategy", lead:"Decide which problems to solve first, and why.",jobs:"We review how the business makes money and where it loses it, set clear priorities, and turn the plan into work with named owners."},
 {name:"Technology",lead:"Make your systems fit the way the business works.",jobs:"We build or fix websites, set up customer relationship systems, and automate repeated admin tasks."},
 {name:"Marketing",lead:"Bring in the right customers, and keep track of them.",jobs:"We clarify who you sell to, plan and run campaigns, and check what happens to each enquiry after it arrives."},
 {name:"Operations",lead:"Make everyday work run smoothly.",jobs:"We map workflows, remove bottlenecks, and establish useful reporting."},
 {name:"Talent",lead:"Put the right people in the right roles.",jobs:"We clarify accountability, help recruit for key positions, and train teams on new processes."},
 {name:"Data",lead:"Base decisions on records you can trust.",jobs:"We identify key measures, build dashboards, and check whether interventions worked."},
 {name:"Specialist Partners",lead:"Bring qualified experts when the work needs them.",jobs:"Accountants, HR professionals, lawyers, recruiters and software engineers, engaged with transparent roles and responsibilities."}
] as const;
export const stages = [
 {name:"Understand",short:"We find the cause behind the symptom.",what:"We listen, review the numbers and observe how work happens.",out:"A clear definition of the problem and its consequences."},
 {name:"Architect",short:"We agree the plan, the people and the cost.",what:"We establish the changes, owners, timeframe and measures.",out:"A coordinated plan with roles, costs and milestones."},
 {name:"Execute",short:"We do the work with your team.",what:"We implement alongside the people who run the business.",out:"Delivered work, with transparent progress reporting."},
 {name:"Institutionalise",short:"We help the improvement last.",what:"We document new processes, transfer knowledge and support adoption.",out:"A stronger team and capabilities that remain."}
] as const;
export const engagements = [
 {name:"Review",tag:"Short engagement",body:"Investigate a problem and get a practical plan.",best:"You know something is wrong, but not exactly what.",fee:"Fixed fee for an agreed scope."},
 {name:"Project",tag:"Defined work",body:"Design and deliver a defined piece of work.",best:"You know what needs to change and need it done.",fee:"Agreed milestones and costs."},
 {name:"Residency",tag:"Ongoing",body:"A HUMMIN professional works inside your team.",best:"You need capacity close to the work, week after week.",fee:"Monthly fee based on scope and people involved."}
] as const;
export const challenges=[
 {title:"Enquiries that go unanswered.",area:"Marketing · Operations",body:"Enquiries arrive, but no one owns the follow-up."},
 {title:"A website that loses visitors.",area:"Technology",body:"People visit but do not call, write or buy."},
 {title:"Systems the team does not use.",area:"Technology · Talent",body:"The business paid for tools, but the team works around them."},
 {title:"Too much still runs through the owner.",area:"Strategy · Operations",body:"Decisions wait for one person, so work slows down."},
 {title:"Figures that arrive too late to act on.",area:"Data",body:"Reports come after the decisions they could have informed."},
 {title:"A team stretched too thin.",area:"Talent",body:"Good people are doing too many jobs."}
] as const;
export const principles=[
 ["Understanding before intervention.","We investigate before prescribing."],
 ["Intelligence in action.","We connect insight to implementation."],
 ["Proximity with independence.","We work closely without surrendering professional judgement."],
 ["Adaptability with discipline.","We tailor solutions without compromising quality or accountability."],
 ["Partnership with responsibility.","We treat trust as an obligation."],
 ["Capability beyond dependency.","We build systems and people that become stronger through our involvement."]
] as const;
