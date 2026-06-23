import {
  createErrorEnvelope,
  createSuccessEnvelope,
} from "@aiphabee/data-contracts";
import type {
  EnvelopeMeta,
  ErrorEnvelope,
  ProvenanceRef,
  SuccessEnvelope,
} from "@aiphabee/data-contracts";
import {
  IPOS,
  SECTOR_LABEL,
  STATUS_CONFIG,
  findIpo,
  type IpoRecord,
  type IpoStatus,
  type Sector,
} from "../data/ipos";

/**
 * Mock API — serves the illustrative dataset through the real
 * `@aiphabee/data-contracts` response envelope. This keeps the UI coupled to
 * the canonical contract (provenance, usage, market_status), so swapping to
 * the live worker later is a one-module change. NOT live market data.
 */

// Fixed timestamps keep SSR and client output identical (no hydration drift).
const MOCK_AS_OF = "2026-06-20T00:00:00.000Z";

const MOCK_PROVENANCE: ProvenanceRef[] = [
  {
    source: "mock-fixture",
    source_record_id: "ui-kit-mock-v1",
    data_version: "ui-kit-mock-v1",
    methodology_version: "ui-kit-mock-v1",
  },
];

function mockMeta(requestId: string, rows: number): EnvelopeMeta {
  return {
    asOf: MOCK_AS_OF,
    requestId,
    marketStatus: "not_applicable",
    methodologyVersion: "ui-kit-mock-v1",
    provenance: MOCK_PROVENANCE,
    usage: { cached: true, credits: 0, rows },
  };
}

export function getIpos(): SuccessEnvelope<IpoRecord[]> {
  return createSuccessEnvelope(IPOS, mockMeta("mock-ipos", IPOS.length));
}

export function getIpo(
  id: string,
): SuccessEnvelope<IpoRecord> | ErrorEnvelope {
  const ipo = findIpo(id);
  if (!ipo) {
    return createErrorEnvelope(
      "NOT_FOUND",
      `No IPO matches id "${id}".`,
      mockMeta(`mock-ipo-${id}`, 0),
    );
  }
  return createSuccessEnvelope(ipo, mockMeta(`mock-ipo-${id}`, 1));
}

export type ComparisonMetricKey =
  | "score"
  | "subscription"
  | "confidence"
  | "rating"
  | "cornerstone";

export interface ComparisonMetric {
  key: ComparisonMetricKey;
  label: string;
  unit: "score" | "multiple" | "percent" | "stars";
  higherIsBetter: boolean;
}

export interface ComparisonRow {
  ipo: IpoRecord;
  metrics: Record<ComparisonMetricKey, number>;
  why: string[];
  rejected_reasons: string[];
}

export interface ComparisonResult {
  requested_ids: string[];
  rows: ComparisonRow[];
  metrics: ComparisonMetric[];
  incomparable_reasons: string[];
  source: "mock-fixture";
}

export type ScreeningOperator = ">=" | "<=" | "=";
export type ScreeningField =
  | "score"
  | "subscription"
  | "confidence"
  | "sector"
  | "status"
  | "cornerstone";

export interface ScreeningCondition {
  field: ScreeningField;
  operator: ScreeningOperator;
  value: number | string | boolean;
  label: string;
  source_tool: "screen_securities";
  time_basis: "as_of_fixture";
  missing_value_rule: "fail_closed";
}

export interface ScreeningInput {
  minScore?: number;
  minSubscription?: number;
  minConfidence?: number;
  sector?: Sector | "all";
  status?: IpoStatus | "all";
  requireCornerstone?: boolean;
}

export interface ScreeningHit {
  ipo: IpoRecord;
  rank: number;
  why: string[];
}

export interface ScreeningRejected {
  ipo: IpoRecord;
  rejected_reasons: string[];
}

export interface ScreeningResult {
  conditions: ScreeningCondition[];
  hits: ScreeningHit[];
  rejected: ScreeningRejected[];
  confirmation_required_before_live_execution: true;
  source: "mock-fixture";
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: "score", label: "Aipha score", unit: "score", higherIsBetter: true },
  { key: "subscription", label: "超额认购", unit: "multiple", higherIsBetter: true },
  { key: "confidence", label: "模型置信度", unit: "percent", higherIsBetter: true },
  { key: "rating", label: "机构评分", unit: "stars", higherIsBetter: true },
  { key: "cornerstone", label: "基石占比", unit: "percent", higherIsBetter: true },
];

function cornerstonePct(ipo: IpoRecord): number {
  return ipo.cornerstones.reduce((sum, item) => sum + item.pct, 0);
}

function comparisonMetrics(ipo: IpoRecord): Record<ComparisonMetricKey, number> {
  return {
    score: ipo.score,
    subscription: ipo.sub,
    confidence: ipo.confidence,
    rating: ipo.rating,
    cornerstone: cornerstonePct(ipo),
  };
}

function explainComparison(ipo: IpoRecord): string[] {
  const strongestDimension = [...ipo.dims].sort((a, b) => b.score - a.score)[0];
  const reasons = [
    `${ipo.ticker} ${ipo.score}/100，${ipo.tierLabel}，${STATUS_CONFIG[ipo.status].label}`,
    `${strongestDimension.label} ${strongestDimension.score}/100 是当前最强维度`,
    `基石占比 ${cornerstonePct(ipo).toFixed(1)}%，认购 ${ipo.sub.toFixed(1)}x`,
  ];

  if (ipo.confidence < 60) {
    reasons.push("模型置信度低于 60%，需要二次复核");
  }

  return reasons;
}

export function compareIpos(
  ids: string[],
): SuccessEnvelope<ComparisonResult> | ErrorEnvelope {
  if (ids.length < 2 || ids.length > 5) {
    return createErrorEnvelope(
      "OUT_OF_RANGE",
      "compareIpos requires 2 to 5 IPO ids.",
      mockMeta("mock-compare-invalid-size", 0),
    );
  }

  const uniqueIds = [...new Set(ids)];
  const rows: ComparisonRow[] = [];
  const missing: string[] = [];

  for (const id of uniqueIds) {
    const ipo = findIpo(id);
    if (!ipo) {
      missing.push(id);
      continue;
    }
    rows.push({
      ipo,
      metrics: comparisonMetrics(ipo),
      why: explainComparison(ipo),
      rejected_reasons: [],
    });
  }

  if (missing.length) {
    return createErrorEnvelope(
      "NOT_FOUND",
      `No IPO matches id(s): ${missing.join(", ")}.`,
      mockMeta("mock-compare-missing", rows.length),
    );
  }

  return createSuccessEnvelope(
    {
      requested_ids: ids,
      rows,
      metrics: COMPARISON_METRICS,
      incomparable_reasons: [],
      source: "mock-fixture",
    },
    mockMeta("mock-compare-ipos", rows.length),
  );
}

function clampScore(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampSubscription(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Number(value.toFixed(1)));
}

export function normalizeScreeningInput(input: ScreeningInput = {}): Required<ScreeningInput> {
  return {
    minScore: clampScore(input.minScore, 50),
    minSubscription: clampSubscription(input.minSubscription, 10),
    minConfidence: clampScore(input.minConfidence, 55),
    sector: input.sector ?? "all",
    status: input.status ?? "all",
    requireCornerstone: input.requireCornerstone ?? false,
  };
}

function buildScreeningConditions(input: Required<ScreeningInput>): ScreeningCondition[] {
  const conditions: ScreeningCondition[] = [
    {
      field: "score",
      operator: ">=",
      value: input.minScore,
      label: `Aipha score >= ${input.minScore}`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    },
    {
      field: "subscription",
      operator: ">=",
      value: input.minSubscription,
      label: `超额认购 >= ${input.minSubscription}x`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    },
    {
      field: "confidence",
      operator: ">=",
      value: input.minConfidence,
      label: `模型置信度 >= ${input.minConfidence}%`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    },
  ];

  if (input.sector !== "all") {
    conditions.push({
      field: "sector",
      operator: "=",
      value: input.sector,
      label: `板块 = ${SECTOR_LABEL[input.sector]}`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    });
  }

  if (input.status !== "all") {
    conditions.push({
      field: "status",
      operator: "=",
      value: input.status,
      label: `状态 = ${STATUS_CONFIG[input.status].label}`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    });
  }

  if (input.requireCornerstone) {
    conditions.push({
      field: "cornerstone",
      operator: ">=",
      value: true,
      label: "至少一个基石投资者",
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    });
  }

  return conditions;
}

function screenRejectedReasons(ipo: IpoRecord, input: Required<ScreeningInput>): string[] {
  const reasons: string[] = [];

  if (ipo.score < input.minScore) reasons.push(`score ${ipo.score} < ${input.minScore}`);
  if (ipo.sub < input.minSubscription) reasons.push(`subscription ${ipo.sub}x < ${input.minSubscription}x`);
  if (ipo.confidence < input.minConfidence) reasons.push(`confidence ${ipo.confidence}% < ${input.minConfidence}%`);
  if (input.sector !== "all" && ipo.sector !== input.sector) {
    reasons.push(`sector ${SECTOR_LABEL[ipo.sector]} != ${SECTOR_LABEL[input.sector]}`);
  }
  if (input.status !== "all" && ipo.status !== input.status) {
    reasons.push(`status ${STATUS_CONFIG[ipo.status].label} != ${STATUS_CONFIG[input.status].label}`);
  }
  if (input.requireCornerstone && ipo.cornerstones.length === 0) {
    reasons.push("no cornerstone investor");
  }

  return reasons;
}

function explainScreenHit(ipo: IpoRecord): string[] {
  const strongestDimension = [...ipo.dims].sort((a, b) => b.score - a.score)[0];
  return [
    `${ipo.ticker} passes all structured conditions`,
    `${strongestDimension.label} ${strongestDimension.score}/100 leads the profile`,
    ipo.cornerstones.length
      ? `${ipo.cornerstones.length} cornerstone investor(s), total ${cornerstonePct(ipo).toFixed(1)}%`
      : "No cornerstone investor disclosed in fixture",
  ];
}

export function screenIpos(
  input: ScreeningInput = {},
): SuccessEnvelope<ScreeningResult> {
  const normalized = normalizeScreeningInput(input);
  const hits: ScreeningHit[] = [];
  const rejected: ScreeningRejected[] = [];

  for (const ipo of IPOS) {
    const rejected_reasons = screenRejectedReasons(ipo, normalized);
    if (rejected_reasons.length) {
      rejected.push({ ipo, rejected_reasons });
    } else {
      hits.push({ ipo, rank: 0, why: explainScreenHit(ipo) });
    }
  }

  const rankedHits = hits
    .sort((a, b) => b.ipo.score + b.ipo.sub / 10 - (a.ipo.score + a.ipo.sub / 10))
    .map((hit, index) => ({ ...hit, rank: index + 1 }));

  return createSuccessEnvelope(
    {
      conditions: buildScreeningConditions(normalized),
      hits: rankedHits,
      rejected,
      confirmation_required_before_live_execution: true,
      source: "mock-fixture",
    },
    mockMeta("mock-screen-ipos", rankedHits.length),
  );
}
