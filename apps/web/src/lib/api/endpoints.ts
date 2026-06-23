import { apiCall } from "./client";
import type {
  AgentPlan,
  ResolveSecurityData,
  RuntimeCapabilities,
  StockWorkbenchSnapshot,
} from "./types";

// --- Security resolution -------------------------------------------------

/** Resolves a free-text query to one or more securities (POST /tools/resolve-security). */
export function resolveSecurity(query: string, market?: string) {
  return apiCall<ResolveSecurityData>("/tools/resolve-security", {
    method: "POST",
    body: { query, market },
  });
}

// --- Agent research plan -------------------------------------------------

/** Pre-execution research plan: phased steps + answer/evidence contract. */
export function planAgentRun(prompt: string) {
  return apiCall<AgentPlan>("/agent/runs/plan", {
    method: "POST",
    body: { prompt },
  });
}

// --- Stock workbench -----------------------------------------------------

export interface StockSnapshotParams {
  instrumentId?: string;
  securityQuery?: string;
  quoteMode?: string;
  adjustment?: string;
}

/** Aggregate individual-stock workbench snapshot (POST /workbench/stock/snapshot). */
export function getStockSnapshot(params: StockSnapshotParams) {
  return apiCall<StockWorkbenchSnapshot>("/workbench/stock/snapshot", {
    method: "POST",
    body: {
      adjustment: params.adjustment,
      instrument_id: params.instrumentId,
      quote_mode: params.quoteMode,
      security_query: params.securityQuery,
    },
  });
}

// --- Module runtime capability probes ------------------------------------
// Every shell page calls its module's `GET /<module>/runtime` to confirm the
// worker capability exists (synthetic-backed in Phase 1).

const runtimeProbe = (path: string) => () =>
  apiCall<RuntimeCapabilities>(path);

export const getAgentRuntime = runtimeProbe("/agent/runtime");
export const getWorkbenchRuntime = runtimeProbe("/workbench/runtime");
export const getDocumentsRuntime = runtimeProbe("/documents/runtime");
export const getResearchRuntime = runtimeProbe("/research/runtime");
export const getAnalyticsRuntime = runtimeProbe("/analytics/runtime");
export const getWatchlistRuntime = runtimeProbe("/watchlist/runtime");
export const getMcpRuntime = runtimeProbe("/mcp/runtime");
export const getAccountRuntime = runtimeProbe("/account/runtime");
export const getAccountPricing = runtimeProbe("/account/package-pricing");
