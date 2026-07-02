import { describe, expect, it } from "vitest";
import { stableStringify } from "@aiphabee/chart-golden-set";
import { executeEvalRun } from "./run";
import {
  CLEAR_DIMS,
  DEGRADED_DIMS,
  FULL_TRUTH,
  NEGATIVE_DIMS,
  NEGATIVE_TRUTH,
  makeFixture,
  makeManifest,
  makeSample,
  perfectParse
} from "./test-util";

const MANIFEST = makeManifest([
  makeSample("cgs-000", CLEAR_DIMS, FULL_TRUTH),
  makeSample("cgs-001", CLEAR_DIMS, FULL_TRUTH),
  makeSample("cgs-002", NEGATIVE_DIMS, NEGATIVE_TRUTH),
  makeSample("cgs-003", DEGRADED_DIMS, FULL_TRUTH),
  makeSample("cgs-004", CLEAR_DIMS, FULL_TRUTH)
]);

const WRONG_SYMBOL = {
  ...(perfectParse(FULL_TRUTH) as Record<string, unknown>),
  symbol: { value: "9988.HK", confidence: 0.3 }
};

const FIXTURE = makeFixture({
  "cgs-000": { raw: perfectParse(FULL_TRUTH), token_cost: 1500, latency_ms: 900 },
  "cgs-001": { raw: WRONG_SYMBOL, token_cost: 1500, latency_ms: 950 },
  "cgs-002": { raw: perfectParse(NEGATIVE_TRUTH), token_cost: 1400, latency_ms: 800 },
  "cgs-003": { raw: { not: "a chart parse result" }, token_cost: 1300, latency_ms: 700 },
  "cgs-004": { error_code: "vision_timeout" }
});

const INPUT = {
  manifest: MANIFEST,
  fixture: FIXTURE,
  anchorTolerance: 0.05,
  fixtureSha256: "f".repeat(64)
};

describe("executeEvalRun", () => {
  it("produces the three metric keys with ChartBench semantics", () => {
    const { run } = executeEvalRun(INPUT);
    expect(Object.keys(run.metrics).sort()).toEqual([
      "field_matrix",
      "null_negative",
      "schema_compliance"
    ]);
    // 5 outputs: 3 schema-valid, 1 invalid raw, 1 error_code
    expect(run.metrics.schema_compliance).toMatchObject({ total: 5, passed: 3 });
    expect(run.metrics.schema_compliance.rate).toBeCloseTo(0.6, 10);
    // clear subset = cgs-000 (hit), cgs-001 (symbol miss); cgs-003 degraded, cgs-004 error
    expect(run.metrics.field_matrix.clear_sample_count).toBe(3);
    expect(run.metrics.field_matrix.p0.symbol).toMatchObject({ n: 2, hits: 1 });
    expect(run.metrics.field_matrix.p1.end_time).toMatchObject({ n: 2, hits: 2 });
    expect(run.metrics.field_matrix.anchor_tolerance).toBe(0.05);
    // negative subset = cgs-002 only
    expect(run.metrics.null_negative).toMatchObject({ total: 1, passed: 1, rate: 1 });
  });

  it("carries contract, manifest, and fixture versions on the run row", () => {
    const { run } = executeEvalRun(INPUT);
    expect(run.golden_set_version).toBe(MANIFEST.set_version);
    expect(run.schema_version).toBe(FIXTURE.schema_version);
    expect(run.prompt_version).toBe(FIXTURE.prompt_version);
    expect(run.model_version).toBe(FIXTURE.model_version);
    expect(run.status).toBe("completed");
    expect(run.id).toMatch(/^cper-[0-9a-f]{16}$/u);
  });

  it("emits one replayable row per sample in manifest order", () => {
    const { run, samples } = executeEvalRun(INPUT);
    expect(samples.map((row) => row.sample_id)).toEqual([
      "cgs-000",
      "cgs-001",
      "cgs-002",
      "cgs-003",
      "cgs-004"
    ]);
    for (const row of samples) {
      expect(row.eval_run_id).toBe(run.id);
      expect(row.id).toBe(`${run.id}-${row.sample_id}`);
    }
    const byId = new Map(samples.map((row) => [row.sample_id, row]));
    expect(byId.get("cgs-001")?.field_accuracy).toMatchObject({
      symbol: { hit: false },
      end_time: { hit: true }
    });
    expect(byId.get("cgs-002")?.null_negative_pass).toBe(true);
    expect(byId.get("cgs-000")?.null_negative_pass).toBeNull();
    expect(byId.get("cgs-003")?.field_accuracy).toBeNull();
    expect(byId.get("cgs-004")?.error_code).toBe("vision_timeout");
    expect(byId.get("cgs-004")?.parse_json).toBeNull();
    expect(byId.get("cgs-000")?.token_cost).toBe(1500);
    expect(byId.get("cgs-004")?.token_cost).toBeNull();
  });

  it("extracts confidence observations from every schema-valid sample's applicable fields", () => {
    const { observations } = executeEvalRun(INPUT);
    const sampleIds = new Set(observations.map((observation) => observation.sample_id));
    // cgs-003 (schema-invalid) and cgs-004 (error) contribute nothing;
    // the negative sample cgs-002 contributes its non-null fields.
    expect(sampleIds).toEqual(new Set(["cgs-000", "cgs-001", "cgs-002"]));
    const negativeFields = observations
      .filter((observation) => observation.sample_id === "cgs-002")
      .map((observation) => observation.field);
    expect(negativeFields).not.toContain("symbol");
    expect(negativeFields).toContain("timeframe");
    const symbolMiss = observations.find(
      (observation) => observation.sample_id === "cgs-001" && observation.field === "symbol"
    );
    expect(symbolMiss).toMatchObject({ tier: "p0", confidence: 0.3, correct: false });
  });

  it("is deterministic: identical input yields byte-identical results", () => {
    const first = executeEvalRun(INPUT);
    const second = executeEvalRun(INPUT);
    expect(stableStringify(second)).toBe(stableStringify(first));
  });

  it("changes the run id when the fixture bytes change", () => {
    const { run } = executeEvalRun(INPUT);
    const other = executeEvalRun({ ...INPUT, fixtureSha256: "e".repeat(64) });
    expect(other.run.id).not.toBe(run.id);
  });
});
