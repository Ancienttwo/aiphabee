/**
 * Public library surface for @aiphabee/chart-parse-eval.
 *
 * Module 4 (parse_chart_image tool) and Module 5 (routing) consume the
 * record types and calibration semantics from here; the CLI is a thin shell
 * over runCli (see bin/chart-parse-eval.mjs).
 */

export { EXIT_CODES, runCli } from "./cli";
export {
  FIELD_ORDER,
  FIELD_TIER,
  compareSample,
  nullNegativeOutcome,
  patternsOutcome,
  type CompareOptions,
  type FieldOutcome,
  type MatrixField,
  type NullNegativeResult,
  type PatternsOutcome,
  type Tier
} from "./compare";
export {
  DEFAULT_TARGETS,
  MAPPING_FN_VERSION,
  calibrate,
  isotonicFit,
  type CalibrateInput,
  type CalibrateOutcome,
  type CalibrationRunRecord,
  type CalibrationThresholdTargets,
  type CalibrationThresholds,
  type IsotonicPoint,
  type IsotonicStep,
  type ReliabilityBin,
  type TierReliability,
  type TierThreshold
} from "./calibrate";
export {
  FIXTURE_VERSION,
  checkFixtureContract,
  checkFixtureCoverage,
  validateFixture,
  type EvalFixture,
  type FixtureOutput,
  type FixtureOutputError,
  type FixtureOutputSuccess
} from "./fixture";
export { FIXTURE_MODEL_VERSION, buildFixtureFromManifest } from "./fixture-builder";
export {
  buildFieldMatrix,
  buildRatio,
  type ConfidenceObservation,
  type EvalMetrics,
  type FieldCell,
  type FieldMatrix,
  type NullNegative,
  type SchemaCompliance
} from "./metrics";
export {
  SCHEMA_VALIDATION_ERROR_CODE,
  executeEvalRun,
  type EvalRunInput,
  type EvalRunRecord,
  type EvalRunResult,
  type EvalSampleRecord
} from "./run";
export { JsonArtifactSink, type ArtifactReceipt, type EvalSink } from "./sink";
export { PgEvalSink, type Queryable } from "./pg-sink";
