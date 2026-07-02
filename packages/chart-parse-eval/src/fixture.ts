import { CHART_PARSE_CONTRACT } from "@aiphabee/agent-runtime/chart-parse";

/**
 * Replay fixture: the only parse source for eval runs in this package.
 *
 * A fixture freezes what a vision model (or a derived stand-in) answered for
 * every golden set sample, so metrics are replayable byte-for-byte offline.
 * A live provider channel is Module 4 scope; it must produce this same shape.
 */

export const FIXTURE_VERSION = "chart-parse-eval-fixture.v1";

export interface FixtureOutputSuccess {
  readonly raw: unknown;
  readonly token_cost?: number;
  readonly latency_ms?: number;
}

export interface FixtureOutputError {
  readonly error_code: string;
  readonly token_cost?: number;
  readonly latency_ms?: number;
}

export type FixtureOutput = FixtureOutputSuccess | FixtureOutputError;

export interface EvalFixture {
  readonly fixture_version: string;
  readonly schema_version: string;
  readonly prompt_version: string;
  readonly model_version: string;
  readonly outputs: Readonly<Record<string, FixtureOutput>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalMetric(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

/** Structural validation; returns human-readable violations (empty = valid). */
export function validateFixture(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["fixture must be a JSON object"];
  }
  const violations: string[] = [];
  if (value["fixture_version"] !== FIXTURE_VERSION) {
    violations.push(`fixture_version must be ${FIXTURE_VERSION}`);
  }
  for (const key of ["schema_version", "prompt_version", "model_version"] as const) {
    const version = value[key];
    if (typeof version !== "string" || version.length === 0) {
      violations.push(`${key} must be a non-empty string`);
    }
  }
  const outputs = value["outputs"];
  if (!isRecord(outputs)) {
    violations.push("outputs must be an object keyed by sample id");
    return violations;
  }
  for (const [sampleId, output] of Object.entries(outputs)) {
    if (!isRecord(output)) {
      violations.push(`outputs.${sampleId} must be an object`);
      continue;
    }
    const hasRaw = "raw" in output;
    const hasError = typeof output["error_code"] === "string" && output["error_code"].length > 0;
    if (hasRaw === hasError) {
      violations.push(`outputs.${sampleId} must carry exactly one of raw or error_code`);
    }
    if (!isOptionalMetric(output["token_cost"])) {
      violations.push(`outputs.${sampleId}.token_cost must be a non-negative number when present`);
    }
    if (!isOptionalMetric(output["latency_ms"])) {
      violations.push(`outputs.${sampleId}.latency_ms must be a non-negative number when present`);
    }
  }
  return violations;
}

/**
 * Version-drift gate: a fixture recorded against another schema/prompt version
 * must not be scored against the live contract (CLI maps this to exit 40).
 */
export function checkFixtureContract(fixture: EvalFixture): string | null {
  if (fixture.schema_version !== CHART_PARSE_CONTRACT.schemaVersion) {
    return `fixture schema_version ${fixture.schema_version} does not match live contract ${CHART_PARSE_CONTRACT.schemaVersion}`;
  }
  if (fixture.prompt_version !== CHART_PARSE_CONTRACT.promptVersion) {
    return `fixture prompt_version ${fixture.prompt_version} does not match live contract ${CHART_PARSE_CONTRACT.promptVersion}`;
  }
  return null;
}

/**
 * Coverage gate: outputs must map one-to-one onto manifest sample ids so a
 * run is always a complete replay (CLI maps violations to exit 60).
 */
export function checkFixtureCoverage(
  fixture: EvalFixture,
  sampleIds: readonly string[]
): string[] {
  const violations: string[] = [];
  const outputKeys = new Set(Object.keys(fixture.outputs));
  for (const sampleId of sampleIds) {
    if (!outputKeys.has(sampleId)) {
      violations.push(`fixture missing output for sample ${sampleId}`);
    }
  }
  const idSet = new Set(sampleIds);
  for (const key of [...outputKeys].sort()) {
    if (!idSet.has(key)) {
      violations.push(`fixture has output for unknown sample ${key}`);
    }
  }
  return violations;
}
