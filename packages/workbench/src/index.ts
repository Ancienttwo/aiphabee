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
  "2026-06-21.phase1.stock-workbench-derived-metrics-scaffold.v0";

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

export interface StockWorkbenchSnapshot {
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
    announcements: "planned";
  };
  version: typeof STOCK_WORKBENCH_VERSION;
}

export type StockWorkbenchSection =
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
const DERIVED_METRIC_FORMULA_VERSION = "stock-workbench-derived-metrics-v0";
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
      "derived_metrics",
      "corporate_actions"
    ] as const,
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
      announcements: "planned" as const
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

    return createSnapshot({
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
  const allFound = [
    securityProfile.status,
    quoteSnapshot.status,
    priceHistory.status,
    financialFacts.status,
    corporateActions.status
  ].every((status) => status === "found");

  return createSnapshot({
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

function createSnapshot(input: {
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
    corporate_actions: input.corporateActions.status,
    derived_metrics: derivedMetricSectionStatus(input.derivedMetrics),
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
    derived_metrics: input.derivedMetrics,
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
      announcements: "planned"
    },
    version: STOCK_WORKBENCH_VERSION
  };
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
