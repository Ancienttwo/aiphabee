/// <reference types="vite/client" />
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";

// Plugin order matters: cloudflare() before tanstackStart() before react().
export default defineConfig({
  server: {
    port: 3001,
    // Dev: proxy `/api/*` -> worker (`npm run dev:worker`, port 8787) so the
    // browser never makes a cross-origin request and we avoid CORS entirely.
    // The `/api` prefix is stripped; worker routes live at the root ("/tools/…").
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ srcDirectory: "src" }),
    react(),
  ],
});
