import { describe, expect, it } from "vitest";
import {
  createWhiteLabelEmbedPlan,
  getPartnerRuntimeCapabilities,
  getWhiteLabelEmbedCapabilities
} from "./index";

describe("partner runtime scaffold", () => {
  it("reports partner runtime capabilities without live embed or API execution", () => {
    expect(getPartnerRuntimeCapabilities()).toMatchObject({
      auth_required: true,
      frontend: false,
      live_api_execution: false,
      live_embed_rendering: false,
      package: "@aiphabee/partner-runtime",
      persistent_writes: false,
      route: "GET /partner/runtime",
      runtime_route: "GET /partner/runtime",
      sql_emitted: false,
      status: "partner_runtime_scaffold"
    });
    expect(getPartnerRuntimeCapabilities().white_label_embeds).toMatchObject({
      data_gateway_required: true,
      embed_script_generated: false,
      partner_rights_matrix_required: true,
      route: "POST /partner/white-label-embeds/plan",
      settlement_route: "POST /usage/partner-reconciliation/plan",
      status: "white_label_embed_scaffold"
    });
  });

  it("reports white-label embed capabilities and supported partner surfaces", () => {
    const capability = getWhiteLabelEmbedCapabilities();

    expect(capability).toMatchObject({
      data_gateway_required: true,
      embed_script_generated: false,
      frontend: false,
      live_api_execution: false,
      live_embed_rendering: false,
      partner_rights_matrix_required: true,
      persistent_writes: false,
      route: "POST /partner/white-label-embeds/plan",
      sql_emitted: false,
      status: "white_label_embed_scaffold"
    });
    expect(capability.allowed_partner_types).toEqual([
      "brokerage",
      "media",
      "wealth_platform",
      "data_company"
    ]);
    expect(capability.allowed_surfaces).toEqual([
      "research_widget",
      "report_viewer",
      "watchlist_widget",
      "mcp_api",
      "data_api"
    ]);
    expect(capability.allowed_commercial_models).toContain("minimum_guarantee_overage");
    expect(capability.tables).toEqual([
      "aiphabee_core.partner_program",
      "aiphabee_core.partner_embed_surface",
      "aiphabee_audit.partner_distribution_event",
      "aiphabee_governance.partner_white_label_contract"
    ]);
  });

  it("plans white-label embeds and MCP API without generating frontend assets", () => {
    const plan = createWhiteLabelEmbedPlan({
      allowedOrigins: ["https://broker.example.com"],
      brandMode: "white_label",
      commercialModel: "minimum_guarantee_overage",
      dataScopes: ["research_outputs", "analytics_results"],
      partnerId: "partner_broker_alpha",
      partnerName: "Broker Alpha",
      partnerType: "brokerage",
      requestedSurfaces: ["research_widget", "mcp_api"],
      requestId: "req_partner_embed",
      revenueShareBps: 2500,
      workspaceId: "ws_partner_alpha"
    });

    expect(plan).toMatchObject({
      frontend: false,
      live_api_execution: false,
      live_embed_rendering: false,
      persistent_writes: false,
      request_id: "req_partner_embed",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.partner).toMatchObject({
      partner_id: "partner_broker_alpha",
      partner_name: "Broker Alpha",
      partner_type: "brokerage",
      workspace_id: "ws_partner_alpha"
    });
    expect(plan.brand_policy).toMatchObject({
      brand_mode: "white_label",
      conflict_disclosure_required: true,
      white_label_allowed: true
    });
    expect(plan.embed).toMatchObject({
      allowed_origins: ["https://broker.example.com"],
      csp_required: true,
      public_indexing: false,
      script_bundle_generated: false,
      surfaces: ["research_widget", "mcp_api"]
    });
    expect(plan.data_governance).toMatchObject({
      default_deny_until_signed: true,
      external_redistribution_allowed: false,
      field_authorization_required: true,
      partner_rights_matrix_required: true
    });
    expect(plan.commercial_model).toMatchObject({
      model: "minimum_guarantee_overage",
      revenue_share_bps: 2500,
      settlement_route: "POST /usage/partner-reconciliation/plan",
      settlement_status: "planned_no_write"
    });
    expect(plan.security).toEqual({
      credential_material_stored: false,
      raw_personal_contact_included: false,
      raw_prompt_included: false,
      signed_contract_required: true,
      tenant_isolation_required: true
    });
    expect(plan.mcp_api).toMatchObject({
      api_key_route: "POST /mcp/api-keys/create/plan",
      live_execution: false,
      mcp_route: "POST /mcp",
      oauth_route: "POST /mcp/oauth/authorize/plan",
      usage_envelope_required: true
    });
    expect(plan.usage.rows).toBe(2);
  });

  it("blocks embed surfaces without an HTTPS origin allowlist", () => {
    const plan = createWhiteLabelEmbedPlan({
      allowedOrigins: ["http://broker.example.com", "not-an-origin"],
      commercialModel: "fixed_annual_license",
      partnerId: "partner_broker_alpha",
      partnerType: "brokerage",
      requestedSurfaces: ["research_widget"],
      requestId: "req_partner_embed_blocked",
      workspaceId: "ws_partner_alpha"
    });

    expect(plan.status).toBe("blocked_invalid_origin");
    expect(plan.embed.allowed_origins).toEqual([]);
    expect(plan.validation.valid_allowed_origins).toBe(false);
    expect(plan.persistent_writes).toBe(false);
    expect(plan.usage.rows).toBe(0);
  });

  it("blocks unsupported partner context, commercial models, and surfaces", () => {
    expect(
      createWhiteLabelEmbedPlan({
        commercialModel: "fixed_annual_license",
        partnerId: "partner_missing",
        requestedSurfaces: ["mcp_api"],
        requestId: "req_missing",
        workspaceId: "ws_partner_alpha"
      }).status
    ).toBe("blocked_missing_context");

    expect(
      createWhiteLabelEmbedPlan({
        commercialModel: "fixed_annual_license",
        partnerId: "partner_unknown",
        partnerType: "bank",
        requestedSurfaces: ["mcp_api"],
        requestId: "req_partner_type",
        workspaceId: "ws_partner_alpha"
      }).status
    ).toBe("blocked_unsupported_partner_type");

    expect(
      createWhiteLabelEmbedPlan({
        commercialModel: "success_fee",
        partnerId: "partner_broker_alpha",
        partnerType: "brokerage",
        requestedSurfaces: ["mcp_api"],
        requestId: "req_model",
        workspaceId: "ws_partner_alpha"
      }).status
    ).toBe("blocked_unsupported_commercial_model");

    const unsupportedSurface = createWhiteLabelEmbedPlan({
      commercialModel: "fixed_annual_license",
      partnerId: "partner_broker_alpha",
      partnerType: "brokerage",
      requestedSurfaces: ["research_widget", "raw_iframe"],
      requestId: "req_surface",
      workspaceId: "ws_partner_alpha"
    });

    expect(unsupportedSurface.status).toBe("blocked_unsupported_surface");
    expect(unsupportedSurface.validation.unsupported_surfaces).toEqual(["raw_iframe"]);
  });
});
