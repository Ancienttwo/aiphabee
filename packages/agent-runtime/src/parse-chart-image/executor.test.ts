import { describe, expect, it } from "vitest";
import { CHART_PARSE_CONTRACT, safeParseChartParseResult } from "../chart-parse";
import { createParseChartImageExecutor } from "./executor";
import { createInMemoryChartParseResultSink } from "./sink";
import type { ParseChartImageDeps } from "./types";
import {
  CLEAR_SAMPLE_IMAGE_REF,
  CLEAR_SAMPLE_RESULT,
  FETCHED_IMAGE,
  makeTextGeneration,
  makeVisionModelMock,
  makeVisionModelMockFromTexts
} from "./test-util";

const MODEL_VERSION = "google-ai-studio/gemini-2.5-flash";

const REQUEST = {
  analysis_run_id: null,
  image_ref: CLEAR_SAMPLE_IMAGE_REF,
  tenant_id: "tenant-a"
};

const EXPECTED_ROW_KEYS = [
  "analysis_run_id",
  "calibration_run_id",
  "error_code",
  "id",
  "image_ref",
  "latency_ms",
  "model_version",
  "prompt_version",
  "result_json",
  "schema_version",
  "status",
  "tenant_id",
  "token_cost"
];

const makeHarness = (
  model: ParseChartImageDeps["model"],
  overrides: Partial<ParseChartImageDeps> = {}
) => {
  const sink = createInMemoryChartParseResultSink();
  let idCounter = 0;
  let clock = 1_000;
  const deps: ParseChartImageDeps = {
    fetchImage: async (imageRef) =>
      imageRef === CLEAR_SAMPLE_IMAGE_REF ? FETCHED_IMAGE : null,
    generateId: () => {
      idCounter += 1;
      return `row-${idCounter}`;
    },
    model,
    modelVersion: MODEL_VERSION,
    now: () => {
      clock += 250;
      return clock;
    },
    sink,
    ...overrides
  };
  return { deps, sink };
};

describe("createParseChartImageExecutor", () => {
  it("returns a zod-checked ChartParseResult for the clear-sample fixture and records an imageRef-only row", async () => {
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps, sink } = makeHarness(model);

    const outcome = await createParseChartImageExecutor(deps)(REQUEST);

    expect(outcome.status).toBe("ready");
    expect(outcome.model_call_count).toBe(1);
    expect(outcome.repair_applied).toBe(false);
    expect(outcome.error_code).toBeNull();
    expect(outcome.calibration_run_id).toBeNull();
    expect(outcome.route_decision).toBe("user_confirm");
    expect(safeParseChartParseResult(outcome.result).success).toBe(true);
    expect(outcome.result).toEqual(CLEAR_SAMPLE_RESULT);

    expect(sink.rows).toHaveLength(1);
    const row = sink.rows[0];
    expect(Object.keys(row).sort()).toEqual(EXPECTED_ROW_KEYS);
    expect(row.id).toBe("row-1");
    expect(row.image_ref).toBe(CLEAR_SAMPLE_IMAGE_REF);
    expect(typeof row.image_ref).toBe("string");
    expect(row.result_json).toEqual(CLEAR_SAMPLE_RESULT);
    expect(row.schema_version).toBe(CHART_PARSE_CONTRACT.schemaVersion);
    expect(row.prompt_version).toBe(CHART_PARSE_CONTRACT.promptVersion);
    expect(row.model_version).toBe(MODEL_VERSION);
    expect(row.calibration_run_id).toBeNull();
    expect(row.status).toBe("ready");
    expect(row.error_code).toBeNull();
    expect(row.token_cost).toBe(150);
    expect(row.latency_ms).toBeGreaterThan(0);

    const binaryValues = Object.values(row).filter(
      (value) => value instanceof Uint8Array || value instanceof ArrayBuffer
    );
    expect(binaryValues).toHaveLength(0);
  });

  it("passes tenant context into fetchImage before any model call", async () => {
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const fetchedContexts: Array<{ imageRef: string; tenant_id: string }> = [];
    const { deps } = makeHarness(model, {
      fetchImage: async (imageRef, context) => {
        fetchedContexts.push({ imageRef, tenant_id: context.tenant_id });
        return FETCHED_IMAGE;
      }
    });

    await createParseChartImageExecutor(deps)(REQUEST);

    expect(fetchedContexts).toEqual([
      {
        imageRef: CLEAR_SAMPLE_IMAGE_REF,
        tenant_id: "tenant-a"
      }
    ]);
  });

  it("stores calibration_run_id only when a ready matching calibration drives routing", async () => {
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps, sink } = makeHarness(model, {
      calibrationLookup: {
        findCalibration: async (input) => ({
          id: "cal-ready",
          model_version: input.model_version,
          prompt_version: input.prompt_version,
          sample_count: 50,
          schema_version: input.schema_version,
          status: "ready",
          thresholds: {
            tiers: {
              p0: {
                auto_match_min_confidence: 0.9,
                confirm_min_confidence: 0.6
              },
              p1: {
                auto_match_min_confidence: 0.8,
                confirm_min_confidence: 0.55
              },
              p2: {
                auto_match_min_confidence: 0.7,
                confirm_min_confidence: 0.5
              }
            }
          }
        })
      }
    });

    const outcome = await createParseChartImageExecutor(deps)(REQUEST);

    expect(outcome.calibration_run_id).toBe("cal-ready");
    expect(outcome.route_decision).toBe("auto_match");
    expect(sink.rows[0].calibration_run_id).toBe("cal-ready");
  });

  it("sends the frozen contract prompt and the image bytes to the vision model", async () => {
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps } = makeHarness(model);

    await createParseChartImageExecutor(deps)(REQUEST);

    expect(model.doGenerateCalls).toHaveLength(1);
    const parts = model.doGenerateCalls[0].prompt
      .filter((message) => message.role === "user")
      .flatMap((message) => message.content);
    const promptText = parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .filter((text) => text.length > 0)
      .join("\n");
    expect(promptText).toBe(CHART_PARSE_CONTRACT.buildPrompt());
    expect(parts.some((part) => part.type === "file")).toBe(true);
  });

  it("retries the model at most once on unrepairable output and degrades to parse_failed without a partial result", async () => {
    const model = makeVisionModelMockFromTexts(['{"chart_type": {', '{"chart_type": {']);
    const { deps, sink } = makeHarness(model);

    const outcome = await createParseChartImageExecutor(deps)(REQUEST);

    expect(model.doGenerateCalls).toHaveLength(2);
    expect(outcome.model_call_count).toBe(2);
    expect(outcome.status).toBe("parse_failed");
    expect(outcome.result).toBeNull();
    expect(outcome.error_code).not.toBeNull();

    const row = sink.rows[0];
    expect(row.status).toBe("parse_failed");
    expect(row.result_json).toBeNull();
    expect(row.error_code).not.toBeNull();
    expect(row.token_cost).toBe(300);
  });

  it("repairs locally before spending the retry: repairable output succeeds with a single model call", async () => {
    const repairable = `${JSON.stringify(CLEAR_SAMPLE_RESULT).slice(0, -1)},}`;
    const model = makeVisionModelMockFromTexts([repairable]);
    const { deps, sink } = makeHarness(model);

    const outcome = await createParseChartImageExecutor(deps)(REQUEST);

    expect(model.doGenerateCalls).toHaveLength(1);
    expect(outcome.model_call_count).toBe(1);
    expect(outcome.repair_applied).toBe(true);
    expect(outcome.status).toBe("ready");
    expect(outcome.result).toEqual(CLEAR_SAMPLE_RESULT);
    expect(sink.rows[0].status).toBe("ready");
    expect(sink.rows[0].result_json).toEqual(CLEAR_SAMPLE_RESULT);
  });

  it("does not call the model when the image cannot be fetched", async () => {
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps, sink } = makeHarness(model);

    const outcome = await createParseChartImageExecutor(deps)({
      ...REQUEST,
      image_ref: "charts/tenant-a/missing"
    });

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(outcome.model_call_count).toBe(0);
    expect(outcome.status).toBe("parse_failed");
    expect(outcome.error_code).toBe("image_not_found");
    expect(sink.rows).toHaveLength(1);
    expect(sink.rows[0].status).toBe("parse_failed");
    expect(sink.rows[0].token_cost).toBe(0);
  });

  it("still records an audit row when the image fetch itself throws", async () => {
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps, sink } = makeHarness(model, {
      fetchImage: async () => {
        throw new Error("r2 unavailable");
      }
    });

    const outcome = await createParseChartImageExecutor(deps)(REQUEST);

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(outcome.status).toBe("parse_failed");
    expect(outcome.error_code).toBe("image_fetch_failed");
    expect(sink.rows).toHaveLength(1);
    expect(sink.rows[0].error_code).toBe("image_fetch_failed");
  });

  it("records zero cost when the provider reports no usage", async () => {
    const model = makeVisionModelMock([
      makeTextGeneration(JSON.stringify(CLEAR_SAMPLE_RESULT), {
        input: undefined,
        output: undefined
      })
    ]);
    const { deps, sink } = makeHarness(model);

    const outcome = await createParseChartImageExecutor(deps)(REQUEST);

    expect(outcome.status).toBe("ready");
    expect(sink.rows[0].token_cost).toBe(0);
  });
});
