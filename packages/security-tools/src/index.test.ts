import { describe, expect, it } from "vitest";
import {
  ResolveSecurityInputError,
  getResolveSecurityCapabilities,
  resolveSecurity
} from "./index";

describe("resolve security scaffold", () => {
  it("resolves code and symbol variants to one instrument id", () => {
    const variants = ["700", "0700", "00700.HK", "HK:00700"];

    for (const query of variants) {
      const result = resolveSecurity({ query });

      expect(result.status).toBe("resolved");
      expect(result.selectedInstrumentId).toBe("eq_hk_00700");
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0]).toMatchObject({
        exchange: "HKEX",
        market: "HK",
        status: "listed",
        symbol: "00700.HK"
      });
      expect(result.liveDataAccess).toBe(false);
    }
  });

  it("resolves Chinese, English, and historical names", () => {
    expect(resolveSecurity({ query: "腾讯" }).selectedInstrumentId).toBe("eq_hk_00700");
    expect(resolveSecurity({ query: "Tencent Holdings" }).selectedInstrumentId).toBe(
      "eq_hk_00700"
    );
    expect(resolveSecurity({ query: "Tencent Holdings Limited" }).candidates[0]).toMatchObject({
      instrumentId: "eq_hk_00700",
      matchReason: "historical_name"
    });
  });

  it("returns ambiguity candidates without silently selecting one", () => {
    const result = resolveSecurity({ query: "ABC" });

    expect(result.status).toBe("ambiguous");
    expect(result.selectedInstrumentId).toBeUndefined();
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.map((candidate) => candidate.instrumentId)).toEqual([
      "eq_hk_00001",
      "eq_hk_08001"
    ]);
    expect(result.candidates.every((candidate) => candidate.market === "HK")).toBe(true);
  });

  it("returns not_found without live access for unknown identifiers", () => {
    const result = resolveSecurity({ query: "UNKNOWN" });

    expect(result.status).toBe("not_found");
    expect(result.selectedInstrumentId).toBeUndefined();
    expect(result.candidates).toEqual([]);
    expect(result.usage.rows).toBe(0);
  });

  it("requires a non-empty query", () => {
    expect(() => resolveSecurity({ query: "  " })).toThrow(ResolveSecurityInputError);
  });

  it("reports no-live resolver capabilities", () => {
    expect(getResolveSecurityCapabilities()).toMatchObject({
      ambiguity_candidates: true,
      handler_ready: true,
      live_data_access: false,
      no_silent_guessing: true,
      status: "resolve_security_scaffold"
    });
  });
});
