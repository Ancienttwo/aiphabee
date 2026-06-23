import { describe, expect, it } from "vitest";
import {
  createSupportRequestIdInvestigationPlan,
  getSupportHelpCenter,
  getSupportOperationsCapabilities
} from "./index";

describe("support operations scaffold", () => {
  it("reports support runtime capabilities without live log or billing reads", () => {
    expect(getSupportOperationsCapabilities()).toMatchObject({
      default_sensitive_content_access: false,
      frontend: false,
      help_center_route: "GET /support/help-center",
      investigation_route: "POST /support/request-id-investigation/plan",
      live_billing_provider_reads: false,
      live_log_reads: false,
      package: "@aiphabee/support-ops",
      persistent_writes: false,
      request_id_required: true,
      route: "GET /support/runtime",
      sql_emitted: false,
      status: "support_request_id_investigation_scaffold",
      support_agent_required: true,
      version: "2026-06-21.phase3.support-request-id-investigation-scaffold.v0"
    });
    expect(getSupportOperationsCapabilities().support_lookup_fields).toContain("request_id");
    expect(getSupportOperationsCapabilities().support_lookup_fields).toContain("usage_event_id");
    expect(getSupportOperationsCapabilities().sensitive_fields_forbidden_by_default).toContain(
      "raw_prompt"
    );
    expect(getSupportOperationsCapabilities().sensitive_fields_forbidden_by_default).toContain(
      "payment_method"
    );
  });

  it("reports help center topics and escalation path", () => {
    const helpCenter = getSupportHelpCenter();

    expect(helpCenter).toMatchObject({
      doc_path: "docs/public/help-center.md",
      live_chat_enabled: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "GET /support/help-center",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(helpCenter.help_topics.map((topic) => topic.topic_code)).toEqual([
      "account_billing",
      "mcp_connection",
      "data_quality",
      "usage_quota",
      "privacy_account",
      "incident_status"
    ]);
    expect(helpCenter.help_topics.every((topic) => topic.doc_path === "docs/public/help-center.md"))
      .toBe(true);
  });

  it("plans a request_id investigation with metadata-only support access", () => {
    const plan = createSupportRequestIdInvestigationPlan({
      category: "mcp_connection",
      reason: "customer_reported_auth_required",
      requestId: "req_support_plan",
      supportAgentId: "support_agent_001",
      targetRequestId: "req_mcp_123",
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      persistent_writes: false,
      request_id: "req_support_plan",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(plan.help_center).toMatchObject({
      category: "mcp_connection",
      doc_path: "docs/public/help-center.md"
    });
    expect(plan.investigation).toMatchObject({
      live_billing_provider_reads: false,
      live_log_reads: false,
      target_request_id: "req_mcp_123"
    });
    expect(plan.investigation.allowed_lookup_fields).toEqual(
      expect.arrayContaining([
        "request_id",
        "tool_name",
        "data_version",
        "error_code",
        "usage_event_id",
        "ledger_entry_id",
        "invoice_line_id"
      ])
    );
    expect(plan.investigation.billing_trace).toMatchObject({
      request_id_join: true,
      usage_event_id: "usage_event_req_mcp_123"
    });
    expect(plan.audit).toMatchObject({
      audit_event: "support.request_id_investigation.plan",
      support_agent_id: "support_agent_001",
      table: "aiphabee_audit.support_investigation_event",
      write_status: "planned_no_write"
    });
    expect(plan.privacy).toMatchObject({
      default_sensitive_content_access: false,
      include_sensitive_content_requested: false,
      sensitive_content_released: false
    });
    expect(plan.privacy.forbidden_fields).toContain("generated_answer");
  });

  it("blocks missing context and sensitive content requests", () => {
    const missingContext = createSupportRequestIdInvestigationPlan({
      requestId: "req_support_missing"
    });
    const sensitiveRequest = createSupportRequestIdInvestigationPlan({
      includeSensitiveContent: true,
      requestId: "req_support_sensitive",
      supportAgentId: "support_agent_001",
      targetRequestId: "req_mcp_123"
    });

    expect(missingContext.status).toBe("blocked_missing_context");
    expect(missingContext.validation.required_context_present).toBe(false);
    expect(missingContext.support_ticket.ticket_status).toBe("blocked");
    expect(sensitiveRequest.status).toBe("blocked_sensitive_content_request");
    expect(sensitiveRequest.validation.sensitive_request_blocked).toBe(true);
    expect(sensitiveRequest.privacy).toMatchObject({
      include_sensitive_content_requested: true,
      sensitive_content_released: false
    });
  });
});
