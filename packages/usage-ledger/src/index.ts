export const USAGE_LEDGER_EVENT_WRITER_VERSION =
  "2026-06-20.phase1.usage-event-writer-scaffold.v0";
export const USAGE_QUOTA_DISPLAY_VERSION =
  "2026-06-21.phase1.usage-quota-display-scaffold.v0";
export const USAGE_BILLING_RECONCILIATION_VERSION =
  "2026-06-21.phase2.usage-billing-reconciliation-scaffold.v0";
export const HIGH_COST_USAGE_RESERVATION_VERSION =
  "2026-06-21.phase2.high-cost-usage-reservation-scaffold.v0";

export const USAGE_QUOTA_CHANNELS = ["web_agent", "mcp"] as const;
export const USAGE_QUOTA_PLAN_CODES = [
  "free",
  "plus",
  "pro",
  "developer",
  "team",
  "enterprise"
] as const;

export type UsageLedgerBillableState = "blocked" | "posted" | "preview" | "reversed" | "waived";
export type UsageLedgerCacheState = "hit" | "miss" | "not_applicable";
export type UsageLedgerChannel = "api" | "export" | "mcp" | "web";
export type UsageQuotaChannel = (typeof USAGE_QUOTA_CHANNELS)[number];
export type UsageQuotaPlanCode = (typeof USAGE_QUOTA_PLAN_CODES)[number];
export type UsageLedgerOperation =
  | "agent_run"
  | "data_access"
  | "eval_run"
  | "export"
  | "tool_call";
export type UsageLedgerQualityState = "HOLD" | "PASS" | "REJECT_RAW" | "WARN";
export type UsageLedgerWriterStatus = "write_blocked" | "write_planned";
export type UsageBillingReconciliationStatus = "blocked_missing_context" | "planned_no_write";
export type UsageBillingTraceStatus = "mismatch" | "traceable";
export type HighCostUsageExecutionStatus = "failed" | "planned" | "succeeded";
export type HighCostUsageReservationStatus =
  | "blocked_missing_context"
  | "confirmation_required"
  | "planned_no_write";
export type UsageQuotaDisplayStatus = "blocked_missing_workspace" | "planned_no_write";

export interface UsageLedgerEventPlanInput {
  accountId?: string;
  cached: boolean;
  channel: UsageLedgerChannel;
  credits: number;
  dataVersion: string;
  dataset: string;
  errorCode?: string;
  gatewayStatus: string;
  inputUnits?: number;
  membershipId?: string;
  meteredFields: number;
  meteredRows: number;
  methodologyVersion: string;
  occurredAt: string;
  operation?: UsageLedgerOperation;
  outputUnits?: number;
  qualityState: UsageLedgerQualityState;
  requestId: string;
  rightsPolicyVersion: string;
  runId?: string;
  sourceRecordId: string;
  subscriptionId?: string;
  toolName?: string;
  workspaceId?: string;
}

export interface UsageLedgerEventPlan {
  event: {
    accountId?: string;
    cacheState: UsageLedgerCacheState;
    channel: UsageLedgerChannel;
    dataVersion: string;
    dataset: string;
    inputUnits: number;
    membershipId?: string;
    meteredFields: number;
    meteredRows: number;
    methodologyVersion: string;
    occurredAt: string;
    operation: UsageLedgerOperation;
    outputUnits: number;
    qualityState: UsageLedgerQualityState;
    requestId: string;
    rightsPolicyVersion: string;
    runId?: string;
    sourceRecordId: string;
    toolName?: string;
    usageEventId: string;
    workspaceId: string;
  };
  ledgerEntry: {
    accountId?: string;
    billableState: UsageLedgerBillableState;
    creditDelta: number;
    ledgerEntryId: string;
    meterRuleId: string;
    sourceRecordId: string;
    subscriptionId?: string;
    usageEventId: string;
    workspaceId: string;
  };
  reconciliation: {
    creditsTotal: number;
    status: "held";
    targetDelayMinutes: 5;
  };
  schemaReady: boolean;
  sqlEmitted: false;
  status: UsageLedgerWriterStatus;
  tables: readonly [
    "core.usage_meter_rule",
    "core.usage_event",
    "core.usage_reconciliation_batch",
    "core.usage_ledger_entry"
  ];
  version: typeof USAGE_LEDGER_EVENT_WRITER_VERSION;
  writeReady: false;
  writeReason: "LIVE_USAGE_WRITES_DISABLED" | "WORKSPACE_CONTEXT_MISSING";
}

export interface UsageQuotaDisplayPlanInput {
  accountId?: string;
  channel?: UsageQuotaChannel;
  pendingCredits?: number;
  periodEnd?: string;
  periodStart?: string;
  planCode?: UsageQuotaPlanCode;
  requestId: string;
  usedCredits?: number;
  workspaceId?: string;
}

export interface UsageQuotaDisplayPlan {
  account_id?: string;
  billing_traceability: {
    billing_provider_reconciliation: false;
    live_invoice_link: false;
    source: "usage_ledger_event_scaffold";
  };
  channel: UsageQuotaChannel;
  display_fields: readonly [
    "request_id",
    "plan_code",
    "channel",
    "period_start",
    "period_end",
    "credit_limit",
    "credits_used",
    "credits_pending",
    "credits_remaining",
    "freshness_target_minutes"
  ];
  freshness_target_minutes: 5;
  live_ledger_reads: false;
  persistent_writes: false;
  period: {
    period_end: string;
    period_start: string;
  };
  quota: {
    credit_limit: number;
    credits_pending: number;
    credits_remaining: number;
    credits_used: number;
    over_quota: boolean;
    plan_code: UsageQuotaPlanCode;
  };
  request_id: string;
  request_id_visible: true;
  sql_emitted: false;
  status: UsageQuotaDisplayStatus;
  tables: readonly [
    "core.workspace_subscription",
    "core.usage_event",
    "core.usage_ledger_entry",
    "core.usage_reconciliation_batch"
  ];
  usage_snapshot_source: "synthetic_quota_snapshot";
  version: typeof USAGE_QUOTA_DISPLAY_VERSION;
  workspace_id: string;
}

export interface UsageBillingLedgerEntryInput {
  creditDelta: number;
  ledgerEntryId: string;
  requestId: string;
  usageEventId: string;
}

export interface UsageBillingReconciliationPlanInput {
  accountId?: string;
  billingPeriodEnd?: string;
  billingPeriodStart?: string;
  currency?: string;
  invoiceAmountMinor?: number;
  invoiceCredits?: number;
  invoiceId?: string;
  ledgerEntries?: UsageBillingLedgerEntryInput[];
  requestId: string;
  subscriptionId?: string;
  workspaceId?: string;
}

export interface UsageBillingReconciliationPlan {
  account_id?: string;
  billing_provider: {
    calls: false;
    invoice_link_live: false;
    provider: "not_configured";
  };
  consistency: {
    credit_delta: number;
    invoice_credits: number;
    ledger_credits: number;
    status: "matched" | "mismatch";
  };
  currency: string;
  freshness_target_minutes: 5;
  invoice: {
    amount_minor: number;
    invoice_id: string;
    source: "synthetic_billing_snapshot";
    table: "core.subscription_invoice";
  };
  invoice_lines: Array<{
    credit_delta: number;
    invoice_line_id: string;
    ledger_entry_id: string;
    request_id: string;
    table: "core.subscription_invoice_line";
    trace_status: UsageBillingTraceStatus;
    usage_event_id: string;
  }>;
  live_ledger_reads: false;
  persistent_writes: false;
  period: {
    period_end: string;
    period_start: string;
  };
  request_id: string;
  request_id_visible: true;
  sql_emitted: false;
  status: UsageBillingReconciliationStatus;
  subscription_id: string;
  tables: readonly [
    "core.workspace_subscription",
    "core.usage_event",
    "core.usage_ledger_entry",
    "core.usage_reconciliation_batch",
    "core.subscription_invoice",
    "core.subscription_invoice_line"
  ];
  traceability: {
    required_fields: readonly [
      "request_id",
      "usage_event_id",
      "ledger_entry_id",
      "invoice_line_id"
    ];
    support_investigation_by_request_id: true;
    traceable_call_count: number;
    traceable_to_call: boolean;
  };
  version: typeof USAGE_BILLING_RECONCILIATION_VERSION;
  workspace_id: string;
}

export interface HighCostUsageReservationPlanInput {
  estimatedCredits?: number;
  executionStatus?: HighCostUsageExecutionStatus;
  requestId: string;
  subscriptionId?: string;
  taskId?: string;
  toolName?: string;
  userConfirmed?: boolean;
  workspaceId?: string;
}

export interface HighCostUsageReservationPlan {
  double_charge_guard: {
    idempotency_key: string;
    same_request_reuses_reservation: true;
  };
  estimate: {
    credits: number;
    source: "analytics_high_cost_estimate";
  };
  failure_refund: {
    ledger_entry_id: string;
    reason: "system_failure_or_retry";
    refund_credits: number;
    required: true;
    status: "not_triggered" | "planned_no_write";
    table: "core.usage_ledger_entry";
  };
  live_ledger_writes: false;
  persistent_writes: false;
  pre_debit: {
    ledger_entry_id: string;
    pre_debit_credits: number;
    required: true;
    status: "awaiting_confirmation" | "blocked_missing_context" | "planned_no_write";
    table: "core.usage_ledger_entry";
  };
  request_id: string;
  request_id_visible: true;
  reservation: {
    reservation_id: string;
    status: "awaiting_confirmation" | "blocked_missing_context" | "planned_no_write";
    subscription_id: string;
    table: "core.usage_credit_reservation";
    task_id: string;
    tool_name: string;
    workspace_id: string;
  };
  sql_emitted: false;
  status: HighCostUsageReservationStatus;
  tables: readonly [
    "core.workspace_subscription",
    "core.usage_event",
    "core.usage_ledger_entry",
    "core.usage_reconciliation_batch",
    "core.usage_credit_reservation"
  ];
  usage_ledger_link_required: true;
  user_confirmed: boolean;
  version: typeof HIGH_COST_USAGE_RESERVATION_VERSION;
}

const USAGE_BILLING_RECONCILIATION_TABLES: UsageBillingReconciliationPlan["tables"] = [
  "core.workspace_subscription",
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.usage_reconciliation_batch",
  "core.subscription_invoice",
  "core.subscription_invoice_line"
];

const HIGH_COST_USAGE_RESERVATION_TABLES: HighCostUsageReservationPlan["tables"] = [
  "core.workspace_subscription",
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.usage_reconciliation_batch",
  "core.usage_credit_reservation"
];

export function createUsageLedgerEventPlan(
  input: UsageLedgerEventPlanInput
): UsageLedgerEventPlan {
  const operation = input.operation ?? "data_access";
  const workspaceId = input.workspaceId ?? "workspace_unresolved";
  const schemaReady = input.workspaceId !== undefined && input.workspaceId.length > 0;
  const cacheState: UsageLedgerCacheState = input.cached ? "hit" : "miss";
  const usageEventId = createUsageEventId(input.requestId, operation, input.dataset, input.occurredAt);
  const meterRuleId = createMeterRuleId(input.channel, input.dataset, operation);
  const billableState: UsageLedgerBillableState =
    schemaReady && input.errorCode === undefined && input.credits > 0 ? "preview" : "blocked";

  return {
    event: {
      accountId: input.accountId,
      cacheState,
      channel: input.channel,
      dataVersion: input.dataVersion,
      dataset: input.dataset,
      inputUnits: input.inputUnits ?? 0,
      membershipId: input.membershipId,
      meteredFields: input.meteredFields,
      meteredRows: input.meteredRows,
      methodologyVersion: input.methodologyVersion,
      occurredAt: input.occurredAt,
      operation,
      outputUnits: input.outputUnits ?? 0,
      qualityState: input.qualityState,
      requestId: input.requestId,
      rightsPolicyVersion: input.rightsPolicyVersion,
      runId: input.runId,
      sourceRecordId: input.sourceRecordId,
      toolName: input.toolName,
      usageEventId,
      workspaceId
    },
    ledgerEntry: {
      accountId: input.accountId,
      billableState,
      creditDelta: input.credits,
      ledgerEntryId: `usage_ledger_entry_${usageEventId}_${meterRuleId}`,
      meterRuleId,
      sourceRecordId: "usage-ledger-entry-plan",
      subscriptionId: input.subscriptionId,
      usageEventId,
      workspaceId
    },
    reconciliation: {
      creditsTotal: input.credits,
      status: "held",
      targetDelayMinutes: 5
    },
    schemaReady,
    sqlEmitted: false,
    status: schemaReady ? "write_planned" : "write_blocked",
    tables: [
      "core.usage_meter_rule",
      "core.usage_event",
      "core.usage_reconciliation_batch",
      "core.usage_ledger_entry"
    ],
    version: USAGE_LEDGER_EVENT_WRITER_VERSION,
    writeReady: false,
    writeReason: schemaReady ? "LIVE_USAGE_WRITES_DISABLED" : "WORKSPACE_CONTEXT_MISSING"
  };
}

export function getUsageLedgerEventWriterCapabilities() {
  return {
    billable_states: ["preview", "posted", "waived", "reversed", "blocked"] as const,
    default_billable_state: "preview" as const,
    live_billing_reconciliation: false,
    live_writes: false,
    reconciliation_target_delay_minutes: 5,
    sql_emitted: false,
    status: "event_writer_scaffold" as const,
    tables: [
      "core.usage_meter_rule",
      "core.usage_event",
      "core.usage_reconciliation_batch",
      "core.usage_ledger_entry"
    ] as const,
    unit_names: ["call", "row", "field", "credit", "byte", "model_unit"] as const,
    usage_event_grain: "request_operation_dataset_occurred_at" as const,
    version: USAGE_LEDGER_EVENT_WRITER_VERSION,
    weighted_credits: true
  };
}

export function getUsageQuotaDisplayCapabilities() {
  return {
    billing_provider_reconciliation: false,
    channels: USAGE_QUOTA_CHANNELS,
    display_fields: [
      "request_id",
      "plan_code",
      "channel",
      "period_start",
      "period_end",
      "credit_limit",
      "credits_used",
      "credits_pending",
      "credits_remaining",
      "freshness_target_minutes"
    ] as const,
    freshness_target_minutes: 5,
    live_ledger_reads: false,
    persistent_writes: false,
    plan_codes: USAGE_QUOTA_PLAN_CODES,
    request_id_visible: true,
    route: "POST /usage/quota/plan" as const,
    runtime_route: "GET /usage/runtime" as const,
    sql_emitted: false,
    status: "usage_quota_display_scaffold" as const,
    tables: [
      "core.workspace_subscription",
      "core.usage_event",
      "core.usage_ledger_entry",
      "core.usage_reconciliation_batch"
    ] as const,
    version: USAGE_QUOTA_DISPLAY_VERSION
  };
}

export function getUsageBillingReconciliationCapabilities() {
  return {
    billing_provider_calls: false,
    display_fields: [
      "request_id",
      "invoice_id",
      "subscription_id",
      "period_start",
      "period_end",
      "invoice_credits",
      "ledger_credits",
      "credit_delta",
      "traceable_call_count",
      "freshness_target_minutes"
    ] as const,
    freshness_target_minutes: 5,
    live_ledger_reads: false,
    persistent_writes: false,
    request_id_visible: true,
    route: "POST /usage/billing/reconciliation/plan" as const,
    runtime_route: "GET /usage/runtime" as const,
    sql_emitted: false,
    status: "usage_billing_reconciliation_scaffold" as const,
    tables: USAGE_BILLING_RECONCILIATION_TABLES,
    trace_fields: [
      "request_id",
      "usage_event_id",
      "ledger_entry_id",
      "invoice_line_id"
    ] as const,
    version: USAGE_BILLING_RECONCILIATION_VERSION
  };
}

export function getHighCostUsageReservationCapabilities() {
  return {
    failure_refund_required: true,
    live_ledger_writes: false,
    persistent_writes: false,
    pre_debit_required: true,
    request_id_visible: true,
    route: "POST /usage/high-cost/reservation/plan" as const,
    runtime_route: "GET /usage/runtime" as const,
    sql_emitted: false,
    status: "high_cost_usage_reservation_scaffold" as const,
    tables: HIGH_COST_USAGE_RESERVATION_TABLES,
    usage_ledger_link_required: true,
    version: HIGH_COST_USAGE_RESERVATION_VERSION
  };
}

export function createUsageQuotaDisplayPlan(
  input: UsageQuotaDisplayPlanInput
): UsageQuotaDisplayPlan {
  const channel = input.channel ?? "web_agent";
  const planCode = input.planCode ?? "free";
  const workspaceId = input.workspaceId ?? "workspace_unresolved";
  const creditLimit = getPlanCreditLimit(planCode);
  const creditsUsed = normalizeCreditCount(input.usedCredits);
  const creditsPending = normalizeCreditCount(input.pendingCredits);
  const creditsRemaining = Math.max(0, creditLimit - creditsUsed - creditsPending);
  const periodStart = input.periodStart ?? "current_billing_period_start";
  const periodEnd = input.periodEnd ?? "current_billing_period_end";

  return {
    account_id: input.accountId,
    billing_traceability: {
      billing_provider_reconciliation: false,
      live_invoice_link: false,
      source: "usage_ledger_event_scaffold"
    },
    channel,
    display_fields: [
      "request_id",
      "plan_code",
      "channel",
      "period_start",
      "period_end",
      "credit_limit",
      "credits_used",
      "credits_pending",
      "credits_remaining",
      "freshness_target_minutes"
    ],
    freshness_target_minutes: 5,
    live_ledger_reads: false,
    persistent_writes: false,
    period: {
      period_end: periodEnd,
      period_start: periodStart
    },
    quota: {
      credit_limit: creditLimit,
      credits_pending: creditsPending,
      credits_remaining: creditsRemaining,
      credits_used: creditsUsed,
      over_quota: creditsUsed + creditsPending > creditLimit,
      plan_code: planCode
    },
    request_id: input.requestId,
    request_id_visible: true,
    sql_emitted: false,
    status:
      input.workspaceId !== undefined && input.workspaceId.length > 0
        ? "planned_no_write"
        : "blocked_missing_workspace",
    tables: [
      "core.workspace_subscription",
      "core.usage_event",
      "core.usage_ledger_entry",
      "core.usage_reconciliation_batch"
    ],
    usage_snapshot_source: "synthetic_quota_snapshot",
    version: USAGE_QUOTA_DISPLAY_VERSION,
    workspace_id: workspaceId
  };
}

export function createHighCostUsageReservationPlan(
  input: HighCostUsageReservationPlanInput
): HighCostUsageReservationPlan {
  const estimatedCredits = normalizeCreditCount(input.estimatedCredits);
  const workspaceId = input.workspaceId ?? "workspace_unresolved";
  const subscriptionId = input.subscriptionId ?? `subscription_${sanitizeId(workspaceId)}`;
  const toolName = input.toolName ?? "tool_unresolved";
  const taskId = input.taskId ?? `task_${sanitizeId(input.requestId)}_${sanitizeId(toolName)}`;
  const userConfirmed = input.userConfirmed === true;
  const requiredContextPresent =
    input.workspaceId !== undefined &&
    input.workspaceId.length > 0 &&
    input.subscriptionId !== undefined &&
    input.subscriptionId.length > 0 &&
    input.taskId !== undefined &&
    input.taskId.length > 0 &&
    input.toolName !== undefined &&
    input.toolName.length > 0 &&
    estimatedCredits > 0;
  const status: HighCostUsageReservationStatus = userConfirmed
    ? requiredContextPresent
      ? "planned_no_write"
      : "blocked_missing_context"
    : "confirmation_required";
  const reservationStatus =
    status === "planned_no_write"
      ? "planned_no_write"
      : status === "confirmation_required"
        ? "awaiting_confirmation"
        : "blocked_missing_context";
  const idempotencyKey = `high_cost_usage_${sanitizeId(input.requestId)}_${sanitizeId(taskId)}`;
  const reservationId = `usage_reservation_${sanitizeId(input.requestId)}_${sanitizeId(taskId)}`;
  const preDebitLedgerEntryId = `usage_pre_debit_${reservationId}`;
  const refundLedgerEntryId = `usage_refund_${reservationId}`;
  const refundTriggered = input.executionStatus === "failed" && userConfirmed;

  return {
    double_charge_guard: {
      idempotency_key: idempotencyKey,
      same_request_reuses_reservation: true
    },
    estimate: {
      credits: estimatedCredits,
      source: "analytics_high_cost_estimate"
    },
    failure_refund: {
      ledger_entry_id: refundLedgerEntryId,
      reason: "system_failure_or_retry",
      refund_credits: refundTriggered ? estimatedCredits : 0,
      required: true,
      status: refundTriggered ? "planned_no_write" : "not_triggered",
      table: "core.usage_ledger_entry"
    },
    live_ledger_writes: false,
    persistent_writes: false,
    pre_debit: {
      ledger_entry_id: preDebitLedgerEntryId,
      pre_debit_credits: status === "planned_no_write" ? estimatedCredits : 0,
      required: true,
      status:
        status === "planned_no_write"
          ? "planned_no_write"
          : status === "confirmation_required"
            ? "awaiting_confirmation"
            : "blocked_missing_context",
      table: "core.usage_ledger_entry"
    },
    request_id: input.requestId,
    request_id_visible: true,
    reservation: {
      reservation_id: reservationId,
      status: reservationStatus,
      subscription_id: subscriptionId,
      table: "core.usage_credit_reservation",
      task_id: taskId,
      tool_name: toolName,
      workspace_id: workspaceId
    },
    sql_emitted: false,
    status,
    tables: HIGH_COST_USAGE_RESERVATION_TABLES,
    usage_ledger_link_required: true,
    user_confirmed: userConfirmed,
    version: HIGH_COST_USAGE_RESERVATION_VERSION
  };
}

export function createUsageBillingReconciliationPlan(
  input: UsageBillingReconciliationPlanInput
): UsageBillingReconciliationPlan {
  const workspaceId = input.workspaceId ?? "workspace_unresolved";
  const subscriptionId = input.subscriptionId ?? `subscription_${sanitizeId(workspaceId)}`;
  const invoiceId = input.invoiceId ?? `invoice_${sanitizeId(input.requestId)}`;
  const ledgerEntries = input.ledgerEntries ?? [];
  const ledgerCredits = ledgerEntries.reduce(
    (total, entry) => total + normalizeCreditCount(entry.creditDelta),
    0
  );
  const invoiceCredits = normalizeInvoiceCredits(input.invoiceCredits, ledgerCredits);
  const creditDelta = invoiceCredits - ledgerCredits;
  const traceableCallCount = ledgerEntries.filter(isTraceableLedgerEntry).length;
  const requiredContextPresent =
    input.workspaceId !== undefined &&
    input.workspaceId.length > 0 &&
    input.subscriptionId !== undefined &&
    input.subscriptionId.length > 0 &&
    input.invoiceId !== undefined &&
    input.invoiceId.length > 0 &&
    input.billingPeriodStart !== undefined &&
    input.billingPeriodStart.length > 0 &&
    input.billingPeriodEnd !== undefined &&
    input.billingPeriodEnd.length > 0 &&
    ledgerEntries.length > 0 &&
    traceableCallCount === ledgerEntries.length;

  return {
    account_id: input.accountId,
    billing_provider: {
      calls: false,
      invoice_link_live: false,
      provider: "not_configured"
    },
    consistency: {
      credit_delta: creditDelta,
      invoice_credits: invoiceCredits,
      ledger_credits: ledgerCredits,
      status: creditDelta === 0 ? "matched" : "mismatch"
    },
    currency: input.currency ?? "HKD",
    freshness_target_minutes: 5,
    invoice: {
      amount_minor: normalizeAmountMinor(input.invoiceAmountMinor),
      invoice_id: invoiceId,
      source: "synthetic_billing_snapshot",
      table: "core.subscription_invoice"
    },
    invoice_lines: ledgerEntries.map((entry, index) => ({
      credit_delta: normalizeCreditCount(entry.creditDelta),
      invoice_line_id: `invoice_line_${sanitizeId(invoiceId)}_${index + 1}_${sanitizeId(
        entry.ledgerEntryId
      )}`,
      ledger_entry_id: entry.ledgerEntryId,
      request_id: entry.requestId,
      table: "core.subscription_invoice_line",
      trace_status: isTraceableLedgerEntry(entry) ? "traceable" : "mismatch",
      usage_event_id: entry.usageEventId
    })),
    live_ledger_reads: false,
    persistent_writes: false,
    period: {
      period_end: input.billingPeriodEnd ?? "billing_period_end_unresolved",
      period_start: input.billingPeriodStart ?? "billing_period_start_unresolved"
    },
    request_id: input.requestId,
    request_id_visible: true,
    sql_emitted: false,
    status: requiredContextPresent ? "planned_no_write" : "blocked_missing_context",
    subscription_id: subscriptionId,
    tables: USAGE_BILLING_RECONCILIATION_TABLES,
    traceability: {
      required_fields: [
        "request_id",
        "usage_event_id",
        "ledger_entry_id",
        "invoice_line_id"
      ],
      support_investigation_by_request_id: true,
      traceable_call_count: traceableCallCount,
      traceable_to_call: ledgerEntries.length > 0 && traceableCallCount === ledgerEntries.length
    },
    version: USAGE_BILLING_RECONCILIATION_VERSION,
    workspace_id: workspaceId
  };
}

function createUsageEventId(
  requestId: string,
  operation: UsageLedgerOperation,
  dataset: string,
  occurredAt: string
): string {
  return `usage_event_${sanitizeId(requestId)}_${operation}_${sanitizeId(dataset)}_${sanitizeId(occurredAt)}`;
}

function createMeterRuleId(
  channel: UsageLedgerChannel,
  dataset: string,
  operation: UsageLedgerOperation
): string {
  return `meter_${channel}_${sanitizeId(dataset)}_${operation}_credit`;
}

function sanitizeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unset";
}

function getPlanCreditLimit(planCode: UsageQuotaPlanCode): number {
  const limits: Record<UsageQuotaPlanCode, number> = {
    developer: 10000,
    enterprise: 100000,
    free: 100,
    plus: 1000,
    pro: 5000,
    team: 25000
  };

  return limits[planCode];
}

function normalizeCreditCount(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function normalizeInvoiceCredits(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function normalizeAmountMinor(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function isTraceableLedgerEntry(entry: UsageBillingLedgerEntryInput): boolean {
  return (
    entry.requestId.length > 0 &&
    entry.usageEventId.length > 0 &&
    entry.ledgerEntryId.length > 0
  );
}
