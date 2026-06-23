/// <reference types="vite/client" />

/**
 * API surface configuration for the AiphaBee web client.
 *
 * In dev, Vite proxies `/api` -> http://localhost:8787 (see `vite.config.ts`),
 * so the default relative base avoids CORS entirely. Override `VITE_API_BASE_URL`
 * for environments where the worker is reachable at an absolute origin.
 */
const apiBaseFromEnv = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL: string = apiBaseFromEnv ?? "/api";

// Dev resolves `/api` via the Vite proxy (see `vite.config.ts`). A *production*
// deploy must either set `VITE_API_BASE_URL` to the worker's absolute origin or
// route `/api` to the worker (service binding / route rule) — otherwise
// `/api/...` hits the web app itself. Warn loudly so a misconfigured prod build
// is caught immediately. (This app is not deployed pre-Gate-0; tracked as a
// deploy-time follow-up.)
if (import.meta.env.PROD && !apiBaseFromEnv && typeof console !== "undefined") {
  console.warn(
    "[aiphabee] VITE_API_BASE_URL is not set; `/api` needs a production route to the worker.",
  );
}

/**
 * When `true`, endpoints serve in-memory fixtures instead of calling the worker.
 * Archived IPO pages and offline dev rely on this. Defaults to `false`, i.e. the
 * client talks to the live (synthetic-backed) worker.
 */
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === "true";
