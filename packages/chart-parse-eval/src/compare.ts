import type { ChartParseResult } from "@aiphabee/agent-runtime/chart-parse";
import type { SampleTruth } from "@aiphabee/chart-golden-set";

/**
 * Field-level truth comparison for the PRD Module 3 field matrix.
 *
 * Tier assignment follows PRD Success Criteria: P0 symbol/exchange/timeframe,
 * P1 end_time/visible indicator names, P2 indicator params/drawn-line anchors.
 */

export const FIELD_TIER = {
  symbol: "p0",
  exchange: "p0",
  timeframe: "p0",
  end_time: "p1",
  indicator_names: "p1",
  indicator_params: "p2",
  drawn_line_anchors: "p2"
} as const;

export type MatrixField = keyof typeof FIELD_TIER;
export type Tier = (typeof FIELD_TIER)[MatrixField];

export const FIELD_ORDER: readonly MatrixField[] = [
  "symbol",
  "exchange",
  "timeframe",
  "end_time",
  "indicator_names",
  "indicator_params",
  "drawn_line_anchors"
];

const SCALAR_FIELDS = ["symbol", "exchange", "timeframe", "end_time"] as const;
type ScalarField = (typeof SCALAR_FIELDS)[number];

export interface FieldOutcome {
  readonly field: MatrixField;
  readonly tier: Tier;
  /** Inapplicable fields (truth has nothing to compare) are excluded from cells. */
  readonly applicable: boolean;
  readonly hit: boolean;
  /** Model-reported confidence backing this field; null when none exists. */
  readonly confidence: number | null;
  readonly detail: string | null;
}

export interface CompareOptions {
  /** L-infinity tolerance for normalized anchor coordinates (flag, not a constant). */
  readonly anchorTolerance: number;
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortedUniqueNames(names: readonly string[]): string[] {
  return [...new Set(names)].sort();
}

function arraysEqual(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function scalarOutcome(
  field: ScalarField,
  parsed: ChartParseResult,
  truth: SampleTruth
): FieldOutcome {
  const truthValue = truth[field];
  const parsedField = parsed[field];
  const applicable = truthValue !== null;
  const hit = applicable && parsedField.value === truthValue;
  return {
    field,
    tier: FIELD_TIER[field],
    applicable,
    hit,
    confidence: parsedField.confidence,
    detail:
      applicable && !hit
        ? `expected ${String(truthValue)} got ${String(parsedField.value)}`
        : null
  };
}

function indicatorNamesOutcome(parsed: ChartParseResult, truth: SampleTruth): FieldOutcome {
  const truthNames = sortedUniqueNames(truth.indicators.map((indicator) => indicator.name));
  const parsedNames = sortedUniqueNames(parsed.indicators.map((indicator) => indicator.name));
  const hit = arraysEqual(truthNames, parsedNames);
  return {
    field: "indicator_names",
    tier: FIELD_TIER.indicator_names,
    applicable: true,
    hit,
    confidence: mean(parsed.indicators.map((indicator) => indicator.confidence)),
    detail: hit ? null : `expected [${truthNames.join(",")}] got [${parsedNames.join(",")}]`
  };
}

function indicatorParamsOutcome(parsed: ChartParseResult, truth: SampleTruth): FieldOutcome {
  const applicable = truth.indicators.length > 0;
  const truthNames = new Set(truth.indicators.map((indicator) => indicator.name));
  const relevantParsed = parsed.indicators.filter((indicator) => truthNames.has(indicator.name));
  const misses: string[] = [];
  for (const truthIndicator of truth.indicators) {
    const match = parsed.indicators.find((indicator) => indicator.name === truthIndicator.name);
    if (match === undefined) {
      misses.push(`${truthIndicator.name}: not parsed`);
      continue;
    }
    if (match.params === null || !arraysEqual(match.params, truthIndicator.params)) {
      misses.push(
        `${truthIndicator.name}: expected (${truthIndicator.params.join(",")}) got ${
          match.params === null ? "null" : `(${match.params.join(",")})`
        }`
      );
    }
  }
  const hit = applicable && misses.length === 0;
  return {
    field: "indicator_params",
    tier: FIELD_TIER.indicator_params,
    applicable,
    hit,
    confidence: mean(relevantParsed.map((indicator) => indicator.confidence)),
    detail: applicable && !hit ? misses.join("; ") : null
  };
}

function anchorsWithin(
  parsedAnchors: readonly { x: number; y: number }[],
  truthAnchors: readonly { x: number; y: number }[],
  tolerance: number
): boolean {
  if (parsedAnchors.length !== truthAnchors.length) {
    return false;
  }
  return truthAnchors.every((anchor, index) => {
    const candidate = parsedAnchors[index] as { x: number; y: number };
    return (
      Math.abs(candidate.x - anchor.x) <= tolerance && Math.abs(candidate.y - anchor.y) <= tolerance
    );
  });
}

function drawnLineAnchorsOutcome(
  parsed: ChartParseResult,
  truth: SampleTruth,
  tolerance: number
): FieldOutcome {
  const applicable = truth.drawn_lines.length > 0;
  const misses: string[] = [];
  const used = new Set<number>();
  if (applicable) {
    if (parsed.drawn_lines.length !== truth.drawn_lines.length) {
      misses.push(
        `expected ${truth.drawn_lines.length} lines got ${parsed.drawn_lines.length}`
      );
    }
    truth.drawn_lines.forEach((truthLine, truthIndex) => {
      const matchIndex = parsed.drawn_lines.findIndex(
        (candidate, index) =>
          !used.has(index) &&
          candidate.kind === truthLine.kind &&
          anchorsWithin(candidate.anchors, truthLine.anchors, tolerance)
      );
      if (matchIndex === -1) {
        misses.push(`line ${truthIndex} (${truthLine.kind}): no anchor match within ${tolerance}`);
        return;
      }
      used.add(matchIndex);
    });
  }
  const hit = applicable && misses.length === 0;
  return {
    field: "drawn_line_anchors",
    tier: FIELD_TIER.drawn_line_anchors,
    applicable,
    hit,
    confidence: mean(parsed.drawn_lines.map((line) => line.confidence)),
    detail: applicable && !hit ? misses.join("; ") : null
  };
}

/** Compare a schema-valid parse against truth; outcomes follow FIELD_ORDER. */
export function compareSample(
  parsed: ChartParseResult,
  truth: SampleTruth,
  options: CompareOptions
): FieldOutcome[] {
  return [
    scalarOutcome("symbol", parsed, truth),
    scalarOutcome("exchange", parsed, truth),
    scalarOutcome("timeframe", parsed, truth),
    scalarOutcome("end_time", parsed, truth),
    indicatorNamesOutcome(parsed, truth),
    indicatorParamsOutcome(parsed, truth),
    drawnLineAnchorsOutcome(parsed, truth, options.anchorTolerance)
  ];
}

export interface PatternsOutcome {
  readonly applicable: boolean;
  readonly hit: boolean;
}

/**
 * Auxiliary patterns observation (kept out of the tiers): a hit means every
 * truth pattern appears among the parsed candidates; extra candidates are not
 * penalized because the schema defines them as plausible candidates.
 */
export function patternsOutcome(parsed: ChartParseResult, truth: SampleTruth): PatternsOutcome {
  const applicable = truth.patterns.length > 0;
  const parsedPatterns = new Set(parsed.patterns.map((candidate) => candidate.pattern));
  return {
    applicable,
    hit: applicable && truth.patterns.every((pattern) => parsedPatterns.has(pattern))
  };
}

export interface NullNegativeResult {
  readonly expected_null_fields: string[];
  readonly pass: boolean;
}

/**
 * Null-over-guess check for info_missing samples: every scalar field the
 * truth blanked must parse as null (hallucinating any of them fails).
 */
export function nullNegativeOutcome(
  parsed: ChartParseResult,
  truth: SampleTruth
): NullNegativeResult {
  const expectedNullFields = SCALAR_FIELDS.filter((field) => truth[field] === null);
  const pass = expectedNullFields.every((field) => parsed[field].value === null);
  return { expected_null_fields: [...expectedNullFields], pass };
}
