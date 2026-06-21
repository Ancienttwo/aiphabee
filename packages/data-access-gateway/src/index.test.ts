import { describe, expect, it } from "vitest";
import {
  DEFAULT_DATA_ACCESS_POLICY,
  createFieldAuthorizationConfigChangePlan,
  createP0RightsMatrixCoverageReport,
  createRestrictedExportPlan,
  createPolicyFromEntitlementRows,
  createSyntheticApprovedPolicy,
  createSyntheticWorkspaceEntitlementPolicy,
  evaluateDataAccessRequest,
  getFieldAuthorizationConfigCapabilities,
  getEntitlementPolicySourceCapabilities,
  getP0RightsMatrixCoverageCapabilities,
  getRestrictedExportCapabilities,
  getServingResultEnvelopeCapabilities
} from "./index";

describe("data access gateway", () => {
  it("denies fields by default before rights approval", () => {
    const decision = evaluateDataAccessRequest({
      channel: "mcp",
      dataset: "hk_equity_quote",
      plan: "free",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1
    });

    expect(decision.status).toBe("deny");
    expect(decision.error?.code).toBe("DATA_NOT_LICENSED");
    expect(decision.allowedFields).toEqual([]);
    expect(decision.deniedFields).toEqual([
      {
        field: "quote.close",
        reason: "channel_blocked"
      }
    ]);
    expect(decision.servingRead).toMatchObject({
      blockedReason: "DATA_NOT_LICENSED",
      liveRead: false,
      servedRows: 0,
      sqlEmitted: false,
      status: "blocked_by_gateway"
    });
    expect(decision.servingQuery).toMatchObject({
      blockedReason: "DATA_NOT_LICENSED",
      liveRead: false,
      plannedRows: 0,
      releaseState: "held",
      sqlEmitted: false,
      status: "query_blocked"
    });
    expect(decision.servingSqlDescriptor).toMatchObject({
      blockedReason: "DATA_NOT_LICENSED",
      executionReady: false,
      liveRead: false,
      selectedFieldPaths: [],
      sqlEmitted: false,
      sqlTextEmitted: false,
      status: "descriptor_blocked"
    });
    expect(decision.servingSqlText).toMatchObject({
      blockedReason: "DATA_NOT_LICENSED",
      executionReady: false,
      sqlExecuted: false,
      sqlTextEmitted: false,
      status: "sql_text_blocked"
    });
    expect(decision.servingSqlText.sqlText).toBeUndefined();
    expect(decision.servingExecution).toMatchObject({
      adapter: "hyperdrive",
      blockedReason: "DATA_NOT_LICENSED",
      executionReady: false,
      liveRead: false,
      rows: [],
      servedRows: 0,
      sqlExecuted: false,
      sqlTextAccepted: false,
      status: "execution_blocked"
    });
    expect(decision.servingResult).toMatchObject({
      blockedReason: "DATA_NOT_LICENSED",
      dataset: "hk_equity_quote",
      envelopeFields: ["as_of", "market_status", "provenance", "usage"],
      executionStatus: "execution_blocked",
      liveDataAccess: false,
      liveRead: false,
      marketStatus: "not_applicable",
      requestedFields: ["quote.close"],
      rows: [],
      rowCount: 0,
      servedRows: 0,
      sqlExecuted: false,
      sqlTextAccepted: false,
      status: "result_blocked"
    });
    expect(decision.usage.rows).toBe(0);
    expect(decision.usageLedger).toMatchObject({
      schemaReady: false,
      sqlEmitted: false,
      status: "write_blocked",
      writeReady: false,
      writeReason: "WORKSPACE_CONTEXT_MISSING"
    });
    expect(decision.usageLedger.ledgerEntry).toMatchObject({
      billableState: "blocked",
      creditDelta: 0
    });
  });

  it("redacts unapproved fields when a synthetic channel is approved", () => {
    const decision = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "PASS",
        requestedFields: [
          "synthetic_quote.close",
          "synthetic_profile.company_name"
        ],
        requestedRows: 5,
        timeRange: {
          from: "2024-01-01",
          to: "2024-01-31"
        }
      },
      createSyntheticApprovedPolicy()
    );

    expect(decision.status).toBe("allow_with_redactions");
    expect(decision.allowedFields).toEqual(["synthetic_profile.company_name"]);
    expect(decision.deniedFields).toEqual([
      {
        field: "synthetic_quote.close",
        reason: "field_default_deny"
      }
    ]);
    expect(decision.cacheKey).toContain("rights=synthetic-policy-v0");
    expect(decision.cacheKey).toContain(
      "fields=synthetic_profile.company_name"
    );
    expect(decision.limits.timeWindowDays).toBe(31);
    expect(decision.servingRead).toMatchObject({
      allowedFields: ["synthetic_profile.company_name"],
      liveRead: false,
      requestedRows: 5,
      releaseState: "held",
      servedRows: 0,
      sqlEmitted: false,
      status: "read_planned"
    });
    expect(decision.servingRead.cacheKeyMaterial).toMatchObject({
      dataVersion: "gateway-scaffold-v0",
      fieldSet: ["synthetic_profile.company_name"],
      rightsPolicyVersion: "synthetic-policy-v0"
    });
    expect(decision.servingQuery).toMatchObject({
      allowedFields: ["synthetic_profile.company_name"],
      liveRead: false,
      plannedRows: 5,
      releaseState: "released",
      snapshotRowCount: 5,
      sqlEmitted: false,
      status: "query_planned"
    });
    expect(decision.servingQuery.cacheKeyMaterial).toMatchObject({
      fieldSet: ["synthetic_profile.company_name"],
      rightsPolicyVersion: "synthetic-policy-v0",
      servingSnapshotId: "serving-snapshot-scaffold-v0"
    });
    expect(decision.servingSqlDescriptor).toMatchObject({
      bindings: {
        fieldSet: ["synthetic_profile.company_name"],
        limit: 5,
        servingSnapshotId: "serving-snapshot-scaffold-v0",
        timeFrom: "2024-01-01",
        timeTo: "2024-01-31"
      },
      executionReady: false,
      liveRead: false,
      selectedFieldPaths: ["synthetic_profile.company_name"],
      sqlEmitted: false,
      sqlTextEmitted: false,
      statementId: "serving_record_projection_by_snapshot_v0",
      status: "descriptor_planned"
    });
    expect(decision.servingSqlText).toMatchObject({
      executionReady: false,
      parameters: {
        fieldSet: ["synthetic_profile.company_name"],
        limit: 5,
        servingSnapshotId: "serving-snapshot-scaffold-v0",
        timeFrom: "2024-01-01",
        timeTo: "2024-01-31"
      },
      sqlExecuted: false,
      sqlTextEmitted: true,
      status: "sql_text_planned"
    });
    expect(decision.servingSqlText.sqlText).toContain(
      "from core.serving_record"
    );
    expect(decision.servingExecution).toMatchObject({
      adapter: "hyperdrive",
      deferredReason: "LIVE_SERVING_EXECUTION_DISABLED",
      executionReady: false,
      liveRead: false,
      rows: [],
      servedRows: 0,
      sqlExecuted: false,
      sqlTextAccepted: true,
      status: "execution_deferred"
    });
    expect(decision.servingResult).toMatchObject({
      allowedFields: ["synthetic_profile.company_name"],
      deferredReason: "LIVE_SERVING_EXECUTION_DISABLED",
      deniedFields: [
        {
          field: "synthetic_quote.close",
          reason: "field_default_deny"
        }
      ],
      executionStatus: "execution_deferred",
      liveDataAccess: false,
      liveRead: false,
      marketStatus: "not_applicable",
      rows: [],
      rowCount: 0,
      servedRows: 0,
      sqlExecuted: false,
      sqlTextAccepted: true,
      status: "result_deferred",
      usage: {
        cached: false,
        credits: 1,
        rows: 5
      }
    });
    expect(decision.usage.rows).toBe(5);
    expect(decision.usageLedger).toMatchObject({
      schemaReady: false,
      sqlEmitted: false,
      status: "write_blocked",
      writeReady: false
    });
    expect(decision.usageLedger.event).toMatchObject({
      meteredFields: 1,
      meteredRows: 5,
      workspaceId: "workspace_unresolved"
    });
  });

  it("returns DATA_QUALITY_HOLD before serving held records", () => {
    const decision = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "HOLD",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1
      },
      createSyntheticApprovedPolicy()
    );

    expect(decision.status).toBe("quality_hold");
    expect(decision.error?.code).toBe("DATA_QUALITY_HOLD");
    expect(decision.allowedFields).toEqual([]);
    expect(decision.servingRead).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      liveRead: false,
      servedRows: 0,
      sqlEmitted: false,
      status: "quality_hold"
    });
    expect(decision.servingQuery).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      liveRead: false,
      plannedRows: 0,
      releaseState: "held",
      sqlEmitted: false,
      status: "query_blocked"
    });
    expect(decision.servingSqlDescriptor).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      executionReady: false,
      selectedFieldPaths: [],
      sqlEmitted: false,
      sqlTextEmitted: false,
      status: "descriptor_blocked"
    });
    expect(decision.servingSqlText).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      executionReady: false,
      sqlExecuted: false,
      sqlTextEmitted: false,
      status: "sql_text_blocked"
    });
    expect(decision.servingExecution).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      executionReady: false,
      liveRead: false,
      rows: [],
      servedRows: 0,
      sqlExecuted: false,
      status: "execution_blocked"
    });
    expect(decision.servingResult).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      executionStatus: "execution_blocked",
      liveDataAccess: false,
      rows: [],
      rowCount: 0,
      servedRows: 0,
      sqlExecuted: false,
      status: "result_blocked"
    });
    expect(decision.usage.credits).toBe(0);
    expect(decision.usageLedger).toMatchObject({
      schemaReady: false,
      status: "write_blocked",
      writeReady: false
    });
    expect(decision.usageLedger.ledgerEntry).toMatchObject({
      billableState: "blocked",
      creditDelta: 0
    });
  });

  it("enforces row and date limits", () => {
    const tooManyRows = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: DEFAULT_DATA_ACCESS_POLICY.maxRows + 1
      },
      createSyntheticApprovedPolicy()
    );
    const outOfRange = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "internal",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        timeRange: {
          from: "2023-01-01",
          to: "2025-01-01"
        }
      },
      createSyntheticApprovedPolicy()
    );

    expect(tooManyRows.error?.code).toBe("TOO_MANY_ROWS");
    expect(outOfRange.error?.code).toBe("OUT_OF_RANGE");
  });

  it("enforces workspace, plan, export, and entitlement time range", () => {
    const policy = createSyntheticWorkspaceEntitlementPolicy();
    const allowedWithRedaction = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "team",
        qualityState: "PASS",
        requestedFields: [
          "synthetic_profile.company_name",
          "synthetic_profile.revenue"
        ],
        requestedRows: 2,
        requestId: "req_workspace_allowed",
        timeRange: {
          from: "2024-01-01",
          to: "2024-01-31"
        },
        workspaceId: "ws_synthetic_team"
      },
      policy
    );
    const exportBlocked = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        exportRequested: true,
        plan: "team",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        workspaceId: "ws_synthetic_team"
      },
      policy
    );
    const planBlocked = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "free",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        workspaceId: "ws_synthetic_team"
      },
      policy
    );
    const timeBlocked = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "team",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        timeRange: {
          from: "2024-01-01",
          to: "2024-03-01"
        },
        workspaceId: "ws_synthetic_team"
      },
      policy
    );

    expect(allowedWithRedaction.status).toBe("allow_with_redactions");
    expect(allowedWithRedaction.allowedFields).toEqual([
      "synthetic_profile.company_name"
    ]);
    expect(allowedWithRedaction.deniedFields).toEqual([
      {
        field: "synthetic_profile.revenue",
        reason: "workspace_entitlement_default_deny"
      }
    ]);
    expect(allowedWithRedaction.cacheKey).toContain("workspace=ws_synthetic_team");
    expect(allowedWithRedaction.cacheKey).toContain("export=false");
    expect(allowedWithRedaction.usageLedger).toMatchObject({
      schemaReady: true,
      sqlEmitted: false,
      status: "write_planned",
      writeReady: false,
      writeReason: "LIVE_USAGE_WRITES_DISABLED"
    });
    expect(allowedWithRedaction.usageLedger.event).toMatchObject({
      meteredFields: 1,
      meteredRows: 2,
      requestId: "req_workspace_allowed",
      workspaceId: "ws_synthetic_team"
    });
    expect(allowedWithRedaction.usageLedger.ledgerEntry).toMatchObject({
      billableState: "preview",
      creditDelta: 1,
      meterRuleId: "meter_web_synthetic_profile_data_access_credit"
    });
    expect(exportBlocked.deniedFields[0]?.reason).toBe("export_blocked");
    expect(planBlocked.deniedFields[0]?.reason).toBe("workspace_entitlement_default_deny");
    expect(timeBlocked.deniedFields[0]?.reason).toBe("time_range_blocked");
  });

  it("plans restricted CSV exports through gateway field authorization and watermark rules", () => {
    const plan = createRestrictedExportPlan({
      dataset: "synthetic_profile",
      fields: [
        "synthetic_profile.company_name",
        "synthetic_profile.revenue"
      ],
      format: "csv",
      plan: "pro",
      requestedRows: 20,
      requestId: "req_export_allowed",
      scopes: ["exports.read"],
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      },
      workspaceId: "ws_synthetic_export"
    });

    expect(plan.status).toBe("planned_no_write");
    expect(plan.live_data_access).toBe(false);
    expect(plan.persistent_writes).toBe(false);
    expect(plan.scope).toEqual({
      granted: true,
      required: "exports.read"
    });
    expect(plan.gateway_decision).toMatchObject({
      allowed_fields: ["synthetic_profile.company_name"],
      denied_fields: [
        {
          field: "synthetic_profile.revenue",
          reason: "field_default_deny"
        }
      ],
      export_requested: true,
      status: "allow_with_redactions"
    });
    expect(plan.row_policy).toMatchObject({
      max_rows: 100,
      requested_rows: 20,
      served_rows: 20
    });
    expect(plan.artifact).toMatchObject({
      csv: "planned_no_write",
      generated: false,
      image: "not_requested",
      pdf: "not_requested",
      r2_write: false
    });
    expect(plan.watermark).toMatchObject({
      fields: [
        "request_id",
        "workspace_id",
        "dataset",
        "rights_policy_version",
        "as_of"
      ],
      required: true
    });
    expect(plan.watermark.text).toContain("req_export_allowed");
    expect(plan.usage.rows).toBe(20);
  });

  it("blocks restricted exports without exports.read scope or over row limits", () => {
    const missingScope = createRestrictedExportPlan({
      dataset: "synthetic_profile",
      fields: ["synthetic_profile.company_name"],
      format: "pdf",
      plan: "pro",
      requestedRows: 1,
      requestId: "req_export_missing_scope",
      scopes: [],
      workspaceId: "ws_synthetic_export"
    });
    const tooManyRows = createRestrictedExportPlan({
      dataset: "synthetic_profile",
      fields: ["synthetic_profile.company_name"],
      format: "image",
      plan: "pro",
      requestedRows: 101,
      requestId: "req_export_too_many_rows",
      scopes: ["exports.read"],
      workspaceId: "ws_synthetic_export"
    });
    const unsupportedFormat = createRestrictedExportPlan({
      dataset: "synthetic_profile",
      fields: ["synthetic_profile.company_name"],
      format: "xlsx",
      plan: "pro",
      requestedRows: 1,
      requestId: "req_export_unsupported",
      scopes: ["exports.read"],
      workspaceId: "ws_synthetic_export"
    });

    expect(missingScope.status).toBe("blocked_missing_scope");
    expect(missingScope.scope.granted).toBe(false);
    expect(missingScope.gateway_decision).toBeUndefined();
    expect(missingScope.artifact.pdf).toBe("planned_no_write");
    expect(missingScope.row_policy.served_rows).toBe(0);
    expect(tooManyRows.status).toBe("blocked_gateway_denied");
    expect(tooManyRows.gateway_decision?.error_code).toBe("TOO_MANY_ROWS");
    expect(tooManyRows.artifact.image).toBe("planned_no_write");
    expect(tooManyRows.row_policy.served_rows).toBe(0);
    expect(unsupportedFormat.status).toBe("blocked_unsupported_format");
    expect(unsupportedFormat.export_format).toBeUndefined();
  });

  it("reports restricted export capabilities", () => {
    expect(getRestrictedExportCapabilities()).toMatchObject({
      artifact_writes: false,
      frontend: false,
      high_risk_scope: "exports.read",
      live_data_access: false,
      route: "POST /gateway/exports/plan",
      scope_required: true,
      status: "restricted_export_scaffold",
      supported_formats: ["csv", "image", "pdf"],
      uses_data_access_gateway: true,
      watermark_required: true
    });
  });

  it("plans field authorization config changes with approval, version, and effective time", () => {
    const pending = createFieldAuthorizationConfigChangePlan({
      approvalStatus: "pending",
      asOf: "2026-06-21T00:00:00.000Z",
      channel: "mcp",
      dataset: "hk_equity_quote",
      effectiveAt: "2026-06-22T00:00:00.000Z",
      exportAllowed: false,
      fieldPattern: "quote.close",
      maxWindowDays: 31,
      operatorId: "ops_001",
      plan: "developer",
      policyVersion: "rights-policy-20260622",
      reason: "Developer MCP can receive delayed close only",
      requestId: "req_field_auth_pending",
      targetStatus: "approved",
      workspaceId: "ws_developer_alpha"
    });
    const scheduled = createFieldAuthorizationConfigChangePlan({
      approvalStatus: "approved",
      approvedBy: "compliance_001",
      asOf: "2026-06-21T00:00:00.000Z",
      channel: "mcp",
      dataset: "hk_equity_quote",
      effectiveAt: "2026-06-22T00:00:00.000Z",
      fieldPattern: "quote.close",
      operatorId: "ops_001",
      plan: "developer",
      policyVersion: "rights-policy-20260622",
      requestId: "req_field_auth_scheduled",
      targetStatus: "approved",
      workspaceId: "ws_developer_alpha"
    });
    const active = createFieldAuthorizationConfigChangePlan({
      approvalStatus: "approved",
      approvedBy: "compliance_001",
      asOf: "2026-06-23T00:00:00.000Z",
      channel: "web",
      dataset: "financial_facts",
      effectiveAt: "2026-06-22T00:00:00.000Z",
      exportAllowed: true,
      fieldPattern: "financial_facts.revenue",
      operatorId: "ops_001",
      plan: "pro",
      policyVersion: "rights-policy-20260622",
      requestId: "req_field_auth_active",
      targetStatus: "approved"
    });
    const missing = createFieldAuthorizationConfigChangePlan({
      requestId: "req_field_auth_missing"
    });

    expect(pending).toMatchObject({
      default_deny_preserved: true,
      frontend: false,
      live_db_reads: false,
      persistent_writes: false,
      request_id: "req_field_auth_pending",
      sql_emitted: false,
      status: "awaiting_approval"
    });
    expect(pending.approval).toMatchObject({
      required: true,
      status: "pending",
      table: "audit.field_authorization_approval",
      write_status: "planned_no_write"
    });
    expect(pending.change).toMatchObject({
      channel: "mcp",
      dataset: "hk_equity_quote",
      effective_at: "2026-06-22T00:00:00.000Z",
      field_pattern: "quote.close",
      operator_id: "ops_001",
      plan: "developer",
      policy_version: "rights-policy-20260622",
      target_status: "approved",
      table: "core.field_authorization_change",
      workspace_id: "ws_developer_alpha",
      write_status: "planned_no_write"
    });
    expect(pending.policy_effect).toMatchObject({
      active_only_after_effective_at: true,
      activation_status: "awaiting_approval",
      compiles_to_gateway_policy: true,
      data_entitlement_row: {
        channel: "mcp",
        dataset: "hk_equity_quote",
        export_allowed: false,
        field_pattern: "quote.close",
        rights_policy_version: "rights-policy-20260622",
        status: "approved",
        table: "core.data_entitlement",
        time_range_days: 31
      },
      versioned_cache_key_required: true,
      workspace_entitlement_row: {
        status: "approved",
        table: "core.workspace_entitlement",
        valid_from: "2026-06-22T00:00:00.000Z",
        workspace_id: "ws_developer_alpha"
      }
    });
    expect(scheduled.status).toBe("scheduled");
    expect(active.status).toBe("active_preview");
    expect(active.policy_effect.workspace_entitlement_row).toBeUndefined();
    expect(missing.status).toBe("blocked_missing_context");
    expect(missing.validation.required_context_present).toBe(false);
  });

  it("reports field authorization config capabilities", () => {
    expect(getFieldAuthorizationConfigCapabilities()).toMatchObject({
      approval_required: true,
      default_deny_preserved: true,
      effective_time_required: true,
      frontend: false,
      live_db_reads: false,
      persistent_writes: false,
      policy_version_required: true,
      route: "POST /gateway/field-authorizations/changes/plan",
      runtime_route: "GET /gateway/runtime",
      sql_emitted: false,
      status: "field_authorization_config_scaffold"
    });
  });

  it("reports P0 rights matrix coverage capabilities for all release surfaces", () => {
    expect(getP0RightsMatrixCoverageCapabilities()).toMatchObject({
      default_rights_status: "default_deny",
      enterprise_authorization_configured: true,
      export_authorization_configured: true,
      frontend: false,
      live_rights_matrix_reads: false,
      mcp_authorization_configured: true,
      partner_signed_matrix_loaded: false,
      persistent_writes: false,
      required_p0_tool_count: 16,
      route: "GET /gateway/rights-matrix/p0/coverage",
      runtime_route: "GET /gateway/runtime",
      sql_emitted: false,
      status: "p0_rights_matrix_coverage_scaffold",
      web_authorization_configured: true
    });
    expect(getP0RightsMatrixCoverageCapabilities().required_surfaces).toEqual([
      "web",
      "mcp",
      "export",
      "enterprise"
    ]);
  });

  it("builds a P0 rights matrix default-deny coverage report", () => {
    const report = createP0RightsMatrixCoverageReport({
      asOf: "2026-06-21T13:00:00.000Z",
      rightsPolicyVersion: "rights-policy-v0",
      toolNames: [
        "resolve_security",
        "get_security_profile",
        "get_market_calendar",
        "get_quote_snapshot",
        "get_price_history",
        "get_corporate_actions",
        "get_financial_facts",
        "get_financial_ratios",
        "search_announcements",
        "get_announcement",
        "screen_securities",
        "compare_securities",
        "calculate_returns_risk",
        "get_event_timeline",
        "get_data_lineage",
        "get_entitlements"
      ]
    });

    expect(report).toMatchObject({
      default_rights_status: "default_deny",
      frontend: false,
      live_rights_matrix_reads: false,
      persistent_writes: false,
      rights_policy_version: "rights-policy-v0",
      sql_emitted: false,
      status: "p0_rights_matrix_coverage_scaffold"
    });
    expect(report.tool_coverage).toHaveLength(16);
    expect(report.validation).toMatchObject({
      all_required_surfaces_configured: true,
      required_p0_tool_count: 16,
      tool_count: 16,
      tool_count_matches_registry: true
    });
    expect(report.surface_coverage).toMatchObject({
      enterprise: {
        configured: true,
        default_rights_status: "default_deny"
      },
      export: {
        configured: true,
        default_rights_status: "default_deny"
      },
      mcp: {
        configured: true,
        default_rights_status: "default_deny"
      },
      web: {
        configured: true,
        default_rights_status: "default_deny"
      }
    });
    expect(report.tool_coverage[0]).toMatchObject({
      rights_state: "default_deny_until_partner_matrix_signed",
      surfaces: {
        enterprise: "configured_default_deny",
        export: "configured_default_deny",
        mcp: "configured_default_deny",
        web: "configured_default_deny"
      }
    });
    expect(report.dataset_field_coverage.map((item) => item.dataset)).toEqual(
      expect.arrayContaining(["quote_snapshot", "price_history", "financial_facts"])
    );
    expect(report.release_gate).toMatchObject({
      gate_status: "blocked_external_rights_matrix",
      partner_signed_matrix_loaded: false,
      required_signoffs: ["data_partner", "commercial_owner", "legal_compliance"]
    });
  });

  it("compiles database entitlement rows into a default-deny gateway policy", () => {
    const policySource = createPolicyFromEntitlementRows({
      asOf: "2026-06-20T09:00:00.000Z",
      dataEntitlements: [
        {
          channel: "web",
          dataset: "synthetic_profile",
          entitlementId: "ent_profile_all",
          exportAllowed: false,
          fieldPattern: "synthetic_profile.*",
          rightsPolicyVersion: "db-policy-v0",
          sourceRecordId: "data-entitlement-profile",
          status: "approved",
          timeRangeDays: 31
        },
        {
          channel: "web",
          dataset: "synthetic_profile",
          entitlementId: "ent_revenue_block",
          exportAllowed: false,
          fieldPattern: "synthetic_profile.revenue",
          rightsPolicyVersion: "db-policy-v0",
          sourceRecordId: "data-entitlement-revenue-block",
          status: "blocked",
          timeRangeDays: 31
        }
      ],
      subscriptionRows: [
        {
          billingState: "active",
          planCode: "team",
          subscriptionId: "sub_team",
          validFrom: "2026-01-01T00:00:00.000Z",
          workspaceId: "ws_synthetic_team"
        }
      ],
      workspaceEntitlements: [
        {
          entitlementId: "ent_profile_all",
          sourceRecordId: "workspace-entitlement-profile",
          status: "approved",
          subscriptionId: "sub_team",
          validFrom: "2026-01-01T00:00:00.000Z",
          workspaceEntitlementId: "we_profile",
          workspaceId: "ws_synthetic_team"
        },
        {
          entitlementId: "ent_revenue_block",
          sourceRecordId: "workspace-entitlement-revenue-block",
          status: "approved",
          subscriptionId: "sub_team",
          validFrom: "2026-01-01T00:00:00.000Z",
          workspaceEntitlementId: "we_revenue_block",
          workspaceId: "ws_synthetic_team"
        }
      ]
    });
    const decision = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "team",
        qualityState: "PASS",
        requestedFields: [
          "synthetic_profile.company_name",
          "synthetic_profile.revenue"
        ],
        requestedRows: 2,
        timeRange: {
          from: "2026-06-01",
          to: "2026-06-20"
        },
        workspaceId: "ws_synthetic_team"
      },
      policySource.policy
    );
    const exportBlocked = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        exportRequested: true,
        plan: "team",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        workspaceId: "ws_synthetic_team"
      },
      policySource.policy
    );
    const rangeBlocked = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "team",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        timeRange: {
          from: "2026-04-01",
          to: "2026-06-20"
        },
        workspaceId: "ws_synthetic_team"
      },
      policySource.policy
    );

    expect(policySource).toMatchObject({
      liveDbReads: false,
      partnerRightsMatrixLoaded: false,
      sqlEmitted: false,
      status: "policy_source_scaffold"
    });
    expect(policySource.policy.channels.web).toBe("approved");
    expect(policySource.policy.channels.mcp).toBe("default_deny");
    expect(policySource.policy.rightsPolicyVersion).toBe("db-policy-v0");
    expect(decision.allowedFields).toEqual(["synthetic_profile.company_name"]);
    expect(decision.deniedFields).toEqual([
      {
        field: "synthetic_profile.revenue",
        reason: "field_blocked"
      }
    ]);
    expect(exportBlocked.deniedFields[0]?.reason).toBe("export_blocked");
    expect(rangeBlocked.deniedFields[0]?.reason).toBe("time_range_blocked");
  });

  it("does not compile expired workspace entitlements into live policy", () => {
    const policySource = createPolicyFromEntitlementRows({
      asOf: "2026-06-20T09:00:00.000Z",
      dataEntitlements: [
        {
          channel: "web",
          dataset: "synthetic_profile",
          entitlementId: "ent_expired",
          exportAllowed: false,
          fieldPattern: "synthetic_profile.company_name",
          rightsPolicyVersion: "db-policy-v0",
          sourceRecordId: "data-entitlement-expired",
          status: "approved"
        }
      ],
      workspaceEntitlements: [
        {
          entitlementId: "ent_expired",
          sourceRecordId: "workspace-entitlement-expired",
          status: "approved",
          validFrom: "2026-01-01T00:00:00.000Z",
          validTo: "2026-02-01T00:00:00.000Z",
          workspaceEntitlementId: "we_expired",
          workspaceId: "ws_synthetic_team"
        }
      ]
    });
    const decision = evaluateDataAccessRequest(
      {
        channel: "web",
        dataset: "synthetic_profile",
        plan: "team",
        qualityState: "PASS",
        requestedFields: ["synthetic_profile.company_name"],
        requestedRows: 1,
        workspaceId: "ws_synthetic_team"
      },
      policySource.policy
    );

    expect(policySource.policy.channels.web).toBe("default_deny");
    expect(policySource.policy.fieldPolicies).toEqual([]);
    expect(decision.error?.code).toBe("DATA_NOT_LICENSED");
    expect(decision.deniedFields[0]?.reason).toBe("channel_blocked");
  });

  it("reports database policy source capabilities without live reads", () => {
    expect(getEntitlementPolicySourceCapabilities()).toMatchObject({
      compiles_to_gateway_policy: true,
      default_rights_status: "default_deny",
      live_db_reads: false,
      partner_rights_matrix_loaded: false,
      sql_emitted: false,
      status: "policy_source_scaffold"
    });
  });

  it("reports the serving result envelope capability", () => {
    expect(getServingResultEnvelopeCapabilities()).toMatchObject({
      envelope_fields: ["as_of", "market_status", "provenance", "usage"],
      live_data_access: false,
      market_status: "not_applicable",
      rows_returned: false,
      shared_envelope: true,
      status: "serving_result_envelope_scaffold"
    });
  });
});
