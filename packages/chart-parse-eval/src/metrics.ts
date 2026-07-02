import type { FieldOutcome, MatrixField, Tier } from "./compare";

/**
 * Metric shapes for the run summary and eval_runs.metrics (the three keys the
 * sprint acceptance names: schema_compliance / field_matrix / null_negative).
 */

export interface FieldCell {
  readonly n: number;
  readonly hits: number;
  readonly accuracy: number | null;
}

export interface SchemaCompliance {
  readonly total: number;
  readonly passed: number;
  readonly rate: number | null;
}

export interface NullNegative {
  readonly total: number;
  readonly passed: number;
  readonly rate: number | null;
}

export interface FieldMatrix {
  /** Samples whose dims are clear (degradation=none, info_missing=none), regardless of parse success. */
  readonly clear_sample_count: number;
  readonly anchor_tolerance: number;
  readonly p0: {
    readonly symbol: FieldCell;
    readonly exchange: FieldCell;
    readonly timeframe: FieldCell;
  };
  readonly p1: {
    readonly end_time: FieldCell;
    readonly indicator_names: FieldCell;
  };
  readonly p2: {
    readonly indicator_params: FieldCell;
    readonly drawn_line_anchors: FieldCell;
  };
  readonly tier_rollup: Readonly<Record<Tier, FieldCell>>;
  readonly auxiliary: {
    readonly patterns: FieldCell;
  };
}

export interface EvalMetrics {
  readonly schema_compliance: SchemaCompliance;
  readonly field_matrix: FieldMatrix;
  readonly null_negative: NullNegative;
}

/** One calibration observation: a model-reported confidence and its truth outcome. */
export interface ConfidenceObservation {
  readonly sample_id: string;
  readonly field: MatrixField;
  readonly tier: Tier;
  readonly confidence: number;
  readonly correct: boolean;
}

interface CellCounter {
  n: number;
  hits: number;
}

export function newCellCounter(): CellCounter {
  return { n: 0, hits: 0 };
}

export function countOutcome(counter: CellCounter, hit: boolean): void {
  counter.n += 1;
  if (hit) {
    counter.hits += 1;
  }
}

export function finalizeCell(counter: CellCounter): FieldCell {
  return {
    n: counter.n,
    hits: counter.hits,
    accuracy: counter.n > 0 ? counter.hits / counter.n : null
  };
}

export interface FieldMatrixInput {
  readonly clearSampleCount: number;
  readonly anchorTolerance: number;
  /** Field outcomes from clear-subset, schema-valid samples only. */
  readonly outcomes: readonly FieldOutcome[];
  readonly patterns: readonly { readonly applicable: boolean; readonly hit: boolean }[];
}

export function buildFieldMatrix(input: FieldMatrixInput): FieldMatrix {
  const fieldCounters = new Map<MatrixField, CellCounter>();
  const tierCounters: Record<Tier, CellCounter> = {
    p0: newCellCounter(),
    p1: newCellCounter(),
    p2: newCellCounter()
  };
  for (const outcome of input.outcomes) {
    if (!outcome.applicable) {
      continue;
    }
    const counter = fieldCounters.get(outcome.field) ?? newCellCounter();
    countOutcome(counter, outcome.hit);
    fieldCounters.set(outcome.field, counter);
    countOutcome(tierCounters[outcome.tier], outcome.hit);
  }
  const patternsCounter = newCellCounter();
  for (const pattern of input.patterns) {
    if (pattern.applicable) {
      countOutcome(patternsCounter, pattern.hit);
    }
  }
  const cell = (field: MatrixField): FieldCell =>
    finalizeCell(fieldCounters.get(field) ?? newCellCounter());
  return {
    clear_sample_count: input.clearSampleCount,
    anchor_tolerance: input.anchorTolerance,
    p0: {
      symbol: cell("symbol"),
      exchange: cell("exchange"),
      timeframe: cell("timeframe")
    },
    p1: {
      end_time: cell("end_time"),
      indicator_names: cell("indicator_names")
    },
    p2: {
      indicator_params: cell("indicator_params"),
      drawn_line_anchors: cell("drawn_line_anchors")
    },
    tier_rollup: {
      p0: finalizeCell(tierCounters.p0),
      p1: finalizeCell(tierCounters.p1),
      p2: finalizeCell(tierCounters.p2)
    },
    auxiliary: {
      patterns: finalizeCell(patternsCounter)
    }
  };
}

export function buildRatio(total: number, passed: number): { total: number; passed: number; rate: number | null } {
  return { total, passed, rate: total > 0 ? passed / total : null };
}
