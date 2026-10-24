import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
 index("routes/fidelity.ts"),
 route("how-we-work","routes/fidelity.ts",{id:"original-how"}),
 route("applied-expertise","routes/fidelity.ts",{id:"original-expertise"}),
 route("engagements","routes/fidelity.ts",{id:"original-engagements"}),
 route("who-we-work-with","routes/fidelity.ts",{id:"original-clients"}),
 route("assessment","routes/fidelity.ts",{id:"original-assessment"}),
 route("about","routes/fidelity.ts",{id:"original-about"}),
 route("contact","routes/fidelity.ts",{id:"original-contact"}),
 route("privacy","routes/privacy.tsx")
] satisfies RouteConfig;
