import { describe, expect, it } from "vitest";
import {
  createServingReadPlan,
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
});
