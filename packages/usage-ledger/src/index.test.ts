import { describe, expect, it } from "vitest";
import {
  createUsageLedgerEventPlan,
  getUsageLedgerEventWriterCapabilities
} from "./index";

describe("usage ledger event writer scaffold", () => {
  it("plans a preview ledger event for a billable data access decision", () => {
    const plan = createUsageLedgerEventPlan({
      cached: false,
      channel: "web",
      credits: 1,
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      gatewayStatus: "allow_with_redactions",
      meteredFields: 1,
      meteredRows: 5,
      methodologyVersion: "methodology-v0",
      occurredAt: "2026-06-20T09:00:00.000Z",
      qualityState: "PASS",
      requestId: "req_123",
      rightsPolicyVersion: "synthetic-policy-v0",
      sourceRecordId: "policy-evaluation",
      workspaceId: "ws_synthetic_team"
    });

    expect(plan).toMatchObject({
      schemaReady: true,
      sqlEmitted: false,
      status: "write_planned",
      writeReady: false,
      writeReason: "LIVE_USAGE_WRITES_DISABLED"
    });
    expect(plan.event).toMatchObject({
      cacheState: "miss",
      meteredFields: 1,
      meteredRows: 5,
      operation: "data_access",
      requestId: "req_123",
      usageEventId:
        "usage_event_req_123_data_access_synthetic_profile_2026_06_20t09_00_00_000z",
      workspaceId: "ws_synthetic_team"
    });
    expect(plan.ledgerEntry).toMatchObject({
      billableState: "preview",
      creditDelta: 1,
      meterRuleId: "meter_web_synthetic_profile_data_access_credit"
    });
    expect(plan.reconciliation).toEqual({
      creditsTotal: 1,
      status: "held",
      targetDelayMinutes: 5
    });
  });

  it("blocks writes when workspace context is missing", () => {
    const plan = createUsageLedgerEventPlan({
      cached: false,
      channel: "mcp",
      credits: 0,
      dataVersion: "gateway-scaffold-v0",
      dataset: "hk_equity_quote",
      errorCode: "DATA_NOT_LICENSED",
      gatewayStatus: "deny",
      meteredFields: 0,
      meteredRows: 0,
      methodologyVersion: "methodology-v0",
      occurredAt: "2026-06-20T09:00:00.000Z",
      qualityState: "PASS",
      requestId: "req_missing_workspace",
      rightsPolicyVersion: "gate0-default-deny-v0",
      sourceRecordId: "policy-evaluation"
    });

    expect(plan).toMatchObject({
      schemaReady: false,
      status: "write_blocked",
      writeReady: false,
      writeReason: "WORKSPACE_CONTEXT_MISSING"
    });
    expect(plan.event.workspaceId).toBe("workspace_unresolved");
    expect(plan.ledgerEntry).toMatchObject({
      billableState: "blocked",
      creditDelta: 0
    });
  });

  it("keeps quality-held events non-billable", () => {
    const plan = createUsageLedgerEventPlan({
      cached: false,
      channel: "web",
      credits: 0,
      dataVersion: "gateway-scaffold-v0",
      dataset: "synthetic_profile",
      errorCode: "DATA_QUALITY_HOLD",
      gatewayStatus: "quality_hold",
      meteredFields: 0,
      meteredRows: 0,
      methodologyVersion: "methodology-v0",
      occurredAt: "2026-06-20T09:00:00.000Z",
      qualityState: "HOLD",
      requestId: "req_quality_hold",
      rightsPolicyVersion: "synthetic-policy-v0",
      sourceRecordId: "policy-evaluation",
      workspaceId: "ws_synthetic_team"
    });

    expect(plan.event.qualityState).toBe("HOLD");
    expect(plan.ledgerEntry).toMatchObject({
      billableState: "blocked",
      creditDelta: 0
    });
  });

  it("reports no-live-write runtime capabilities", () => {
    expect(getUsageLedgerEventWriterCapabilities()).toMatchObject({
      default_billable_state: "preview",
      live_billing_reconciliation: false,
      live_writes: false,
      reconciliation_target_delay_minutes: 5,
      sql_emitted: false,
      status: "event_writer_scaffold",
      usage_event_grain: "request_operation_dataset_occurred_at",
      weighted_credits: true
    });
  });
});
