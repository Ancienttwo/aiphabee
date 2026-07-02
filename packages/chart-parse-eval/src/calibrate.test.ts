import { describe, expect, it } from "vitest";
import { DEFAULT_TARGETS, MAPPING_FN_VERSION, calibrate, isotonicFit } from "./calibrate";
import type { ConfidenceObservation } from "./metrics";
import type { EvalRunRecord } from "./run";

const RUN: EvalRunRecord = {
  id: "cper-0123456789abcdef",
  golden_set_version: "set.v1",
  schema_version: "schema.v1",
  prompt_version: "prompt.v1",
  model_version: "model.v1",
  metrics: {
    schema_compliance: { total: 0, passed: 0, rate: null },
    field_matrix: null,
    null_negative: { total: 0, passed: 0, rate: null }
  } as never,
  status: "completed"
};

function observation(
  sampleIndex: number,
  field: ConfidenceObservation["field"],
  tier: ConfidenceObservation["tier"],
  confidence: number,
  correct: boolean
): ConfidenceObservation {
  return { sample_id: `cgs-${String(sampleIndex).padStart(3, "0")}`, field, tier, confidence, correct };
}

/** n distinct samples, each contributing one observation per tier. */
function balancedObservations(n: number, correctFrom: number): ConfidenceObservation[] {
  const observations: ConfidenceObservation[] = [];
  for (let i = 0; i < n; i += 1) {
    const confidence = i / (n - 1);
    const correct = confidence >= correctFrom;
    observations.push(observation(i, "symbol", "p0", confidence, correct));
    observations.push(observation(i, "end_time", "p1", confidence, correct));
    observations.push(observation(i, "indicator_params", "p2", confidence, correct));
  }
  return observations;
}

function calibrateWith(
  observations: ConfidenceObservation[],
  overrides: Partial<Parameters<typeof calibrate>[0]> = {}
) {
  return calibrate({
    run: RUN,
    observations,
    minSamples: 50,
    minTierObservations: 30,
    targets: DEFAULT_TARGETS,
    ...overrides
  });
}

describe("isotonicFit", () => {
  it("returns a non-decreasing step function over confidence", () => {
    const points = [
      { confidence: 0.1, correct: false },
      { confidence: 0.2, correct: true },
      { confidence: 0.3, correct: false },
      { confidence: 0.8, correct: true },
      { confidence: 0.9, correct: true }
    ];
    const curve = isotonicFit(points);
    for (let i = 1; i < curve.length; i += 1) {
      expect(curve[i]!.calibrated).toBeGreaterThanOrEqual(curve[i - 1]!.calibrated);
      expect(curve[i]!.confidence).toBeGreaterThan(curve[i - 1]!.confidence);
    }
    expect(curve[0]!.calibrated).toBeGreaterThanOrEqual(0);
    expect(curve[curve.length - 1]!.calibrated).toBeLessThanOrEqual(1);
  });

  it("pools adjacent violators (classic PAV fixture)", () => {
    const points = [
      { confidence: 0.1, correct: true },
      { confidence: 0.5, correct: false },
      { confidence: 0.9, correct: true }
    ];
    const curve = isotonicFit(points);
    // first two pool to 0.5, last stays 1
    expect(curve.map((step) => step.calibrated)).toEqual([0.5, 0.5, 1]);
  });
});

describe("calibrate — insufficient gates", () => {
  it("flags insufficient sample count and produces no thresholds and no run", () => {
    const outcome = calibrateWith(balancedObservations(10, 0.5));
    expect(outcome.status).toBe("insufficient");
    if (outcome.status !== "insufficient") {
      throw new Error("unreachable");
    }
    expect(outcome.sample_count).toBe(10);
    expect(outcome.reasons.join("\n")).toContain("sample_count");
    expect("run" in outcome).toBe(false);
  });

  it("flags a tier with too few observations", () => {
    const observations = balancedObservations(60, 0.5).filter(
      (candidate) => !(candidate.tier === "p2" && candidate.sample_id > "cgs-009")
    );
    const outcome = calibrateWith(observations);
    expect(outcome.status).toBe("insufficient");
    if (outcome.status !== "insufficient") {
      throw new Error("unreachable");
    }
    expect(outcome.reasons.join("\n")).toContain("p2");
  });
});

describe("calibrate — calibrated outcomes", () => {
  it("produces a ready run with data-derived thresholds and full lineage", () => {
    const outcome = calibrateWith(balancedObservations(60, 0.4));
    expect(outcome.status).toBe("calibrated");
    if (outcome.status !== "calibrated") {
      throw new Error("unreachable");
    }
    const { run } = outcome;
    expect(run.status).toBe("ready");
    expect(run.mapping_fn_version).toBe(MAPPING_FN_VERSION);
    expect(run.source_eval_run_id).toBe(RUN.id);
    expect(run.schema_version).toBe(RUN.schema_version);
    expect(run.prompt_version).toBe(RUN.prompt_version);
    expect(run.model_version).toBe(RUN.model_version);
    expect(run.golden_set_version).toBe(RUN.golden_set_version);
    expect(run.sample_count).toBe(60);
    expect(run.id).toMatch(/^ccal-[0-9a-f]{16}$/u);
    expect(run.thresholds).not.toBeNull();
    const thresholds = run.thresholds!;
    expect(thresholds.targets).toEqual(DEFAULT_TARGETS);
    for (const tier of ["p0", "p1", "p2"] as const) {
      const cutoffs = thresholds.tiers[tier];
      expect(cutoffs.auto_match_min_confidence).toBeGreaterThan(0);
      expect(cutoffs.auto_match_min_confidence).toBeLessThanOrEqual(1);
      expect(cutoffs.confirm_min_confidence).toBeLessThanOrEqual(
        cutoffs.auto_match_min_confidence!
      );
    }
    expect(thresholds.field_tier.symbol).toBe("p0");
    expect(run.reliability.tiers.p0.observation_count).toBe(60);
    expect(run.reliability.tiers.p0.bins).toHaveLength(10);
  });

  it("degrades to draft with null thresholds when a tier target is unreachable", () => {
    // p2 observations are always wrong -> calibrated accuracy stays 0
    const observations = balancedObservations(60, 0.4).map((candidate) =>
      candidate.tier === "p2" ? { ...candidate, correct: false } : candidate
    );
    const outcome = calibrateWith(observations);
    expect(outcome.status).toBe("calibrated");
    if (outcome.status !== "calibrated") {
      throw new Error("unreachable");
    }
    expect(outcome.run.status).toBe("draft");
    expect(outcome.run.thresholds).toBeNull();
    expect(outcome.run.reliability.tiers.p2.observation_count).toBe(60);
  });

  it("is deterministic for identical inputs", () => {
    const first = calibrateWith(balancedObservations(60, 0.4));
    const second = calibrateWith(balancedObservations(60, 0.4));
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });
});
