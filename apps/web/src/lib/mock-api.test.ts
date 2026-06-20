import { describe, expect, it } from "vitest";
import { getIpo, getIpos } from "./mock-api";
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
