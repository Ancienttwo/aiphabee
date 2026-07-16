import {
  getCorporateActions,
  getCorporateActionsCapabilities,
  type GetCorporateActionsResult
} from "@aiphabee/corporate-actions";
import {
  getFinancialFacts,
  getFinancialFactsCapabilities,
  type FinancialFactMetric,
  type FinancialFactRow,
  type GetFinancialFactsResult,
  type GetLiveFinancialFactsResult,
  type LiveFinancialFactRow
} from "@aiphabee/financial-facts";
import {
  getPriceHistory,
  getPriceHistoryCapabilities,
  getQuoteSnapshot,
  getQuoteSnapshotCapabilities,
  type GetLiveQuoteSnapshotResult,
  type GetPriceHistoryResult,
  type GetQuoteSnapshotResult,
  type PriceHistoryAdjustment,
  type QuoteSnapshotMode
} from "@aiphabee/market-data";
import {
  getResolveSecurityCapabilities,
  getSecurityProfile,
  getSecurityProfileCapabilities,
  resolveSecurity,
  type GetSecurityProfileResult,
  type ResolveSecurityResult
} from "@aiphabee/security-tools";

export const STOCK_WORKBENCH_VERSION =
  "2026-06-21.phase1.stock-workbench-announcement-search-scaffold.v0";

export interface StockWorkbenchSnapshotInput {
  adjustment?: PriceHistoryAdjustment;
  announcementCategories?: string[];
  announcementFrom?: string;
  announcementKeyword?: string;
  announcementLimit?: number;
  announcementTo?: string;
  asOf?: string;
  corporateActionsFrom?: string;
  corporateActionsTo?: string;
  financialFrom?: string;
  financialTo?: string;
  instrumentId?: string;
  priceFrom?: string;
  priceTo?: string;
  quoteMode?: QuoteSnapshotMode;
  requestId: string;
  securityQuery?: string;
}

export type StockWorkbenchDerivedMetricCategory = "profitability" | "valuation";
export type StockWorkbenchDerivedMetricStatus = "blocked" | "computed";

export interface StockWorkbenchDerivedMetricDefinition {
  anomaly_policy: {
    currency_mismatch: "flagged";
    missing_input: "blocked";
    negative_denominator: "blocked";
    quality_hold: "blocked";
    zero_denominator: "blocked";
  };
  category: StockWorkbenchDerivedMetricCategory;
  formula: string;
  formula_version: typeof DERIVED_METRIC_FORMULA_VERSION;
  label: string;
  metric_id: string;
  required_inputs: string[];
  source_tools: string[];
  unit: "multiple" | "ratio";
}

export interface StockWorkbenchDerivedMetricValue {
  anomaly_flags: string[];
  blocked_reason?: string;
  category: StockWorkbenchDerivedMetricCategory;
  formula_version: typeof DERIVED_METRIC_FORMULA_VERSION;
  inputs: Record<string, number | string>;
  metric_id: string;
  period_end?: string;
  source_record_ids: string[];
  status: StockWorkbenchDerivedMetricStatus;
  unit: "multiple" | "ratio";
  value?: number;
}

export interface StockWorkbenchDerivedMetrics {
  data_version: typeof STOCK_WORKBENCH_VERSION;
  definitions: StockWorkbenchDerivedMetricDefinition[];
  financial_period_end?: string;
  frontend_rendering: false;
  live_data_access: false;
  methodology_version: typeof STOCK_WORKBENCH_VERSION;
  metrics: StockWorkbenchDerivedMetricValue[];
  quote_as_of?: string;
  status: "blocked" | "computed" | "partial";
  toolName: "stock_workbench_derived_metrics";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

/**
 * Live counterpart to StockWorkbenchDerivedMetrics, returned by the
 * (never-public) resolveDerivedMetrics RPC -- see
 * authenticated-netquity-web-resolver.ts's conjunctive-gate comment.
 * Combines two independently field-gated live datasets (financial_facts and
 * quote_snapshot) through createLiveDerivedMetrics below; neither dataset
 * requires a new "derived metrics" entitlement registration of its own.
 * data_version is a composite of whichever source dataset(s) actually
 * contributed ("" when both are absent -- an honest "nothing was read"
 * signal, never a fabricated placeholder); provenance concatenates both
 * sources' own provenance entries verbatim, so a single entry's
 * data_version/methodology_version describes only its own source, not this
 * composite.
 */
export interface StockWorkbenchLiveDerivedMetrics {
  data_version: string;
  definitions: StockWorkbenchDerivedMetricDefinition[];
  financial_facts_as_of?: string;
  financial_period_end?: string;
  live_data_access: true;
  methodology_version: typeof DERIVED_METRIC_LIVE_FORMULA_VERSION;
  metrics: StockWorkbenchDerivedMetricValue[];
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  quote_as_of?: string;
  status: "blocked" | "computed" | "partial";
  toolName: "stock_workbench_derived_metrics";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

export type StockWorkbenchAnnouncementCategory =
  | "buyback"
  | "dividend"
  | "results";
export type StockWorkbenchAnnouncementSearchStatus =
  | "blocked_resolution"
  | "found"
  | "not_found";

export interface StockWorkbenchAnnouncementLocator {
  anchor: string;
  document_id: string;
  external_href_authority: false;
  locator_type: "synthetic_original_locator";
  original_url: string;
  page: number;
  source_record_id: string;
}

export interface StockWorkbenchAnnouncement {
  announcement_id: string;
  category: StockWorkbenchAnnouncementCategory;
  evidence_locator: StockWorkbenchAnnouncementLocator;
  instrument_id: string;
  language: "en" | "zh-Hant";
  published_at: string;
  source_record_id: string;
  summary: string;
  symbol: string;
  title: string;
}

export interface StockWorkbenchAnnouncementSearchInput {
  asOf?: string;
  categories?: string[];
  from?: string;
  instrumentId?: string;
  keyword?: string;
  limit?: number;
  requestId: string;
  securityQuery?: string;
  to?: string;
}

export interface StockWorkbenchAnnouncementSearch {
  announcements: StockWorkbenchAnnouncement[];
  categories: StockWorkbenchAnnouncementCategory[];
  data_version: typeof STOCK_WORKBENCH_VERSION;
  evidence_locator_ready: true;
  frontend_rendering: false;
  from: string;
  instrument_id?: string;
  keyword?: string;
  limit: number;
  live_data_access: false;
  methodology_version: typeof STOCK_WORKBENCH_VERSION;
  original_document_fetch: false;
  resolve_security?: ResolveSecurityResult;
  row_count: number;
  status: StockWorkbenchAnnouncementSearchStatus;
  to: string;
  toolName: "stock_workbench_announcement_search";
  total_count: number;
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

export interface StockWorkbenchSnapshot {
  announcement_search: StockWorkbenchAnnouncementSearch;
  actual_tool_execution: true;
  corporate_actions: GetCorporateActionsResult;
  data_quality: {
    blocking_statuses: string[];
    section_statuses: Record<StockWorkbenchSection, string>;
  };
  derived_metrics: StockWorkbenchDerivedMetrics;
  evidence: {
    provenance_count: number;
    source_record_ids: string[];
  };
  financial_facts: GetFinancialFactsResult;
  frontend_rendering: false;
  instrument_id?: string;
  live_data_access: false;
  price_history: GetPriceHistoryResult;
  quote_snapshot: GetQuoteSnapshotResult;
  resolve_security?: ResolveSecurityResult;
  security_profile: GetSecurityProfileResult;
  sql_emitted: false;
  status: "blocked_resolution" | "partial" | "ready";
  unsupported_sections: {
    full_announcement_document_search: "phase_2_planned";
  };
  version: typeof STOCK_WORKBENCH_VERSION;
}

export type StockWorkbenchSection =
  | "announcement_search"
  | "corporate_actions"
  | "derived_metrics"
  | "financial_facts"
  | "price_history"
  | "quote_snapshot"
  | "security_profile";

const DEFAULT_PRICE_FROM = "2026-01-02";
const DEFAULT_PRICE_TO = "2026-01-07";
const DEFAULT_FINANCIAL_FROM = "2023-12-31";
const DEFAULT_FINANCIAL_TO = "2023-12-31";
const DEFAULT_CORPORATE_ACTIONS_FROM = "2026-01-03";
const DEFAULT_CORPORATE_ACTIONS_TO = "2026-01-07";
const DEFAULT_ANNOUNCEMENT_FROM = "2024-03-20";
const DEFAULT_ANNOUNCEMENT_TO = "2026-01-07";
const DEFAULT_ANNOUNCEMENT_LIMIT = 3;
const MAX_ANNOUNCEMENT_LIMIT = 3;
const DERIVED_METRIC_FORMULA_VERSION = "stock-workbench-derived-metrics-v0";
const DERIVED_METRIC_LIVE_FORMULA_VERSION =
  "2026-07-16.stock-workbench-derived-metrics-live.v1";
const DERIVED_METRIC_DEFINITIONS: StockWorkbenchDerivedMetricDefinition[] = [
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "profitability",
    formula: "net_income / revenue",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Net margin",
    metric_id: "net_margin",
    required_inputs: ["net_income", "revenue"],
    source_tools: ["get_financial_facts"],
    unit: "ratio"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "profitability",
    formula: "net_income / assets",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Return on assets",
    metric_id: "return_on_assets",
    required_inputs: ["net_income", "assets"],
    source_tools: ["get_financial_facts"],
    unit: "ratio"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "profitability",
    formula: "net_income / equity",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Return on equity",
    metric_id: "return_on_equity",
    required_inputs: ["net_income", "equity"],
    source_tools: ["get_financial_facts"],
    unit: "ratio"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "profitability",
    formula: "revenue / assets",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Asset turnover",
    metric_id: "asset_turnover",
    required_inputs: ["revenue", "assets"],
    source_tools: ["get_financial_facts"],
    unit: "ratio"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "profitability",
    formula: "assets / equity",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Equity multiplier",
    metric_id: "equity_multiplier",
    required_inputs: ["assets", "equity"],
    source_tools: ["get_financial_facts"],
    unit: "multiple"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "valuation",
    formula: "market_cap / net_income",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Price to earnings",
    metric_id: "price_to_earnings",
    required_inputs: ["market_cap", "net_income"],
    source_tools: ["get_quote_snapshot", "get_financial_facts"],
    unit: "multiple"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "valuation",
    formula: "market_cap / revenue",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Price to sales",
    metric_id: "price_to_sales",
    required_inputs: ["market_cap", "revenue"],
    source_tools: ["get_quote_snapshot", "get_financial_facts"],
    unit: "multiple"
  },
  {
    anomaly_policy: createDerivedMetricAnomalyPolicy(),
    category: "valuation",
    formula: "market_cap / equity",
    formula_version: DERIVED_METRIC_FORMULA_VERSION,
    label: "Price to book",
    metric_id: "price_to_book",
    required_inputs: ["market_cap", "equity"],
    source_tools: ["get_quote_snapshot", "get_financial_facts"],
    unit: "multiple"
  }
];
const SYNTHETIC_ANNOUNCEMENTS: readonly StockWorkbenchAnnouncement[] = [
  {
    announcement_id: "ann_00700_20240320_results",
    category: "results",
    evidence_locator: createAnnouncementLocator(
      "ann_00700_20240320_results",
      "src_announcement_00700_20240320_results",
      4,
      "financial-highlights"
    ),
    instrument_id: "eq_hk_00700",
    language: "en",
    published_at: "2024-03-20T18:30:00+08:00",
    source_record_id: "src_announcement_00700_20240320_results",
    summary: "Annual results announcement with financial highlights and FY metrics.",
    symbol: "00700.HK",
    title: "Annual Results Announcement for the Year Ended 31 December 2023"
  },
  {
    announcement_id: "ann_00700_20260103_dividend",
    category: "dividend",
    evidence_locator: createAnnouncementLocator(
      "ann_00700_20260103_dividend",
      "src_announcement_00700_20260103_dividend",
      2,
      "dividend-timetable"
    ),
    instrument_id: "eq_hk_00700",
    language: "en",
    published_at: "2026-01-03T12:00:00+08:00",
    source_record_id: "src_announcement_00700_20260103_dividend",
    summary: "Dividend timetable announcement with ex-date and payment-date evidence anchors.",
    symbol: "00700.HK",
    title: "Dividend Timetable Update"
  },
  {
    announcement_id: "ann_00700_20260106_buyback",
    category: "buyback",
    evidence_locator: createAnnouncementLocator(
      "ann_00700_20260106_buyback",
      "src_announcement_00700_20260106_buyback",
      1,
      "repurchase-summary"
    ),
    instrument_id: "eq_hk_00700",
    language: "zh-Hant",
    published_at: "2026-01-06T18:00:00+08:00",
    source_record_id: "src_announcement_00700_20260106_buyback",
    summary: "Share repurchase disclosure with quantity and consideration evidence anchors.",
    symbol: "00700.HK",
    title: "翌日披露報表 - 股份購回"
  }
];

export function getStockWorkbenchCapabilities() {
  return {
    actual_tool_execution: true,
    frontend_rendering: false,
    live_data_access: false,
    package: "@aiphabee/workbench" as const,
    announcement_route: "POST /workbench/stock/announcements" as const,
    route: "POST /workbench/stock/snapshot" as const,
    runtime_route: "GET /workbench/runtime" as const,
    sections: [
      "security_profile",
      "quote_snapshot",
      "price_history",
      "financial_facts",
      "derived_metrics",
      "announcement_search",
      "corporate_actions"
    ] as const,
    announcement_search: {
      categories: ["results", "dividend", "buyback"] as const,
      evidence_locator_ready: true,
      external_href_authority: false,
      max_limit: MAX_ANNOUNCEMENT_LIMIT,
      original_document_fetch: false,
      source: "synthetic_announcement_fixture" as const
    },
    derived_metrics: {
      anomaly_handling: [
        "missing_input",
        "zero_denominator",
        "negative_denominator",
        "quality_hold",
        "market_cap_unavailable"
      ] as const,
      formula_version: DERIVED_METRIC_FORMULA_VERSION,
      metrics: DERIVED_METRIC_DEFINITIONS.map((definition) => ({
        category: definition.category,
        formula: definition.formula,
        metric_id: definition.metric_id,
        unit: definition.unit
      })),
      source_tools: ["get_financial_facts", "get_quote_snapshot"] as const,
      valuation_requires_market_cap: true
    },
    source_tools: {
      corporate_actions: getCorporateActionsCapabilities(),
      financial_facts: getFinancialFactsCapabilities(),
      price_history: getPriceHistoryCapabilities(),
      quote_snapshot: getQuoteSnapshotCapabilities(),
      resolve_security: getResolveSecurityCapabilities(),
      security_profile: getSecurityProfileCapabilities()
    },
    sql_emitted: false,
    status: "stock_workbench_aggregate_scaffold" as const,
    unsupported_sections: {
      full_announcement_document_search: "phase_2_planned" as const
    },
    version: STOCK_WORKBENCH_VERSION
  };
}

export function createStockWorkbenchSnapshot(
  input: StockWorkbenchSnapshotInput
): StockWorkbenchSnapshot {
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;

  if (instrumentId === undefined) {
    const unresolvedProfile = getSecurityProfile({ instrumentId: "__unresolved__" });
    const unresolvedQuote = getQuoteSnapshot({ instrumentId: "__unresolved__" });
    const unresolvedPrice = getPriceHistory({
      from: input.priceFrom ?? DEFAULT_PRICE_FROM,
      instrumentId: "__unresolved__",
      to: input.priceTo ?? DEFAULT_PRICE_TO
    });
    const unresolvedFacts = getFinancialFacts({
      from: input.financialFrom ?? DEFAULT_FINANCIAL_FROM,
      instrumentId: "__unresolved__",
      to: input.financialTo ?? DEFAULT_FINANCIAL_TO
    });
    const unresolvedActions = getCorporateActions({
      from: input.corporateActionsFrom ?? DEFAULT_CORPORATE_ACTIONS_FROM,
      instrumentId: "__unresolved__",
      to: input.corporateActionsTo ?? DEFAULT_CORPORATE_ACTIONS_TO
    });
    const unresolvedDerivedMetrics = createDerivedMetrics({
      financialFacts: unresolvedFacts,
      quoteSnapshot: unresolvedQuote
    });
    const unresolvedAnnouncementSearch = createAnnouncementSearchResult({
      categories: input.announcementCategories,
      from: input.announcementFrom,
      instrumentId,
      keyword: input.announcementKeyword,
      limit: input.announcementLimit,
      resolution,
      to: input.announcementTo
    });

    return createSnapshot({
      announcementSearch: unresolvedAnnouncementSearch,
      corporateActions: unresolvedActions,
      derivedMetrics: unresolvedDerivedMetrics,
      financialFacts: unresolvedFacts,
      instrumentId,
      priceHistory: unresolvedPrice,
      quoteSnapshot: unresolvedQuote,
      resolution,
      securityProfile: unresolvedProfile,
      status: "blocked_resolution"
    });
  }

  const securityProfile = getSecurityProfile({
    asOf: input.asOf,
    instrumentId
  });
  const quoteSnapshot = getQuoteSnapshot({
    asOf: input.asOf,
    instrumentId,
    mode: input.quoteMode
  });
  const priceHistory = getPriceHistory({
    adjustment: input.adjustment ?? "total_return_adjusted",
    fields: ["close", "return", "drawdown", "volume", "turnover"],
    from: input.priceFrom ?? DEFAULT_PRICE_FROM,
    instrumentId,
    to: input.priceTo ?? DEFAULT_PRICE_TO
  });
  const financialFacts = getFinancialFacts({
    from: input.financialFrom ?? DEFAULT_FINANCIAL_FROM,
    instrumentId,
    metrics: ["revenue", "net_income", "assets", "equity"],
    to: input.financialTo ?? DEFAULT_FINANCIAL_TO
  });
  const corporateActions = getCorporateActions({
    from: input.corporateActionsFrom ?? DEFAULT_CORPORATE_ACTIONS_FROM,
    instrumentId,
    to: input.corporateActionsTo ?? DEFAULT_CORPORATE_ACTIONS_TO
  });
  const derivedMetrics = createDerivedMetrics({
    financialFacts,
    quoteSnapshot
  });
  const announcementSearch = createAnnouncementSearchResult({
    categories: input.announcementCategories,
    from: input.announcementFrom,
    instrumentId,
    keyword: input.announcementKeyword,
    limit: input.announcementLimit,
    resolution,
    to: input.announcementTo
  });
  const allFound = [
    announcementSearch.status,
    securityProfile.status,
    quoteSnapshot.status,
    priceHistory.status,
    financialFacts.status,
    corporateActions.status
  ].every((status) => status === "found");

  return createSnapshot({
    announcementSearch,
    corporateActions,
    derivedMetrics,
    financialFacts,
    instrumentId,
    priceHistory,
    quoteSnapshot,
    resolution,
    securityProfile,
    status: allFound ? "ready" : "partial"
  });
}

export function createStockWorkbenchAnnouncementSearch(
  input: StockWorkbenchAnnouncementSearchInput
): StockWorkbenchAnnouncementSearch {
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;

  return createAnnouncementSearchResult({
    categories: input.categories,
    from: input.from,
    instrumentId,
    keyword: input.keyword,
    limit: input.limit,
    resolution,
    to: input.to
  });
}

function createSnapshot(input: {
  announcementSearch: StockWorkbenchAnnouncementSearch;
  corporateActions: GetCorporateActionsResult;
  derivedMetrics: StockWorkbenchDerivedMetrics;
  financialFacts: GetFinancialFactsResult;
  instrumentId?: string;
  priceHistory: GetPriceHistoryResult;
  quoteSnapshot: GetQuoteSnapshotResult;
  resolution?: ResolveSecurityResult;
  securityProfile: GetSecurityProfileResult;
  status: StockWorkbenchSnapshot["status"];
}): StockWorkbenchSnapshot {
  const sectionStatuses: Record<StockWorkbenchSection, string> = {
    announcement_search: input.announcementSearch.status,
    corporate_actions: input.corporateActions.status,
    derived_metrics: derivedMetricSectionStatus(input.derivedMetrics),
    financial_facts: input.financialFacts.status,
    price_history: input.priceHistory.status,
    quote_snapshot: input.quoteSnapshot.status,
    security_profile: input.securityProfile.status
  };

  return {
    announcement_search: input.announcementSearch,
    actual_tool_execution: true,
    corporate_actions: input.corporateActions,
    data_quality: {
      blocking_statuses: Object.values(sectionStatuses).filter((status) => status !== "found"),
      section_statuses: sectionStatuses
    },
    derived_metrics: input.derivedMetrics,
    evidence: createEvidenceSummary([
      ...(input.resolution?.provenance ?? []),
      ...input.securityProfile.provenance,
      ...input.quoteSnapshot.provenance,
      ...input.priceHistory.provenance,
      ...input.financialFacts.provenance,
      ...input.corporateActions.provenance,
      ...input.announcementSearch.announcements.map((announcement) => ({
        source_record_id: announcement.source_record_id
      }))
    ]),
    financial_facts: input.financialFacts,
    frontend_rendering: false,
    instrument_id: input.instrumentId,
    live_data_access: false,
    price_history: input.priceHistory,
    quote_snapshot: input.quoteSnapshot,
    resolve_security: input.resolution,
    security_profile: input.securityProfile,
    sql_emitted: false,
    status: input.status,
    unsupported_sections: {
      full_announcement_document_search: "phase_2_planned"
    },
    version: STOCK_WORKBENCH_VERSION
  };
}

function createAnnouncementSearchResult(input: {
  categories?: string[];
  from?: string;
  instrumentId?: string;
  keyword?: string;
  limit?: number;
  resolution?: ResolveSecurityResult;
  to?: string;
}): StockWorkbenchAnnouncementSearch {
  const from = input.from ?? DEFAULT_ANNOUNCEMENT_FROM;
  const to = input.to ?? DEFAULT_ANNOUNCEMENT_TO;
  const categories = normalizeAnnouncementCategories(input.categories);
  const limit = normalizeAnnouncementLimit(input.limit);
  const keyword = input.keyword?.trim();

  if (input.instrumentId === undefined) {
    return {
      announcements: [],
      categories,
      data_version: STOCK_WORKBENCH_VERSION,
      evidence_locator_ready: true,
      frontend_rendering: false,
      from,
      keyword: keyword === "" ? undefined : keyword,
      limit,
      live_data_access: false,
      methodology_version: STOCK_WORKBENCH_VERSION,
      original_document_fetch: false,
      resolve_security: input.resolution,
      row_count: 0,
      status: "blocked_resolution",
      to,
      toolName: "stock_workbench_announcement_search",
      total_count: 0,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

  const normalizedKeyword = keyword?.toLowerCase();
  const matchingAnnouncements = SYNTHETIC_ANNOUNCEMENTS.filter(
    (announcement) =>
      announcement.instrument_id === input.instrumentId &&
      categories.includes(announcement.category) &&
      announcement.published_at.slice(0, 10) >= from &&
      announcement.published_at.slice(0, 10) <= to &&
      (normalizedKeyword === undefined ||
        normalizedKeyword.length === 0 ||
        [announcement.title, announcement.summary, announcement.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword))
  ).sort((left, right) => right.published_at.localeCompare(left.published_at));
  const announcements = matchingAnnouncements.slice(0, limit);

  return {
    announcements,
    categories,
    data_version: STOCK_WORKBENCH_VERSION,
    evidence_locator_ready: true,
    frontend_rendering: false,
    from,
    instrument_id: input.instrumentId,
    keyword: keyword === "" ? undefined : keyword,
    limit,
    live_data_access: false,
    methodology_version: STOCK_WORKBENCH_VERSION,
    original_document_fetch: false,
    resolve_security: input.resolution,
    row_count: announcements.length,
    status: announcements.length > 0 ? "found" : "not_found",
    to,
    toolName: "stock_workbench_announcement_search",
    total_count: matchingAnnouncements.length,
    usage: {
      cached: false,
      credits: announcements.length > 0 ? 1 : 0,
      rows: announcements.length
    }
  };
}

function createAnnouncementLocator(
  announcementId: string,
  sourceRecordId: string,
  page: number,
  anchor: string
): StockWorkbenchAnnouncementLocator {
  return {
    anchor,
    document_id: `doc_${announcementId}`,
    external_href_authority: false,
    locator_type: "synthetic_original_locator",
    original_url: `urn:aiphabee:synthetic:announcement:${announcementId}#page=${page}&anchor=${anchor}`,
    page,
    source_record_id: sourceRecordId
  };
}

function normalizeAnnouncementCategories(
  categories: string[] | undefined
): StockWorkbenchAnnouncementCategory[] {
  const allowed: StockWorkbenchAnnouncementCategory[] = ["results", "dividend", "buyback"];

  if (categories === undefined || categories.length === 0) {
    return allowed;
  }

  const normalized = categories.filter(
    (category): category is StockWorkbenchAnnouncementCategory =>
      allowed.includes(category as StockWorkbenchAnnouncementCategory)
  );

  return normalized.length > 0 ? normalized : allowed;
}

function normalizeAnnouncementLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_ANNOUNCEMENT_LIMIT;
  }

  return Math.min(limit, MAX_ANNOUNCEMENT_LIMIT);
}

function createDerivedMetrics(input: {
  financialFacts: GetFinancialFactsResult;
  quoteSnapshot: GetQuoteSnapshotResult;
}): StockWorkbenchDerivedMetrics {
  const facts = createFinancialFactMap(input.financialFacts.facts?.facts ?? []);
  const metrics = DERIVED_METRIC_DEFINITIONS.map((definition) =>
    definition.category === "valuation"
      ? createBlockedValuationMetric(definition, facts, input)
      : createProfitabilityMetric(definition, facts, input.financialFacts.status)
  );
  const computedCount = metrics.filter((metric) => metric.status === "computed").length;
  const blockedCount = metrics.length - computedCount;
  const firstFact = input.financialFacts.facts?.facts.at(0);

  return {
    data_version: STOCK_WORKBENCH_VERSION,
    definitions: DERIVED_METRIC_DEFINITIONS,
    financial_period_end: firstFact?.periodEnd,
    frontend_rendering: false,
    live_data_access: false,
    methodology_version: STOCK_WORKBENCH_VERSION,
    metrics,
    quote_as_of: input.quoteSnapshot.quote?.asOf,
    status:
      computedCount === 0 ? "blocked" : blockedCount === 0 ? "computed" : "partial",
    toolName: "stock_workbench_derived_metrics",
    usage: {
      cached: false,
      credits: computedCount > 0 ? 1 : 0,
      rows: metrics.length
    }
  };
}

function createFinancialFactMap(
  facts: FinancialFactRow[]
): Map<FinancialFactMetric, FinancialFactRow> {
  const rows = [...facts].sort((left, right) => {
    const periodOrder = right.periodEnd.localeCompare(left.periodEnd);
    if (periodOrder !== 0) {
      return periodOrder;
    }

    return right.restatementVersion - left.restatementVersion;
  });
  const byMetric = new Map<FinancialFactMetric, FinancialFactRow>();

  for (const row of rows) {
    if (!byMetric.has(row.metricId)) {
      byMetric.set(row.metricId, row);
    }
  }

  return byMetric;
}

function createProfitabilityMetric(
  definition: StockWorkbenchDerivedMetricDefinition,
  facts: Map<FinancialFactMetric, FinancialFactRow>,
  financialFactsStatus: GetFinancialFactsResult["status"]
): StockWorkbenchDerivedMetricValue {
  const numerator = facts.get(definition.required_inputs[0] as FinancialFactMetric);
  const denominator = facts.get(definition.required_inputs[1] as FinancialFactMetric);
  const base = createMetricBase(definition, [numerator, denominator]);

  if (financialFactsStatus !== "found") {
    return blockMetric(base, "financial_facts_not_found", []);
  }

  if (numerator === undefined || denominator === undefined) {
    return blockMetric(base, "missing_input", []);
  }

  const qualityFlags = [numerator, denominator]
    .filter((fact) => fact.qualityState !== "PASS")
    .map((fact) => `${fact.metricId}_quality_${fact.qualityState.toLowerCase()}`);

  if (qualityFlags.length > 0) {
    return blockMetric(base, "quality_hold", qualityFlags);
  }

  if (denominator.value === 0) {
    return blockMetric(base, "zero_denominator", []);
  }

  if (denominator.value < 0) {
    return blockMetric(base, "negative_denominator", []);
  }

  return {
    ...base,
    anomaly_flags: [],
    inputs: {
      ...base.inputs,
      [numerator.metricId]: numerator.value,
      [denominator.metricId]: denominator.value
    },
    period_end: numerator.periodEnd,
    status: "computed",
    value: roundMetric(numerator.value / denominator.value)
  };
}

function createBlockedValuationMetric(
  definition: StockWorkbenchDerivedMetricDefinition,
  facts: Map<FinancialFactMetric, FinancialFactRow>,
  input: {
    financialFacts: GetFinancialFactsResult;
    quoteSnapshot: GetQuoteSnapshotResult;
  }
): StockWorkbenchDerivedMetricValue {
  const availableFacts = definition.required_inputs
    .filter((requiredInput): requiredInput is FinancialFactMetric =>
      isFinancialFactMetric(requiredInput)
    )
    .map((metricId) => facts.get(metricId));
  const base = createMetricBase(definition, availableFacts);
  const quote = input.quoteSnapshot.quote;
  const anomalyFlags =
    quote !== undefined &&
    input.financialFacts.facts !== undefined &&
    quote.currency !== input.financialFacts.facts.currency
      ? ["currency_mismatch"]
      : [];

  return blockMetric(
    {
      ...base,
      inputs: {
        ...base.inputs,
        market_cap: "unavailable",
        quote_last_price: quote?.fields.lastPrice ?? "unavailable",
        shares_outstanding: "unavailable"
      },
      period_end: availableFacts.find((fact) => fact !== undefined)?.periodEnd
    },
    "market_cap_unavailable",
    anomalyFlags
  );
}

function createMetricBase(
  definition: StockWorkbenchDerivedMetricDefinition,
  facts: Array<FinancialFactRow | undefined>
): Omit<StockWorkbenchDerivedMetricValue, "anomaly_flags" | "status"> {
  const sourceRecordIds = Array.from(
    new Set(
      facts
        .filter((fact): fact is FinancialFactRow => fact !== undefined)
        .map((fact) => fact.sourceRecordId)
    )
  ).sort();

  return {
    category: definition.category,
    formula_version: definition.formula_version,
    inputs: {},
    metric_id: definition.metric_id,
    source_record_ids: sourceRecordIds,
    unit: definition.unit
  };
}

function blockMetric(
  metric: Omit<StockWorkbenchDerivedMetricValue, "anomaly_flags" | "status">,
  blockedReason: string,
  anomalyFlags: string[]
): StockWorkbenchDerivedMetricValue {
  return {
    ...metric,
    anomaly_flags: anomalyFlags,
    blocked_reason: blockedReason,
    status: "blocked"
  };
}

function derivedMetricSectionStatus(metrics: StockWorkbenchDerivedMetrics): string {
  return metrics.status === "blocked" ? "blocked" : "found";
}

function createEvidenceSummary(
  provenance: Array<{ source_record_id: string }>
): StockWorkbenchSnapshot["evidence"] {
  const sourceRecordIds = Array.from(
    new Set(provenance.map((item) => item.source_record_id))
  ).sort();

  return {
    provenance_count: provenance.length,
    source_record_ids: sourceRecordIds
  };
}

function createDerivedMetricAnomalyPolicy(): StockWorkbenchDerivedMetricDefinition["anomaly_policy"] {
  return {
    currency_mismatch: "flagged",
    missing_input: "blocked",
    negative_denominator: "blocked",
    quality_hold: "blocked",
    zero_denominator: "blocked"
  };
}

function isFinancialFactMetric(value: string): value is FinancialFactMetric {
  return [
    "assets",
    "equity",
    "free_cash_flow",
    "liabilities",
    "net_income",
    "operating_cash_flow",
    "revenue"
  ].includes(value);
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

// --- Live derived metrics (Netquity Serving Store financial_facts +
// quote_snapshot, non-bank/nb only) ----------------------------------------
// Distinct from createDerivedMetrics above: this combines the two live,
// entitlement-gated result shapes (GetLiveFinancialFactsResult,
// GetLiveQuoteSnapshotResult) rather than the synthetic ones. Each input is
// independently optional -- the resolveDerivedMetrics RPC passes undefined
// for whichever dataset had no released row for this instrument at all
// (404), never a synthesized substitute -- so every branch below degrades to
// a specific blocked_reason instead of throwing. live financial facts diverge
// from the synthetic shape in three ways that this engine must honor: facts
// is a flat LiveFinancialFactRow[] (no nested FinancialFactsDataset
// wrapper), currency lives on each fact row instead of one dataset-level
// currency, and there is no restatementVersion (so the fact map below breaks
// same-period ties by publishedAt instead). Self-contained: only reuses the
// leaf helpers shared with the synthetic engine (roundMetric, blockMetric,
// DERIVED_METRIC_DEFINITIONS and its baked-in anomaly_policy);
// createDerivedMetrics/createBlockedValuationMetric/createProfitabilityMetric/
// createStockWorkbenchSnapshot are untouched.
export function createLiveDerivedMetrics(input: {
  financialFacts?: GetLiveFinancialFactsResult;
  quoteSnapshot?: GetLiveQuoteSnapshotResult;
}): StockWorkbenchLiveDerivedMetrics {
  const facts = createLiveFinancialFactMap(input.financialFacts?.facts ?? []);
  const sortedFacts = [...(input.financialFacts?.facts ?? [])].sort(liveFinancialFactSortOrder);
  const metrics = DERIVED_METRIC_DEFINITIONS.map((definition) =>
    definition.category === "valuation"
      ? createLiveValuationMetric(definition, facts, input)
      : createLiveProfitabilityMetric(definition, facts, input.financialFacts)
  );
  const computedCount = metrics.filter((metric) => metric.status === "computed").length;
  const blockedCount = metrics.length - computedCount;

  return {
    data_version: composeLiveDerivedMetricsDataVersion(input),
    definitions: DERIVED_METRIC_DEFINITIONS,
    financial_facts_as_of: input.financialFacts?.asOf,
    financial_period_end: sortedFacts[0]?.periodEnd,
    live_data_access: true,
    methodology_version: DERIVED_METRIC_LIVE_FORMULA_VERSION,
    metrics,
    provenance: [
      ...(input.financialFacts?.provenance ?? []),
      ...(input.quoteSnapshot?.provenance ?? [])
    ],
    quote_as_of: input.quoteSnapshot?.asOf,
    status: computedCount === 0 ? "blocked" : blockedCount === 0 ? "computed" : "partial",
    toolName: "stock_workbench_derived_metrics",
    usage: {
      cached: false,
      credits: computedCount > 0 ? 1 : 0,
      rows: metrics.length
    }
  };
}

// "" (not a fabricated placeholder) when neither input dataset contributed --
// an honest signal that nothing was actually read for this instrument.
function composeLiveDerivedMetricsDataVersion(input: {
  financialFacts?: GetLiveFinancialFactsResult;
  quoteSnapshot?: GetLiveQuoteSnapshotResult;
}): string {
  const parts: string[] = [];

  if (input.financialFacts !== undefined) {
    parts.push(`financial_facts:${input.financialFacts.dataVersion}`);
  }

  if (input.quoteSnapshot !== undefined) {
    parts.push(`quote_snapshot:${input.quoteSnapshot.dataVersion}`);
  }

  return parts.join("|");
}

// periodEnd desc, publishedAt desc -- live facts carry no restatementVersion
// to break same-period ties with (unlike the synthetic engine's
// createFinancialFactMap), so the most recently published row for that
// period wins instead.
function liveFinancialFactSortOrder(left: LiveFinancialFactRow, right: LiveFinancialFactRow): number {
  const periodOrder = right.periodEnd.localeCompare(left.periodEnd);
  if (periodOrder !== 0) {
    return periodOrder;
  }

  return right.publishedAt.localeCompare(left.publishedAt);
}

function createLiveFinancialFactMap(
  facts: readonly LiveFinancialFactRow[]
): Map<FinancialFactMetric, LiveFinancialFactRow> {
  const rows = [...facts].sort(liveFinancialFactSortOrder);
  const byMetric = new Map<FinancialFactMetric, LiveFinancialFactRow>();

  for (const row of rows) {
    if (!byMetric.has(row.metricId)) {
      byMetric.set(row.metricId, row);
    }
  }

  return byMetric;
}

function createLiveProfitabilityMetric(
  definition: StockWorkbenchDerivedMetricDefinition,
  facts: Map<FinancialFactMetric, LiveFinancialFactRow>,
  financialFacts: GetLiveFinancialFactsResult | undefined
): StockWorkbenchDerivedMetricValue {
  const numerator = facts.get(definition.required_inputs[0] as FinancialFactMetric);
  const denominator = facts.get(definition.required_inputs[1] as FinancialFactMetric);
  const base = createLiveMetricBase(definition, [numerator, denominator]);

  if (financialFacts === undefined) {
    return blockMetric(base, "financial_facts_not_found", []);
  }

  if (numerator === undefined || denominator === undefined) {
    return blockMetric(base, "missing_input", []);
  }

  const qualityFlags = [numerator, denominator]
    .filter((fact) => fact.qualityState !== "PASS")
    .map((fact) => `${fact.metricId}_quality_${fact.qualityState.toLowerCase()}`);

  if (qualityFlags.length > 0) {
    return blockMetric(base, "quality_hold", qualityFlags);
  }

  if (denominator.value === 0) {
    return blockMetric(base, "zero_denominator", []);
  }

  if (denominator.value < 0) {
    return blockMetric(base, "negative_denominator", []);
  }

  return {
    ...base,
    anomaly_flags: [],
    inputs: {
      ...base.inputs,
      [numerator.metricId]: numerator.value,
      [denominator.metricId]: denominator.value
    },
    status: "computed",
    value: roundMetric(numerator.value / denominator.value)
  };
}

// market_cap = quote.close * quote.sharesOutstanding -- the live promotion
// this was blocked on (see deploy/ingest/netquity-quote-snapshot-staging
// .contract.json's derived_panel_valuation_unblock). Blocked-reason ladder,
// checked in order: financial_facts_not_found (entity absent from
// financial_facts entirely) -> quote_unavailable (entity absent from
// quote_snapshot entirely, coverage.status "unavailable", or no close price)
// -> shares_outstanding_unavailable (quote usable but no share count -- the
// dominant real-world case, ~84% of available quote rows per the contract's
// row_count_breakdown) -> missing_input (the specific financial fact this
// ratio needs was not promoted this period) -> quality_hold -> zero/negative
// denominator. currency_mismatch is flagged, never blocking, per the shared
// anomaly_policy baked into DERIVED_METRIC_DEFINITIONS.
function createLiveValuationMetric(
  definition: StockWorkbenchDerivedMetricDefinition,
  facts: Map<FinancialFactMetric, LiveFinancialFactRow>,
  input: {
    financialFacts?: GetLiveFinancialFactsResult;
    quoteSnapshot?: GetLiveQuoteSnapshotResult;
  }
): StockWorkbenchDerivedMetricValue {
  const denominatorMetricId = definition.required_inputs[1] as FinancialFactMetric;
  const denominator = facts.get(denominatorMetricId);
  const quote = input.quoteSnapshot?.quote;
  const base = createLiveMetricBase(definition, [denominator], [
    input.quoteSnapshot?.provenance[0]?.source_record_id
  ]);
  const baseWithQuoteInputs: Omit<StockWorkbenchDerivedMetricValue, "anomaly_flags" | "status"> = {
    ...base,
    inputs: {
      ...base.inputs,
      ...(quote?.close !== undefined ? { quote_close: quote.close } : {}),
      ...(quote?.sharesOutstanding !== undefined ? { shares_outstanding: quote.sharesOutstanding } : {}),
      ...(denominator !== undefined ? { [denominatorMetricId]: denominator.value } : {})
    }
  };

  if (input.financialFacts === undefined) {
    return blockMetric(baseWithQuoteInputs, "financial_facts_not_found", []);
  }

  if (input.quoteSnapshot === undefined || quote === undefined || quote.close === undefined) {
    return blockMetric(baseWithQuoteInputs, "quote_unavailable", []);
  }

  if (quote.sharesOutstanding === undefined) {
    return blockMetric(baseWithQuoteInputs, "shares_outstanding_unavailable", []);
  }

  if (denominator === undefined) {
    return blockMetric(baseWithQuoteInputs, "missing_input", []);
  }

  const anomalyFlags = quote.currency !== denominator.currency ? ["currency_mismatch"] : [];

  if (denominator.qualityState !== "PASS") {
    return blockMetric(baseWithQuoteInputs, "quality_hold", [
      ...anomalyFlags,
      `${denominator.metricId}_quality_${denominator.qualityState.toLowerCase()}`
    ]);
  }

  if (denominator.value === 0) {
    return blockMetric(baseWithQuoteInputs, "zero_denominator", anomalyFlags);
  }

  if (denominator.value < 0) {
    return blockMetric(baseWithQuoteInputs, "negative_denominator", anomalyFlags);
  }

  const marketCap = roundMetric(quote.close * quote.sharesOutstanding);

  return {
    ...baseWithQuoteInputs,
    anomaly_flags: anomalyFlags,
    inputs: {
      ...baseWithQuoteInputs.inputs,
      market_cap: marketCap
    },
    status: "computed",
    value: roundMetric(marketCap / denominator.value)
  };
}

function createLiveMetricBase(
  definition: StockWorkbenchDerivedMetricDefinition,
  facts: Array<LiveFinancialFactRow | undefined>,
  extraSourceRecordIds: Array<string | undefined> = []
): Omit<StockWorkbenchDerivedMetricValue, "anomaly_flags" | "status"> {
  const knownFacts = facts.filter((fact): fact is LiveFinancialFactRow => fact !== undefined);
  const sourceRecordIds = Array.from(
    new Set([
      ...knownFacts.map((fact) => fact.sourceRecordId),
      ...extraSourceRecordIds.filter((id): id is string => id !== undefined)
    ])
  ).sort();

  return {
    category: definition.category,
    formula_version: definition.formula_version,
    inputs: {},
    metric_id: definition.metric_id,
    period_end: knownFacts[0]?.periodEnd,
    source_record_ids: sourceRecordIds,
    unit: definition.unit
  };
}
