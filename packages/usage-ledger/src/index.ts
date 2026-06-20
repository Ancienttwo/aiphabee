export const USAGE_LEDGER_EVENT_WRITER_VERSION =
  "2026-06-20.phase1.usage-event-writer-scaffold.v0";
export const USAGE_QUOTA_DISPLAY_VERSION =
  "2026-06-21.phase1.usage-quota-display-scaffold.v0";

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
