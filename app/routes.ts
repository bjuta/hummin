import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("how-we-work", "routes/content.tsx", { id: "page-how-we-work" }),
  route("applied-expertise", "routes/content.tsx", { id: "page-applied-expertise" }),
  route("engagements", "routes/content.tsx", { id: "page-engagements" }),
  route("who-we-work-with", "routes/content.tsx", { id: "page-who-we-work-with" }),
  route("about", "routes/content.tsx", { id: "page-about" }),
  route("assessment", "routes/assessment.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx")
] satisfies RouteConfig;
