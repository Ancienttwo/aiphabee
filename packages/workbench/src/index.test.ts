import { describe, expect, it } from "vitest";
import {
  createStockWorkbenchSnapshot,
  getStockWorkbenchCapabilities
} from "./index";

describe("stock workbench aggregate scaffold", () => {
  it("reports backend-only aggregate capabilities", () => {
    expect(getStockWorkbenchCapabilities()).toMatchObject({
      actual_tool_execution: true,
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
      "corporate_actions"
    ]);
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
      corporate_actions: "found",
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
    expect(snapshot.corporate_actions.timeline?.actions[0]?.actionType).toBe("dividend");
    expect(snapshot.unsupported_sections).toEqual({
      announcements: "planned",
      derived_valuation_metrics: "planned"
    });
  });

  it("blocks ambiguous security resolution without guessing", () => {
    const snapshot = createStockWorkbenchSnapshot({
      requestId: "req_workbench_ambiguous",
      securityQuery: "ABC"
    });

    expect(snapshot.status).toBe("blocked_resolution");
    expect(snapshot.resolve_security?.status).toBe("ambiguous");
    expect(snapshot.instrument_id).toBeUndefined();
    expect(snapshot.data_quality.blocking_statuses).toContain("not_found");
  });
});
