import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const cloudflareWorkersShim = fileURLToPath(
  new URL("./tests/shims/cloudflare-workers.ts", import.meta.url)
);

export default defineConfig({
  resolve: {
    alias: {
      "cloudflare:workers": cloudflareWorkersShim
    }
  },
  test: {
    globals: true,
    include: [
      "apps/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}"
    ]
  }
});
