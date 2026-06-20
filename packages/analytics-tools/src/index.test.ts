import { describe, expect, it } from "vitest";
import { compareSecurities, getCompareSecuritiesCapabilities } from "./index";

describe("compare securities scaffold", () => {
  it("reports backend-only compare capabilities", () => {
    expect(getCompareSecuritiesCapabilities()).toMatchObject({
      allow_fx_conversion_without_rate: false,
      frontend_rendering: false,
      live_data_access: false,
      max_securities: 5,
      min_securities: 2,
      package: "@aiphabee/analytics-tools",
      route: "POST /analytics/compare-securities",
      status: "compare_securities_scaffold",
      tool_name: "compare_securities"
    });
  });

  it("compares 2 securities and marks incomplete rows as incomparable", () => {
    const result = compareSecurities({
      requestId: "req_compare_001",
      securities: ["00700.HK", "08001.HK"]
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      row_count: 2,
      status: "partial",
      toolName: "compare_securities"
    });
    expect(result.unified_comparison).toMatchObject({
      base_currency: "HKD",
      base_unit: "million",
      currency_conversion: "not_required",
      max_securities: 5,
      min_securities: 2
    });
    expect(result.rows[0]).toMatchObject({
      financials: {
        assets: 1570000,
        equity: 828000,
        net_income: 115216,
        revenue: 609015
      },
      instrument_id: "eq_hk_00700",
      status: "comparable",
      symbol: "00700.HK"
    });
    expect(result.rows[1]).toMatchObject({
      financials: {},
      instrument_id: "eq_hk_08001",
      status: "incomparable",
      symbol: "08001.HK"
    });
    expect(result.rows[1]?.missing_metrics).toEqual([
      "revenue",
      "net_income",
      "assets",
      "equity"
    ]);
    expect(result.unified_comparison.incomparable_reasons).toContain(
      "08001.HK:financial_facts_data_quality_hold"
    );
  });

  it("requires 2 to 5 securities", () => {
    const result = compareSecurities({
      requestId: "req_compare_invalid",
      securities: ["00700.HK"]
    });

    expect(result.status).toBe("invalid_input");
    expect(result.unified_comparison.incomparable_reasons).toContain(
      "compare_securities requires 2 to 5 securities"
    );
  });

  it("blocks ambiguous securities without guessing", () => {
    const result = compareSecurities({
      requestId: "req_compare_ambiguous",
      securities: ["00700.HK", "ABC"]
    });

    expect(result.status).toBe("partial");
    expect(result.rows[1]).toMatchObject({
      input: "ABC",
      status: "blocked_resolution"
    });
    expect(result.rows[1]?.quality_flags).toContain("security_resolution_required");
  });
});
