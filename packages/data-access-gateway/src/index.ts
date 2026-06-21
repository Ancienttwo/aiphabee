import type { AiphaBeeErrorCode, ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";
import {
  createServingExecutionAdapterPlan,
  createServingQueryPlan,
  createServingReadPlan,
  createServingSqlDescriptor,
  createServingSqlTextPlan,
  type ServingExecutionAdapterPlan,
  type ServingQueryPlan,
  type ServingReadPlan,
  type ServingSqlDescriptor,
  type ServingSqlTextPlan
} from "@aiphabee/serving-store";
import {
  createUsageLedgerEventPlan,
  type UsageLedgerEventPlan
} from "@aiphabee/usage-ledger";

export const DATA_ACCESS_GATEWAY_VERSION =
  "2026-06-20.phase1.serving-result-envelope-scaffold.v0";
export const RESTRICTED_EXPORT_VERSION =
  "2026-06-21.phase3.restricted-export-scaffold.v0";
export const FIELD_AUTHORIZATION_CONFIG_VERSION =
  "2026-06-21.phase3.field-authorization-config-scaffold.v0";
export const P0_RIGHTS_MATRIX_COVERAGE_VERSION =
  "2026-06-21.phase3.p0-rights-matrix-coverage-scaffold.v0";
export const DATA_COVERAGE_RELEASE_GATE_VERSION =
  "2026-06-21.phase3.data-coverage-release-gate-scaffold.v0";
export const RESTRICTED_EXPORT_FORMATS = ["csv", "image", "pdf"] as const;
export const P0_RIGHTS_MATRIX_SURFACES = ["web", "mcp", "export", "enterprise"] as const;
export const DATA_COVERAGE_FRESHNESS_TIERS = ["realtime", "delayed", "eod"] as const;
export const DATA_COVERAGE_DOMAINS = [
  "corporate_actions",
  "financial_restatements",
  "delistings",
  "identifier_history"
] as const;

export type DataAccessChannel = "api" | "export" | "mcp" | "web";
export type DataAccessDecisionStatus =
  | "allow"
  | "allow_with_redactions"
  | "deny"
  | "quality_hold";
export type DataAccessDeniedReason =
  | "channel_blocked"
  | "export_blocked"
  | "field_blocked"
  | "field_default_deny"
  | "time_range_blocked"
  | "workspace_entitlement_blocked"
  | "workspace_entitlement_default_deny";
export type DataAccessFieldStatus = "approved" | "blocked" | "default_deny";
export type DataQualityState = "HOLD" | "PASS" | "REJECT_RAW" | "WARN";
export type DataAccessServingResultStatus =
  | "result_blocked"
  | "result_deferred";
export type RestrictedExportFormat = (typeof RESTRICTED_EXPORT_FORMATS)[number];
export type RestrictedExportStatus =
  | "blocked_gateway_denied"
  | "blocked_missing_scope"
  | "blocked_unsupported_format"
  | "planned_no_write";
export type FieldAuthorizationApprovalStatus = "approved" | "pending" | "rejected";
export type FieldAuthorizationConfigStatus =
  | "active_preview"
  | "awaiting_approval"
  | "blocked_missing_context"
  | "rejected"
  | "scheduled";
export type P0RightsMatrixSurface = (typeof P0_RIGHTS_MATRIX_SURFACES)[number];
export type P0RightsMatrixReleaseGateStatus = "blocked_external_rights_matrix";
export type DataCoverageFreshnessTier = (typeof DATA_COVERAGE_FRESHNESS_TIERS)[number];
export type DataCoverageDomain = (typeof DATA_COVERAGE_DOMAINS)[number];
export type DataCoverageReleaseGateStatus = "blocked_live_partner_coverage";

export interface DataAccessFieldPolicy {
  channel: DataAccessChannel;
  dataset?: string;
  field: string;
  plan?: string;
  status: DataAccessFieldStatus;
}

export interface DataAccessEntitlementPolicy {
  channel: DataAccessChannel;
  dataset: string;
  exportAllowed: boolean;
  fieldPattern: string;
  maxWindowDays?: number;
  plan: string;
  status: DataAccessFieldStatus;
  workspaceId: string;
}

export interface DataEntitlementRow {
  channel: DataAccessChannel;
  dataset: string;
  entitlementId: string;
  exportAllowed: boolean;
  fieldPattern: string;
  rightsPolicyVersion: string;
  sourceRecordId: string;
  status: DataAccessFieldStatus;
  timeRangeDays?: number;
}

export interface WorkspaceEntitlementRow {
  entitlementId: string;
  sourceRecordId: string;
  status: DataAccessFieldStatus;
  subscriptionId?: string;
  validFrom: string;
  validTo?: string;
  workspaceEntitlementId: string;
  workspaceId: string;
}

export interface WorkspaceSubscriptionRow {
  billingState: "active" | "canceled" | "grace_period" | "paused" | "trialing";
  planCode: string;
  subscriptionId: string;
  validFrom: string;
  validTo?: string;
  workspaceId: string;
}

export interface DataAccessPolicy {
  channels: Record<DataAccessChannel, DataAccessFieldStatus>;
  defaultFieldStatus: "default_deny";
  entitlementPolicies: DataAccessEntitlementPolicy[];
  fieldPolicies: DataAccessFieldPolicy[];
  maxRows: number;
  maxWindowDays: number;
  methodologyVersion: string;
  rightsPolicyVersion: string;
}

export interface EntitlementPolicySourcePlan {
  liveDbReads: false;
  partnerRightsMatrixLoaded: false;
  policy: DataAccessPolicy;
  rowCounts: {
    dataEntitlements: number;
    subscriptionRows: number;
    workspaceEntitlements: number;
  };
  sourceRecords: string[];
  sqlEmitted: false;
  status: "policy_source_scaffold";
  tables: readonly [
    "core.data_entitlement",
    "core.workspace_entitlement",
    "core.workspace_subscription"
  ];
  version: typeof DATA_ACCESS_GATEWAY_VERSION;
}

export interface EntitlementPolicySourceInput {
  asOf: string;
  dataEntitlements: DataEntitlementRow[];
  subscriptionRows?: WorkspaceSubscriptionRow[];
  workspaceEntitlements: WorkspaceEntitlementRow[];
}

export interface DataAccessRequest {
  accountId?: string;
  channel: DataAccessChannel;
  dataset: string;
  exportRequested?: boolean;
  membershipId?: string;
  occurredAt?: string;
  plan: string;
  qualityState: DataQualityState;
  requestId?: string;
  requestedFields: string[];
  requestedRows: number;
  runId?: string;
  subscriptionId?: string;
  timeRange?: {
    from: string;
    to: string;
  };
  workspaceId?: string;
}

export interface RestrictedExportPlanInput {
  accountId?: string;
  dataset: string;
  fields: string[];
  format?: string;
  plan: string;
  qualityState?: DataQualityState;
  requestId?: string;
  requestedRows: number;
  runId?: string;
  scopes?: string[];
  timeRange?: {
    from: string;
    to: string;
  };
  workspaceId?: string;
}

export interface FieldAuthorizationConfigChangeInput {
  approvalStatus?: FieldAuthorizationApprovalStatus;
  approvedBy?: string;
  asOf?: string;
  channel?: DataAccessChannel;
  dataset?: string;
  effectiveAt?: string;
  expiresAt?: string;
  exportAllowed?: boolean;
  fieldPattern?: string;
  maxWindowDays?: number;
  operatorId?: string;
  plan?: string;
  policyVersion?: string;
  reason?: string;
  requestId: string;
  targetStatus?: DataAccessFieldStatus;
  workspaceId?: string;
}

export interface P0RightsMatrixCoverageInput {
  asOf?: string;
  rightsPolicyVersion?: string;
  toolNames: string[];
}

export interface DataCoverageReleaseGateInput {
  asOf?: string;
  coveragePolicyVersion?: string;
}

export interface FieldAuthorizationConfigChangePlan {
  approval: {
    approval_id: string;
    approved_by?: string;
    required: true;
    status: FieldAuthorizationApprovalStatus;
    table: "audit.field_authorization_approval";
    write_status: "planned_no_write";
  };
  change: {
    change_id: string;
    channel: DataAccessChannel;
    dataset: string;
    effective_at: string;
    expires_at?: string;
    export_allowed: boolean;
    field_pattern: string;
    max_window_days?: number;
    operator_id: string;
    plan: string;
    policy_version: string;
    reason?: string;
    target_status: DataAccessFieldStatus;
    table: "core.field_authorization_change";
    workspace_id?: string;
    write_status: "planned_no_write";
  };
  default_deny_preserved: true;
  frontend: false;
  live_db_reads: false;
  persistent_writes: false;
  policy_effect: {
    active_only_after_effective_at: true;
    activation_status: FieldAuthorizationConfigStatus;
    compiles_to_gateway_policy: true;
    data_entitlement_row: {
      channel: DataAccessChannel;
      dataset: string;
      entitlement_id: string;
      export_allowed: boolean;
      field_pattern: string;
      rights_policy_version: string;
      source_record_id: string;
      status: DataAccessFieldStatus;
      table: "core.data_entitlement";
      time_range_days?: number;
    };
    versioned_cache_key_required: true;
    workspace_entitlement_row?: {
      entitlement_id: string;
      source_record_id: string;
      status: DataAccessFieldStatus;
      table: "core.workspace_entitlement";
      valid_from: string;
      valid_to?: string;
      workspace_entitlement_id: string;
      workspace_id: string;
    };
  };
  request_id: string;
  sql_emitted: false;
  status: FieldAuthorizationConfigStatus;
  tables: readonly [
    "core.data_entitlement",
    "core.workspace_entitlement",
    "core.field_authorization_change",
    "audit.field_authorization_approval",
    "governance.field_authorization_config_contract"
  ];
  validation: {
    approval_required: true;
    effective_time_required: true;
    policy_version_required: true;
    required_context_present: boolean;
  };
  version: typeof FIELD_AUTHORIZATION_CONFIG_VERSION;
}

export interface P0RightsMatrixCoverageCapabilities {
  default_rights_status: "default_deny";
  enterprise_authorization_configured: true;
  export_authorization_configured: true;
  frontend: false;
  live_rights_matrix_reads: false;
  mcp_authorization_configured: true;
  package: "@aiphabee/data-access-gateway";
  partner_signed_matrix_loaded: false;
  persistent_writes: false;
  required_p0_tool_count: 16;
  required_surfaces: typeof P0_RIGHTS_MATRIX_SURFACES;
  route: "GET /gateway/rights-matrix/p0/coverage";
  runtime_route: "GET /gateway/runtime";
  sql_emitted: false;
  status: "p0_rights_matrix_coverage_scaffold";
  tables: readonly ["core.p0_rights_matrix_entry", "governance.p0_rights_matrix_contract"];
  version: typeof P0_RIGHTS_MATRIX_COVERAGE_VERSION;
  web_authorization_configured: true;
}

export interface P0RightsMatrixCoverageReport {
  as_of: string;
  capability: P0RightsMatrixCoverageCapabilities;
  dataset_field_coverage: Array<{
    dataset: string;
    field_patterns: readonly string[];
    rights_state: "default_deny_until_partner_matrix_signed";
    surfaces: Record<P0RightsMatrixSurface, "configured_default_deny">;
  }>;
  default_rights_status: "default_deny";
  frontend: false;
  live_rights_matrix_reads: false;
  persistent_writes: false;
  release_gate: {
    gate_status: P0RightsMatrixReleaseGateStatus;
    partner_signed_matrix_loaded: false;
    required_signoffs: readonly ["data_partner", "commercial_owner", "legal_compliance"];
  };
  rights_policy_version: string;
  sql_emitted: false;
  status: "p0_rights_matrix_coverage_scaffold";
  surface_coverage: Record<P0RightsMatrixSurface, {
    configured: true;
    default_rights_status: "default_deny";
  }>;
  tables: P0RightsMatrixCoverageCapabilities["tables"];
  tool_coverage: Array<{
    rights_state: "default_deny_until_partner_matrix_signed";
    surfaces: Record<P0RightsMatrixSurface, "configured_default_deny">;
    tool_name: string;
  }>;
  validation: {
    all_required_surfaces_configured: boolean;
    required_p0_tool_count: 16;
    tool_count: number;
    tool_count_matches_registry: boolean;
  };
  version: typeof P0_RIGHTS_MATRIX_COVERAGE_VERSION;
}

export interface DataCoverageReleaseGateCapabilities {
  coverage_policy_loaded: false;
  frontend: false;
  live_partner_data_reads: false;
  package: "@aiphabee/data-access-gateway";
  persistent_writes: false;
  required_coverage_domains: typeof DATA_COVERAGE_DOMAINS;
  required_freshness_tiers: typeof DATA_COVERAGE_FRESHNESS_TIERS;
  route: "GET /gateway/data-coverage/release-gate";
  runtime_route: "GET /gateway/runtime";
  sql_emitted: false;
  status: "data_coverage_release_gate_scaffold";
  tables: readonly [
    "core.data_coverage_release_gate",
    "governance.data_coverage_release_gate_contract"
  ];
  version: typeof DATA_COVERAGE_RELEASE_GATE_VERSION;
}

export interface DataCoverageReleaseGateReport {
  as_of: string;
  capability: DataCoverageReleaseGateCapabilities;
  coverage_domains: Array<{
    blocks_release_until_verified: true;
    coverage_required: true;
    domain: DataCoverageDomain;
    evidence_surfaces: readonly string[];
    live_partner_rows_loaded: false;
    status: "scaffold_covered_no_live_partner_rows";
    tables: readonly string[];
  }>;
  coverage_policy_version: string;
  frontend: false;
  freshness_markers: Array<{
    display_label: string;
    label_required: true;
    live_partner_rows_loaded: false;
    min_delay_minutes?: number;
    release_state: "contracted_no_live_partner_rows";
    supported_tool_surfaces: readonly string[];
    tier: DataCoverageFreshnessTier;
  }>;
  live_partner_data_reads: false;
  persistent_writes: false;
  release_gate: {
    blockers: readonly [
      "partner_coverage_files_missing",
      "live_freshness_policy_not_loaded",
      "golden_coverage_not_signed_off"
    ];
    gate_status: DataCoverageReleaseGateStatus;
    live_partner_coverage_loaded: false;
    required_signoffs: readonly ["data_engineering", "data_partner", "quality_owner"];
  };
  sql_emitted: false;
  status: "data_coverage_release_gate_scaffold";
  tables: DataCoverageReleaseGateCapabilities["tables"];
  validation: {
    all_required_coverage_domains_present: boolean;
    all_required_freshness_tiers_present: boolean;
    coverage_domain_count: number;
    freshness_tier_count: number;
  };
  version: typeof DATA_COVERAGE_RELEASE_GATE_VERSION;
}

export interface DataAccessDecision {
  allowedFields: string[];
  cacheKey: string;
  dataVersion: string;
  deniedFields: Array<{
    field: string;
    reason: DataAccessDeniedReason;
  }>;
  error?: {
    code: AiphaBeeErrorCode;
    message: string;
  };
  limits: {
    maxRows: number;
    maxWindowDays: number;
    requestedRows: number;
    servedRows: number;
    timeWindowDays?: number;
  };
  methodologyVersion: string;
  provenance: ProvenanceRef[];
  qualityState: DataQualityState;
  rightsPolicyVersion: string;
  servingExecution: ServingExecutionAdapterPlan;
  servingQuery: ServingQueryPlan;
  servingRead: ServingReadPlan;
  servingResult: DataAccessServingResult;
  servingSqlDescriptor: ServingSqlDescriptor;
  servingSqlText: ServingSqlTextPlan;
  status: DataAccessDecisionStatus;
  usage: UsageSummary;
  usageLedger: UsageLedgerEventPlan;
  warnings: string[];
}

export interface RestrictedExportPlan {
  artifact: {
    csv: "not_requested" | "planned_no_write";
    generated: false;
    image: "not_requested" | "planned_no_write";
    pdf: "not_requested" | "planned_no_write";
    r2_write: false;
  };
  data_version: "gateway-scaffold-v0";
  dataset: string;
  export_format?: RestrictedExportFormat;
  frontend: false;
  gateway_decision?: {
    allowed_fields: string[];
    denied_fields: DataAccessDecision["deniedFields"];
    error_code?: AiphaBeeErrorCode;
    export_requested: true;
    rights_policy_version: string;
    status: DataAccessDecisionStatus;
  };
  live_data_access: false;
  methodology_version: typeof RESTRICTED_EXPORT_VERSION;
  persistent_writes: false;
  provenance: ProvenanceRef[];
  request_id: string;
  row_policy: {
    max_rows: number;
    requested_rows: number;
    served_rows: number;
  };
  scope: {
    granted: boolean;
    required: "exports.read";
  };
  sql_emitted: false;
  status: RestrictedExportStatus;
  toolName: "restricted_export_plan";
  usage: UsageSummary;
  watermark: {
    fields: readonly [
      "request_id",
      "workspace_id",
      "dataset",
      "rights_policy_version",
      "as_of"
    ];
    required: true;
    text: string;
  };
}

export interface DataAccessServingResult {
  allowedFields: string[];
  blockedReason?: string;
  cacheKey: string;
  dataVersion: string;
  dataset: string;
  deferredReason?: ServingExecutionAdapterPlan["deferredReason"];
  deniedFields: DataAccessDecision["deniedFields"];
  envelopeFields: readonly ["as_of", "market_status", "provenance", "usage"];
  executionStatus: ServingExecutionAdapterPlan["status"];
  liveDataAccess: false;
  liveRead: false;
  marketStatus: "not_applicable";
  methodologyVersion: string;
  provenance: ProvenanceRef[];
  requestedFields: string[];
  rightsPolicyVersion: string;
  rows: [];
  rowCount: 0;
  servedRows: 0;
  sqlExecuted: false;
  sqlTextAccepted: boolean;
  statementId: ServingExecutionAdapterPlan["statementId"];
  status: DataAccessServingResultStatus;
  usage: UsageSummary;
  warnings: string[];
}

export const DEFAULT_DATA_ACCESS_POLICY: DataAccessPolicy = {
  channels: {
    api: "default_deny",
    export: "default_deny",
    mcp: "default_deny",
    web: "default_deny"
  },
  defaultFieldStatus: "default_deny",
  entitlementPolicies: [],
  fieldPolicies: [],
  maxRows: 500,
  maxWindowDays: 366,
  methodologyVersion: DATA_ACCESS_GATEWAY_VERSION,
  rightsPolicyVersion: "gate0-default-deny-v0"
};

const FIELD_AUTHORIZATION_CONFIG_TABLES: FieldAuthorizationConfigChangePlan["tables"] = [
  "core.data_entitlement",
  "core.workspace_entitlement",
  "core.field_authorization_change",
  "audit.field_authorization_approval",
  "governance.field_authorization_config_contract"
];
const P0_RIGHTS_MATRIX_COVERAGE_TABLES: P0RightsMatrixCoverageCapabilities["tables"] = [
  "core.p0_rights_matrix_entry",
  "governance.p0_rights_matrix_contract"
];
const DATA_COVERAGE_RELEASE_GATE_TABLES: DataCoverageReleaseGateCapabilities["tables"] = [
  "core.data_coverage_release_gate",
  "governance.data_coverage_release_gate_contract"
];
const P0_RIGHTS_MATRIX_REQUIRED_SIGNOFFS: P0RightsMatrixCoverageReport["release_gate"]["required_signoffs"] = [
  "data_partner",
  "commercial_owner",
  "legal_compliance"
];
const DATA_COVERAGE_REQUIRED_SIGNOFFS: DataCoverageReleaseGateReport["release_gate"]["required_signoffs"] = [
  "data_engineering",
  "data_partner",
  "quality_owner"
];
const DATA_COVERAGE_RELEASE_BLOCKERS: DataCoverageReleaseGateReport["release_gate"]["blockers"] = [
  "partner_coverage_files_missing",
  "live_freshness_policy_not_loaded",
  "golden_coverage_not_signed_off"
];
const DATA_COVERAGE_FRESHNESS_MARKERS: DataCoverageReleaseGateReport["freshness_markers"] = [
  {
    display_label: "Realtime",
    label_required: true,
    live_partner_rows_loaded: false,
    min_delay_minutes: 0,
    release_state: "contracted_no_live_partner_rows",
    supported_tool_surfaces: ["get_quote_snapshot"],
    tier: "realtime"
  },
  {
    display_label: "Delayed",
    label_required: true,
    live_partner_rows_loaded: false,
    min_delay_minutes: 15,
    release_state: "contracted_no_live_partner_rows",
    supported_tool_surfaces: ["get_quote_snapshot", "get_price_history"],
    tier: "delayed"
  },
  {
    display_label: "EOD",
    label_required: true,
    live_partner_rows_loaded: false,
    release_state: "contracted_no_live_partner_rows",
    supported_tool_surfaces: ["get_quote_snapshot", "get_price_history", "get_market_calendar"],
    tier: "eod"
  }
];
const DATA_COVERAGE_DOMAIN_COVERAGE: DataCoverageReleaseGateReport["coverage_domains"] = [
  {
    blocks_release_until_verified: true,
    coverage_required: true,
    domain: "corporate_actions",
    evidence_surfaces: ["get_corporate_actions", "corporate_action_adjustment_engine"],
    live_partner_rows_loaded: false,
    status: "scaffold_covered_no_live_partner_rows",
    tables: ["core.corporate_action", "core.price_adjustment_factor"]
  },
  {
    blocks_release_until_verified: true,
    coverage_required: true,
    domain: "financial_restatements",
    evidence_surfaces: ["get_financial_facts", "financial_restatement_engine"],
    live_partner_rows_loaded: false,
    status: "scaffold_covered_no_live_partner_rows",
    tables: ["core.financial_statement", "core.financial_fact", "core.financial_restatement"]
  },
  {
    blocks_release_until_verified: true,
    coverage_required: true,
    domain: "delistings",
    evidence_surfaces: ["resolve_security", "get_security_profile", "get_security_history"],
    live_partner_rows_loaded: false,
    status: "scaffold_covered_no_live_partner_rows",
    tables: ["core.security_master", "core.listing", "core.identifier_history"]
  },
  {
    blocks_release_until_verified: true,
    coverage_required: true,
    domain: "identifier_history",
    evidence_surfaces: ["resolve_security", "get_security_history"],
    live_partner_rows_loaded: false,
    status: "scaffold_covered_no_live_partner_rows",
    tables: ["core.identifier_history", "core.security_name_history"]
  }
];
const P0_RIGHTS_MATRIX_DATASET_FIELDS: P0RightsMatrixCoverageReport["dataset_field_coverage"] = [
  {
    dataset: "security_master",
    field_patterns: ["instrument_id", "symbol", "company_name", "listing_status", "currency"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "market_calendar",
    field_patterns: ["date", "session_status", "holiday_name", "timezone"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "quote_snapshot",
    field_patterns: ["last_price", "bid", "ask", "volume", "delay_minutes"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "price_history",
    field_patterns: ["open", "high", "low", "close", "volume", "adjustment_factor"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "corporate_actions",
    field_patterns: ["action_type", "effective_date", "terms", "adjustment_impact"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "financial_facts",
    field_patterns: ["metric_id", "period_end", "value", "currency", "restatement_version"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "announcements",
    field_patterns: ["document_id", "published_at", "title", "excerpt", "source_record_id"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "derived_analytics",
    field_patterns: ["return", "risk", "ratio", "screen_result", "event_study_metric"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  },
  {
    dataset: "evidence_lineage",
    field_patterns: ["source_record_id", "data_version", "methodology_version", "rights_policy_version"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  }
];

export function evaluateDataAccessRequest(
  request: DataAccessRequest,
  policy: DataAccessPolicy = DEFAULT_DATA_ACCESS_POLICY
): DataAccessDecision {
  const requestedFields = normalizeFields(request.requestedFields);
  const timeWindowDays = calculateWindowDays(request.timeRange);
  const limitError = getLimitError(request, policy, timeWindowDays);
  const qualityError = getQualityError(request.qualityState);
  const fieldDecision = evaluateFields(request, requestedFields, policy, timeWindowDays);
  const servedRows =
    limitError || qualityError || fieldDecision.allowedFields.length === 0
      ? 0
      : Math.min(request.requestedRows, policy.maxRows);
  const status = getDecisionStatus(fieldDecision.allowedFields, fieldDecision.deniedFields);
  const error = qualityError ?? limitError ?? getRightsError(status);
  const finalStatus: DataAccessDecisionStatus =
    qualityError !== undefined ? "quality_hold" : error !== undefined ? "deny" : status;
  const finalAllowedFields =
    finalStatus === "quality_hold" ? [] : fieldDecision.allowedFields;
  const servingRead = createServingReadPlan({
    allowedFields: finalAllowedFields,
    dataVersion: "gateway-scaffold-v0",
    dataset: request.dataset,
    errorCode: error?.code,
    gatewayStatus: finalStatus,
    maxRows: policy.maxRows,
    methodologyVersion: policy.methodologyVersion,
    qualityState: request.qualityState,
    requestedFields,
    requestedRows: request.requestedRows,
    rightsPolicyVersion: policy.rightsPolicyVersion,
    timeRange: request.timeRange
  });
  const servingQuery = createServingQueryPlan({
    readPlan: servingRead,
    releaseState:
      finalStatus === "allow" || finalStatus === "allow_with_redactions"
        ? "released"
        : "held",
    rowCount: servedRows,
    servingSnapshotId: "serving-snapshot-scaffold-v0",
    snapshotQualityState: request.qualityState
  });
  const servingSqlDescriptor = createServingSqlDescriptor({
    queryPlan: servingQuery
  });
  const servingSqlText = createServingSqlTextPlan({
    descriptor: servingSqlDescriptor
  });
  const servingExecution = createServingExecutionAdapterPlan({
    sqlTextPlan: servingSqlText
  });
  const warnings = getWarnings(request.qualityState, fieldDecision.deniedFields);
  const usage: UsageSummary = {
    cached: false,
    credits: servedRows > 0 ? 1 : 0,
    rows: servedRows
  };
  const cacheKey = createDataAccessCacheKey(request, policy, fieldDecision.allowedFields);
  const provenance: ProvenanceRef[] = [
    {
      data_version: "gateway-scaffold-v0",
      methodology_version: policy.methodologyVersion,
      source: "data-access-gateway",
      source_record_id: "policy-evaluation"
    }
  ];
  const usageLedger = createUsageLedgerEventPlan({
    accountId: request.accountId,
    cached: usage.cached,
    channel: request.channel,
    credits: usage.credits,
    dataVersion: "gateway-scaffold-v0",
    dataset: request.dataset,
    errorCode: error?.code,
    gatewayStatus: finalStatus,
    membershipId: request.membershipId,
    meteredFields: finalAllowedFields.length,
    meteredRows: usage.rows,
    methodologyVersion: policy.methodologyVersion,
    occurredAt: request.occurredAt ?? "1970-01-01T00:00:00.000Z",
    qualityState: request.qualityState,
    requestId: request.requestId ?? "request_unattributed",
    rightsPolicyVersion: policy.rightsPolicyVersion,
    runId: request.runId,
    sourceRecordId: "policy-evaluation",
    subscriptionId: request.subscriptionId,
    workspaceId: request.workspaceId
  });

  return {
    allowedFields: finalAllowedFields,
    cacheKey,
    dataVersion: "gateway-scaffold-v0",
    deniedFields: fieldDecision.deniedFields,
    error,
    limits: {
      maxRows: policy.maxRows,
      maxWindowDays: policy.maxWindowDays,
      requestedRows: request.requestedRows,
      servedRows,
      timeWindowDays
    },
    methodologyVersion: policy.methodologyVersion,
    provenance,
    qualityState: request.qualityState,
    rightsPolicyVersion: policy.rightsPolicyVersion,
    servingExecution,
    servingQuery,
    servingRead,
    servingResult: createDataAccessServingResult({
      allowedFields: finalAllowedFields,
      cacheKey,
      dataVersion: "gateway-scaffold-v0",
      dataset: request.dataset,
      deniedFields: fieldDecision.deniedFields,
      methodologyVersion: policy.methodologyVersion,
      provenance,
      requestedFields,
      rightsPolicyVersion: policy.rightsPolicyVersion,
      servingExecution,
      usage,
      warnings
    }),
    servingSqlDescriptor,
    servingSqlText,
    status: finalStatus,
    usage,
    usageLedger,
    warnings
  };
}

export function createDataAccessServingResult(input: {
  allowedFields: string[];
  cacheKey: string;
  dataVersion: string;
  dataset: string;
  deniedFields: DataAccessDecision["deniedFields"];
  methodologyVersion: string;
  provenance: ProvenanceRef[];
  requestedFields: string[];
  rightsPolicyVersion: string;
  servingExecution: ServingExecutionAdapterPlan;
  usage: UsageSummary;
  warnings: string[];
}): DataAccessServingResult {
  const status: DataAccessServingResultStatus =
    input.servingExecution.status === "execution_deferred"
      ? "result_deferred"
      : "result_blocked";

  return {
    allowedFields: input.allowedFields,
    blockedReason: input.servingExecution.blockedReason,
    cacheKey: input.cacheKey,
    dataVersion: input.dataVersion,
    dataset: input.dataset,
    deferredReason: input.servingExecution.deferredReason,
    deniedFields: input.deniedFields,
    envelopeFields: ["as_of", "market_status", "provenance", "usage"],
    executionStatus: input.servingExecution.status,
    liveDataAccess: false,
    liveRead: false,
    marketStatus: "not_applicable",
    methodologyVersion: input.methodologyVersion,
    provenance: input.provenance,
    requestedFields: input.requestedFields,
    rightsPolicyVersion: input.rightsPolicyVersion,
    rows: [],
    rowCount: 0,
    servedRows: 0,
    sqlExecuted: false,
    sqlTextAccepted: input.servingExecution.sqlTextAccepted,
    statementId: input.servingExecution.statementId,
    status,
    usage: input.usage,
    warnings: input.warnings
  };
}

export function createRestrictedExportPlan(
  input: RestrictedExportPlanInput,
  policy: DataAccessPolicy = createSyntheticRestrictedExportPolicy()
): RestrictedExportPlan {
  const requestId = input.requestId ?? "request_unattributed";
  const format = normalizeRestrictedExportFormat(input.format ?? "csv");
  const scopeGranted = (input.scopes ?? []).includes("exports.read");

  if (format === undefined) {
    return createRestrictedExportPlanResult({
      dataset: input.dataset,
      format,
      maxRows: policy.maxRows,
      requestId,
      requestedRows: input.requestedRows,
      rightsPolicyVersion: policy.rightsPolicyVersion,
      scopeGranted,
      servedRows: 0,
      status: "blocked_unsupported_format"
    });
  }

  if (!scopeGranted) {
    return createRestrictedExportPlanResult({
      dataset: input.dataset,
      format,
      maxRows: policy.maxRows,
      requestId,
      requestedRows: input.requestedRows,
      rightsPolicyVersion: policy.rightsPolicyVersion,
      scopeGranted,
      servedRows: 0,
      status: "blocked_missing_scope"
    });
  }

  const decision = evaluateDataAccessRequest(
    {
      accountId: input.accountId,
      channel: "export",
      dataset: input.dataset,
      exportRequested: true,
      occurredAt: "1970-01-01T00:00:00.000Z",
      plan: input.plan,
      qualityState: input.qualityState ?? "PASS",
      requestId,
      requestedFields: input.fields,
      requestedRows: input.requestedRows,
      runId: input.runId,
      timeRange: input.timeRange,
      workspaceId: input.workspaceId
    },
    policy
  );
  const status: RestrictedExportStatus =
    decision.error === undefined && decision.allowedFields.length > 0
      ? "planned_no_write"
      : "blocked_gateway_denied";

  return createRestrictedExportPlanResult({
    dataset: input.dataset,
    decision,
    format,
    maxRows: decision.limits.maxRows,
    requestId,
    requestedRows: input.requestedRows,
    rightsPolicyVersion: decision.rightsPolicyVersion,
    scopeGranted,
    servedRows: decision.limits.servedRows,
    status,
    workspaceId: input.workspaceId
  });
}

export function createSyntheticApprovedPolicy(): DataAccessPolicy {
  return {
    ...DEFAULT_DATA_ACCESS_POLICY,
    channels: {
      ...DEFAULT_DATA_ACCESS_POLICY.channels,
      web: "approved"
    },
    fieldPolicies: [
      {
        channel: "web",
        field: "synthetic_profile.company_name",
        status: "approved"
      },
      {
        channel: "web",
        field: "synthetic_quote.close",
        status: "default_deny"
      }
    ],
    entitlementPolicies: [],
    rightsPolicyVersion: "synthetic-policy-v0"
  };
}

export function createSyntheticRestrictedExportPolicy(): DataAccessPolicy {
  return {
    ...DEFAULT_DATA_ACCESS_POLICY,
    channels: {
      ...DEFAULT_DATA_ACCESS_POLICY.channels,
      export: "approved"
    },
    entitlementPolicies: [
      {
        channel: "export",
        dataset: "synthetic_profile",
        exportAllowed: true,
        fieldPattern: "synthetic_profile.company_name",
        maxWindowDays: 31,
        plan: "pro",
        status: "approved",
        workspaceId: "ws_synthetic_export"
      }
    ],
    fieldPolicies: [
      {
        channel: "export",
        dataset: "synthetic_profile",
        field: "synthetic_profile.company_name",
        status: "approved"
      },
      {
        channel: "export",
        dataset: "synthetic_profile",
        field: "synthetic_profile.revenue",
        status: "default_deny"
      }
    ],
    maxRows: 100,
    rightsPolicyVersion: "synthetic-restricted-export-policy-v0"
  };
}

export function createSyntheticWorkspaceEntitlementPolicy(): DataAccessPolicy {
  return {
    ...DEFAULT_DATA_ACCESS_POLICY,
    channels: {
      ...DEFAULT_DATA_ACCESS_POLICY.channels,
      web: "approved"
    },
    entitlementPolicies: [
      {
        channel: "web",
        dataset: "synthetic_profile",
        exportAllowed: false,
        fieldPattern: "synthetic_profile.company_name",
        maxWindowDays: 31,
        plan: "team",
        status: "approved",
        workspaceId: "ws_synthetic_team"
      }
    ],
    fieldPolicies: [
      {
        channel: "web",
        dataset: "synthetic_profile",
        field: "synthetic_profile.company_name",
        status: "approved"
      },
      {
        channel: "web",
        dataset: "synthetic_profile",
        field: "synthetic_profile.revenue",
        status: "approved"
      }
    ],
    rightsPolicyVersion: "synthetic-workspace-policy-v0"
  };
}

export function createPolicyFromEntitlementRows(
  input: EntitlementPolicySourceInput
): EntitlementPolicySourcePlan {
  const activeSubscriptions = (input.subscriptionRows ?? []).filter((subscription) =>
    isSubscriptionActive(subscription, input.asOf)
  );
  const activeWorkspaceEntitlements = input.workspaceEntitlements.filter((entitlement) =>
    isWorkspaceEntitlementActive(entitlement, input.asOf)
  );
  const entitlementById = new Map(
    input.dataEntitlements.map((entitlement) => [entitlement.entitlementId, entitlement])
  );
  const subscriptionById = new Map(
    activeSubscriptions.map((subscription) => [subscription.subscriptionId, subscription])
  );
  const entitlementPolicies = activeWorkspaceEntitlements.flatMap((workspaceEntitlement) => {
    const dataEntitlement = entitlementById.get(workspaceEntitlement.entitlementId);

    if (dataEntitlement === undefined) {
      return [];
    }

    return [
      {
        channel: dataEntitlement.channel,
        dataset: dataEntitlement.dataset,
        exportAllowed: dataEntitlement.exportAllowed,
        fieldPattern: dataEntitlement.fieldPattern,
        maxWindowDays: dataEntitlement.timeRangeDays,
        plan: getPlanCode(workspaceEntitlement, subscriptionById),
        status: combineEntitlementStatuses(
          dataEntitlement.status,
          workspaceEntitlement.status
        ),
        workspaceId: workspaceEntitlement.workspaceId
      }
    ];
  });
  const activeDataEntitlementIds = new Set(
    activeWorkspaceEntitlements.map((entitlement) => entitlement.entitlementId)
  );
  const activeDataEntitlements = input.dataEntitlements.filter((entitlement) =>
    activeDataEntitlementIds.has(entitlement.entitlementId)
  );
  const fieldPolicies = activeDataEntitlements.map((entitlement) => ({
    channel: entitlement.channel,
    dataset: entitlement.dataset,
    field: entitlement.fieldPattern,
    status: entitlement.status
  }));
  const approvedChannels = new Set([
    ...fieldPolicies
      .filter((policy) => policy.status === "approved")
      .map((policy) => policy.channel),
    ...entitlementPolicies
      .filter((policy) => policy.status === "approved")
      .map((policy) => policy.channel)
  ]);
  const rightsPolicyVersions = [
    ...new Set(activeDataEntitlements.map((entitlement) => entitlement.rightsPolicyVersion))
  ].sort();
  const sourceRecords = [
    ...activeDataEntitlements.map((entitlement) => entitlement.sourceRecordId),
    ...activeWorkspaceEntitlements.map((entitlement) => entitlement.sourceRecordId)
  ].sort();

  return {
    liveDbReads: false,
    partnerRightsMatrixLoaded: false,
    policy: {
      ...DEFAULT_DATA_ACCESS_POLICY,
      channels: {
        api: approvedChannels.has("api") ? "approved" : "default_deny",
        export: approvedChannels.has("export") ? "approved" : "default_deny",
        mcp: approvedChannels.has("mcp") ? "approved" : "default_deny",
        web: approvedChannels.has("web") ? "approved" : "default_deny"
      },
      entitlementPolicies,
      fieldPolicies,
      methodologyVersion: DATA_ACCESS_GATEWAY_VERSION,
      rightsPolicyVersion:
        rightsPolicyVersions.length > 0
          ? rightsPolicyVersions.join("+")
          : DEFAULT_DATA_ACCESS_POLICY.rightsPolicyVersion
    },
    rowCounts: {
      dataEntitlements: input.dataEntitlements.length,
      subscriptionRows: input.subscriptionRows?.length ?? 0,
      workspaceEntitlements: input.workspaceEntitlements.length
    },
    sourceRecords,
    sqlEmitted: false,
    status: "policy_source_scaffold",
    tables: [
      "core.data_entitlement",
      "core.workspace_entitlement",
      "core.workspace_subscription"
    ],
    version: DATA_ACCESS_GATEWAY_VERSION
  };
}

export function createFieldAuthorizationConfigChangePlan(
  input: FieldAuthorizationConfigChangeInput
): FieldAuthorizationConfigChangePlan {
  const operatorId = input.operatorId ?? "operator_unresolved";
  const dataset = input.dataset ?? "dataset_unresolved";
  const fieldPattern = input.fieldPattern ?? "field_unresolved";
  const channel = input.channel ?? "web";
  const plan = input.plan ?? "plan_unresolved";
  const targetStatus = input.targetStatus ?? "default_deny";
  const policyVersion = input.policyVersion ?? "policy_version_unresolved";
  const effectiveAt = input.effectiveAt ?? "effective_at_unresolved";
  const approvalStatus = input.approvalStatus ?? "pending";
  const changeId = `field_auth_change_${sanitizeForId(input.requestId)}_${sanitizeForId(
    dataset
  )}_${sanitizeForId(fieldPattern)}_${channel}`;
  const entitlementId = `data_entitlement_${sanitizeForId(policyVersion)}_${sanitizeForId(
    dataset
  )}_${sanitizeForId(channel)}_${sanitizeForId(fieldPattern)}`;
  const requiredContextPresent =
    input.operatorId !== undefined &&
    input.operatorId.length > 0 &&
    input.dataset !== undefined &&
    input.dataset.length > 0 &&
    input.fieldPattern !== undefined &&
    input.fieldPattern.length > 0 &&
    input.channel !== undefined &&
    input.plan !== undefined &&
    input.plan.length > 0 &&
    input.targetStatus !== undefined &&
    input.policyVersion !== undefined &&
    input.policyVersion.length > 0 &&
    input.effectiveAt !== undefined &&
    input.effectiveAt.length > 0;
  const status = getFieldAuthorizationConfigStatus({
    approvalStatus,
    asOf: input.asOf,
    effectiveAt: input.effectiveAt,
    requiredContextPresent
  });
  const workspaceEntitlementRow =
    input.workspaceId === undefined || input.workspaceId.length === 0
      ? undefined
      : {
          entitlement_id: entitlementId,
          source_record_id: changeId,
          status: targetStatus,
          table: "core.workspace_entitlement" as const,
          valid_from: effectiveAt,
          valid_to: input.expiresAt,
          workspace_entitlement_id: `workspace_entitlement_${sanitizeForId(
            input.workspaceId
          )}_${sanitizeForId(entitlementId)}`,
          workspace_id: input.workspaceId
        };

  return {
    approval: {
      approval_id: `field_auth_approval_${sanitizeForId(input.requestId)}`,
      approved_by: input.approvedBy,
      required: true,
      status: approvalStatus,
      table: "audit.field_authorization_approval",
      write_status: "planned_no_write"
    },
    change: {
      change_id: changeId,
      channel,
      dataset,
      effective_at: effectiveAt,
      expires_at: input.expiresAt,
      export_allowed: input.exportAllowed === true,
      field_pattern: fieldPattern,
      max_window_days: input.maxWindowDays,
      operator_id: operatorId,
      plan,
      policy_version: policyVersion,
      reason: input.reason,
      target_status: targetStatus,
      table: "core.field_authorization_change",
      workspace_id: input.workspaceId,
      write_status: "planned_no_write"
    },
    default_deny_preserved: true,
    frontend: false,
    live_db_reads: false,
    persistent_writes: false,
    policy_effect: {
      active_only_after_effective_at: true,
      activation_status: status,
      compiles_to_gateway_policy: true,
      data_entitlement_row: {
        channel,
        dataset,
        entitlement_id: entitlementId,
        export_allowed: input.exportAllowed === true,
        field_pattern: fieldPattern,
        rights_policy_version: policyVersion,
        source_record_id: changeId,
        status: targetStatus,
        table: "core.data_entitlement",
        time_range_days: input.maxWindowDays
      },
      versioned_cache_key_required: true,
      workspace_entitlement_row: workspaceEntitlementRow
    },
    request_id: input.requestId,
    sql_emitted: false,
    status,
    tables: FIELD_AUTHORIZATION_CONFIG_TABLES,
    validation: {
      approval_required: true,
      effective_time_required: true,
      policy_version_required: true,
      required_context_present: requiredContextPresent
    },
    version: FIELD_AUTHORIZATION_CONFIG_VERSION
  };
}

export function getRestrictedExportCapabilities() {
  return {
    artifact_writes: false,
    frontend: false,
    high_risk_scope: "exports.read" as const,
    live_data_access: false,
    route: "POST /gateway/exports/plan",
    scope_required: true,
    status: "restricted_export_scaffold" as const,
    supported_formats: RESTRICTED_EXPORT_FORMATS,
    uses_data_access_gateway: true,
    watermark_required: true,
    version: RESTRICTED_EXPORT_VERSION
  };
}

export function getFieldAuthorizationConfigCapabilities() {
  return {
    approval_required: true,
    default_deny_preserved: true,
    effective_time_required: true,
    frontend: false,
    live_db_reads: false,
    persistent_writes: false,
    policy_version_required: true,
    route: "POST /gateway/field-authorizations/changes/plan" as const,
    runtime_route: "GET /gateway/runtime" as const,
    sql_emitted: false,
    status: "field_authorization_config_scaffold" as const,
    tables: FIELD_AUTHORIZATION_CONFIG_TABLES,
    version: FIELD_AUTHORIZATION_CONFIG_VERSION
  };
}

export function getP0RightsMatrixCoverageCapabilities(): P0RightsMatrixCoverageCapabilities {
  return {
    default_rights_status: "default_deny",
    enterprise_authorization_configured: true,
    export_authorization_configured: true,
    frontend: false,
    live_rights_matrix_reads: false,
    mcp_authorization_configured: true,
    package: "@aiphabee/data-access-gateway",
    partner_signed_matrix_loaded: false,
    persistent_writes: false,
    required_p0_tool_count: 16,
    required_surfaces: P0_RIGHTS_MATRIX_SURFACES,
    route: "GET /gateway/rights-matrix/p0/coverage",
    runtime_route: "GET /gateway/runtime",
    sql_emitted: false,
    status: "p0_rights_matrix_coverage_scaffold",
    tables: P0_RIGHTS_MATRIX_COVERAGE_TABLES,
    version: P0_RIGHTS_MATRIX_COVERAGE_VERSION,
    web_authorization_configured: true
  };
}

export function createP0RightsMatrixCoverageReport(
  input: P0RightsMatrixCoverageInput
): P0RightsMatrixCoverageReport {
  const uniqueToolNames = [...new Set(input.toolNames.map((tool) => tool.trim()).filter(Boolean))];

  return {
    as_of: normalizeOptionalIdentifier(input.asOf, "as_of_unresolved"),
    capability: getP0RightsMatrixCoverageCapabilities(),
    dataset_field_coverage: P0_RIGHTS_MATRIX_DATASET_FIELDS,
    default_rights_status: "default_deny",
    frontend: false,
    live_rights_matrix_reads: false,
    persistent_writes: false,
    release_gate: {
      gate_status: "blocked_external_rights_matrix",
      partner_signed_matrix_loaded: false,
      required_signoffs: P0_RIGHTS_MATRIX_REQUIRED_SIGNOFFS
    },
    rights_policy_version: normalizeOptionalIdentifier(
      input.rightsPolicyVersion,
      "rights_policy_unresolved"
    ),
    sql_emitted: false,
    status: "p0_rights_matrix_coverage_scaffold",
    surface_coverage: createConfiguredSurfaceCoverage(),
    tables: P0_RIGHTS_MATRIX_COVERAGE_TABLES,
    tool_coverage: uniqueToolNames.map((toolName) => ({
      rights_state: "default_deny_until_partner_matrix_signed",
      surfaces: createDefaultDenySurfaceCoverage(),
      tool_name: toolName
    })),
    validation: {
      all_required_surfaces_configured: true,
      required_p0_tool_count: 16,
      tool_count: uniqueToolNames.length,
      tool_count_matches_registry: uniqueToolNames.length === 16
    },
    version: P0_RIGHTS_MATRIX_COVERAGE_VERSION
  };
}

export function getDataCoverageReleaseGateCapabilities(): DataCoverageReleaseGateCapabilities {
  return {
    coverage_policy_loaded: false,
    frontend: false,
    live_partner_data_reads: false,
    package: "@aiphabee/data-access-gateway",
    persistent_writes: false,
    required_coverage_domains: DATA_COVERAGE_DOMAINS,
    required_freshness_tiers: DATA_COVERAGE_FRESHNESS_TIERS,
    route: "GET /gateway/data-coverage/release-gate",
    runtime_route: "GET /gateway/runtime",
    sql_emitted: false,
    status: "data_coverage_release_gate_scaffold",
    tables: DATA_COVERAGE_RELEASE_GATE_TABLES,
    version: DATA_COVERAGE_RELEASE_GATE_VERSION
  };
}

export function createDataCoverageReleaseGateReport(
  input: DataCoverageReleaseGateInput = {}
): DataCoverageReleaseGateReport {
  return {
    as_of: normalizeOptionalIdentifier(input.asOf, "as_of_unresolved"),
    capability: getDataCoverageReleaseGateCapabilities(),
    coverage_domains: DATA_COVERAGE_DOMAIN_COVERAGE,
    coverage_policy_version: normalizeOptionalIdentifier(
      input.coveragePolicyVersion,
      "coverage_policy_unresolved"
    ),
    frontend: false,
    freshness_markers: DATA_COVERAGE_FRESHNESS_MARKERS,
    live_partner_data_reads: false,
    persistent_writes: false,
    release_gate: {
      blockers: DATA_COVERAGE_RELEASE_BLOCKERS,
      gate_status: "blocked_live_partner_coverage",
      live_partner_coverage_loaded: false,
      required_signoffs: DATA_COVERAGE_REQUIRED_SIGNOFFS
    },
    sql_emitted: false,
    status: "data_coverage_release_gate_scaffold",
    tables: DATA_COVERAGE_RELEASE_GATE_TABLES,
    validation: {
      all_required_coverage_domains_present: DATA_COVERAGE_DOMAINS.every((domain) =>
        DATA_COVERAGE_DOMAIN_COVERAGE.some((entry) => entry.domain === domain)
      ),
      all_required_freshness_tiers_present: DATA_COVERAGE_FRESHNESS_TIERS.every((tier) =>
        DATA_COVERAGE_FRESHNESS_MARKERS.some((entry) => entry.tier === tier)
      ),
      coverage_domain_count: DATA_COVERAGE_DOMAIN_COVERAGE.length,
      freshness_tier_count: DATA_COVERAGE_FRESHNESS_MARKERS.length
    },
    version: DATA_COVERAGE_RELEASE_GATE_VERSION
  };
}

export function getEntitlementPolicySourceCapabilities() {
  return {
    compiles_to_gateway_policy: true,
    default_rights_status: "default_deny" as const,
    live_db_reads: false,
    partner_rights_matrix_loaded: false,
    source_tables: [
      "core.data_entitlement",
      "core.workspace_entitlement",
      "core.workspace_subscription"
    ] as const,
    sql_emitted: false,
    status: "policy_source_scaffold" as const,
    version: DATA_ACCESS_GATEWAY_VERSION
  };
}

export function getServingResultEnvelopeCapabilities() {
  return {
    envelope_fields: ["as_of", "market_status", "provenance", "usage"] as const,
    live_data_access: false,
    market_status: "not_applicable" as const,
    rows_returned: false,
    shared_envelope: true,
    status: "serving_result_envelope_scaffold" as const,
    version: DATA_ACCESS_GATEWAY_VERSION
  };
}

export function createDataAccessCacheKey(
  request: DataAccessRequest,
  policy: DataAccessPolicy,
  allowedFields: string[]
): string {
  const parts = [
    "dag",
    `dataset=${request.dataset}`,
    `channel=${request.channel}`,
    `plan=${request.plan}`,
    `workspace=${request.workspaceId ?? "none"}`,
    `export=${request.exportRequested === true}`,
    `fields=${[...allowedFields].sort().join(",") || "none"}`,
    `data_version=gateway-scaffold-v0`,
    `rights=${policy.rightsPolicyVersion}`,
    `methodology=${policy.methodologyVersion}`,
    `from=${request.timeRange?.from ?? "none"}`,
    `to=${request.timeRange?.to ?? "none"}`
  ];

  return parts.join("|");
}

function createRestrictedExportPlanResult(input: {
  dataset: string;
  decision?: DataAccessDecision;
  format?: RestrictedExportFormat;
  maxRows: number;
  requestId: string;
  requestedRows: number;
  rightsPolicyVersion: string;
  scopeGranted: boolean;
  servedRows: number;
  status: RestrictedExportStatus;
  workspaceId?: string;
}): RestrictedExportPlan {
  const usage: UsageSummary = {
    cached: false,
    credits: input.status === "planned_no_write" ? 1 : 0,
    rows: input.status === "planned_no_write" ? input.servedRows : 0
  };

  return {
    artifact: {
      csv: input.format === "csv" ? "planned_no_write" : "not_requested",
      generated: false,
      image: input.format === "image" ? "planned_no_write" : "not_requested",
      pdf: input.format === "pdf" ? "planned_no_write" : "not_requested",
      r2_write: false
    },
    data_version: "gateway-scaffold-v0",
    dataset: input.dataset,
    export_format: input.format,
    frontend: false,
    gateway_decision:
      input.decision === undefined
        ? undefined
        : {
            allowed_fields: input.decision.allowedFields,
            denied_fields: input.decision.deniedFields,
            error_code: input.decision.error?.code,
            export_requested: true,
            rights_policy_version: input.decision.rightsPolicyVersion,
            status: input.decision.status
          },
    live_data_access: false,
    methodology_version: RESTRICTED_EXPORT_VERSION,
    persistent_writes: false,
    provenance: [
      {
        data_version: "gateway-scaffold-v0",
        methodology_version: RESTRICTED_EXPORT_VERSION,
        source: "data-access-gateway",
        source_record_id: "restricted-export-plan"
      }
    ],
    request_id: input.requestId,
    row_policy: {
      max_rows: input.maxRows,
      requested_rows: input.requestedRows,
      served_rows: input.status === "planned_no_write" ? input.servedRows : 0
    },
    scope: {
      granted: input.scopeGranted,
      required: "exports.read"
    },
    sql_emitted: false,
    status: input.status,
    toolName: "restricted_export_plan",
    usage,
    watermark: {
      fields: [
        "request_id",
        "workspace_id",
        "dataset",
        "rights_policy_version",
        "as_of"
      ],
      required: true,
      text: [
        input.requestId,
        input.workspaceId ?? "workspace_unattributed",
        input.dataset,
        input.rightsPolicyVersion
      ].join("|")
    }
  };
}

function normalizeRestrictedExportFormat(
  value: string
): RestrictedExportFormat | undefined {
  return RESTRICTED_EXPORT_FORMATS.find((format) => format === value);
}

function evaluateFields(
  request: DataAccessRequest,
  requestedFields: string[],
  policy: DataAccessPolicy,
  timeWindowDays: number | undefined
) {
  const channelStatus = policy.channels[request.channel] ?? policy.defaultFieldStatus;

  if (channelStatus !== "approved") {
    return {
      allowedFields: [],
      deniedFields: requestedFields.map((field) => ({
        field,
        reason: "channel_blocked" as const
      }))
    };
  }

  return requestedFields.reduce(
    (accumulator, field) => {
      const fieldPolicy = getFieldPolicy(request, field, policy);
      const fieldStatus = fieldPolicy?.status ?? policy.defaultFieldStatus;

      if (fieldStatus !== "approved") {
        accumulator.deniedFields.push({
          field,
          reason: fieldStatus === "blocked" ? "field_blocked" : "field_default_deny"
        });
        return accumulator;
      }

      const entitlementDecision = evaluateWorkspaceEntitlement(
        request,
        field,
        policy,
        timeWindowDays
      );

      if (entitlementDecision.allowed) {
        accumulator.allowedFields.push(field);
      } else {
        accumulator.deniedFields.push({
          field,
          reason: entitlementDecision.reason
        });
      }

      return accumulator;
    },
    {
      allowedFields: [] as string[],
      deniedFields: [] as DataAccessDecision["deniedFields"]
    }
  );
}

function getFieldPolicy(
  request: DataAccessRequest,
  field: string,
  policy: DataAccessPolicy
) {
  const matchingPolicies = policy.fieldPolicies.filter(
    (policyEntry) =>
      policyEntry.channel === request.channel &&
      matchesFieldPattern(policyEntry.field, field) &&
      (policyEntry.dataset === undefined || policyEntry.dataset === request.dataset) &&
      (policyEntry.plan === undefined || policyEntry.plan === request.plan)
  );

  return (
    matchingPolicies.find((policyEntry) => policyEntry.status === "blocked") ??
    matchingPolicies.find((policyEntry) => policyEntry.status === "approved") ??
    matchingPolicies[0]
  );
}

function evaluateWorkspaceEntitlement(
  request: DataAccessRequest,
  field: string,
  policy: DataAccessPolicy,
  timeWindowDays: number | undefined
): { allowed: true } | { allowed: false; reason: DataAccessDeniedReason } {
  if (policy.entitlementPolicies.length === 0) {
    return { allowed: true };
  }

  if (request.workspaceId === undefined || request.workspaceId.length === 0) {
    return {
      allowed: false,
      reason: "workspace_entitlement_default_deny"
    };
  }

  const matchingEntitlements = policy.entitlementPolicies.filter(
    (entitlement) =>
      entitlement.workspaceId === request.workspaceId &&
      (entitlement.plan === "*" || entitlement.plan === request.plan) &&
      entitlement.dataset === request.dataset &&
      entitlement.channel === request.channel &&
      matchesFieldPattern(entitlement.fieldPattern, field)
  );
  const blockedEntitlement = matchingEntitlements.find(
    (entitlement) => entitlement.status === "blocked"
  );

  if (blockedEntitlement !== undefined) {
    return {
      allowed: false,
      reason: "workspace_entitlement_blocked"
    };
  }

  const approvedEntitlement = matchingEntitlements.find(
    (entitlement) => entitlement.status === "approved"
  );

  if (approvedEntitlement === undefined) {
    return {
      allowed: false,
      reason: "workspace_entitlement_default_deny"
    };
  }

  if (request.exportRequested === true && !approvedEntitlement.exportAllowed) {
    return {
      allowed: false,
      reason: "export_blocked"
    };
  }

  if (
    timeWindowDays !== undefined &&
    approvedEntitlement.maxWindowDays !== undefined &&
    timeWindowDays > approvedEntitlement.maxWindowDays
  ) {
    return {
      allowed: false,
      reason: "time_range_blocked"
    };
  }

  return { allowed: true };
}

function matchesFieldPattern(pattern: string, field: string): boolean {
  if (pattern === "*") {
    return true;
  }

  if (pattern.endsWith(".*")) {
    return field.startsWith(pattern.slice(0, -1));
  }

  return pattern === field;
}

function getDecisionStatus(
  allowedFields: string[],
  deniedFields: DataAccessDecision["deniedFields"]
): DataAccessDecisionStatus {
  if (allowedFields.length === 0) {
    return "deny";
  }

  if (deniedFields.length > 0) {
    return "allow_with_redactions";
  }

  return "allow";
}

function getRightsError(
  status: DataAccessDecisionStatus
): DataAccessDecision["error"] | undefined {
  if (status !== "deny") {
    return undefined;
  }

  return {
    code: "DATA_NOT_LICENSED",
    message: "requested fields are not licensed for this channel and policy"
  };
}

function getQualityError(
  qualityState: DataQualityState
): DataAccessDecision["error"] | undefined {
  if (qualityState !== "HOLD" && qualityState !== "REJECT_RAW") {
    return undefined;
  }

  return {
    code: "DATA_QUALITY_HOLD",
    message: "requested data is isolated by quality rules"
  };
}

function getLimitError(
  request: DataAccessRequest,
  policy: DataAccessPolicy,
  timeWindowDays: number | undefined
): DataAccessDecision["error"] | undefined {
  if (request.requestedRows > policy.maxRows) {
    return {
      code: "TOO_MANY_ROWS",
      message: "requested row count exceeds gateway limit"
    };
  }

  if (timeWindowDays !== undefined && timeWindowDays > policy.maxWindowDays) {
    return {
      code: "OUT_OF_RANGE",
      message: "requested time range exceeds gateway limit"
    };
  }

  return undefined;
}

function getWarnings(
  qualityState: DataQualityState,
  deniedFields: DataAccessDecision["deniedFields"]
): string[] {
  const warnings: string[] = [];

  if (qualityState === "WARN") {
    warnings.push("quality_state_warn");
  }

  if (deniedFields.length > 0) {
    warnings.push("field_redactions_applied");
  }

  return warnings;
}

function normalizeFields(fields: string[]): string[] {
  return [...new Set(fields.filter((field) => field.length > 0))].sort();
}

function calculateWindowDays(timeRange: DataAccessRequest["timeRange"]) {
  if (!timeRange) {
    return undefined;
  }

  const from = Date.parse(`${timeRange.from}T00:00:00Z`);
  const to = Date.parse(`${timeRange.to}T00:00:00Z`);

  if (Number.isNaN(from) || Number.isNaN(to)) {
    return undefined;
  }

  return Math.floor((to - from) / 86_400_000) + 1;
}

function isWorkspaceEntitlementActive(
  entitlement: WorkspaceEntitlementRow,
  asOf: string
): boolean {
  return isWithinInterval(asOf, entitlement.validFrom, entitlement.validTo);
}

function isSubscriptionActive(
  subscription: WorkspaceSubscriptionRow,
  asOf: string
): boolean {
  return (
    ["active", "grace_period", "trialing"].includes(subscription.billingState) &&
    isWithinInterval(asOf, subscription.validFrom, subscription.validTo)
  );
}

function isWithinInterval(asOf: string, validFrom: string, validTo?: string): boolean {
  const asOfTime = Date.parse(asOf);
  const fromTime = Date.parse(validFrom);
  const toTime = validTo === undefined ? undefined : Date.parse(validTo);

  if (Number.isNaN(asOfTime) || Number.isNaN(fromTime)) {
    return false;
  }

  return asOfTime >= fromTime && (toTime === undefined || asOfTime < toTime);
}

function getPlanCode(
  entitlement: WorkspaceEntitlementRow,
  subscriptions: Map<string, WorkspaceSubscriptionRow>
): string {
  if (entitlement.subscriptionId === undefined) {
    return "*";
  }

  return subscriptions.get(entitlement.subscriptionId)?.planCode ?? "subscription_unresolved";
}

function combineEntitlementStatuses(
  dataStatus: DataAccessFieldStatus,
  workspaceStatus: DataAccessFieldStatus
): DataAccessFieldStatus {
  if (dataStatus === "blocked" || workspaceStatus === "blocked") {
    return "blocked";
  }

  if (dataStatus === "approved" && workspaceStatus === "approved") {
    return "approved";
  }

  return "default_deny";
}

function getFieldAuthorizationConfigStatus(input: {
  approvalStatus: FieldAuthorizationApprovalStatus;
  asOf?: string;
  effectiveAt?: string;
  requiredContextPresent: boolean;
}): FieldAuthorizationConfigStatus {
  if (!input.requiredContextPresent) {
    return "blocked_missing_context";
  }

  if (input.approvalStatus === "rejected") {
    return "rejected";
  }

  if (input.approvalStatus !== "approved") {
    return "awaiting_approval";
  }

  const asOfTime = Date.parse(input.asOf ?? "1970-01-01T00:00:00.000Z");
  const effectiveAtTime = Date.parse(input.effectiveAt ?? "");

  if (!Number.isNaN(asOfTime) && !Number.isNaN(effectiveAtTime) && effectiveAtTime > asOfTime) {
    return "scheduled";
  }

  return "active_preview";
}

function createDefaultDenySurfaceCoverage(): Record<
  P0RightsMatrixSurface,
  "configured_default_deny"
> {
  return {
    enterprise: "configured_default_deny",
    export: "configured_default_deny",
    mcp: "configured_default_deny",
    web: "configured_default_deny"
  };
}

function createConfiguredSurfaceCoverage(): P0RightsMatrixCoverageReport["surface_coverage"] {
  return {
    enterprise: {
      configured: true,
      default_rights_status: "default_deny"
    },
    export: {
      configured: true,
      default_rights_status: "default_deny"
    },
    mcp: {
      configured: true,
      default_rights_status: "default_deny"
    },
    web: {
      configured: true,
      default_rights_status: "default_deny"
    }
  };
}

function normalizeOptionalIdentifier(value: string | undefined, fallback: string): string {
  return value !== undefined && value.length > 0 ? value : fallback;
}

function sanitizeForId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "unset";
}
