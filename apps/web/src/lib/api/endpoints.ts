import { apiCall } from "./client";
import type {
  AgentPlan,
  CompareResult,
  GetAnnouncementResult,
  ResolveSecurityData,
  RuntimeCapabilities,
  ScreenResult,
  SearchAnnouncementsResult,
  StockWorkbenchSnapshot,
} from "./types";
import type {
  IpoCalendarRange,
  IpoCalendarResult,
  IpoCompareResult,
  IpoScreenFilters,
  IpoScreenResult,
  IpoSnapshot,
} from "./ipo-types";

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

// --- Analytics: screen & compare -----------------------------------------

/** Natural-language screen -> editable conditions + preview hits (ANA-03/04). */
export function screenSecurities(naturalLanguage: string) {
  return apiCall<ScreenResult>("/analytics/screen-securities", {
    method: "POST",
    body: { natural_language: naturalLanguage },
  });
}

/** Compare 2–5 securities under a unified basis (ANA-01). */
export function compareSecurities(securities: string[]) {
  return apiCall<CompareResult>("/analytics/compare-securities", {
    method: "POST",
    body: { securities },
  });
}

// --- IPO workbench -------------------------------------------------------
// Backed by Codex's worker routes (mock-first via ./ipo-mock until live).

/** Aggregate IPO detail snapshot (POST /workbench/ipo/snapshot). */
export function getIpoSnapshot(id: string) {
  return apiCall<IpoSnapshot>("/workbench/ipo/snapshot", {
    method: "POST",
    body: { ipo_id: id },
  });
}

/** Filter the IPO pipeline by lifecycle stage / sector / query (POST /analytics/screen-ipos). */
export function screenIpos(filters: IpoScreenFilters) {
  return apiCall<IpoScreenResult>("/analytics/screen-ipos", {
    method: "POST",
    body: {
      stage: filters.stage,
      sector: filters.sector,
      q: filters.q,
      sort: filters.sort,
    },
  });
}

/** Compare 2–5 IPOs metric-by-metric (POST /analytics/compare-ipos). */
export function compareIpos(ids: string[]) {
  return apiCall<IpoCompareResult>("/analytics/compare-ipos", {
    method: "POST",
    body: { ipo_ids: ids },
  });
}

/** Cross-IPO timetable agenda (POST /ipos/calendar). */
export function getIpoCalendar(range?: IpoCalendarRange) {
  return apiCall<IpoCalendarResult>("/ipos/calendar", {
    method: "POST",
    body: { from: range?.from, to: range?.to },
  });
}

// --- Documents -----------------------------------------------------------

export interface AnnouncementSearchParams {
  securityQuery?: string;
  keyword?: string;
  categories?: string[];
}

/** Search announcements (DOC-01). */
export function searchAnnouncements(params: AnnouncementSearchParams) {
  return apiCall<SearchAnnouncementsResult>("/documents/search-announcements", {
    method: "POST",
    body: {
      security_query: params.securityQuery,
      keyword: params.keyword,
      categories: params.categories,
    },
  });
}

/** Fetch sanitized, locator-bound excerpts of one announcement (DOC-02/03). */
export function getAnnouncement(documentId: string) {
  return apiCall<GetAnnouncementResult>("/documents/get-announcement", {
    method: "POST",
    body: { document_id: documentId },
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
