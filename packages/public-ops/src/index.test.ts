import { describe, expect, it } from "vitest";
import {
  createComplianceOpsReleaseGatePlan,
  createPublicationEconomicsReleaseGatePlan,
  getPublicDocsManifest,
  getPublicOperationsCapabilities,
  getPublicStatusPage
} from "./index";

describe("public operations scaffold", () => {
  it("reports public status and docs capabilities without frontend or live feeds", () => {
    expect(getPublicOperationsCapabilities()).toMatchObject({
      auth_required: false,
      docs_route: "GET /public/docs",
      frontend: false,
      live_deployment_verified: false,
      live_incident_feed: false,
      package: "@aiphabee/public-ops",
      persistent_writes: false,
      request_id_visible: true,
      route: "GET /public/runtime",
      sql_emitted: false,
      status: "public_status_docs_scaffold",
      status_route: "GET /public/status",
      version: "2026-06-21.phase3.public-status-docs-scaffold.v0"
    });
    expect(getPublicOperationsCapabilities().document_kinds).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(getPublicOperationsCapabilities().compliance_ops_release_gate).toMatchObject({
      frontend: false,
      live_audit_export_store: false,
      live_compliance_signoff: false,
      live_incident_feed: false,
      live_kill_switch_flag_source: false,
      route: "POST /public/release-gates/compliance-ops/plan",
      status: "compliance_ops_release_gate_scaffold"
    });
    expect(getPublicOperationsCapabilities().publication_economics_release_gate).toMatchObject({
      frontend: false,
      live_deployment_verified: false,
      live_finance_signoff: false,
      live_legal_approval: false,
      route: "POST /public/release-gates/publication-economics/plan",
      status: "publication_economics_release_gate_scaffold",
      unit_economics_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.5"
    });
  });

  it("builds a public status page manifest with component evidence routes", () => {
    const statusPage = getPublicStatusPage({
      asOf: "2026-06-21T11:50:00.000Z",
      requestId: "req_public_status"
    });

    expect(statusPage).toMatchObject({
      as_of: "2026-06-21T11:50:00.000Z",
      live_incident_feed: false,
      persistent_writes: false,
      request_id: "req_public_status",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(statusPage.status_page).toMatchObject({
      auth_required: false,
      component_count: 5,
      publication_status: "local_scaffold_ready",
      route: "GET /public/status"
    });
    expect(statusPage.components.map((component) => component.component_id)).toEqual([
      "worker_api",
      "remote_mcp",
      "data_gateway",
      "usage_billing",
      "public_documentation"
    ]);
    expect(statusPage.components.every((component) => component.request_id_visible)).toBe(true);
    expect(statusPage.components.find((component) => component.component_id === "remote_mcp")).toMatchObject({
      evidence_route: "/mcp/runtime",
      status: "default_deny_scaffold"
    });
  });

  it("builds a public docs manifest for API, MCP, privacy, and terms", () => {
    const manifest = getPublicDocsManifest({ requestId: "req_public_docs" });

    expect(manifest).toMatchObject({
      live_publication_verified: false,
      persistent_writes: false,
      request_id: "req_public_docs",
      request_id_visible: true,
      route: "GET /public/docs",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(manifest.documents.map((document) => document.kind)).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(manifest.documents.find((document) => document.kind === "api_reference")).toMatchObject({
      path: "docs/public/api.md",
      publication_status: "local_draft_ready"
    });
    expect(manifest.documents.find((document) => document.kind === "privacy_policy")).toMatchObject({
      legal_review_required: true,
      path: "docs/public/privacy.md"
    });
    expect(manifest.documents.find((document) => document.kind === "terms_of_service")).toMatchObject({
      legal_review_required: true,
      path: "docs/public/terms.md"
    });
  });

  it("plans the compliance ops release gate without live writes", () => {
    const plan = createComplianceOpsReleaseGatePlan({
      asOf: "2026-06-22T00:00:00.000Z",
      requestId: "req_compliance_ops",
      supportAgentId: "support_agent_001",
      targetRequestId: "req_target",
      workspaceId: "workspace_ops"
    });

    expect(plan).toMatchObject({
      frontend: false,
      live_audit_export_store: false,
      live_compliance_signoff: false,
      live_incident_feed: false,
      live_kill_switch_flag_source: false,
      persistent_writes: false,
      request_id: "req_compliance_ops",
      route: "POST /public/release-gates/compliance-ops/plan",
      sql_emitted: false,
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        audit_export_contains_required_fields: true,
        audit_export_excludes_sensitive_payloads: true,
        forbidden_advice_claims_absent: true,
        incident_response_trace_planned: true,
        kill_switch_safe_degradation_planned: true,
        live_release_claimed: false,
        public_status_incident_surface_present: true,
        type4_boundary_reviewed: true
      }
    });
    expect(plan.release_checks).toHaveLength(6);
    expect(plan.compliance_boundary).toMatchObject({
      external_legal_opinion_present: false,
      review_source: "docs/researches/AiphaBee_PRD_v1.0.md#14.2",
      type4_written_opinion_required: true
    });
    expect(plan.compliance_boundary.reviewed_surfaces).toEqual([
      "product_pages",
      "prompts",
      "marketing_copy",
      "pricing"
    ]);
    expect(plan.kill_switch_drill.plan.decision).toMatchObject({
      degradation_mode: "no_model_no_tools",
      model_request_blocked: true,
      safe_degradation_required: true,
      tool_execution_blocked: true
    });
    expect(plan.kill_switch_drill.plan.safe_degradation.user_visible_state).toBe(true);
    expect(plan.incident_response_drill.support_plan).toMatchObject({
      request_id_visible: true,
      status: "planned_no_write"
    });
    expect(plan.incident_response_drill.support_plan.investigation.planned_sources).toContain(
      "public_status_component"
    );
    expect(plan.incident_response_drill.support_plan.privacy.sensitive_content_released).toBe(false);
    expect(plan.audit_export_drill).toMatchObject({
      event_count: 1,
      export_format: "jsonl",
      live_log_reads: false,
      persistent_writes: false,
      sensitive_payload_released: false,
      sql_emitted: false
    });
    expect(plan.audit_export_drill.required_fields).toContain("request_id");
    expect(plan.audit_export_drill.required_fields).toContain("audit.denied_tools");
    expect(plan.audit_export_drill.audit_event).toMatchObject({
      event_type: "run.audit",
      outcome: "rejected",
      request_id: "req_compliance_ops",
      route: "POST /public/release-gates/compliance-ops/plan"
    });
    expect(plan.release_gate).toMatchObject({
      gate_status: "blocked_live_compliance_ops_validation",
      no_live_release_claim: true
    });
    expect(plan.release_gate.blockers).toContain("external_compliance_legal_signoff_missing");
  });

  it("flags forbidden advice claims in compliance marketing copy", () => {
    const plan = createComplianceOpsReleaseGatePlan({
      marketingCopySnippets: ["AiphaBee gives stock pick and guaranteed return signals."],
      requestId: "req_forbidden_copy",
      supportAgentId: "support_agent_001",
      targetRequestId: "req_target",
      workspaceId: "workspace_ops"
    });

    expect(plan.validation.forbidden_advice_claims_absent).toBe(false);
    expect(plan.validation.all_checks_passed).toBe(false);
    expect(plan.release_checks.find((check) => check.check === "marketing_copy_forbidden_advice_claims_absent")).toMatchObject({
      status: "planned_no_write"
    });
  });

  it("plans the publication and unit economics release gate without live deployment claims", () => {
    const plan = createPublicationEconomicsReleaseGatePlan({
      asOf: "2026-06-22T00:30:00.000Z",
      requestId: "req_publication_economics"
    });

    expect(plan).toMatchObject({
      frontend: false,
      live_deployment_verified: false,
      live_finance_signoff: false,
      live_legal_approval: false,
      persistent_writes: false,
      request_id: "req_publication_economics",
      route: "POST /public/release-gates/publication-economics/plan",
      sql_emitted: false,
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        docs_manifest_publication_ready: true,
        help_center_manifest_ready: true,
        live_release_claimed: false,
        package_pricing_catalog_present: true,
        privacy_terms_publication_ready: true,
        public_status_page_ready: true,
        unit_economics_positive: true,
        writes_blocked: true
      },
      version: "2026-06-22.phase3.publication-economics-release-gate-scaffold.v0"
    });
    expect(plan.capability).toMatchObject({
      account_pricing_route: "GET /account/package-pricing",
      help_center_route: "GET /support/help-center",
      route: "POST /public/release-gates/publication-economics/plan",
      status: "publication_economics_release_gate_scaffold"
    });
    expect(plan.docs_publication.public_status_page.status_page).toMatchObject({
      publication_status: "local_scaffold_ready",
      route: "GET /public/status"
    });
    expect(plan.docs_publication.docs_manifest.documents.map((document) => document.kind)).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(plan.docs_publication.help_center).toMatchObject({
      doc_path: "docs/public/help-center.md",
      live_chat_enabled: false,
      route: "GET /support/help-center"
    });
    expect(plan.docs_publication.help_center.help_topics).toHaveLength(6);
    expect(plan.package_pricing.catalog.plans.map((pricePlan) => pricePlan.plan_code)).toEqual([
      "pro",
      "developer"
    ]);
    expect(plan.unit_economics.plans.find((pricePlan) => pricePlan.plan_code === "pro")).toMatchObject({
      contribution_margin_positive: true,
      contribution_margin_ratio_bps: 7149,
      target_margin_ratio_bps: 7000
    });
    expect(plan.unit_economics.plans.find((pricePlan) => pricePlan.plan_code === "developer")).toMatchObject({
      contribution_margin_positive: true,
      contribution_margin_ratio_bps: 6119,
      target_margin_ratio_bps: 6000
    });
    expect(plan.validation.unit_economics_positive).toBe(true);
  });

  it("can fail the publication economics gate when expected usage breaks contribution margin", () => {
    const plan = createPublicationEconomicsReleaseGatePlan({
      expectedUsageProfile: {
        developer: {
          data_license_allocation_minor: 40000,
          data_usage_cost_minor: 16000,
          direct_support_cost_minor: 8000,
          llm_token_cost_minor: 12000,
          payment_fee_minor: 3000,
          usage_credits: 10000
        },
        pro: {
          data_license_allocation_minor: 20000,
          data_usage_cost_minor: 4000,
          direct_support_cost_minor: 3000,
          llm_token_cost_minor: 5000,
          payment_fee_minor: 1000,
          usage_credits: 5000
        }
      },
      requestId: "req_publication_economics_negative"
    });

    expect(plan.validation.unit_economics_positive).toBe(false);
    expect(plan.validation.all_checks_passed).toBe(false);
    expect(plan.unit_economics.plans.every((pricePlan) => pricePlan.contribution_margin_positive)).toBe(
      false
    );
  });
});
