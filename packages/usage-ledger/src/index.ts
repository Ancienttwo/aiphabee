import {
  createSubscriptionLifecyclePlan,
  getPackagePricingCapabilities,
  getPackagePricingCatalog,
  getSubscriptionLifecycleCapabilities,
  type PackagePricingCapabilities,
  type PackagePricingCatalog,
  type SubscriptionLifecycleCapabilities,
  type SubscriptionLifecyclePlan
} from "@aiphabee/account-runtime";
import {
  createSupportRequestIdInvestigationPlan,
  getSupportHelpCenter,
  getSupportOperationsCapabilities,
  type SupportOperationsCapabilities,
  type SupportRequestIdInvestigationPlan
} from "@aiphabee/support-ops";

export const USAGE_LEDGER_EVENT_WRITER_VERSION =
  "2026-06-20.phase1.usage-event-writer-scaffold.v0";
export const USAGE_QUOTA_DISPLAY_VERSION =
  "2026-06-21.phase1.usage-quota-display-scaffold.v0";
export const USAGE_BILLING_RECONCILIATION_VERSION =
  "2026-06-21.phase2.usage-billing-reconciliation-scaffold.v0";
export const HIGH_COST_USAGE_RESERVATION_VERSION =
  "2026-06-21.phase2.high-cost-usage-reservation-scaffold.v0";
export const PARTNER_RECONCILIATION_REPORT_VERSION =
  "2026-06-21.phase3.partner-reconciliation-report-scaffold.v0";
export const BILLING_RULES_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.billing-rules-release-gate-scaffold.v0";
export const PARTNER_SUPPORT_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.partner-support-release-gate-scaffold.v0";
export const PARTNER_SLA_RECONCILIATION_READINESS_VERSION =
  "2026-06-22.phase3.partner-sla-reconciliation-readiness.v0";

export const USAGE_QUOTA_CHANNELS = ["web_agent", "mcp"] as const;
export const USAGE_QUOTA_PLAN_CODES = [
  "free",
  "plus",
  "pro",
  "developer",
  "team",
  "enterprise"
] as const;
export const PARTNER_RECONCILIATION_REPORT_FORMATS = ["csv", "json"] as const;
export const PARTNER_RECONCILIATION_REPORT_CADENCES = ["daily", "weekly"] as const;
export const PARTNER_RECONCILIATION_REPORT_GROUP_BY = [
  "dataset",
  "channel",
  "package_code",
  "user_id"
] as const;
export const BILLING_RULES_RELEASE_GATE_CHECKS = [
  "package_credit_overage_rules_documented",
  "weighted_credit_model_referenced",
  "refund_and_proration_rules_blocked_without_provider_preview",
  "invoice_credits_match_usage_ledger_credits",
  "request_id_trace_links_invoice_ledger_usage_event",
  "high_cost_pre_debit_and_failure_refund_planned"
] as const;
export const BILLING_RULES_RELEASE_GATE_TABLES = [
  "core.billing_rules_release_gate",
  "audit.billing_rules_drill_event",
  "governance.billing_rules_release_gate_contract"
] as const;
export const PARTNER_SUPPORT_RELEASE_GATE_CHECKS = [
  "partner_report_generated",
  "partner_report_trace_links_request_id_and_usage_event",
  "partner_report_sla_counters_present",
  "support_request_id_investigation_metadata_only",
  "sensitive_payloads_excluded",
  "live_artifact_and_log_reads_blocked"
] as const;
export const PARTNER_SLA_RECONCILIATION_READINESS_CHECKS = [
  "daily_report_generated",
  "weekly_report_generated",
  "sla_counters_cover_delay_missing_error_backfill",
  "request_usage_trace_complete",
  "partner_support_release_gate_passed",
  "live_surfaces_blocked",
  "sensitive_payloads_excluded"
] as const;
export const PARTNER_SUPPORT_RELEASE_GATE_TABLES = [
  "core.partner_support_release_gate",
  "audit.partner_support_drill_event",
  "governance.partner_support_release_gate_contract"
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
export type PartnerReconciliationReportCadence =
  (typeof PARTNER_RECONCILIATION_REPORT_CADENCES)[number];
export type PartnerReconciliationReportFormat =
  (typeof PARTNER_RECONCILIATION_REPORT_FORMATS)[number];
export type PartnerReconciliationReportStatus =
  | "blocked_empty_usage"
  | "blocked_missing_context"
  | "planned_no_write";
export type PartnerReconciliationSlaStatus = "exception" | "ok";
export type UsageQuotaDisplayStatus = "blocked_missing_workspace" | "planned_no_write";
export type BillingRulesReleaseGateCheckId =
  (typeof BILLING_RULES_RELEASE_GATE_CHECKS)[number];
export type PartnerSupportReleaseGateCheckId =
  (typeof PARTNER_SUPPORT_RELEASE_GATE_CHECKS)[number];
export type PartnerSlaReconciliationReadinessCheckId =
  (typeof PARTNER_SLA_RECONCILIATION_READINESS_CHECKS)[number];

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

export interface PartnerReconciliationUsageRowInput {
  backfillCount?: number;
  channel?: UsageLedgerChannel;
  credits?: number;
  dataDelayMinutes?: number;
  dataset?: string;
  errorCount?: number;
  meteredRows?: number;
  missingRows?: number;
  packageCode?: UsageQuotaPlanCode;
  requestId?: string;
  usageCount?: number;
  usageEventId?: string;
  userId?: string;
}

export interface PartnerReconciliationReportPlanInput {
  cadence?: PartnerReconciliationReportCadence;
  format?: PartnerReconciliationReportFormat;
  partnerId?: string;
  periodEnd?: string;
  periodStart?: string;
  requestId: string;
  usageRows?: PartnerReconciliationUsageRowInput[];
  workspaceId?: string;
}

export interface PartnerReconciliationReportPlan {
  audit: {
    audit_event: "usage.partner_reconciliation.plan";
    audit_event_id: string;
    table: "audit.partner_reconciliation_event";
    write_status: "blocked_no_rows" | "planned_no_write";
  };
  billing_provider_calls: false;
  export: {
    artifact_writes: false;
    raw_payment_identifiers_included: false;
    raw_personal_contact_included: false;
    selected_format: PartnerReconciliationReportFormat;
    supported_formats: typeof PARTNER_RECONCILIATION_REPORT_FORMATS;
  };
  frontend: false;
  live_ledger_reads: false;
  partner_id: string;
  period: {
    cadence: PartnerReconciliationReportCadence;
    period_end: string;
    period_start: string;
  };
  persistent_writes: false;
  privacy: {
    credential_material_included: false;
    raw_email_included: false;
    raw_payment_identifier_included: false;
    user_identifier_policy: "user_id_or_account_id_only";
  };
  report: {
    columns: readonly [
      "dataset",
      "channel",
      "package_code",
      "user_id",
      "usage_count",
      "credits",
      "metered_rows",
      "request_ids",
      "usage_event_ids",
      "data_delay_minutes_max",
      "missing_rows",
      "error_count",
      "backfill_count",
      "sla_status"
    ];
    export_status: "blocked_no_rows" | "planned_no_write";
    group_by: typeof PARTNER_RECONCILIATION_REPORT_GROUP_BY;
    report_id: string;
    source: "usage_ledger_snapshot";
    table: "core.partner_reconciliation_report";
  };
  request_id: string;
  request_id_visible: true;
  rows: Array<{
    backfill_count: number;
    channel: UsageLedgerChannel;
    credits: number;
    data_delay_minutes_max: number;
    dataset: string;
    error_count: number;
    line_id: string;
    metered_rows: number;
    missing_rows: number;
    package_code: UsageQuotaPlanCode;
    request_ids: string[];
    sla_status: PartnerReconciliationSlaStatus;
    table: "core.partner_reconciliation_report_line";
    usage_count: number;
    usage_event_ids: string[];
    user_id: string;
  }>;
  sla: {
    daily_weekly_report: true;
    required_fields: readonly [
      "data_delay_minutes",
      "missing_rows",
      "error_count",
      "backfill_count"
    ];
    status: "attention_required" | "blocked_no_rows" | "ok";
  };
  sql_emitted: false;
  status: PartnerReconciliationReportStatus;
  summary: {
    backfill_count: number;
    credit_total: number;
    dataset_count: number;
    delayed_line_count: number;
    error_count: number;
    line_count: number;
    metered_row_total: number;
    missing_rows: number;
    usage_count_total: number;
    user_count: number;
  };
  tables: readonly [
    "core.workspace",
    "core.usage_event",
    "core.usage_ledger_entry",
    "core.partner_reconciliation_report",
    "core.partner_reconciliation_report_line",
    "audit.partner_reconciliation_event",
    "governance.partner_reconciliation_contract"
  ];
  traceability: {
    required_fields: readonly [
      "request_id",
      "usage_event_id",
      "dataset",
      "channel",
      "package_code",
      "user_id"
    ];
    traceable_to_usage_ledger: boolean;
    traceable_usage_event_count: number;
  };
  version: typeof PARTNER_RECONCILIATION_REPORT_VERSION;
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

export interface BillingRulesReleaseGateCapabilities {
  account_package_route: "GET /account/package-pricing";
  billing_provider_calls: false;
  billing_reconciliation_route: "POST /usage/billing/reconciliation/plan";
  frontend: false;
  high_cost_reservation_route: "POST /usage/high-cost/reservation/plan";
  invoice_writes: false;
  live_billing_provider: false;
  live_ledger_reads: false;
  live_ledger_writes: false;
  package: "@aiphabee/usage-ledger";
  persistent_writes: false;
  quota_route: "POST /usage/quota/plan";
  required_checks: typeof BILLING_RULES_RELEASE_GATE_CHECKS;
  route: "POST /usage/release-gates/billing-rules/plan";
  runtime_route: "GET /usage/runtime";
  sql_emitted: false;
  status: "billing_rules_release_gate_scaffold";
  subscription_route: "POST /account/subscription/lifecycle/plan";
  tables: typeof BILLING_RULES_RELEASE_GATE_TABLES;
  version: typeof BILLING_RULES_RELEASE_GATE_VERSION;
}

export interface BillingRulesReleaseGatePlanInput {
  accountId?: string;
  billingPeriodEnd?: string;
  billingPeriodStart?: string;
  invoiceId?: string;
  planCode?: UsageQuotaPlanCode;
  requestId: string;
  subscriptionId?: string;
  workspaceId?: string;
}

export interface BillingRulesReleaseGatePlan {
  account_id?: string;
  billing_reconciliation_gate: {
    capability: ReturnType<typeof getUsageBillingReconciliationCapabilities>;
    plan: UsageBillingReconciliationPlan;
  };
  capability: BillingRulesReleaseGateCapabilities;
  frontend: false;
  high_cost_gate: {
    capability: ReturnType<typeof getHighCostUsageReservationCapabilities>;
    failed_refund_plan: HighCostUsageReservationPlan;
    reservation_plan: HighCostUsageReservationPlan;
  };
  live_billing_provider: false;
  live_invoice_writes: false;
  live_ledger_reads: false;
  live_ledger_writes: false;
  package_rules: {
    currency: "HKD";
    developer_credit_limit: number;
    developer_overage_enabled: boolean;
    package_capability: PackagePricingCapabilities;
    plan_count: number;
    pricing_catalog: PackagePricingCatalog;
    pro_credit_limit: number;
    validation_assumption_not_final_quote: true;
    weighted_credit_model_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.3";
  };
  persistent_writes: false;
  quota_gate: {
    capability: ReturnType<typeof getUsageQuotaDisplayCapabilities>;
    plan: UsageQuotaDisplayPlan;
  };
  release_checks: Array<{
    check_id: BillingRulesReleaseGateCheckId;
    evidence: string;
    status: "blocked" | "pass";
  }>;
  release_gate: {
    blockers: readonly [
      "final_commercial_quote_missing",
      "live_billing_provider_missing",
      "live_usage_ledger_reads_missing",
      "live_invoice_write_missing",
      "frontend_billing_ui_missing"
    ];
    external_signoff_required: true;
    signoffs: readonly ["billing", "finance", "data-rights", "support", "ops"];
    status: "blocked_live_billing_rules_validation";
  };
  request_id: string;
  sql_emitted: false;
  status: "planned_no_write";
  subscription_rules: {
    billing_provider_calls: false;
    lifecycle_plan: SubscriptionLifecyclePlan;
    proration_preview_live: false;
    refund_preview_live: false;
    subscription_capability: SubscriptionLifecycleCapabilities;
  };
  tables: typeof BILLING_RULES_RELEASE_GATE_TABLES;
  validation: {
    all_checks_passed: boolean;
    high_cost_pre_debit_and_failure_refund_planned: boolean;
    invoice_credits_match_usage_ledger_credits: boolean;
    live_release_claimed: false;
    package_credit_overage_rules_documented: boolean;
    refund_and_proration_rules_blocked_without_provider_preview: boolean;
    request_id_trace_links_invoice_ledger_usage_event: boolean;
    weighted_credit_model_referenced: boolean;
  };
  version: typeof BILLING_RULES_RELEASE_GATE_VERSION;
  workspace_id: string;
}

export interface PartnerSupportReleaseGateCapabilities {
  billing_provider_calls: false;
  frontend: false;
  live_ledger_reads: false;
  live_partner_report_artifact_store: false;
  live_support_log_reads: false;
  package: "@aiphabee/usage-ledger";
  partner_portal_delivery: false;
  partner_reconciliation_route: "POST /usage/partner-reconciliation/plan";
  persistent_writes: false;
  request_id_drill_required: true;
  required_checks: typeof PARTNER_SUPPORT_RELEASE_GATE_CHECKS;
  route: "POST /usage/release-gates/partner-support/plan";
  runtime_route: "GET /usage/runtime";
  sql_emitted: false;
  status: "partner_support_release_gate_scaffold";
  support_help_center_route: "GET /support/help-center";
  support_investigation_route: "POST /support/request-id-investigation/plan";
  support_runtime_route: "GET /support/runtime";
  tables: typeof PARTNER_SUPPORT_RELEASE_GATE_TABLES;
  version: typeof PARTNER_SUPPORT_RELEASE_GATE_VERSION;
}

export interface PartnerSupportReleaseGatePlanInput {
  partnerId?: string;
  periodEnd?: string;
  periodStart?: string;
  requestId: string;
  supportAgentId?: string;
  targetRequestId?: string;
  workspaceId?: string;
}

export interface PartnerSupportReleaseGatePlan {
  capability: PartnerSupportReleaseGateCapabilities;
  frontend: false;
  live_ledger_reads: false;
  live_partner_report_artifact_store: false;
  live_support_log_reads: false;
  ops_drill: {
    partner_report_id: string;
    request_ids_available: string[];
    support_ticket_ref: string;
    target_request_id: string;
    usage_event_ids_available: string[];
  };
  partner_portal_delivery: false;
  partner_reconciliation_gate: {
    capability: ReturnType<typeof getPartnerReconciliationReportCapabilities>;
    plan: PartnerReconciliationReportPlan;
  };
  persistent_writes: false;
  release_checks: Array<{
    check_id: PartnerSupportReleaseGateCheckId;
    evidence: string;
    status: "blocked" | "pass";
  }>;
  release_gate: {
    blockers: readonly [
      "live_usage_ledger_reads_missing",
      "live_partner_report_artifact_store_missing",
      "partner_portal_delivery_missing",
      "live_support_log_reads_missing",
      "frontend_ops_ui_missing",
      "final_partner_settlement_approval_missing"
    ];
    external_signoff_required: true;
    signoffs: readonly ["data-partner", "support", "billing", "ops", "compliance"];
    status: "blocked_live_partner_support_validation";
  };
  request_id: string;
  sql_emitted: false;
  status: "planned_no_write";
  support_investigation_gate: {
    capability: SupportOperationsCapabilities;
    help_center: ReturnType<typeof getSupportHelpCenter>;
    plan: SupportRequestIdInvestigationPlan;
  };
  tables: typeof PARTNER_SUPPORT_RELEASE_GATE_TABLES;
  validation: {
    all_checks_passed: boolean;
    live_artifact_and_log_reads_blocked: boolean;
    live_release_claimed: false;
    partner_report_generated: boolean;
    partner_report_sla_counters_present: boolean;
    partner_report_trace_links_request_id_and_usage_event: boolean;
    sensitive_payloads_excluded: boolean;
    support_request_id_investigation_metadata_only: boolean;
  };
  version: typeof PARTNER_SUPPORT_RELEASE_GATE_VERSION;
  workspace_id: string;
}

export interface PartnerSlaReconciliationReadinessCapabilities {
  frontend: false;
  group_by: typeof PARTNER_RECONCILIATION_REPORT_GROUP_BY;
  live_ledger_reads: false;
  live_partner_report_artifact_store: false;
  live_support_log_reads: false;
  package: "@aiphabee/usage-ledger";
  partner_portal_delivery: false;
  partner_reconciliation_route: "POST /usage/partner-reconciliation/plan";
  partner_support_release_gate_route: "POST /usage/release-gates/partner-support/plan";
  persistent_writes: false;
  required_checks: typeof PARTNER_SLA_RECONCILIATION_READINESS_CHECKS;
  required_sla_fields: readonly [
    "data_delay_minutes",
    "missing_rows",
    "error_count",
    "backfill_count"
  ];
  route: "GET /usage/partner-sla/reconciliation-readiness";
  runtime_route: "GET /usage/runtime";
  sql_emitted: false;
  status: "partner_sla_reconciliation_readiness_scaffold";
  supported_cadences: typeof PARTNER_RECONCILIATION_REPORT_CADENCES;
  trace_fields: readonly [
    "request_id",
    "usage_event_id",
    "dataset",
    "channel",
    "package_code",
    "user_id"
  ];
  version: typeof PARTNER_SLA_RECONCILIATION_READINESS_VERSION;
}

export interface PartnerSlaReconciliationReadinessReport {
  capability: PartnerSlaReconciliationReadinessCapabilities;
  daily_report: PartnerReconciliationReportPlan;
  frontend: false;
  live_ledger_reads: false;
  live_partner_report_artifact_store: false;
  live_support_log_reads: false;
  partner_portal_delivery: false;
  persistent_writes: false;
  readiness: {
    all_checks_passed: boolean;
    daily_report_generated: boolean;
    live_release_claimed: false;
    live_surfaces_blocked: boolean;
    partner_support_release_gate_passed: boolean;
    request_usage_trace_complete: boolean;
    sensitive_payloads_excluded: boolean;
    sla_counters_cover_delay_missing_error_backfill: boolean;
    weekly_report_generated: boolean;
  };
  release_checks: Array<{
    check_id: PartnerSlaReconciliationReadinessCheckId;
    evidence: string;
    status: "blocked" | "pass";
  }>;
  release_gate: {
    blockers: readonly [
      "live_usage_ledger_reads_missing",
      "live_partner_report_artifact_store_missing",
      "partner_portal_delivery_missing",
      "final_partner_settlement_approval_missing"
    ];
    status: "blocked_live_partner_sla_reconciliation";
  };
  request_id: string;
  sla_summary: {
    backfill_count: number;
    daily_line_count: number;
    delayed_line_count: number;
    error_count: number;
    missing_rows: number;
    weekly_line_count: number;
  };
  sql_emitted: false;
  status: "partner_sla_reconciliation_readiness_passed";
  support_release_gate: PartnerSupportReleaseGatePlan;
  tables: readonly string[];
  usage_fixture_rows: PartnerReconciliationUsageRowInput[];
  version: typeof PARTNER_SLA_RECONCILIATION_READINESS_VERSION;
  weekly_report: PartnerReconciliationReportPlan;
  workspace_id: string;
}

const USAGE_BILLING_RECONCILIATION_TABLES: UsageBillingReconciliationPlan["tables"] = [
  "core.workspace_subscription",
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.usage_reconciliation_batch",
  "core.subscription_invoice",
  "core.subscription_invoice_line"
];

const PARTNER_RECONCILIATION_REPORT_TABLES: PartnerReconciliationReportPlan["tables"] = [
  "core.workspace",
  "core.usage_event",
  "core.usage_ledger_entry",
  "core.partner_reconciliation_report",
  "core.partner_reconciliation_report_line",
  "audit.partner_reconciliation_event",
  "governance.partner_reconciliation_contract"
];

const PARTNER_SLA_RECONCILIATION_READINESS_TABLES = [
  ...PARTNER_RECONCILIATION_REPORT_TABLES,
  ...PARTNER_SUPPORT_RELEASE_GATE_TABLES
] as const;

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

export function getPartnerReconciliationReportCapabilities() {
  return {
    billing_provider_calls: false,
    display_fields: [
      "dataset",
      "channel",
      "package_code",
      "user_id",
      "usage_count",
      "credits",
      "metered_rows",
      "data_delay_minutes_max",
      "missing_rows",
      "error_count",
      "backfill_count",
      "request_ids"
    ] as const,
    export_formats: PARTNER_RECONCILIATION_REPORT_FORMATS,
    frontend: false,
    group_by: PARTNER_RECONCILIATION_REPORT_GROUP_BY,
    live_ledger_reads: false,
    partner_sla_report: true,
    persistent_writes: false,
    raw_personal_contact_included: false,
    request_id_visible: true,
    route: "POST /usage/partner-reconciliation/plan" as const,
    runtime_route: "GET /usage/runtime" as const,
    sql_emitted: false,
    status: "partner_reconciliation_report_scaffold" as const,
    supported_cadences: PARTNER_RECONCILIATION_REPORT_CADENCES,
    tables: PARTNER_RECONCILIATION_REPORT_TABLES,
    trace_fields: [
      "request_id",
      "usage_event_id",
      "dataset",
      "channel",
      "package_code",
      "user_id"
    ] as const,
    version: PARTNER_RECONCILIATION_REPORT_VERSION
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

export function getBillingRulesReleaseGateCapabilities(): BillingRulesReleaseGateCapabilities {
  return {
    account_package_route: "GET /account/package-pricing",
    billing_provider_calls: false,
    billing_reconciliation_route: "POST /usage/billing/reconciliation/plan",
    frontend: false,
    high_cost_reservation_route: "POST /usage/high-cost/reservation/plan",
    invoice_writes: false,
    live_billing_provider: false,
    live_ledger_reads: false,
    live_ledger_writes: false,
    package: "@aiphabee/usage-ledger",
    persistent_writes: false,
    quota_route: "POST /usage/quota/plan",
    required_checks: BILLING_RULES_RELEASE_GATE_CHECKS,
    route: "POST /usage/release-gates/billing-rules/plan",
    runtime_route: "GET /usage/runtime",
    sql_emitted: false,
    status: "billing_rules_release_gate_scaffold",
    subscription_route: "POST /account/subscription/lifecycle/plan",
    tables: BILLING_RULES_RELEASE_GATE_TABLES,
    version: BILLING_RULES_RELEASE_GATE_VERSION
  };
}

export function createBillingRulesReleaseGatePlan(
  input: BillingRulesReleaseGatePlanInput
): BillingRulesReleaseGatePlan {
  const pricingCatalog = getPackagePricingCatalog();
  const packageCapability = getPackagePricingCapabilities();
  const subscriptionCapability = getSubscriptionLifecycleCapabilities();
  const eventWriterCapability = getUsageLedgerEventWriterCapabilities();
  const proPlan = pricingCatalog.plans.find((plan) => plan.plan_code === "pro");
  const developerPlan = pricingCatalog.plans.find((plan) => plan.plan_code === "developer");
  const planCode = input.planCode ?? "developer";
  const selectedPackagePlan =
    pricingCatalog.plans.find((plan) => plan.plan_code === planCode) ?? developerPlan ?? proPlan;
  const requestId = input.requestId;
  const workspaceId = normalizeIdentifier(input.workspaceId, "workspace_billing_rules");
  const accountId = input.accountId;
  const subscriptionId = normalizeIdentifier(
    input.subscriptionId,
    `sub_${sanitizeId(workspaceId)}_${planCode}`
  );
  const billingPeriodStart = normalizeIdentifier(
    input.billingPeriodStart,
    "2026-06-01T00:00:00.000Z"
  );
  const billingPeriodEnd = normalizeIdentifier(
    input.billingPeriodEnd,
    "2026-07-01T00:00:00.000Z"
  );
  const invoiceId = normalizeIdentifier(input.invoiceId, `invoice_${sanitizeId(requestId)}`);
  const ledgerEntries: UsageBillingLedgerEntryInput[] = [
    {
      creditDelta: 500,
      ledgerEntryId: `usage_ledger_entry_${sanitizeId(requestId)}_base`,
      requestId: `${requestId}:base-usage`,
      usageEventId: `usage_event_${sanitizeId(requestId)}_base`
    },
    {
      creditDelta: 140,
      ledgerEntryId: `usage_ledger_entry_${sanitizeId(requestId)}_high_cost`,
      requestId: `${requestId}:high-cost-usage`,
      usageEventId: `usage_event_${sanitizeId(requestId)}_high_cost`
    }
  ];
  const invoiceCredits = ledgerEntries.reduce(
    (total, entry) => total + normalizeCreditCount(entry.creditDelta),
    0
  );
  const quotaPlan = createUsageQuotaDisplayPlan({
    accountId,
    channel: "mcp",
    pendingCredits: 50,
    periodEnd: billingPeriodEnd,
    periodStart: billingPeriodStart,
    planCode,
    requestId: `${requestId}:quota`,
    usedCredits: invoiceCredits,
    workspaceId
  });
  const billingPlan = createUsageBillingReconciliationPlan({
    accountId,
    billingPeriodEnd,
    billingPeriodStart,
    currency: pricingCatalog.currency,
    invoiceAmountMinor: selectedPackagePlan?.amount_minor,
    invoiceCredits,
    invoiceId,
    ledgerEntries,
    requestId: `${requestId}:billing-reconciliation`,
    subscriptionId,
    workspaceId
  });
  const lifecyclePlan = createSubscriptionLifecyclePlan({
    accountId,
    action: "renew",
    currentBillingState: "active",
    currentPlanCode: planCode,
    effectiveAt: billingPeriodStart,
    reason: "release_gate_billing_rules_drill",
    renewalPeriodEnd: billingPeriodEnd,
    requestId: `${requestId}:subscription-renewal`,
    subscriptionId,
    targetPlanCode: planCode,
    workspaceId
  });
  const highCostTaskId = `task_${sanitizeId(requestId)}_event_study`;
  const highCostRequestId = `${requestId}:high-cost-event-study`;
  const reservationPlan = createHighCostUsageReservationPlan({
    estimatedCredits: 20,
    executionStatus: "planned",
    requestId: highCostRequestId,
    subscriptionId,
    taskId: highCostTaskId,
    toolName: "run_event_study",
    userConfirmed: true,
    workspaceId
  });
  const failedRefundPlan = createHighCostUsageReservationPlan({
    estimatedCredits: 20,
    executionStatus: "failed",
    requestId: highCostRequestId,
    subscriptionId,
    taskId: highCostTaskId,
    toolName: "run_event_study",
    userConfirmed: true,
    workspaceId
  });
  const packageCreditOverageRulesDocumented =
    proPlan !== undefined &&
    developerPlan !== undefined &&
    proPlan.usage_quota.credit_limit === 5000 &&
    developerPlan.usage_quota.credit_limit === 10000 &&
    developerPlan.overage.enabled === true &&
    developerPlan.overage.reconciliation_contract ===
      "deploy/usage/billing-reconciliation.contract.json" &&
    developerPlan.overage.high_cost_confirmation_required === true &&
    pricingCatalog.plans.every(
      (plan) => plan.price_status === "validation_assumption_not_final_quote"
    );
  const weightedCreditModelReferenced = eventWriterCapability.weighted_credits === true;
  const refundAndProrationBlockedWithoutProviderPreview =
    lifecyclePlan.billing_provider.calls === false &&
    lifecyclePlan.billing_provider.refund_preview === false &&
    lifecyclePlan.billing_provider.proration_preview === false;
  const invoiceCreditsMatchUsageLedgerCredits =
    billingPlan.status === "planned_no_write" && billingPlan.consistency.status === "matched";
  const requestIdTraceLinksInvoiceLedgerUsageEvent =
    billingPlan.traceability.traceable_to_call === true &&
    billingPlan.traceability.traceable_call_count === billingPlan.invoice_lines.length &&
    billingPlan.invoice_lines.length === ledgerEntries.length;
  const highCostPreDebitAndFailureRefundPlanned =
    reservationPlan.pre_debit.status === "planned_no_write" &&
    failedRefundPlan.failure_refund.status === "planned_no_write" &&
    reservationPlan.reservation.reservation_id === failedRefundPlan.reservation.reservation_id;
  const validation: BillingRulesReleaseGatePlan["validation"] = {
    all_checks_passed:
      packageCreditOverageRulesDocumented &&
      weightedCreditModelReferenced &&
      refundAndProrationBlockedWithoutProviderPreview &&
      invoiceCreditsMatchUsageLedgerCredits &&
      requestIdTraceLinksInvoiceLedgerUsageEvent &&
      highCostPreDebitAndFailureRefundPlanned,
    high_cost_pre_debit_and_failure_refund_planned: highCostPreDebitAndFailureRefundPlanned,
    invoice_credits_match_usage_ledger_credits: invoiceCreditsMatchUsageLedgerCredits,
    live_release_claimed: false,
    package_credit_overage_rules_documented: packageCreditOverageRulesDocumented,
    refund_and_proration_rules_blocked_without_provider_preview:
      refundAndProrationBlockedWithoutProviderPreview,
    request_id_trace_links_invoice_ledger_usage_event:
      requestIdTraceLinksInvoiceLedgerUsageEvent,
    weighted_credit_model_referenced: weightedCreditModelReferenced
  };

  return {
    account_id: accountId,
    billing_reconciliation_gate: {
      capability: getUsageBillingReconciliationCapabilities(),
      plan: billingPlan
    },
    capability: getBillingRulesReleaseGateCapabilities(),
    frontend: false,
    high_cost_gate: {
      capability: getHighCostUsageReservationCapabilities(),
      failed_refund_plan: failedRefundPlan,
      reservation_plan: reservationPlan
    },
    live_billing_provider: false,
    live_invoice_writes: false,
    live_ledger_reads: false,
    live_ledger_writes: false,
    package_rules: {
      currency: pricingCatalog.currency,
      developer_credit_limit: developerPlan?.usage_quota.credit_limit ?? 0,
      developer_overage_enabled: developerPlan?.overage.enabled === true,
      package_capability: packageCapability,
      plan_count: pricingCatalog.plans.length,
      pricing_catalog: pricingCatalog,
      pro_credit_limit: proPlan?.usage_quota.credit_limit ?? 0,
      validation_assumption_not_final_quote: true,
      weighted_credit_model_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.3"
    },
    persistent_writes: false,
    quota_gate: {
      capability: getUsageQuotaDisplayCapabilities(),
      plan: quotaPlan
    },
    release_checks: [
      {
        check_id: "package_credit_overage_rules_documented",
        evidence: "Pro/Developer catalog exposes credit limits, overage status, and billing reconciliation contract",
        status: validation.package_credit_overage_rules_documented ? "pass" : "blocked"
      },
      {
        check_id: "weighted_credit_model_referenced",
        evidence: "Usage ledger event writer reports weighted_credits=true",
        status: validation.weighted_credit_model_referenced ? "pass" : "blocked"
      },
      {
        check_id: "refund_and_proration_rules_blocked_without_provider_preview",
        evidence: "Subscription lifecycle planner keeps refund/proration preview disabled until live provider exists",
        status: validation.refund_and_proration_rules_blocked_without_provider_preview
          ? "pass"
          : "blocked"
      },
      {
        check_id: "invoice_credits_match_usage_ledger_credits",
        evidence: "Billing reconciliation planner returns matched invoice and ledger credits",
        status: validation.invoice_credits_match_usage_ledger_credits ? "pass" : "blocked"
      },
      {
        check_id: "request_id_trace_links_invoice_ledger_usage_event",
        evidence: "Every invoice line carries request_id, usage_event_id, ledger_entry_id, and invoice_line_id",
        status: validation.request_id_trace_links_invoice_ledger_usage_event ? "pass" : "blocked"
      },
      {
        check_id: "high_cost_pre_debit_and_failure_refund_planned",
        evidence: "High-cost planner links confirmed pre-debit and failed execution refund to one reservation",
        status: validation.high_cost_pre_debit_and_failure_refund_planned ? "pass" : "blocked"
      }
    ],
    release_gate: {
      blockers: [
        "final_commercial_quote_missing",
        "live_billing_provider_missing",
        "live_usage_ledger_reads_missing",
        "live_invoice_write_missing",
        "frontend_billing_ui_missing"
      ],
      external_signoff_required: true,
      signoffs: ["billing", "finance", "data-rights", "support", "ops"],
      status: "blocked_live_billing_rules_validation"
    },
    request_id: requestId,
    sql_emitted: false,
    status: "planned_no_write",
    subscription_rules: {
      billing_provider_calls: false,
      lifecycle_plan: lifecyclePlan,
      proration_preview_live: false,
      refund_preview_live: false,
      subscription_capability: subscriptionCapability
    },
    tables: BILLING_RULES_RELEASE_GATE_TABLES,
    validation,
    version: BILLING_RULES_RELEASE_GATE_VERSION,
    workspace_id: workspaceId
  };
}

export function getPartnerSupportReleaseGateCapabilities(): PartnerSupportReleaseGateCapabilities {
  return {
    billing_provider_calls: false,
    frontend: false,
    live_ledger_reads: false,
    live_partner_report_artifact_store: false,
    live_support_log_reads: false,
    package: "@aiphabee/usage-ledger",
    partner_portal_delivery: false,
    partner_reconciliation_route: "POST /usage/partner-reconciliation/plan",
    persistent_writes: false,
    request_id_drill_required: true,
    required_checks: PARTNER_SUPPORT_RELEASE_GATE_CHECKS,
    route: "POST /usage/release-gates/partner-support/plan",
    runtime_route: "GET /usage/runtime",
    sql_emitted: false,
    status: "partner_support_release_gate_scaffold",
    support_help_center_route: "GET /support/help-center",
    support_investigation_route: "POST /support/request-id-investigation/plan",
    support_runtime_route: "GET /support/runtime",
    tables: PARTNER_SUPPORT_RELEASE_GATE_TABLES,
    version: PARTNER_SUPPORT_RELEASE_GATE_VERSION
  };
}

export function createPartnerSupportReleaseGatePlan(
  input: PartnerSupportReleaseGatePlanInput
): PartnerSupportReleaseGatePlan {
  const requestId = input.requestId;
  const partnerId = normalizeIdentifier(input.partnerId, "partner_hk_data");
  const workspaceId = normalizeIdentifier(input.workspaceId, "ws_internal_alpha");
  const supportAgentId = normalizeIdentifier(input.supportAgentId, "support_agent_partner_ops");
  const targetRequestId = normalizeIdentifier(
    input.targetRequestId,
    "req_partner_mcp_quote_001"
  );
  const periodStart = normalizeIdentifier(input.periodStart, "2026-06-01T00:00:00.000Z");
  const periodEnd = normalizeIdentifier(input.periodEnd, "2026-06-08T00:00:00.000Z");
  const targetUsageEventId = `usage_event_${sanitizeId(targetRequestId)}`;
  const delayedRequestId = `${targetRequestId}_delayed`;
  const webRequestId = `${targetRequestId}_web`;
  const usageRows: PartnerReconciliationUsageRowInput[] = [
    {
      channel: "mcp",
      credits: 8,
      dataset: "hk_equity_quote",
      meteredRows: 120,
      packageCode: "developer",
      requestId: targetRequestId,
      usageCount: 3,
      usageEventId: targetUsageEventId,
      userId: "user_ops_001"
    },
    {
      backfillCount: 1,
      channel: "mcp",
      credits: 2,
      dataDelayMinutes: 10,
      dataset: "hk_equity_quote",
      meteredRows: 20,
      missingRows: 2,
      packageCode: "developer",
      requestId: delayedRequestId,
      usageCount: 1,
      usageEventId: `usage_event_${sanitizeId(delayedRequestId)}`,
      userId: "user_ops_001"
    },
    {
      channel: "web",
      credits: 5,
      dataset: "financial_facts",
      meteredRows: 50,
      packageCode: "pro",
      requestId: webRequestId,
      usageCount: 2,
      usageEventId: `usage_event_${sanitizeId(webRequestId)}`,
      userId: "user_ops_002"
    }
  ];
  const partnerPlan = createPartnerReconciliationReportPlan({
    cadence: "weekly",
    format: "csv",
    partnerId,
    periodEnd,
    periodStart,
    requestId: `${requestId}:partner-reconciliation`,
    usageRows,
    workspaceId
  });
  const supportPlan = createSupportRequestIdInvestigationPlan({
    category: "account_billing",
    includeSensitiveContent: false,
    reason: "release_gate_partner_reconciliation_request_id_drill",
    requestId: `${requestId}:support-investigation`,
    supportAgentId,
    targetRequestId,
    workspaceId
  });
  const supportHelpCenter = getSupportHelpCenter();
  const partnerRequestIds = uniqueStrings(partnerPlan.rows.flatMap((row) => row.request_ids));
  const partnerUsageEventIds = uniqueStrings(
    partnerPlan.rows.flatMap((row) => row.usage_event_ids)
  );
  const partnerReportGenerated =
    partnerPlan.status === "planned_no_write" &&
    partnerPlan.report.export_status === "planned_no_write" &&
    partnerPlan.rows.length > 0;
  const partnerReportTraceLinksRequestIdAndUsageEvent =
    partnerPlan.traceability.traceable_to_usage_ledger === true &&
    partnerRequestIds.includes(targetRequestId) &&
    partnerUsageEventIds.includes(targetUsageEventId);
  const partnerReportSlaCountersPresent =
    partnerPlan.sla.daily_weekly_report === true &&
    partnerPlan.sla.required_fields.includes("data_delay_minutes") &&
    partnerPlan.sla.required_fields.includes("missing_rows") &&
    partnerPlan.sla.required_fields.includes("error_count") &&
    partnerPlan.sla.required_fields.includes("backfill_count") &&
    partnerPlan.sla.status === "attention_required";
  const supportRequestIdInvestigationMetadataOnly =
    supportPlan.status === "planned_no_write" &&
    supportPlan.investigation.target_request_id === targetRequestId &&
    supportPlan.validation.required_context_present === true &&
    supportPlan.investigation.planned_sources.includes("usage_ledger_event") &&
    supportPlan.investigation.live_log_reads === false &&
    supportPlan.investigation.live_billing_provider_reads === false;
  const sensitivePayloadsExcluded =
    supportPlan.privacy.default_sensitive_content_access === false &&
    supportPlan.privacy.sensitive_content_released === false &&
    supportPlan.privacy.forbidden_fields.includes("raw_prompt") &&
    supportPlan.privacy.forbidden_fields.includes("generated_answer") &&
    partnerPlan.privacy.credential_material_included === false &&
    partnerPlan.privacy.raw_email_included === false &&
    partnerPlan.privacy.raw_payment_identifier_included === false &&
    partnerPlan.export.raw_personal_contact_included === false;
  const liveArtifactAndLogReadsBlocked =
    partnerPlan.export.artifact_writes === false &&
    partnerPlan.live_ledger_reads === false &&
    supportPlan.investigation.live_log_reads === false &&
    supportPlan.persistent_writes === false;
  const validation: PartnerSupportReleaseGatePlan["validation"] = {
    all_checks_passed:
      partnerReportGenerated &&
      partnerReportTraceLinksRequestIdAndUsageEvent &&
      partnerReportSlaCountersPresent &&
      supportRequestIdInvestigationMetadataOnly &&
      sensitivePayloadsExcluded &&
      liveArtifactAndLogReadsBlocked,
    live_artifact_and_log_reads_blocked: liveArtifactAndLogReadsBlocked,
    live_release_claimed: false,
    partner_report_generated: partnerReportGenerated,
    partner_report_sla_counters_present: partnerReportSlaCountersPresent,
    partner_report_trace_links_request_id_and_usage_event:
      partnerReportTraceLinksRequestIdAndUsageEvent,
    sensitive_payloads_excluded: sensitivePayloadsExcluded,
    support_request_id_investigation_metadata_only: supportRequestIdInvestigationMetadataOnly
  };

  return {
    capability: getPartnerSupportReleaseGateCapabilities(),
    frontend: false,
    live_ledger_reads: false,
    live_partner_report_artifact_store: false,
    live_support_log_reads: false,
    ops_drill: {
      partner_report_id: partnerPlan.report.report_id,
      request_ids_available: partnerRequestIds,
      support_ticket_ref: supportPlan.support_ticket.support_ticket_ref,
      target_request_id: targetRequestId,
      usage_event_ids_available: partnerUsageEventIds
    },
    partner_portal_delivery: false,
    partner_reconciliation_gate: {
      capability: getPartnerReconciliationReportCapabilities(),
      plan: partnerPlan
    },
    persistent_writes: false,
    release_checks: [
      {
        check_id: "partner_report_generated",
        evidence: "Partner reconciliation planner returns grouped report rows and no-write export status",
        status: validation.partner_report_generated ? "pass" : "blocked"
      },
      {
        check_id: "partner_report_trace_links_request_id_and_usage_event",
        evidence: "Report rows carry the target request_id and matching usage_event_id for support drill-down",
        status: validation.partner_report_trace_links_request_id_and_usage_event
          ? "pass"
          : "blocked"
      },
      {
        check_id: "partner_report_sla_counters_present",
        evidence: "Daily/weekly SLA output includes delay, missing-row, error, and backfill counters",
        status: validation.partner_report_sla_counters_present ? "pass" : "blocked"
      },
      {
        check_id: "support_request_id_investigation_metadata_only",
        evidence: "Support planner resolves request_id through metadata sources with live log and provider reads off",
        status: validation.support_request_id_investigation_metadata_only ? "pass" : "blocked"
      },
      {
        check_id: "sensitive_payloads_excluded",
        evidence: "Support and partner report outputs exclude prompts, answers, raw emails, credentials, and payment data",
        status: validation.sensitive_payloads_excluded ? "pass" : "blocked"
      },
      {
        check_id: "live_artifact_and_log_reads_blocked",
        evidence: "Partner artifact writes, live ledger reads, support log reads, and persistent writes remain disabled",
        status: validation.live_artifact_and_log_reads_blocked ? "pass" : "blocked"
      }
    ],
    release_gate: {
      blockers: [
        "live_usage_ledger_reads_missing",
        "live_partner_report_artifact_store_missing",
        "partner_portal_delivery_missing",
        "live_support_log_reads_missing",
        "frontend_ops_ui_missing",
        "final_partner_settlement_approval_missing"
      ],
      external_signoff_required: true,
      signoffs: ["data-partner", "support", "billing", "ops", "compliance"],
      status: "blocked_live_partner_support_validation"
    },
    request_id: requestId,
    sql_emitted: false,
    status: "planned_no_write",
    support_investigation_gate: {
      capability: getSupportOperationsCapabilities(),
      help_center: supportHelpCenter,
      plan: supportPlan
    },
    tables: PARTNER_SUPPORT_RELEASE_GATE_TABLES,
    validation,
    version: PARTNER_SUPPORT_RELEASE_GATE_VERSION,
    workspace_id: workspaceId
  };
}

export function getPartnerSlaReconciliationReadinessCapabilities(): PartnerSlaReconciliationReadinessCapabilities {
  return {
    frontend: false,
    group_by: PARTNER_RECONCILIATION_REPORT_GROUP_BY,
    live_ledger_reads: false,
    live_partner_report_artifact_store: false,
    live_support_log_reads: false,
    package: "@aiphabee/usage-ledger",
    partner_portal_delivery: false,
    partner_reconciliation_route: "POST /usage/partner-reconciliation/plan",
    partner_support_release_gate_route: "POST /usage/release-gates/partner-support/plan",
    persistent_writes: false,
    required_checks: PARTNER_SLA_RECONCILIATION_READINESS_CHECKS,
    required_sla_fields: ["data_delay_minutes", "missing_rows", "error_count", "backfill_count"],
    route: "GET /usage/partner-sla/reconciliation-readiness",
    runtime_route: "GET /usage/runtime",
    sql_emitted: false,
    status: "partner_sla_reconciliation_readiness_scaffold",
    supported_cadences: PARTNER_RECONCILIATION_REPORT_CADENCES,
    trace_fields: ["request_id", "usage_event_id", "dataset", "channel", "package_code", "user_id"],
    version: PARTNER_SLA_RECONCILIATION_READINESS_VERSION
  };
}

export function createPartnerSlaReconciliationReadinessReport(
  input: {
    partnerId?: string;
    periodEnd?: string;
    periodStart?: string;
    requestId?: string;
    workspaceId?: string;
  } = {}
): PartnerSlaReconciliationReadinessReport {
  const requestId = normalizeIdentifier(
    input.requestId,
    "req_partner_sla_reconciliation_readiness"
  );
  const partnerId = normalizeIdentifier(input.partnerId, "partner_hk_data");
  const workspaceId = normalizeIdentifier(input.workspaceId, "ws_partner_sla_alpha");
  const periodStart = normalizeIdentifier(input.periodStart, "2026-06-01T00:00:00.000Z");
  const periodEnd = normalizeIdentifier(input.periodEnd, "2026-06-08T00:00:00.000Z");
  const usageRows: PartnerReconciliationUsageRowInput[] = [
    {
      channel: "mcp",
      credits: 12,
      dataset: "quote_snapshot",
      meteredRows: 240,
      packageCode: "developer",
      requestId: `${requestId}:quote-ok`,
      usageCount: 12,
      usageEventId: `usage_event_${sanitizeId(requestId)}_quote_ok`,
      userId: "partner_user_001"
    },
    {
      backfillCount: 1,
      channel: "mcp",
      credits: 4,
      dataDelayMinutes: 18,
      dataset: "price_history",
      meteredRows: 80,
      missingRows: 3,
      packageCode: "developer",
      requestId: `${requestId}:price-delay`,
      usageCount: 4,
      usageEventId: `usage_event_${sanitizeId(requestId)}_price_delay`,
      userId: "partner_user_001"
    },
    {
      channel: "web",
      credits: 8,
      dataset: "financial_facts",
      errorCount: 1,
      meteredRows: 120,
      packageCode: "pro",
      requestId: `${requestId}:financial-error`,
      usageCount: 3,
      usageEventId: `usage_event_${sanitizeId(requestId)}_financial_error`,
      userId: "partner_user_002"
    },
    {
      channel: "api",
      credits: 6,
      dataset: "corporate_actions",
      meteredRows: 30,
      packageCode: "team",
      requestId: `${requestId}:corporate-actions-ok`,
      usageCount: 2,
      usageEventId: `usage_event_${sanitizeId(requestId)}_corporate_actions_ok`,
      userId: "partner_user_003"
    }
  ];
  const dailyReport = createPartnerReconciliationReportPlan({
    cadence: "daily",
    format: "json",
    partnerId,
    periodEnd,
    periodStart,
    requestId: `${requestId}:daily`,
    usageRows,
    workspaceId
  });
  const weeklyReport = createPartnerReconciliationReportPlan({
    cadence: "weekly",
    format: "csv",
    partnerId,
    periodEnd,
    periodStart,
    requestId: `${requestId}:weekly`,
    usageRows,
    workspaceId
  });
  const supportReleaseGate = createPartnerSupportReleaseGatePlan({
    partnerId,
    periodEnd,
    periodStart,
    requestId: `${requestId}:support-gate`,
    supportAgentId: "support_agent_partner_ops",
    targetRequestId: "req_partner_mcp_quote_001",
    workspaceId
  });
  const dailyReportGenerated =
    dailyReport.status === "planned_no_write" &&
    dailyReport.period.cadence === "daily" &&
    dailyReport.rows.length > 0;
  const weeklyReportGenerated =
    weeklyReport.status === "planned_no_write" &&
    weeklyReport.period.cadence === "weekly" &&
    weeklyReport.rows.length > 0;
  const slaCountersCoverDelayMissingErrorBackfill =
    dailyReport.sla.required_fields.includes("data_delay_minutes") &&
    dailyReport.sla.required_fields.includes("missing_rows") &&
    dailyReport.sla.required_fields.includes("error_count") &&
    dailyReport.sla.required_fields.includes("backfill_count") &&
    weeklyReport.summary.delayed_line_count > 0 &&
    weeklyReport.summary.missing_rows > 0 &&
    weeklyReport.summary.error_count > 0 &&
    weeklyReport.summary.backfill_count > 0;
  const requestUsageTraceComplete =
    dailyReport.traceability.traceable_to_usage_ledger === true &&
    weeklyReport.traceability.traceable_to_usage_ledger === true &&
    dailyReport.traceability.traceable_usage_event_count === usageRows.length &&
    weeklyReport.traceability.traceable_usage_event_count === usageRows.length;
  const partnerSupportReleaseGatePassed =
    supportReleaseGate.validation.all_checks_passed === true &&
    supportReleaseGate.release_checks.every((check) => check.status === "pass");
  const liveSurfacesBlocked =
    dailyReport.live_ledger_reads === false &&
    dailyReport.export.artifact_writes === false &&
    weeklyReport.live_ledger_reads === false &&
    weeklyReport.export.artifact_writes === false &&
    supportReleaseGate.live_ledger_reads === false &&
    supportReleaseGate.live_partner_report_artifact_store === false &&
    supportReleaseGate.live_support_log_reads === false &&
    supportReleaseGate.partner_portal_delivery === false &&
    supportReleaseGate.persistent_writes === false;
  const sensitivePayloadsExcluded =
    dailyReport.privacy.credential_material_included === false &&
    dailyReport.privacy.raw_email_included === false &&
    dailyReport.privacy.raw_payment_identifier_included === false &&
    weeklyReport.export.raw_payment_identifiers_included === false &&
    weeklyReport.export.raw_personal_contact_included === false &&
    supportReleaseGate.validation.sensitive_payloads_excluded === true;
  const readiness: PartnerSlaReconciliationReadinessReport["readiness"] = {
    all_checks_passed:
      dailyReportGenerated &&
      weeklyReportGenerated &&
      slaCountersCoverDelayMissingErrorBackfill &&
      requestUsageTraceComplete &&
      partnerSupportReleaseGatePassed &&
      liveSurfacesBlocked &&
      sensitivePayloadsExcluded,
    daily_report_generated: dailyReportGenerated,
    live_release_claimed: false,
    live_surfaces_blocked: liveSurfacesBlocked,
    partner_support_release_gate_passed: partnerSupportReleaseGatePassed,
    request_usage_trace_complete: requestUsageTraceComplete,
    sensitive_payloads_excluded: sensitivePayloadsExcluded,
    sla_counters_cover_delay_missing_error_backfill: slaCountersCoverDelayMissingErrorBackfill,
    weekly_report_generated: weeklyReportGenerated
  };

  return {
    capability: getPartnerSlaReconciliationReadinessCapabilities(),
    daily_report: dailyReport,
    frontend: false,
    live_ledger_reads: false,
    live_partner_report_artifact_store: false,
    live_support_log_reads: false,
    partner_portal_delivery: false,
    persistent_writes: false,
    readiness,
    release_checks: [
      {
        check_id: "daily_report_generated",
        evidence: "Daily partner reconciliation report returns grouped report lines",
        status: readiness.daily_report_generated ? "pass" : "blocked"
      },
      {
        check_id: "weekly_report_generated",
        evidence: "Weekly partner reconciliation report returns grouped report lines",
        status: readiness.weekly_report_generated ? "pass" : "blocked"
      },
      {
        check_id: "sla_counters_cover_delay_missing_error_backfill",
        evidence: "SLA counters expose delay, missing rows, error count, and backfill count",
        status: readiness.sla_counters_cover_delay_missing_error_backfill ? "pass" : "blocked"
      },
      {
        check_id: "request_usage_trace_complete",
        evidence: "Every fixture row has request_id and usage_event_id traceability",
        status: readiness.request_usage_trace_complete ? "pass" : "blocked"
      },
      {
        check_id: "partner_support_release_gate_passed",
        evidence: "Partner support release gate validates report, request drill-down, SLA counters, and metadata-only investigation",
        status: readiness.partner_support_release_gate_passed ? "pass" : "blocked"
      },
      {
        check_id: "live_surfaces_blocked",
        evidence: "Live ledger reads, artifact writes, support log reads, partner portal delivery, and persistent writes remain disabled",
        status: readiness.live_surfaces_blocked ? "pass" : "blocked"
      },
      {
        check_id: "sensitive_payloads_excluded",
        evidence: "Partner report and support outputs exclude credentials, raw contact/payment data, prompts, and generated answers",
        status: readiness.sensitive_payloads_excluded ? "pass" : "blocked"
      }
    ],
    release_gate: {
      blockers: [
        "live_usage_ledger_reads_missing",
        "live_partner_report_artifact_store_missing",
        "partner_portal_delivery_missing",
        "final_partner_settlement_approval_missing"
      ],
      status: "blocked_live_partner_sla_reconciliation"
    },
    request_id: requestId,
    sla_summary: {
      backfill_count: weeklyReport.summary.backfill_count,
      daily_line_count: dailyReport.summary.line_count,
      delayed_line_count: weeklyReport.summary.delayed_line_count,
      error_count: weeklyReport.summary.error_count,
      missing_rows: weeklyReport.summary.missing_rows,
      weekly_line_count: weeklyReport.summary.line_count
    },
    sql_emitted: false,
    status: "partner_sla_reconciliation_readiness_passed",
    support_release_gate: supportReleaseGate,
    tables: [...new Set(PARTNER_SLA_RECONCILIATION_READINESS_TABLES)],
    usage_fixture_rows: usageRows,
    version: PARTNER_SLA_RECONCILIATION_READINESS_VERSION,
    weekly_report: weeklyReport,
    workspace_id: workspaceId
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

export function createPartnerReconciliationReportPlan(
  input: PartnerReconciliationReportPlanInput
): PartnerReconciliationReportPlan {
  const partnerId = input.partnerId ?? "partner_unresolved";
  const workspaceId = input.workspaceId ?? "workspace_unresolved";
  const reportId = `partner_reconciliation_${sanitizeId(partnerId)}_${sanitizeId(
    input.requestId
  )}`;
  const usageRows = input.usageRows ?? [];
  const traceableUsageEventCount = usageRows.filter(isTraceablePartnerUsageRow).length;
  const groupedRows = aggregatePartnerReconciliationRows(reportId, usageRows);
  const missingContext =
    input.partnerId === undefined ||
    input.partnerId.length === 0 ||
    input.workspaceId === undefined ||
    input.workspaceId.length === 0 ||
    input.periodStart === undefined ||
    input.periodStart.length === 0 ||
    input.periodEnd === undefined ||
    input.periodEnd.length === 0 ||
    traceableUsageEventCount !== usageRows.length;
  const status: PartnerReconciliationReportStatus =
    usageRows.length === 0
      ? "blocked_empty_usage"
      : missingContext
        ? "blocked_missing_context"
        : "planned_no_write";
  const summary = summarizePartnerReconciliationRows(groupedRows);

  return {
    audit: {
      audit_event: "usage.partner_reconciliation.plan",
      audit_event_id: `partner_reconciliation_audit_${sanitizeId(input.requestId)}`,
      table: "audit.partner_reconciliation_event",
      write_status: status === "blocked_empty_usage" ? "blocked_no_rows" : "planned_no_write"
    },
    billing_provider_calls: false,
    export: {
      artifact_writes: false,
      raw_payment_identifiers_included: false,
      raw_personal_contact_included: false,
      selected_format: input.format ?? "csv",
      supported_formats: PARTNER_RECONCILIATION_REPORT_FORMATS
    },
    frontend: false,
    live_ledger_reads: false,
    partner_id: partnerId,
    period: {
      cadence: input.cadence ?? "weekly",
      period_end: input.periodEnd ?? "period_end_unresolved",
      period_start: input.periodStart ?? "period_start_unresolved"
    },
    persistent_writes: false,
    privacy: {
      credential_material_included: false,
      raw_email_included: false,
      raw_payment_identifier_included: false,
      user_identifier_policy: "user_id_or_account_id_only"
    },
    report: {
      columns: [
        "dataset",
        "channel",
        "package_code",
        "user_id",
        "usage_count",
        "credits",
        "metered_rows",
        "request_ids",
        "usage_event_ids",
        "data_delay_minutes_max",
        "missing_rows",
        "error_count",
        "backfill_count",
        "sla_status"
      ],
      export_status: status === "planned_no_write" ? "planned_no_write" : "blocked_no_rows",
      group_by: PARTNER_RECONCILIATION_REPORT_GROUP_BY,
      report_id: reportId,
      source: "usage_ledger_snapshot",
      table: "core.partner_reconciliation_report"
    },
    request_id: input.requestId,
    request_id_visible: true,
    rows: groupedRows,
    sla: {
      daily_weekly_report: true,
      required_fields: ["data_delay_minutes", "missing_rows", "error_count", "backfill_count"],
      status:
        usageRows.length === 0
          ? "blocked_no_rows"
          : summary.delayed_line_count > 0 || summary.missing_rows > 0 || summary.error_count > 0
            ? "attention_required"
            : "ok"
    },
    sql_emitted: false,
    status,
    summary,
    tables: PARTNER_RECONCILIATION_REPORT_TABLES,
    traceability: {
      required_fields: [
        "request_id",
        "usage_event_id",
        "dataset",
        "channel",
        "package_code",
        "user_id"
      ],
      traceable_to_usage_ledger: usageRows.length > 0 && traceableUsageEventCount === usageRows.length,
      traceable_usage_event_count: traceableUsageEventCount
    },
    version: PARTNER_RECONCILIATION_REPORT_VERSION,
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

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return value !== undefined && value.length > 0 ? value : fallback;
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

function normalizeNonNegativeCount(value: number | undefined): number {
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

function isTraceablePartnerUsageRow(row: PartnerReconciliationUsageRowInput): boolean {
  return (
    row.requestId !== undefined &&
    row.requestId.length > 0 &&
    row.usageEventId !== undefined &&
    row.usageEventId.length > 0 &&
    row.dataset !== undefined &&
    row.dataset.length > 0 &&
    row.userId !== undefined &&
    row.userId.length > 0
  );
}

function aggregatePartnerReconciliationRows(
  reportId: string,
  rows: PartnerReconciliationUsageRowInput[]
): PartnerReconciliationReportPlan["rows"] {
  const groups = new Map<string, Omit<PartnerReconciliationReportPlan["rows"][number], "line_id">>();

  for (const row of rows) {
    const dataset = row.dataset ?? "dataset_unresolved";
    const channel = row.channel ?? "web";
    const packageCode = row.packageCode ?? "free";
    const userId = row.userId ?? "user_unresolved";
    const groupKey = [dataset, channel, packageCode, userId].map(sanitizeId).join("__");
    const usageCount = normalizeNonNegativeCount(row.usageCount) || 1;
    const credits = normalizeCreditCount(row.credits);
    const meteredRows = normalizeNonNegativeCount(row.meteredRows);
    const dataDelayMinutes = normalizeNonNegativeCount(row.dataDelayMinutes);
    const missingRows = normalizeNonNegativeCount(row.missingRows);
    const errorCount = normalizeNonNegativeCount(row.errorCount);
    const backfillCount = normalizeNonNegativeCount(row.backfillCount);
    const existing = groups.get(groupKey);

    if (existing === undefined) {
      groups.set(groupKey, {
        backfill_count: backfillCount,
        channel,
        credits,
        data_delay_minutes_max: dataDelayMinutes,
        dataset,
        error_count: errorCount,
        metered_rows: meteredRows,
        missing_rows: missingRows,
        package_code: packageCode,
        request_ids: uniqueStrings([row.requestId]),
        sla_status:
          dataDelayMinutes > 0 || missingRows > 0 || errorCount > 0 ? "exception" : "ok",
        table: "core.partner_reconciliation_report_line",
        usage_count: usageCount,
        usage_event_ids: uniqueStrings([row.usageEventId]),
        user_id: userId
      });
      continue;
    }

    existing.backfill_count += backfillCount;
    existing.credits += credits;
    existing.data_delay_minutes_max = Math.max(existing.data_delay_minutes_max, dataDelayMinutes);
    existing.error_count += errorCount;
    existing.metered_rows += meteredRows;
    existing.missing_rows += missingRows;
    existing.request_ids = uniqueStrings([...existing.request_ids, row.requestId]);
    existing.sla_status =
      existing.data_delay_minutes_max > 0 || existing.missing_rows > 0 || existing.error_count > 0
        ? "exception"
        : "ok";
    existing.usage_count += usageCount;
    existing.usage_event_ids = uniqueStrings([...existing.usage_event_ids, row.usageEventId]);
  }

  return [...groups.values()]
    .sort((left, right) =>
      [left.dataset, left.channel, left.package_code, left.user_id]
        .join("\u0000")
        .localeCompare([right.dataset, right.channel, right.package_code, right.user_id].join("\u0000"))
    )
    .map((row, index) => ({
      ...row,
      line_id: `partner_reconciliation_line_${sanitizeId(reportId)}_${index + 1}`
    }));
}

function summarizePartnerReconciliationRows(
  rows: PartnerReconciliationReportPlan["rows"]
): PartnerReconciliationReportPlan["summary"] {
  return {
    backfill_count: rows.reduce((total, row) => total + row.backfill_count, 0),
    credit_total: rows.reduce((total, row) => total + row.credits, 0),
    dataset_count: new Set(rows.map((row) => row.dataset)).size,
    delayed_line_count: rows.filter((row) => row.data_delay_minutes_max > 0).length,
    error_count: rows.reduce((total, row) => total + row.error_count, 0),
    line_count: rows.length,
    metered_row_total: rows.reduce((total, row) => total + row.metered_rows, 0),
    missing_rows: rows.reduce((total, row) => total + row.missing_rows, 0),
    usage_count_total: rows.reduce((total, row) => total + row.usage_count, 0),
    user_count: new Set(rows.map((row) => row.user_id)).size
  };
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => value !== undefined && value.length > 0))];
}
