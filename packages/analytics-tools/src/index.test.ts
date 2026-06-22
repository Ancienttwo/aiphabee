import { describe, expect, it } from "vitest";
import {
  calculateReturnsRisk,
  compareSecurities,
  comparePercentiles,
  getBuybacksAndPlacements,
  getBuybacksAndPlacementsCapabilities,
  getConsensusOrEstimates,
  getConsensusOrEstimatesCapabilities,
  getCompareSecuritiesCapabilities,
  getEventStudyCapabilities,
  getFinancialRatios,
  getFinancialRatiosCapabilities,
  getHighCostAnalyticsQueueCapabilities,
  getMarketBreadth,
  getMarketBreadthCapabilities,
  getOwnershipAndShortSelling,
  getOwnershipAndShortSellingCapabilities,
  getPercentileComparisonCapabilities,
  getPortfolioAnalytics,
  getPortfolioAnalyticsCapabilities,
  getReturnsRiskCapabilities,
  getSavedScreeningCapabilities,
  getScreenSecuritiesCapabilities,
  planHighCostAnalyticsQueue,
  createSavedScreeningPlan,
  runEventStudy,
  screenSecurities
} from "./index";

describe("compare securities scaffold", () => {
  it("reports backend-only compare capabilities", () => {
    expect(getCompareSecuritiesCapabilities()).toMatchObject({
      allow_fx_conversion_without_rate: false,
      frontend_rendering: false,
      high_cost_queueing: true,
      high_cost_threshold: 8,
      live_data_access: false,
      max_securities: 5,
      min_securities: 2,
      package: "@aiphabee/analytics-tools",
      queue_route: "POST /analytics/high-cost/plan",
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
      high_cost_queueing: true,
      high_cost_threshold: 8,
      live_data_access: false,
      point_in_time_guard: true,
      preview_execution: true,
      prevents_future_classification: true,
      queue_route: "POST /analytics/high-cost/plan",
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

  it("reports saved screening and periodic run capabilities", () => {
    expect(getSavedScreeningCapabilities()).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      live_db_writes: false,
      live_execution: false,
      periodic_run_planning: true,
      point_in_time_re_evaluation: true,
      queue_writes: false,
      route: "POST /analytics/saved-screenings/plan",
      runtime_route: "GET /analytics/runtime",
      source_tool: "screen_securities",
      status: "saved_screening_schedule_scaffold",
      supported_cadences: ["manual", "daily", "weekly"],
      tool_name: "plan_saved_screening",
      workflow_execution: false
    });
  });

  it("plans saved screening with a weekly schedule without writes", () => {
    const result = createSavedScreeningPlan({
      cadence: "weekly",
      name: "High quality revenue screen",
      naturalLanguage: "revenue above 100000 and profitable",
      nextRunAt: "2026-01-12T09:00:00+08:00",
      notificationChannels: ["in_app", "email"],
      ownerUserId: "usr_internal_001",
      requestId: "req_saved_screening_weekly",
      workspaceId: "ws_internal_alpha"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      live_execution: false,
      status: "planned_no_write",
      toolName: "plan_saved_screening"
    });
    expect(result.saved_screening).toMatchObject({
      name: "High quality revenue screen",
      screen_route: "POST /analytics/screen-securities",
      screen_status: "planned_with_preview",
      status: "would_save",
      workspace_id: "ws_internal_alpha"
    });
    expect(result.saved_screening.parsed_conditions).toHaveLength(2);
    expect(result.schedule).toEqual({
      cadence: "weekly",
      enabled: true,
      next_run_at: "2026-01-12T09:00:00+08:00",
      notification_channels: ["in_app", "email"],
      timezone: "Asia/Hong_Kong"
    });
    expect(result.periodic_run_policy).toMatchObject({
      high_cost_queue_route: "POST /analytics/high-cost/plan",
      point_in_time_re_evaluation: true,
      queue_writes: false,
      source_tool: "screen_securities",
      workflow_execution: false
    });
    expect(result.persistence_plan).toEqual({
      live_db_writes: false,
      sql_emitted: false,
      tables: [
        "core.saved_screening",
        "core.saved_screening_run_schedule",
        "core.saved_screening_run"
      ],
      write_status: "planned_no_write"
    });
  });

  it("blocks saved screening plans without workspace and owner context", () => {
    const result = createSavedScreeningPlan({
      naturalLanguage: "revenue above 100000",
      requestId: "req_saved_screening_missing_workspace"
    });

    expect(result.status).toBe("blocked_missing_workspace");
    expect(result.saved_screening.status).toBe("blocked");
    expect(result.persistence_plan.live_db_writes).toBe(false);
  });

  it("reports high-cost analytics queue capabilities", () => {
    expect(getHighCostAnalyticsQueueCapabilities()).toMatchObject({
      durable_queue_writes: false,
      high_cost_threshold: 8,
      independent_concurrency_pool: true,
      max_parallel_high_cost: 2,
      ordinary_pool_protected: true,
      queue_name: "analytics-high-cost",
      route: "POST /analytics/high-cost/plan",
      status: "high_cost_analytics_queue_scaffold",
      supported_tools: ["screen_securities", "compare_securities", "run_event_study"],
      tool_name: "plan_high_cost_analytics",
      usage_policy: {
        failure_refund_required: true,
        pre_debit_required: true,
        requires_confirmation_before_enqueue: true,
        usage_ledger_link_required: true
      }
    });
  });

  it("requires confirmation before queueing high-cost screens", () => {
    const result = planHighCostAnalyticsQueue({
      requestId: "req_high_cost_screen",
      toolName: "screen_securities",
      universeSize: 500,
      userConfirmed: false
    });

    expect(result).toMatchObject({
      durable_queue_writes: false,
      frontend_rendering: false,
      live_data_access: false,
      status: "confirmation_required",
      toolName: "plan_high_cost_analytics"
    });
    expect(result.cost_estimate).toMatchObject({
      credit_weight: 13,
      high_cost_threshold: 8,
      rows_estimate: 500,
      tool_weight_range: {
        max: 20,
        min: 8
      }
    });
    expect(result.scheduling_decision).toMatchObject({
      analytics_tool_name: "screen_securities",
      concurrency_pool: "analytics_high_cost",
      independent_pool_required: true,
      ordinary_pool_protected: true,
      queue_name: "analytics-high-cost",
      queue_required: true
    });
    expect(result.enqueue_plan).toMatchObject({
      queue_key: "analytics-high-cost:screen_securities:req_high_cost_screen:screen_securities",
      status: "awaiting_confirmation"
    });
    expect(result.usage_policy).toMatchObject({
      failure_refund_required: true,
      pre_debit_required: true,
      user_confirmed: false
    });
  });

  it("plans confirmed large comparisons into the high-cost pool", () => {
    const result = planHighCostAnalyticsQueue({
      metricCount: 4,
      requestId: "req_high_cost_compare",
      securities: ["00700.HK", "00001.HK", "00005.HK", "00011.HK", "00012.HK"],
      toolName: "compare_securities",
      userConfirmed: true
    });

    expect(result.status).toBe("queued_planned");
    expect(result.cost_estimate.credit_weight).toBe(8);
    expect(result.scheduling_decision).toMatchObject({
      concurrency_pool: "analytics_high_cost",
      independent_pool_required: true,
      queue_required: true
    });
    expect(result.enqueue_plan).toMatchObject({
      planned_task_id: "planned_compare_securities_req_high_cost_compare:compare_securities",
      status: "would_enqueue"
    });
    expect(result.usage_policy.user_confirmed).toBe(true);
  });

  it("keeps small comparisons on the standard analytics pool", () => {
    const result = planHighCostAnalyticsQueue({
      requestId: "req_standard_compare",
      securities: ["00700.HK", "00001.HK"],
      toolName: "compare_securities"
    });

    expect(result.status).toBe("inline_allowed");
    expect(result.cost_estimate.credit_weight).toBe(5);
    expect(result.scheduling_decision).toMatchObject({
      concurrency_pool: "analytics_standard",
      independent_pool_required: false,
      inline_allowed: true,
      max_parallel: 8,
      queue_required: false
    });
    expect(result.enqueue_plan.status).toBe("not_required");
  });

  it("plans event studies into the high-cost analytics pool", () => {
    const result = planHighCostAnalyticsQueue({
      eventCount: 2,
      eventWindowDays: 5,
      requestId: "req_high_cost_event_study",
      toolName: "run_event_study",
      userConfirmed: true
    });

    expect(result.status).toBe("queued_planned");
    expect(result.cost_estimate).toMatchObject({
      credit_weight: 27,
      high_cost_threshold: 8,
      rows_estimate: 10,
      tool_weight_range: {
        max: 50,
        min: 20
      }
    });
    expect(result.cost_estimate.reason_codes).toEqual([
      "prd_event_study_weight_20_50",
      "event_study_uses_independent_pool"
    ]);
    expect(result.scheduling_decision).toMatchObject({
      analytics_tool_name: "run_event_study",
      concurrency_pool: "analytics_high_cost",
      independent_pool_required: true,
      queue_required: true
    });
    expect(result.enqueue_plan).toMatchObject({
      planned_task_id: "planned_run_event_study_req_high_cost_event_study:run_event_study",
      status: "would_enqueue"
    });
  });

  it("reports portfolio analytics capabilities without trading advice", () => {
    expect(getPortfolioAnalyticsCapabilities()).toMatchObject({
      analytics_sections: ["allocation", "concentration", "returns_risk_summary"],
      authorized_holdings_required: true,
      frontend_rendering: false,
      live_data_access: false,
      personalized_advice: false,
      route: "POST /analytics/portfolio",
      sql_emitted: false,
      status: "portfolio_analytics_scaffold",
      tool_name: "get_portfolio_analytics",
      trading_advice: false
    });
  });

  it("blocks portfolio analytics without authorized holdings", () => {
    const result = getPortfolioAnalytics({
      positions: [
        {
          marketValue: 70000,
          securityQuery: "00700.HK"
        }
      ],
      requestId: "req_portfolio_blocked"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "blocked_authorization",
      toolName: "get_portfolio_analytics"
    });
    expect(result.authorization).toEqual({
      authorized_holdings_required: true,
      authorized_holdings_supplied: false,
      portfolio_scope: "user_authorized_holdings_only"
    });
    expect(result.trading_advice).toEqual({
      buy_sell_hold_recommendation: false,
      personalized_advice: false,
      rebalance_instruction: false
    });
  });

  it("plans portfolio allocation, concentration, and weighted risk from authorized holdings", () => {
    const result = getPortfolioAnalytics({
      authorizedHoldings: true,
      positions: [
        {
          quantity: 100,
          securityQuery: "00700.HK"
        },
        {
          marketValue: 10000,
          securityQuery: "00001.HK"
        }
      ],
      requestId: "req_portfolio_analytics",
      workspaceId: "ws_authorized_portfolio"
    });

    expect(result).toMatchObject({
      analytics_sections: ["allocation", "concentration", "returns_risk_summary"],
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_portfolio_analytics",
      workspace_id: "ws_authorized_portfolio"
    });
    expect(result.allocation).toMatchObject({
      currency: "HKD",
      included_position_count: 2,
      total_market_value: 54820
    });
    expect(result.positions.map((position) => [position.symbol, position.status, position.weight])).toEqual([
      ["00700.HK", "included", 0.817585],
      ["00001.HK", "included", 0.182415]
    ]);
    expect(result.concentration).toEqual({
      issuer_count: 2,
      top3_weight: 1,
      top_position_weight: 0.817585
    });
    expect(result.risk_summary).toMatchObject({
      computed_position_count: 1,
      portfolio_beta: 0.817585,
      portfolio_total_return: 0.00997,
      weighted_average_daily_return: 0.005941
    });
    expect(result.trading_advice.buy_sell_hold_recommendation).toBe(false);
    expect(result.positions[0]?.source_record_ids.length).toBeGreaterThan(0);
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

  it("reports event study capabilities", () => {
    expect(getEventStudyCapabilities()).toMatchObject({
      abnormal_return_method: "security_return_minus_benchmark_return",
      formula_version: "event-study-v0",
      frontend_rendering: false,
      high_cost_queueing: true,
      high_cost_threshold: 8,
      live_data_access: false,
      route: "POST /analytics/event-study",
      sample_missing_policy: "surface_missing_dates_do_not_drop",
      status: "event_study_scaffold",
      tool_name: "run_event_study"
    });
  });

  it("runs deterministic event study with event date, window, benchmark, and abnormal returns", () => {
    const result = runEventStudy({
      benchmarkSecurityQuery: "00700.HK",
      eventDate: "2026-01-06",
      requestId: "req_event_study_001",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      price_history_status: "found",
      status: "computed",
      toolName: "run_event_study"
    });
    expect(result.event).toMatchObject({
      event_date: "2026-01-06",
      event_id: "synthetic_00700_results_event"
    });
    expect(result.event_window).toEqual({
      from: "2026-01-05",
      post_days: 1,
      pre_days: 1,
      requested_observation_count: 3,
      to: "2026-01-07"
    });
    expect(result.benchmark).toMatchObject({
      instrument_id: "eq_hk_00700",
      label: "resolved_security_benchmark",
      price_history_status: "found"
    });
    expect(result.methodology).toMatchObject({
      abnormal_return_method: "security_return_minus_benchmark_return",
      formula_version: "event-study-v0",
      point_in_time: true,
      sample_missing_policy: "surface_missing_dates_do_not_drop"
    });
    expect(result.observations.map((observation) => [
      observation.date,
      observation.relative_day,
      observation.security_return,
      observation.benchmark_return,
      observation.abnormal_return,
      observation.status
    ])).toEqual([
      ["2026-01-05", -1, 0.0096, 0.0096, 0, "computed"],
      ["2026-01-06", 0, 0.005, 0.005, 0, "computed"],
      ["2026-01-07", 1, 0.0072, 0.0072, 0, "computed"]
    ]);
    expect(result.summary).toMatchObject({
      computed_observation_count: 3,
      cumulative_abnormal_return: 0,
      cumulative_benchmark_return: 0.021953,
      cumulative_security_return: 0.021953,
      missing_observation_count: 0,
      requested_observation_count: 3
    });
  });

  it("surfaces missing event-window observations instead of silently dropping them", () => {
    const result = runEventStudy({
      benchmarkSecurityQuery: "00700.HK",
      eventDate: "2026-01-06",
      requestId: "req_event_study_missing",
      securityQuery: "00700.HK",
      windowPreDays: 2
    });

    expect(result.status).toBe("partial");
    expect(result.event_window).toMatchObject({
      from: "2026-01-04",
      requested_observation_count: 4,
      to: "2026-01-07"
    });
    expect(result.missing_observations).toEqual([
      {
        date: "2026-01-04",
        reason: "missing_security_and_benchmark_return",
        relative_day: -2
      }
    ]);
    expect(result.observations[0]).toMatchObject({
      date: "2026-01-04",
      relative_day: -2,
      status: "missing_security_and_benchmark_return"
    });
    expect(result.summary).toMatchObject({
      computed_observation_count: 3,
      missing_observation_count: 1,
      requested_observation_count: 4
    });
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

  it("reports market statistics capabilities", () => {
    expect(getMarketBreadthCapabilities()).toMatchObject({
      authorized_market_statistics_required: true,
      frontend_rendering: false,
      live_data_access: false,
      route: "POST /analytics/market-breadth",
      source_required: true,
      sql_emitted: false,
      status: "market_breadth_scaffold",
      tool_name: "get_market_breadth"
    });
    expect(getOwnershipAndShortSellingCapabilities()).toMatchObject({
      authorized_market_statistics_required: true,
      frontend_rendering: false,
      live_data_access: false,
      route: "POST /analytics/ownership-short-selling",
      source_required: true,
      sql_emitted: false,
      status: "ownership_short_selling_scaffold",
      tool_name: "get_ownership_and_short_selling"
    });
    expect(getBuybacksAndPlacementsCapabilities()).toMatchObject({
      authorized_market_statistics_required: true,
      event_types: ["buyback", "placement", "rights_issue"],
      frontend_rendering: false,
      live_data_access: false,
      route: "POST /analytics/buybacks-placements",
      source_required: true,
      sql_emitted: false,
      status: "buybacks_placements_scaffold",
      tool_name: "get_buybacks_and_placements"
    });
  });

  it("plans market breadth only when market statistics are authorized", () => {
    const blocked = getMarketBreadth({
      requestId: "req_market_breadth_blocked"
    });
    const planned = getMarketBreadth({
      authorizedMarketStatistics: true,
      market: "HK",
      requestId: "req_market_breadth_authorized",
      universe: ["00700.HK", "00001.HK", "00005.HK"]
    });

    expect(blocked).toMatchObject({
      live_data_access: false,
      sql_emitted: false,
      status: "blocked_authorization",
      toolName: "get_market_breadth"
    });
    expect(blocked.authorization.authorized_market_statistics_supplied).toBe(false);
    expect(planned).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      market: "HK",
      sql_emitted: false,
      status: "planned",
      toolName: "get_market_breadth"
    });
    expect(planned.authorization).toEqual({
      authorized_market_statistics_required: true,
      authorized_market_statistics_supplied: true,
      dataset_scope: "market_statistics_authorized_only"
    });
    expect(planned.breadth.advances).toBeGreaterThan(planned.breadth.declines);
    expect(planned.breadth.industry_width.map((row) => row.industry)).toEqual([
      "technology",
      "financials",
      "consumer"
    ]);
    expect(planned.source_record_ids).toContain("synthetic_market_breadth_technology_20260107");
  });

  it("blocks ownership and short-selling data without authorization", () => {
    const result = getOwnershipAndShortSelling({
      requestId: "req_ownership_blocked",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      live_data_access: false,
      sql_emitted: false,
      status: "blocked_authorization",
      toolName: "get_ownership_and_short_selling"
    });
    expect(result.authorization.authorized_market_statistics_supplied).toBe(false);
    expect(result.ownership.shareholding_disclosures).toEqual([]);
    expect(result.short_selling.short_turnover).toBe(0);
    expect(result.source_record_ids).toEqual([]);
  });

  it("plans authorized ownership and short-selling analysis with source records", () => {
    const result = getOwnershipAndShortSelling({
      authorizedMarketStatistics: true,
      requestId: "req_ownership_authorized",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_ownership_and_short_selling"
    });
    expect(result.security).toMatchObject({
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(result.ownership.shareholding_disclosures).toHaveLength(2);
    expect(result.short_selling).toMatchObject({
      short_turnover: 186000000,
      short_turnover_ratio: 0.0915
    });
    expect(result.source_record_ids).toContain("synthetic_short_selling_00700_20260107");
  });

  it("plans authorized buybacks placements and rights issues with source records", () => {
    const result = getBuybacksAndPlacements({
      authorizedMarketStatistics: true,
      requestId: "req_capital_events_authorized",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_buybacks_and_placements"
    });
    expect(result.capital_events.map((event) => event.event_type)).toEqual([
      "buyback",
      "placement",
      "rights_issue"
    ]);
    expect(result.capital_events[0]).toMatchObject({
      currency: "HKD",
      source_record_id: "synthetic_buyback_00700_20260105",
      status: "completed"
    });
    expect(result.source_record_ids).toContain("synthetic_placement_00700_20260106");
  });

  it("reports consensus estimates capabilities with redistribution rights gate", () => {
    expect(getConsensusOrEstimatesCapabilities()).toMatchObject({
      analytics_sections: ["consensus_rating", "target_price", "financial_estimates"],
      frontend_rendering: false,
      investment_advice: false,
      live_data_access: false,
      raw_provider_payload: false,
      redistribution_rights_required: true,
      route: "POST /analytics/consensus-estimates",
      source_required: true,
      sql_emitted: false,
      status: "consensus_estimates_scaffold",
      supported_metrics: ["revenue", "eps", "ebitda"],
      tool_name: "get_consensus_or_estimates"
    });
  });

  it("blocks consensus estimates without redistribution rights", () => {
    const result = getConsensusOrEstimates({
      requestId: "req_consensus_blocked",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      investment_advice: false,
      live_data_access: false,
      raw_provider_payload: false,
      sql_emitted: false,
      status: "blocked_redistribution_rights",
      toolName: "get_consensus_or_estimates"
    });
    expect(result.rights.redistribution_rights_confirmed).toBe(false);
    expect(result.estimates).toEqual([]);
    expect(result.source_record_ids).toEqual([]);
    expect(result.usage.credits).toBe(0);
  });

  it("plans consensus estimates only after redistribution rights are confirmed", () => {
    const result = getConsensusOrEstimates({
      fiscalYears: [2027],
      metrics: ["eps"],
      redistributionRightsConfirmed: true,
      requestId: "req_consensus_authorized",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      frontend_rendering: false,
      investment_advice: false,
      live_data_access: false,
      raw_provider_payload: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_consensus_or_estimates"
    });
    expect(result.rights).toEqual({
      allowed_surfaces: ["web", "mcp", "export"],
      redistribution_rights_confirmed: true,
      redistribution_rights_required: true,
      rights_scope: "consensus_estimates_redistribution_confirmed_only"
    });
    expect(result.security).toMatchObject({
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(result.consensus.target_price).toMatchObject({
      currency: "HKD",
      median: 462
    });
    expect(result.estimates).toEqual([
      expect.objectContaining({
        fiscal_year: 2027,
        mean: 19.8,
        metric_id: "eps",
        source_record_ids: ["synthetic_consensus_eps_00700_2027"]
      })
    ]);
    expect(result.source_record_ids).toContain("synthetic_consensus_rating_00700_20260107");
    expect(result.source_record_ids).toContain("synthetic_consensus_eps_00700_2027");
  });
});
