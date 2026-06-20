import {
  getCorporateActions,
  getCorporateActionsCapabilities,
  type GetCorporateActionsResult
} from "@aiphabee/corporate-actions";
import {
  getFinancialFacts,
  getFinancialFactsCapabilities,
  type GetFinancialFactsResult
} from "@aiphabee/financial-facts";
import {
  getPriceHistory,
  getPriceHistoryCapabilities,
  getQuoteSnapshot,
  getQuoteSnapshotCapabilities,
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
  "2026-06-21.phase1.stock-workbench-aggregate-scaffold.v0";

export interface StockWorkbenchSnapshotInput {
  adjustment?: PriceHistoryAdjustment;
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

export interface StockWorkbenchSnapshot {
  actual_tool_execution: true;
  corporate_actions: GetCorporateActionsResult;
  data_quality: {
    blocking_statuses: string[];
    section_statuses: Record<StockWorkbenchSection, string>;
  };
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
    announcements: "planned";
    derived_valuation_metrics: "planned";
  };
  version: typeof STOCK_WORKBENCH_VERSION;
}

export type StockWorkbenchSection =
  | "corporate_actions"
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

export function getStockWorkbenchCapabilities() {
  return {
    actual_tool_execution: true,
    frontend_rendering: false,
    live_data_access: false,
    package: "@aiphabee/workbench" as const,
    route: "POST /workbench/stock/snapshot" as const,
    runtime_route: "GET /workbench/runtime" as const,
    sections: [
      "security_profile",
      "quote_snapshot",
      "price_history",
      "financial_facts",
      "corporate_actions"
    ] as const,
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
      announcements: "planned" as const,
      derived_valuation_metrics: "planned" as const
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

    return createSnapshot({
      corporateActions: unresolvedActions,
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
  const allFound = [
    securityProfile.status,
    quoteSnapshot.status,
    priceHistory.status,
    financialFacts.status,
    corporateActions.status
  ].every((status) => status === "found");

  return createSnapshot({
    corporateActions,
    financialFacts,
    instrumentId,
    priceHistory,
    quoteSnapshot,
    resolution,
    securityProfile,
    status: allFound ? "ready" : "partial"
  });
}

function createSnapshot(input: {
  corporateActions: GetCorporateActionsResult;
  financialFacts: GetFinancialFactsResult;
  instrumentId?: string;
  priceHistory: GetPriceHistoryResult;
  quoteSnapshot: GetQuoteSnapshotResult;
  resolution?: ResolveSecurityResult;
  securityProfile: GetSecurityProfileResult;
  status: StockWorkbenchSnapshot["status"];
}): StockWorkbenchSnapshot {
  const sectionStatuses: Record<StockWorkbenchSection, string> = {
    corporate_actions: input.corporateActions.status,
    financial_facts: input.financialFacts.status,
    price_history: input.priceHistory.status,
    quote_snapshot: input.quoteSnapshot.status,
    security_profile: input.securityProfile.status
  };

  return {
    actual_tool_execution: true,
    corporate_actions: input.corporateActions,
    data_quality: {
      blocking_statuses: Object.values(sectionStatuses).filter((status) => status !== "found"),
      section_statuses: sectionStatuses
    },
    evidence: createEvidenceSummary([
      ...(input.resolution?.provenance ?? []),
      ...input.securityProfile.provenance,
      ...input.quoteSnapshot.provenance,
      ...input.priceHistory.provenance,
      ...input.financialFacts.provenance,
      ...input.corporateActions.provenance
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
      announcements: "planned",
      derived_valuation_metrics: "planned"
    },
    version: STOCK_WORKBENCH_VERSION
  };
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
