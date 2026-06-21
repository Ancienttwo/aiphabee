import { describe, expect, it } from "vitest";
import {
  createServingExecutionAdapterPlan,
  createServingReadPlan,
  createServingQueryPlan,
  createServingQualityReleasePlan,
  createServingSqlDescriptor,
  createServingSqlTextPlan,
  getServingStoreExecutionAdapterCapabilities,
  getServingStoreQualityReleaseCapabilities,
  getServingStoreQueryPlannerCapabilities,
  getServingStoreReadCapabilities,
  getServingStoreSqlDescriptorCapabilities,
  getServingStoreSqlTextCompilerCapabilities
} from "./index";

describe("serving store read planner", () => {
  it("blocks default-deny gateway decisions before any live read", () => {
    const plan = createServingReadPlan({
      allowedFields: [],
      dataVersion: "gateway-scaffold-v0",
      dataset: "hk_equity_quote",
      errorCode: "DATA_NOT_LICENSED",
      gatewayStatus: "deny",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1,
      rightsPolicyVersion: "gate0-default-deny-v0"
    });

    expect(plan).toMatchObject({
      allowedFields: [],
      blockedReason: "DATA_NOT_LICENSED",
      liveRead: false,
      releaseState: "held",
      servedRows: 0,
      sqlEmitted: false,
      status: "blocked_by_gateway"
    });
  });

  it("blocks held serving records before SQL or usage rows", () => {
    const plan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      errorCode: "DATA_QUALITY_HOLD",
      gatewayStatus: "quality_hold",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "HOLD",
      requestedFields: ["synthetic_profile.company_name"],
      requestedRows: 1,
      rightsPolicyVersion: "synthetic-policy-v0"
    });

    expect(plan).toMatchObject({
      allowedFields: [],
      blockedReason: "DATA_QUALITY_HOLD",
      liveRead: false,
      servedRows: 0,
      sqlEmitted: false,
      status: "quality_hold"
    });
  });

  it("plans a versioned read for allowed synthetic fields without executing it", () => {
    const plan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow_with_redactions",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: [
        "synthetic_profile.company_name",
        "synthetic_profile.revenue"
      ],
      requestedRows: 5,
      rightsPolicyVersion: "synthetic-policy-v0",
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      }
    });

    expect(plan).toMatchObject({
      allowedFields: ["synthetic_profile.company_name"],
      liveRead: false,
      requestedRows: 5,
      rowLimit: 500,
      servedRows: 0,
      sqlEmitted: false,
      status: "read_planned"
    });
    expect(plan.cacheKeyMaterial).toEqual({
      dataVersion: "gateway-scaffold-v0",
      fieldSet: ["synthetic_profile.company_name"],
      methodologyVersion: "methodology-v0",
      rightsPolicyVersion: "synthetic-policy-v0",
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      }
    });
  });

  it("reports a no-live-read runtime capability", () => {
    expect(getServingStoreReadCapabilities()).toMatchObject({
      blocks_default_deny: true,
      blocks_quality_hold: true,
      live_reads: false,
      release_state_default: "held",
      sql_emitted: false,
      status: "read_planner_scaffold",
      uses_quality_state: true,
      uses_versioned_snapshots: true
    });
  });

  it("plans released snapshot queries without emitting SQL", () => {
    const readPlan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow_with_redactions",
      maxRows: 3,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: [
        "synthetic_profile.company_name",
        "synthetic_profile.revenue"
      ],
      requestedRows: 5,
      rightsPolicyVersion: "synthetic-policy-v0",
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      }
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 10,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });

    expect(queryPlan).toMatchObject({
      allowedFields: ["synthetic_profile.company_name"],
      liveRead: false,
      plannedRows: 3,
      releaseState: "released",
      snapshotRowCount: 10,
      sqlEmitted: false,
      status: "query_planned"
    });
    expect(queryPlan.cacheKeyMaterial).toEqual({
      dataVersion: "gateway-scaffold-v0",
      fieldSet: ["synthetic_profile.company_name"],
      methodologyVersion: "methodology-v0",
      releaseState: "released",
      rightsPolicyVersion: "synthetic-policy-v0",
      servingSnapshotId: "snapshot-released-v0",
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      }
    });
  });

  it("blocks query planning when the read plan is denied", () => {
    const readPlan = createServingReadPlan({
      allowedFields: [],
      dataVersion: "gateway-scaffold-v0",
      dataset: "hk_equity_quote",
      errorCode: "DATA_NOT_LICENSED",
      gatewayStatus: "deny",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1,
      rightsPolicyVersion: "gate0-default-deny-v0"
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 10,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });

    expect(queryPlan).toMatchObject({
      allowedFields: [],
      blockedReason: "DATA_NOT_LICENSED",
      liveRead: false,
      plannedRows: 0,
      sqlEmitted: false,
      status: "query_blocked"
    });
  });

  it("blocks unreleased or held snapshots before live reads", () => {
    const readPlan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["synthetic_profile.company_name"],
      requestedRows: 1,
      rightsPolicyVersion: "synthetic-policy-v0"
    });
    const heldRelease = createServingQueryPlan({
      readPlan,
      releaseState: "held",
      rowCount: 1,
      servingSnapshotId: "snapshot-held-v0",
      snapshotQualityState: "PASS"
    });
    const heldQuality = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 1,
      servingSnapshotId: "snapshot-quality-held-v0",
      snapshotQualityState: "HOLD"
    });

    expect(heldRelease).toMatchObject({
      blockedReason: "SERVING_SNAPSHOT_NOT_RELEASED",
      plannedRows: 0,
      status: "query_blocked"
    });
    expect(heldQuality).toMatchObject({
      blockedReason: "DATA_QUALITY_HOLD",
      plannedRows: 0,
      status: "query_blocked"
    });
  });

  it("reports a no-live-read query planner capability", () => {
    expect(getServingStoreQueryPlannerCapabilities()).toMatchObject({
      blocks_unreleased_snapshots: true,
      live_reads: false,
      requires_release_state: "released",
      sql_emitted: false,
      status: "query_planner_scaffold",
      uses_release_state: true,
      uses_row_limit: true
    });
  });

  it("creates a parameterized SQL descriptor without SQL text or execution", () => {
    const readPlan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow",
      maxRows: 10,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["synthetic_profile.company_name"],
      requestedRows: 3,
      rightsPolicyVersion: "synthetic-policy-v0",
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      }
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 8,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });
    const descriptor = createServingSqlDescriptor({ queryPlan });

    expect(descriptor).toMatchObject({
      bindings: {
        fieldSet: ["synthetic_profile.company_name"],
        limit: 3,
        servingSnapshotId: "snapshot-released-v0",
        timeFrom: "2024-01-01",
        timeTo: "2024-01-31"
      },
      executionReady: false,
      from: "core.serving_record",
      liveRead: false,
      selectedFieldPaths: ["synthetic_profile.company_name"],
      sqlEmitted: false,
      sqlTextEmitted: false,
      statementId: "serving_record_projection_by_snapshot_v0",
      status: "descriptor_planned"
    });
    expect(descriptor).not.toHaveProperty("sqlText");
  });

  it("blocks SQL descriptors for blocked query plans", () => {
    const readPlan = createServingReadPlan({
      allowedFields: [],
      dataVersion: "gateway-scaffold-v0",
      dataset: "hk_equity_quote",
      errorCode: "DATA_NOT_LICENSED",
      gatewayStatus: "deny",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1,
      rightsPolicyVersion: "gate0-default-deny-v0"
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 10,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });
    const descriptor = createServingSqlDescriptor({ queryPlan });

    expect(descriptor).toMatchObject({
      bindings: {
        fieldSet: [],
        limit: 0,
        servingSnapshotId: "snapshot-released-v0"
      },
      blockedReason: "DATA_NOT_LICENSED",
      executionReady: false,
      selectedFieldPaths: [],
      sqlEmitted: false,
      sqlTextEmitted: false,
      status: "descriptor_blocked"
    });
  });

  it("reports a no-execute SQL descriptor capability", () => {
    expect(getServingStoreSqlDescriptorCapabilities()).toMatchObject({
      blocks_unplanned_queries: true,
      execution_ready: false,
      live_reads: false,
      parameterized_bindings: true,
      sql_emitted: false,
      sql_text_emitted: false,
      status: "sql_descriptor_scaffold",
      uses_allowed_field_set: true,
      uses_row_limit: true,
      uses_snapshot_binding: true
    });
  });

  it("compiles allow-listed SQL text without enabling execution", () => {
    const readPlan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow",
      maxRows: 10,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["synthetic_profile.company_name"],
      requestedRows: 3,
      rightsPolicyVersion: "synthetic-policy-v0",
      timeRange: {
        from: "2024-01-01",
        to: "2024-01-31"
      }
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 8,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });
    const descriptor = createServingSqlDescriptor({ queryPlan });
    const sqlText = createServingSqlTextPlan({ descriptor });

    expect(sqlText).toMatchObject({
      descriptorStatementId: "serving_record_projection_by_snapshot_v0",
      executionReady: false,
      liveRead: false,
      parameterOrder: [
        "serving_snapshot_id",
        "field_set",
        "time_from",
        "time_to",
        "limit"
      ],
      parameters: {
        fieldSet: ["synthetic_profile.company_name"],
        limit: 3,
        servingSnapshotId: "snapshot-released-v0",
        timeFrom: "2024-01-01",
        timeTo: "2024-01-31"
      },
      sqlExecuted: false,
      sqlTextEmitted: true,
      status: "sql_text_planned"
    });
    expect(sqlText.sqlText).toContain("from core.serving_record");
    expect(sqlText.sqlText).toContain("serving_snapshot_id = $1");
    expect(sqlText.sqlText).toContain("field_set @> $2::text[]");
    expect(sqlText.sqlText).toContain("limit $5");
  });

  it("blocks SQL text compilation for blocked descriptors", () => {
    const readPlan = createServingReadPlan({
      allowedFields: [],
      dataVersion: "gateway-scaffold-v0",
      dataset: "hk_equity_quote",
      errorCode: "DATA_NOT_LICENSED",
      gatewayStatus: "deny",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1,
      rightsPolicyVersion: "gate0-default-deny-v0"
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 10,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });
    const descriptor = createServingSqlDescriptor({ queryPlan });
    const sqlText = createServingSqlTextPlan({ descriptor });

    expect(sqlText).toMatchObject({
      blockedReason: "DATA_NOT_LICENSED",
      executionReady: false,
      parameters: {
        fieldSet: [],
        limit: 0,
        servingSnapshotId: "snapshot-released-v0"
      },
      sqlExecuted: false,
      sqlTextEmitted: false,
      status: "sql_text_blocked"
    });
    expect(sqlText.sqlText).toBeUndefined();
  });

  it("reports a no-execute SQL text compiler capability", () => {
    expect(getServingStoreSqlTextCompilerCapabilities()).toMatchObject({
      execution_ready: false,
      live_reads: false,
      sql_executed: false,
      sql_text_emitted: true,
      status: "sql_text_compiler_scaffold",
      template_source: "allow_listed_statement_id",
      uses_parameterized_bindings: true
    });
  });

  it("defers execution for planned SQL text without live reads", () => {
    const readPlan = createServingReadPlan({
      allowedFields: ["synthetic_profile.company_name"],
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow",
      maxRows: 10,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["synthetic_profile.company_name"],
      requestedRows: 3,
      rightsPolicyVersion: "synthetic-policy-v0"
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 8,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });
    const descriptor = createServingSqlDescriptor({ queryPlan });
    const sqlTextPlan = createServingSqlTextPlan({ descriptor });
    const execution = createServingExecutionAdapterPlan({ sqlTextPlan });

    expect(execution).toMatchObject({
      adapter: "hyperdrive",
      deferredReason: "LIVE_SERVING_EXECUTION_DISABLED",
      executionReady: false,
      liveRead: false,
      rows: [],
      servedRows: 0,
      sqlExecuted: false,
      sqlTextAccepted: true,
      statementId: "serving_record_projection_by_snapshot_v0",
      status: "execution_deferred"
    });
  });

  it("blocks execution adapter plans for blocked SQL text", () => {
    const readPlan = createServingReadPlan({
      allowedFields: [],
      dataVersion: "gateway-scaffold-v0",
      dataset: "hk_equity_quote",
      errorCode: "DATA_NOT_LICENSED",
      gatewayStatus: "deny",
      maxRows: 500,
      methodologyVersion: "methodology-v0",
      qualityState: "PASS",
      requestedFields: ["quote.close"],
      requestedRows: 1,
      rightsPolicyVersion: "gate0-default-deny-v0"
    });
    const queryPlan = createServingQueryPlan({
      readPlan,
      releaseState: "released",
      rowCount: 10,
      servingSnapshotId: "snapshot-released-v0",
      snapshotQualityState: "PASS"
    });
    const descriptor = createServingSqlDescriptor({ queryPlan });
    const sqlTextPlan = createServingSqlTextPlan({ descriptor });
    const execution = createServingExecutionAdapterPlan({ sqlTextPlan });

    expect(execution).toMatchObject({
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
  });

  it("reports a no-live execution adapter capability", () => {
    expect(getServingStoreExecutionAdapterCapabilities()).toMatchObject({
      adapter: "hyperdrive",
      blocks_blocked_sql_text: true,
      execution_ready: false,
      live_reads: false,
      returns_empty_rows: true,
      rows_returned: false,
      sql_executed: false,
      status: "execution_adapter_scaffold"
    });
  });

  it("releases pass and warn snapshots without live SQL", () => {
    const passPlan = createServingQualityReleasePlan({
      dataVersion: "data-version-v0",
      dataset: "synthetic_profile",
      methodologyVersion: "methodology-v0",
      rightsPolicyVersion: "synthetic-policy-v0",
      rowCount: 2,
      snapshotQualityState: "PASS",
      sourceRecordId: "snapshot-pass"
    });
    const warnPlan = createServingQualityReleasePlan({
      dataVersion: "data-version-v0",
      dataset: "synthetic_profile",
      methodologyVersion: "methodology-v0",
      rightsPolicyVersion: "synthetic-policy-v0",
      rowCount: 2,
      snapshotQualityState: "WARN",
      sourceRecordId: "snapshot-warn"
    });

    expect(passPlan).toMatchObject({
      gatewayErrorCode: undefined,
      isolatedRows: 0,
      releaseState: "released",
      releasedRows: 2,
      servingEligible: true,
      sqlEmitted: false,
      warnings: []
    });
    expect(warnPlan).toMatchObject({
      isolatedRows: 0,
      releaseState: "released",
      releasedRows: 2,
      servingEligible: true,
      sqlEmitted: false,
      warnings: ["quality_state_warn"]
    });
  });

  it("holds snapshots with held field or record states", () => {
    const plan = createServingQualityReleasePlan({
      dataVersion: "data-version-v0",
      dataset: "synthetic_profile",
      fieldQualityStates: [
        {
          id: "synthetic_profile.revenue",
          qualityState: "HOLD",
          scope: "field"
        }
      ],
      methodologyVersion: "methodology-v0",
      recordQualityStates: [
        {
          id: "company:abc",
          qualityState: "PASS",
          scope: "record"
        }
      ],
      rightsPolicyVersion: "synthetic-policy-v0",
      rowCount: 3,
      snapshotQualityState: "PASS",
      sourceRecordId: "snapshot-field-hold"
    });

    expect(plan).toMatchObject({
      blockedQualityStates: ["HOLD"],
      gatewayErrorCode: "DATA_QUALITY_HOLD",
      isolatedRows: 3,
      releaseState: "held",
      releasedRows: 0,
      servingEligible: false,
      sqlEmitted: false
    });
  });

  it("withdraws rejected raw snapshots from serving release", () => {
    const plan = createServingQualityReleasePlan({
      dataVersion: "data-version-v0",
      dataset: "synthetic_profile",
      methodologyVersion: "methodology-v0",
      rightsPolicyVersion: "synthetic-policy-v0",
      rowCount: 4,
      snapshotQualityState: "REJECT_RAW",
      sourceRecordId: "snapshot-reject-raw"
    });

    expect(plan).toMatchObject({
      blockedQualityStates: ["REJECT_RAW"],
      gatewayErrorCode: "DATA_QUALITY_HOLD",
      isolatedRows: 4,
      releaseState: "withdrawn",
      releasedRows: 0,
      servingEligible: false,
      sqlEmitted: false
    });
  });

  it("reports a no-live-write quality release capability", () => {
    expect(getServingStoreQualityReleaseCapabilities()).toMatchObject({
      blocks_quality_states: ["HOLD", "REJECT_RAW"],
      gateway_error_code: "DATA_QUALITY_HOLD",
      live_reads: false,
      live_writes: false,
      release_states: ["held", "released", "withdrawn"],
      released_quality_states: ["PASS", "WARN"],
      sql_emitted: false,
      status: "quality_release_isolation_scaffold",
      uses_quality_state: true,
      warn_quality_states: ["WARN"]
    });
  });
});
