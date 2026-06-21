import {
  getFinancialFacts,
  type FinancialFactMetric,
  type FinancialFactRow,
  type GetFinancialFactsResult
} from "@aiphabee/financial-facts";
import {
  getPriceHistory,
  getQuoteSnapshot,
  type GetPriceHistoryResult,
  type PriceHistoryRow,
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
export const RETURNS_RISK_VERSION =
  "2026-06-21.phase2.returns-risk-scaffold.v0";
export const PERCENTILE_COMPARISON_VERSION =
  "2026-06-21.phase2.percentile-comparison-scaffold.v0";
export const HIGH_COST_ANALYTICS_QUEUE_VERSION =
  "2026-06-21.phase2.high-cost-analytics-queue-scaffold.v0";
export const EVENT_STUDY_VERSION =
  "2026-06-21.phase3.event-study-scaffold.v0";

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
export type ScreenSecuritiesStatus =
  | "blocked_future_data"
  | "planned_with_preview"
  | "unsupported_query";

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
  classificationAsOf?: string;
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
  point_in_time_guard: {
    classification_as_of: string;
    future_data_policy: "block_future_classification";
    requested_as_of: string;
    security_master_as_of: string;
    status: "blocked_future_data" | "enforced";
    uses_latest_classification: false;
  };
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

export type ReturnsRiskMetricStatus = "blocked" | "computed";
export type ReturnsRiskMetricId =
  | "average_daily_return"
  | "beta"
  | "max_drawdown"
  | "total_return"
  | "volatility_annualized"
  | "volatility_daily";

export interface ReturnsRiskInput {
  adjustment?: string;
  asOf?: string;
  benchmarkInstrumentId?: string;
  benchmarkSecurityQuery?: string;
  from?: string;
  instrumentId?: string;
  requestId: string;
  securityQuery?: string;
  to?: string;
}

export interface ReturnsRiskDefinition {
  formula: string;
  formula_version: typeof RETURNS_RISK_FORMULA_VERSION;
  metric_id: ReturnsRiskMetricId;
  required_inputs: string[];
  tolerance: typeof RETURNS_RISK_TOLERANCE;
  unit: "coefficient" | "ratio";
}

export interface ReturnsRiskMetric {
  blocked_reason?: string;
  formula_version: typeof RETURNS_RISK_FORMULA_VERSION;
  metric_id: ReturnsRiskMetricId;
  source_record_ids: string[];
  status: ReturnsRiskMetricStatus;
  tolerance: typeof RETURNS_RISK_TOLERANCE;
  unit: "coefficient" | "ratio";
  value?: number;
}

export interface ReturnsRiskResult {
  as_of: string;
  benchmark_history_status?: GetPriceHistoryResult["status"];
  benchmark_instrument_id?: string;
  data_version: typeof RETURNS_RISK_VERSION;
  definitions: ReturnsRiskDefinition[];
  frontend_rendering: false;
  instrument_id?: string;
  live_data_access: false;
  methodology_version: typeof RETURNS_RISK_VERSION;
  metrics: ReturnsRiskMetric[];
  price_history_status: GetPriceHistoryResult["status"];
  resolve_benchmark?: ResolveSecurityResult;
  resolve_security?: ResolveSecurityResult;
  status: "blocked_history" | "blocked_resolution" | "computed" | "partial";
  toolName: "calculate_returns_risk";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  window: {
    adjustment: string;
    annualization_factor: typeof RETURNS_RISK_ANNUALIZATION_FACTOR;
    beta_method: "sample_covariance_over_sample_variance";
    from: string;
    max_rows: typeof RETURNS_RISK_LIMIT;
    price_basis: "close";
    return_field: "return";
    row_count: number;
    to: string;
    volatility_method: "sample_standard_deviation";
  };
}

export type EventStudyObservationStatus =
  | "computed"
  | "missing_benchmark_return"
  | "missing_security_and_benchmark_return"
  | "missing_security_return";

export interface EventStudyInput {
  adjustment?: string;
  asOf?: string;
  benchmarkInstrumentId?: string;
  benchmarkSecurityQuery?: string;
  eventDate?: string;
  eventId?: string;
  eventLabel?: string;
  instrumentId?: string;
  requestId: string;
  securityQuery?: string;
  windowPostDays?: number;
  windowPreDays?: number;
}

export interface EventStudyObservation {
  abnormal_return?: number;
  benchmark_return?: number;
  date: string;
  relative_day: number;
  security_return?: number;
  source_record_ids: string[];
  status: EventStudyObservationStatus;
}

export interface EventStudyResult {
  as_of: string;
  benchmark: {
    instrument_id?: string;
    label: string;
    price_history_status: GetPriceHistoryResult["status"];
    resolve_security?: ResolveSecurityResult;
  };
  data_version: typeof EVENT_STUDY_VERSION;
  event: {
    event_date: string;
    event_id: string;
    label: string;
  };
  event_window: {
    from: string;
    post_days: number;
    pre_days: number;
    requested_observation_count: number;
    to: string;
  };
  frontend_rendering: false;
  instrument_id?: string;
  live_data_access: false;
  methodology: {
    abnormal_return_method: "security_return_minus_benchmark_return";
    formula_version: typeof EVENT_STUDY_FORMULA_VERSION;
    point_in_time: true;
    price_field: "return";
    sample_missing_policy: "surface_missing_dates_do_not_drop";
    supported_window: {
      max_post_days: typeof EVENT_STUDY_MAX_POST_DAYS;
      max_pre_days: typeof EVENT_STUDY_MAX_PRE_DAYS;
    };
  };
  methodology_version: typeof EVENT_STUDY_VERSION;
  missing_observations: Array<{
    date: string;
    reason: Exclude<EventStudyObservationStatus, "computed">;
    relative_day: number;
  }>;
  observations: EventStudyObservation[];
  price_history_status: GetPriceHistoryResult["status"];
  resolve_security?: ResolveSecurityResult;
  source_record_ids: string[];
  status: "blocked_history" | "blocked_resolution" | "computed" | "partial";
  summary: {
    computed_observation_count: number;
    cumulative_abnormal_return?: number;
    cumulative_benchmark_return?: number;
    cumulative_security_return?: number;
    missing_observation_count: number;
    requested_observation_count: number;
  };
  toolName: "run_event_study";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

export type PercentileBenchmarkType = "history" | "index" | "peer";
export type PercentileMetricId = "net_margin" | "total_return";
export type PercentileComparisonStatus = "blocked" | "computed";

export interface PercentileComparisonInput {
  asOf?: string;
  benchmarkTypes?: PercentileBenchmarkType[];
  financialFrom?: string;
  financialTo?: string;
  from?: string;
  instrumentId?: string;
  metricId?: PercentileMetricId;
  requestId: string;
  securityQuery?: string;
  to?: string;
}

export interface PercentileSubjectMetric {
  blocked_reason?: string;
  metric_id: PercentileMetricId;
  source_record_ids: string[];
  source_tool: "calculate_returns_risk" | "get_financial_ratios";
  status: PercentileComparisonStatus;
  unit: "ratio";
  value?: number;
}

export interface PercentileBenchmarkComparison {
  as_of: string;
  benchmark_id: string;
  benchmark_type: PercentileBenchmarkType;
  blocked_reason?: string;
  constituent_as_of: string;
  constituents: Array<{
    included_from: string;
    included_to?: string;
    instrument_id: string;
    symbol: string;
  }>;
  distribution: number[];
  history_observations: Array<{
    as_of: string;
    value: number;
  }>;
  label: string;
  live_constituents: false;
  method: "nearest_rank_less_than_or_equal";
  percentile_rank?: number;
  point_in_time: true;
  sample_count: number;
  status: PercentileComparisonStatus;
}

export interface PercentileComparisonResult {
  as_of: string;
  benchmark_types: PercentileBenchmarkType[];
  comparisons: PercentileBenchmarkComparison[];
  data_version: typeof PERCENTILE_COMPARISON_VERSION;
  formula_version: typeof PERCENTILE_COMPARISON_FORMULA_VERSION;
  frontend_rendering: false;
  instrument_id?: string;
  live_data_access: false;
  methodology_version: typeof PERCENTILE_COMPARISON_VERSION;
  metric_id: PercentileMetricId;
  point_in_time_policy: {
    benchmark_as_of: string;
    classification_as_of: string;
    live_constituents: false;
    no_future_constituents: true;
  };
  resolve_security?: ResolveSecurityResult;
  status: "blocked_metric" | "blocked_resolution" | "compared" | "partial";
  subject: PercentileSubjectMetric;
  toolName: "compare_percentiles";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
}

export type HighCostAnalyticsToolName =
  | "compare_securities"
  | "run_event_study"
  | "screen_securities";
export type HighCostAnalyticsPlanStatus =
  | "confirmation_required"
  | "inline_allowed"
  | "queued_planned"
  | "unsupported_tool";

export interface HighCostAnalyticsQueueInput {
  eventCount?: number;
  eventWindowDays?: number;
  metricCount?: number;
  requestId: string;
  securities?: string[];
  toolName?: string;
  universeSize?: number;
  userConfirmed?: boolean;
}

export interface HighCostAnalyticsQueuePlanResult {
  as_of: string;
  cost_estimate: {
    credit_weight: number;
    high_cost_threshold: typeof HIGH_COST_ANALYTICS_THRESHOLD;
    reason_codes: string[];
    rows_estimate: number;
    source: "deterministic_scaffold";
    tool_weight_range?: {
      max: number;
      min: number;
    };
  };
  data_version: typeof HIGH_COST_ANALYTICS_QUEUE_VERSION;
  durable_queue_writes: false;
  enqueue_plan: {
    idempotency_key: string;
    planned_task_id?: string;
    queue_key?: string;
    retry_policy: {
      max_attempts: 2;
      retryable_errors: readonly ["timeout", "rate_limited", "transient_provider_error"];
    };
    status: "awaiting_confirmation" | "not_required" | "unsupported_tool" | "would_enqueue";
  };
  frontend_rendering: false;
  live_data_access: false;
  methodology_version: typeof HIGH_COST_ANALYTICS_QUEUE_VERSION;
  scheduling_decision: {
    analytics_tool_name?: HighCostAnalyticsToolName;
    concurrency_pool: "analytics_high_cost" | "analytics_standard" | "unsupported";
    independent_pool_required: boolean;
    inline_allowed: boolean;
    max_parallel: number;
    ordinary_pool_protected: true;
    queue_name?: "analytics-high-cost";
    queue_required: boolean;
  };
  sql_emitted: false;
  status: HighCostAnalyticsPlanStatus;
  toolName: "plan_high_cost_analytics";
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  usage_policy: {
    failure_refund_required: boolean;
    pre_debit_required: boolean;
    requires_confirmation_before_enqueue: boolean;
    usage_ledger_link_required: true;
    user_confirmed: boolean;
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
const DEFAULT_RETURNS_RISK_ADJUSTMENT = "total_return_adjusted";
const DEFAULT_RETURNS_RISK_FROM = "2026-01-05";
const DEFAULT_RETURNS_RISK_TO = "2026-01-07";
const RETURNS_RISK_ANNUALIZATION_FACTOR = 252;
const RETURNS_RISK_FORMULA_VERSION = "returns-risk-v0";
const RETURNS_RISK_LIMIT = 3;
const RETURNS_RISK_TOLERANCE = 0.000001;
const DEFAULT_EVENT_STUDY_EVENT_DATE = "2026-01-06";
const DEFAULT_EVENT_STUDY_EVENT_ID = "synthetic_00700_results_event";
const DEFAULT_EVENT_STUDY_LABEL = "Synthetic annual results announcement";
const DEFAULT_EVENT_STUDY_PRE_DAYS = 1;
const DEFAULT_EVENT_STUDY_POST_DAYS = 1;
const EVENT_STUDY_FORMULA_VERSION = "event-study-v0";
const EVENT_STUDY_MAX_PRE_DAYS = 2;
const EVENT_STUDY_MAX_POST_DAYS = 1;
const EVENT_STUDY_PRICE_HISTORY_LIMIT = 3;
const DEFAULT_PERCENTILE_BENCHMARK_TYPES: PercentileBenchmarkType[] = [
  "peer",
  "index",
  "history"
];
const DEFAULT_PERCENTILE_METRIC_ID: PercentileMetricId = "net_margin";
const PERCENTILE_COMPARISON_FORMULA_VERSION = "percentile-comparison-v0";
const DEFAULT_SCREEN_UNIVERSE = ["00700.HK", "08001.HK", "00001.HK"];
const FINANCIAL_RATIO_FORMULA_VERSION = "financial-ratios-v0";
const HIGH_COST_ANALYTICS_THRESHOLD = 8;
const HIGH_COST_ANALYTICS_MAX_PARALLEL = 2;
const STANDARD_ANALYTICS_MAX_PARALLEL = 8;
const HIGH_COST_ANALYTICS_QUEUE_ROUTE = "POST /analytics/high-cost/plan";
const HIGH_COST_ANALYTICS_TOOL_WEIGHTS: Record<
  HighCostAnalyticsToolName,
  { max: number; min: number }
> = {
  compare_securities: {
    max: 15,
    min: 5
  },
  run_event_study: {
    max: 50,
    min: 20
  },
  screen_securities: {
    max: 20,
    min: 8
  }
};
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
const RETURNS_RISK_DEFINITIONS: ReturnsRiskDefinition[] = [
  {
    formula: "last_close / first_close - 1",
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: "total_return",
    required_inputs: ["close"],
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: "ratio"
  },
  {
    formula: "sum(daily_return) / count(daily_return)",
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: "average_daily_return",
    required_inputs: ["return"],
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: "ratio"
  },
  {
    formula: "sample_standard_deviation(daily_return)",
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: "volatility_daily",
    required_inputs: ["return"],
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: "ratio"
  },
  {
    formula: "volatility_daily * sqrt(252)",
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: "volatility_annualized",
    required_inputs: ["return"],
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: "ratio"
  },
  {
    formula: "min(drawdown)",
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: "max_drawdown",
    required_inputs: ["drawdown"],
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: "ratio"
  },
  {
    formula: "sample_covariance(security_return, benchmark_return) / sample_variance(benchmark_return)",
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: "beta",
    required_inputs: ["security_return", "benchmark_return"],
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: "coefficient"
  }
];
const SYNTHETIC_PERCENTILE_BENCHMARKS: Record<
  PercentileMetricId,
  Record<
    PercentileBenchmarkType,
    {
      asOf: string;
      benchmarkId: string;
      constituentAsOf: string;
      constituents: PercentileBenchmarkComparison["constituents"];
      distribution: number[];
      historyObservations: PercentileBenchmarkComparison["history_observations"];
      label: string;
    }
  >
> = {
  net_margin: {
    history: {
      asOf: "2026-01-07",
      benchmarkId: "synthetic_00700_history_net_margin_v0",
      constituentAsOf: "2026-01-07",
      constituents: [],
      distribution: [0.11, 0.14, 0.16, 0.189184, 0.21],
      historyObservations: [
        { as_of: "2020-12-31", value: 0.11 },
        { as_of: "2021-12-31", value: 0.14 },
        { as_of: "2022-12-31", value: 0.16 },
        { as_of: "2023-12-31", value: 0.189184 },
        { as_of: "2024-12-31", value: 0.21 }
      ],
      label: "00700.HK Synthetic History"
    },
    index: {
      asOf: "2026-01-07",
      benchmarkId: "synthetic_hstech_net_margin_v0",
      constituentAsOf: "2026-01-07",
      constituents: [
        { included_from: "2020-07-27", instrument_id: "eq_hk_00700", symbol: "00700.HK" },
        { included_from: "2020-07-27", instrument_id: "eq_hk_00001", symbol: "00001.HK" },
        { included_from: "2020-07-27", instrument_id: "eq_hk_08001", symbol: "08001.HK" }
      ],
      distribution: [0.04, 0.09, 0.14, 0.189184, 0.26],
      historyObservations: [],
      label: "Synthetic Hang Seng Tech Index"
    },
    peer: {
      asOf: "2026-01-07",
      benchmarkId: "synthetic_hk_internet_peer_net_margin_v0",
      constituentAsOf: "2026-01-07",
      constituents: [
        { included_from: "2020-01-01", instrument_id: "eq_hk_00700", symbol: "00700.HK" },
        { included_from: "2020-01-01", instrument_id: "eq_hk_00001", symbol: "00001.HK" },
        { included_from: "2020-01-01", instrument_id: "eq_hk_08001", symbol: "08001.HK" }
      ],
      distribution: [0.03, 0.08, 0.12, 0.189184, 0.24],
      historyObservations: [],
      label: "Synthetic HK Internet Peer Set"
    }
  },
  total_return: {
    history: {
      asOf: "2026-01-07",
      benchmarkId: "synthetic_00700_history_total_return_v0",
      constituentAsOf: "2026-01-07",
      constituents: [],
      distribution: [-0.02, 0.004, 0.012195, 0.03, 0.055],
      historyObservations: [
        { as_of: "2025-12-29", value: -0.02 },
        { as_of: "2025-12-30", value: 0.004 },
        { as_of: "2026-01-07", value: 0.012195 },
        { as_of: "2026-01-08", value: 0.03 },
        { as_of: "2026-01-09", value: 0.055 }
      ],
      label: "00700.HK Synthetic Return History"
    },
    index: {
      asOf: "2026-01-07",
      benchmarkId: "synthetic_hstech_total_return_v0",
      constituentAsOf: "2026-01-07",
      constituents: [
        { included_from: "2020-07-27", instrument_id: "eq_hk_00700", symbol: "00700.HK" },
        { included_from: "2020-07-27", instrument_id: "eq_hk_00001", symbol: "00001.HK" },
        { included_from: "2020-07-27", instrument_id: "eq_hk_08001", symbol: "08001.HK" }
      ],
      distribution: [-0.01, 0.003, 0.012195, 0.02, 0.04],
      historyObservations: [],
      label: "Synthetic Hang Seng Tech Index"
    },
    peer: {
      asOf: "2026-01-07",
      benchmarkId: "synthetic_hk_internet_peer_total_return_v0",
      constituentAsOf: "2026-01-07",
      constituents: [
        { included_from: "2020-01-01", instrument_id: "eq_hk_00700", symbol: "00700.HK" },
        { included_from: "2020-01-01", instrument_id: "eq_hk_00001", symbol: "00001.HK" },
        { included_from: "2020-01-01", instrument_id: "eq_hk_08001", symbol: "08001.HK" }
      ],
      distribution: [-0.015, 0.002, 0.012195, 0.018, 0.035],
      historyObservations: [],
      label: "Synthetic HK Internet Peer Set"
    }
  }
};

export function getCompareSecuritiesCapabilities() {
  return {
    allow_fx_conversion_without_rate: false,
    frontend_rendering: false,
    high_cost_queueing: true,
    high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
    live_data_access: false,
    max_securities: 5,
    metrics: REQUIRED_FINANCIAL_METRICS,
    min_securities: 2,
    package: "@aiphabee/analytics-tools" as const,
    queue_route: HIGH_COST_ANALYTICS_QUEUE_ROUTE,
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
    high_cost_queueing: true,
    high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
    live_data_access: false,
    package: "@aiphabee/analytics-tools" as const,
    preview_execution: true,
    point_in_time_guard: true,
    prevents_future_classification: true,
    queue_route: HIGH_COST_ANALYTICS_QUEUE_ROUTE,
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

export function getReturnsRiskCapabilities() {
  return {
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    frontend_rendering: false,
    golden_tolerance: RETURNS_RISK_TOLERANCE,
    live_data_access: false,
    package: "@aiphabee/analytics-tools" as const,
    point_in_time: true,
    price_history_fields: ["close", "return", "drawdown"] as const,
    requires_benchmark_for_beta: true,
    route: "POST /analytics/returns-risk" as const,
    status: "returns_risk_scaffold" as const,
    supported_metrics: RETURNS_RISK_DEFINITIONS.map((definition) => definition.metric_id),
    tool_name: "calculate_returns_risk" as const,
    version: RETURNS_RISK_VERSION
  };
}

export function getEventStudyCapabilities() {
  return {
    abnormal_return_method: "security_return_minus_benchmark_return" as const,
    formula_version: EVENT_STUDY_FORMULA_VERSION,
    frontend_rendering: false,
    high_cost_queueing: true,
    high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
    live_data_access: false,
    max_post_days: EVENT_STUDY_MAX_POST_DAYS,
    max_pre_days: EVENT_STUDY_MAX_PRE_DAYS,
    package: "@aiphabee/analytics-tools" as const,
    price_history_fields: ["return"] as const,
    queue_route: HIGH_COST_ANALYTICS_QUEUE_ROUTE,
    route: "POST /analytics/event-study" as const,
    sample_missing_policy: "surface_missing_dates_do_not_drop" as const,
    status: "event_study_scaffold" as const,
    tool_name: "run_event_study" as const,
    version: EVENT_STUDY_VERSION
  };
}

export function getPercentileComparisonCapabilities() {
  return {
    benchmark_types: DEFAULT_PERCENTILE_BENCHMARK_TYPES,
    formula_version: PERCENTILE_COMPARISON_FORMULA_VERSION,
    frontend_rendering: false,
    live_constituents: false,
    live_data_access: false,
    package: "@aiphabee/analytics-tools" as const,
    point_in_time: true,
    route: "POST /analytics/percentile-comparison" as const,
    status: "percentile_comparison_scaffold" as const,
    supported_metrics: Object.keys(SYNTHETIC_PERCENTILE_BENCHMARKS) as PercentileMetricId[],
    tool_name: "compare_percentiles" as const,
    version: PERCENTILE_COMPARISON_VERSION
  };
}

export function getHighCostAnalyticsQueueCapabilities() {
  return {
    durable_queue_writes: false,
    frontend_rendering: false,
    high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
    independent_concurrency_pool: true,
    live_data_access: false,
    max_parallel_high_cost: HIGH_COST_ANALYTICS_MAX_PARALLEL,
    ordinary_pool_protected: true,
    package: "@aiphabee/analytics-tools" as const,
    queue_name: "analytics-high-cost" as const,
    route: HIGH_COST_ANALYTICS_QUEUE_ROUTE,
    status: "high_cost_analytics_queue_scaffold" as const,
    supported_tools: ["screen_securities", "compare_securities", "run_event_study"] as const,
    tool_name: "plan_high_cost_analytics" as const,
    usage_policy: {
      failure_refund_required: true,
      pre_debit_required: true,
      requires_confirmation_before_enqueue: true,
      usage_ledger_link_required: true
    },
    version: HIGH_COST_ANALYTICS_QUEUE_VERSION
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

export function planHighCostAnalyticsQueue(
  input: HighCostAnalyticsQueueInput
): HighCostAnalyticsQueuePlanResult {
  const asOf = "2026-01-07T16:15:00+08:00";
  const analyticsToolName = normalizeHighCostAnalyticsToolName(input.toolName);
  const idempotencyKey = createAnalyticsQueueIdempotencyKey(input.requestId, input.toolName);

  if (analyticsToolName === undefined) {
    return {
      as_of: asOf,
      cost_estimate: {
        credit_weight: 0,
        high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
        reason_codes: ["unsupported_analytics_tool"],
        rows_estimate: 0,
        source: "deterministic_scaffold"
      },
      data_version: HIGH_COST_ANALYTICS_QUEUE_VERSION,
      durable_queue_writes: false,
      enqueue_plan: {
        idempotency_key: idempotencyKey,
        retry_policy: createHighCostAnalyticsRetryPolicy(),
        status: "unsupported_tool"
      },
      frontend_rendering: false,
      live_data_access: false,
      methodology_version: HIGH_COST_ANALYTICS_QUEUE_VERSION,
      scheduling_decision: {
        concurrency_pool: "unsupported",
        independent_pool_required: false,
        inline_allowed: false,
        max_parallel: 0,
        ordinary_pool_protected: true,
        queue_required: false
      },
      sql_emitted: false,
      status: "unsupported_tool",
      toolName: "plan_high_cost_analytics",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      },
      usage_policy: createHighCostAnalyticsUsagePolicy(input.userConfirmed)
    };
  }

  const costEstimate = estimateHighCostAnalyticsCost(analyticsToolName, input);
  const queueRequired = costEstimate.credit_weight >= HIGH_COST_ANALYTICS_THRESHOLD;
  const userConfirmed = input.userConfirmed === true;
  const status: HighCostAnalyticsPlanStatus = queueRequired
    ? userConfirmed
      ? "queued_planned"
      : "confirmation_required"
    : "inline_allowed";

  return {
    as_of: asOf,
    cost_estimate: costEstimate,
    data_version: HIGH_COST_ANALYTICS_QUEUE_VERSION,
    durable_queue_writes: false,
    enqueue_plan: createHighCostAnalyticsEnqueuePlan({
      analyticsToolName,
      idempotencyKey,
      queueRequired,
      status,
      userConfirmed
    }),
    frontend_rendering: false,
    live_data_access: false,
    methodology_version: HIGH_COST_ANALYTICS_QUEUE_VERSION,
    scheduling_decision: {
      analytics_tool_name: analyticsToolName,
      concurrency_pool: queueRequired ? "analytics_high_cost" : "analytics_standard",
      independent_pool_required: queueRequired,
      inline_allowed: !queueRequired,
      max_parallel: queueRequired
        ? HIGH_COST_ANALYTICS_MAX_PARALLEL
        : STANDARD_ANALYTICS_MAX_PARALLEL,
      ordinary_pool_protected: true,
      queue_name: queueRequired ? "analytics-high-cost" : undefined,
      queue_required: queueRequired
    },
    sql_emitted: false,
    status,
    toolName: "plan_high_cost_analytics",
    usage: {
      cached: false,
      credits: 0,
      rows: 1
    },
    usage_policy: createHighCostAnalyticsUsagePolicy(input.userConfirmed)
  };
}

export function screenSecurities(input: ScreenSecuritiesInput): ScreenSecuritiesResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const pointInTimeGuard = createScreenPointInTimeGuard(asOf, input.classificationAsOf);
  const naturalLanguage = input.naturalLanguage?.trim();
  const parsedConditions = normalizeScreenConditions(
    input.conditions,
    naturalLanguage
  );

  if (pointInTimeGuard.status === "blocked_future_data") {
    return {
      as_of: asOf,
      data_version: SCREEN_SECURITIES_VERSION,
      editable_before_execution: true,
      execution_preview: {
        hit_count: 0,
        hits: [],
        ranking_method: "matched_condition_count_then_symbol",
        rejected_count: 0,
        rejected_rows: [],
        universe_size: 0
      },
      frontend_rendering: false,
      live_data_access: false,
      methodology_version: SCREEN_SECURITIES_VERSION,
      natural_language: naturalLanguage,
      parsed_conditions: parsedConditions,
      point_in_time_guard: pointInTimeGuard,
      requires_confirmation_before_live_execution: true,
      status: "blocked_future_data",
      toolName: "screen_securities",
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      }
    };
  }

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
      point_in_time_guard: pointInTimeGuard,
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
    point_in_time_guard: pointInTimeGuard,
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

export function calculateReturnsRisk(input: ReturnsRiskInput): ReturnsRiskResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const from = input.from ?? DEFAULT_RETURNS_RISK_FROM;
  const to = input.to ?? DEFAULT_RETURNS_RISK_TO;
  const adjustment = input.adjustment ?? DEFAULT_RETURNS_RISK_ADJUSTMENT;
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;
  const benchmarkResolution =
    input.benchmarkInstrumentId === undefined && input.benchmarkSecurityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.benchmarkSecurityQuery
        })
      : undefined;
  const benchmarkInstrumentId =
    input.benchmarkInstrumentId ?? benchmarkResolution?.selectedInstrumentId;

  if (instrumentId === undefined) {
    return createReturnsRiskResult({
      asOf,
      benchmarkInstrumentId,
      benchmarkResolution,
      benchmarkStatus: undefined,
      history: undefined,
      instrumentId,
      metrics: createBlockedReturnsRiskMetrics("security_resolution_required", []),
      priceHistoryStatus: "not_found",
      resolution,
      status: "blocked_resolution",
      usageCredits: (resolution?.usage.credits ?? 0) + (benchmarkResolution?.usage.credits ?? 0),
      usageRows: (resolution?.usage.rows ?? 0) + (benchmarkResolution?.usage.rows ?? 0),
      window: createReturnsRiskWindow(from, to, adjustment, 0)
    });
  }

  const history = getPriceHistory({
    adjustment,
    fields: ["close", "return", "drawdown"],
    from,
    instrumentId,
    limit: RETURNS_RISK_LIMIT,
    to
  });
  const sourceRecordIds = createPriceHistorySourceRecordIds(history);

  if (history.status !== "found" || history.history === undefined) {
    return createReturnsRiskResult({
      asOf,
      benchmarkInstrumentId,
      benchmarkResolution,
      benchmarkStatus: undefined,
      history,
      instrumentId,
      metrics: createBlockedReturnsRiskMetrics(`price_history_${history.status}`, sourceRecordIds),
      priceHistoryStatus: history.status,
      resolution,
      status: "blocked_history",
      usageCredits:
        history.usage.credits + (resolution?.usage.credits ?? 0) + (benchmarkResolution?.usage.credits ?? 0),
      usageRows:
        history.usage.rows + (resolution?.usage.rows ?? 0) + (benchmarkResolution?.usage.rows ?? 0),
      window: createReturnsRiskWindow(from, to, adjustment, history.history?.rowCount ?? 0)
    });
  }

  const baseMetrics = createReturnsRiskBaseMetrics(history.history.rows, sourceRecordIds);
  let benchmarkHistory: GetPriceHistoryResult | undefined;
  let betaMetric: ReturnsRiskMetric;

  if (benchmarkInstrumentId === undefined) {
    betaMetric = createBlockedReturnsRiskMetric(
      "beta",
      "benchmark_required",
      sourceRecordIds
    );
  } else {
    benchmarkHistory = getPriceHistory({
      adjustment,
      fields: ["return"],
      from,
      instrumentId: benchmarkInstrumentId,
      limit: RETURNS_RISK_LIMIT,
      to
    });
    const benchmarkSourceRecordIds = createPriceHistorySourceRecordIds(benchmarkHistory);
    const betaSourceRecordIds = Array.from(
      new Set([...sourceRecordIds, ...benchmarkSourceRecordIds])
    ).sort();

    betaMetric =
      benchmarkHistory.status === "found" && benchmarkHistory.history !== undefined
        ? createBetaMetric(history.history.rows, benchmarkHistory.history.rows, betaSourceRecordIds)
        : createBlockedReturnsRiskMetric(
            "beta",
            `benchmark_history_${benchmarkHistory.status}`,
            betaSourceRecordIds
          );
  }

  const metrics = [...baseMetrics, betaMetric];
  const computedCount = metrics.filter((metric) => metric.status === "computed").length;

  return createReturnsRiskResult({
    asOf,
    benchmarkInstrumentId,
    benchmarkResolution,
    benchmarkStatus: benchmarkHistory?.status,
    history,
    instrumentId,
    metrics,
    priceHistoryStatus: history.status,
    resolution,
    status: computedCount === metrics.length ? "computed" : "partial",
    usageCredits:
      history.usage.credits +
      (benchmarkHistory?.usage.credits ?? 0) +
      (resolution?.usage.credits ?? 0) +
      (benchmarkResolution?.usage.credits ?? 0) +
      (computedCount > 0 ? 1 : 0),
    usageRows:
      history.usage.rows +
      (benchmarkHistory?.usage.rows ?? 0) +
      (resolution?.usage.rows ?? 0) +
      (benchmarkResolution?.usage.rows ?? 0) +
      metrics.length,
    window: createReturnsRiskWindow(from, to, adjustment, history.history.rowCount)
  });
}

export function runEventStudy(input: EventStudyInput): EventStudyResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const eventDate = normalizeEventStudyDate(input.eventDate, DEFAULT_EVENT_STUDY_EVENT_DATE);
  const preDays = clampInteger(
    input.windowPreDays,
    DEFAULT_EVENT_STUDY_PRE_DAYS,
    0,
    EVENT_STUDY_MAX_PRE_DAYS
  );
  const postDays = clampInteger(
    input.windowPostDays,
    DEFAULT_EVENT_STUDY_POST_DAYS,
    0,
    EVENT_STUDY_MAX_POST_DAYS
  );
  const window = createEventStudyWindow(eventDate, preDays, postDays);
  const adjustment = input.adjustment ?? DEFAULT_RETURNS_RISK_ADJUSTMENT;
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;
  const benchmarkResolution =
    input.benchmarkInstrumentId === undefined && input.benchmarkSecurityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.benchmarkSecurityQuery
        })
      : undefined;
  const benchmarkInstrumentId =
    input.benchmarkInstrumentId ??
    benchmarkResolution?.selectedInstrumentId ??
    (input.benchmarkSecurityQuery === undefined ? instrumentId : undefined);

  if (instrumentId === undefined || benchmarkInstrumentId === undefined) {
    return createEventStudyResult({
      asOf,
      benchmarkInstrumentId,
      benchmarkResolution,
      benchmarkStatus: "not_found",
      eventDate,
      eventId: input.eventId,
      eventLabel: input.eventLabel,
      instrumentId,
      observations: [],
      priceHistoryStatus: "not_found",
      resolution,
      sourceRecordIds: [],
      status: "blocked_resolution",
      usageCredits: (resolution?.usage.credits ?? 0) + (benchmarkResolution?.usage.credits ?? 0),
      usageRows: (resolution?.usage.rows ?? 0) + (benchmarkResolution?.usage.rows ?? 0),
      window
    });
  }

  const securityHistory = getPriceHistory({
    adjustment,
    fields: ["return"],
    from: window.from,
    instrumentId,
    limit: EVENT_STUDY_PRICE_HISTORY_LIMIT,
    to: window.to
  });
  const benchmarkHistory = getPriceHistory({
    adjustment,
    fields: ["return"],
    from: window.from,
    instrumentId: benchmarkInstrumentId,
    limit: EVENT_STUDY_PRICE_HISTORY_LIMIT,
    to: window.to
  });
  const sourceRecordIds = Array.from(
    new Set([
      ...createPriceHistorySourceRecordIds(securityHistory),
      ...createPriceHistorySourceRecordIds(benchmarkHistory)
    ])
  ).sort();

  if (securityHistory.status !== "found" || securityHistory.history === undefined) {
    return createEventStudyResult({
      asOf,
      benchmarkInstrumentId,
      benchmarkResolution,
      benchmarkStatus: benchmarkHistory.status,
      eventDate,
      eventId: input.eventId,
      eventLabel: input.eventLabel,
      instrumentId,
      observations: createMissingEventStudyObservations(
        window.requestedDates,
        eventDate,
        "missing_security_return",
        sourceRecordIds
      ),
      priceHistoryStatus: securityHistory.status,
      resolution,
      sourceRecordIds,
      status: "blocked_history",
      usageCredits:
        securityHistory.usage.credits +
        benchmarkHistory.usage.credits +
        (resolution?.usage.credits ?? 0) +
        (benchmarkResolution?.usage.credits ?? 0),
      usageRows:
        securityHistory.usage.rows +
        benchmarkHistory.usage.rows +
        (resolution?.usage.rows ?? 0) +
        (benchmarkResolution?.usage.rows ?? 0),
      window
    });
  }

  const observations = createEventStudyObservations({
    benchmarkRows: benchmarkHistory.history?.rows ?? [],
    eventDate,
    requestedDates: window.requestedDates,
    securityRows: securityHistory.history.rows,
    sourceRecordIds
  });
  const computedCount = observations.filter((observation) => observation.status === "computed").length;

  return createEventStudyResult({
    asOf,
    benchmarkInstrumentId,
    benchmarkResolution,
    benchmarkStatus: benchmarkHistory.status,
    eventDate,
    eventId: input.eventId,
    eventLabel: input.eventLabel,
    instrumentId,
    observations,
    priceHistoryStatus: securityHistory.status,
    resolution,
    sourceRecordIds,
    status: computedCount === observations.length ? "computed" : "partial",
    usageCredits:
      securityHistory.usage.credits +
      benchmarkHistory.usage.credits +
      (resolution?.usage.credits ?? 0) +
      (benchmarkResolution?.usage.credits ?? 0) +
      20,
    usageRows:
      securityHistory.usage.rows +
      benchmarkHistory.usage.rows +
      (resolution?.usage.rows ?? 0) +
      (benchmarkResolution?.usage.rows ?? 0) +
      observations.length,
    window
  });
}

export function comparePercentiles(input: PercentileComparisonInput): PercentileComparisonResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const benchmarkAsOf = asOf.slice(0, 10);
  const metricId = input.metricId ?? DEFAULT_PERCENTILE_METRIC_ID;
  const benchmarkTypes =
    input.benchmarkTypes === undefined || input.benchmarkTypes.length === 0
      ? DEFAULT_PERCENTILE_BENCHMARK_TYPES
      : input.benchmarkTypes;
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;

  if (instrumentId === undefined) {
    const subject = createBlockedPercentileSubject(
      metricId,
      getPercentileSubjectSourceTool(metricId),
      "security_resolution_required",
      []
    );

    return createPercentileComparisonResult({
      asOf,
      benchmarkAsOf,
      benchmarkTypes,
      comparisons: benchmarkTypes.map((type) =>
        createBlockedPercentileBenchmark(
          metricId,
          type,
          "security_resolution_required"
        )
      ),
      instrumentId,
      metricId,
      resolution,
      status: "blocked_resolution",
      subject,
      usageCredits: resolution?.usage.credits ?? 0,
      usageRows: resolution?.usage.rows ?? 0
    });
  }

  const subjectResult = createPercentileSubjectMetric(metricId, input, instrumentId);
  const comparisons = benchmarkTypes.map((type) =>
    subjectResult.subject.status === "computed" && subjectResult.subject.value !== undefined
      ? createPercentileBenchmark(metricId, type, subjectResult.subject.value)
      : createBlockedPercentileBenchmark(
          metricId,
          type,
          subjectResult.subject.blocked_reason ?? "metric_unavailable"
        )
  );
  const computedCount = comparisons.filter((comparison) => comparison.status === "computed").length;

  return createPercentileComparisonResult({
    asOf,
    benchmarkAsOf,
    benchmarkTypes,
    comparisons,
    instrumentId,
    metricId,
    resolution,
    status:
      subjectResult.subject.status === "blocked"
        ? "blocked_metric"
        : computedCount === comparisons.length
          ? "compared"
          : "partial",
    subject: subjectResult.subject,
    usageCredits: subjectResult.usage.credits + (resolution?.usage.credits ?? 0) + (computedCount > 0 ? 1 : 0),
    usageRows: subjectResult.usage.rows + (resolution?.usage.rows ?? 0) + comparisons.length
  });
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

function createReturnsRiskResult(params: {
  asOf: string;
  benchmarkInstrumentId: string | undefined;
  benchmarkResolution: ResolveSecurityResult | undefined;
  benchmarkStatus: GetPriceHistoryResult["status"] | undefined;
  history: GetPriceHistoryResult | undefined;
  instrumentId: string | undefined;
  metrics: ReturnsRiskMetric[];
  priceHistoryStatus: GetPriceHistoryResult["status"];
  resolution: ResolveSecurityResult | undefined;
  status: ReturnsRiskResult["status"];
  usageCredits: number;
  usageRows: number;
  window: ReturnsRiskResult["window"];
}): ReturnsRiskResult {
  return {
    as_of: params.asOf,
    benchmark_history_status: params.benchmarkStatus,
    benchmark_instrument_id: params.benchmarkInstrumentId,
    data_version: RETURNS_RISK_VERSION,
    definitions: RETURNS_RISK_DEFINITIONS,
    frontend_rendering: false,
    instrument_id: params.instrumentId,
    live_data_access: false,
    methodology_version: RETURNS_RISK_VERSION,
    metrics: params.metrics,
    price_history_status: params.priceHistoryStatus,
    resolve_benchmark: params.benchmarkResolution,
    resolve_security: params.resolution,
    status: params.status,
    toolName: "calculate_returns_risk",
    usage: {
      cached: false,
      credits: params.usageCredits,
      rows: params.usageRows
    },
    window: params.window
  };
}

function createReturnsRiskWindow(
  from: string,
  to: string,
  adjustment: string,
  rowCount: number
): ReturnsRiskResult["window"] {
  return {
    adjustment,
    annualization_factor: RETURNS_RISK_ANNUALIZATION_FACTOR,
    beta_method: "sample_covariance_over_sample_variance",
    from,
    max_rows: RETURNS_RISK_LIMIT,
    price_basis: "close",
    return_field: "return",
    row_count: rowCount,
    to,
    volatility_method: "sample_standard_deviation"
  };
}

function createReturnsRiskBaseMetrics(
  rows: PriceHistoryRow[],
  sourceRecordIds: string[]
): ReturnsRiskMetric[] {
  const sortedRows = [...rows].sort((left, right) => left.date.localeCompare(right.date));
  const returns = sortedRows
    .map((row) => getFiniteHistoryField(row, "return"))
    .filter((value): value is number => value !== undefined);
  const drawdowns = sortedRows
    .map((row) => getFiniteHistoryField(row, "drawdown"))
    .filter((value): value is number => value !== undefined);
  const firstClose = getFiniteHistoryField(sortedRows[0], "close");
  const lastClose = getFiniteHistoryField(sortedRows[sortedRows.length - 1], "close");
  const volatilityDaily = sampleStandardDeviation(returns);

  return [
    firstClose === undefined || lastClose === undefined || firstClose === 0
      ? createBlockedReturnsRiskMetric("total_return", "missing_close", sourceRecordIds)
      : createComputedReturnsRiskMetric(
          "total_return",
          lastClose / firstClose - 1,
          sourceRecordIds
        ),
    returns.length === 0
      ? createBlockedReturnsRiskMetric("average_daily_return", "missing_return", sourceRecordIds)
      : createComputedReturnsRiskMetric("average_daily_return", average(returns), sourceRecordIds),
    volatilityDaily === undefined
      ? createBlockedReturnsRiskMetric(
          "volatility_daily",
          "insufficient_return_observations",
          sourceRecordIds
        )
      : createComputedReturnsRiskMetric("volatility_daily", volatilityDaily, sourceRecordIds),
    volatilityDaily === undefined
      ? createBlockedReturnsRiskMetric(
          "volatility_annualized",
          "insufficient_return_observations",
          sourceRecordIds
        )
      : createComputedReturnsRiskMetric(
          "volatility_annualized",
          volatilityDaily * Math.sqrt(RETURNS_RISK_ANNUALIZATION_FACTOR),
          sourceRecordIds
        ),
    drawdowns.length === 0
      ? createBlockedReturnsRiskMetric("max_drawdown", "missing_drawdown", sourceRecordIds)
      : createComputedReturnsRiskMetric("max_drawdown", Math.min(...drawdowns), sourceRecordIds)
  ];
}

function createBetaMetric(
  securityRows: PriceHistoryRow[],
  benchmarkRows: PriceHistoryRow[],
  sourceRecordIds: string[]
): ReturnsRiskMetric {
  const securityReturnsByDate = new Map(
    securityRows
      .map((row) => [row.date, getFiniteHistoryField(row, "return")] as const)
      .filter((entry): entry is readonly [string, number] => entry[1] !== undefined)
  );
  const pairs = benchmarkRows.flatMap((row) => {
    const securityReturn = securityReturnsByDate.get(row.date);
    const benchmarkReturn = getFiniteHistoryField(row, "return");

    return securityReturn === undefined || benchmarkReturn === undefined
      ? []
      : [{ benchmarkReturn, securityReturn }];
  });

  if (pairs.length < 2) {
    return createBlockedReturnsRiskMetric("beta", "insufficient_overlap", sourceRecordIds);
  }

  const securityReturns = pairs.map((pair) => pair.securityReturn);
  const benchmarkReturns = pairs.map((pair) => pair.benchmarkReturn);
  const benchmarkVariance = sampleVariance(benchmarkReturns);

  if (benchmarkVariance === undefined) {
    return createBlockedReturnsRiskMetric("beta", "insufficient_overlap", sourceRecordIds);
  }

  if (benchmarkVariance === 0) {
    return createBlockedReturnsRiskMetric("beta", "zero_benchmark_variance", sourceRecordIds);
  }

  return createComputedReturnsRiskMetric(
    "beta",
    sampleCovariance(securityReturns, benchmarkReturns) / benchmarkVariance,
    sourceRecordIds
  );
}

function createComputedReturnsRiskMetric(
  metricId: ReturnsRiskMetricId,
  value: number,
  sourceRecordIds: string[]
): ReturnsRiskMetric {
  const definition = getReturnsRiskDefinition(metricId);

  return {
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: metricId,
    source_record_ids: sourceRecordIds,
    status: "computed",
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: definition.unit,
    value: roundMetric(value)
  };
}

function createBlockedReturnsRiskMetrics(
  blockedReason: string,
  sourceRecordIds: string[]
): ReturnsRiskMetric[] {
  return RETURNS_RISK_DEFINITIONS.map((definition) =>
    createBlockedReturnsRiskMetric(definition.metric_id, blockedReason, sourceRecordIds)
  );
}

function createBlockedReturnsRiskMetric(
  metricId: ReturnsRiskMetricId,
  blockedReason: string,
  sourceRecordIds: string[]
): ReturnsRiskMetric {
  const definition = getReturnsRiskDefinition(metricId);

  return {
    blocked_reason: blockedReason,
    formula_version: RETURNS_RISK_FORMULA_VERSION,
    metric_id: metricId,
    source_record_ids: sourceRecordIds,
    status: "blocked",
    tolerance: RETURNS_RISK_TOLERANCE,
    unit: definition.unit
  };
}

function getReturnsRiskDefinition(metricId: ReturnsRiskMetricId): ReturnsRiskDefinition {
  const definition = RETURNS_RISK_DEFINITIONS.find((candidate) => candidate.metric_id === metricId);

  if (definition === undefined) {
    throw new Error(`Unknown returns/risk metric ${metricId}`);
  }

  return definition;
}

function getFiniteHistoryField(
  row: PriceHistoryRow | undefined,
  field: "close" | "drawdown" | "return"
): number | undefined {
  const value = row?.fields[field];
  return Number.isFinite(value) ? value : undefined;
}

function createPriceHistorySourceRecordIds(history: GetPriceHistoryResult): string[] {
  return history.provenance.map((item) => item.source_record_id).sort();
}

function createEventStudyResult(params: {
  asOf: string;
  benchmarkInstrumentId: string | undefined;
  benchmarkResolution: ResolveSecurityResult | undefined;
  benchmarkStatus: GetPriceHistoryResult["status"];
  eventDate: string;
  eventId: string | undefined;
  eventLabel: string | undefined;
  instrumentId: string | undefined;
  observations: EventStudyObservation[];
  priceHistoryStatus: GetPriceHistoryResult["status"];
  resolution: ResolveSecurityResult | undefined;
  sourceRecordIds: string[];
  status: EventStudyResult["status"];
  usageCredits: number;
  usageRows: number;
  window: {
    from: string;
    postDays: number;
    preDays: number;
    requestedDates: string[];
    to: string;
  };
}): EventStudyResult {
  const missingObservations = params.observations
    .filter(
      (
        observation
      ): observation is EventStudyObservation & {
        status: Exclude<EventStudyObservationStatus, "computed">;
      } => observation.status !== "computed"
    )
    .map((observation) => ({
      date: observation.date,
      reason: observation.status,
      relative_day: observation.relative_day
    }));
  const computedObservations = params.observations.filter(
    (observation) => observation.status === "computed"
  );

  return {
    as_of: params.asOf,
    benchmark: {
      instrument_id: params.benchmarkInstrumentId,
      label:
        params.benchmarkResolution === undefined
          ? "default_self_proxy"
          : "resolved_security_benchmark",
      price_history_status: params.benchmarkStatus,
      resolve_security: params.benchmarkResolution
    },
    data_version: EVENT_STUDY_VERSION,
    event: {
      event_date: params.eventDate,
      event_id: params.eventId ?? DEFAULT_EVENT_STUDY_EVENT_ID,
      label: params.eventLabel ?? DEFAULT_EVENT_STUDY_LABEL
    },
    event_window: {
      from: params.window.from,
      post_days: params.window.postDays,
      pre_days: params.window.preDays,
      requested_observation_count: params.window.requestedDates.length,
      to: params.window.to
    },
    frontend_rendering: false,
    instrument_id: params.instrumentId,
    live_data_access: false,
    methodology: {
      abnormal_return_method: "security_return_minus_benchmark_return",
      formula_version: EVENT_STUDY_FORMULA_VERSION,
      point_in_time: true,
      price_field: "return",
      sample_missing_policy: "surface_missing_dates_do_not_drop",
      supported_window: {
        max_post_days: EVENT_STUDY_MAX_POST_DAYS,
        max_pre_days: EVENT_STUDY_MAX_PRE_DAYS
      }
    },
    methodology_version: EVENT_STUDY_VERSION,
    missing_observations: missingObservations,
    observations: params.observations,
    price_history_status: params.priceHistoryStatus,
    resolve_security: params.resolution,
    source_record_ids: params.sourceRecordIds,
    status: params.status,
    summary: {
      computed_observation_count: computedObservations.length,
      cumulative_abnormal_return:
        computedObservations.length === 0
          ? undefined
          : roundMetric(
              computedObservations.reduce(
                (sum, observation) => sum + (observation.abnormal_return ?? 0),
                0
              )
            ),
      cumulative_benchmark_return: cumulativeReturn(
        computedObservations.map((observation) => observation.benchmark_return)
      ),
      cumulative_security_return: cumulativeReturn(
        computedObservations.map((observation) => observation.security_return)
      ),
      missing_observation_count: missingObservations.length,
      requested_observation_count: params.window.requestedDates.length
    },
    toolName: "run_event_study",
    usage: {
      cached: false,
      credits: params.usageCredits,
      rows: params.usageRows
    }
  };
}

function createEventStudyWindow(
  eventDate: string,
  preDays: number,
  postDays: number
): {
  from: string;
  postDays: number;
  preDays: number;
  requestedDates: string[];
  to: string;
} {
  const from = addIsoDays(eventDate, -preDays);
  const to = addIsoDays(eventDate, postDays);

  return {
    from,
    postDays,
    preDays,
    requestedDates: createIsoDateRange(from, to),
    to
  };
}

function createEventStudyObservations(input: {
  benchmarkRows: PriceHistoryRow[];
  eventDate: string;
  requestedDates: string[];
  securityRows: PriceHistoryRow[];
  sourceRecordIds: string[];
}): EventStudyObservation[] {
  const securityReturnsByDate = createReturnMap(input.securityRows);
  const benchmarkReturnsByDate = createReturnMap(input.benchmarkRows);

  return input.requestedDates.map((date) => {
    const securityReturn = securityReturnsByDate.get(date);
    const benchmarkReturn = benchmarkReturnsByDate.get(date);
    const status = getEventStudyObservationStatus(securityReturn, benchmarkReturn);

    return {
      abnormal_return:
        securityReturn === undefined || benchmarkReturn === undefined
          ? undefined
          : roundMetric(securityReturn - benchmarkReturn),
      benchmark_return: benchmarkReturn,
      date,
      relative_day: diffIsoDays(date, input.eventDate),
      security_return: securityReturn,
      source_record_ids: input.sourceRecordIds,
      status
    };
  });
}

function createMissingEventStudyObservations(
  requestedDates: string[],
  eventDate: string,
  reason: Exclude<EventStudyObservationStatus, "computed">,
  sourceRecordIds: string[]
): EventStudyObservation[] {
  return requestedDates.map((date) => ({
    date,
    relative_day: diffIsoDays(date, eventDate),
    source_record_ids: sourceRecordIds,
    status: reason
  }));
}

function createReturnMap(rows: PriceHistoryRow[]): Map<string, number> {
  return new Map(
    rows.flatMap((row) => {
      const value = getFiniteHistoryField(row, "return");
      return value === undefined ? [] : [[row.date, value] as const];
    })
  );
}

function getEventStudyObservationStatus(
  securityReturn: number | undefined,
  benchmarkReturn: number | undefined
): EventStudyObservationStatus {
  if (securityReturn !== undefined && benchmarkReturn !== undefined) {
    return "computed";
  }

  if (securityReturn === undefined && benchmarkReturn === undefined) {
    return "missing_security_and_benchmark_return";
  }

  return securityReturn === undefined ? "missing_security_return" : "missing_benchmark_return";
}

function normalizeEventStudyDate(value: string | undefined, fallback: string): string {
  return value !== undefined && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : fallback;
}

function addIsoDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function createIsoDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addIsoDays(date, 1)) {
    dates.push(date);
  }

  return dates;
}

function diffIsoDays(date: string, anchor: string): number {
  return Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${anchor}T00:00:00Z`)) / 86_400_000
  );
}

function cumulativeReturn(values: Array<number | undefined>): number | undefined {
  const finiteValues = values.filter((value): value is number => value !== undefined);

  if (finiteValues.length === 0) {
    return undefined;
  }

  return roundMetric(finiteValues.reduce((product, value) => product * (1 + value), 1) - 1);
}

function clampInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  if (value === undefined || !Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(maximum, Math.max(minimum, value));
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleStandardDeviation(values: number[]): number | undefined {
  const variance = sampleVariance(values);
  return variance === undefined ? undefined : Math.sqrt(variance);
}

function sampleVariance(values: number[]): number | undefined {
  if (values.length < 2) {
    return undefined;
  }

  const mean = average(values);
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

function sampleCovariance(leftValues: number[], rightValues: number[]): number {
  const leftMean = average(leftValues);
  const rightMean = average(rightValues);
  return (
    leftValues.reduce(
      (sum, leftValue, index) => sum + (leftValue - leftMean) * (rightValues[index] - rightMean),
      0
    ) /
    (leftValues.length - 1)
  );
}

function createPercentileComparisonResult(params: {
  asOf: string;
  benchmarkAsOf: string;
  benchmarkTypes: PercentileBenchmarkType[];
  comparisons: PercentileBenchmarkComparison[];
  instrumentId: string | undefined;
  metricId: PercentileMetricId;
  resolution: ResolveSecurityResult | undefined;
  status: PercentileComparisonResult["status"];
  subject: PercentileSubjectMetric;
  usageCredits: number;
  usageRows: number;
}): PercentileComparisonResult {
  return {
    as_of: params.asOf,
    benchmark_types: params.benchmarkTypes,
    comparisons: params.comparisons,
    data_version: PERCENTILE_COMPARISON_VERSION,
    formula_version: PERCENTILE_COMPARISON_FORMULA_VERSION,
    frontend_rendering: false,
    instrument_id: params.instrumentId,
    live_data_access: false,
    methodology_version: PERCENTILE_COMPARISON_VERSION,
    metric_id: params.metricId,
    point_in_time_policy: {
      benchmark_as_of: params.benchmarkAsOf,
      classification_as_of: params.benchmarkAsOf,
      live_constituents: false,
      no_future_constituents: true
    },
    resolve_security: params.resolution,
    status: params.status,
    subject: params.subject,
    toolName: "compare_percentiles",
    usage: {
      cached: false,
      credits: params.usageCredits,
      rows: params.usageRows
    }
  };
}

function createPercentileSubjectMetric(
  metricId: PercentileMetricId,
  input: PercentileComparisonInput,
  instrumentId: string
): { subject: PercentileSubjectMetric; usage: { credits: number; rows: number } } {
  if (metricId === "net_margin") {
    const ratios = getFinancialRatios({
      asOf: input.asOf,
      financialFrom: input.financialFrom,
      financialTo: input.financialTo,
      instrumentId,
      requestId: input.requestId
    });
    const metric = ratios.ratios.find((ratio) => ratio.metric_id === metricId);

    return {
      subject:
        metric?.status === "computed" && metric.value !== undefined
          ? createComputedPercentileSubject(
              metricId,
              "get_financial_ratios",
              metric.value,
              metric.source_record_ids
            )
          : createBlockedPercentileSubject(
              metricId,
              "get_financial_ratios",
              metric?.blocked_reason ?? `financial_ratios_${ratios.status}`,
              metric?.source_record_ids ?? []
            ),
      usage: {
        credits: ratios.usage.credits,
        rows: ratios.usage.rows
      }
    };
  }

  const returnsRisk = calculateReturnsRisk({
    asOf: input.asOf,
    from: input.from,
    instrumentId,
    requestId: input.requestId,
    to: input.to
  });
  const metric = returnsRisk.metrics.find((candidate) => candidate.metric_id === metricId);

  return {
    subject:
      metric?.status === "computed" && metric.value !== undefined
        ? createComputedPercentileSubject(
            metricId,
            "calculate_returns_risk",
            metric.value,
            metric.source_record_ids
          )
        : createBlockedPercentileSubject(
            metricId,
            "calculate_returns_risk",
            metric?.blocked_reason ?? `returns_risk_${returnsRisk.status}`,
            metric?.source_record_ids ?? []
          ),
    usage: {
      credits: returnsRisk.usage.credits,
      rows: returnsRisk.usage.rows
    }
  };
}

function createComputedPercentileSubject(
  metricId: PercentileMetricId,
  sourceTool: PercentileSubjectMetric["source_tool"],
  value: number,
  sourceRecordIds: string[]
): PercentileSubjectMetric {
  return {
    metric_id: metricId,
    source_record_ids: sourceRecordIds,
    source_tool: sourceTool,
    status: "computed",
    unit: "ratio",
    value
  };
}

function createBlockedPercentileSubject(
  metricId: PercentileMetricId,
  sourceTool: PercentileSubjectMetric["source_tool"],
  blockedReason: string,
  sourceRecordIds: string[]
): PercentileSubjectMetric {
  return {
    blocked_reason: blockedReason,
    metric_id: metricId,
    source_record_ids: sourceRecordIds,
    source_tool: sourceTool,
    status: "blocked",
    unit: "ratio"
  };
}

function createPercentileBenchmark(
  metricId: PercentileMetricId,
  benchmarkType: PercentileBenchmarkType,
  value: number
): PercentileBenchmarkComparison {
  const benchmark = SYNTHETIC_PERCENTILE_BENCHMARKS[metricId][benchmarkType];
  const rank = benchmark.distribution.filter((candidate) => candidate <= value).length;

  return {
    as_of: benchmark.asOf,
    benchmark_id: benchmark.benchmarkId,
    benchmark_type: benchmarkType,
    constituent_as_of: benchmark.constituentAsOf,
    constituents: benchmark.constituents,
    distribution: benchmark.distribution,
    history_observations: benchmark.historyObservations,
    label: benchmark.label,
    live_constituents: false,
    method: "nearest_rank_less_than_or_equal",
    percentile_rank: roundMetric(rank / benchmark.distribution.length),
    point_in_time: true,
    sample_count: benchmark.distribution.length,
    status: "computed"
  };
}

function createBlockedPercentileBenchmark(
  metricId: PercentileMetricId,
  benchmarkType: PercentileBenchmarkType,
  blockedReason: string
): PercentileBenchmarkComparison {
  const benchmark = SYNTHETIC_PERCENTILE_BENCHMARKS[metricId][benchmarkType];

  return {
    as_of: benchmark.asOf,
    benchmark_id: benchmark.benchmarkId,
    benchmark_type: benchmarkType,
    blocked_reason: blockedReason,
    constituent_as_of: benchmark.constituentAsOf,
    constituents: benchmark.constituents,
    distribution: benchmark.distribution,
    history_observations: benchmark.historyObservations,
    label: benchmark.label,
    live_constituents: false,
    method: "nearest_rank_less_than_or_equal",
    point_in_time: true,
    sample_count: benchmark.distribution.length,
    status: "blocked"
  };
}

function getPercentileSubjectSourceTool(
  metricId: PercentileMetricId
): PercentileSubjectMetric["source_tool"] {
  return metricId === "net_margin" ? "get_financial_ratios" : "calculate_returns_risk";
}

function normalizeHighCostAnalyticsToolName(
  value: string | undefined
): HighCostAnalyticsToolName | undefined {
  return value === "compare_securities" ||
    value === "run_event_study" ||
    value === "screen_securities"
    ? value
    : undefined;
}

function estimateHighCostAnalyticsCost(
  toolName: HighCostAnalyticsToolName,
  input: HighCostAnalyticsQueueInput
): HighCostAnalyticsQueuePlanResult["cost_estimate"] {
  const toolWeightRange = HIGH_COST_ANALYTICS_TOOL_WEIGHTS[toolName];
  const metricCount = clampPositiveInteger(input.metricCount, 1);

  if (toolName === "screen_securities") {
    const universeSize = clampPositiveInteger(input.universeSize, DEFAULT_SCREEN_UNIVERSE.length);
    const universeWeight = Math.ceil(universeSize / 100);
    const creditWeight = Math.min(toolWeightRange.max, toolWeightRange.min + universeWeight);

    return {
      credit_weight: creditWeight,
      high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
      reason_codes: [
        "prd_screen_securities_weight_8_20",
        "screening_uses_independent_pool"
      ],
      rows_estimate: universeSize,
      source: "deterministic_scaffold",
      tool_weight_range: toolWeightRange
    };
  }

  if (toolName === "run_event_study") {
    const eventCount = clampPositiveInteger(input.eventCount, 1);
    const eventWindowDays = clampPositiveInteger(
      input.eventWindowDays,
      DEFAULT_EVENT_STUDY_PRE_DAYS + DEFAULT_EVENT_STUDY_POST_DAYS + 1
    );
    const eventWeight = Math.max(0, eventCount - 1) * 5;
    const windowWeight = Math.max(0, eventWindowDays - 3);
    const creditWeight = Math.min(
      toolWeightRange.max,
      toolWeightRange.min + eventWeight + windowWeight
    );

    return {
      credit_weight: creditWeight,
      high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
      reason_codes: [
        "prd_event_study_weight_20_50",
        "event_study_uses_independent_pool"
      ],
      rows_estimate: eventCount * eventWindowDays,
      source: "deterministic_scaffold",
      tool_weight_range: toolWeightRange
    };
  }

  const securityCount = Math.max(input.securities?.length ?? 0, 2);
  const breadthWeight = Math.max(0, securityCount - 2);
  const metricWeight = Math.max(0, metricCount - REQUIRED_FINANCIAL_METRICS.length);
  const creditWeight = Math.min(
    toolWeightRange.max,
    toolWeightRange.min + breadthWeight + metricWeight
  );

  return {
    credit_weight: creditWeight,
    high_cost_threshold: HIGH_COST_ANALYTICS_THRESHOLD,
    reason_codes:
      creditWeight >= HIGH_COST_ANALYTICS_THRESHOLD
        ? ["prd_compare_securities_weight_5_15", "large_comparison_uses_independent_pool"]
        : ["prd_compare_securities_weight_5_15", "small_comparison_can_use_standard_pool"],
    rows_estimate: securityCount,
    source: "deterministic_scaffold",
    tool_weight_range: toolWeightRange
  };
}

function createHighCostAnalyticsEnqueuePlan(input: {
  analyticsToolName: HighCostAnalyticsToolName;
  idempotencyKey: string;
  queueRequired: boolean;
  status: HighCostAnalyticsPlanStatus;
  userConfirmed: boolean;
}): HighCostAnalyticsQueuePlanResult["enqueue_plan"] {
  if (!input.queueRequired) {
    return {
      idempotency_key: input.idempotencyKey,
      retry_policy: createHighCostAnalyticsRetryPolicy(),
      status: "not_required"
    };
  }

  const queueKey = `analytics-high-cost:${input.analyticsToolName}:${input.idempotencyKey}`;

  return {
    idempotency_key: input.idempotencyKey,
    planned_task_id: input.userConfirmed
      ? `planned_${input.analyticsToolName}_${input.idempotencyKey}`
      : undefined,
    queue_key: queueKey,
    retry_policy: createHighCostAnalyticsRetryPolicy(),
    status: input.status === "confirmation_required" ? "awaiting_confirmation" : "would_enqueue"
  };
}

function createHighCostAnalyticsUsagePolicy(
  userConfirmed: boolean | undefined
): HighCostAnalyticsQueuePlanResult["usage_policy"] {
  return {
    failure_refund_required: true,
    pre_debit_required: true,
    requires_confirmation_before_enqueue: true,
    usage_ledger_link_required: true,
    user_confirmed: userConfirmed === true
  };
}

function createHighCostAnalyticsRetryPolicy(): HighCostAnalyticsQueuePlanResult["enqueue_plan"]["retry_policy"] {
  return {
    max_attempts: 2,
    retryable_errors: ["timeout", "rate_limited", "transient_provider_error"]
  };
}

function createAnalyticsQueueIdempotencyKey(
  requestId: string,
  toolName: string | undefined
): string {
  return `${requestId}:${toolName ?? "unsupported"}`.replaceAll(/[^A-Za-z0-9:_-]/gu, "_");
}

function clampPositiveInteger(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isInteger(value) || value < 1 ? fallback : value;
}

function createScreenPointInTimeGuard(
  asOf: string,
  classificationAsOf: string | undefined
): ScreenSecuritiesResult["point_in_time_guard"] {
  const requestedAsOf = asOf.slice(0, 10);
  const resolvedClassificationAsOf = classificationAsOf?.slice(0, 10) ?? requestedAsOf;

  return {
    classification_as_of: resolvedClassificationAsOf,
    future_data_policy: "block_future_classification",
    requested_as_of: requestedAsOf,
    security_master_as_of: requestedAsOf,
    status:
      resolvedClassificationAsOf > requestedAsOf ? "blocked_future_data" : "enforced",
    uses_latest_classification: false
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
