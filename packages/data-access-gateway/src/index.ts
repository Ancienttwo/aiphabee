import type { AiphaBeeErrorCode, ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";
import {
  createServingQualityReleasePlan,
  createServingExecutionAdapterPlan,
  createServingQueryPlan,
  createServingReadPlan,
  createServingSqlDescriptor,
  createServingSqlTextPlan,
  type ServingExecutionAdapterPlan,
  type ServingQualityReleasePlan,
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
export const FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION =
  "2026-06-22.phase1.field-rights-live-policy-source-readiness.v0";
export const FIELD_RIGHTS_LIVE_POLICY_SOURCE_FIXTURE_VERSION =
  "field-rights-live-policy-source@partner-db-fixture-v0";
export const SERVING_QUALITY_LIVE_READINESS_VERSION =
  "2026-06-22.phase1.serving-quality-live-readiness.v0";
export const SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION =
  "serving-quality-live-readiness@quality-release-fixture-v0";
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
export type FieldRightsLivePolicySourceStatus =
  "live_policy_source_readiness_passed";
export type FieldRightsLivePolicySourceActivationStatus =
  "blocked_external_activation";
export type ServingQualityLiveReadinessStatus =
  "serving_quality_live_readiness_passed";
export type ServingQualityLiveActivationStatus =
  "blocked_live_serving_activation";

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
  required_p0_tool_count: number;
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
    required_p0_tool_count: number;
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

export interface FieldRightsPartnerMatrixFixtureRow {
  cache_policy: "no_client_cache" | "rights_policy_versioned_cache";
  channel: DataAccessChannel;
  dataset: string;
  export_allowed: boolean;
  field_pattern: string;
  history_window_days: number;
  owner_source: "data_partner" | "hkex" | "issuer_document" | "third_party_estimate";
  plan: string;
  redistribution: "machine_readable_allowed" | "web_display_only";
  source_record_id: string;
  subscriber_reporting_required: boolean;
  usage_region: "HK" | "global";
}

export interface FieldRightsLivePolicySourceCapabilities {
  compiles_partner_matrix_to_db_rows: true;
  compiles_to_gateway_policy: true;
  default_deny_preserved: true;
  external_activation_status: FieldRightsLivePolicySourceActivationStatus;
  fixture_version: typeof FIELD_RIGHTS_LIVE_POLICY_SOURCE_FIXTURE_VERSION;
  frontend: false;
  live_db_reads: false;
  live_partner_rights_matrix_reads: false;
  package: "@aiphabee/data-access-gateway";
  persistent_writes: false;
  required_dimensions: readonly [
    "workspace",
    "plan",
    "channel",
    "dataset",
    "field",
    "time_range",
    "export"
  ];
  route: "GET /gateway/field-rights/live-policy-source/readiness";
  runtime_route: "GET /gateway/runtime";
  sql_emitted: false;
  status: "field_rights_live_policy_source_readiness_scaffold";
  version: typeof FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION;
}

export interface FieldRightsLivePolicySourceReport {
  as_of: string;
  capability: FieldRightsLivePolicySourceCapabilities;
  default_rights_status: "default_deny";
  external_activation: {
    blockers: readonly [
      "partner_signed_matrix_absent",
      "live_db_read_path_not_enabled",
      "ops_cutover_not_approved"
    ];
    status: FieldRightsLivePolicySourceActivationStatus;
  };
  fixture_version: typeof FIELD_RIGHTS_LIVE_POLICY_SOURCE_FIXTURE_VERSION;
  frontend: false;
  live_db_reads: false;
  live_partner_rights_matrix_reads: false;
  partner_matrix_fixture: {
    matrix_rows: readonly FieldRightsPartnerMatrixFixtureRow[];
    required_prd_dimensions: readonly string[];
    signed_external_matrix_loaded: false;
  };
  persistent_writes: false;
  policy_source: EntitlementPolicySourcePlan;
  readiness: {
    db_rows_compiled: boolean;
    default_deny_preserved: boolean;
    partner_matrix_fixture_loaded: boolean;
    runtime_smoke_passed: boolean;
    versioned_cache_key_verified: boolean;
  };
  rights_policy_version: string;
  runtime_smoke: Array<{
    allowed_fields: string[];
    cache_key_contains_policy_version: boolean;
    denied_reasons: string[];
    expected_allowed_fields: string[];
    expected_denied_reasons: string[];
    expected_status: DataAccessDecisionStatus;
    scenario_id: string;
    status: "fail" | "pass";
  }>;
  sql_emitted: false;
  status: FieldRightsLivePolicySourceStatus;
  validation: {
    partner_matrix_rows: number;
    smoke_count: number;
    source_records: number;
  };
  version: typeof FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION;
}

export interface ServingQualityLiveReadinessCapabilities {
  fixture_version: typeof SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION;
  frontend: false;
  live_partner_rows_loaded: false;
  live_serving_reads: false;
  live_serving_sql_execution: false;
  package: "@aiphabee/data-access-gateway";
  persistent_writes: false;
  required_quality_states: readonly ["PASS", "WARN", "HOLD", "REJECT_RAW"];
  route: "GET /gateway/serving-quality/live-readiness";
  runtime_route: "GET /gateway/runtime";
  sql_executed: false;
  status: "serving_quality_live_readiness_scaffold";
  tables: readonly [
    "core.serving_dataset",
    "core.serving_field",
    "core.serving_snapshot",
    "core.serving_record"
  ];
  validates_gateway_quality_hold: true;
  validates_release_isolation: true;
  validates_sql_execution_guard: true;
  version: typeof SERVING_QUALITY_LIVE_READINESS_VERSION;
}

export interface ServingQualityLiveReadinessReport {
  as_of: string;
  capability: ServingQualityLiveReadinessCapabilities;
  activation: {
    blockers: readonly [
      "partner_serving_rows_absent",
      "live_hyperdrive_execution_disabled",
      "quality_owner_cutover_not_approved"
    ];
    required_signoffs: readonly ["data_engineering", "data_partner", "quality_owner"];
    status: ServingQualityLiveActivationStatus;
  };
  fixture_version: typeof SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION;
  frontend: false;
  live_partner_rows_loaded: false;
  live_serving_reads: false;
  live_serving_sql_execution: false;
  persistent_writes: false;
  quality_release_checks: Array<{
    expected_gateway_error_code?: AiphaBeeErrorCode;
    expected_release_state: ServingQualityReleasePlan["releaseState"];
    expected_serving_query_status: ServingQueryPlan["status"];
    expected_sql_text_status: ServingSqlTextPlan["status"];
    gateway_error_code?: AiphaBeeErrorCode;
    gateway_status: DataAccessDecisionStatus;
    quality_state: DataQualityState;
    release_state: ServingQualityReleasePlan["releaseState"];
    scenario_id: string;
    serving_execution_status: ServingExecutionAdapterPlan["status"];
    serving_query_status: ServingQueryPlan["status"];
    sql_executed: false;
    sql_text_emitted: boolean;
    sql_text_status: ServingSqlTextPlan["status"];
    status: "fail" | "pass";
  }>;
  readiness: {
    gateway_quality_hold_guard_passed: boolean;
    no_blocked_quality_sql_execution: boolean;
    no_live_reads_or_writes: boolean;
    release_mapping_passed: boolean;
    sql_execution_guard_passed: boolean;
  };
  release_fixture: Array<{
    expected_gateway_error_code?: AiphaBeeErrorCode;
    expected_release_state: ServingQualityReleasePlan["releaseState"];
    quality_state: DataQualityState;
    scenario_id: string;
    source_record_id: string;
  }>;
  sql_executed: false;
  status: ServingQualityLiveReadinessStatus;
  validation: {
    blocked_quality_states: number;
    quality_state_count: number;
    smoke_count: number;
  };
  version: typeof SERVING_QUALITY_LIVE_READINESS_VERSION;
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
const P0_RIGHTS_MATRIX_REQUIRED_TOOL_COUNT = 23;
const DATA_COVERAGE_RELEASE_GATE_TABLES: DataCoverageReleaseGateCapabilities["tables"] = [
  "core.data_coverage_release_gate",
  "governance.data_coverage_release_gate_contract"
];
const FIELD_RIGHTS_LIVE_POLICY_REQUIRED_DIMENSIONS = [
  "workspace",
  "plan",
  "channel",
  "dataset",
  "field",
  "time_range",
  "export"
] as const;
const FIELD_RIGHTS_EXTERNAL_ACTIVATION_BLOCKERS: FieldRightsLivePolicySourceReport["external_activation"]["blockers"] =
  [
    "partner_signed_matrix_absent",
    "live_db_read_path_not_enabled",
    "ops_cutover_not_approved"
  ];
const SERVING_QUALITY_REQUIRED_STATES: ServingQualityLiveReadinessCapabilities["required_quality_states"] =
  ["PASS", "WARN", "HOLD", "REJECT_RAW"];
const SERVING_QUALITY_LIVE_READINESS_TABLES: ServingQualityLiveReadinessCapabilities["tables"] = [
  "core.serving_dataset",
  "core.serving_field",
  "core.serving_snapshot",
  "core.serving_record"
];
const SERVING_QUALITY_ACTIVATION_BLOCKERS: ServingQualityLiveReadinessReport["activation"]["blockers"] =
  [
    "partner_serving_rows_absent",
    "live_hyperdrive_execution_disabled",
    "quality_owner_cutover_not_approved"
  ];
const SERVING_QUALITY_REQUIRED_SIGNOFFS: ServingQualityLiveReadinessReport["activation"]["required_signoffs"] =
  ["data_engineering", "data_partner", "quality_owner"];
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
  },
  {
    dataset: "ipo_pipeline",
    field_patterns: ["ipo_id", "hkex_code", "offer_price", "cornerstone_amount", "forecast_metric"],
    rights_state: "default_deny_until_partner_matrix_signed",
    surfaces: createDefaultDenySurfaceCoverage()
  }
];
const FIELD_RIGHTS_REQUIRED_PRD_DIMENSIONS = [
  "owner_source",
  "web_display",
  "mcp_api_redistribution",
  "raw_vs_derived",
  "freshness_tier",
  "history_window",
  "export_and_cache",
  "user_type_region",
  "subscriber_reporting",
  "audit_termination",
  "commercial_terms"
] as const;
const FIELD_RIGHTS_POLICY_FIXTURE_AS_OF = "2026-06-22T00:00:00.000Z";
const FIELD_RIGHTS_POLICY_VERSION = "field-rights-live-policy-source-fixture-v0";
const FIELD_RIGHTS_PARTNER_MATRIX_FIXTURE: readonly FieldRightsPartnerMatrixFixtureRow[] = [
  {
    cache_policy: "rights_policy_versioned_cache",
    channel: "mcp",
    dataset: "quote_snapshot",
    export_allowed: false,
    field_pattern: "quote_snapshot.last_price",
    history_window_days: 31,
    owner_source: "data_partner",
    plan: "developer",
    redistribution: "machine_readable_allowed",
    source_record_id: "partner_matrix_quote_last_price_developer_mcp",
    subscriber_reporting_required: true,
    usage_region: "HK"
  },
  {
    cache_policy: "no_client_cache",
    channel: "mcp",
    dataset: "quote_snapshot",
    export_allowed: false,
    field_pattern: "quote_snapshot.volume",
    history_window_days: 31,
    owner_source: "hkex",
    plan: "developer",
    redistribution: "web_display_only",
    source_record_id: "partner_matrix_quote_volume_developer_mcp_blocked",
    subscriber_reporting_required: true,
    usage_region: "HK"
  },
  {
    cache_policy: "rights_policy_versioned_cache",
    channel: "web",
    dataset: "financial_facts",
    export_allowed: true,
    field_pattern: "financial_facts.revenue",
    history_window_days: 366,
    owner_source: "issuer_document",
    plan: "pro",
    redistribution: "web_display_only",
    source_record_id: "partner_matrix_financial_revenue_pro_web",
    subscriber_reporting_required: false,
    usage_region: "global"
  },
  {
    cache_policy: "rights_policy_versioned_cache",
    channel: "export",
    dataset: "price_history",
    export_allowed: true,
    field_pattern: "price_history.close",
    history_window_days: 31,
    owner_source: "data_partner",
    plan: "team",
    redistribution: "machine_readable_allowed",
    source_record_id: "partner_matrix_price_history_close_team_export",
    subscriber_reporting_required: true,
    usage_region: "HK"
  }
];
const FIELD_RIGHTS_DATA_ENTITLEMENT_ROWS: readonly DataEntitlementRow[] = [
  {
    channel: "mcp",
    dataset: "quote_snapshot",
    entitlementId: "ent_quote_last_price_developer_mcp",
    exportAllowed: false,
    fieldPattern: "quote_snapshot.last_price",
    rightsPolicyVersion: FIELD_RIGHTS_POLICY_VERSION,
    sourceRecordId: "data_entitlement_quote_last_price_developer_mcp",
    status: "approved",
    timeRangeDays: 31
  },
  {
    channel: "mcp",
    dataset: "quote_snapshot",
    entitlementId: "ent_quote_volume_developer_mcp_blocked",
    exportAllowed: false,
    fieldPattern: "quote_snapshot.volume",
    rightsPolicyVersion: FIELD_RIGHTS_POLICY_VERSION,
    sourceRecordId: "data_entitlement_quote_volume_developer_mcp_blocked",
    status: "blocked",
    timeRangeDays: 31
  },
  {
    channel: "web",
    dataset: "financial_facts",
    entitlementId: "ent_financial_revenue_pro_web",
    exportAllowed: true,
    fieldPattern: "financial_facts.revenue",
    rightsPolicyVersion: FIELD_RIGHTS_POLICY_VERSION,
    sourceRecordId: "data_entitlement_financial_revenue_pro_web",
    status: "approved",
    timeRangeDays: 366
  },
  {
    channel: "export",
    dataset: "price_history",
    entitlementId: "ent_price_history_close_team_export",
    exportAllowed: true,
    fieldPattern: "price_history.close",
    rightsPolicyVersion: FIELD_RIGHTS_POLICY_VERSION,
    sourceRecordId: "data_entitlement_price_history_close_team_export",
    status: "approved",
    timeRangeDays: 31
  }
];
const FIELD_RIGHTS_WORKSPACE_ENTITLEMENT_ROWS: readonly WorkspaceEntitlementRow[] = [
  {
    entitlementId: "ent_quote_last_price_developer_mcp",
    sourceRecordId: "workspace_entitlement_quote_last_price_developer",
    status: "approved",
    subscriptionId: "sub_developer_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceEntitlementId: "we_quote_last_price_developer",
    workspaceId: "ws_developer_alpha"
  },
  {
    entitlementId: "ent_quote_volume_developer_mcp_blocked",
    sourceRecordId: "workspace_entitlement_quote_volume_developer_blocked",
    status: "approved",
    subscriptionId: "sub_developer_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceEntitlementId: "we_quote_volume_developer_blocked",
    workspaceId: "ws_developer_alpha"
  },
  {
    entitlementId: "ent_financial_revenue_pro_web",
    sourceRecordId: "workspace_entitlement_financial_revenue_pro",
    status: "approved",
    subscriptionId: "sub_pro_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceEntitlementId: "we_financial_revenue_pro",
    workspaceId: "ws_pro_alpha"
  },
  {
    entitlementId: "ent_price_history_close_team_export",
    sourceRecordId: "workspace_entitlement_price_history_close_team",
    status: "approved",
    subscriptionId: "sub_team_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceEntitlementId: "we_price_history_close_team",
    workspaceId: "ws_team_alpha"
  }
];
const FIELD_RIGHTS_WORKSPACE_SUBSCRIPTION_ROWS: readonly WorkspaceSubscriptionRow[] = [
  {
    billingState: "active",
    planCode: "developer",
    subscriptionId: "sub_developer_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceId: "ws_developer_alpha"
  },
  {
    billingState: "active",
    planCode: "pro",
    subscriptionId: "sub_pro_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceId: "ws_pro_alpha"
  },
  {
    billingState: "active",
    planCode: "team",
    subscriptionId: "sub_team_alpha",
    validFrom: "2026-01-01T00:00:00.000Z",
    workspaceId: "ws_team_alpha"
  }
];
const FIELD_RIGHTS_RUNTIME_SMOKE_SCENARIOS: ReadonlyArray<{
  expectedAllowedFields: string[];
  expectedDeniedReasons: string[];
  expectedStatus: DataAccessDecisionStatus;
  request: DataAccessRequest;
  scenarioId: string;
}> = [
  {
    expectedAllowedFields: ["quote_snapshot.last_price"],
    expectedDeniedReasons: ["field_blocked"],
    expectedStatus: "allow_with_redactions",
    request: {
      channel: "mcp",
      dataset: "quote_snapshot",
      plan: "developer",
      qualityState: "PASS",
      requestedFields: ["quote_snapshot.last_price", "quote_snapshot.volume"],
      requestedRows: 1,
      timeRange: {
        from: "2026-06-01",
        to: "2026-06-15"
      },
      workspaceId: "ws_developer_alpha"
    },
    scenarioId: "developer_mcp_quote_redaction"
  },
  {
    expectedAllowedFields: ["financial_facts.revenue"],
    expectedDeniedReasons: ["field_default_deny"],
    expectedStatus: "allow_with_redactions",
    request: {
      channel: "web",
      dataset: "financial_facts",
      plan: "pro",
      qualityState: "PASS",
      requestedFields: ["financial_facts.revenue", "financial_facts.ebitda"],
      requestedRows: 1,
      timeRange: {
        from: "2026-01-01",
        to: "2026-12-31"
      },
      workspaceId: "ws_pro_alpha"
    },
    scenarioId: "pro_web_financial_field_default_deny"
  },
  {
    expectedAllowedFields: ["price_history.close"],
    expectedDeniedReasons: [],
    expectedStatus: "allow",
    request: {
      channel: "export",
      dataset: "price_history",
      exportRequested: true,
      plan: "team",
      qualityState: "PASS",
      requestedFields: ["price_history.close"],
      requestedRows: 10,
      timeRange: {
        from: "2026-06-01",
        to: "2026-06-30"
      },
      workspaceId: "ws_team_alpha"
    },
    scenarioId: "team_export_price_history_allowed"
  },
  {
    expectedAllowedFields: [],
    expectedDeniedReasons: ["time_range_blocked"],
    expectedStatus: "deny",
    request: {
      channel: "mcp",
      dataset: "quote_snapshot",
      plan: "developer",
      qualityState: "PASS",
      requestedFields: ["quote_snapshot.last_price"],
      requestedRows: 1,
      timeRange: {
        from: "2026-04-01",
        to: "2026-06-15"
      },
      workspaceId: "ws_developer_alpha"
    },
    scenarioId: "developer_mcp_quote_time_range_blocked"
  },
  {
    expectedAllowedFields: [],
    expectedDeniedReasons: ["workspace_entitlement_default_deny"],
    expectedStatus: "deny",
    request: {
      channel: "web",
      dataset: "financial_facts",
      plan: "pro",
      qualityState: "PASS",
      requestedFields: ["financial_facts.revenue"],
      requestedRows: 1
    },
    scenarioId: "missing_workspace_default_deny"
  },
  {
    expectedAllowedFields: [],
    expectedDeniedReasons: ["export_blocked"],
    expectedStatus: "deny",
    request: {
      channel: "mcp",
      dataset: "quote_snapshot",
      exportRequested: true,
      plan: "developer",
      qualityState: "PASS",
      requestedFields: ["quote_snapshot.last_price"],
      requestedRows: 1,
      workspaceId: "ws_developer_alpha"
    },
    scenarioId: "developer_mcp_quote_export_blocked"
  }
];
const SERVING_QUALITY_LIVE_READINESS_FIXTURES: ServingQualityLiveReadinessReport["release_fixture"] =
  [
    {
      expected_release_state: "released",
      quality_state: "PASS",
      scenario_id: "pass_snapshot_released_deferred_execution",
      source_record_id: "serving_quality_fixture_pass_snapshot"
    },
    {
      expected_release_state: "released",
      quality_state: "WARN",
      scenario_id: "warn_snapshot_released_with_warning",
      source_record_id: "serving_quality_fixture_warn_snapshot"
    },
    {
      expected_gateway_error_code: "DATA_QUALITY_HOLD",
      expected_release_state: "held",
      quality_state: "HOLD",
      scenario_id: "hold_snapshot_isolated_before_sql",
      source_record_id: "serving_quality_fixture_hold_snapshot"
    },
    {
      expected_gateway_error_code: "DATA_QUALITY_HOLD",
      expected_release_state: "withdrawn",
      quality_state: "REJECT_RAW",
      scenario_id: "reject_raw_snapshot_withdrawn_before_sql",
      source_record_id: "serving_quality_fixture_reject_raw_snapshot"
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
    required_p0_tool_count: P0_RIGHTS_MATRIX_REQUIRED_TOOL_COUNT,
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
      required_p0_tool_count: P0_RIGHTS_MATRIX_REQUIRED_TOOL_COUNT,
      tool_count: uniqueToolNames.length,
      tool_count_matches_registry: uniqueToolNames.length === P0_RIGHTS_MATRIX_REQUIRED_TOOL_COUNT
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

export function getFieldRightsLivePolicySourceCapabilities(): FieldRightsLivePolicySourceCapabilities {
  return {
    compiles_partner_matrix_to_db_rows: true,
    compiles_to_gateway_policy: true,
    default_deny_preserved: true,
    external_activation_status: "blocked_external_activation",
    fixture_version: FIELD_RIGHTS_LIVE_POLICY_SOURCE_FIXTURE_VERSION,
    frontend: false,
    live_db_reads: false,
    live_partner_rights_matrix_reads: false,
    package: "@aiphabee/data-access-gateway",
    persistent_writes: false,
    required_dimensions: FIELD_RIGHTS_LIVE_POLICY_REQUIRED_DIMENSIONS,
    route: "GET /gateway/field-rights/live-policy-source/readiness",
    runtime_route: "GET /gateway/runtime",
    sql_emitted: false,
    status: "field_rights_live_policy_source_readiness_scaffold",
    version: FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION
  };
}

export function createFieldRightsLivePolicySourceReadinessReport(
  input: { asOf?: string } = {}
): FieldRightsLivePolicySourceReport {
  const policySource = createPolicyFromEntitlementRows({
    asOf: input.asOf ?? FIELD_RIGHTS_POLICY_FIXTURE_AS_OF,
    dataEntitlements: [...FIELD_RIGHTS_DATA_ENTITLEMENT_ROWS],
    subscriptionRows: [...FIELD_RIGHTS_WORKSPACE_SUBSCRIPTION_ROWS],
    workspaceEntitlements: [...FIELD_RIGHTS_WORKSPACE_ENTITLEMENT_ROWS]
  });
  const runtimeSmoke = FIELD_RIGHTS_RUNTIME_SMOKE_SCENARIOS.map((scenario) =>
    createFieldRightsRuntimeSmokeResult(scenario, policySource.policy)
  );
  const runtimeSmokePassed = runtimeSmoke.every((scenario) => scenario.status === "pass");

  return {
    as_of: normalizeOptionalIdentifier(input.asOf, FIELD_RIGHTS_POLICY_FIXTURE_AS_OF),
    capability: getFieldRightsLivePolicySourceCapabilities(),
    default_rights_status: "default_deny",
    external_activation: {
      blockers: FIELD_RIGHTS_EXTERNAL_ACTIVATION_BLOCKERS,
      status: "blocked_external_activation"
    },
    fixture_version: FIELD_RIGHTS_LIVE_POLICY_SOURCE_FIXTURE_VERSION,
    frontend: false,
    live_db_reads: false,
    live_partner_rights_matrix_reads: false,
    partner_matrix_fixture: {
      matrix_rows: FIELD_RIGHTS_PARTNER_MATRIX_FIXTURE,
      required_prd_dimensions: FIELD_RIGHTS_REQUIRED_PRD_DIMENSIONS,
      signed_external_matrix_loaded: false
    },
    persistent_writes: false,
    policy_source: policySource,
    readiness: {
      db_rows_compiled:
        policySource.rowCounts.dataEntitlements === FIELD_RIGHTS_DATA_ENTITLEMENT_ROWS.length &&
        policySource.rowCounts.workspaceEntitlements ===
          FIELD_RIGHTS_WORKSPACE_ENTITLEMENT_ROWS.length,
      default_deny_preserved: policySource.policy.defaultFieldStatus === "default_deny",
      partner_matrix_fixture_loaded:
        FIELD_RIGHTS_PARTNER_MATRIX_FIXTURE.length ===
        FIELD_RIGHTS_DATA_ENTITLEMENT_ROWS.length,
      runtime_smoke_passed: runtimeSmokePassed,
      versioned_cache_key_verified: runtimeSmoke.every(
        (scenario) => scenario.cache_key_contains_policy_version
      )
    },
    rights_policy_version: policySource.policy.rightsPolicyVersion,
    runtime_smoke: runtimeSmoke,
    sql_emitted: false,
    status: "live_policy_source_readiness_passed",
    validation: {
      partner_matrix_rows: FIELD_RIGHTS_PARTNER_MATRIX_FIXTURE.length,
      smoke_count: runtimeSmoke.length,
      source_records: policySource.sourceRecords.length
    },
    version: FIELD_RIGHTS_LIVE_POLICY_SOURCE_VERSION
  };
}

export function getServingQualityLiveReadinessCapabilities(): ServingQualityLiveReadinessCapabilities {
  return {
    fixture_version: SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION,
    frontend: false,
    live_partner_rows_loaded: false,
    live_serving_reads: false,
    live_serving_sql_execution: false,
    package: "@aiphabee/data-access-gateway",
    persistent_writes: false,
    required_quality_states: SERVING_QUALITY_REQUIRED_STATES,
    route: "GET /gateway/serving-quality/live-readiness",
    runtime_route: "GET /gateway/runtime",
    sql_executed: false,
    status: "serving_quality_live_readiness_scaffold",
    tables: SERVING_QUALITY_LIVE_READINESS_TABLES,
    validates_gateway_quality_hold: true,
    validates_release_isolation: true,
    validates_sql_execution_guard: true,
    version: SERVING_QUALITY_LIVE_READINESS_VERSION
  };
}

export function createServingQualityLiveReadinessReport(
  input: { asOf?: string } = {}
): ServingQualityLiveReadinessReport {
  const qualityReleaseChecks = SERVING_QUALITY_LIVE_READINESS_FIXTURES.map((fixture) =>
    createServingQualityLiveReadinessCheck(fixture)
  );
  const releaseMappingPassed = qualityReleaseChecks.every(
    (check) => check.status === "pass" && check.release_state === check.expected_release_state
  );
  const gatewayQualityHoldGuardPassed = qualityReleaseChecks
    .filter((check) => check.expected_gateway_error_code === "DATA_QUALITY_HOLD")
    .every(
      (check) =>
        check.gateway_status === "quality_hold" &&
        check.gateway_error_code === "DATA_QUALITY_HOLD" &&
        check.serving_query_status === "query_blocked" &&
        check.sql_text_status === "sql_text_blocked"
    );
  const sqlExecutionGuardPassed = qualityReleaseChecks.every(
    (check) => check.sql_executed === false
  );
  const noBlockedQualitySqlExecution = qualityReleaseChecks
    .filter((check) => check.expected_gateway_error_code === "DATA_QUALITY_HOLD")
    .every(
      (check) =>
        check.sql_text_emitted === false &&
        check.sql_text_status === "sql_text_blocked" &&
        check.serving_execution_status === "execution_blocked"
    );

  return {
    as_of: normalizeOptionalIdentifier(input.asOf, "as_of_unresolved"),
    capability: getServingQualityLiveReadinessCapabilities(),
    activation: {
      blockers: SERVING_QUALITY_ACTIVATION_BLOCKERS,
      required_signoffs: SERVING_QUALITY_REQUIRED_SIGNOFFS,
      status: "blocked_live_serving_activation"
    },
    fixture_version: SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION,
    frontend: false,
    live_partner_rows_loaded: false,
    live_serving_reads: false,
    live_serving_sql_execution: false,
    persistent_writes: false,
    quality_release_checks: qualityReleaseChecks,
    readiness: {
      gateway_quality_hold_guard_passed: gatewayQualityHoldGuardPassed,
      no_blocked_quality_sql_execution: noBlockedQualitySqlExecution,
      no_live_reads_or_writes: true,
      release_mapping_passed: releaseMappingPassed,
      sql_execution_guard_passed: sqlExecutionGuardPassed
    },
    release_fixture: SERVING_QUALITY_LIVE_READINESS_FIXTURES,
    sql_executed: false,
    status: "serving_quality_live_readiness_passed",
    validation: {
      blocked_quality_states: qualityReleaseChecks.filter(
        (check) => check.expected_gateway_error_code === "DATA_QUALITY_HOLD"
      ).length,
      quality_state_count: SERVING_QUALITY_REQUIRED_STATES.length,
      smoke_count: qualityReleaseChecks.length
    },
    version: SERVING_QUALITY_LIVE_READINESS_VERSION
  };
}

function createServingQualityLiveReadinessCheck(
  fixture: ServingQualityLiveReadinessReport["release_fixture"][number]
): ServingQualityLiveReadinessReport["quality_release_checks"][number] {
  const policy = createSyntheticApprovedPolicy();
  const qualityRelease = createServingQualityReleasePlan({
    dataVersion: SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION,
    dataset: "synthetic_profile",
    methodologyVersion: SERVING_QUALITY_LIVE_READINESS_VERSION,
    rightsPolicyVersion: policy.rightsPolicyVersion,
    rowCount: 3,
    snapshotQualityState: fixture.quality_state,
    sourceRecordId: fixture.source_record_id
  });
  const decision = evaluateDataAccessRequest(
    {
      channel: "web",
      dataset: "synthetic_profile",
      plan: "free",
      qualityState: fixture.quality_state,
      requestedFields: ["synthetic_profile.company_name"],
      requestedRows: 3,
      timeRange: {
        from: "2026-06-01",
        to: "2026-06-15"
      }
    },
    policy
  );
  const expectedServingQueryStatus =
    fixture.expected_gateway_error_code === "DATA_QUALITY_HOLD"
      ? "query_blocked"
      : "query_planned";
  const expectedSqlTextStatus =
    fixture.expected_gateway_error_code === "DATA_QUALITY_HOLD"
      ? "sql_text_blocked"
      : "sql_text_planned";
  const passed =
    qualityRelease.releaseState === fixture.expected_release_state &&
    decision.error?.code === fixture.expected_gateway_error_code &&
    decision.servingQuery.status === expectedServingQueryStatus &&
    decision.servingSqlText.status === expectedSqlTextStatus &&
    decision.servingExecution.sqlExecuted === false &&
    decision.servingExecution.liveRead === false &&
    decision.servingResult.rowCount === 0;

  return {
    expected_gateway_error_code: fixture.expected_gateway_error_code,
    expected_release_state: fixture.expected_release_state,
    expected_serving_query_status: expectedServingQueryStatus,
    expected_sql_text_status: expectedSqlTextStatus,
    gateway_error_code: decision.error?.code,
    gateway_status: decision.status,
    quality_state: fixture.quality_state,
    release_state: qualityRelease.releaseState,
    scenario_id: fixture.scenario_id,
    serving_execution_status: decision.servingExecution.status,
    serving_query_status: decision.servingQuery.status,
    sql_executed: false,
    sql_text_emitted: decision.servingSqlText.sqlTextEmitted,
    sql_text_status: decision.servingSqlText.status,
    status: passed ? "pass" : "fail"
  };
}

function createFieldRightsRuntimeSmokeResult(
  scenario: (typeof FIELD_RIGHTS_RUNTIME_SMOKE_SCENARIOS)[number],
  policy: DataAccessPolicy
): FieldRightsLivePolicySourceReport["runtime_smoke"][number] {
  const decision = evaluateDataAccessRequest(scenario.request, policy);
  const deniedReasons = decision.deniedFields.map((field) => field.reason);
  const passed =
    decision.status === scenario.expectedStatus &&
    arraysEqual(decision.allowedFields, scenario.expectedAllowedFields) &&
    arraysEqual(deniedReasons, scenario.expectedDeniedReasons);

  return {
    allowed_fields: decision.allowedFields,
    cache_key_contains_policy_version: decision.cacheKey.includes(
      `rights=${policy.rightsPolicyVersion}`
    ),
    denied_reasons: deniedReasons,
    expected_allowed_fields: scenario.expectedAllowedFields,
    expected_denied_reasons: scenario.expectedDeniedReasons,
    expected_status: scenario.expectedStatus,
    scenario_id: scenario.scenarioId,
    status: passed ? "pass" : "fail"
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

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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
