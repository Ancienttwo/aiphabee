import { describe, expect, it } from "vitest";
import {
  compareIpos,
  getIpo,
  getIpos,
  normalizeScreeningInput,
  screenIpos,
} from "./mock-api";
import { IPOS } from "../data/ipos";
import {
  demandColor,
  formatHKD,
  formatListingDate,
  formatMultiple,
  formatPercent,
  formatScore,
} from "./format";

describe("mock-api", () => {
  it("getIpos wraps every IPO in a success envelope (contract shape)", () => {
    const env = getIpos();
    expect(env.ok).toBe(true);
    expect(env.market_status).toBe("not_applicable");
    expect(env.provenance[0]?.source).toBe("mock-fixture");
    expect(env.usage.credits).toBe(0);
    if (env.ok) {
      expect(env.data.length).toBe(IPOS.length);
      expect(env.data.length).toBeGreaterThan(0);
    }
  });

  it("getIpo returns a success envelope for a known id", () => {
    const env = getIpo("honeycomb");
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.ticker).toBe("2769.HK");
      // Compliance: research signal, NOT a buy/sell recommendation field.
      expect(env.data).not.toHaveProperty("recommendation");
      expect(env.data.signal).toBe("strong_positive");
    }
  });

  it("getIpo returns a NOT_FOUND error envelope for an unknown id", () => {
    const env = getIpo("does-not-exist");
    expect(env.ok).toBe(false);
    if (!env.ok) {
      expect(env.error.code).toBe("NOT_FOUND");
    }
  });

  it("compareIpos exposes a 2-5 IPO comparison matrix with why text", () => {
    const env = compareIpos(["honeycomb", "lotus", "pearl"]);
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.rows).toHaveLength(3);
      expect(env.data.metrics.map((metric) => metric.key)).toEqual([
        "score",
        "subscription",
        "confidence",
        "rating",
        "cornerstone",
      ]);
      expect(env.data.rows[0]?.metrics.subscription).toBe(128.4);
      expect(env.data.rows[0]?.why.join(" ")).toContain("2769.HK");
      expect(env.data.incomparable_reasons).toEqual([]);
    }
  });

  it("compareIpos rejects requests outside the 2-5 item contract", () => {
    const env = compareIpos(["honeycomb"]);
    expect(env.ok).toBe(false);
    if (!env.ok) {
      expect(env.error.code).toBe("OUT_OF_RANGE");
    }
  });

  it("screenIpos returns editable conditions, hits, and rejected reasons", () => {
    const env = screenIpos({
      minScore: 60,
      minSubscription: 20,
      minConfidence: 70,
      status: "pending",
      requireCornerstone: true,
    });
    expect(env.ok).toBe(true);
    if (env.ok) {
      expect(env.data.confirmation_required_before_live_execution).toBe(true);
      expect(env.data.conditions.some((condition) => condition.field === "status")).toBe(true);
      expect(env.data.hits.map((hit) => hit.ipo.id)).toEqual(["honeycomb", "lotus"]);
      expect(env.data.hits[0]?.why.join(" ")).toContain("passes all structured conditions");
      expect(env.data.rejected.find((row) => row.ipo.id === "apex")?.rejected_reasons.join(" ")).toContain(
        "score 49 < 60",
      );
    }
  });

  it("normalizeScreeningInput clamps editable numeric fields", () => {
    expect(normalizeScreeningInput({ minScore: 120, minConfidence: -5, minSubscription: -10 })).toMatchObject({
      minScore: 100,
      minConfidence: 0,
      minSubscription: 0,
    });
  });
});

describe("format helpers", () => {
  it("formats finance values in the product's conventions", () => {
    expect(formatHKD(24.8)).toBe("HK$24.80");
    expect(formatMultiple(128.4)).toBe("128.4×");
    expect(formatPercent(86)).toBe("86%");
    expect(formatScore(72)).toBe("72 / 100");
    expect(formatListingDate("Jun 24, 2026")).toBe("Jun 24");
  });

  it("demandColor reflects oversubscription bands", () => {
    expect(demandColor(128)).toBe("var(--green-600)");
    expect(demandColor(2)).toBe("var(--neutral-500)");
    expect(demandColor(20)).toBe("var(--text-primary)");
  });
});
