import { describe, expect, it } from "vitest";
import {
  createHkDataDomainsCrossMarketPlan,
  getHkDataDomainsCrossMarketCapabilities,
  getMarketDomainRuntimeCapabilities
} from "./index";

describe("market domain runtime scaffold", () => {
  it("reports runtime capabilities without live market data or writes", () => {
    expect(getMarketDomainRuntimeCapabilities()).toMatchObject({
      auth_required: true,
      default_rights_status: "default_deny",
      frontend: false,
      live_data_access: false,
      package: "@aiphabee/market-domain-runtime",
      persistent_writes: false,
      route: "GET /market-data/domains/runtime",
      runtime_route: "GET /market-data/domains/runtime",
      sql_emitted: false,
      status: "hk_data_domains_cross_market_scaffold"
    });
    expect(getMarketDomainRuntimeCapabilities().cross_market_plan).toMatchObject({
      data_gateway_required: true,
      point_in_time_required: true,
      rights_matrix_required: true,
      route: "POST /market-data/domains/cross-market/plan",
      status: "hk_data_domains_cross_market_scaffold"
    });
  });

  it("reports HK data domains and cross-market mapping capabilities", () => {
    const capability = getHkDataDomainsCrossMarketCapabilities();

    expect(capability).toMatchObject({
      default_rights_status: "default_deny",
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      point_in_time_required: true,
      rights_matrix_required: true,
      route: "POST /market-data/domains/cross-market/plan",
      sql_emitted: false,
      status: "hk_data_domains_cross_market_scaffold"
    });
    expect(capability.allowed_domains).toEqual([
      "ipo_pipeline",
      "index_constituents",
      "stock_connect_flow",
      "short_selling",
      "ownership_disclosure",
      "warrants_cbbc",
      "sector_industry_classification",
      "corporate_calendar",
      "dividend_calendar"
    ]);
    expect(capability.allowed_markets).toEqual(["HK", "CN_A", "US", "SG"]);
    expect(capability.allowed_mapping_types).toContain("currency_normalization");
    expect(capability.tables).toEqual([
      "aiphabee_core.hk_data_domain_coverage",
      "aiphabee_core.cross_market_security_mapping",
      "aiphabee_audit.market_domain_coverage_event",
      "aiphabee_governance.hk_data_domain_cross_market_contract"
    ]);
  });

  it("plans expanded HK data domains and cross-market comparison coverage", () => {
    const plan = createHkDataDomainsCrossMarketPlan({
      asOf: "2026-06-22",
      comparisonMarkets: ["CN_A", "US"],
      mappingTypes: ["dual_listing", "currency_normalization", "trading_calendar_alignment"],
      requestId: "req-hk-domains-cross-market",
      requestedDomains: ["ipo_pipeline", "stock_connect_flow", "warrants_cbbc"],
      rightsMatrixVersion: "rights-matrix-2026-06-22",
      workspaceId: "ws_market_domain_alpha"
    });

    expect(plan).toMatchObject({
      as_of: "2026-06-22",
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      request_id: "req-hk-domains-cross-market",
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_market_domain_alpha"
    });
    expect(plan.coverage_contract).toMatchObject({
      default_deny_until_authorized: true,
      phase4_source: "docs/researches/AiphaBee_PRD_v1.0.md#18.5",
      point_in_time_required: true,
      prd_data_domain_source: "docs/researches/AiphaBee_PRD_v1.0.md#10.2"
    });
    expect(plan.coverage_contract.methodology_fields_required).toEqual([
      "published_at",
      "effective_at",
      "ingested_at",
      "data_version",
      "methodology_version"
    ]);
    expect(plan.data_domains).toHaveLength(3);
    expect(plan.data_domains[0]).toMatchObject({
      domain: "ipo_pipeline",
      live_data_loaded: false,
      market: "HK",
      point_in_time_required: true,
      rights_state: "default_deny",
      status: "planned_no_write",
      table: "aiphabee_core.hk_ipo_pipeline_event"
    });
    expect(plan.cross_market).toMatchObject({
      analytics_comparison_route: "POST /analytics/compare-securities",
      base_market: "HK",
      calendar_alignment_route: "POST /tools/get-market-calendar",
      comparison_markets: ["CN_A", "US"],
      mapping_types: ["dual_listing", "currency_normalization", "trading_calendar_alignment"],
      security_resolution_route: "POST /tools/resolve-security"
    });
    expect(plan.cross_market.mapping_items).toHaveLength(6);
    expect(plan.cross_market.mapping_items).toContainEqual(
      expect.objectContaining({
        comparison_market: "US",
        fx_rate_required: true,
        live_mapping_enabled: false,
        mapping_type: "currency_normalization",
        rights_state: "default_deny",
        status: "planned_no_write"
      })
    );
    expect(plan.rights).toMatchObject({
      default_deny_until_authorized: true,
      external_redistribution_allowed: false,
      export_allowed: false,
      field_authorization_required: true,
      mcp_redistribution_allowed: false,
      rights_matrix_required: true,
      rights_matrix_version: "rights-matrix-2026-06-22"
    });
    expect(plan.usage.rows).toBe(9);
  });

  it("blocks planning until rights matrix context is present", () => {
    const plan = createHkDataDomainsCrossMarketPlan({
      comparisonMarkets: ["CN_A"],
      requestId: "req-missing-rights",
      requestedDomains: ["ipo_pipeline"],
      workspaceId: "ws_market_domain_alpha"
    });

    expect(plan.status).toBe("blocked_rights_matrix_required");
    expect(plan.rights.rights_matrix_version).toBeUndefined();
    expect(plan.validation.rights_matrix_present).toBe(false);
    expect(plan.data_domains[0]?.status).toBe("not_requested");
    expect(plan.usage.rows).toBe(0);
  });

  it("blocks missing workspace, unsupported markets, domains, and mappings", () => {
    expect(
      createHkDataDomainsCrossMarketPlan({
        requestId: "req-missing-context",
        rightsMatrixVersion: "rights-matrix-2026-06-22"
      }).status
    ).toBe("blocked_missing_context");

    const unsupportedMarket = createHkDataDomainsCrossMarketPlan({
      comparisonMarkets: ["EU"],
      requestId: "req-market",
      rightsMatrixVersion: "rights-matrix-2026-06-22",
      workspaceId: "ws_market_domain_alpha"
    });
    expect(unsupportedMarket.status).toBe("blocked_unsupported_market");
    expect(unsupportedMarket.validation.unsupported_markets).toEqual(["EU"]);

    const unsupportedDomain = createHkDataDomainsCrossMarketPlan({
      comparisonMarkets: ["CN_A"],
      requestId: "req-domain",
      requestedDomains: ["ipo_pipeline", "crypto_order_book"],
      rightsMatrixVersion: "rights-matrix-2026-06-22",
      workspaceId: "ws_market_domain_alpha"
    });
    expect(unsupportedDomain.status).toBe("blocked_unsupported_domain");
    expect(unsupportedDomain.validation.unsupported_domains).toEqual(["crypto_order_book"]);

    const unsupportedMapping = createHkDataDomainsCrossMarketPlan({
      comparisonMarkets: ["CN_A"],
      mappingTypes: ["dual_listing", "sentiment_similarity"],
      requestId: "req-mapping",
      rightsMatrixVersion: "rights-matrix-2026-06-22",
      workspaceId: "ws_market_domain_alpha"
    });
    expect(unsupportedMapping.status).toBe("blocked_unsupported_mapping");
    expect(unsupportedMapping.validation.unsupported_mapping_types).toEqual([
      "sentiment_similarity"
    ]);
  });
});
