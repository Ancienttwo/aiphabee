export const CORPORATE_ACTION_ADJUSTMENT_ENGINE_VERSION =
  "2026-06-20.phase1.corporate-action-engine.v0";
export const CORPORATE_ACTION_ADJUSTMENT_METHODOLOGY_VERSION =
  "corporate-action-adjustment@synthetic-v0";

export type CorporateActionType = "consolidation" | "dividend" | "split";
export type CorporateActionAdjustmentType =
  | "raw"
  | "split_adjusted"
  | "total_return_adjusted";
export type CorporateActionAdjustmentDirection = "backward_adjusted";
export type CorporateActionAdjustmentErrorCode =
  | "ACTION_DATE_INVALID"
  | "ACTION_FACTOR_INVALID"
  | "PRICE_BAR_INVALID";

export interface CorporateActionEvent {
  actionId: string;
  actionType: CorporateActionType;
  cashAmount?: number;
  effectiveDate: string;
  ratio?: number;
  reinvestmentPrice?: number;
  sourceRecordId: string;
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
