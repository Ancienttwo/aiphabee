import {
  getFinancialFacts,
  type FinancialFactMetric,
  type FinancialFactRow,
  type GetFinancialFactsResult
} from "@aiphabee/financial-facts";
import {
  getQuoteSnapshot,
  type GetQuoteSnapshotResult
} from "@aiphabee/market-data";
import {
  getSecurityProfile,
  resolveSecurity,
  type GetSecurityProfileResult,
  type ResolveSecurityCandidate,
  type ResolveSecurityResult
} from "@aiphabee/security-tools";

export const ANALYTICS_TOOLS_VERSION =
  "2026-06-21.phase2.compare-securities-scaffold.v0";
export const SCREEN_SECURITIES_VERSION =
  "2026-06-21.phase2.screen-securities-scaffold.v0";
export const FINANCIAL_RATIOS_VERSION =
  "2026-06-21.phase2.financial-ratios-scaffold.v0";

export type CompareSecuritiesStatus = "compared" | "invalid_input" | "partial";
export type CompareSecuritiesRowStatus =
  | "blocked_resolution"
  | "comparable"
  | "incomparable";

export interface CompareSecuritiesInput {
  asOf?: string;
  financialFrom?: string;
  financialTo?: string;
  requestId: string;
  securities: string[];
  targetCurrency?: string;
}

export interface CompareSecuritiesRow {
  candidates?: ResolveSecurityCandidate[];
  currency?: string;
  financials: Partial<Record<FinancialFactMetric, number>>;
  input: string;
  instrument_id?: string;
  missing_metrics: FinancialFactMetric[];
  quality_flags: string[];
  quote?: {
    as_of: string;
    last_price?: number;
    market_status: string;
  };
  source_record_ids: string[];
  status: CompareSecuritiesRowStatus;
  symbol?: string;
  unit?: string;
}

export interface CompareSecuritiesResult {
  as_of: string;
  data_version: typeof ANALYTICS_TOOLS_VERSION;
  frontend_rendering: false;
  live_data_access: false;
  methodology_version: typeof ANALYTICS_TOOLS_VERSION;
  requested_securities: string[];
  row_count: number;
  rows: CompareSecuritiesRow[];
  status: CompareSecuritiesStatus;
  toolName: "compare_securities";
  unified_comparison: {
    base_currency?: string;
    base_unit?: string;
    currency_conversion: "blocked_no_fx_rate" | "not_required";
    incomparable_reasons: string[];
    max_securities: 5;
    min_securities: 2;
  };
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

export type ScreenSecuritiesOperator = "eq" | "gte" | "lte";
export type ScreenSecuritiesField = FinancialFactMetric | "last_price";
export type ScreenSecuritiesStatus = "planned_with_preview" | "unsupported_query";

export interface ScreenSecuritiesCondition {
  editable: true;
  field: ScreenSecuritiesField;
  missing_value_rule: "exclude";
  operator: ScreenSecuritiesOperator;
  source_tool: "get_financial_facts" | "get_quote_snapshot";
  time_basis: "latest_available_as_of";
  value: number;
}

export interface ScreenSecuritiesInput {
  asOf?: string;
  conditions?: Array<Partial<ScreenSecuritiesCondition>>;
  financialFrom?: string;
  financialTo?: string;
  naturalLanguage?: string;
  requestId: string;
  universe?: string[];
}

export interface ScreenSecuritiesHit {
  instrument_id?: string;
  matched_conditions: string[];
  rank: number;
  score: number;
  source_record_ids: string[];
  symbol?: string;
  why: string[];
}

export interface ScreenSecuritiesResult {
  as_of: string;
  data_version: typeof SCREEN_SECURITIES_VERSION;
  editable_before_execution: true;
  execution_preview: {
    hit_count: number;
    hits: ScreenSecuritiesHit[];
    ranking_method: "matched_condition_count_then_symbol";
    rejected_count: number;
    rejected_rows: Array<{
      input: string;
      reasons: string[];
      symbol?: string;
    }>;
    universe_size: number;
  };
  frontend_rendering: false;
  live_data_access: false;
  methodology_version: typeof SCREEN_SECURITIES_VERSION;
  natural_language?: string;
  parsed_conditions: ScreenSecuritiesCondition[];
  requires_confirmation_before_live_execution: true;
  status: ScreenSecuritiesStatus;
  toolName: "screen_securities";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

export type FinancialRatioStatus = "blocked" | "computed";
export type FinancialRatioMetricId =
  | "asset_turnover"
  | "equity_multiplier"
  | "net_margin"
  | "return_on_assets"
  | "return_on_equity";

export interface FinancialRatioInput {
  asOf?: string;
  financialFrom?: string;
  financialTo?: string;
  instrumentId?: string;
  requestId: string;
  securityQuery?: string;
}

export interface FinancialRatioDefinition {
  anomaly_policy: {
    missing_input: "blocked";
    negative_denominator: "blocked";
    quality_hold: "blocked";
    zero_denominator: "blocked";
  };
  formula: string;
  formula_version: typeof FINANCIAL_RATIO_FORMULA_VERSION;
  metric_id: FinancialRatioMetricId;
  required_inputs: FinancialFactMetric[];
  unit: "multiple" | "ratio";
}

export interface FinancialRatioValue {
  blocked_reason?: string;
  formula_version: typeof FINANCIAL_RATIO_FORMULA_VERSION;
  inputs: Partial<Record<FinancialFactMetric, number>>;
  metric_id: FinancialRatioMetricId;
  percentile?: {
    peer_set_id: string;
    percentile_rank: number;
    sample_count: number;
  };
  period_end?: string;
  source_record_ids: string[];
  status: FinancialRatioStatus;
  unit: "multiple" | "ratio";
  value?: number;
}

export interface FinancialRatiosResult {
  as_of: string;
  data_version: typeof FINANCIAL_RATIOS_VERSION;
  definitions: FinancialRatioDefinition[];
  facts_status: GetFinancialFactsResult["status"];
  frontend_rendering: false;
  instrument_id?: string;
  live_data_access: false;
  methodology_version: typeof FINANCIAL_RATIOS_VERSION;
  percentile_methodology: {
    live_peer_constituents: false;
    method: "synthetic_peer_distribution_rank";
    point_in_time: true;
  };
  ratios: FinancialRatioValue[];
  resolve_security?: ResolveSecurityResult;
  status: "blocked_resolution" | "computed" | "partial";
  toolName: "get_financial_ratios";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

interface ResolvedComparisonSurface {
  facts: GetFinancialFactsResult;
  profile: GetSecurityProfileResult;
  quote: GetQuoteSnapshotResult;
  resolution: ResolveSecurityResult;
}

const DEFAULT_FINANCIAL_FROM = "2023-12-31";
const DEFAULT_FINANCIAL_TO = "2023-12-31";
const DEFAULT_SCREEN_UNIVERSE = ["00700.HK", "08001.HK", "00001.HK"];
const FINANCIAL_RATIO_FORMULA_VERSION = "financial-ratios-v0";
const REQUIRED_FINANCIAL_METRICS: FinancialFactMetric[] = [
  "revenue",
  "net_income",
  "assets",
  "equity"
];
const FINANCIAL_RATIO_DEFINITIONS: FinancialRatioDefinition[] = [
  {
    anomaly_policy: createFinancialRatioAnomalyPolicy(),
    formula: "net_income / revenue",
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    metric_id: "net_margin",
    required_inputs: ["net_income", "revenue"],
    unit: "ratio"
  },
  {
    anomaly_policy: createFinancialRatioAnomalyPolicy(),
    formula: "net_income / assets",
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    metric_id: "return_on_assets",
    required_inputs: ["net_income", "assets"],
    unit: "ratio"
  },
  {
    anomaly_policy: createFinancialRatioAnomalyPolicy(),
    formula: "net_income / equity",
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    metric_id: "return_on_equity",
    required_inputs: ["net_income", "equity"],
    unit: "ratio"
  },
  {
    anomaly_policy: createFinancialRatioAnomalyPolicy(),
    formula: "revenue / assets",
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    metric_id: "asset_turnover",
    required_inputs: ["revenue", "assets"],
    unit: "ratio"
  },
  {
    anomaly_policy: createFinancialRatioAnomalyPolicy(),
    formula: "assets / equity",
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    metric_id: "equity_multiplier",
    required_inputs: ["assets", "equity"],
    unit: "multiple"
  }
];
const FINANCIAL_RATIO_PEER_DISTRIBUTION: Record<FinancialRatioMetricId, number[]> = {
  asset_turnover: [0.12, 0.25, 0.387908, 0.52, 0.68],
  equity_multiplier: [1.2, 1.5, 1.896135, 2.4, 3.1],
  net_margin: [0.03, 0.08, 0.12, 0.189184, 0.24],
  return_on_assets: [0.01, 0.03, 0.05, 0.073386, 0.11],
  return_on_equity: [0.04, 0.08, 0.12, 0.13915, 0.21]
};

export function getCompareSecuritiesCapabilities() {
  return {
    allow_fx_conversion_without_rate: false,
    frontend_rendering: false,
    live_data_access: false,
    max_securities: 5,
    metrics: REQUIRED_FINANCIAL_METRICS,
    min_securities: 2,
    package: "@aiphabee/analytics-tools" as const,
    route: "POST /analytics/compare-securities" as const,
    status: "compare_securities_scaffold" as const,
    tool_name: "compare_securities" as const,
    version: ANALYTICS_TOOLS_VERSION
  };
}

export function getScreenSecuritiesCapabilities() {
  return {
    editable_conditions: true,
    frontend_rendering: false,
    live_data_access: false,
    package: "@aiphabee/analytics-tools" as const,
    preview_execution: true,
    requires_confirmation_before_live_execution: true,
    route: "POST /analytics/screen-securities" as const,
    status: "screen_securities_scaffold" as const,
    supported_fields: ["revenue", "net_income", "assets", "equity", "last_price"] as const,
    supported_operators: ["eq", "gte", "lte"] as const,
    tool_name: "screen_securities" as const,
    version: SCREEN_SECURITIES_VERSION
  };
}

export function getFinancialRatiosCapabilities() {
  return {
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    frontend_rendering: false,
    live_data_access: false,
    package: "@aiphabee/analytics-tools" as const,
    percentile_methodology: "synthetic_peer_distribution_rank" as const,
    point_in_time: true,
    route: "POST /analytics/financial-ratios" as const,
    status: "financial_ratios_scaffold" as const,
    supported_metrics: FINANCIAL_RATIO_DEFINITIONS.map((definition) => definition.metric_id),
    tool_name: "get_financial_ratios" as const,
    version: FINANCIAL_RATIOS_VERSION
  };
}

export function compareSecurities(input: CompareSecuritiesInput): CompareSecuritiesResult {
  const requestedSecurities = input.securities
    .map((security) => security.trim())
    .filter((security) => security.length > 0);
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";

  if (requestedSecurities.length < 2 || requestedSecurities.length > 5) {
    return createInvalidInputResult(requestedSecurities, asOf);
  }

  const surfaces = requestedSecurities.map((security) =>
    createResolvedComparisonSurface(security, input)
  );
  const rows = surfaces.map((surface, index) =>
    createComparisonRow(requestedSecurities[index] ?? "", surface)
  );
  const comparableRows = rows.filter((row) => row.status === "comparable");
  const baseCurrency =
    input.targetCurrency ?? comparableRows[0]?.currency ?? rows.find((row) => row.currency)?.currency;
  const baseUnit = comparableRows[0]?.unit ?? rows.find((row) => row.unit)?.unit;
  const incomparableReasons = createIncomparableReasons(rows, baseCurrency, baseUnit);
  const currencyConversion = rows.some(
    (row) => row.currency !== undefined && baseCurrency !== undefined && row.currency !== baseCurrency
  )
    ? "blocked_no_fx_rate"
    : "not_required";

  return {
    as_of: asOf,
    data_version: ANALYTICS_TOOLS_VERSION,
    frontend_rendering: false,
    live_data_access: false,
    methodology_version: ANALYTICS_TOOLS_VERSION,
    requested_securities: requestedSecurities,
    row_count: rows.length,
    rows,
    status:
      rows.every((row) => row.status === "comparable") &&
      currencyConversion === "not_required"
        ? "compared"
        : "partial",
    toolName: "compare_securities",
    unified_comparison: {
      base_currency: baseCurrency,
      base_unit: baseUnit,
      currency_conversion: currencyConversion,
      incomparable_reasons: incomparableReasons,
      max_securities: 5,
      min_securities: 2
    },
    usage: {
      cached: false,
      credits:
        surfaces.reduce((sum, surface) => sum + createSurfaceCredits(surface), 0) +
        (rows.length > 0 ? 1 : 0),
      rows: surfaces.reduce((sum, surface) => sum + createSurfaceRows(surface), 0) + rows.length
    }
  };
}

export function screenSecurities(input: ScreenSecuritiesInput): ScreenSecuritiesResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const naturalLanguage = input.naturalLanguage?.trim();
  const parsedConditions = normalizeScreenConditions(
    input.conditions,
    naturalLanguage
  );
  const universe =
    input.universe?.map((security) => security.trim()).filter((security) => security.length > 0) ??
    DEFAULT_SCREEN_UNIVERSE;
  const comparison = compareSecurities({
    asOf: input.asOf,
    financialFrom: input.financialFrom,
    financialTo: input.financialTo,
    requestId: input.requestId,
    securities: universe.slice(0, 5)
  });

  if (parsedConditions.length === 0) {
    return {
      as_of: asOf,
      data_version: SCREEN_SECURITIES_VERSION,
      editable_before_execution: true,
      execution_preview: {
        hit_count: 0,
        hits: [],
        ranking_method: "matched_condition_count_then_symbol",
        rejected_count: comparison.rows.length,
        rejected_rows: comparison.rows.map((row) => ({
          input: row.input,
          reasons: ["unsupported_or_empty_query"],
          symbol: row.symbol
        })),
        universe_size: comparison.rows.length
      },
      frontend_rendering: false,
      live_data_access: false,
      methodology_version: SCREEN_SECURITIES_VERSION,
      natural_language: naturalLanguage,
      parsed_conditions: [],
      requires_confirmation_before_live_execution: true,
      status: "unsupported_query",
      toolName: "screen_securities",
      usage: {
        cached: false,
        credits: comparison.usage.credits,
        rows: comparison.usage.rows
      }
    };
  }

  const evaluatedRows = comparison.rows.map((row) => evaluateScreenRow(row, parsedConditions));
  const hits: ScreenSecuritiesHit[] = evaluatedRows
    .flatMap((row) => (row.hit === undefined ? [] : [row.hit]))
    .sort((left, right) => right.score - left.score || (left.symbol ?? "").localeCompare(right.symbol ?? ""))
    .map((hit, index) => ({
      ...hit,
      rank: index + 1
    }));
  const rejectedRows = evaluatedRows
    .filter((row) => row.hit === undefined)
    .map((row) => row.rejected);

  return {
    as_of: asOf,
    data_version: SCREEN_SECURITIES_VERSION,
    editable_before_execution: true,
    execution_preview: {
      hit_count: hits.length,
      hits,
      ranking_method: "matched_condition_count_then_symbol",
      rejected_count: rejectedRows.length,
      rejected_rows: rejectedRows,
      universe_size: comparison.rows.length
    },
    frontend_rendering: false,
    live_data_access: false,
    methodology_version: SCREEN_SECURITIES_VERSION,
    natural_language: naturalLanguage,
    parsed_conditions: parsedConditions,
    requires_confirmation_before_live_execution: true,
    status: "planned_with_preview",
    toolName: "screen_securities",
    usage: {
      cached: false,
      credits: comparison.usage.credits + 1,
      rows: comparison.usage.rows + comparison.rows.length
    }
  };
}

export function getFinancialRatios(input: FinancialRatioInput): FinancialRatiosResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;

  if (instrumentId === undefined) {
    return {
      as_of: asOf,
      data_version: FINANCIAL_RATIOS_VERSION,
      definitions: FINANCIAL_RATIO_DEFINITIONS,
      facts_status: "not_found",
      frontend_rendering: false,
      live_data_access: false,
      methodology_version: FINANCIAL_RATIOS_VERSION,
      percentile_methodology: createFinancialRatioPercentileMethodology(),
      ratios: FINANCIAL_RATIO_DEFINITIONS.map((definition) =>
        createBlockedFinancialRatio(definition, "security_resolution_required", [])
      ),
      resolve_security: resolution,
      status: "blocked_resolution",
      toolName: "get_financial_ratios",
      usage: {
        cached: false,
        credits: resolution?.usage.credits ?? 0,
        rows: resolution?.usage.rows ?? 0
      }
    };
  }

  const facts = getFinancialFacts({
    asOf: input.asOf,
    from: input.financialFrom ?? DEFAULT_FINANCIAL_FROM,
    instrumentId,
    metrics: REQUIRED_FINANCIAL_METRICS,
    to: input.financialTo ?? DEFAULT_FINANCIAL_TO
  });
  const factMap = createFinancialFactMap(facts.facts?.facts ?? []);
  const ratios = FINANCIAL_RATIO_DEFINITIONS.map((definition) =>
    createFinancialRatioValue(definition, factMap, facts.status)
  );
  const computedCount = ratios.filter((ratio) => ratio.status === "computed").length;

  return {
    as_of: asOf,
    data_version: FINANCIAL_RATIOS_VERSION,
    definitions: FINANCIAL_RATIO_DEFINITIONS,
    facts_status: facts.status,
    frontend_rendering: false,
    instrument_id: instrumentId,
    live_data_access: false,
    methodology_version: FINANCIAL_RATIOS_VERSION,
    percentile_methodology: createFinancialRatioPercentileMethodology(),
    ratios,
    resolve_security: resolution,
    status: computedCount === ratios.length ? "computed" : "partial",
    toolName: "get_financial_ratios",
    usage: {
      cached: false,
      credits: facts.usage.credits + (resolution?.usage.credits ?? 0) + (computedCount > 0 ? 1 : 0),
      rows: facts.usage.rows + (resolution?.usage.rows ?? 0) + ratios.length
    }
  };
}

function createInvalidInputResult(
  requestedSecurities: string[],
  asOf: string
): CompareSecuritiesResult {
  return {
    as_of: asOf,
    data_version: ANALYTICS_TOOLS_VERSION,
    frontend_rendering: false,
    live_data_access: false,
    methodology_version: ANALYTICS_TOOLS_VERSION,
    requested_securities: requestedSecurities,
    row_count: 0,
    rows: [],
    status: "invalid_input",
    toolName: "compare_securities",
    unified_comparison: {
      currency_conversion: "not_required",
      incomparable_reasons: ["compare_securities requires 2 to 5 securities"],
      max_securities: 5,
      min_securities: 2
    },
    usage: {
      cached: false,
      credits: 0,
      rows: 0
    }
  };
}

function createResolvedComparisonSurface(
  security: string,
  input: CompareSecuritiesInput
): ResolvedComparisonSurface {
  const resolution = resolveSecurity({
    asOf: input.asOf,
    query: security
  });
  const instrumentId = resolution.selectedInstrumentId ?? "__unresolved__";

  return {
    facts: getFinancialFacts({
      asOf: input.asOf,
      from: input.financialFrom ?? DEFAULT_FINANCIAL_FROM,
      instrumentId,
      metrics: REQUIRED_FINANCIAL_METRICS,
      to: input.financialTo ?? DEFAULT_FINANCIAL_TO
    }),
    profile: getSecurityProfile({
      asOf: input.asOf,
      instrumentId
    }),
    quote: getQuoteSnapshot({
      asOf: input.asOf,
      instrumentId
    }),
    resolution
  };
}

function createComparisonRow(
  input: string,
  surface: ResolvedComparisonSurface
): CompareSecuritiesRow {
  if (surface.resolution.status !== "resolved") {
    return {
      candidates: surface.resolution.candidates,
      financials: {},
      input,
      missing_metrics: REQUIRED_FINANCIAL_METRICS,
      quality_flags: ["security_resolution_required"],
      source_record_ids: surface.resolution.provenance.map((item) => item.source_record_id),
      status: "blocked_resolution"
    };
  }

  const facts = createFinancialFactMap(surface.facts.facts?.facts ?? []);
  const missingMetrics = REQUIRED_FINANCIAL_METRICS.filter((metric) => !facts.has(metric));
  const qualityFlags = [
    ...createToolQualityFlags(surface),
    ...Array.from(facts.values())
      .filter((fact) => fact.qualityState !== "PASS")
      .map((fact) => `${fact.metricId}_quality_${fact.qualityState.toLowerCase()}`)
  ];

  return {
    currency:
      surface.profile.profile?.currency ??
      surface.quote.quote?.currency ??
      surface.facts.facts?.currency,
    financials: Object.fromEntries(
      Array.from(facts.entries()).map(([metric, fact]) => [metric, fact.value])
    ),
    input,
    instrument_id: surface.resolution.selectedInstrumentId,
    missing_metrics: missingMetrics,
    quality_flags: qualityFlags,
    quote:
      surface.quote.quote === undefined
        ? undefined
        : {
            as_of: surface.quote.quote.asOf,
            last_price: surface.quote.quote.fields.lastPrice,
            market_status: surface.quote.quote.marketStatus
          },
    source_record_ids: createSourceRecordIds(surface, facts),
    status:
      missingMetrics.length === 0 && qualityFlags.length === 0
        ? "comparable"
        : "incomparable",
    symbol: surface.profile.profile?.symbol ?? surface.quote.quote?.symbol,
    unit: surface.facts.facts?.unit
  };
}

function createFinancialFactMap(
  facts: FinancialFactRow[]
): Map<FinancialFactMetric, FinancialFactRow> {
  return new Map(
    facts
      .filter((fact) => REQUIRED_FINANCIAL_METRICS.includes(fact.metricId))
      .map((fact) => [fact.metricId, fact])
  );
}

function createToolQualityFlags(surface: ResolvedComparisonSurface): string[] {
  return [
    surface.profile.status === "found" ? undefined : `profile_${surface.profile.status}`,
    surface.quote.status === "found" ? undefined : `quote_${surface.quote.status}`,
    surface.facts.status === "found" ? undefined : `financial_facts_${surface.facts.status}`
  ].filter((flag): flag is string => flag !== undefined);
}

function createSourceRecordIds(
  surface: ResolvedComparisonSurface,
  facts: Map<FinancialFactMetric, FinancialFactRow>
): string[] {
  return Array.from(
    new Set([
      ...surface.resolution.provenance.map((item) => item.source_record_id),
      ...surface.profile.provenance.map((item) => item.source_record_id),
      ...surface.quote.provenance.map((item) => item.source_record_id),
      ...surface.facts.provenance.map((item) => item.source_record_id),
      ...Array.from(facts.values()).map((fact) => fact.sourceRecordId)
    ])
  ).sort();
}

function createIncomparableReasons(
  rows: CompareSecuritiesRow[],
  baseCurrency: string | undefined,
  baseUnit: string | undefined
): string[] {
  return rows.flatMap((row) => {
    const reasons = [
      ...row.missing_metrics.map((metric) => `${row.input}:missing_${metric}`),
      ...row.quality_flags.map((flag) => `${row.input}:${flag}`)
    ];

    if (baseCurrency !== undefined && row.currency !== undefined && row.currency !== baseCurrency) {
      reasons.push(`${row.input}:currency_${row.currency}_not_${baseCurrency}`);
    }

    if (baseUnit !== undefined && row.unit !== undefined && row.unit !== baseUnit) {
      reasons.push(`${row.input}:unit_${row.unit}_not_${baseUnit}`);
    }

    return reasons;
  });
}

function createSurfaceRows(surface: ResolvedComparisonSurface): number {
  return (
    surface.resolution.usage.rows +
    surface.profile.usage.rows +
    surface.quote.usage.rows +
    surface.facts.usage.rows
  );
}

function createSurfaceCredits(surface: ResolvedComparisonSurface): number {
  return (
    surface.resolution.usage.credits +
    surface.profile.usage.credits +
    surface.quote.usage.credits +
    surface.facts.usage.credits
  );
}

function createFinancialRatioValue(
  definition: FinancialRatioDefinition,
  facts: Map<FinancialFactMetric, FinancialFactRow>,
  factsStatus: GetFinancialFactsResult["status"]
): FinancialRatioValue {
  const numerator = facts.get(definition.required_inputs[0]);
  const denominator = facts.get(definition.required_inputs[1]);
  const sourceRecordIds = createFinancialRatioSourceRecordIds([numerator, denominator]);

  if (factsStatus !== "found") {
    return createBlockedFinancialRatio(
      definition,
      `financial_facts_${factsStatus}`,
      sourceRecordIds
    );
  }

  if (numerator === undefined || denominator === undefined) {
    return createBlockedFinancialRatio(definition, "missing_input", sourceRecordIds);
  }

  if (numerator.qualityState !== "PASS" || denominator.qualityState !== "PASS") {
    return createBlockedFinancialRatio(definition, "quality_hold", sourceRecordIds);
  }

  if (denominator.value === 0) {
    return createBlockedFinancialRatio(definition, "zero_denominator", sourceRecordIds);
  }

  if (denominator.value < 0) {
    return createBlockedFinancialRatio(definition, "negative_denominator", sourceRecordIds);
  }

  const value = roundMetric(numerator.value / denominator.value);

  return {
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    inputs: {
      [numerator.metricId]: numerator.value,
      [denominator.metricId]: denominator.value
    },
    metric_id: definition.metric_id,
    percentile: createFinancialRatioPercentile(definition.metric_id, value),
    period_end: numerator.periodEnd,
    source_record_ids: sourceRecordIds,
    status: "computed",
    unit: definition.unit,
    value
  };
}

function createBlockedFinancialRatio(
  definition: FinancialRatioDefinition,
  blockedReason: string,
  sourceRecordIds: string[]
): FinancialRatioValue {
  return {
    blocked_reason: blockedReason,
    formula_version: FINANCIAL_RATIO_FORMULA_VERSION,
    inputs: {},
    metric_id: definition.metric_id,
    source_record_ids: sourceRecordIds,
    status: "blocked",
    unit: definition.unit
  };
}

function createFinancialRatioPercentile(
  metricId: FinancialRatioMetricId,
  value: number
): FinancialRatioValue["percentile"] {
  const distribution = FINANCIAL_RATIO_PEER_DISTRIBUTION[metricId];
  const rank = distribution.filter((peerValue) => peerValue <= value).length;

  return {
    peer_set_id: "synthetic_hk_large_mid_cap_v0",
    percentile_rank: roundMetric(rank / distribution.length),
    sample_count: distribution.length
  };
}

function createFinancialRatioPercentileMethodology(): FinancialRatiosResult["percentile_methodology"] {
  return {
    live_peer_constituents: false,
    method: "synthetic_peer_distribution_rank",
    point_in_time: true
  };
}

function createFinancialRatioSourceRecordIds(
  facts: Array<FinancialFactRow | undefined>
): string[] {
  return Array.from(
    new Set(
      facts
        .filter((fact): fact is FinancialFactRow => fact !== undefined)
        .map((fact) => fact.sourceRecordId)
    )
  ).sort();
}

function createFinancialRatioAnomalyPolicy(): FinancialRatioDefinition["anomaly_policy"] {
  return {
    missing_input: "blocked",
    negative_denominator: "blocked",
    quality_hold: "blocked",
    zero_denominator: "blocked"
  };
}

function normalizeScreenConditions(
  conditions: Array<Partial<ScreenSecuritiesCondition>> | undefined,
  naturalLanguage: string | undefined
): ScreenSecuritiesCondition[] {
  const explicitConditions =
    conditions
      ?.map((condition) => normalizeExplicitCondition(condition))
      .filter((condition): condition is ScreenSecuritiesCondition => condition !== undefined) ??
    [];

  return explicitConditions.length > 0
    ? explicitConditions
    : parseNaturalLanguageConditions(naturalLanguage);
}

function normalizeExplicitCondition(
  condition: Partial<ScreenSecuritiesCondition>
): ScreenSecuritiesCondition | undefined {
  if (
    condition.field === undefined ||
    condition.operator === undefined ||
    condition.value === undefined ||
    !isScreenField(condition.field) ||
    !isScreenOperator(condition.operator) ||
    !Number.isFinite(condition.value)
  ) {
    return undefined;
  }

  return createScreenCondition(condition.field, condition.operator, condition.value);
}

function parseNaturalLanguageConditions(
  naturalLanguage: string | undefined
): ScreenSecuritiesCondition[] {
  if (naturalLanguage === undefined || naturalLanguage.length === 0) {
    return [];
  }

  const normalized = naturalLanguage.toLowerCase();
  const conditions: ScreenSecuritiesCondition[] = [];

  for (const field of ["revenue", "net_income", "assets", "equity", "last_price"] as const) {
    const value = parseThreshold(normalized, field);
    if (value !== undefined) {
      conditions.push(createScreenCondition(field, "gte", value));
    }
  }

  if (normalized.includes("profitable") && !conditions.some((condition) => condition.field === "net_income")) {
    conditions.push(createScreenCondition("net_income", "gte", 0));
  }

  return conditions;
}

function parseThreshold(
  normalized: string,
  field: ScreenSecuritiesField
): number | undefined {
  const fieldPattern = field.replace("_", "[ _-]?");
  const pattern = new RegExp(
    `${fieldPattern}\\s*(?:>=|>|above|over|greater than|at least)\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`,
    "u"
  );
  const match = normalized.match(pattern);
  const rawValue = match?.[1]?.replaceAll(",", "");

  return rawValue === undefined ? undefined : Number(rawValue);
}

function createScreenCondition(
  field: ScreenSecuritiesField,
  operator: ScreenSecuritiesOperator,
  value: number
): ScreenSecuritiesCondition {
  return {
    editable: true,
    field,
    missing_value_rule: "exclude",
    operator,
    source_tool: field === "last_price" ? "get_quote_snapshot" : "get_financial_facts",
    time_basis: "latest_available_as_of",
    value
  };
}

function evaluateScreenRow(
  row: CompareSecuritiesRow,
  conditions: ScreenSecuritiesCondition[]
): {
  hit?: ScreenSecuritiesHit;
  rejected: {
    input: string;
    reasons: string[];
    symbol?: string;
  };
} {
  const reasons: string[] = [];
  const matchedConditions: string[] = [];

  if (row.status === "blocked_resolution") {
    reasons.push("security_resolution_required");
  }

  for (const condition of conditions) {
    const actualValue = getScreenFieldValue(row, condition.field);

    if (actualValue === undefined) {
      reasons.push(`${condition.field}:missing_value_excluded`);
      continue;
    }

    if (matchesCondition(actualValue, condition)) {
      const label = `${condition.field}_${condition.operator}_${condition.value}`;
      matchedConditions.push(label);
    } else {
      reasons.push(`${condition.field}:failed_${condition.operator}_${condition.value}`);
    }
  }

  if (reasons.length > 0) {
    return {
      rejected: {
        input: row.input,
        reasons,
        symbol: row.symbol
      }
    };
  }

  return {
    hit: {
      instrument_id: row.instrument_id,
      matched_conditions: matchedConditions,
      rank: 0,
      score: matchedConditions.length,
      source_record_ids: row.source_record_ids,
      symbol: row.symbol,
      why: matchedConditions.map((condition) => `matched:${condition}`)
    },
    rejected: {
      input: row.input,
      reasons: [],
      symbol: row.symbol
    }
  };
}

function getScreenFieldValue(
  row: CompareSecuritiesRow,
  field: ScreenSecuritiesField
): number | undefined {
  return field === "last_price" ? row.quote?.last_price : row.financials[field];
}

function matchesCondition(
  actualValue: number,
  condition: ScreenSecuritiesCondition
): boolean {
  if (condition.operator === "eq") {
    return actualValue === condition.value;
  }

  if (condition.operator === "gte") {
    return actualValue >= condition.value;
  }

  return actualValue <= condition.value;
}

function isScreenField(value: string): value is ScreenSecuritiesField {
  return [
    "assets",
    "equity",
    "last_price",
    "net_income",
    "revenue"
  ].includes(value);
}

function isScreenOperator(value: string): value is ScreenSecuritiesOperator {
  return value === "eq" || value === "gte" || value === "lte";
}

function roundMetric(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
