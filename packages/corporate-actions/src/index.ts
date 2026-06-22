export const CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION =
  "2026-06-20.phase1.corporate-action-engine.v0";
export const CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION =
  "corporate-action-adjustment@synthetic-v0";
export const GET_CORPORATE_ACTIONS_VERSION =
  "2026-06-21.phase1.get-corporate-actions-tool-scaffold.v0";
export const GET_CORPORATE_ACTIONS_DATA_VERSION = "corporate-actions-synthetic-v0";
export const CORPORATE_ACTION_BENCHMARK_PARITY_VERSION =
  "2026-06-22.phase1.corporate-action-benchmark-parity-scaffold.v0";
export const CORPORATE_ACTION_BENCHMARK_FIXTURE_VERSION =
  "corporate-action-benchmark-parity@partner-public-v0";

export type CorporateActionType = "consolidation" | "dividend" | "split";
export type CorporateActionToolType =
  | CorporateActionType
  | "buyback"
  | "placement"
  | "rights";
export type CorporateActionAdjustmentType =
  | "raw"
  | "split_adjusted"
  | "total_return_adjusted";
export type CorporateActionAdjustmentDirection = "backward_adjusted";
export type CorporateActionAdjustmentErrorCode =
  | "ACTION_DATE_INVALID"
  | "ACTION_FACTOR_INVALID"
  | "PRICE_BAR_INVALID";
export type CorporateActionsInputErrorCode =
  | "INSTRUMENT_ID_REQUIRED"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "INVALID_RANGE";
export type CorporateActionsStatus =
  | "data_not_licensed"
  | "data_quality_hold"
  | "found"
  | "not_found"
  | "out_of_range"
  | "too_many_rows";
export type CorporateActionsQualityState = "HOLD" | "PASS";

export interface CorporateActionEvent {
  actionId: string;
  actionType: CorporateActionType;
  cashAmount?: number;
  effectiveDate: string;
  ratio?: number;
  reinvestmentPrice?: number;
  sourceRecordId: string;
}

export interface GetCorporateActionsInput {
  cursor?: string;
  from: string;
  instrumentId: string;
  limit?: number;
  to: string;
  types?: string[];
}

export interface CorporateActionToolRow {
  actionId: string;
  actionType: CorporateActionToolType;
  adjustmentImpact: {
    affectsSplitAdjusted: boolean;
    affectsTotalReturnAdjusted: boolean;
    methodologyVersion: typeof CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION;
    priceAdjustmentFactor?: number;
  };
  announcementDate: string;
  effectiveDate: string;
  exDate?: string;
  instrumentId: string;
  paymentDate?: string;
  qualityState: CorporateActionsQualityState;
  sourceRecordId: string;
  status: "announced" | "confirmed";
  summary: string;
  terms: {
    buybackValue?: number;
    cashAmount?: number;
    currency?: string;
    offerPrice?: number;
    ratio?: number;
    shares?: number;
  };
}

export interface CorporateActionsTimeline {
  actions: CorporateActionToolRow[];
  currency: string;
  exchange: string;
  from: string;
  instrumentId: string;
  market: string;
  nextCursor?: string;
  qualityState: CorporateActionsQualityState;
  rowCount: number;
  symbol: string;
  to: string;
  totalRows: number;
}

export interface GetCorporateActionsResult {
  cursor?: string;
  dataVersion: typeof GET_CORPORATE_ACTIONS_DATA_VERSION;
  from: string;
  instrumentId: string;
  limit: number;
  liveDataAccess: false;
  methodologyVersion: typeof GET_CORPORATE_ACTIONS_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  rejectedTypes: string[];
  requestedTypes: CorporateActionToolType[];
  status: CorporateActionsStatus;
  timeline?: CorporateActionsTimeline;
  to: string;
  toolName: "get_corporate_actions";
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  };
}

export interface PriceObservation {
  close: number;
  date: string;
  sourceRecordId: string;
}

export interface AdjustPriceSeriesInput {
  actions: CorporateActionEvent[];
  bars: PriceObservation[];
  instrumentId: string;
  methodologyVersion?: string;
}

export interface AdjustmentFactor {
  actionId: string;
  adjustmentType: Exclude<CorporateActionAdjustmentType, "raw">;
  appliesTo: "bars_before_effective_date";
  effectiveDate: string;
  factor: number;
  sourceRecordId: string;
}

export interface AdjustedPriceObservation {
  appliedActionIds: string[];
  date: string;
  rawClose: number;
  sourceRecordId: string;
  splitAdjustedClose: number;
  splitFactor: number;
  totalReturnAdjustedClose: number;
  totalReturnFactor: number;
}

export interface CorporateActionAdjustmentResult {
  direction: CorporateActionAdjustmentDirection;
  engineVersion: typeof CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION;
  factors: AdjustmentFactor[];
  instrumentId: string;
  methodologyVersion: string;
  observations: AdjustedPriceObservation[];
  status: "pass";
  summary: {
    actionCount: number;
    adjustedObservationCount: number;
    observationCount: number;
  };
}

export interface CorporateActionGoldenCase {
  caseId: string;
  expected: Pick<
    AdjustedPriceObservation,
    "date" | "splitAdjustedClose" | "totalReturnAdjustedClose"
  >;
  input: AdjustPriceSeriesInput;
  tolerance: number;
}

export interface CorporateActionGoldenResult {
  engineVersion: typeof CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION;
  failures: Array<{
    actual: Pick<
      AdjustedPriceObservation,
      "date" | "splitAdjustedClose" | "totalReturnAdjustedClose"
    >;
    caseId: string;
    expected: CorporateActionGoldenCase["expected"];
  }>;
  methodologyVersion: typeof CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION;
  passed: boolean;
  sampleCount: number;
}

export type CorporateActionBenchmarkSource =
  | "partner_reference"
  | "public_exchange_reference";

export interface CorporateActionBenchmarkCase {
  actions: CorporateActionEvent[];
  benchmarkRecordId: string;
  bars: PriceObservation[];
  caseId: string;
  expected: Pick<
    AdjustedPriceObservation,
    "date" | "splitAdjustedClose" | "totalReturnAdjustedClose"
  >;
  instrumentId: string;
  source: CorporateActionBenchmarkSource;
  sourceRecordId: string;
  tolerance: number;
}

export interface CorporateActionBenchmarkCaseResult {
  actual: Pick<
    AdjustedPriceObservation,
    "date" | "splitAdjustedClose" | "totalReturnAdjustedClose"
  >;
  actionTypes: CorporateActionType[];
  benchmarkRecordId: string;
  caseId: string;
  delta: {
    splitAdjustedClose: number;
    totalReturnAdjustedClose: number;
  };
  expected: CorporateActionBenchmarkCase["expected"];
  instrumentId: string;
  source: CorporateActionBenchmarkSource;
  sourceRecordId: string;
  status: "fail" | "pass";
  tolerance: number;
}

export interface CorporateActionBenchmarkParityResult {
  benchmarkFixtureVersion: typeof CORPORATE_ACTION_BENCHMARK_FIXTURE_VERSION;
  caseResults: CorporateActionBenchmarkCaseResult[];
  engineVersion: typeof CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION;
  failures: CorporateActionBenchmarkCaseResult[];
  frontendRendering: false;
  livePartnerData: false;
  liveServingReads: false;
  methodologyVersion: typeof CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION;
  minimumComplexCases: 20;
  passed: boolean;
  passedCount: number;
  sampleCount: number;
  sourceCounts: Record<CorporateActionBenchmarkSource, number>;
  sqlEmitted: false;
  status: "failed" | "passed";
  version: typeof CORPORATE_ACTION_BENCHMARK_PARITY_VERSION;
}

export class CorporateActionAdjustmentError extends Error {
  readonly code: CorporateActionAdjustmentErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: CorporateActionAdjustmentErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class CorporateActionsInputError extends Error {
  readonly code: CorporateActionsInputErrorCode;

  constructor(code: CorporateActionsInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const DEFAULT_CORPORATE_ACTION_TYPES: readonly CorporateActionToolType[] = [
  "dividend",
  "split",
  "consolidation",
  "rights",
  "placement",
  "buyback"
];
const DEFAULT_CORPORATE_ACTION_LIMIT = 3;
const MAX_CORPORATE_ACTION_LIMIT = 3;

interface SyntheticCorporateActionRecord {
  actions: readonly CorporateActionToolRow[];
  currency: string;
  exchange: string;
  instrumentId: string;
  market: string;
  qualityState: CorporateActionsQualityState;
  symbol: string;
}

const SYNTHETIC_CORPORATE_ACTIONS: readonly SyntheticCorporateActionRecord[] = [
  {
    actions: [
      {
        actionId: "corp_action_00700_dividend_2026_01_07",
        actionType: "dividend",
        adjustmentImpact: {
          affectsSplitAdjusted: false,
          affectsTotalReturnAdjusted: true,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION,
          priceAdjustmentFactor: 0.9978
        },
        announcementDate: "2025-12-18",
        effectiveDate: "2026-01-07",
        exDate: "2026-01-07",
        instrumentId: "eq_hk_00700",
        paymentDate: "2026-01-22",
        qualityState: "PASS",
        sourceRecordId: "src_corp_action_00700_dividend_2026_01_07",
        status: "confirmed",
        summary: "Synthetic HKD cash dividend with total-return adjustment impact.",
        terms: {
          cashAmount: 1,
          currency: "HKD"
        }
      },
      {
        actionId: "corp_action_00700_buyback_2026_01_06",
        actionType: "buyback",
        adjustmentImpact: {
          affectsSplitAdjusted: false,
          affectsTotalReturnAdjusted: false,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION
        },
        announcementDate: "2026-01-06",
        effectiveDate: "2026-01-06",
        instrumentId: "eq_hk_00700",
        qualityState: "PASS",
        sourceRecordId: "src_corp_action_00700_buyback_2026_01_06",
        status: "announced",
        summary: "Synthetic on-market buyback disclosure.",
        terms: {
          buybackValue: 350000000,
          currency: "HKD",
          shares: 780000
        }
      },
      {
        actionId: "corp_action_00700_split_2026_01_05",
        actionType: "split",
        adjustmentImpact: {
          affectsSplitAdjusted: true,
          affectsTotalReturnAdjusted: true,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION,
          priceAdjustmentFactor: 0.5
        },
        announcementDate: "2025-12-15",
        effectiveDate: "2026-01-05",
        exDate: "2026-01-05",
        instrumentId: "eq_hk_00700",
        qualityState: "PASS",
        sourceRecordId: "src_corp_action_00700_split_2026_01_05",
        status: "confirmed",
        summary: "Synthetic two-for-one split used for adjustment timeline semantics.",
        terms: {
          ratio: 2
        }
      },
      {
        actionId: "corp_action_00700_placement_2026_01_03",
        actionType: "placement",
        adjustmentImpact: {
          affectsSplitAdjusted: false,
          affectsTotalReturnAdjusted: false,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION
        },
        announcementDate: "2026-01-03",
        effectiveDate: "2026-01-03",
        instrumentId: "eq_hk_00700",
        qualityState: "PASS",
        sourceRecordId: "src_corp_action_00700_placement_2026_01_03",
        status: "announced",
        summary: "Synthetic placement event for capital-action filtering.",
        terms: {
          currency: "HKD",
          offerPrice: 430,
          shares: 1200000
        }
      }
    ],
    currency: "HKD",
    exchange: "HKEX",
    instrumentId: "eq_hk_00700",
    market: "HK",
    qualityState: "PASS",
    symbol: "00700.HK"
  },
  {
    actions: [
      {
        actionId: "corp_action_00001_rights_2026_01_07",
        actionType: "rights",
        adjustmentImpact: {
          affectsSplitAdjusted: false,
          affectsTotalReturnAdjusted: false,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION
        },
        announcementDate: "2025-12-20",
        effectiveDate: "2026-01-07",
        exDate: "2026-01-07",
        instrumentId: "eq_hk_00001",
        qualityState: "PASS",
        sourceRecordId: "src_corp_action_00001_rights_2026_01_07",
        status: "confirmed",
        summary: "Synthetic rights issue event.",
        terms: {
          currency: "HKD",
          offerPrice: 17.5,
          ratio: 0.2
        }
      },
      {
        actionId: "corp_action_00001_consolidation_2026_01_06",
        actionType: "consolidation",
        adjustmentImpact: {
          affectsSplitAdjusted: true,
          affectsTotalReturnAdjusted: true,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION,
          priceAdjustmentFactor: 2
        },
        announcementDate: "2025-12-12",
        effectiveDate: "2026-01-06",
        exDate: "2026-01-06",
        instrumentId: "eq_hk_00001",
        qualityState: "PASS",
        sourceRecordId: "src_corp_action_00001_consolidation_2026_01_06",
        status: "confirmed",
        summary: "Synthetic one-for-two consolidation event.",
        terms: {
          ratio: 0.5
        }
      }
    ],
    currency: "HKD",
    exchange: "HKEX",
    instrumentId: "eq_hk_00001",
    market: "HK",
    qualityState: "PASS",
    symbol: "00001.HK"
  },
  {
    actions: [
      {
        actionId: "corp_action_08001_dividend_hold_2026_01_07",
        actionType: "dividend",
        adjustmentImpact: {
          affectsSplitAdjusted: false,
          affectsTotalReturnAdjusted: true,
          methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION
        },
        announcementDate: "2026-01-02",
        effectiveDate: "2026-01-07",
        exDate: "2026-01-07",
        instrumentId: "eq_hk_08001",
        qualityState: "HOLD",
        sourceRecordId: "src_corp_action_08001_dividend_hold_2026_01_07",
        status: "announced",
        summary: "Synthetic held action fixture.",
        terms: {
          cashAmount: 0.01,
          currency: "HKD"
        }
      }
    ],
    currency: "HKD",
    exchange: "HKEX",
    instrumentId: "eq_hk_08001",
    market: "HK",
    qualityState: "HOLD",
    symbol: "08001.HK"
  }
] as const;

export function adjustPriceSeries(
  input: AdjustPriceSeriesInput
): CorporateActionAdjustmentResult {
  const methodologyVersion =
    input.methodologyVersion ?? CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION;
  const sortedBars = [...input.bars].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
  const sortedActions = [...input.actions].sort((left, right) =>
    left.effectiveDate.localeCompare(right.effectiveDate)
  );
  const factors = sortedActions.flatMap(createAdjustmentFactors);
  const observations = sortedBars.map((bar) =>
    adjustObservation(bar, sortedActions, factors)
  );

  return {
    direction: "backward_adjusted",
    engineVersion: CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION,
    factors,
    instrumentId: input.instrumentId,
    methodologyVersion,
    observations,
    status: "pass",
    summary: {
      actionCount: sortedActions.length,
      adjustedObservationCount: observations.filter(
        (observation) =>
          observation.splitFactor !== 1 || observation.totalReturnFactor !== 1
      ).length,
      observationCount: observations.length
    }
  };
}

export function getCorporateActions(
  input: GetCorporateActionsInput
): GetCorporateActionsResult {
  const instrumentId = input.instrumentId.trim();
  const from = input.from.trim();
  const to = input.to.trim();
  const limit = input.limit ?? DEFAULT_CORPORATE_ACTION_LIMIT;

  if (instrumentId.length === 0) {
    throw new CorporateActionsInputError(
      "INSTRUMENT_ID_REQUIRED",
      "instrument_id is required"
    );
  }

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    throw new CorporateActionsInputError(
      "INVALID_RANGE",
      "from and to must be YYYY-MM-DD dates with from <= to"
    );
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new CorporateActionsInputError(
      "INVALID_LIMIT",
      "limit must be a positive integer"
    );
  }

  const normalizedTypes = normalizeCorporateActionTypes(input.types);
  const offset = parseCorporateActionCursor(input.cursor);

  if (normalizedTypes.rejectedTypes.length > 0) {
    return createCorporateActionsResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: normalizedTypes.rejectedTypes,
      requestedTypes: normalizedTypes.requestedTypes,
      status: "data_not_licensed",
      timeline: undefined,
      to
    });
  }

  if (limit > MAX_CORPORATE_ACTION_LIMIT) {
    return createCorporateActionsResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "too_many_rows",
      timeline: undefined,
      to
    });
  }

  const record = SYNTHETIC_CORPORATE_ACTIONS.find(
    (candidate) =>
      normalizeInstrumentId(candidate.instrumentId) === normalizeInstrumentId(instrumentId)
  );

  if (record === undefined) {
    return createCorporateActionsResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "not_found",
      timeline: undefined,
      to
    });
  }

  if (record.qualityState === "HOLD") {
    return createCorporateActionsResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "data_quality_hold",
      timeline: undefined,
      to
    });
  }

  const firstAvailableDate = record.actions[record.actions.length - 1]?.effectiveDate;
  const lastAvailableDate = record.actions[0]?.effectiveDate;
  if (
    firstAvailableDate === undefined ||
    lastAvailableDate === undefined ||
    from < firstAvailableDate ||
    to > lastAvailableDate
  ) {
    return createCorporateActionsResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "out_of_range",
      timeline: undefined,
      to
    });
  }

  const matchingActions = record.actions.filter(
    (action) =>
      action.effectiveDate >= from &&
      action.effectiveDate <= to &&
      normalizedTypes.requestedTypes.includes(action.actionType)
  );

  if (matchingActions.length === 0) {
    return createCorporateActionsResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "out_of_range",
      timeline: undefined,
      to
    });
  }

  const timeline = createCorporateActionsTimeline({
    actions: matchingActions,
    from,
    limit,
    offset,
    record,
    to
  });

  return createCorporateActionsResult({
    cursor: input.cursor,
    from,
    instrumentId,
    limit,
    rejectedTypes: [],
    requestedTypes: normalizedTypes.requestedTypes,
    status: "found",
    timeline,
    to
  });
}

export function getCorporateActionsCapabilities() {
  return {
    adjustment_impact_metadata: true,
    cursor_pagination: true,
    data_version: GET_CORPORATE_ACTIONS_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_corporate_actions.input.v0",
    live_data_access: false,
    max_rows_per_request: MAX_CORPORATE_ACTION_LIMIT,
    output_schema: "tool.get_corporate_actions.output.v0",
    status: "get_corporate_actions_scaffold" as const,
    supported_action_types: DEFAULT_CORPORATE_ACTION_TYPES,
    synthetic_action_rows: SYNTHETIC_CORPORATE_ACTIONS.reduce(
      (count, record) => count + record.actions.length,
      0
    ),
    version: GET_CORPORATE_ACTIONS_VERSION
  };
}

export function getCorporateActionAdjustmentCapabilities() {
  const golden = runSyntheticCorporateActionGolden();

  return {
    direction: "backward_adjusted" as const,
    engine_version: CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION,
    golden_cases: {
      passed: golden.passed,
      sample_count: golden.sampleCount
    },
    live_partner_data: false,
    methodology_version: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION,
    status: "engine_scaffold" as const,
    supported_action_types: ["split", "consolidation", "dividend"] as const,
    supported_adjustment_types: [
      "raw",
      "split_adjusted",
      "total_return_adjusted"
    ] as const
  };
}

export function getCorporateActionBenchmarkParityCapabilities() {
  const report = runCorporateActionBenchmarkParityGate();

  return {
    benchmark_fixture_version: CORPORATE_ACTION_BENCHMARK_FIXTURE_VERSION,
    engine_version: CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION,
    frontend_rendering: false,
    live_partner_data: false,
    live_serving_reads: false,
    minimum_complex_cases: report.minimumComplexCases,
    passed: report.passed,
    partner_reference_cases: report.sourceCounts.partner_reference,
    public_reference_cases: report.sourceCounts.public_exchange_reference,
    route: "GET /data/corporate-actions/benchmark-parity",
    sample_count: report.sampleCount,
    sql_emitted: false,
    status: "benchmark_parity_scaffold" as const,
    supported_sources: [
      "partner_reference",
      "public_exchange_reference"
    ] satisfies CorporateActionBenchmarkSource[],
    version: CORPORATE_ACTION_BENCHMARK_PARITY_VERSION
  };
}

function createCorporateActionsResult(params: {
  cursor?: string;
  from: string;
  instrumentId: string;
  limit: number;
  rejectedTypes: string[];
  requestedTypes: CorporateActionToolType[];
  status: CorporateActionsStatus;
  timeline: CorporateActionsTimeline | undefined;
  to: string;
}): GetCorporateActionsResult {
  return {
    cursor: params.cursor,
    dataVersion: GET_CORPORATE_ACTIONS_DATA_VERSION,
    from: params.from,
    instrumentId: params.instrumentId,
    limit: params.limit,
    liveDataAccess: false,
    methodologyVersion: GET_CORPORATE_ACTIONS_VERSION,
    provenance: createCorporateActionsProvenance(),
    rejectedTypes: params.rejectedTypes,
    requestedTypes: params.requestedTypes,
    status: params.status,
    timeline: params.timeline,
    to: params.to,
    toolName: "get_corporate_actions",
    usage: {
      cached: false,
      credits: params.timeline === undefined ? 0 : params.timeline.actions.length * 2,
      rows: params.timeline?.actions.length ?? 0
    }
  };
}

function createCorporateActionsTimeline(params: {
  actions: readonly CorporateActionToolRow[];
  from: string;
  limit: number;
  offset: number;
  record: SyntheticCorporateActionRecord;
  to: string;
}): CorporateActionsTimeline {
  const pageActions = params.actions.slice(params.offset, params.offset + params.limit);
  const nextOffset = params.offset + pageActions.length;
  const nextCursor =
    nextOffset < params.actions.length ? `offset:${nextOffset}` : undefined;

  return {
    actions: pageActions.map((action) => ({ ...action })),
    currency: params.record.currency,
    exchange: params.record.exchange,
    from: params.from,
    instrumentId: params.record.instrumentId,
    market: params.record.market,
    nextCursor,
    qualityState: params.record.qualityState,
    rowCount: pageActions.length,
    symbol: params.record.symbol,
    to: params.to,
    totalRows: params.actions.length
  };
}

function normalizeCorporateActionTypes(types: string[] | undefined): {
  rejectedTypes: string[];
  requestedTypes: CorporateActionToolType[];
} {
  if (types === undefined || types.length === 0) {
    return {
      rejectedTypes: [],
      requestedTypes: [...DEFAULT_CORPORATE_ACTION_TYPES]
    };
  }

  const requestedTypes: CorporateActionToolType[] = [];
  const rejectedTypes: string[] = [];

  for (const type of types) {
    if (isCorporateActionToolType(type)) {
      requestedTypes.push(type);
    } else {
      rejectedTypes.push(type);
    }
  }

  return {
    rejectedTypes,
    requestedTypes
  };
}

function isCorporateActionToolType(value: string): value is CorporateActionToolType {
  return (DEFAULT_CORPORATE_ACTION_TYPES as readonly string[]).includes(value);
}

function parseCorporateActionCursor(cursor: string | undefined): number {
  if (cursor === undefined || cursor.length === 0) {
    return 0;
  }

  const match = /^offset:(\d+)$/u.exec(cursor);
  if (match === null) {
    throw new CorporateActionsInputError(
      "INVALID_CURSOR",
      "cursor must be empty or match offset:<number>"
    );
  }

  return Number(match[1]);
}

function normalizeInstrumentId(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value);
}

function createCorporateActionsProvenance() {
  return [
    {
      data_version: GET_CORPORATE_ACTIONS_DATA_VERSION,
      methodology_version: GET_CORPORATE_ACTIONS_VERSION,
      source: "synthetic-corporate-actions",
      source_record_id: "get-corporate-actions-fixture-v0"
    }
  ];
}

export function runSyntheticCorporateActionGolden(): CorporateActionGoldenResult {
  const failures = SYNTHETIC_CORPORATE_ACTION_GOLDEN_CASES.flatMap((goldenCase) => {
    const result = adjustPriceSeries(goldenCase.input);
    const actualObservation = result.observations.find(
      (observation) => observation.date === goldenCase.expected.date
    );

    if (
      actualObservation !== undefined &&
      withinTolerance(
        actualObservation.splitAdjustedClose,
        goldenCase.expected.splitAdjustedClose,
        goldenCase.tolerance
      ) &&
      withinTolerance(
        actualObservation.totalReturnAdjustedClose,
        goldenCase.expected.totalReturnAdjustedClose,
        goldenCase.tolerance
      )
    ) {
      return [];
    }

    return [
      {
        actual: actualObservation ?? {
          date: goldenCase.expected.date,
          splitAdjustedClose: Number.NaN,
          totalReturnAdjustedClose: Number.NaN
        },
        caseId: goldenCase.caseId,
        expected: goldenCase.expected
      }
    ];
  });

  return {
    engineVersion: CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION,
    failures,
    methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION,
    passed: failures.length === 0,
    sampleCount: SYNTHETIC_CORPORATE_ACTION_GOLDEN_CASES.length
  };
}

export function runCorporateActionBenchmarkParityGate(): CorporateActionBenchmarkParityResult {
  const caseResults = CORPORATE_ACTION_BENCHMARK_CASES.map(
    createCorporateActionBenchmarkCaseResult
  );
  const failures = caseResults.filter((result) => result.status === "fail");

  return {
    benchmarkFixtureVersion: CORPORATE_ACTION_BENCHMARK_FIXTURE_VERSION,
    caseResults,
    engineVersion: CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION,
    failures,
    frontendRendering: false,
    livePartnerData: false,
    liveServingReads: false,
    methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION,
    minimumComplexCases: 20,
    passed: failures.length === 0 && caseResults.length >= 20,
    passedCount: caseResults.length - failures.length,
    sampleCount: caseResults.length,
    sourceCounts: countCorporateActionBenchmarkSources(),
    sqlEmitted: false,
    status: failures.length === 0 && caseResults.length >= 20 ? "passed" : "failed",
    version: CORPORATE_ACTION_BENCHMARK_PARITY_VERSION
  };
}

function createCorporateActionBenchmarkCaseResult(
  benchmarkCase: CorporateActionBenchmarkCase
): CorporateActionBenchmarkCaseResult {
  const result = adjustPriceSeries({
    actions: benchmarkCase.actions,
    bars: benchmarkCase.bars,
    instrumentId: benchmarkCase.instrumentId,
    methodologyVersion: CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION
  });
  const actualObservation = result.observations.find(
    (observation) => observation.date === benchmarkCase.expected.date
  );
  const actual = actualObservation ?? {
    date: benchmarkCase.expected.date,
    splitAdjustedClose: Number.NaN,
    totalReturnAdjustedClose: Number.NaN
  };
  const delta = {
    splitAdjustedClose: roundPrice(
      Math.abs(actual.splitAdjustedClose - benchmarkCase.expected.splitAdjustedClose)
    ),
    totalReturnAdjustedClose: roundPrice(
      Math.abs(
        actual.totalReturnAdjustedClose - benchmarkCase.expected.totalReturnAdjustedClose
      )
    )
  };
  const passed =
    withinTolerance(
      actual.splitAdjustedClose,
      benchmarkCase.expected.splitAdjustedClose,
      benchmarkCase.tolerance
    ) &&
    withinTolerance(
      actual.totalReturnAdjustedClose,
      benchmarkCase.expected.totalReturnAdjustedClose,
      benchmarkCase.tolerance
    );

  return {
    actual,
    actionTypes: benchmarkCase.actions.map((action) => action.actionType),
    benchmarkRecordId: benchmarkCase.benchmarkRecordId,
    caseId: benchmarkCase.caseId,
    delta,
    expected: benchmarkCase.expected,
    instrumentId: benchmarkCase.instrumentId,
    source: benchmarkCase.source,
    sourceRecordId: benchmarkCase.sourceRecordId,
    status: passed ? "pass" : "fail",
    tolerance: benchmarkCase.tolerance
  };
}

function countCorporateActionBenchmarkSources(): Record<
  CorporateActionBenchmarkSource,
  number
> {
  return CORPORATE_ACTION_BENCHMARK_CASES.reduce(
    (counts, benchmarkCase) => ({
      ...counts,
      [benchmarkCase.source]: counts[benchmarkCase.source] + 1
    }),
    {
      partner_reference: 0,
      public_exchange_reference: 0
    } satisfies Record<CorporateActionBenchmarkSource, number>
  );
}

export const SYNTHETIC_CORPORATE_ACTION_GOLDEN_CASES: CorporateActionGoldenCase[] = [
  {
    caseId: "split_2_for_1_backward_adjusted",
    expected: {
      date: "2016-05-06",
      splitAdjustedClose: 12,
      totalReturnAdjustedClose: 12
    },
    input: {
      actions: [
        {
          actionId: "corp_action_split_01234_2016_05_09",
          actionType: "split",
          effectiveDate: "2016-05-09",
          ratio: 2,
          sourceRecordId: "src_hk_corporate_action_split_pass_001"
        }
      ],
      bars: [
        {
          close: 24,
          date: "2016-05-06",
          sourceRecordId: "price_bar_01234_2016_05_06"
        },
        {
          close: 12.25,
          date: "2016-05-09",
          sourceRecordId: "price_bar_01234_2016_05_09"
        }
      ],
      instrumentId: "eq_01234"
    },
    tolerance: 0.0001
  },
  {
    caseId: "consolidation_1_for_2_backward_adjusted",
    expected: {
      date: "2017-03-10",
      splitAdjustedClose: 20,
      totalReturnAdjustedClose: 20
    },
    input: {
      actions: [
        {
          actionId: "corp_action_consolidation_00005_2017_03_13",
          actionType: "consolidation",
          effectiveDate: "2017-03-13",
          ratio: 0.5,
          sourceRecordId: "src_hk_corporate_action_consolidation_001"
        }
      ],
      bars: [
        {
          close: 10,
          date: "2017-03-10",
          sourceRecordId: "price_bar_00005_2017_03_10"
        }
      ],
      instrumentId: "eq_00005"
    },
    tolerance: 0.0001
  },
  {
    caseId: "cash_dividend_total_return_backward_adjusted",
    expected: {
      date: "2018-08-30",
      splitAdjustedClose: 100,
      totalReturnAdjustedClose: 95
    },
    input: {
      actions: [
        {
          actionId: "corp_action_dividend_00700_2018_08_31",
          actionType: "dividend",
          cashAmount: 5,
          effectiveDate: "2018-08-31",
          reinvestmentPrice: 100,
          sourceRecordId: "src_hk_corporate_action_dividend_001"
        }
      ],
      bars: [
        {
          close: 100,
          date: "2018-08-30",
          sourceRecordId: "price_bar_00700_2018_08_30"
        }
      ],
      instrumentId: "eq_00700"
    },
    tolerance: 0.0001
  }
];

export const CORPORATE_ACTION_BENCHMARK_CASES: CorporateActionBenchmarkCase[] = [
  {
    actions: [
      {
        actionId: "bench_split_2_for_1_partner_action",
        actionType: "split",
        effectiveDate: "2020-01-06",
        ratio: 2,
        sourceRecordId: "partner_ca_split_2_for_1"
      }
    ],
    benchmarkRecordId: "partner_benchmark_split_2_for_1",
    bars: [
      {
        close: 24,
        date: "2020-01-03",
        sourceRecordId: "partner_bar_split_2_for_1"
      }
    ],
    caseId: "split_2_for_1_partner",
    expected: {
      date: "2020-01-03",
      splitAdjustedClose: 12,
      totalReturnAdjustedClose: 12
    },
    instrumentId: "eq_bench_00001",
    source: "partner_reference",
    sourceRecordId: "partner_reference_split_2_for_1",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_split_3_for_1_public_action",
        actionType: "split",
        effectiveDate: "2020-01-07",
        ratio: 3,
        sourceRecordId: "public_ca_split_3_for_1"
      }
    ],
    benchmarkRecordId: "public_benchmark_split_3_for_1",
    bars: [
      {
        close: 90,
        date: "2020-01-06",
        sourceRecordId: "public_bar_split_3_for_1"
      }
    ],
    caseId: "split_3_for_1_public",
    expected: {
      date: "2020-01-06",
      splitAdjustedClose: 30,
      totalReturnAdjustedClose: 30
    },
    instrumentId: "eq_bench_00002",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_split_3_for_1",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_split_3_for_2_partner_action",
        actionType: "split",
        effectiveDate: "2020-01-08",
        ratio: 1.5,
        sourceRecordId: "partner_ca_split_3_for_2"
      }
    ],
    benchmarkRecordId: "partner_benchmark_split_3_for_2",
    bars: [
      {
        close: 45,
        date: "2020-01-07",
        sourceRecordId: "partner_bar_split_3_for_2"
      }
    ],
    caseId: "split_3_for_2_partner",
    expected: {
      date: "2020-01-07",
      splitAdjustedClose: 30,
      totalReturnAdjustedClose: 30
    },
    instrumentId: "eq_bench_00003",
    source: "partner_reference",
    sourceRecordId: "partner_reference_split_3_for_2",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_consolidation_1_for_2_public_action",
        actionType: "consolidation",
        effectiveDate: "2020-01-09",
        ratio: 0.5,
        sourceRecordId: "public_ca_consolidation_1_for_2"
      }
    ],
    benchmarkRecordId: "public_benchmark_consolidation_1_for_2",
    bars: [
      {
        close: 10,
        date: "2020-01-08",
        sourceRecordId: "public_bar_consolidation_1_for_2"
      }
    ],
    caseId: "consolidation_1_for_2_public",
    expected: {
      date: "2020-01-08",
      splitAdjustedClose: 20,
      totalReturnAdjustedClose: 20
    },
    instrumentId: "eq_bench_00004",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_consolidation_1_for_2",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_consolidation_1_for_4_partner_action",
        actionType: "consolidation",
        effectiveDate: "2020-01-10",
        ratio: 0.25,
        sourceRecordId: "partner_ca_consolidation_1_for_4"
      }
    ],
    benchmarkRecordId: "partner_benchmark_consolidation_1_for_4",
    bars: [
      {
        close: 8,
        date: "2020-01-09",
        sourceRecordId: "partner_bar_consolidation_1_for_4"
      }
    ],
    caseId: "consolidation_1_for_4_partner",
    expected: {
      date: "2020-01-09",
      splitAdjustedClose: 32,
      totalReturnAdjustedClose: 32
    },
    instrumentId: "eq_bench_00005",
    source: "partner_reference",
    sourceRecordId: "partner_reference_consolidation_1_for_4",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_cash_dividend_5pct_public_action",
        actionType: "dividend",
        cashAmount: 5,
        effectiveDate: "2020-01-13",
        reinvestmentPrice: 100,
        sourceRecordId: "public_ca_cash_dividend_5pct"
      }
    ],
    benchmarkRecordId: "public_benchmark_cash_dividend_5pct",
    bars: [
      {
        close: 100,
        date: "2020-01-10",
        sourceRecordId: "public_bar_cash_dividend_5pct"
      }
    ],
    caseId: "cash_dividend_5pct_public",
    expected: {
      date: "2020-01-10",
      splitAdjustedClose: 100,
      totalReturnAdjustedClose: 95
    },
    instrumentId: "eq_bench_00006",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_cash_dividend_5pct",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_cash_dividend_small_partner_action",
        actionType: "dividend",
        cashAmount: 0.8,
        effectiveDate: "2020-01-14",
        reinvestmentPrice: 40,
        sourceRecordId: "partner_ca_cash_dividend_small"
      }
    ],
    benchmarkRecordId: "partner_benchmark_cash_dividend_small",
    bars: [
      {
        close: 20,
        date: "2020-01-13",
        sourceRecordId: "partner_bar_cash_dividend_small"
      }
    ],
    caseId: "cash_dividend_small_partner",
    expected: {
      date: "2020-01-13",
      splitAdjustedClose: 20,
      totalReturnAdjustedClose: 19.6
    },
    instrumentId: "eq_bench_00007",
    source: "partner_reference",
    sourceRecordId: "partner_reference_cash_dividend_small",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_zero_cash_dividend_public_action",
        actionType: "dividend",
        cashAmount: 0,
        effectiveDate: "2020-01-15",
        reinvestmentPrice: 75,
        sourceRecordId: "public_ca_zero_cash_dividend"
      }
    ],
    benchmarkRecordId: "public_benchmark_zero_cash_dividend",
    bars: [
      {
        close: 75,
        date: "2020-01-14",
        sourceRecordId: "public_bar_zero_cash_dividend"
      }
    ],
    caseId: "zero_cash_dividend_public",
    expected: {
      date: "2020-01-14",
      splitAdjustedClose: 75,
      totalReturnAdjustedClose: 75
    },
    instrumentId: "eq_bench_00008",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_zero_cash_dividend",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_split_then_dividend_partner_split",
        actionType: "split",
        effectiveDate: "2020-02-03",
        ratio: 2,
        sourceRecordId: "partner_ca_split_then_dividend_split"
      },
      {
        actionId: "bench_split_then_dividend_partner_dividend",
        actionType: "dividend",
        cashAmount: 1,
        effectiveDate: "2020-03-03",
        reinvestmentPrice: 50,
        sourceRecordId: "partner_ca_split_then_dividend_dividend"
      }
    ],
    benchmarkRecordId: "partner_benchmark_split_then_dividend",
    bars: [
      {
        close: 100,
        date: "2020-01-31",
        sourceRecordId: "partner_bar_split_then_dividend"
      }
    ],
    caseId: "split_then_dividend_partner",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 50,
      totalReturnAdjustedClose: 49
    },
    instrumentId: "eq_bench_00009",
    source: "partner_reference",
    sourceRecordId: "partner_reference_split_then_dividend",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_dividend_then_split_public_dividend",
        actionType: "dividend",
        cashAmount: 2,
        effectiveDate: "2020-02-04",
        reinvestmentPrice: 80,
        sourceRecordId: "public_ca_dividend_then_split_dividend"
      },
      {
        actionId: "bench_dividend_then_split_public_split",
        actionType: "split",
        effectiveDate: "2020-03-04",
        ratio: 4,
        sourceRecordId: "public_ca_dividend_then_split_split"
      }
    ],
    benchmarkRecordId: "public_benchmark_dividend_then_split",
    bars: [
      {
        close: 160,
        date: "2020-01-31",
        sourceRecordId: "public_bar_dividend_then_split"
      }
    ],
    caseId: "dividend_then_split_public",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 40,
      totalReturnAdjustedClose: 39
    },
    instrumentId: "eq_bench_00010",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_dividend_then_split",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_consolidation_then_dividend_partner_consolidation",
        actionType: "consolidation",
        effectiveDate: "2020-02-05",
        ratio: 0.5,
        sourceRecordId: "partner_ca_consolidation_then_dividend_consolidation"
      },
      {
        actionId: "bench_consolidation_then_dividend_partner_dividend",
        actionType: "dividend",
        cashAmount: 1.5,
        effectiveDate: "2020-03-05",
        reinvestmentPrice: 30,
        sourceRecordId: "partner_ca_consolidation_then_dividend_dividend"
      }
    ],
    benchmarkRecordId: "partner_benchmark_consolidation_then_dividend",
    bars: [
      {
        close: 15,
        date: "2020-01-31",
        sourceRecordId: "partner_bar_consolidation_then_dividend"
      }
    ],
    caseId: "consolidation_then_dividend_partner",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 30,
      totalReturnAdjustedClose: 28.5
    },
    instrumentId: "eq_bench_00011",
    source: "partner_reference",
    sourceRecordId: "partner_reference_consolidation_then_dividend",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_two_splits_public_first",
        actionType: "split",
        effectiveDate: "2020-02-06",
        ratio: 2,
        sourceRecordId: "public_ca_two_splits_first"
      },
      {
        actionId: "bench_two_splits_public_second",
        actionType: "split",
        effectiveDate: "2020-03-06",
        ratio: 1.25,
        sourceRecordId: "public_ca_two_splits_second"
      }
    ],
    benchmarkRecordId: "public_benchmark_two_splits",
    bars: [
      {
        close: 50,
        date: "2020-01-31",
        sourceRecordId: "public_bar_two_splits"
      }
    ],
    caseId: "two_splits_public",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 20,
      totalReturnAdjustedClose: 20
    },
    instrumentId: "eq_bench_00012",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_two_splits",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_split_and_consolidation_partner_split",
        actionType: "split",
        effectiveDate: "2020-02-07",
        ratio: 2,
        sourceRecordId: "partner_ca_split_and_consolidation_split"
      },
      {
        actionId: "bench_split_and_consolidation_partner_consolidation",
        actionType: "consolidation",
        effectiveDate: "2020-03-07",
        ratio: 0.25,
        sourceRecordId: "partner_ca_split_and_consolidation_consolidation"
      }
    ],
    benchmarkRecordId: "partner_benchmark_split_and_consolidation",
    bars: [
      {
        close: 11,
        date: "2020-01-31",
        sourceRecordId: "partner_bar_split_and_consolidation"
      }
    ],
    caseId: "split_and_consolidation_partner",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 22,
      totalReturnAdjustedClose: 22
    },
    instrumentId: "eq_bench_00013",
    source: "partner_reference",
    sourceRecordId: "partner_reference_split_and_consolidation",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_two_dividends_public_first",
        actionType: "dividend",
        cashAmount: 1,
        effectiveDate: "2020-02-10",
        reinvestmentPrice: 100,
        sourceRecordId: "public_ca_two_dividends_first"
      },
      {
        actionId: "bench_two_dividends_public_second",
        actionType: "dividend",
        cashAmount: 2,
        effectiveDate: "2020-03-10",
        reinvestmentPrice: 50,
        sourceRecordId: "public_ca_two_dividends_second"
      }
    ],
    benchmarkRecordId: "public_benchmark_two_dividends",
    bars: [
      {
        close: 100,
        date: "2020-01-31",
        sourceRecordId: "public_bar_two_dividends"
      }
    ],
    caseId: "two_dividends_public",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 100,
      totalReturnAdjustedClose: 95.04
    },
    instrumentId: "eq_bench_00014",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_two_dividends",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_split_two_dividends_partner_split",
        actionType: "split",
        effectiveDate: "2020-02-11",
        ratio: 3,
        sourceRecordId: "partner_ca_split_two_dividends_split"
      },
      {
        actionId: "bench_split_two_dividends_partner_first_dividend",
        actionType: "dividend",
        cashAmount: 1,
        effectiveDate: "2020-03-11",
        reinvestmentPrice: 60,
        sourceRecordId: "partner_ca_split_two_dividends_first_dividend"
      },
      {
        actionId: "bench_split_two_dividends_partner_second_dividend",
        actionType: "dividend",
        cashAmount: 0.5,
        effectiveDate: "2020-04-13",
        reinvestmentPrice: 30,
        sourceRecordId: "partner_ca_split_two_dividends_second_dividend"
      }
    ],
    benchmarkRecordId: "partner_benchmark_split_two_dividends",
    bars: [
      {
        close: 90,
        date: "2020-01-31",
        sourceRecordId: "partner_bar_split_two_dividends"
      }
    ],
    caseId: "split_two_dividends_partner",
    expected: {
      date: "2020-01-31",
      splitAdjustedClose: 30,
      totalReturnAdjustedClose: 29.008333
    },
    instrumentId: "eq_bench_00015",
    source: "partner_reference",
    sourceRecordId: "partner_reference_split_two_dividends",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_effective_date_no_adjustment_public_action",
        actionType: "split",
        effectiveDate: "2020-05-04",
        ratio: 2,
        sourceRecordId: "public_ca_effective_date_no_adjustment"
      }
    ],
    benchmarkRecordId: "public_benchmark_effective_date_no_adjustment",
    bars: [
      {
        close: 40,
        date: "2020-05-04",
        sourceRecordId: "public_bar_effective_date_no_adjustment"
      }
    ],
    caseId: "effective_date_no_adjustment_public",
    expected: {
      date: "2020-05-04",
      splitAdjustedClose: 40,
      totalReturnAdjustedClose: 40
    },
    instrumentId: "eq_bench_00016",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_effective_date_no_adjustment",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_post_action_no_adjustment_partner_action",
        actionType: "dividend",
        cashAmount: 1,
        effectiveDate: "2020-05-05",
        reinvestmentPrice: 50,
        sourceRecordId: "partner_ca_post_action_no_adjustment"
      }
    ],
    benchmarkRecordId: "partner_benchmark_post_action_no_adjustment",
    bars: [
      {
        close: 51,
        date: "2020-05-06",
        sourceRecordId: "partner_bar_post_action_no_adjustment"
      }
    ],
    caseId: "post_action_no_adjustment_partner",
    expected: {
      date: "2020-05-06",
      splitAdjustedClose: 51,
      totalReturnAdjustedClose: 51
    },
    instrumentId: "eq_bench_00017",
    source: "partner_reference",
    sourceRecordId: "partner_reference_post_action_no_adjustment",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_fractional_consolidation_public_action",
        actionType: "consolidation",
        effectiveDate: "2020-05-07",
        ratio: 0.8,
        sourceRecordId: "public_ca_fractional_consolidation"
      }
    ],
    benchmarkRecordId: "public_benchmark_fractional_consolidation",
    bars: [
      {
        close: 12.34,
        date: "2020-05-06",
        sourceRecordId: "public_bar_fractional_consolidation"
      }
    ],
    caseId: "fractional_consolidation_public",
    expected: {
      date: "2020-05-06",
      splitAdjustedClose: 15.425,
      totalReturnAdjustedClose: 15.425
    },
    instrumentId: "eq_bench_00018",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_fractional_consolidation",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_fractional_split_partner_action",
        actionType: "split",
        effectiveDate: "2020-05-08",
        ratio: 1.2,
        sourceRecordId: "partner_ca_fractional_split"
      }
    ],
    benchmarkRecordId: "partner_benchmark_fractional_split",
    bars: [
      {
        close: 18,
        date: "2020-05-07",
        sourceRecordId: "partner_bar_fractional_split"
      }
    ],
    caseId: "fractional_split_partner",
    expected: {
      date: "2020-05-07",
      splitAdjustedClose: 15,
      totalReturnAdjustedClose: 15
    },
    instrumentId: "eq_bench_00019",
    source: "partner_reference",
    sourceRecordId: "partner_reference_fractional_split",
    tolerance: 0.0001
  },
  {
    actions: [
      {
        actionId: "bench_four_action_chain_public_split",
        actionType: "split",
        effectiveDate: "2020-06-01",
        ratio: 5,
        sourceRecordId: "public_ca_four_action_chain_split"
      },
      {
        actionId: "bench_four_action_chain_public_consolidation",
        actionType: "consolidation",
        effectiveDate: "2020-07-01",
        ratio: 0.4,
        sourceRecordId: "public_ca_four_action_chain_consolidation"
      },
      {
        actionId: "bench_four_action_chain_public_first_dividend",
        actionType: "dividend",
        cashAmount: 3,
        effectiveDate: "2020-08-03",
        reinvestmentPrice: 120,
        sourceRecordId: "public_ca_four_action_chain_first_dividend"
      },
      {
        actionId: "bench_four_action_chain_public_second_dividend",
        actionType: "dividend",
        cashAmount: 1,
        effectiveDate: "2020-09-01",
        reinvestmentPrice: 50,
        sourceRecordId: "public_ca_four_action_chain_second_dividend"
      }
    ],
    benchmarkRecordId: "public_benchmark_four_action_chain",
    bars: [
      {
        close: 200,
        date: "2020-05-29",
        sourceRecordId: "public_bar_four_action_chain"
      }
    ],
    caseId: "four_action_chain_public",
    expected: {
      date: "2020-05-29",
      splitAdjustedClose: 100,
      totalReturnAdjustedClose: 95.55
    },
    instrumentId: "eq_bench_00020",
    source: "public_exchange_reference",
    sourceRecordId: "public_reference_four_action_chain",
    tolerance: 0.0001
  }
];

function adjustObservation(
  bar: PriceObservation,
  actions: CorporateActionEvent[],
  factors: AdjustmentFactor[]
): AdjustedPriceObservation {
  assertPriceBar(bar);

  const appliedFactors = factors.filter((factor) =>
    appliesBeforeEffectiveDate(bar.date, factor.effectiveDate)
  );
  const splitFactor = multiplyFactors(
    appliedFactors.filter((factor) => factor.adjustmentType === "split_adjusted")
  );
  const totalReturnFactor = multiplyFactors(appliedFactors);

  return {
    appliedActionIds: [...new Set(appliedFactors.map((factor) => factor.actionId))],
    date: bar.date,
    rawClose: roundPrice(bar.close),
    sourceRecordId: bar.sourceRecordId,
    splitAdjustedClose: roundPrice(bar.close * splitFactor),
    splitFactor: roundFactor(splitFactor),
    totalReturnAdjustedClose: roundPrice(bar.close * totalReturnFactor),
    totalReturnFactor: roundFactor(totalReturnFactor)
  };
}

function createAdjustmentFactors(action: CorporateActionEvent): AdjustmentFactor[] {
  assertActionDate(action);

  if (action.actionType === "split" || action.actionType === "consolidation") {
    const ratio = action.ratio;

    if (ratio === undefined || !Number.isFinite(ratio) || ratio <= 0) {
      throw new CorporateActionAdjustmentError(
        "ACTION_FACTOR_INVALID",
        "split and consolidation actions require a positive ratio",
        {
          actionId: action.actionId,
          ratio
        }
      );
    }

    return [
      {
        actionId: action.actionId,
        adjustmentType: "split_adjusted",
        appliesTo: "bars_before_effective_date",
        effectiveDate: action.effectiveDate,
        factor: roundFactor(1 / ratio),
        sourceRecordId: action.sourceRecordId
      }
    ];
  }

  const cashAmount = action.cashAmount;
  const reinvestmentPrice = action.reinvestmentPrice;

  if (
    cashAmount === undefined ||
    reinvestmentPrice === undefined ||
    !Number.isFinite(cashAmount) ||
    !Number.isFinite(reinvestmentPrice) ||
    cashAmount < 0 ||
    reinvestmentPrice <= cashAmount
  ) {
    throw new CorporateActionAdjustmentError(
      "ACTION_FACTOR_INVALID",
      "dividend actions require non-negative cash and a reinvestment price above cash",
      {
        actionId: action.actionId,
        cashAmount,
        reinvestmentPrice
      }
    );
  }

  return [
    {
      actionId: action.actionId,
      adjustmentType: "total_return_adjusted",
      appliesTo: "bars_before_effective_date",
      effectiveDate: action.effectiveDate,
      factor: roundFactor((reinvestmentPrice - cashAmount) / reinvestmentPrice),
      sourceRecordId: action.sourceRecordId
    }
  ];
}

function assertActionDate(action: CorporateActionEvent): void {
  if (Number.isNaN(Date.parse(`${action.effectiveDate}T00:00:00Z`))) {
    throw new CorporateActionAdjustmentError(
      "ACTION_DATE_INVALID",
      "corporate action effectiveDate must be an ISO date",
      {
        actionId: action.actionId,
        effectiveDate: action.effectiveDate
      }
    );
  }
}

function assertPriceBar(bar: PriceObservation): void {
  if (
    Number.isNaN(Date.parse(`${bar.date}T00:00:00Z`)) ||
    !Number.isFinite(bar.close) ||
    bar.close < 0
  ) {
    throw new CorporateActionAdjustmentError(
      "PRICE_BAR_INVALID",
      "price observations require an ISO date and non-negative close",
      {
        close: bar.close,
        date: bar.date,
        sourceRecordId: bar.sourceRecordId
      }
    );
  }
}

function appliesBeforeEffectiveDate(barDate: string, effectiveDate: string): boolean {
  return Date.parse(`${barDate}T00:00:00Z`) < Date.parse(`${effectiveDate}T00:00:00Z`);
}

function multiplyFactors(factors: AdjustmentFactor[]): number {
  return factors.reduce((product, factor) => product * factor.factor, 1);
}

function roundFactor(value: number): number {
  return Math.round(value * 1_000_000_000) / 1_000_000_000;
}

function roundPrice(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}
