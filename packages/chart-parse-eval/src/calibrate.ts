import { sha256Hex, stableStringify } from "@aiphabee/chart-golden-set";
import type { ConfidenceObservation } from "./metrics";
import type { MatrixField, Tier } from "./compare";
import { FIELD_TIER } from "./compare";
import type { EvalRunRecord } from "./run";

/**
 * Offline confidence calibration (PRD Module 3): tier-pooled isotonic
 * regression over eval-run observations, thresholds derived from the fitted
 * curve. No route threshold is ever a constant in code; PRD's 0.85/0.60 are
 * reference initials only and appear nowhere here.
 */

export const MAPPING_FN_VERSION = "isotonic-pav.v1";

export interface CalibrationThresholdTargets {
  readonly auto: Readonly<Record<Tier, number>>;
  readonly confirm: Readonly<Record<Tier, number>>;
}

/**
 * Default calibration targets lifted from PRD Success Criteria: auto uses the
 * Target column (p0 95% / p1 90% / p2 80%), confirm uses the Degradation
 * Threshold column (85% / 80% / 70%). Overridable per run via CLI flags.
 */
export const DEFAULT_TARGETS: CalibrationThresholdTargets = {
  auto: { p0: 0.95, p1: 0.9, p2: 0.8 },
  confirm: { p0: 0.85, p1: 0.8, p2: 0.7 }
};

export interface IsotonicPoint {
  readonly confidence: number;
  readonly correct: boolean;
}

export interface IsotonicStep {
  readonly confidence: number;
  readonly calibrated: number;
}

/**
 * Pool-adjacent-violators isotonic fit. Points with equal confidence are
 * grouped first so the result is a single-valued, non-decreasing step
 * function over distinct confidences. Deterministic, dependency-free.
 */
export function isotonicFit(points: readonly IsotonicPoint[]): IsotonicStep[] {
  if (points.length === 0) {
    return [];
  }
  const grouped = new Map<number, { weight: number; sum: number }>();
  for (const point of points) {
    const bucket = grouped.get(point.confidence) ?? { weight: 0, sum: 0 };
    bucket.weight += 1;
    bucket.sum += point.correct ? 1 : 0;
    grouped.set(point.confidence, bucket);
  }
  const confidences = [...grouped.keys()].sort((left, right) => left - right);
  interface Block {
    weight: number;
    sum: number;
    memberCount: number;
  }
  const blocks: Block[] = [];
  for (const confidence of confidences) {
    const bucket = grouped.get(confidence) as { weight: number; sum: number };
    blocks.push({ weight: bucket.weight, sum: bucket.sum, memberCount: 1 });
    while (blocks.length > 1) {
      const last = blocks[blocks.length - 1] as Block;
      const previous = blocks[blocks.length - 2] as Block;
      if (previous.sum / previous.weight <= last.sum / last.weight) {
        break;
      }
      blocks.pop();
      blocks.pop();
      blocks.push({
        weight: previous.weight + last.weight,
        sum: previous.sum + last.sum,
        memberCount: previous.memberCount + last.memberCount
      });
    }
  }
  const steps: IsotonicStep[] = [];
  let cursor = 0;
  for (const block of blocks) {
    const calibrated = block.sum / block.weight;
    for (let member = 0; member < block.memberCount; member += 1) {
      steps.push({ confidence: confidences[cursor] as number, calibrated });
      cursor += 1;
    }
  }
  return steps;
}

export interface ReliabilityBin {
  readonly lo: number;
  readonly hi: number;
  readonly n: number;
  readonly mean_confidence: number | null;
  readonly empirical_accuracy: number | null;
}

export interface TierReliability {
  readonly observation_count: number;
  readonly bins: readonly ReliabilityBin[];
  readonly isotonic: readonly IsotonicStep[];
}

export interface TierThreshold {
  readonly auto_match_min_confidence: number | null;
  readonly confirm_min_confidence: number | null;
}

export interface CalibrationThresholds {
  readonly targets: CalibrationThresholdTargets;
  readonly tiers: Readonly<Record<Tier, TierThreshold>>;
  readonly field_tier: Readonly<Record<MatrixField, Tier>>;
}

export interface CalibrationRunRecord {
  readonly id: string;
  readonly source_eval_run_id: string;
  readonly golden_set_version: string;
  readonly schema_version: string;
  readonly prompt_version: string;
  readonly model_version: string;
  readonly sample_count: number;
  readonly mapping_fn_version: string;
  readonly thresholds: CalibrationThresholds | null;
  readonly reliability: { readonly tiers: Readonly<Record<Tier, TierReliability>> };
  readonly status: "ready" | "draft";
}

export type CalibrateOutcome =
  | { readonly status: "insufficient"; readonly reasons: string[]; readonly sample_count: number }
  | { readonly status: "calibrated"; readonly run: CalibrationRunRecord };

export interface CalibrateInput {
  readonly run: EvalRunRecord;
  readonly observations: readonly ConfidenceObservation[];
  readonly minSamples: number;
  readonly minTierObservations: number;
  readonly targets: CalibrationThresholdTargets;
}

const TIERS: readonly Tier[] = ["p0", "p1", "p2"];
const BIN_COUNT = 10;

function buildBins(points: readonly IsotonicPoint[]): ReliabilityBin[] {
  const bins: ReliabilityBin[] = [];
  for (let index = 0; index < BIN_COUNT; index += 1) {
    const lo = index / BIN_COUNT;
    const hi = (index + 1) / BIN_COUNT;
    const members = points.filter(
      (point) =>
        point.confidence >= lo && (index === BIN_COUNT - 1 ? point.confidence <= hi : point.confidence < hi)
    );
    const n = members.length;
    bins.push({
      lo,
      hi,
      n,
      mean_confidence:
        n > 0 ? members.reduce((sum, point) => sum + point.confidence, 0) / n : null,
      empirical_accuracy:
        n > 0 ? members.filter((point) => point.correct).length / n : null
    });
  }
  return bins;
}

function cutoff(curve: readonly IsotonicStep[], target: number): number | null {
  for (const step of curve) {
    if (step.calibrated >= target) {
      return step.confidence;
    }
  }
  return null;
}

/**
 * Calibrate an eval run's observations. Gates first (insufficient produces no
 * thresholds and no run row); a reachable-target curve for every tier yields
 * status "ready"; unreachable targets degrade to "draft" with null thresholds
 * so downstream auto-routing stays blocked (PRD failure path 2).
 */
export function calibrate(input: CalibrateInput): CalibrateOutcome {
  const sampleCount = new Set(input.observations.map((observation) => observation.sample_id)).size;
  const reasons: string[] = [];
  if (sampleCount < input.minSamples) {
    reasons.push(`sample_count ${sampleCount} < min ${input.minSamples}`);
  }
  const byTier = new Map<Tier, ConfidenceObservation[]>();
  for (const tier of TIERS) {
    byTier.set(tier, []);
  }
  for (const observation of input.observations) {
    (byTier.get(observation.tier) as ConfidenceObservation[]).push(observation);
  }
  for (const tier of TIERS) {
    const count = (byTier.get(tier) as ConfidenceObservation[]).length;
    if (count < input.minTierObservations) {
      reasons.push(`tier ${tier} observations ${count} < min ${input.minTierObservations}`);
    }
  }
  if (reasons.length > 0) {
    return { status: "insufficient", reasons, sample_count: sampleCount };
  }

  const reliabilityTiers = {} as Record<Tier, TierReliability>;
  const tierThresholds = {} as Record<Tier, TierThreshold>;
  let allReachable = true;
  for (const tier of TIERS) {
    const tierObservations = byTier.get(tier) as ConfidenceObservation[];
    const points = tierObservations.map((observation) => ({
      confidence: observation.confidence,
      correct: observation.correct
    }));
    const curve = isotonicFit(points);
    const autoCutoff = cutoff(curve, input.targets.auto[tier]);
    const confirmCutoff = cutoff(curve, input.targets.confirm[tier]);
    if (autoCutoff === null || confirmCutoff === null) {
      allReachable = false;
    }
    reliabilityTiers[tier] = {
      observation_count: tierObservations.length,
      bins: buildBins(points),
      isotonic: curve
    };
    tierThresholds[tier] = {
      auto_match_min_confidence: autoCutoff,
      confirm_min_confidence: confirmCutoff
    };
  }

  const id = `ccal-${sha256Hex(
    stableStringify({
      mapping_fn_version: MAPPING_FN_VERSION,
      min_samples: input.minSamples,
      min_tier_observations: input.minTierObservations,
      observations: input.observations,
      source_eval_run_id: input.run.id,
      targets: input.targets
    })
  ).slice(0, 16)}`;

  return {
    status: "calibrated",
    run: {
      id,
      source_eval_run_id: input.run.id,
      golden_set_version: input.run.golden_set_version,
      schema_version: input.run.schema_version,
      prompt_version: input.run.prompt_version,
      model_version: input.run.model_version,
      sample_count: sampleCount,
      mapping_fn_version: MAPPING_FN_VERSION,
      thresholds: allReachable
        ? {
            targets: input.targets,
            tiers: tierThresholds,
            field_tier: { ...FIELD_TIER }
          }
        : null,
      reliability: { tiers: reliabilityTiers },
      status: allReachable ? "ready" : "draft"
    }
  };
}
