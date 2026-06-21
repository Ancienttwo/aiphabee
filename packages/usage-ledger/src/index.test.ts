import { describe, expect, it } from "vitest";
import {
  createHighCostUsageReservationPlan,
  createUsageBillingReconciliationPlan,
  createUsageQuotaDisplayPlan,
  createUsageLedgerEventPlan,
  getHighCostUsageReservationCapabilities,
  getUsageBillingReconciliationCapabilities,
  getUsageQuotaDisplayCapabilities,
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

  it("reports Web Agent and MCP quota display capabilities", () => {
    expect(getUsageQuotaDisplayCapabilities()).toMatchObject({
      billing_provider_reconciliation: false,
      channels: ["web_agent", "mcp"],
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "POST /usage/quota/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "usage_quota_display_scaffold"
    });
  });

  it("reports usage billing reconciliation capabilities", () => {
    expect(getUsageBillingReconciliationCapabilities()).toMatchObject({
      billing_provider_calls: false,
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "POST /usage/billing/reconciliation/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "usage_billing_reconciliation_scaffold"
    });
    expect(getUsageBillingReconciliationCapabilities().trace_fields).toEqual([
      "request_id",
      "usage_event_id",
      "ledger_entry_id",
      "invoice_line_id"
    ]);
  });

  it("reports high-cost usage reservation capabilities", () => {
    expect(getHighCostUsageReservationCapabilities()).toMatchObject({
      failure_refund_required: true,
      live_ledger_writes: false,
      persistent_writes: false,
      pre_debit_required: true,
      request_id_visible: true,
      route: "POST /usage/high-cost/reservation/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "high_cost_usage_reservation_scaffold",
      usage_ledger_link_required: true
    });
  });

  it("plans quota display values without live ledger reads", () => {
    const plan = createUsageQuotaDisplayPlan({
      accountId: "acct_internal_001",
      channel: "mcp",
      pendingCredits: 10,
      planCode: "developer",
      requestId: "req_quota_001",
      usedCredits: 240,
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      channel: "mcp",
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_internal_alpha"
    });
    expect(plan.quota).toEqual({
      credit_limit: 10000,
      credits_pending: 10,
      credits_remaining: 9750,
      credits_used: 240,
      over_quota: false,
      plan_code: "developer"
    });
  });

  it("marks quota display blocked when workspace context is missing", () => {
    const plan = createUsageQuotaDisplayPlan({
      requestId: "req_missing_workspace"
    });

    expect(plan.status).toBe("blocked_missing_workspace");
    expect(plan.workspace_id).toBe("workspace_unresolved");
    expect(plan.quota.plan_code).toBe("free");
  });

  it("plans subscription bill reconciliation against traceable usage ledger entries", () => {
    const plan = createUsageBillingReconciliationPlan({
      accountId: "acct_internal_001",
      billingPeriodEnd: "2026-07-01T00:00:00.000Z",
      billingPeriodStart: "2026-06-01T00:00:00.000Z",
      currency: "HKD",
      invoiceAmountMinor: 68800,
      invoiceCredits: 15,
      invoiceId: "inv_ws_internal_alpha_202606",
      ledgerEntries: [
        {
          creditDelta: 10,
          ledgerEntryId: "usage_ledger_entry_req_tool_001",
          requestId: "req_tool_001",
          usageEventId: "usage_event_req_tool_001"
        },
        {
          creditDelta: 5,
          ledgerEntryId: "usage_ledger_entry_req_tool_002",
          requestId: "req_tool_002",
          usageEventId: "usage_event_req_tool_002"
        }
      ],
      requestId: "req_billing_reconciliation",
      subscriptionId: "sub_ws_internal_alpha_developer",
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      currency: "HKD",
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id: "req_billing_reconciliation",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      subscription_id: "sub_ws_internal_alpha_developer",
      workspace_id: "ws_internal_alpha"
    });
    expect(plan.consistency).toEqual({
      credit_delta: 0,
      invoice_credits: 15,
      ledger_credits: 15,
      status: "matched"
    });
    expect(plan.invoice).toMatchObject({
      amount_minor: 68800,
      invoice_id: "inv_ws_internal_alpha_202606",
      source: "synthetic_billing_snapshot",
      table: "core.subscription_invoice"
    });
    expect(plan.invoice_lines).toHaveLength(2);
    expect(plan.invoice_lines[0]).toMatchObject({
      credit_delta: 10,
      ledger_entry_id: "usage_ledger_entry_req_tool_001",
      request_id: "req_tool_001",
      trace_status: "traceable",
      usage_event_id: "usage_event_req_tool_001"
    });
    expect(plan.traceability).toEqual({
      required_fields: [
        "request_id",
        "usage_event_id",
        "ledger_entry_id",
        "invoice_line_id"
      ],
      support_investigation_by_request_id: true,
      traceable_call_count: 2,
      traceable_to_call: true
    });
  });

  it("flags billing mismatches and blocks missing reconciliation context", () => {
    const mismatch = createUsageBillingReconciliationPlan({
      billingPeriodEnd: "2026-07-01T00:00:00.000Z",
      billingPeriodStart: "2026-06-01T00:00:00.000Z",
      invoiceCredits: 20,
      invoiceId: "inv_ws_internal_alpha_202606",
      ledgerEntries: [
        {
          creditDelta: 10,
          ledgerEntryId: "usage_ledger_entry_req_tool_001",
          requestId: "req_tool_001",
          usageEventId: "usage_event_req_tool_001"
        }
      ],
      requestId: "req_billing_mismatch",
      subscriptionId: "sub_ws_internal_alpha_developer",
      workspaceId: "ws_internal_alpha"
    });
    const missing = createUsageBillingReconciliationPlan({
      requestId: "req_billing_missing"
    });

    expect(mismatch.consistency).toEqual({
      credit_delta: 10,
      invoice_credits: 20,
      ledger_credits: 10,
      status: "mismatch"
    });
    expect(missing.status).toBe("blocked_missing_context");
    expect(missing.traceability.traceable_to_call).toBe(false);
    expect(missing.invoice_lines).toHaveLength(0);
  });

  it("plans confirmed high-cost pre-debits without live ledger writes", () => {
    const plan = createHighCostUsageReservationPlan({
      estimatedCredits: 8,
      requestId: "req_high_cost_confirmed",
      subscriptionId: "sub_ws_internal_alpha_developer",
      taskId: "planned_compare_securities_req_high_cost_confirmed",
      toolName: "compare_securities",
      userConfirmed: true,
      workspaceId: "ws_internal_alpha"
    });

    expect(plan).toMatchObject({
      live_ledger_writes: false,
      persistent_writes: false,
      request_id: "req_high_cost_confirmed",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      usage_ledger_link_required: true,
      user_confirmed: true
    });
    expect(plan.estimate).toEqual({
      credits: 8,
      source: "analytics_high_cost_estimate"
    });
    expect(plan.pre_debit).toMatchObject({
      pre_debit_credits: 8,
      required: true,
      status: "planned_no_write",
      table: "core.usage_ledger_entry"
    });
    expect(plan.failure_refund).toMatchObject({
      refund_credits: 0,
      required: true,
      status: "not_triggered",
      table: "core.usage_ledger_entry"
    });
    expect(plan.double_charge_guard.same_request_reuses_reservation).toBe(true);
  });

  it("plans failed high-cost refunds against the same reservation", () => {
    const plan = createHighCostUsageReservationPlan({
      estimatedCredits: 13,
      executionStatus: "failed",
      requestId: "req_high_cost_failed",
      subscriptionId: "sub_ws_internal_alpha_developer",
      taskId: "planned_screen_securities_req_high_cost_failed",
      toolName: "screen_securities",
      userConfirmed: true,
      workspaceId: "ws_internal_alpha"
    });

    expect(plan.status).toBe("planned_no_write");
    expect(plan.pre_debit.pre_debit_credits).toBe(13);
    expect(plan.failure_refund).toMatchObject({
      reason: "system_failure_or_retry",
      refund_credits: 13,
      required: true,
      status: "planned_no_write"
    });
    expect(plan.failure_refund.ledger_entry_id).toContain(plan.reservation.reservation_id);
  });

  it("keeps unconfirmed and incomplete high-cost reservations blocked from debit", () => {
    const unconfirmed = createHighCostUsageReservationPlan({
      estimatedCredits: 13,
      requestId: "req_high_cost_unconfirmed",
      subscriptionId: "sub_ws_internal_alpha_developer",
      taskId: "planned_screen_securities_req_high_cost_unconfirmed",
      toolName: "screen_securities",
      userConfirmed: false,
      workspaceId: "ws_internal_alpha"
    });
    const missingContext = createHighCostUsageReservationPlan({
      estimatedCredits: 8,
      requestId: "req_high_cost_missing",
      userConfirmed: true
    });

    expect(unconfirmed.status).toBe("confirmation_required");
    expect(unconfirmed.reservation.status).toBe("awaiting_confirmation");
    expect(unconfirmed.pre_debit).toMatchObject({
      pre_debit_credits: 0,
      status: "awaiting_confirmation"
    });
    expect(missingContext.status).toBe("blocked_missing_context");
    expect(missingContext.pre_debit).toMatchObject({
      pre_debit_credits: 0,
      status: "blocked_missing_context"
    });
  });
});
