import { describe, expect, it } from "vitest";
import { safeParseChartParseResult } from "@aiphabee/agent-runtime/chart-parse";
import type { ChartParseResult } from "@aiphabee/agent-runtime/chart-parse";
import { FIELD_ORDER, FIELD_TIER, compareSample, nullNegativeOutcome } from "./compare";
import { FULL_TRUTH, NEGATIVE_TRUTH, perfectParse } from "./test-util";

function parsed(raw: unknown): ChartParseResult {
  const result = safeParseChartParseResult(raw);
  if (!result.success) {
    throw new Error(`test raw must be schema-valid: ${result.error.message}`);
  }
  return result.data;
}

function withField(raw: unknown, patch: Record<string, unknown>): unknown {
  return { ...(raw as Record<string, unknown>), ...patch };
}

const PERFECT = perfectParse(FULL_TRUTH);

function outcomeMap(result: ReturnType<typeof compareSample>) {
  return new Map(result.map((outcome) => [outcome.field, outcome]));
}

describe("FIELD_TIER / FIELD_ORDER", () => {
  it("declares the PRD field matrix tiers", () => {
    expect(FIELD_TIER).toEqual({
      symbol: "p0",
      exchange: "p0",
      timeframe: "p0",
      end_time: "p1",
      indicator_names: "p1",
      indicator_params: "p2",
      drawn_line_anchors: "p2"
    });
    expect([...FIELD_ORDER]).toEqual([
      "symbol",
      "exchange",
      "timeframe",
      "end_time",
      "indicator_names",
      "indicator_params",
      "drawn_line_anchors"
    ]);
  });
});

describe("compareSample", () => {
  it("scores a perfect parse as all hits with confidences", () => {
    const outcomes = compareSample(parsed(PERFECT), FULL_TRUTH, { anchorTolerance: 0.05 });
    expect(outcomes).toHaveLength(FIELD_ORDER.length);
    for (const outcome of outcomes) {
      expect(outcome.hit).toBe(true);
      expect(outcome.confidence).toBe(1);
      expect(outcome.tier).toBe(FIELD_TIER[outcome.field]);
    }
  });

  it("misses symbol on value mismatch and keeps the parsed confidence", () => {
    const raw = withField(PERFECT, { symbol: { value: "9988.HK", confidence: 0.4 } });
    const outcomes = outcomeMap(compareSample(parsed(raw), FULL_TRUTH, { anchorTolerance: 0.05 }));
    const symbol = outcomes.get("symbol");
    expect(symbol?.hit).toBe(false);
    expect(symbol?.confidence).toBe(0.4);
    expect(symbol?.detail).toContain("9988.HK");
  });

  it("misses scalar fields when parsed null against non-null truth", () => {
    const raw = withField(PERFECT, { end_time: { value: null, confidence: 0.1 } });
    const outcomes = outcomeMap(compareSample(parsed(raw), FULL_TRUTH, { anchorTolerance: 0.05 }));
    expect(outcomes.get("end_time")?.hit).toBe(false);
  });

  it("requires indicator name sets to match exactly (no hallucinated extras)", () => {
    const extra = withField(PERFECT, {
      indicators: [
        { name: "RSI", params: [14], confidence: 1 },
        { name: "MACD", params: [12, 26, 9], confidence: 1 },
        { name: "BOLL", params: [20], confidence: 0.9 }
      ]
    });
    const outcomes = outcomeMap(compareSample(parsed(extra), FULL_TRUTH, { anchorTolerance: 0.05 }));
    expect(outcomes.get("indicator_names")?.hit).toBe(false);
  });

  it("misses indicator params when a truth indicator has null or wrong params", () => {
    const wrong = withField(PERFECT, {
      indicators: [
        { name: "RSI", params: null, confidence: 0.5 },
        { name: "MACD", params: [12, 26, 9], confidence: 1 }
      ]
    });
    const outcomes = outcomeMap(compareSample(parsed(wrong), FULL_TRUTH, { anchorTolerance: 0.05 }));
    expect(outcomes.get("indicator_params")?.hit).toBe(false);
    expect(outcomes.get("indicator_names")?.hit).toBe(true);
  });

  it("hits anchors within L-infinity tolerance and misses beyond it", () => {
    const nudged = withField(PERFECT, {
      drawn_lines: [
        {
          kind: "trendline",
          anchors: [
            { x: 0.24, y: 0.8 },
            { x: 0.9, y: 0.1 }
          ],
          confidence: 0.8
        }
      ]
    });
    const within = outcomeMap(compareSample(parsed(nudged), FULL_TRUTH, { anchorTolerance: 0.05 }));
    expect(within.get("drawn_line_anchors")?.hit).toBe(true);
    const beyond = outcomeMap(compareSample(parsed(nudged), FULL_TRUTH, { anchorTolerance: 0.03 }));
    expect(beyond.get("drawn_line_anchors")?.hit).toBe(false);
  });

  it("marks list fields not applicable when truth has no entries", () => {
    const truth = { ...FULL_TRUTH, indicators: [], drawn_lines: [] };
    const raw = withField(PERFECT, { indicators: [], drawn_lines: [] });
    const outcomes = outcomeMap(compareSample(parsed(raw), truth, { anchorTolerance: 0.05 }));
    expect(outcomes.get("indicator_params")?.applicable).toBe(false);
    expect(outcomes.get("drawn_line_anchors")?.applicable).toBe(false);
    expect(outcomes.get("indicator_names")?.applicable).toBe(true);
  });
});

describe("nullNegativeOutcome", () => {
  it("passes when every truth-null scalar field parses as null", () => {
    const raw = withField(perfectParse(NEGATIVE_TRUTH), {});
    const outcome = nullNegativeOutcome(parsed(raw), NEGATIVE_TRUTH);
    expect(outcome.expected_null_fields).toEqual(["symbol", "exchange"]);
    expect(outcome.pass).toBe(true);
  });

  it("fails when a truth-null field is hallucinated", () => {
    const raw = withField(perfectParse(NEGATIVE_TRUTH), {
      symbol: { value: "0700.HK", confidence: 0.9 }
    });
    const outcome = nullNegativeOutcome(parsed(raw), NEGATIVE_TRUTH);
    expect(outcome.pass).toBe(false);
  });
});
