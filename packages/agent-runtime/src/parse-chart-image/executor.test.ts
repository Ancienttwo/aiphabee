import { describe, expect, it } from "vitest";
import { CHART_PARSE_CONTRACT, safeParseChartParseResult } from "../chart-parse";
import { createParseChartImageExecutor } from "./executor";
import {
  createStoredChartImageFetchImage,
  removeChartImage,
  uploadChartImage,
  type ChartImageMetadataStore,
  type ChartImageObjectStore,
  type ChartImageRecord
} from "./image-store";
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

    expect(outcome.data_status).toBe("parsed_pending_confirmation");
    expect(outcome.evidence_candidate).toMatchObject({
      calibration_status: "not_used",
      claim_label: "inference",
      evidence_strength: "weak",
      route_decision: "user_confirm",
      route_reason: "no_calibration_lookup",
      source_record_id: outcome.record_id,
      source_tool: "parse_chart_image",
      tenant_id: "tenant-a"
    });
    expect(outcome.evidence_candidate?.warnings).toEqual([
      "no_calibration_lookup",
      "chart_time_unverified"
    ]);

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

    expect(outcome.data_status).toBe("parsed");
    expect(outcome.evidence_candidate).toMatchObject({
      calibration_run_id: "cal-ready",
      calibration_status: "ready_used",
      evidence_strength: "medium",
      route_decision: "auto_match",
      route_reason: "auto_match_threshold_met"
    });
    expect(outcome.evidence_candidate?.evidence_strength).not.toBe("strong");
    expect(outcome.evidence_candidate?.warnings).toEqual(["chart_time_unverified"]);
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
    expect(outcome.data_status).toBe("unavailable");
    expect(outcome.evidence_candidate).toBeNull();

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

    expect(outcome.evidence_candidate?.warnings).toEqual([
      "repair_applied",
      "no_calibration_lookup",
      "chart_time_unverified"
    ]);
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

    expect(outcome.data_status).toBe("unavailable");
    expect(outcome.evidence_candidate).toBeNull();
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

describe("createParseChartImageExecutor with the production image-store fetchImage", () => {
  const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
  const HASH = `sha256:${"a".repeat(64)}`;

  const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  const makeStoredImageHarness = async () => {
    const records = new Map<string, ChartImageRecord>();
    const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();

    const metadataStore: ChartImageMetadataStore = {
      findActiveById: async ({ id, tenant_id }) =>
        [...records.values()].find(
          (record) =>
            record.id === id && record.tenant_id === tenant_id && record.deleted_at === null
        ) ?? null,
      findActiveByKey: async ({ r2_key, tenant_id }) =>
        records.get(`${tenant_id}:${r2_key}`)?.deleted_at === null
          ? (records.get(`${tenant_id}:${r2_key}`) ?? null)
          : null,
      insert: async (record) => {
        records.set(`${record.tenant_id}:${record.r2_key}`, record);
      },
      markRemoved: async ({ id, removed_at, tenant_id }) => {
        const record =
          [...records.values()].find(
            (candidate) => candidate.id === id && candidate.tenant_id === tenant_id
          ) ?? null;
        if (record === null || record.deleted_at !== null) {
          return null;
        }
        const next = { ...record, deleted_at: removed_at };
        records.set(`${record.tenant_id}:${record.r2_key}`, next);
        return next;
      }
    };

    const objectStore: ChartImageObjectStore = {
      get: async (key) => {
        const object = objects.get(key);
        return object
          ? {
              arrayBuffer: async () => toArrayBuffer(object.bytes),
              mediaType: object.contentType
            }
          : null;
      },
      put: async (key, bytes, options) => {
        objects.set(key, { bytes, contentType: options.contentType });
      },
      remove: async (key) => {
        objects.delete(key);
      }
    };

    const uploaded = await uploadChartImage({
      bytes: PNG_BYTES,
      contentType: "image/png",
      generateId: () => "img-1",
      hashBytes: async () => HASH,
      metadataStore,
      nowIso: () => "2026-07-09T00:00:00.000Z",
      objectStore,
      tenant_id: "tenant-a",
      user_id: "user-a"
    });

    return {
      fetchImage: createStoredChartImageFetchImage({ metadataStore, objectStore }),
      metadataStore,
      objectStore,
      uploaded
    };
  };

  it("keeps a wrong-tenant request unavailable with zero model calls", async () => {
    const stored = await makeStoredImageHarness();
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps, sink } = makeHarness(model, { fetchImage: stored.fetchImage });

    const outcome = await createParseChartImageExecutor(deps)({
      analysis_run_id: null,
      image_ref: stored.uploaded.image_ref,
      tenant_id: "tenant-b"
    });

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(outcome.model_call_count).toBe(0);
    expect(outcome.status).toBe("parse_failed");
    expect(outcome.error_code).toBe("image_not_found");
    expect(outcome.data_status).toBe("unavailable");
    expect(outcome.evidence_candidate).toBeNull();
    expect(sink.rows[0].status).toBe("parse_failed");
  });

  it("keeps a hostile data:image ref unavailable and out of the evidence candidate", async () => {
    const stored = await makeStoredImageHarness();
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps } = makeHarness(model, { fetchImage: stored.fetchImage });

    const outcome = await createParseChartImageExecutor(deps)({
      analysis_run_id: null,
      image_ref: "data:image/png;base64,iVBORw0KGgo=",
      tenant_id: "tenant-a"
    });

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(outcome.model_call_count).toBe(0);
    expect(outcome.status).toBe("parse_failed");
    expect(outcome.data_status).toBe("unavailable");
    expect(outcome.evidence_candidate).toBeNull();
    expect(
      JSON.stringify({
        data_status: outcome.data_status,
        evidence_candidate: outcome.evidence_candidate
      })
    ).not.toContain("data:image");
  });

  it("keeps a removed (inactive) ref unavailable with zero model calls", async () => {
    const stored = await makeStoredImageHarness();
    await removeChartImage({
      id: "img-1",
      metadataStore: stored.metadataStore,
      nowIso: () => "2026-07-09T00:05:00.000Z",
      objectStore: stored.objectStore,
      tenant_id: "tenant-a"
    });
    const model = makeVisionModelMockFromTexts([JSON.stringify(CLEAR_SAMPLE_RESULT)]);
    const { deps } = makeHarness(model, { fetchImage: stored.fetchImage });

    const outcome = await createParseChartImageExecutor(deps)({
      analysis_run_id: null,
      image_ref: stored.uploaded.image_ref,
      tenant_id: "tenant-a"
    });

    expect(model.doGenerateCalls).toHaveLength(0);
    expect(outcome.model_call_count).toBe(0);
    expect(outcome.status).toBe("parse_failed");
    expect(outcome.data_status).toBe("unavailable");
    expect(outcome.evidence_candidate).toBeNull();
  });
});
