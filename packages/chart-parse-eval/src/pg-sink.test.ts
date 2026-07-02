import { describe, expect, it } from "vitest";
import { PgEvalSink } from "./pg-sink";
import { executeEvalRun } from "./run";
import { DEFAULT_TARGETS, calibrate } from "./calibrate";
import type { ConfidenceObservation } from "./metrics";
import {
  CLEAR_DIMS,
  FULL_TRUTH,
  makeFixture,
  makeManifest,
  makeSample,
  perfectParse
} from "./test-util";

interface RecordedQuery {
  readonly text: string;
  readonly values: readonly unknown[] | undefined;
}

class FakeQueryable {
  readonly calls: RecordedQuery[] = [];
  failOnMatch: string | null = null;

  async query(text: string, values?: readonly unknown[]): Promise<{ rowCount: number }> {
    if (this.failOnMatch !== null && text.includes(this.failOnMatch)) {
      throw new Error(`forced failure on: ${this.failOnMatch}`);
    }
    this.calls.push({ text, values });
    return { rowCount: 1 };
  }
}

function evalResult() {
  const manifest = makeManifest([makeSample("cgs-000", CLEAR_DIMS, FULL_TRUTH)]);
  const fixture = makeFixture({
    "cgs-000": { raw: perfectParse(FULL_TRUTH), token_cost: 1500, latency_ms: 900 }
  });
  return executeEvalRun({ manifest, fixture, anchorTolerance: 0.05, fixtureSha256: "f".repeat(64) });
}

function calibrationRun(status: "ready" | "draft") {
  const result = evalResult();
  const observations: ConfidenceObservation[] = [];
  for (let i = 0; i < 60; i += 1) {
    const confidence = i / 59;
    const correct = status === "ready" ? confidence >= 0.3 : false;
    observations.push({ sample_id: `cgs-${i}`, field: "symbol", tier: "p0", confidence, correct });
    observations.push({ sample_id: `cgs-${i}`, field: "end_time", tier: "p1", confidence, correct });
    observations.push({
      sample_id: `cgs-${i}`,
      field: "indicator_params",
      tier: "p2",
      confidence,
      correct
    });
  }
  const outcome = calibrate({
    run: result.run,
    observations,
    minSamples: 10,
    minTierObservations: 10,
    targets: DEFAULT_TARGETS
  });
  if (outcome.status !== "calibrated") {
    throw new Error("test setup must calibrate");
  }
  expect(outcome.run.status).toBe(status);
  return outcome.run;
}

describe("PgEvalSink.persistEvalRun", () => {
  it("wraps run + sample inserts in one transaction with idempotent conflicts", async () => {
    const queryable = new FakeQueryable();
    const sink = new PgEvalSink(queryable);
    const result = evalResult();
    await sink.persistEvalRun(result);

    const texts = queryable.calls.map((call) => call.text.replace(/\s+/gu, " ").trim());
    expect(texts[0]).toBe("begin");
    expect(texts[texts.length - 1]).toBe("commit");
    const runInsert = texts.find((text) => text.includes("insert into aiphabee_core.eval_runs"));
    expect(runInsert).toContain("on conflict (id) do nothing");
    const sampleInserts = texts.filter((text) =>
      text.includes("insert into aiphabee_core.eval_sample_results")
    );
    expect(sampleInserts).toHaveLength(result.samples.length);
    for (const insert of sampleInserts) {
      expect(insert).toContain("on conflict (id) do nothing");
    }
    const runCall = queryable.calls.find((call) =>
      call.text.includes("insert into aiphabee_core.eval_runs")
    );
    expect(runCall?.values?.[0]).toBe(result.run.id);
  });

  it("rolls back and rethrows when an insert fails", async () => {
    const queryable = new FakeQueryable();
    queryable.failOnMatch = "eval_sample_results";
    const sink = new PgEvalSink(queryable);
    await expect(sink.persistEvalRun(evalResult())).rejects.toThrow("forced failure");
    const texts = queryable.calls.map((call) => call.text.replace(/\s+/gu, " ").trim());
    expect(texts).toContain("rollback");
    expect(texts).not.toContain("commit");
  });
});

describe("PgEvalSink.persistCalibrationRun", () => {
  it("supersedes previous ready rows for the same version triple before inserting a ready run", async () => {
    const queryable = new FakeQueryable();
    const sink = new PgEvalSink(queryable);
    const run = calibrationRun("ready");
    await sink.persistCalibrationRun(run);

    const texts = queryable.calls.map((call) => call.text.replace(/\s+/gu, " ").trim());
    const supersedeIndex = texts.findIndex((text) =>
      text.includes("set status = 'superseded'")
    );
    const insertIndex = texts.findIndex((text) =>
      text.includes("insert into aiphabee_core.calibration_runs")
    );
    expect(supersedeIndex).toBeGreaterThan(0);
    expect(insertIndex).toBeGreaterThan(supersedeIndex);
    const supersede = queryable.calls[supersedeIndex]!;
    expect(supersede.text).toContain("status = 'ready'");
    expect(supersede.values).toEqual([
      run.schema_version,
      run.prompt_version,
      run.model_version,
      run.id
    ]);
  });

  it("does not supersede anything for a draft run", async () => {
    const queryable = new FakeQueryable();
    const sink = new PgEvalSink(queryable);
    await sink.persistCalibrationRun(calibrationRun("draft"));
    const texts = queryable.calls.map((call) => call.text);
    expect(texts.some((text) => text.includes("superseded"))).toBe(false);
    expect(texts.some((text) => text.includes("insert into aiphabee_core.calibration_runs"))).toBe(
      true
    );
  });
});
