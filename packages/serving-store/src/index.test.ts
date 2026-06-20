import { describe, expect, it } from "vitest";
import {
  createServingReadPlan,
  createServingQueryPlan,
  createServingQualityReleasePlan,
  getServingStoreQualityReleaseCapabilities,
  getServingStoreQueryPlannerCapabilities,
  getServingStoreReadCapabilities
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
