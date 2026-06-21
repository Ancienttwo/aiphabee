import { describe, expect, it } from "vitest";
import {
  createStockWorkbenchAnnouncementSearch,
  createStockWorkbenchSnapshot,
  getStockWorkbenchCapabilities
} from "./index";

describe("stock workbench aggregate scaffold", () => {
  it("reports backend-only aggregate capabilities", () => {
    expect(getStockWorkbenchCapabilities()).toMatchObject({
      actual_tool_execution: true,
      announcement_route: "POST /workbench/stock/announcements",
      frontend_rendering: false,
      live_data_access: false,
      package: "@aiphabee/workbench",
      route: "POST /workbench/stock/snapshot",
      runtime_route: "GET /workbench/runtime",
      sql_emitted: false,
      status: "stock_workbench_aggregate_scaffold"
    });
    expect(getStockWorkbenchCapabilities().sections).toEqual([
      "security_profile",
      "quote_snapshot",
      "price_history",
      "financial_facts",
      "derived_metrics",
      "announcement_search",
      "corporate_actions"
    ]);
    expect(getStockWorkbenchCapabilities().announcement_search).toMatchObject({
      evidence_locator_ready: true,
      external_href_authority: false,
      original_document_fetch: false
    });
    expect(getStockWorkbenchCapabilities().derived_metrics).toMatchObject({
      formula_version: "stock-workbench-derived-metrics-v0",
      valuation_requires_market_cap: true
    });
  });

  it("aggregates profile, quote, price history, financial facts, and actions", () => {
    const snapshot = createStockWorkbenchSnapshot({
      requestId: "req_workbench_001",
      securityQuery: "00700.HK"
    });

    expect(snapshot).toMatchObject({
      actual_tool_execution: true,
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      sql_emitted: false,
      status: "ready"
    });
    expect(snapshot.data_quality.section_statuses).toEqual({
      announcement_search: "found",
      corporate_actions: "found",
      derived_metrics: "found",
      financial_facts: "found",
      price_history: "found",
      quote_snapshot: "found",
      security_profile: "found"
    });
    expect(snapshot.security_profile.profile).toMatchObject({
      currency: "HKD",
      instrumentId: "eq_hk_00700",
      market: "HK",
      symbol: "00700.HK"
    });
    expect(snapshot.quote_snapshot.quote?.fields.lastPrice).toBe(448.2);
    expect(snapshot.price_history.history?.adjustment).toBe("total_return_adjusted");
    expect(snapshot.financial_facts.facts?.facts.map((fact) => fact.metricId)).toEqual([
      "assets",
      "equity",
      "net_income",
      "revenue"
    ]);
    expect(
      snapshot.derived_metrics.metrics
        .filter((metric) => metric.status === "computed")
        .map((metric) => [metric.metric_id, metric.value])
    ).toEqual([
      ["net_margin", 0.189184],
      ["return_on_assets", 0.073386],
      ["return_on_equity", 0.13915],
      ["asset_turnover", 0.387908],
      ["equity_multiplier", 1.896135]
    ]);
    expect(
      snapshot.derived_metrics.metrics
        .filter((metric) => metric.category === "valuation")
        .map((metric) => [metric.metric_id, metric.status, metric.blocked_reason])
    ).toEqual([
      ["price_to_earnings", "blocked", "market_cap_unavailable"],
      ["price_to_sales", "blocked", "market_cap_unavailable"],
      ["price_to_book", "blocked", "market_cap_unavailable"]
    ]);
    expect(snapshot.derived_metrics.definitions[0]).toMatchObject({
      formula: "net_income / revenue",
      formula_version: "stock-workbench-derived-metrics-v0",
      metric_id: "net_margin"
    });
    expect(snapshot.announcement_search).toMatchObject({
      evidence_locator_ready: true,
      original_document_fetch: false,
      row_count: 3,
      status: "found"
    });
    expect(snapshot.announcement_search.announcements[0]).toMatchObject({
      category: "buyback",
      evidence_locator: {
        external_href_authority: false,
        locator_type: "synthetic_original_locator",
        page: 1
      },
      source_record_id: "src_announcement_00700_20260106_buyback"
    });
    expect(snapshot.corporate_actions.timeline?.actions[0]?.actionType).toBe("dividend");
    expect(snapshot.unsupported_sections).toEqual({
      full_announcement_document_search: "phase_2_planned"
    });
  });

  it("searches stock workbench announcements with evidence locators", () => {
    const result = createStockWorkbenchAnnouncementSearch({
      categories: ["dividend"],
      keyword: "timetable",
      requestId: "req_workbench_announcements",
      securityQuery: "00700.HK"
    });

    expect(result).toMatchObject({
      evidence_locator_ready: true,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      original_document_fetch: false,
      row_count: 1,
      status: "found"
    });
    expect(result.announcements[0]).toMatchObject({
      category: "dividend",
      evidence_locator: {
        anchor: "dividend-timetable",
        original_url:
          "urn:aiphabee:synthetic:announcement:ann_00700_20260103_dividend#page=2&anchor=dividend-timetable"
      },
      title: "Dividend Timetable Update"
    });
  });

  it("blocks ambiguous security resolution without guessing", () => {
    const snapshot = createStockWorkbenchSnapshot({
      requestId: "req_workbench_ambiguous",
      securityQuery: "ABC"
    });

    expect(snapshot.status).toBe("blocked_resolution");
    expect(snapshot.announcement_search.status).toBe("blocked_resolution");
    expect(snapshot.resolve_security?.status).toBe("ambiguous");
    expect(snapshot.instrument_id).toBeUndefined();
    expect(snapshot.data_quality.blocking_statuses).toContain("not_found");
  });
});
