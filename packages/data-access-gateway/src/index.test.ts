import { describe, expect, it } from "vitest";
import {
  DEFAULT_DATA_ACCESS_POLICY,
  createDataCoverageReleaseGateReport,
  createFieldRightsLivePolicySourceReadinessReport,
  createFieldAuthorizationConfigChangePlan,
  createP0RightsMatrixCoverageReport,
  createRestrictedExportPlan,
  createServingQualityLiveReadinessReport,
  createPolicyFromEntitlementRows,
  createSyntheticApprovedPolicy,
  createSyntheticWorkspaceEntitlementPolicy,
  evaluateDataAccessRequest,
  getDataCoverageReleaseGateCapabilities,
  getFieldRightsLivePolicySourceCapabilities,
  getFieldAuthorizationConfigCapabilities,
  getEntitlementPolicySourceCapabilities,
  getP0RightsMatrixCoverageCapabilities,
  getRestrictedExportCapabilities,
  getServingQualityLiveReadinessCapabilities,
  getServingResultEnvelopeCapabilities
} from "./index";

const REQUIRED_P0_TOOL_COUNT = 23;
const IPO_TOOL_NAMES = [
  "get_ipo_profile",
  "search_ipo_calendar",
  "get_ipo_timetable",
  "get_ipo_offering",
  "get_ipo_allotment",
  "screen_ipos",
  "compare_ipos"
] as const;

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
      "from aiphabee_core.serving_record"
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
      table: "aiphabee_audit.field_authorization_approval",
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
      table: "aiphabee_core.field_authorization_change",
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
        table: "aiphabee_governance.data_entitlement",
        time_range_days: 31
      },
      versioned_cache_key_required: true,
      workspace_entitlement_row: {
        status: "approved",
        table: "aiphabee_governance.workspace_entitlement",
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
      required_p0_tool_count: REQUIRED_P0_TOOL_COUNT,
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
        "get_entitlements",
        ...IPO_TOOL_NAMES
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
    expect(report.tool_coverage).toHaveLength(REQUIRED_P0_TOOL_COUNT);
    expect(report.validation).toMatchObject({
      all_required_surfaces_configured: true,
      required_p0_tool_count: REQUIRED_P0_TOOL_COUNT,
      tool_count: REQUIRED_P0_TOOL_COUNT,
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

  it("reports data coverage release gate capabilities without live partner rows", () => {
    expect(getDataCoverageReleaseGateCapabilities()).toMatchObject({
      coverage_policy_loaded: false,
      frontend: false,
      live_partner_data_reads: false,
      package: "@aiphabee/data-access-gateway",
      persistent_writes: false,
      route: "GET /gateway/data-coverage/release-gate",
      runtime_route: "GET /gateway/runtime",
      sql_emitted: false,
      status: "data_coverage_release_gate_scaffold"
    });
    expect(getDataCoverageReleaseGateCapabilities().required_freshness_tiers).toEqual([
      "realtime",
      "delayed",
      "eod"
    ]);
    expect(getDataCoverageReleaseGateCapabilities().required_coverage_domains).toEqual([
      "corporate_actions",
      "financial_restatements",
      "delistings",
      "identifier_history"
    ]);
  });

  it("builds a data coverage release gate report for freshness and history coverage", () => {
    const report = createDataCoverageReleaseGateReport({
      asOf: "2026-06-21T14:00:00.000Z",
      coveragePolicyVersion: "coverage-policy-v0"
    });

    expect(report).toMatchObject({
      coverage_policy_version: "coverage-policy-v0",
      frontend: false,
      live_partner_data_reads: false,
      persistent_writes: false,
      sql_emitted: false,
      status: "data_coverage_release_gate_scaffold"
    });
    expect(report.freshness_markers.map((marker) => marker.tier)).toEqual([
      "realtime",
      "delayed",
      "eod"
    ]);
    expect(report.freshness_markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label_required: true,
          live_partner_rows_loaded: false,
          min_delay_minutes: 15,
          tier: "delayed"
        })
      ])
    );
    expect(report.coverage_domains.map((domain) => domain.domain)).toEqual([
      "corporate_actions",
      "financial_restatements",
      "delistings",
      "identifier_history"
    ]);
    expect(report.coverage_domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "delistings",
          evidence_surfaces: ["resolve_security", "get_security_profile", "get_security_history"],
          live_partner_rows_loaded: false,
          status: "scaffold_covered_no_live_partner_rows"
        })
      ])
    );
    expect(report.release_gate).toMatchObject({
      blockers: [
        "partner_coverage_files_missing",
        "live_freshness_policy_not_loaded",
        "golden_coverage_not_signed_off"
      ],
      gate_status: "blocked_live_partner_coverage",
      live_partner_coverage_loaded: false,
      required_signoffs: ["data_engineering", "data_partner", "quality_owner"]
    });
    expect(report.validation).toMatchObject({
      all_required_coverage_domains_present: true,
      all_required_freshness_tiers_present: true,
      coverage_domain_count: 4,
      freshness_tier_count: 3
    });
  });

  it("reports field rights live policy source readiness without enabling live reads", () => {
    expect(getFieldRightsLivePolicySourceCapabilities()).toMatchObject({
      compiles_partner_matrix_to_db_rows: true,
      compiles_to_gateway_policy: true,
      default_deny_preserved: true,
      external_activation_status: "blocked_external_activation",
      fixture_version: "field-rights-live-policy-source@partner-db-fixture-v0",
      frontend: false,
      live_db_reads: false,
      live_partner_rights_matrix_reads: false,
      persistent_writes: false,
      route: "GET /gateway/field-rights/live-policy-source/readiness",
      runtime_route: "GET /gateway/runtime",
      sql_emitted: false,
      status: "field_rights_live_policy_source_readiness_scaffold"
    });
    expect(getFieldRightsLivePolicySourceCapabilities().required_dimensions).toEqual([
      "workspace",
      "plan",
      "channel",
      "dataset",
      "field",
      "time_range",
      "export"
    ]);
  });

  it("compiles partner matrix fixtures and DB rows into runtime field-rights smoke checks", () => {
    const report = createFieldRightsLivePolicySourceReadinessReport({
      asOf: "2026-06-22T00:00:00.000Z"
    });

    expect(report).toMatchObject({
      default_rights_status: "default_deny",
      fixture_version: "field-rights-live-policy-source@partner-db-fixture-v0",
      frontend: false,
      live_db_reads: false,
      live_partner_rights_matrix_reads: false,
      persistent_writes: false,
      rights_policy_version: "field-rights-live-policy-source-fixture-v0",
      sql_emitted: false,
      status: "live_policy_source_readiness_passed"
    });
    expect(report.external_activation).toMatchObject({
      blockers: [
        "partner_signed_matrix_absent",
        "live_db_read_path_not_enabled",
        "ops_cutover_not_approved"
      ],
      status: "blocked_external_activation"
    });
    expect(report.partner_matrix_fixture.matrix_rows).toHaveLength(4);
    expect(report.partner_matrix_fixture.required_prd_dimensions).toEqual([
      "owner_source",
      "web_display",
      "mcp_api_redistribution",
      "raw_vs_derived",
      "freshness_tier",
      "history_window",
      "export_and_cache",
      "user_type_region",
      "subscriber_reporting",
      "audit_termination",
      "commercial_terms"
    ]);
    expect(report.policy_source).toMatchObject({
      liveDbReads: false,
      partnerRightsMatrixLoaded: false,
      rowCounts: {
        dataEntitlements: 4,
        subscriptionRows: 3,
        workspaceEntitlements: 4
      },
      sqlEmitted: false,
      status: "policy_source_scaffold"
    });
    expect(report.readiness).toEqual({
      db_rows_compiled: true,
      default_deny_preserved: true,
      partner_matrix_fixture_loaded: true,
      runtime_smoke_passed: true,
      versioned_cache_key_verified: true
    });
    expect(report.runtime_smoke).toHaveLength(6);
    expect(report.runtime_smoke).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allowed_fields: ["quote_snapshot.last_price"],
          denied_reasons: ["field_blocked"],
          scenario_id: "developer_mcp_quote_redaction",
          status: "pass"
        }),
        expect.objectContaining({
          allowed_fields: ["price_history.close"],
          denied_reasons: [],
          expected_status: "allow",
          scenario_id: "team_export_price_history_allowed",
          status: "pass"
        }),
        expect.objectContaining({
          denied_reasons: ["workspace_entitlement_default_deny"],
          expected_status: "deny",
          scenario_id: "missing_workspace_default_deny",
          status: "pass"
        }),
        expect.objectContaining({
          denied_reasons: ["field_default_deny"],
          scenario_id: "pro_web_financial_field_default_deny",
          status: "pass"
        }),
        expect.objectContaining({
          denied_reasons: ["time_range_blocked"],
          scenario_id: "developer_mcp_quote_time_range_blocked",
          status: "pass"
        }),
        expect.objectContaining({
          denied_reasons: ["export_blocked"],
          scenario_id: "developer_mcp_quote_export_blocked",
          status: "pass"
        })
      ])
    );
    expect(report.validation).toEqual({
      partner_matrix_rows: 4,
      smoke_count: 6,
      source_records: 8
    });
  });

  it("reports serving quality live readiness capabilities without enabling live reads", () => {
    expect(getServingQualityLiveReadinessCapabilities()).toMatchObject({
      fixture_version: "serving-quality-live-readiness@quality-release-fixture-v0",
      frontend: false,
      live_partner_rows_loaded: false,
      live_serving_reads: false,
      live_serving_sql_execution: false,
      package: "@aiphabee/data-access-gateway",
      persistent_writes: false,
      route: "GET /gateway/serving-quality/live-readiness",
      runtime_route: "GET /gateway/runtime",
      sql_executed: false,
      status: "serving_quality_live_readiness_scaffold",
      validates_gateway_quality_hold: true,
      validates_release_isolation: true,
      validates_sql_execution_guard: true
    });
    expect(getServingQualityLiveReadinessCapabilities().required_quality_states).toEqual([
      "PASS",
      "WARN",
      "HOLD",
      "REJECT_RAW"
    ]);
  });

  it("validates serving quality isolation before live Serving activation", () => {
    const report = createServingQualityLiveReadinessReport({
      asOf: "2026-06-22T01:00:00.000Z"
    });

    expect(report).toMatchObject({
      fixture_version: "serving-quality-live-readiness@quality-release-fixture-v0",
      frontend: false,
      live_partner_rows_loaded: false,
      live_serving_reads: false,
      live_serving_sql_execution: false,
      persistent_writes: false,
      sql_executed: false,
      status: "serving_quality_live_readiness_passed"
    });
    expect(report.activation).toEqual({
      blockers: [
        "partner_serving_rows_absent",
        "live_hyperdrive_execution_disabled",
        "quality_owner_cutover_not_approved"
      ],
      required_signoffs: ["data_engineering", "data_partner", "quality_owner"],
      status: "blocked_live_serving_activation"
    });
    expect(report.readiness).toEqual({
      gateway_quality_hold_guard_passed: true,
      no_blocked_quality_sql_execution: true,
      no_live_reads_or_writes: true,
      release_mapping_passed: true,
      sql_execution_guard_passed: true
    });
    expect(report.release_fixture.map((fixture) => fixture.quality_state)).toEqual([
      "PASS",
      "WARN",
      "HOLD",
      "REJECT_RAW"
    ]);
    expect(report.quality_release_checks).toHaveLength(4);
    expect(report.quality_release_checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          expected_release_state: "released",
          expected_serving_query_status: "query_planned",
          expected_sql_text_status: "sql_text_planned",
          quality_state: "PASS",
          release_state: "released",
          scenario_id: "pass_snapshot_released_deferred_execution",
          serving_execution_status: "execution_deferred",
          serving_query_status: "query_planned",
          sql_executed: false,
          sql_text_emitted: true,
          sql_text_status: "sql_text_planned",
          status: "pass"
        }),
        expect.objectContaining({
          expected_release_state: "released",
          expected_serving_query_status: "query_planned",
          expected_sql_text_status: "sql_text_planned",
          gateway_status: "allow",
          quality_state: "WARN",
          release_state: "released",
          scenario_id: "warn_snapshot_released_with_warning",
          serving_execution_status: "execution_deferred",
          status: "pass"
        }),
        expect.objectContaining({
          expected_gateway_error_code: "DATA_QUALITY_HOLD",
          expected_release_state: "held",
          expected_serving_query_status: "query_blocked",
          expected_sql_text_status: "sql_text_blocked",
          gateway_error_code: "DATA_QUALITY_HOLD",
          gateway_status: "quality_hold",
          quality_state: "HOLD",
          release_state: "held",
          scenario_id: "hold_snapshot_isolated_before_sql",
          serving_execution_status: "execution_blocked",
          serving_query_status: "query_blocked",
          sql_executed: false,
          sql_text_emitted: false,
          sql_text_status: "sql_text_blocked",
          status: "pass"
        }),
        expect.objectContaining({
          expected_gateway_error_code: "DATA_QUALITY_HOLD",
          expected_release_state: "withdrawn",
          expected_serving_query_status: "query_blocked",
          expected_sql_text_status: "sql_text_blocked",
          gateway_error_code: "DATA_QUALITY_HOLD",
          gateway_status: "quality_hold",
          quality_state: "REJECT_RAW",
          release_state: "withdrawn",
          scenario_id: "reject_raw_snapshot_withdrawn_before_sql",
          serving_execution_status: "execution_blocked",
          serving_query_status: "query_blocked",
          sql_executed: false,
          sql_text_emitted: false,
          sql_text_status: "sql_text_blocked",
          status: "pass"
        })
      ])
    );
    expect(report.validation).toEqual({
      blocked_quality_states: 2,
      quality_state_count: 4,
      smoke_count: 4
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
