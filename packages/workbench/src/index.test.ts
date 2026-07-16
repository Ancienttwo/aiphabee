import { describe, expect, it } from "vitest";
import {
  createStockWorkbenchAnnouncementSearch,
  createStockWorkbenchSnapshot,
  createLiveDerivedMetrics,
  getStockWorkbenchCapabilities
} from "./index";
import {
  GET_FINANCIAL_FACTS_LIVE_VERSION,
  type GetLiveFinancialFactsResult,
  type LiveFinancialFactRow
} from "@aiphabee/financial-facts";
import {
  GET_QUOTE_SNAPSHOT_LIVE_VERSION,
  type GetLiveQuoteSnapshotResult,
  type LiveQuoteSnapshotRow
} from "@aiphabee/market-data";

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

describe("live derived metrics (Netquity Serving Store)", () => {
  it("computes every profitability and valuation metric from live financial facts and an available quote", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", sourceRecordId: "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F", value: 200_000 }),
        financialFactRow({ metricId: "assets", sourceRecordId: "netquity:finreport.pla_nb.total_assets:00700:2025-12-31:F", statementType: "balance_sheet", value: 2_000_000 }),
        financialFactRow({ metricId: "equity", sourceRecordId: "netquity:finreport.pla_nb.total_equity:00700:2025-12-31:F", statementType: "balance_sheet", value: 800_000 })
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow())
    });

    expect(result.live_data_access).toBe(true);
    expect(result.status).toBe("computed");
    expect(result.data_version).toBe(
      "financial_facts:netquity-financial-facts-test.v1|quote_snapshot:netquity-quote-snapshot-test.v1"
    );
    expect(result.methodology_version).toBe("2026-07-16.stock-workbench-derived-metrics-live.v1");
    expect(result.financial_facts_as_of).toBe("2026-07-14T00:00:00.000Z");
    expect(result.financial_period_end).toBe("2025-12-31");
    expect(result.quote_as_of).toBe("2026-07-15T00:00:00.000Z");
    expect(result.provenance).toHaveLength(5);
    expect(result.provenance.filter((p) => p.source === "netquity-finreport-nb")).toHaveLength(4);
    expect(result.provenance.filter((p) => p.source === "netquity-unadjprice2-daily")).toHaveLength(1);

    const byId = new Map(result.metrics.map((m) => [m.metric_id, m]));
    expect(byId.get("net_margin")).toMatchObject({ anomaly_flags: [], status: "computed", value: 0.2 });
    expect(byId.get("return_on_assets")).toMatchObject({ status: "computed", value: 0.1 });
    expect(byId.get("return_on_equity")).toMatchObject({ status: "computed", value: 0.25 });
    expect(byId.get("asset_turnover")).toMatchObject({ status: "computed", value: 0.5 });
    expect(byId.get("equity_multiplier")).toMatchObject({ status: "computed", value: 2.5 });
    expect(byId.get("price_to_earnings")).toMatchObject({ anomaly_flags: [], status: "computed", value: 25 });
    expect(byId.get("price_to_sales")).toMatchObject({ status: "computed", value: 5 });
    expect(byId.get("price_to_book")).toMatchObject({ status: "computed", value: 6.25 });
    expect(byId.get("price_to_earnings")?.inputs).toMatchObject({
      market_cap: 5_000_000,
      net_income: 200_000,
      quote_close: 100,
      shares_outstanding: 50_000
    });
  });

  it("flags a currency mismatch without blocking the computed valuation metric", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", value: 200_000 })
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow({ currency: "USD" }))
    });

    const priceToEarnings = result.metrics.find((m) => m.metric_id === "price_to_earnings");
    expect(priceToEarnings).toMatchObject({
      anomaly_flags: ["currency_mismatch"],
      status: "computed",
      value: 25
    });
  });

  it("blocks every metric on financial_facts_not_found when the financial dataset has no released row, even with an available quote", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: undefined,
      quoteSnapshot: quoteSnapshotResult(quoteRow())
    });

    expect(result.status).toBe("blocked");
    expect(result.financial_facts_as_of).toBeUndefined();
    expect(result.financial_period_end).toBeUndefined();
    for (const metric of result.metrics) {
      expect(metric.status).toBe("blocked");
      expect(metric.blocked_reason).toBe("financial_facts_not_found");
    }
  });

  it("blocks only valuation metrics on quote_unavailable when the quote dataset has no released row", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", value: 200_000 }),
        financialFactRow({ metricId: "assets", statementType: "balance_sheet", value: 2_000_000 }),
        financialFactRow({ metricId: "equity", statementType: "balance_sheet", value: 800_000 })
      ]),
      quoteSnapshot: undefined
    });

    expect(result.status).toBe("partial");
    const byCategory = groupByCategory(result);
    for (const metric of byCategory.profitability) {
      expect(metric.status).toBe("computed");
    }
    for (const metric of byCategory.valuation) {
      expect(metric.status).toBe("blocked");
      expect(metric.blocked_reason).toBe("quote_unavailable");
    }
  });

  it("blocks valuation metrics on quote_unavailable when the quote row exists with an unavailable coverage marker", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", value: 200_000 })
      ]),
      quoteSnapshot: quoteSnapshotResult(undefined)
    });

    const priceToEarnings = result.metrics.find((m) => m.metric_id === "price_to_earnings");
    expect(priceToEarnings).toMatchObject({ blocked_reason: "quote_unavailable", status: "blocked" });
  });

  it("blocks valuation metrics on shares_outstanding_unavailable when the quote has a close price but no share count (the dominant real-world case)", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", value: 200_000 })
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow({ sharesOutstanding: undefined }))
    });

    const priceToEarnings = result.metrics.find((m) => m.metric_id === "price_to_earnings");
    expect(priceToEarnings).toMatchObject({
      blocked_reason: "shares_outstanding_unavailable",
      inputs: { quote_close: 100 },
      status: "blocked"
    });
  });

  it("blocks a single metric on missing_input when only its specific financial fact was not promoted this period", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", value: 200_000 }),
        financialFactRow({ metricId: "assets", statementType: "balance_sheet", value: 2_000_000 })
        // equity intentionally absent
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow())
    });

    const byId = new Map(result.metrics.map((m) => [m.metric_id, m]));
    expect(byId.get("return_on_equity")).toMatchObject({ blocked_reason: "missing_input", status: "blocked" });
    expect(byId.get("equity_multiplier")).toMatchObject({ blocked_reason: "missing_input", status: "blocked" });
    expect(byId.get("price_to_book")).toMatchObject({ blocked_reason: "missing_input", status: "blocked" });
    expect(byId.get("net_margin")).toMatchObject({ status: "computed" });
    expect(byId.get("price_to_earnings")).toMatchObject({ status: "computed" });
  });

  it("blocks only the metrics that depend on a quality-held financial fact", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", qualityState: "HOLD", value: 200_000 }),
        financialFactRow({ metricId: "assets", statementType: "balance_sheet", value: 2_000_000 }),
        financialFactRow({ metricId: "equity", statementType: "balance_sheet", value: 800_000 })
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow())
    });

    const byId = new Map(result.metrics.map((m) => [m.metric_id, m]));
    expect(byId.get("net_margin")).toMatchObject({ blocked_reason: "quality_hold", status: "blocked" });
    expect(byId.get("return_on_assets")).toMatchObject({ blocked_reason: "quality_hold", status: "blocked" });
    expect(byId.get("price_to_earnings")).toMatchObject({ blocked_reason: "quality_hold", status: "blocked" });
    expect(byId.get("asset_turnover")).toMatchObject({ status: "computed" });
    expect(byId.get("equity_multiplier")).toMatchObject({ status: "computed" });
    expect(byId.get("price_to_sales")).toMatchObject({ status: "computed" });
  });

  it("blocks on zero_denominator and negative_denominator without dividing by zero or presenting a negative ratio", () => {
    const zero = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "net_income", value: 200_000 }),
        financialFactRow({ metricId: "equity", statementType: "balance_sheet", value: 0 })
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow())
    });
    const zeroById = new Map(zero.metrics.map((m) => [m.metric_id, m]));
    expect(zeroById.get("return_on_equity")).toMatchObject({ blocked_reason: "zero_denominator", status: "blocked" });
    expect(zeroById.get("price_to_book")).toMatchObject({ blocked_reason: "zero_denominator", status: "blocked" });

    const negative = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "net_income", value: 200_000 }),
        financialFactRow({ metricId: "equity", statementType: "balance_sheet", value: -800_000 })
      ]),
      quoteSnapshot: quoteSnapshotResult(quoteRow())
    });
    const negativeById = new Map(negative.metrics.map((m) => [m.metric_id, m]));
    expect(negativeById.get("return_on_equity")).toMatchObject({ blocked_reason: "negative_denominator", status: "blocked" });
    expect(negativeById.get("price_to_book")).toMatchObject({ blocked_reason: "negative_denominator", status: "blocked" });
  });

  it("blocks every metric without fabricating a market cap when both live datasets are absent", () => {
    const result = createLiveDerivedMetrics({});

    expect(result.status).toBe("blocked");
    expect(result.data_version).toBe("");
    expect(result.provenance).toEqual([]);
    expect(result.financial_facts_as_of).toBeUndefined();
    expect(result.quote_as_of).toBeUndefined();
    for (const metric of result.metrics) {
      expect(metric.status).toBe("blocked");
      expect(metric.blocked_reason).toBe("financial_facts_not_found");
      expect(metric.value).toBeUndefined();
      if (metric.metric_id.startsWith("price_to")) {
        expect(metric.inputs.market_cap).toBeUndefined();
      }
    }
  });

  it("picks the freshest fact per metric by periodEnd desc then publishedAt desc, since live facts carry no restatementVersion", () => {
    const result = createLiveDerivedMetrics({
      financialFacts: financialFactsResult([
        financialFactRow({ metricId: "revenue", periodEnd: "2024-12-31", publishedAt: "2025-03-18T00:00:00+08:00", value: 900_000 }),
        financialFactRow({ metricId: "revenue", periodEnd: "2025-12-31", publishedAt: "2026-03-18T00:00:00+08:00", value: 1_000_000 }),
        financialFactRow({ metricId: "net_income", periodEnd: "2025-12-31", publishedAt: "2026-03-18T00:00:00+08:00", value: 200_000 }),
        financialFactRow({ metricId: "net_income", periodEnd: "2025-12-31", publishedAt: "2026-04-01T00:00:00+08:00", value: 210_000 })
      ])
    });

    const netMargin = result.metrics.find((m) => m.metric_id === "net_margin");
    // revenue: latest periodEnd wins (1_000_000, not 900_000).
    // net_income: same periodEnd, latest publishedAt wins (210_000, not 200_000).
    expect(netMargin?.inputs).toMatchObject({ net_income: 210_000, revenue: 1_000_000 });
  });
});

function financialFactRow(overrides: Partial<LiveFinancialFactRow> = {}): LiveFinancialFactRow {
  return {
    currency: "HKD",
    instrumentId: "hkex_security_00700",
    metricId: "revenue",
    periodEnd: "2025-12-31",
    periodType: "FY",
    publishedAt: "2026-03-18T00:00:00+08:00",
    qualityState: "PASS",
    scale: 1,
    sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F",
    statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
    statementType: "income_statement",
    unit: "unit",
    value: 1_000_000,
    ...overrides
  };
}

function financialFactsResult(
  facts: LiveFinancialFactRow[],
  overrides: Partial<GetLiveFinancialFactsResult> = {}
): GetLiveFinancialFactsResult {
  const dataVersion = "netquity-financial-facts-test.v1";
  return {
    asOf: "2026-07-14T00:00:00.000Z",
    coverage: { status: "available" },
    dataVersion,
    facts,
    instrumentId: "hkex_security_00700",
    liveDataAccess: true,
    methodologyVersion: GET_FINANCIAL_FACTS_LIVE_VERSION,
    provenance: facts.map((fact) => ({
      data_version: dataVersion,
      methodology_version: GET_FINANCIAL_FACTS_LIVE_VERSION,
      source: "netquity-finreport-nb",
      source_record_id: fact.sourceRecordId
    })),
    status: "found",
    toolName: "get_financial_facts",
    usage: { cached: false, credits: 0, rows: facts.length },
    ...overrides
  };
}

function quoteRow(overrides: Partial<LiveQuoteSnapshotRow> = {}): LiveQuoteSnapshotRow {
  return {
    close: 100,
    currency: "HKD",
    high: 101,
    instrumentId: "hkex_security_00700",
    low: 99,
    open: 100,
    sharesOutstanding: 50_000,
    tradeDate: "2026-07-07",
    turnover: 5_000_000,
    volume: 50_000,
    ...overrides
  };
}

function quoteSnapshotResult(
  quote: LiveQuoteSnapshotRow | undefined,
  overrides: Partial<GetLiveQuoteSnapshotResult> = {}
): GetLiveQuoteSnapshotResult {
  const dataVersion = "netquity-quote-snapshot-test.v1";
  return {
    asOf: "2026-07-15T00:00:00.000Z",
    coverage: quote ? { status: "available" } : { reason: "no daily row", status: "unavailable" },
    dataVersion,
    instrumentId: "hkex_security_00700",
    liveDataAccess: true,
    methodologyVersion: GET_QUOTE_SNAPSHOT_LIVE_VERSION,
    provenance: [
      {
        data_version: dataVersion,
        methodology_version: GET_QUOTE_SNAPSHOT_LIVE_VERSION,
        source: "netquity-unadjprice2-daily",
        source_record_id: "netquity:unadjprice2.daily:00700"
      }
    ],
    quote,
    status: "found",
    toolName: "get_quote_snapshot",
    usage: { cached: false, credits: quote ? 1 : 0, rows: quote ? 1 : 0 },
    ...overrides
  };
}

function groupByCategory(result: ReturnType<typeof createLiveDerivedMetrics>) {
  return {
    profitability: result.metrics.filter((m) => m.category === "profitability"),
    valuation: result.metrics.filter((m) => m.category === "valuation")
  };
}
