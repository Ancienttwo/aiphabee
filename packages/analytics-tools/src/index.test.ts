import { describe, expect, it } from "vitest";
import {
  compareSecurities,
  getCompareSecuritiesCapabilities,
  getScreenSecuritiesCapabilities,
  screenSecurities
} from "./index";

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

  it("reports screen securities capabilities", () => {
    expect(getScreenSecuritiesCapabilities()).toMatchObject({
      editable_conditions: true,
      frontend_rendering: false,
      live_data_access: false,
      preview_execution: true,
      requires_confirmation_before_live_execution: true,
      route: "POST /analytics/screen-securities",
      status: "screen_securities_scaffold",
      tool_name: "screen_securities"
    });
  });

  it("parses natural-language screen conditions and explains hits", () => {
    const result = screenSecurities({
      naturalLanguage: "revenue above 100000 and profitable",
      requestId: "req_screen_001"
    });

    expect(result).toMatchObject({
      editable_before_execution: true,
      frontend_rendering: false,
      live_data_access: false,
      requires_confirmation_before_live_execution: true,
      status: "planned_with_preview",
      toolName: "screen_securities"
    });
    expect(result.parsed_conditions).toEqual([
      expect.objectContaining({
        editable: true,
        field: "revenue",
        missing_value_rule: "exclude",
        operator: "gte",
        value: 100000
      }),
      expect.objectContaining({
        editable: true,
        field: "net_income",
        missing_value_rule: "exclude",
        operator: "gte",
        value: 0
      })
    ]);
    expect(result.execution_preview.hits).toEqual([
      expect.objectContaining({
        rank: 1,
        score: 2,
        symbol: "00700.HK",
        why: ["matched:revenue_gte_100000", "matched:net_income_gte_0"]
      })
    ]);
    expect(result.execution_preview.rejected_rows.map((row) => row.symbol)).toEqual([
      "08001.HK",
      "00001.HK"
    ]);
    expect(result.execution_preview.rejected_rows[0]?.reasons).toContain(
      "revenue:missing_value_excluded"
    );
  });

  it("uses explicit structured conditions when provided", () => {
    const result = screenSecurities({
      conditions: [
        {
          field: "last_price",
          operator: "gte",
          value: 400
        }
      ],
      requestId: "req_screen_explicit"
    });

    expect(result.status).toBe("planned_with_preview");
    expect(result.parsed_conditions[0]).toMatchObject({
      field: "last_price",
      operator: "gte",
      source_tool: "get_quote_snapshot",
      value: 400
    });
    expect(result.execution_preview.hits.map((hit) => hit.symbol)).toEqual(["00700.HK"]);
  });

  it("returns unsupported query when no deterministic condition can be parsed", () => {
    const result = screenSecurities({
      naturalLanguage: "find interesting stocks",
      requestId: "req_screen_unsupported"
    });

    expect(result.status).toBe("unsupported_query");
    expect(result.parsed_conditions).toEqual([]);
    expect(result.execution_preview.hit_count).toBe(0);
  });
});
