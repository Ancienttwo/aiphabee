import { apiCall } from "./client";
import { resolveAuthenticatedSecurity, resolveAuthenticatedSecurityProfile } from "./security.functions";
import { resolveAuthenticatedFinancialFacts } from "./financial-facts.functions";
import { resolveAuthenticatedQuoteSnapshot } from "./quote-snapshot.functions";
import { resolveAuthenticatedDerivedMetrics } from "./derived-metrics.functions";
import { resolveAuthenticatedCorporateActions } from "./corporate-actions.functions";
import { resolveAuthenticatedSdiDisclosure } from "./sdi-disclosure.functions";
import { resolveAuthenticatedDirectorate } from "./directorate.functions";
import { resolveAuthenticatedOwnership } from "./ownership.functions";
import { resolveAuthenticatedRelatedWarrants } from "./related-warrants.functions";
import type {
  AgentPlan,
  CompareResult,
  GetAnnouncementResult,
  RuntimeCapabilities,
  ScreenResult,
  SearchAnnouncementsResult,
} from "./types";
import type {
  IpoCalendarRange,
  IpoScreenFilters,
} from "./ipo-types";

// --- Security resolution -------------------------------------------------

/** Resolves a free-text query to one or more securities (POST /tools/resolve-security). */
export function resolveSecurity(query: string, market?: string) {
  return resolveAuthenticatedSecurity({ data: { query, market } });
}

/** Gated live company-header profile for a known instrument id (POST server-fn). */
export function resolveSecurityProfile(instrumentId: string) {
  return resolveAuthenticatedSecurityProfile({ data: { instrumentId } });
}

/** Gated live financial facts (non-bank/nb only) for a known instrument id (POST server-fn). */
export function resolveFinancialFacts(instrumentId: string) {
  return resolveAuthenticatedFinancialFacts({ data: { instrumentId } });
}

/** Gated live EOD quote snapshot for a known instrument id (POST server-fn). */
export function resolveQuoteSnapshot(instrumentId: string) {
  return resolveAuthenticatedQuoteSnapshot({ data: { instrumentId } });
}

/** Gated live derived metrics (profitability + valuation, conjoined financial_facts + quote_snapshot gates) for a known instrument id (POST server-fn). */
export function resolveDerivedMetrics(instrumentId: string) {
  return resolveAuthenticatedDerivedMetrics({ data: { instrumentId } });
}

/** Gated live corporate actions (dividend/buyback/split/consolidation) for a known instrument id (POST server-fn). */
export function resolveCorporateActions(instrumentId: string) {
  return resolveAuthenticatedCorporateActions({ data: { instrumentId } });
}

/** Gated live SDI (substantial-shareholder / director disclosure of interests) filings for a known instrument id (POST server-fn). */
export function resolveSdiDisclosure(instrumentId: string) {
  return resolveAuthenticatedSdiDisclosure({ data: { instrumentId } });
}

/** Gated live directorate (director / senior-management biography) records for a known instrument id (POST server-fn). */
export function resolveDirectorate(instrumentId: string) {
  return resolveAuthenticatedDirectorate({ data: { instrumentId } });
}

/** Gated live ownership (share capital / free float / substantial-shareholder and cross-holding structure) for a known instrument id (POST server-fn). */
export function resolveOwnership(instrumentId: string) {
  return resolveAuthenticatedOwnership({ data: { instrumentId } });
}

/** Gated live related-warrants (per-underlying-instrument list of associated derivative warrant / CBBC codes) for a known instrument id (POST server-fn). */
export function resolveRelatedWarrants(instrumentId: string) {
  return resolveAuthenticatedRelatedWarrants({ data: { instrumentId } });
}

// --- Agent research plan -------------------------------------------------

/** Pre-execution research plan: phased steps + answer/evidence contract. */
export function planAgentRun(prompt: string, locale: string) {
  return apiCall<AgentPlan>("/agent/runs/plan", {
    method: "POST",
    body: { locale, prompt },
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
// Live worker contract. It remains locale-blind and must not replace
// `./ipo-mock` until the worker accepts an exact locale and returns the
// corresponding resolved payload.
type LocaleBlindLiveIpoPayload = unknown;

/** Aggregate IPO detail snapshot (POST /workbench/ipo/snapshot). */
export function getIpoSnapshot(id: string) {
  return apiCall<LocaleBlindLiveIpoPayload>("/workbench/ipo/snapshot", {
    method: "POST",
    body: { ipo_id: id },
  });
}

/** Filter the IPO pipeline by lifecycle stage / sector / query (POST /analytics/screen-ipos). */
export function screenIpos(filters: IpoScreenFilters) {
  return apiCall<LocaleBlindLiveIpoPayload>("/analytics/screen-ipos", {
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
  return apiCall<LocaleBlindLiveIpoPayload>("/analytics/compare-ipos", {
    method: "POST",
    body: { ipo_ids: ids },
  });
}

/** Cross-IPO timetable agenda (POST /ipos/calendar). */
export function getIpoCalendar(range?: IpoCalendarRange) {
  return apiCall<LocaleBlindLiveIpoPayload>("/ipos/calendar", {
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
