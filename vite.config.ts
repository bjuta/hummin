import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
  plugins: [cloudflare({ configPath: process.env.HUMMIN_DEPLOY_TARGET === "production" ? "./wrangler.production.jsonc" : "./wrangler.preview.jsonc", viteEnvironment: { name: "ssr" } }), reactRouter()]
});
