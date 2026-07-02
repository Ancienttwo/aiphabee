import { safeParseChartParseResult } from "@aiphabee/agent-runtime/chart-parse";
import {
  sha256Hex,
  stableStringify,
  type GoldenSample,
  type GoldenSetManifest
} from "@aiphabee/chart-golden-set";
import { compareSample, nullNegativeOutcome, patternsOutcome } from "./compare";
import type { FieldOutcome } from "./compare";
import {
  buildFieldMatrix,
  buildRatio,
  type ConfidenceObservation,
  type EvalMetrics
} from "./metrics";
import type { EvalFixture, FixtureOutput } from "./fixture";

/** Runner-derived error code for outputs that fail the zod contract. */
export const SCHEMA_VALIDATION_ERROR_CODE = "schema_validation_failed";

export interface EvalRunRecord {
  readonly id: string;
  readonly golden_set_version: string;
  readonly schema_version: string;
  readonly prompt_version: string;
  readonly model_version: string;
  readonly metrics: EvalMetrics;
  readonly status: "completed";
}

export interface EvalSampleRecord {
  readonly id: string;
  readonly eval_run_id: string;
  readonly sample_id: string;
  readonly parse_json: unknown;
  readonly field_accuracy: Readonly<
    Record<string, { readonly hit: boolean; readonly detail: string | null }>
  > | null;
  readonly null_negative_pass: boolean | null;
  readonly error_code: string | null;
  readonly token_cost: number | null;
  readonly latency_ms: number | null;
}

export interface EvalRunResult {
  readonly run: EvalRunRecord;
  readonly samples: readonly EvalSampleRecord[];
  readonly observations: readonly ConfidenceObservation[];
}

export interface EvalRunInput {
  readonly manifest: GoldenSetManifest;
  readonly fixture: EvalFixture;
  readonly anchorTolerance: number;
  /** sha256 of the fixture bytes; part of the deterministic run id. */
  readonly fixtureSha256: string;
}

function isClearSample(sample: GoldenSample): boolean {
  return (
    sample.variant_dims.degradation === "none" && sample.variant_dims.info_missing === "none"
  );
}

function isNegativeSample(sample: GoldenSample): boolean {
  return sample.variant_dims.info_missing !== "none";
}

function deriveRunId(input: EvalRunInput): string {
  const seedDoc = stableStringify({
    anchor_tolerance: input.anchorTolerance,
    fixture_sha256: input.fixtureSha256,
    golden_set_version: input.manifest.set_version,
    model_version: input.fixture.model_version,
    prompt_version: input.fixture.prompt_version,
    schema_version: input.fixture.schema_version
  });
  return `cper-${sha256Hex(seedDoc).slice(0, 16)}`;
}

function fieldAccuracyOf(
  outcomes: readonly FieldOutcome[]
): Record<string, { hit: boolean; detail: string | null }> {
  const accuracy: Record<string, { hit: boolean; detail: string | null }> = {};
  for (const outcome of outcomes) {
    if (outcome.applicable) {
      accuracy[outcome.field] = { hit: outcome.hit, detail: outcome.detail };
    }
  }
  return accuracy;
}

/**
 * Replay every manifest sample through the fixture and aggregate the three
 * acceptance metrics. Pure and deterministic: identical input objects yield
 * byte-identical results (no clock, no randomness, manifest order preserved).
 * Fixture coverage is the CLI's gate; an uncovered sample here is a bug.
 */
export function executeEvalRun(input: EvalRunInput): EvalRunResult {
  const runId = deriveRunId(input);
  const samples: EvalSampleRecord[] = [];
  const observations: ConfidenceObservation[] = [];
  const clearOutcomes: FieldOutcome[] = [];
  const clearPatterns: { applicable: boolean; hit: boolean }[] = [];
  let schemaTotal = 0;
  let schemaPassed = 0;
  let clearSampleCount = 0;
  let negativeTotal = 0;
  let negativePassed = 0;

  for (const sample of input.manifest.samples) {
    const output: FixtureOutput | undefined = input.fixture.outputs[sample.id];
    if (output === undefined) {
      throw new Error(`fixture does not cover sample ${sample.id}; gate coverage before running`);
    }
    const clear = isClearSample(sample);
    const negative = isNegativeSample(sample);
    if (clear) {
      clearSampleCount += 1;
    }
    if (negative) {
      negativeTotal += 1;
    }
    schemaTotal += 1;

    const tokenCost = output.token_cost ?? null;
    const latencyMs = output.latency_ms ?? null;
    const base = {
      id: `${runId}-${sample.id}`,
      eval_run_id: runId,
      sample_id: sample.id,
      token_cost: tokenCost,
      latency_ms: latencyMs
    };

    if (!("raw" in output)) {
      samples.push({
        ...base,
        parse_json: null,
        field_accuracy: null,
        null_negative_pass: negative ? false : null,
        error_code: output.error_code
      });
      continue;
    }

    const parseResult = safeParseChartParseResult(output.raw);
    if (!parseResult.success) {
      samples.push({
        ...base,
        parse_json: output.raw,
        field_accuracy: null,
        null_negative_pass: negative ? false : null,
        error_code: SCHEMA_VALIDATION_ERROR_CODE
      });
      continue;
    }
    schemaPassed += 1;

    const parsed = parseResult.data;
    let nullNegativePass: boolean | null = null;

    // Truth comparison runs for every schema-valid sample: the field matrix
    // aggregates the clear subset only (PRD "清晰图字段矩阵"), but calibration
    // observations deliberately include degraded and info-missing samples'
    // non-null fields — the golden set is negative-heavy (clear subset is a
    // small minority) and production confidence must be calibrated on hard
    // samples, not only on clean ones.
    const outcomes = compareSample(parsed, sample.truth, {
      anchorTolerance: input.anchorTolerance
    });
    const fieldAccuracy = fieldAccuracyOf(outcomes);
    for (const outcome of outcomes) {
      if (outcome.applicable && outcome.confidence !== null) {
        observations.push({
          sample_id: sample.id,
          field: outcome.field,
          tier: outcome.tier,
          confidence: outcome.confidence,
          correct: outcome.hit
        });
      }
    }
    if (clear) {
      clearOutcomes.push(...outcomes);
      clearPatterns.push(patternsOutcome(parsed, sample.truth));
    }
    if (negative) {
      const outcome = nullNegativeOutcome(parsed, sample.truth);
      nullNegativePass = outcome.pass;
      if (outcome.pass) {
        negativePassed += 1;
      }
    }

    samples.push({
      ...base,
      parse_json: output.raw,
      field_accuracy: fieldAccuracy,
      null_negative_pass: nullNegativePass,
      error_code: null
    });
  }

  const metrics: EvalMetrics = {
    schema_compliance: buildRatio(schemaTotal, schemaPassed),
    field_matrix: buildFieldMatrix({
      clearSampleCount,
      anchorTolerance: input.anchorTolerance,
      outcomes: clearOutcomes,
      patterns: clearPatterns
    }),
    null_negative: buildRatio(negativeTotal, negativePassed)
  };

  return {
    run: {
      id: runId,
      golden_set_version: input.manifest.set_version,
      schema_version: input.fixture.schema_version,
      prompt_version: input.fixture.prompt_version,
      model_version: input.fixture.model_version,
      metrics,
      status: "completed"
    },
    samples,
    observations
  };
}
