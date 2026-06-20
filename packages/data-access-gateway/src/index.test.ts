import { describe, expect, it } from "vitest";
import {
  DEFAULT_DATA_ACCESS_POLICY,
  createSyntheticApprovedPolicy,
  createSyntheticWorkspaceEntitlementPolicy,
  evaluateDataAccessRequest
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
});
