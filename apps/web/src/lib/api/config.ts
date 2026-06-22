/// <reference types="vite/client" />

/**
 * API surface configuration for the AiphaBee web client.
 *
 * In dev, Vite proxies `/api` -> http://localhost:8787 (see `vite.config.ts`),
 * so the default relative base avoids CORS entirely. Override `VITE_API_BASE_URL`
 * for environments where the worker is reachable at an absolute origin.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

/**
 * When `true`, endpoints serve in-memory fixtures instead of calling the worker.
 * Archived IPO pages and offline dev rely on this. Defaults to `false`, i.e. the
 * client talks to the live (synthetic-backed) worker.
 */
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === "true";
