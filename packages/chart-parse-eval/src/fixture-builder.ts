import { CHART_PARSE_CONTRACT } from "@aiphabee/agent-runtime/chart-parse";
import {
  truthAsChartParseResult,
  type GoldenSample,
  type GoldenSetManifest
} from "@aiphabee/chart-golden-set";
import { FIXTURE_VERSION, type EvalFixture, type FixtureOutput } from "./fixture";

/**
 * Deterministic stand-in fixture derived from manifest truths: mostly a
 * perfect parser, with defects planted at fixed indices so every metric path
 * (schema failure, upstream error, low-confidence field miss) is exercised.
 * Used by the check script and local dry runs; not a model quality statement.
 */

export const FIXTURE_MODEL_VERSION = "fixture-derived.v1";

function isClearSample(sample: GoldenSample): boolean {
  return (
    sample.variant_dims.degradation === "none" && sample.variant_dims.info_missing === "none"
  );
}

function withWrongSymbol(raw: unknown, truthSymbol: string): unknown {
  const wrongSymbol = truthSymbol === "0700.HK" ? "9988.HK" : "0700.HK";
  return {
    ...(raw as Record<string, unknown>),
    symbol: { value: wrongSymbol, confidence: 0.2 }
  };
}

export function buildFixtureFromManifest(manifest: GoldenSetManifest): EvalFixture {
  const outputs: Record<string, FixtureOutput> = {};
  manifest.samples.forEach((sample, index) => {
    const tokenCost = 1500 + index;
    const latencyMs = 900 + index;
    if (index % 50 === 49) {
      outputs[sample.id] = {
        raw: { invalid_fixture_output: true },
        token_cost: tokenCost,
        latency_ms: latencyMs
      };
      return;
    }
    if (index % 50 === 24) {
      outputs[sample.id] = {
        error_code: "vision_timeout",
        token_cost: tokenCost,
        latency_ms: latencyMs
      };
      return;
    }
    let raw = truthAsChartParseResult(sample.truth);
    if (index % 25 === 12 && isClearSample(sample) && sample.truth.symbol !== null) {
      raw = withWrongSymbol(raw, sample.truth.symbol);
    }
    outputs[sample.id] = { raw, token_cost: tokenCost, latency_ms: latencyMs };
  });
  return {
    fixture_version: FIXTURE_VERSION,
    schema_version: CHART_PARSE_CONTRACT.schemaVersion,
    prompt_version: CHART_PARSE_CONTRACT.promptVersion,
    model_version: FIXTURE_MODEL_VERSION,
    outputs
  };
}
