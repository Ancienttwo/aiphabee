import { describe, expect, it } from "vitest";
import {
  DEFAULT_DATA_ACCESS_POLICY,
  createPolicyFromEntitlementRows,
  createSyntheticApprovedPolicy,
  createSyntheticWorkspaceEntitlementPolicy,
  evaluateDataAccessRequest,
  getEntitlementPolicySourceCapabilities,
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
