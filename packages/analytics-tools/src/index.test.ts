import { describe, expect, it } from "vitest";
import {
  calculateReturnsRisk,
  compareSecurities,
  comparePercentiles,
  getCompareSecuritiesCapabilities,
  getFinancialRatios,
  getFinancialRatiosCapabilities,
  getPercentileComparisonCapabilities,
  getReturnsRiskCapabilities,
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
      point_in_time_guard: true,
      preview_execution: true,
      prevents_future_classification: true,
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
    expect(result.point_in_time_guard).toEqual({
      classification_as_of: "2026-01-07",
      future_data_policy: "block_future_classification",
      requested_as_of: "2026-01-07",
      security_master_as_of: "2026-01-07",
      status: "enforced",
      uses_latest_classification: false
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

  it("blocks future classification for historical screens", () => {
    const result = screenSecurities({
      asOf: "2024-12-31T16:00:00+08:00",
      classificationAsOf: "2026-01-07",
      naturalLanguage: "revenue above 100000",
      requestId: "req_screen_future_guard"
    });

    expect(result.status).toBe("blocked_future_data");
    expect(result.execution_preview.universe_size).toBe(0);
    expect(result.point_in_time_guard).toEqual({
      classification_as_of: "2026-01-07",
      future_data_policy: "block_future_classification",
      requested_as_of: "2024-12-31",
      security_master_as_of: "2024-12-31",
      status: "blocked_future_data",
      uses_latest_classification: false
    });
    expect(result.parsed_conditions[0]).toMatchObject({
      field: "revenue",
      operator: "gte",
      value: 100000
    });
  });

  it("allows same-day classification timestamps for historical screens", () => {
    const result = screenSecurities({
      asOf: "2024-12-31T16:00:00+08:00",
      classificationAsOf: "2024-12-31T09:30:00+08:00",
      naturalLanguage: "revenue above 100000",
      requestId: "req_screen_same_day_guard"
    });

    expect(result.status).toBe("planned_with_preview");
    expect(result.point_in_time_guard).toMatchObject({
      classification_as_of: "2024-12-31",
      requested_as_of: "2024-12-31",
      status: "enforced"
    });
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

  it("reports financial ratios capabilities", () => {
    expect(getFinancialRatiosCapabilities()).toMatchObject({
      formula_version: "financial-ratios-v0",
      frontend_rendering: false,
      live_data_access: false,
      percentile_methodology: "synthetic_peer_distribution_rank",
      point_in_time: true,
      route: "POST /analytics/financial-ratios",
      status: "financial_ratios_scaffold",
      tool_name: "get_financial_ratios"
    });
  });

  it("computes deterministic financial ratios with formula version and percentiles", () => {
    const result = getFinancialRatios({
      requestId: "req_ratios_001",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      facts_status: "found",
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      status: "computed",
      toolName: "get_financial_ratios"
    });
    expect(result.definitions[0]).toMatchObject({
      formula: "net_income / revenue",
      formula_version: "financial-ratios-v0",
      metric_id: "net_margin"
    });
    expect(result.ratios.map((ratio) => [ratio.metric_id, ratio.status, ratio.value])).toEqual([
      ["net_margin", "computed", 0.189184],
      ["return_on_assets", "computed", 0.073386],
      ["return_on_equity", "computed", 0.13915],
      ["asset_turnover", "computed", 0.387908],
      ["equity_multiplier", "computed", 1.896135]
    ]);
    expect(result.ratios[0]?.percentile).toEqual({
      peer_set_id: "synthetic_hk_large_mid_cap_v0",
      percentile_rank: 0.8,
      sample_count: 5
    });
    expect(result.percentile_methodology).toMatchObject({
      live_peer_constituents: false,
      point_in_time: true
    });
  });

  it("blocks ratios when financial facts are held", () => {
    const result = getFinancialRatios({
      requestId: "req_ratios_hold",
      securityQuery: "08001.HK"
    });

    expect(result.status).toBe("partial");
    expect(result.facts_status).toBe("data_quality_hold");
    expect(result.ratios.every((ratio) => ratio.status === "blocked")).toBe(true);
    expect(result.ratios[0]?.blocked_reason).toBe("financial_facts_data_quality_hold");
  });

  it("blocks ambiguous financial ratio securities without guessing", () => {
    const result = getFinancialRatios({
      requestId: "req_ratios_ambiguous",
      securityQuery: "ABC"
    });

    expect(result.status).toBe("blocked_resolution");
    expect(result.resolve_security?.status).toBe("ambiguous");
    expect(result.ratios.every((ratio) => ratio.blocked_reason === "security_resolution_required")).toBe(
      true
    );
  });

  it("reports returns/risk capabilities", () => {
    expect(getReturnsRiskCapabilities()).toMatchObject({
      formula_version: "returns-risk-v0",
      frontend_rendering: false,
      golden_tolerance: 0.000001,
      live_data_access: false,
      price_history_fields: ["close", "return", "drawdown"],
      requires_benchmark_for_beta: true,
      route: "POST /analytics/returns-risk",
      status: "returns_risk_scaffold",
      tool_name: "calculate_returns_risk"
    });
  });

  it("computes deterministic returns/risk metrics with benchmark beta", () => {
    const result = calculateReturnsRisk({
      benchmarkSecurityQuery: "00700.HK",
      requestId: "req_returns_risk_001",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      benchmark_history_status: "found",
      benchmark_instrument_id: "eq_hk_00700",
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      price_history_status: "found",
      status: "computed",
      toolName: "calculate_returns_risk"
    });
    expect(result.window).toMatchObject({
      annualization_factor: 252,
      beta_method: "sample_covariance_over_sample_variance",
      from: "2026-01-05",
      max_rows: 3,
      price_basis: "close",
      return_field: "return",
      row_count: 3,
      to: "2026-01-07",
      volatility_method: "sample_standard_deviation"
    });
    expect(result.definitions[0]).toMatchObject({
      formula: "last_close / first_close - 1",
      formula_version: "returns-risk-v0",
      metric_id: "total_return",
      tolerance: 0.000001
    });
    expect(result.metrics.map((metric) => [metric.metric_id, metric.status, metric.value])).toEqual([
      ["total_return", "computed", 0.012195],
      ["average_daily_return", "computed", 0.007267],
      ["volatility_daily", "computed", 0.002301],
      ["volatility_annualized", "computed", 0.036523],
      ["max_drawdown", "computed", 0],
      ["beta", "computed", 1]
    ]);
    expect(result.metrics.every((metric) => metric.tolerance === 0.000001)).toBe(true);
  });

  it("computes return/risk metrics while blocking beta without benchmark", () => {
    const result = calculateReturnsRisk({
      requestId: "req_returns_risk_no_benchmark",
      securityQuery: "00700.HK"
    });

    expect(result.status).toBe("partial");
    expect(result.metrics.find((metric) => metric.metric_id === "beta")).toMatchObject({
      blocked_reason: "benchmark_required",
      status: "blocked"
    });
    expect(result.metrics.find((metric) => metric.metric_id === "total_return")).toMatchObject({
      status: "computed",
      value: 0.012195
    });
  });

  it("blocks ambiguous returns/risk securities without guessing", () => {
    const result = calculateReturnsRisk({
      benchmarkSecurityQuery: "00700.HK",
      requestId: "req_returns_risk_ambiguous",
      securityQuery: "ABC"
    });

    expect(result.status).toBe("blocked_resolution");
    expect(result.resolve_security?.status).toBe("ambiguous");
    expect(result.metrics.every((metric) => metric.blocked_reason === "security_resolution_required")).toBe(
      true
    );
  });

  it("reports percentile comparison capabilities", () => {
    expect(getPercentileComparisonCapabilities()).toMatchObject({
      benchmark_types: ["peer", "index", "history"],
      formula_version: "percentile-comparison-v0",
      frontend_rendering: false,
      live_constituents: false,
      live_data_access: false,
      point_in_time: true,
      route: "POST /analytics/percentile-comparison",
      status: "percentile_comparison_scaffold",
      tool_name: "compare_percentiles"
    });
  });

  it("compares peer, index, and history percentiles with point-in-time metadata", () => {
    const result = comparePercentiles({
      metricId: "net_margin",
      requestId: "req_percentiles_001",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      formula_version: "percentile-comparison-v0",
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      metric_id: "net_margin",
      status: "compared",
      toolName: "compare_percentiles"
    });
    expect(result.subject).toMatchObject({
      metric_id: "net_margin",
      source_tool: "get_financial_ratios",
      status: "computed",
      value: 0.189184
    });
    expect(result.point_in_time_policy).toEqual({
      benchmark_as_of: "2026-01-07",
      classification_as_of: "2026-01-07",
      live_constituents: false,
      no_future_constituents: true
    });
    expect(result.comparisons.map((comparison) => comparison.benchmark_type)).toEqual([
      "peer",
      "index",
      "history"
    ]);
    expect(result.comparisons.map((comparison) => comparison.percentile_rank)).toEqual([
      0.8,
      0.8,
      0.8
    ]);
    expect(result.comparisons[0]).toMatchObject({
      constituent_as_of: "2026-01-07",
      live_constituents: false,
      point_in_time: true,
      sample_count: 5,
      status: "computed"
    });
    expect(result.comparisons[0]?.constituents[0]).toMatchObject({
      included_from: "2020-01-01",
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(result.comparisons[2]?.history_observations.length).toBe(5);
  });

  it("compares total return percentile from returns/risk source", () => {
    const result = comparePercentiles({
      benchmarkTypes: ["peer"],
      metricId: "total_return",
      requestId: "req_percentiles_total_return",
      securityQuery: "00700.HK"
    });

    expect(result.status).toBe("compared");
    expect(result.subject).toMatchObject({
      metric_id: "total_return",
      source_tool: "calculate_returns_risk",
      status: "computed",
      value: 0.012195
    });
    expect(result.comparisons).toEqual([
      expect.objectContaining({
        benchmark_type: "peer",
        percentile_rank: 0.6,
        status: "computed"
      })
    ]);
  });

  it("blocks ambiguous percentile securities without guessing", () => {
    const result = comparePercentiles({
      metricId: "net_margin",
      requestId: "req_percentiles_ambiguous",
      securityQuery: "ABC"
    });

    expect(result.status).toBe("blocked_resolution");
    expect(result.resolve_security?.status).toBe("ambiguous");
    expect(result.subject).toMatchObject({
      blocked_reason: "security_resolution_required",
      status: "blocked"
    });
    expect(result.comparisons.every((comparison) => comparison.blocked_reason === "security_resolution_required")).toBe(
      true
    );
  });
});
