export const USAGE_LEDGER_EVENT_WRITER_VERSION =
  "2026-06-20.phase1.usage-event-writer-scaffold.v0";

export type UsageLedgerBillableState = "blocked" | "posted" | "preview" | "reversed" | "waived";
export type UsageLedgerCacheState = "hit" | "miss" | "not_applicable";
export type UsageLedgerChannel = "api" | "export" | "mcp" | "web";
export type UsageLedgerOperation =
  | "agent_run"
  | "data_access"
  | "eval_run"
  | "export"
  | "tool_call";
export type UsageLedgerQualityState = "HOLD" | "PASS" | "REJECT_RAW" | "WARN";
export type UsageLedgerWriterStatus = "write_blocked" | "write_planned";

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
