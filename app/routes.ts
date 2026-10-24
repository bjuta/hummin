import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("how-we-work", "routes/content.tsx"),
  route("applied-expertise", "routes/content.tsx"),
  route("engagements", "routes/content.tsx"),
  route("who-we-work-with", "routes/content.tsx"),
  route("about", "routes/content.tsx"),
  route("assessment", "routes/assessment.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx")
] satisfies RouteConfig;
