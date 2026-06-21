import { describe, expect, it } from "vitest";
import {
  GetSecurityProfileInputError,
  GetSecurityHistoryInputError,
  ResolveSecurityInputError,
  getSecurityHistory,
  getSecurityHistoryCapabilities,
  getSecurityProfile,
  getSecurityProfileCapabilities,
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

describe("security profile scaffold", () => {
  it("returns listed security profile, currency, and coverage metadata", () => {
    const result = getSecurityProfile({ instrumentId: "eq_hk_00700" });

    expect(result.status).toBe("found");
    expect(result.toolName).toBe("get_security_profile");
    expect(result.liveDataAccess).toBe(false);
    expect(result.profile).toMatchObject({
      currency: "HKD",
      exchange: "HKEX",
      industry: {
        sector: "Communication Services"
      },
      listingStatus: "listed",
      market: "HK",
      symbol: "00700.HK"
    });
    expect(result.profile?.coverage.profile.status).toBe("available");
    expect(result.profile?.coverage.quoteSnapshot.status).toBe("planned");
    expect(result.usage.rows).toBe(1);
  });

  it("returns suspended and delisted fixture states without live access", () => {
    const suspended = getSecurityProfile({ instrumentId: "EQ_HK_08001" });
    const delisted = getSecurityProfile({ instrumentId: "eq_hk_09999" });

    expect(suspended.profile).toMatchObject({
      lifecycle: {
        suspendedAt: "2025-01-15"
      },
      listingStatus: "suspended"
    });
    expect(suspended.profile?.coverage.quoteSnapshot.status).toBe("unavailable");
    expect(delisted.profile).toMatchObject({
      lifecycle: {
        delistedAt: "2022-12-30"
      },
      listingStatus: "delisted"
    });
    expect(delisted.profile?.coverage.financialFacts.status).toBe("unavailable");
    expect(suspended.liveDataAccess).toBe(false);
    expect(delisted.liveDataAccess).toBe(false);
  });

  it("returns not_found for unknown instrument ids", () => {
    const result = getSecurityProfile({ instrumentId: "eq_hk_missing" });

    expect(result.status).toBe("not_found");
    expect(result.profile).toBeUndefined();
    expect(result.usage.rows).toBe(0);
  });

  it("requires a non-empty instrument id", () => {
    expect(() => getSecurityProfile({ instrumentId: "  " })).toThrow(
      GetSecurityProfileInputError
    );
  });

  it("reports no-live profile capabilities", () => {
    expect(getSecurityProfileCapabilities()).toMatchObject({
      coverage_metadata: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_security_profile_scaffold",
      supported_listing_statuses: ["listed", "suspended", "delisted"]
    });
  });
});

describe("security history scaffold", () => {
  it("returns point-in-time historical name and industry without latest classification", () => {
    const historical = getSecurityHistory({
      asOf: "2017-01-01",
      instrumentId: "eq_hk_00700"
    });
    const currentProfile = getSecurityProfile({ instrumentId: "eq_hk_00700" });

    expect(historical.status).toBe("found");
    expect(historical.toolName).toBe("get_security_history");
    expect(historical.liveDataAccess).toBe(false);
    expect(historical.history?.activeName).toMatchObject({
      name: {
        en: "Tencent Holdings Ltd."
      },
      validFrom: "2016-01-02"
    });
    expect(historical.history?.activeIndustry).toMatchObject({
      industry: "Internet Software & Services",
      sector: "Information Technology",
      validTo: "2018-09-27"
    });
    expect(currentProfile.profile?.industry).toMatchObject({
      industry: "Interactive Media & Services",
      sector: "Communication Services"
    });
    expect(historical.history?.pointInTimePolicy).toMatchObject({
      asOfRequired: true,
      usesLatestClassification: false,
      usesLatestConstituents: false,
      usesLatestName: false
    });
    expect(historical.usage.rows).toBe(3);
  });

  it("returns historical constituent memberships as of the requested date", () => {
    const beforeTechIndex = getSecurityHistory({
      asOf: "2010-01-01",
      instrumentId: "eq_hk_00700"
    });
    const afterTechIndex = getSecurityHistory({
      asOf: "2021-01-01",
      instrumentId: "eq_hk_00700"
    });

    expect(
      beforeTechIndex.history?.activeConstituentMemberships.map(
        (membership) => membership.benchmarkSymbol
      )
    ).toEqual(["HSI"]);
    expect(
      afterTechIndex.history?.activeConstituentMemberships.map(
        (membership) => membership.benchmarkSymbol
      )
    ).toEqual(["HSI", "HSTECH"]);
  });

  it("requires instrument id and as-of date for point-in-time history", () => {
    expect(() =>
      getSecurityHistory({
        asOf: "2021-01-01",
        instrumentId: " "
      })
    ).toThrow(GetSecurityHistoryInputError);
    expect(() =>
      getSecurityHistory({
        instrumentId: "eq_hk_00700"
      })
    ).toThrow(GetSecurityHistoryInputError);
  });

  it("reports no-live history capabilities", () => {
    expect(getSecurityHistoryCapabilities()).toMatchObject({
      as_of_required: true,
      handler_ready: true,
      live_data_access: false,
      point_in_time_policy: {
        uses_latest_classification: false,
        uses_latest_constituents: false,
        uses_latest_name: false
      },
      status: "security_history_scaffold",
      supported_history_types: [
        "historical_names",
        "historical_industries",
        "historical_constituents"
      ]
    });
  });
});
