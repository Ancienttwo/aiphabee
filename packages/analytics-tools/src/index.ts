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

interface ResolvedComparisonSurface {
  facts: GetFinancialFactsResult;
  profile: GetSecurityProfileResult;
  quote: GetQuoteSnapshotResult;
  resolution: ResolveSecurityResult;
}

const DEFAULT_FINANCIAL_FROM = "2023-12-31";
const DEFAULT_FINANCIAL_TO = "2023-12-31";
const REQUIRED_FINANCIAL_METRICS: FinancialFactMetric[] = [
  "revenue",
  "net_income",
  "assets",
  "equity"
];

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
