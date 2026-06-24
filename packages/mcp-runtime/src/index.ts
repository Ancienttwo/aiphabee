import {
  REGISTERED_TOOLS,
  TOOL_REGISTRY_VERSION,
  isRegisteredToolName,
  type RegisteredToolDefinition,
  type RegisteredToolName
} from "@aiphabee/tool-registry";
import {
  USAGE_LEDGER_EVENT_WRITER_VERSION,
  USAGE_QUOTA_DISPLAY_VERSION,
  createUsageLedgerEventPlan,
  createUsageQuotaDisplayPlan,
  type UsageLedgerEventPlan,
  type UsageQuotaDisplayPlan,
  type UsageQuotaPlanCode
} from "@aiphabee/usage-ledger";

export const MCP_RUNTIME_VERSION =
  "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0";
export const MCP_OAUTH_PKCE_VERSION =
  "2026-06-21.phase2.mcp-oauth-pkce-scaffold.v0";
export const MCP_API_KEY_VERSION =
  "2026-06-21.phase2.mcp-api-key-scaffold.v0";
export const MCP_REVOCATION_ENFORCEMENT_VERSION =
  "2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0";
export const MCP_TOOL_SCHEMA_VALIDATION_VERSION =
  "2026-06-21.phase2.mcp-tool-schema-validation-scaffold.v0";
export const MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION =
  "2026-06-22.phase1.mcp-runtime-schema-snapshot.v0";
export const MCP_PAGINATION_LIMITS_VERSION =
  "2026-06-21.phase2.mcp-pagination-limits-scaffold.v0";
export const MCP_USAGE_ENVELOPE_VERSION =
  "2026-06-21.phase2.mcp-usage-envelope-scaffold.v0";
export const MCP_STANDARD_ERROR_CODES_VERSION =
  "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0";
export const MCP_TOOL_LIMITER_VERSION =
  "2026-06-21.phase2.mcp-tool-limiter-scaffold.v0";
export const MCP_TOOL_LIMITER_HIGH_COST_THRESHOLD = 8;
export const MCP_TOOL_LIMITER_STANDARD_MAX_PARALLEL = 8;
export const MCP_TOOL_LIMITER_HIGH_COST_MAX_PARALLEL = 2;
export const MCP_TOOL_LIMITER_RATE_LIMIT_PER_MINUTE = 60;
export const MCP_TOOL_LIMITER_BURST_LIMIT = 10;
export const MCP_COMPATIBILITY_STATUS_VERSION =
  "2026-06-21.phase2.mcp-compatibility-status-scaffold.v0";
export const MCP_PROTOCOL_RELEASE_GATE_VERSION =
  "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0";
export const MCP_AUTH_LIMITS_RELEASE_GATE_VERSION =
  "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0";
export const MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION =
  "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0";
export const MCP_DEVELOPER_CONSOLE_VERSION =
  "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0";
export const MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION = "2025-03-26";
export const MCP_COMPATIBILITY_MONITORED_PROTOCOL_VERSIONS = [
  "2025-03-26",
  "2025-11-25"
] as const;
export const MCP_PROTOCOL_RELEASE_GATE_REQUIRED_CHECKS = [
  "streamable_http_initialize_contract",
  "origin_required_and_allowed",
  "auth_enforced_before_tool_execution",
  "tools_list_default_deny_until_rights_confirmed",
  "tools_call_input_schema_validation",
  "tools_call_output_schema_contract",
  "compatibility_vectors_present"
] as const;
export const MCP_AUTH_LIMITS_RELEASE_GATE_REQUIRED_CHECKS = [
  "oauth_scope_catalog_and_pkce_ready",
  "oauth_revoke_denies_future_calls",
  "api_key_rotation_denies_old_key",
  "api_key_revoke_denies_future_calls",
  "cursor_pagination_bypass_blocked",
  "quota_and_limit_bypass_blocked",
  "standard_error_codes_stable"
] as const;
export const MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_REQUIRED_CHECKS = [
  "target_client_matrix_present",
  "inspector_and_sdk_smoke_vectors_planned",
  "first_call_guide_under_10_minute_target",
  "console_reconciliation_fields_present",
  "request_usage_scope_and_key_reconciliation_ready",
  "compatibility_status_linked",
  "no_live_console_or_client_claim"
] as const;
export const MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS = [
  "connection_guide_surface_ready",
  "api_key_and_oauth_routes_linked",
  "scope_catalog_visible",
  "quota_usage_summary_visible",
  "request_log_schema_ready",
  "examples_cover_initialize_tools_list_tools_call",
  "first_call_guide_under_10_minute_target",
  "no_live_console_claim"
] as const;
export const MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS = [
  "request_id",
  "workspace_id",
  "client_name",
  "client_version",
  "credential_kind",
  "credential_reference",
  "scope",
  "tool_name",
  "tool_version",
  "status",
  "standard_error_code",
  "credits",
  "credits_remaining",
  "usage_event_id",
  "data_version",
  "methodology_version",
  "source_record_id"
] as const;
export const MCP_DEVELOPER_CONSOLE_FORBIDDEN_FIELDS = [
  "raw_api_key",
  "oauth_access_token",
  "oauth_refresh_token",
  "raw_prompt",
  "raw_generated_answer",
  "raw_document_body",
  "payment_identifier",
  "personal_contact"
] as const;
export const MCP_CLIENT_MATURITY_VERSION =
  "2026-06-22.phase4.mcp-client-maturity-scaffold.v0";
export const MCP_CLIENT_MATURITY_REQUIRED_CHECKS = [
  "target_clients_capability_matrix_present",
  "resources_support_guarded_by_client_maturity",
  "prompts_support_guarded_by_client_maturity",
  "interactive_apps_support_blocked_until_client_stable",
  "fallback_to_tools_only_documented",
  "no_live_resources_prompts_apps_claim"
] as const;
export const MCP_CLIENT_MATURITY_FEATURES = [
  "tools",
  "resources",
  "prompts",
  "interactive_apps"
] as const;
export const MCP_CLIENT_MATURITY_TARGET_CLIENTS = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
] as const;
export const MCP_CLIENT_MATURITY_REFERENCE_URLS = [
  "https://modelcontextprotocol.io/specification/2025-11-25/server/resources",
  "https://modelcontextprotocol.io/specification/2025-11-25/server/prompts",
  "https://developers.openai.com/apps-sdk/concepts/mcp-server"
] as const;

export const MCP_SUPPORTED_METHODS = [
  "initialize",
  "tools/list",
  "tools/call"
] as const;

export const MCP_RUNTIME_SCHEMA_SNAPSHOT_ROUTE =
  "GET /mcp/runtime/tool-schemas";
export const MCP_TOOL_SCHEMA_SOURCE_CONTRACT =
  "deploy/tools/tool-schemas.contract.json";
export const MCP_JSON_SCHEMA_DIALECT =
  "https://json-schema.org/draft/2020-12/schema";
export const MCP_STANDARD_RESPONSE_ENVELOPE_FIELDS = [
  "ok",
  "request_id",
  "as_of",
  "market_status",
  "provenance",
  "usage",
  "data",
  "data_version",
  "methodology_version"
] as const;

export const DEFAULT_MCP_ALLOWED_ORIGINS = [
  "https://app.aiphabee.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
] as const;

export const MCP_OAUTH_SCOPE_DEFINITIONS = [
  {
    data_classes: ["security_master"],
    description: "Read security identifiers, listings, and profile metadata.",
    risk_level: "low",
    scope: "security.read",
    write: false
  },
  {
    data_classes: ["market_quote", "price_history", "market_calendar"],
    description: "Read entitled market data through AiphaBee tools.",
    risk_level: "medium",
    scope: "market.read",
    write: false
  },
  {
    data_classes: ["financial_facts", "corporate_actions"],
    description: "Read financial statement facts and related fundamentals.",
    risk_level: "medium",
    scope: "fundamentals.read",
    write: false
  },
  {
    data_classes: ["filings", "announcements"],
    description: "Read filing and announcement excerpts with citations.",
    risk_level: "medium",
    scope: "filings.read",
    write: false
  },
  {
    data_classes: ["analytics"],
    description: "Run deterministic comparison, screening, and calculation tools.",
    risk_level: "medium",
    scope: "analytics.run",
    write: false
  },
  {
    data_classes: ["portfolio"],
    description: "Read user portfolio context after additional privacy review.",
    risk_level: "high",
    scope: "portfolio.read",
    write: false
  },
  {
    data_classes: ["alerts"],
    description: "Create or update alerts after explicit user confirmation.",
    risk_level: "high",
    scope: "alerts.write",
    write: true
  },
  {
    data_classes: ["exports"],
    description: "Read export artifacts; high-risk scope requiring separate consent.",
    risk_level: "high",
    scope: "exports.read",
    write: false
  },
  {
    data_classes: ["usage_admin"],
    description: "Read workspace usage and quota records for administrators.",
    risk_level: "high",
    scope: "admin.usage.read",
    write: false
  }
] as const;

export type McpMethod = (typeof MCP_SUPPORTED_METHODS)[number];
export type McpOAuthScope = (typeof MCP_OAUTH_SCOPE_DEFINITIONS)[number]["scope"];
export type McpCredentialKind = "api_key" | "oauth_connection";
export type McpCredentialStatus = "active" | "revoked" | "rotated" | "unknown";
export type McpClientMaturityFeature = (typeof MCP_CLIENT_MATURITY_FEATURES)[number];
export type McpClientMaturityTargetClient =
  (typeof MCP_CLIENT_MATURITY_TARGET_CLIENTS)[number];
export type McpClientMaturityPlanStatus =
  | "blocked_unknown_client"
  | "blocked_unsupported_feature"
  | "planned_no_live_mcp_client_maturity";
export type McpIpRiskLevel = "high" | "low" | "medium" | "unknown";
export type McpRuntimePlanStatus =
  | "planned_default_deny"
  | "planned_no_live_execution";
export type McpOAuthPlanStatus = "planned_no_live_oauth";
export type McpApiKeyPlanStatus = "planned_no_live_api_key";
export type McpDeveloperConsolePlanStatus = "planned_no_live_developer_console";
export type McpRevocationEnforcementStatus =
  "planned_no_live_revocation_enforcement";
export type McpStandardErrorCategory =
  | "authentication"
  | "authorization"
  | "data"
  | "limit"
  | "system";
export type McpRuntimeInputErrorCode =
  | "API_KEY_ID_REQUIRED"
  | "API_KEY_NAME_REQUIRED"
  | "AUTHORIZATION_CODE_REQUIRED"
  | "CLIENT_ID_REQUIRED"
  | "CODE_CHALLENGE_METHOD_UNSUPPORTED"
  | "CODE_CHALLENGE_REQUIRED"
  | "CODE_VERIFIER_REQUIRED"
  | "CREDENTIAL_KIND_REQUIRED"
  | "CREDENTIAL_REFERENCE_REQUIRED"
  | "CREDENTIAL_STATUS_REQUIRED"
  | "CREDENTIAL_STATUS_UNSUPPORTED"
  | "CONNECTION_OR_TOKEN_REQUIRED"
  | "INVALID_API_KEY_ROTATION_DAYS"
  | "INVALID_CODE_CHALLENGE"
  | "INVALID_IP_ALLOWLIST"
  | "INVALID_REDIRECT_URI"
  | "MCP_CREDENTIAL_REVOKED"
  | "MCP_REDISTRIBUTION_RIGHTS_REQUIRED"
  | "ORIGIN_NOT_ALLOWED"
  | "ORIGIN_REQUIRED"
  | "RAW_API_KEY_FORBIDDEN"
  | "REDIRECT_URI_REQUIRED"
  | "SCOPE_REQUIRED"
  | "TOOL_NAME_REQUIRED"
  | "TOOL_ARGUMENT_REQUIRED"
  | "TOOL_ARGUMENT_UNSUPPORTED"
  | "TOOL_ARGUMENTS_OBJECT_REQUIRED"
  | "TOOL_CURSOR_INVALID"
  | "TOOL_LIMIT_EXCEEDED"
  | "TOOL_LIMIT_INVALID"
  | "TOOL_NOT_REGISTERED"
  | "TOOL_SCOPE_REQUIRED"
  | "TOOL_TIME_RANGE_EXCEEDED"
  | "TOOL_TIME_RANGE_INVALID"
  | "UNSUPPORTED_SCOPE"
  | "UNSUPPORTED_METHOD";

export interface McpStandardErrorDefinition {
  category: McpStandardErrorCategory;
  client_action:
    | "contact_support_with_request_id"
    | "narrow_request"
    | "reauthorize"
    | "request_additional_scope"
    | "retry_after"
    | "select_security_candidate"
    | "show_last_available_as_of"
    | "try_alternate_methodology_or_retry_later"
    | "upgrade_or_reduce_scope"
    | "upgrade_or_shrink_task";
  code: McpStandardErrorCode;
  recoverable: boolean;
  retry_after_required: boolean;
  source_record_id: string;
}

export class McpRuntimeInputError extends Error {
  readonly code: McpRuntimeInputErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: McpRuntimeInputErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export interface CreateMcpProtocolPlanInput {
  accountId?: string;
  allowedOrigins?: readonly string[];
  clientIp?: string;
  clientName?: string;
  clientVersion?: string;
  connectionId?: string;
  credentialKind?: string;
  credentialStatus?: string;
  grantedScopes?: readonly string[];
  ipRiskLevel?: string;
  keyId?: string;
  membershipId?: string;
  method?: string;
  mcpRedistributionRightsConfirmed?: boolean;
  origin?: string;
  pendingCredits?: number;
  requestId: string;
  requestedScopes?: readonly string[];
  revocationReason?: string;
  revokedAt?: string;
  rotatedAt?: string;
  subscriptionId?: string;
  toolArguments?: unknown;
  toolName?: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}

export interface CreateMcpOAuthAuthorizePlanInput {
  clientId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  origin?: string;
  redirectUri?: string;
  requestId: string;
  requestedScopes?: readonly string[];
  userId?: string;
  workspaceId?: string;
}

export interface CreateMcpOAuthTokenPlanInput {
  authorizationCode?: string;
  codeVerifier?: string;
  clientId?: string;
  requestId: string;
  requestedScopes?: readonly string[];
}

export interface CreateMcpOAuthRevokePlanInput {
  connectionId?: string;
  reason?: string;
  requestId: string;
  tokenId?: string;
}

export interface CreateMcpApiKeyCreatePlanInput {
  ipAllowlist?: readonly string[];
  keyName?: string;
  ownerId?: string;
  rawApiKey?: string;
  requestId: string;
  requestedScopes?: readonly string[];
  rotationAfterDays?: number;
  workspaceId?: string;
}

export interface CreateMcpApiKeyRotatePlanInput {
  ipAllowlist?: readonly string[];
  keyId?: string;
  rawApiKey?: string;
  reason?: string;
  requestId: string;
  requestedScopes?: readonly string[];
  rotationAfterDays?: number;
}

export interface CreateMcpApiKeyRevokePlanInput {
  keyId?: string;
  rawApiKey?: string;
  reason?: string;
  requestId: string;
}

export interface CreateMcpRevocationEnforcementPlanInput {
  connectionId?: string;
  credentialKind?: string;
  credentialStatus?: string;
  keyId?: string;
  method?: string;
  reason?: string;
  requestId: string;
  revokedAt?: string;
  rotatedAt?: string;
  toolName?: string;
}

export interface CreateMcpProtocolReleaseGatePlanInput {
  allowedOrigins?: readonly string[];
  clientName?: string;
  clientVersion?: string;
  origin?: string;
  pendingCredits?: number;
  requestId: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}

export interface CreateMcpAuthLimitsReleaseGatePlanInput {
  allowedOrigins?: readonly string[];
  origin?: string;
  pendingCredits?: number;
  requestId: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}

export interface CreateMcpTargetClientsConsoleReleaseGatePlanInput {
  allowedOrigins?: readonly string[];
  clientName?: string;
  clientVersion?: string;
  origin?: string;
  pendingCredits?: number;
  requestId: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}

export interface CreateMcpDeveloperConsolePlanInput {
  allowedOrigins?: readonly string[];
  clientName?: string;
  clientVersion?: string;
  origin?: string;
  pendingCredits?: number;
  requestId: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}

export interface CreateMcpClientMaturityPlanInput {
  allowedOrigins?: readonly string[];
  clientName?: string;
  clientVersion?: string;
  origin?: string;
  pendingCredits?: number;
  requestId: string;
  requestedFeature?: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}

export interface McpToolDescriptor {
  breaking_changes_require_new_major: true;
  deprecation: {
    announced_at: null | string;
    migration_guide: null | string;
    minimum_notice_days: number;
    status: "active" | "deprecated" | "sunset";
    sunset_at: null | string;
  };
  description: string;
  input_schema_id: string;
  major_version: number;
  name: RegisteredToolName;
  output_schema_id: string;
  public_version: string;
  required_scope: string;
  retrieval_limits: McpToolRetrievalLimitsDescriptor;
  schema_snapshot: McpToolSchemaSnapshotDescriptor;
  version: string;
}

export interface McpToolSchemaSnapshotDescriptor {
  input_schema: {
    additional_properties_allowed: false;
    allowed_properties: readonly string[];
    any_of: readonly (readonly string[])[];
    id: string;
    required: readonly string[];
  };
  output_schema: {
    id: string;
    raw_text_only_response_allowed: false;
    required_envelope_fields: typeof MCP_STANDARD_RESPONSE_ENVELOPE_FIELDS;
    standard_response_envelope: true;
    structured_content_required: true;
  };
  schema_dialect: typeof MCP_JSON_SCHEMA_DIALECT;
  schema_snapshot_version: typeof MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION;
  schema_source_contract: typeof MCP_TOOL_SCHEMA_SOURCE_CONTRACT;
  standard_error_codes: readonly string[];
}

export interface McpRuntimeSchemaSnapshot {
  live_tool_execution: false;
  package: "@aiphabee/mcp-runtime";
  protocol_route: "POST /mcp";
  route: typeof MCP_RUNTIME_SCHEMA_SNAPSHOT_ROUTE;
  runtime_schema_serving: true;
  schema_dialect: typeof MCP_JSON_SCHEMA_DIALECT;
  schema_snapshot_version: typeof MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION;
  schema_source_contract: typeof MCP_TOOL_SCHEMA_SOURCE_CONTRACT;
  status: "runtime_schema_snapshot_scaffold";
  tool_count: number;
  tools: McpToolDescriptor[];
  tools_list_schema_snapshot: true;
  version: typeof MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION;
}

export interface McpToolsListSchemaSnapshotSummary {
  returned_schema_count: number;
  runtime_schema_serving: true;
  schema_catalog_available_after_rights_gate: true;
  schema_snapshot_version: typeof MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION;
  schema_source_contract: typeof MCP_TOOL_SCHEMA_SOURCE_CONTRACT;
  tool_schema_count: number;
  tools_list_schema_snapshot: true;
}

export interface McpToolRetrievalLimitsDescriptor {
  cursor_pagination: {
    cursor_bound_to_request: true;
    cursor_opaque: true;
    enabled: boolean;
    parameter: null | string;
  };
  enforced_before_execution: true;
  plan_or_rights_bypass_blocked: true;
  row_limit: {
    default_limit: number;
    max_limit: number;
    parameter: null | string;
  };
  time_range_limit: {
    from_parameters: readonly string[];
    max_window_days: null | number;
    required: boolean;
    to_parameters: readonly string[];
  };
}

export interface McpToolInputValidationPlan {
  additional_properties_allowed: false;
  arguments_valid: true;
  input_schema_id: string;
  missing_required_arguments: [];
  required_fields_present: true;
  schema_validation_status: "validated";
  schema_validation_version: typeof MCP_TOOL_SCHEMA_VALIDATION_VERSION;
  unsupported_arguments: [];
}

export interface McpToolStructuredContentValidationPlan {
  output_schema_id: string;
  raw_text_only_response_allowed: false;
  structured_content_matches_output_schema: "planned_no_live";
  structured_content_required: true;
}

export interface McpToolBoundedRetrievalPlan {
  cursor_pagination: {
    cursor: null | string;
    cursor_bound_to_request: true;
    cursor_opaque: true;
    enabled: boolean;
    parameter: null | string;
  };
  enforcement_status: "validated";
  max_rows_enforced: true;
  pagination_limits_version: typeof MCP_PAGINATION_LIMITS_VERSION;
  plan_or_rights_bypass_blocked: true;
  row_limit: {
    default_limit: number;
    effective_limit: number;
    max_limit: number;
    requested_limit: number;
    requested_limit_parameter: null | string;
    too_many_rows_error_code: "TOO_MANY_ROWS";
  };
  time_range_limit: {
    from: null | string;
    from_parameters: readonly string[];
    max_window_days: null | number;
    out_of_range_error_code: "OUT_OF_RANGE";
    required: boolean;
    time_range_enforced: true;
    to: null | string;
    to_parameters: readonly string[];
    window_days: null | number;
  };
}

export interface McpUsageSummary {
  cached: false;
  credit_limit: number;
  credits: number;
  credits_pending: number;
  credits_remaining: number;
  credits_used: number;
  freshness_target_minutes: 5;
  live_ledger_reads: false;
  request_id: string;
  request_id_visible: true;
  rows: number;
  usage_reconciliation_status: "planned_no_live";
}

export interface McpUsageEnvelopePlan {
  billable_credits: 0;
  channel: "mcp";
  credits_remaining_after_estimate: number;
  estimated_credits: number;
  ledger_event: UsageLedgerEventPlan;
  live_billing_reconciliation: false;
  live_ledger_reads: false;
  persistent_writes: false;
  quota_display: UsageQuotaDisplayPlan;
  reconciliation: {
    status: "planned_no_live";
    target_delay_minutes: 5;
    usage_ledger_event_writer_version: typeof USAGE_LEDGER_EVENT_WRITER_VERSION;
    usage_quota_display_version: typeof USAGE_QUOTA_DISPLAY_VERSION;
  };
  request_id: string;
  request_id_visible: true;
  usage_envelope_version: typeof MCP_USAGE_ENVELOPE_VERSION;
}

export interface McpToolLimitsPlan {
  budget: {
    allowed_after_estimate: boolean;
    budget_exceeded: boolean;
    budget_exceeded_error_code: "BUDGET_EXCEEDED";
    estimated_credits: number;
    failure_refund_required: true;
    live_debit: false;
    pre_debit_required: true;
    remaining_credits_after_estimate: number;
  };
  concurrency: {
    high_cost_pool_isolated: true;
    live_inflight_reads: false;
    max_parallel: number;
    pool: "mcp_high_cost" | "mcp_standard";
  };
  durable_queue: {
    enqueue_status: "not_required" | "planned_no_live";
    idempotency_key: string;
    live_queue_writes: false;
    queue_name: null | "mcp-high-cost";
    required: boolean;
  };
  limiter_version: typeof MCP_TOOL_LIMITER_VERSION;
  ordinary_pool_protection: true;
  rate_limit: {
    burst_limit: typeof MCP_TOOL_LIMITER_BURST_LIMIT;
    live_window_reads: false;
    per_minute_limit: typeof MCP_TOOL_LIMITER_RATE_LIMIT_PER_MINUTE;
    rate_limited: false;
    rate_limited_error_code: "RATE_LIMITED";
    retry_after_seconds: null;
      status: "planned_no_live";
  };
  scope: McpToolLimiterScope;
  tool_name: RegisteredToolName;
  weight: {
    credit_weight: number;
    high_cost: boolean;
    high_cost_threshold: typeof MCP_TOOL_LIMITER_HIGH_COST_THRESHOLD;
    row_estimate: number;
  };
}

export interface McpToolLimiterScope {
  client: {
    name: string;
    origin: string;
    source: "request" | "unresolved";
    version: string;
  };
  dataset: {
    name: string;
    source: "tool_registry_data_class";
  };
  dimension_keys: readonly ["user", "workspace", "client", "tool", "dataset", "ip_risk"];
  ip_risk: {
    client_ip_present: boolean;
    live_reputation_lookup: false;
    raw_ip_stored: false;
    risk_level: McpIpRiskLevel;
    source: "request" | "unrated";
  };
  key_material: {
    budget_key: string;
    concurrency_key: string;
    rate_limit_key: string;
  };
  tool: {
    name: RegisteredToolName;
    required_scope: string;
  };
  user: {
    account_id: string;
    membership_id: string;
    source: "request" | "unresolved";
  };
  workspace: {
    source: "request" | "unresolved";
    workspace_id: string;
  };
}

export interface McpRevocationEnforcementPlan {
  action: "enforce_revocation";
  credential: {
    connection_id?: string;
    credential_kind: McpCredentialKind;
    credential_reference: string;
    key_id?: string;
    raw_credential_stored: false;
    status: McpCredentialStatus;
  };
  data_version: typeof MCP_REVOCATION_ENFORCEMENT_VERSION;
  denial: {
    client_action: "reauthorize";
    decision: "allow_planned" | "deny_revoked" | "deny_rotated" | "deny_unknown";
    denied: boolean;
    enforced_before_tool_execution: true;
    enforced_before_usage_debit: true;
    immediate_failure_after_revoke: true;
    immediate_failure_after_rotation: true;
    standard_error_code: "AUTH_REQUIRED";
  };
  live_auth_middleware: false;
  methodology_version: typeof MCP_REVOCATION_ENFORCEMENT_VERSION;
  method?: McpMethod;
  persistent_writes: false;
  protocol_route: "POST /mcp";
  provenance: Array<{
    data_version: typeof MCP_REVOCATION_ENFORCEMENT_VERSION;
    methodology_version: typeof MCP_REVOCATION_ENFORCEMENT_VERSION;
    source: "mcp-revocation-enforcement";
    source_record_id: string;
  }>;
  reason?: string;
  request_id: string;
  revoked_at?: string;
  rotated_at?: string;
  route: "POST /mcp/revocations/enforce/plan";
  status: McpRevocationEnforcementStatus;
  tool_name?: string;
  usage: {
    cached: false;
    credits: 0;
    rows: 1;
  };
  version: typeof MCP_REVOCATION_ENFORCEMENT_VERSION;
}

export interface McpCompatibilityStatusPlan {
  data_version: typeof MCP_COMPATIBILITY_STATUS_VERSION;
  inspector: {
    live_inspector_smoke: false;
    planned_command: "npx @modelcontextprotocol/inspector";
    required_checks: readonly [
      "connectivity",
      "capability_negotiation",
      "tools_tab",
      "error_responses"
    ];
    target: "@modelcontextprotocol/inspector";
  };
  live_client_e2e_passed: false;
  methodology_version: typeof MCP_COMPATIBILITY_STATUS_VERSION;
  monitored_protocol_versions: typeof MCP_COMPATIBILITY_MONITORED_PROTOCOL_VERSIONS;
  package: "@aiphabee/mcp-runtime";
  protocol_route: "POST /mcp";
  provenance: Array<{
    data_version: typeof MCP_COMPATIBILITY_STATUS_VERSION;
    methodology_version: typeof MCP_COMPATIBILITY_STATUS_VERSION;
    source: "mcp-compatibility-status";
    source_record_id: string;
  }>;
  release_gate: {
    local_contract_required: "npm run check:mcp-compatibility";
    live_client_smoke_required_before_ga: true;
    remote_mcp_rights_required: true;
  };
  request_id: string;
  runtime_route: "GET /mcp/runtime";
  sdk: {
    latest_seen_v1_release: "v1.29.0";
    live_sdk_smoke: false;
    production_channel: "typescript-sdk-v1.x";
    v2_channel_status: "pre_alpha_not_targeted";
  };
  status: "planned_no_live_compatibility_status";
  status_page: {
    public_status_page_live: false;
    route: "GET /mcp/compatibility/status";
    shows_last_successful_client_smoke: true;
    shows_open_incidents: true;
    shows_protocol_version: true;
  };
  status_route: "GET /mcp/compatibility/status";
  target_clients: ReadonlyArray<{
    live_e2e_passed: false;
    name:
      | "chatgpt_connector"
      | "claude_desktop"
      | "cursor"
      | "mcp_inspector"
      | "typescript_sdk_client";
    status: "blocked_gate0" | "planned_no_live";
  }>;
  target_protocol_version: typeof MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION;
  test_vectors: ReadonlyArray<{
    local_contract_ready: boolean;
    live_smoke_passed: false;
    name:
      | "api_key_lifecycle"
      | "as_of_delay_source_display"
      | "initialize_negotiation"
      | "oauth_pkce"
      | "pagination_limits"
      | "standard_errors"
      | "streamable_http_post"
      | "structured_content_text_fallback"
      | "tools_call_schema_validation"
      | "tools_list"
      | "usage_and_request_id";
  }>;
  usage: McpUsageSummary;
  version: typeof MCP_COMPATIBILITY_STATUS_VERSION;
}

export interface McpOAuthScopeGrant {
  data_classes: readonly string[];
  description: string;
  risk_level: "high" | "low" | "medium";
  revocable: true;
  scope: McpOAuthScope;
  write: boolean;
}

export interface McpOAuthAuthorizePlan {
  action: "authorize";
  authorization_code: {
    code_emitted: false;
    expires_in_seconds: 300;
    one_time_use: true;
    status: "planned_no_live";
    token_exchange_route: "POST /mcp/oauth/token/plan";
  };
  client_id: string;
  consent: {
    clear_scope_display: true;
    requested_scope_count: number;
    scopes: McpOAuthScopeGrant[];
    user_consent_required: true;
  };
  data_version: typeof MCP_OAUTH_PKCE_VERSION;
  live_oauth_provider: false;
  methodology_version: typeof MCP_OAUTH_PKCE_VERSION;
  oauth_flow: "authorization_code_pkce";
  pkce: {
    code_challenge: string;
    code_challenge_method: "S256";
    code_verifier_stored: false;
    plain_method_allowed: false;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  redirect_uri: string;
  request_id: string;
  revocation: {
    revoke_route: "POST /mcp/oauth/revoke/plan";
    revocable: true;
  };
  route: "POST /mcp/oauth/authorize/plan";
  status: McpOAuthPlanStatus;
  third_party_token_passthrough: false;
  token_issued: false;
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  user: {
    source: "request" | "synthetic_default";
    user_id: string;
  };
  version: typeof MCP_OAUTH_PKCE_VERSION;
  workspace: {
    source: "request" | "synthetic_default";
    workspace_id: string;
  };
}

export interface McpOAuthTokenPlan {
  action: "token";
  authorization_code: {
    authorization_code_received: true;
    one_time_use_required: true;
  };
  client_id?: string;
  data_version: typeof MCP_OAUTH_PKCE_VERSION;
  live_oauth_provider: false;
  methodology_version: typeof MCP_OAUTH_PKCE_VERSION;
  pkce_verification: {
    code_verifier_received: true;
    verification_status: "planned_no_live";
    verifier_hash_stored: false;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  route: "POST /mcp/oauth/token/plan";
  scope_binding: {
    requested_scopes: McpOAuthScope[];
    scopes_bound_to_token: true;
  };
  status: McpOAuthPlanStatus;
  third_party_token_passthrough: false;
  token: {
    access_token_issued: false;
    audience: "aiphabee-mcp";
    expires_in_seconds: 900;
    refresh_token_issued: false;
  };
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  version: typeof MCP_OAUTH_PKCE_VERSION;
}

export interface McpOAuthRevokePlan {
  action: "revoke";
  connection_id?: string;
  data_version: typeof MCP_OAUTH_PKCE_VERSION;
  live_oauth_provider: false;
  methodology_version: typeof MCP_OAUTH_PKCE_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  reason?: string;
  request_id: string;
  revocation_plan: {
    future_calls_denied_after_revoke: true;
    revoke_status: "planned_no_live";
    scope_grants_removed: "planned";
    token_invalidation_live: false;
  };
  route: "POST /mcp/oauth/revoke/plan";
  status: McpOAuthPlanStatus;
  token_id?: string;
  usage: {
    cached: false;
    credits: 0;
    rows: 1;
  };
  version: typeof MCP_OAUTH_PKCE_VERSION;
}

export interface McpApiKeyScopeGrant {
  data_classes: readonly string[];
  scope: McpOAuthScope;
  write: boolean;
}

export interface McpApiKeyBasePlan {
  api_key_live: false;
  data_version: typeof MCP_API_KEY_VERSION;
  frontend_rendering: false;
  hash_storage: {
    hash_algorithm: "hmac_sha256_with_pepper_planned";
    key_hash_stored: true;
    key_last_four_stored: true;
    pepper_required: true;
    raw_key_stored: false;
    storage_status: "planned_no_live";
  };
  ip_restrictions: {
    allowlist: string[];
    enforcement_status: "planned_no_live";
    ip_allowlist_supported: true;
    validated: true;
  };
  key_material: {
    display_window: "create_or_rotate_response_only";
    key_material_returned: false;
    key_prefix: "aipb_srv_";
    one_time_display: true;
  };
  methodology_version: typeof MCP_API_KEY_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  scope_binding: {
    requested_scopes: McpOAuthScope[];
    scope_grants: McpApiKeyScopeGrant[];
    scopes_bound_to_key: true;
  };
  server_to_server: {
    browser_use_allowed: false;
    allowed_only: true;
  };
  status: McpApiKeyPlanStatus;
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  version: typeof MCP_API_KEY_VERSION;
}

export interface McpApiKeyCreatePlan extends McpApiKeyBasePlan {
  action: "create";
  api_key: {
    issued: false;
    key_id: string;
    key_name: string;
    key_status: "planned_no_live";
    live_secret_generated: false;
  };
  owner: {
    owner_id: string;
    source: "request" | "synthetic_default";
  };
  rotation: {
    default_rotation_after_days: number;
    rotatable: true;
    rotate_route: "POST /mcp/api-keys/rotate/plan";
  };
  route: "POST /mcp/api-keys/create/plan";
  revocation: {
    future_calls_denied_after_revoke: true;
    revoke_route: "POST /mcp/api-keys/revoke/plan";
  };
  workspace: {
    source: "request" | "synthetic_default";
    workspace_id: string;
  };
}

export interface McpApiKeyRotatePlan extends McpApiKeyBasePlan {
  action: "rotate";
  api_key: {
    key_id: string;
    live_secret_generated: false;
    new_key_material_display_once: true;
    old_key_future_calls_denied_after_rotation: true;
    rotation_overlap_seconds: 0;
    rotation_status: "planned_no_live";
  };
  reason?: string;
  rotation: {
    next_rotation_after_days: number;
    rotatable: true;
  };
  route: "POST /mcp/api-keys/rotate/plan";
}

export interface McpApiKeyRevokePlan {
  action: "revoke";
  api_key_live: false;
  data_version: typeof MCP_API_KEY_VERSION;
  key_id: string;
  methodology_version: typeof MCP_API_KEY_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  reason?: string;
  request_id: string;
  revocation_plan: {
    future_calls_denied_after_revoke: true;
    key_hash_disabled: "planned";
    live_invalidation: false;
    revoke_status: "planned_no_live";
  };
  route: "POST /mcp/api-keys/revoke/plan";
  status: McpApiKeyPlanStatus;
  usage: {
    cached: false;
    credits: 0;
    rows: 1;
  };
  version: typeof MCP_API_KEY_VERSION;
}

export interface McpProtocolPlan {
  api_key_live: false;
  client: {
    name: string;
    version: string;
  };
  data_version: typeof MCP_RUNTIME_VERSION;
  default_deny: true;
  developer_console: {
    console_ready: false;
    first_call_guide: "planned";
    logs_visible: false;
  };
  endpoint: "/mcp";
  frontend_rendering: false;
  initialize?: {
    capabilities: {
      tools: {
        listChanged: false;
      };
    };
    protocol_version: "2025-03-26";
    server_info: {
      name: "aiphabee-mcp";
      version: typeof MCP_RUNTIME_VERSION;
    };
  };
  live_tool_execution: false;
  method: McpMethod;
  methodology_version: typeof MCP_RUNTIME_VERSION;
  oauth_live: false;
  origin_check: {
    allowed_origins: readonly string[];
    origin: string;
    required: true;
    valid: true;
  };
  protocol: {
    json_rpc: "2.0";
    streamable_http: true;
    supported_methods: typeof MCP_SUPPORTED_METHODS;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  revocation_enforcement?: McpRevocationEnforcementPlan;
  response_shape: {
    mcp_error_detail_fields: readonly string[];
    standard_error_categories: typeof MCP_STANDARD_ERROR_CATEGORIES;
    standard_error_code_version: typeof MCP_STANDARD_ERROR_CODES_VERSION;
    standard_error_codes: typeof MCP_STANDARD_ERROR_CODES;
    standard_error_definitions: typeof MCP_STANDARD_ERROR_DEFINITIONS;
    standard_response_envelope: true;
    structured_content_required: true;
  };
  rights_gate: {
    blocked_reason?: "MCP_API_REDISTRIBUTION_RIGHTS_NOT_CONFIRMED";
    default_deny: true;
    mcp_api_redistribution_rights_confirmed: boolean;
    web_rights_do_not_imply_mcp: true;
  };
  status: McpRuntimePlanStatus;
  tool_call?: {
    bounded_retrieval: McpToolBoundedRetrievalPlan;
    input_schema_id: string;
    input_validation: McpToolInputValidationPlan;
    live_execution: false;
    output_schema_id: string;
    output_validation: McpToolStructuredContentValidationPlan;
    requested_tool_name: RegisteredToolName;
    required_scope: string;
    schema_validation: "validated";
    structured_content_validation: "planned_no_live";
    usage_envelope: McpUsageEnvelopePlan;
    tool_limits: McpToolLimitsPlan;
  };
  tools_list?: {
    blocked_tool_count: number;
    returned_tool_count: number;
    schema_snapshot: McpToolsListSchemaSnapshotSummary;
    tool_catalog_available_after_rights_gate: true;
    tools: McpToolDescriptor[];
  };
  transport: "streamable_http";
  usage: McpUsageSummary;
  version: typeof MCP_RUNTIME_VERSION;
}

export const MCP_STANDARD_ERROR_CODES = [
  "AUTH_REQUIRED",
  "SCOPE_DENIED",
  "DATA_NOT_LICENSED",
  "SYMBOL_AMBIGUOUS",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "UPSTREAM_STALE",
  "DATA_QUALITY_HOLD",
  "INTERNAL_ERROR"
] as const;
export type McpStandardErrorCode = (typeof MCP_STANDARD_ERROR_CODES)[number];

export const MCP_STANDARD_ERROR_CATEGORIES = [
  "authentication",
  "authorization",
  "data",
  "limit",
  "system"
] as const satisfies readonly McpStandardErrorCategory[];

export const MCP_STANDARD_ERROR_DEFINITIONS = [
  {
    category: "authentication",
    client_action: "reauthorize",
    code: "AUTH_REQUIRED",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_auth_required"
  },
  {
    category: "authorization",
    client_action: "request_additional_scope",
    code: "SCOPE_DENIED",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_scope_denied"
  },
  {
    category: "authorization",
    client_action: "upgrade_or_reduce_scope",
    code: "DATA_NOT_LICENSED",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_data_not_licensed"
  },
  {
    category: "data",
    client_action: "select_security_candidate",
    code: "SYMBOL_AMBIGUOUS",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_symbol_ambiguous"
  },
  {
    category: "limit",
    client_action: "narrow_request",
    code: "OUT_OF_RANGE",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_out_of_range"
  },
  {
    category: "limit",
    client_action: "narrow_request",
    code: "TOO_MANY_ROWS",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_too_many_rows"
  },
  {
    category: "limit",
    client_action: "retry_after",
    code: "RATE_LIMITED",
    recoverable: true,
    retry_after_required: true,
    source_record_id: "mcp_error_rate_limited"
  },
  {
    category: "limit",
    client_action: "upgrade_or_shrink_task",
    code: "BUDGET_EXCEEDED",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_budget_exceeded"
  },
  {
    category: "data",
    client_action: "show_last_available_as_of",
    code: "UPSTREAM_STALE",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_upstream_stale"
  },
  {
    category: "data",
    client_action: "try_alternate_methodology_or_retry_later",
    code: "DATA_QUALITY_HOLD",
    recoverable: true,
    retry_after_required: false,
    source_record_id: "mcp_error_data_quality_hold"
  },
  {
    category: "system",
    client_action: "contact_support_with_request_id",
    code: "INTERNAL_ERROR",
    recoverable: false,
    retry_after_required: false,
    source_record_id: "mcp_error_internal_error"
  }
] as const satisfies readonly McpStandardErrorDefinition[];

const MCP_RUNTIME_INPUT_ERROR_TO_STANDARD_ERROR = {
  API_KEY_ID_REQUIRED: "AUTH_REQUIRED",
  API_KEY_NAME_REQUIRED: "SCOPE_DENIED",
  AUTHORIZATION_CODE_REQUIRED: "AUTH_REQUIRED",
  CLIENT_ID_REQUIRED: "SCOPE_DENIED",
  CODE_CHALLENGE_METHOD_UNSUPPORTED: "SCOPE_DENIED",
  CODE_CHALLENGE_REQUIRED: "SCOPE_DENIED",
  CODE_VERIFIER_REQUIRED: "AUTH_REQUIRED",
  CREDENTIAL_KIND_REQUIRED: "AUTH_REQUIRED",
  CREDENTIAL_REFERENCE_REQUIRED: "AUTH_REQUIRED",
  CREDENTIAL_STATUS_REQUIRED: "AUTH_REQUIRED",
  CREDENTIAL_STATUS_UNSUPPORTED: "AUTH_REQUIRED",
  CONNECTION_OR_TOKEN_REQUIRED: "AUTH_REQUIRED",
  INVALID_API_KEY_ROTATION_DAYS: "SCOPE_DENIED",
  INVALID_CODE_CHALLENGE: "SCOPE_DENIED",
  INVALID_IP_ALLOWLIST: "SCOPE_DENIED",
  INVALID_REDIRECT_URI: "SCOPE_DENIED",
  MCP_CREDENTIAL_REVOKED: "AUTH_REQUIRED",
  MCP_REDISTRIBUTION_RIGHTS_REQUIRED: "DATA_NOT_LICENSED",
  ORIGIN_NOT_ALLOWED: "SCOPE_DENIED",
  ORIGIN_REQUIRED: "SCOPE_DENIED",
  RAW_API_KEY_FORBIDDEN: "SCOPE_DENIED",
  REDIRECT_URI_REQUIRED: "SCOPE_DENIED",
  SCOPE_REQUIRED: "SCOPE_DENIED",
  TOOL_ARGUMENT_REQUIRED: "OUT_OF_RANGE",
  TOOL_ARGUMENT_UNSUPPORTED: "OUT_OF_RANGE",
  TOOL_ARGUMENTS_OBJECT_REQUIRED: "OUT_OF_RANGE",
  TOOL_CURSOR_INVALID: "OUT_OF_RANGE",
  TOOL_LIMIT_EXCEEDED: "TOO_MANY_ROWS",
  TOOL_LIMIT_INVALID: "OUT_OF_RANGE",
  TOOL_NAME_REQUIRED: "SCOPE_DENIED",
  TOOL_NOT_REGISTERED: "SCOPE_DENIED",
  TOOL_SCOPE_REQUIRED: "SCOPE_DENIED",
  TOOL_TIME_RANGE_EXCEEDED: "OUT_OF_RANGE",
  TOOL_TIME_RANGE_INVALID: "OUT_OF_RANGE",
  UNSUPPORTED_METHOD: "OUT_OF_RANGE",
  UNSUPPORTED_SCOPE: "SCOPE_DENIED"
} as const satisfies Record<McpRuntimeInputErrorCode, McpStandardErrorCode>;

const MCP_TOOL_INPUT_VALIDATION_RULES = {
  get_corporate_actions: {
    allowed: ["instrument_id", "instrumentId", "from", "to", "types", "limit", "cursor"],
    anyOf: [["instrument_id"], ["instrumentId"]],
    required: ["from", "to"]
  },
  get_data_lineage: {
    allowed: [
      "evidence_id",
      "evidenceId",
      "record_id",
      "recordId",
      "as_of",
      "asOf",
      "include_upstream",
      "includeUpstream"
    ],
    anyOf: [["evidence_id"], ["evidenceId"], ["record_id"], ["recordId"]],
    required: []
  },
  get_entitlements: {
    allowed: [
      "workspace_id",
      "workspaceId",
      "channel",
      "tool_name",
      "toolName",
      "dataset",
      "fields",
      "as_of",
      "asOf",
      "time_range",
      "timeRange",
      "requested_rows",
      "requestedRows",
      "export_requested",
      "exportRequested",
      "plan"
    ],
    anyOf: [],
    required: []
  },
  get_ipo_profile: {
    allowed: [
      "ipo_id",
      "ipoId",
      "hkex_code",
      "hkexCode",
      "listing_date",
      "listingDate",
      "include_sensitive_fields",
      "includeSensitiveFields"
    ],
    anyOf: [["ipo_id"], ["ipoId"], ["hkex_code"], ["hkexCode"]],
    required: []
  },
  search_ipo_calendar: {
    allowed: ["from", "to", "event_types", "eventTypes", "limit", "cursor"],
    anyOf: [],
    required: []
  },
  get_ipo_timetable: {
    allowed: ["ipo_id", "ipoId", "hkex_code", "hkexCode", "listing_date", "listingDate"],
    anyOf: [["ipo_id"], ["ipoId"], ["hkex_code"], ["hkexCode"]],
    required: []
  },
  get_ipo_offering: {
    allowed: ["ipo_id", "ipoId", "hkex_code", "hkexCode", "listing_date", "listingDate"],
    anyOf: [["ipo_id"], ["ipoId"], ["hkex_code"], ["hkexCode"]],
    required: []
  },
  get_ipo_allotment: {
    allowed: [
      "ipo_id",
      "ipoId",
      "hkex_code",
      "hkexCode",
      "listing_date",
      "listingDate",
      "limit",
      "cursor"
    ],
    anyOf: [["ipo_id"], ["ipoId"], ["hkex_code"], ["hkexCode"]],
    required: []
  },
  screen_ipos: {
    allowed: [
      "status",
      "board",
      "sector",
      "listing_type",
      "listingType",
      "listing_date_from",
      "listingDateFrom",
      "listing_date_to",
      "listingDateTo",
      "min_oversubscription",
      "minOversubscription",
      "has_cornerstone",
      "hasCornerstone",
      "limit",
      "cursor"
    ],
    anyOf: [],
    required: []
  },
  compare_ipos: {
    allowed: ["ipo_ids", "ipoIds"],
    anyOf: [["ipo_ids"], ["ipoIds"]],
    required: []
  },
  get_financial_facts: {
    allowed: [
      "instrument_id",
      "instrumentId",
      "from",
      "to",
      "metrics",
      "statement_types",
      "statementTypes",
      "as_of",
      "asOf",
      "limit",
      "cursor"
    ],
    anyOf: [["instrument_id"], ["instrumentId"]],
    required: ["from", "to"]
  },
  get_financial_ratios: {
    allowed: [
      "instrument_id",
      "instrumentId",
      "security_query",
      "securityQuery",
      "financial_from",
      "financialFrom",
      "financial_to",
      "financialTo",
      "as_of",
      "asOf",
      "metrics"
    ],
    anyOf: [["instrument_id"], ["instrumentId"], ["security_query"], ["securityQuery"]],
    required: ["financial_from", "financial_to"]
  },
  search_announcements: {
    allowed: [
      "instrument_id",
      "instrumentId",
      "security_query",
      "securityQuery",
      "from",
      "to",
      "published_from",
      "publishedFrom",
      "published_to",
      "publishedTo",
      "categories",
      "announcement_categories",
      "keyword",
      "query",
      "language",
      "limit"
    ],
    anyOf: [["instrument_id"], ["instrumentId"], ["security_query"], ["securityQuery"]],
    required: ["from", "to"]
  },
  get_announcement: {
    allowed: ["document_id", "documentId", "sections", "max_excerpt_chars", "maxExcerptChars"],
    anyOf: [["document_id"], ["documentId"]],
    required: []
  },
  screen_securities: {
    allowed: [
      "universe",
      "conditions",
      "natural_language",
      "naturalLanguage",
      "query",
      "financial_from",
      "financialFrom",
      "financial_to",
      "financialTo",
      "as_of",
      "asOf",
      "classification_as_of",
      "classificationAsOf",
      "limit"
    ],
    anyOf: [],
    required: []
  },
  compare_securities: {
    allowed: [
      "securities",
      "metrics",
      "period",
      "financial_from",
      "financialFrom",
      "financial_to",
      "financialTo",
      "as_of",
      "asOf",
      "target_currency",
      "targetCurrency"
    ],
    anyOf: [],
    required: ["securities"]
  },
  calculate_returns_risk: {
    allowed: [
      "instrument_id",
      "instrumentId",
      "security_query",
      "securityQuery",
      "from",
      "to",
      "adjustment",
      "benchmark_instrument_id",
      "benchmarkInstrumentId",
      "benchmark_security_query",
      "benchmarkSecurityQuery",
      "as_of",
      "asOf"
    ],
    anyOf: [["instrument_id"], ["instrumentId"], ["security_query"], ["securityQuery"]],
    required: ["from", "to"]
  },
  get_event_timeline: {
    allowed: ["instrument_id", "instrumentId", "from", "to", "types", "limit", "cursor"],
    anyOf: [["instrument_id"], ["instrumentId"]],
    required: ["from", "to"]
  },
  get_market_calendar: {
    allowed: ["market", "from", "to"],
    anyOf: [],
    required: ["market", "from", "to"]
  },
  get_price_history: {
    allowed: [
      "instrument_id",
      "instrumentId",
      "from",
      "to",
      "adjustment",
      "fields",
      "limit",
      "cursor"
    ],
    anyOf: [["instrument_id"], ["instrumentId"]],
    required: ["from", "to"]
  },
  get_quote_snapshot: {
    allowed: ["instrument_id", "instrumentId", "mode", "fields", "as_of"],
    anyOf: [["instrument_id"], ["instrumentId"]],
    required: []
  },
  get_security_profile: {
    allowed: ["instrument_id", "instrumentId", "as_of"],
    anyOf: [["instrument_id"], ["instrumentId"]],
    required: []
  },
  resolve_security: {
    allowed: ["query", "market", "as_of"],
    anyOf: [],
    required: ["query"]
  }
} as const satisfies Record<
  RegisteredToolName,
  {
    allowed: readonly string[];
    anyOf: readonly (readonly string[])[];
    required: readonly string[];
  }
>;

export function getMcpRuntimeCapabilities() {
  return {
    allowed_origins: DEFAULT_MCP_ALLOWED_ORIGINS,
    api_key_create_route: "POST /mcp/api-keys/create/plan" as const,
    api_key_hash_storage_ready: true,
    api_key_ip_allowlist_ready: true,
    api_key_live: false,
    api_key_one_time_display_ready: true,
    api_key_revoke_route: "POST /mcp/api-keys/revoke/plan" as const,
    api_key_revoke_enforced_before_new_calls: true,
    api_key_rotate_route: "POST /mcp/api-keys/rotate/plan" as const,
    api_key_rotation_old_key_denied: true,
    api_key_rotation_ready: true,
    api_key_runtime_route: "GET /mcp/api-keys/runtime" as const,
    breaking_changes_require_new_major: true,
    default_deny: true,
    deprecation_policy_ready: true,
    developer_console_live: false,
    mcp_compatibility_status_ready: true,
    mcp_compatibility_status_route: "GET /mcp/compatibility/status" as const,
    mcp_compatibility_status_version: MCP_COMPATIBILITY_STATUS_VERSION,
    mcp_live_client_e2e_passed: false,
    mcp_protocol_release_gate_ready: true,
    mcp_protocol_release_gate_required_checks:
      MCP_PROTOCOL_RELEASE_GATE_REQUIRED_CHECKS,
    mcp_protocol_release_gate_route: "POST /mcp/release-gates/protocol/plan" as const,
    mcp_protocol_release_gate_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
    mcp_auth_limits_release_gate_ready: true,
    mcp_auth_limits_release_gate_required_checks:
      MCP_AUTH_LIMITS_RELEASE_GATE_REQUIRED_CHECKS,
    mcp_auth_limits_release_gate_route: "POST /mcp/release-gates/auth-limits/plan" as const,
    mcp_auth_limits_release_gate_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
    mcp_target_clients_console_release_gate_ready: true,
    mcp_target_clients_console_release_gate_required_checks:
      MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_REQUIRED_CHECKS,
    mcp_target_clients_console_release_gate_route:
      "POST /mcp/release-gates/target-clients-console/plan" as const,
    mcp_target_clients_console_release_gate_version:
      MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
    mcp_target_client_e2e_matrix_ready: true,
    mcp_developer_console_backend_ready: true,
    mcp_developer_console_forbidden_fields: MCP_DEVELOPER_CONSOLE_FORBIDDEN_FIELDS,
    mcp_developer_console_live: false,
    mcp_developer_console_log_fields: MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS,
    mcp_developer_console_required_checks: MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS,
    mcp_developer_console_route: "POST /mcp/developer-console/plan" as const,
    mcp_developer_console_version: MCP_DEVELOPER_CONSOLE_VERSION,
    mcp_target_protocol_version: MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION,
    mcp_client_maturity_ready: true,
    mcp_client_maturity_reference_urls: MCP_CLIENT_MATURITY_REFERENCE_URLS,
    mcp_client_maturity_required_checks: MCP_CLIENT_MATURITY_REQUIRED_CHECKS,
    mcp_client_maturity_route: "POST /mcp/client-maturity/plan" as const,
    mcp_client_maturity_supported_features: MCP_CLIENT_MATURITY_FEATURES,
    mcp_client_maturity_target_clients: MCP_CLIENT_MATURITY_TARGET_CLIENTS,
    mcp_client_maturity_version: MCP_CLIENT_MATURITY_VERSION,
    mcp_interactive_apps_live: false,
    mcp_prompts_live: false,
    mcp_resources_live: false,
    developer_console_reconciliation_ready: true,
    live_tool_execution: false,
    mcp_api_redistribution_rights_confirmed: false,
    oauth_authorize_route: "POST /mcp/oauth/authorize/plan" as const,
    oauth_live: false,
    oauth_pkce_ready: true,
    oauth_revoke_enforced_before_new_calls: true,
    oauth_revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    oauth_runtime_route: "GET /mcp/oauth/runtime" as const,
    oauth_token_route: "POST /mcp/oauth/token/plan" as const,
    origin_validation: true,
    package: "@aiphabee/mcp-runtime" as const,
    pkce_methods: ["S256"] as const,
    cursor_pagination_ready: true,
    max_row_limit_enforced: true,
    pagination_limits_ready: true,
    pagination_limits_version: MCP_PAGINATION_LIMITS_VERSION,
    pagination_or_rights_bypass_blocked: true,
    route: "POST /mcp" as const,
    runtime_route: "GET /mcp/runtime" as const,
    runtime_schema_serving: true,
    runtime_schema_snapshot_route: MCP_RUNTIME_SCHEMA_SNAPSHOT_ROUTE,
    runtime_schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
    schema_source_contract: MCP_TOOL_SCHEMA_SOURCE_CONTRACT,
    scopes_revocable: true,
    mcp_revocation_enforcement_error_code: "AUTH_REQUIRED" as const,
    mcp_revocation_enforcement_live: false,
    mcp_revocation_enforcement_ready: true,
    mcp_revocation_enforcement_route: "POST /mcp/revocations/enforce/plan" as const,
    mcp_revocation_enforcement_version: MCP_REVOCATION_ENFORCEMENT_VERSION,
    structured_content_output_schema_ready: true,
    mcp_error_detail_fields: [
      "category",
      "client_action",
      "internal_code",
      "mcp_error_version",
      "recoverable",
      "request_id",
      "retry_after_required",
      "source_record_id"
    ] as const,
    standard_error_categories: MCP_STANDARD_ERROR_CATEGORIES,
    standard_error_code_version: MCP_STANDARD_ERROR_CODES_VERSION,
    standard_error_codes: MCP_STANDARD_ERROR_CODES,
    standard_error_codes_ready: true,
    standard_error_definitions: MCP_STANDARD_ERROR_DEFINITIONS,
    status: "mcp_endpoint_default_deny_scaffold" as const,
    tool_call_input_strict_validation: true,
    budget_limit_plan_ready: true,
    concurrency_limit_plan_ready: true,
    mcp_limiter_error_codes: ["RATE_LIMITED", "BUDGET_EXCEEDED"] as const,
    mcp_limiter_live: false,
    mcp_tool_limiter_dimensions: [
      "user",
      "workspace",
      "client",
      "tool",
      "dataset",
      "ip_risk"
    ] as const,
    mcp_tool_limiter_ip_reputation_live: false,
    mcp_tool_limiter_pools: [
      {
        high_cost: false,
        max_parallel: MCP_TOOL_LIMITER_STANDARD_MAX_PARALLEL,
        name: "mcp_standard",
        ordinary_pool_protection: true
      },
      {
        high_cost: true,
        max_parallel: MCP_TOOL_LIMITER_HIGH_COST_MAX_PARALLEL,
        name: "mcp_high_cost",
        ordinary_pool_protection: true,
        queue_name: "mcp-high-cost"
      }
    ] as const,
    mcp_tool_limiter_raw_ip_stored: false,
    mcp_tool_limiter_ready: true,
    mcp_tool_limiter_version: MCP_TOOL_LIMITER_VERSION,
    ordinary_pool_protection: true,
    rate_limit_plan_ready: true,
    time_range_limits_ready: true,
    tool_schema_validation_version: MCP_TOOL_SCHEMA_VALIDATION_VERSION,
    tools_list_schema_snapshot: true,
    tool_versioning_ready: true,
    usage_envelope_ready: true,
    usage_envelope_version: MCP_USAGE_ENVELOPE_VERSION,
    usage_ledger_event_writer_version: USAGE_LEDGER_EVENT_WRITER_VERSION,
    usage_quota_display_version: USAGE_QUOTA_DISPLAY_VERSION,
    usage_remaining_ready: true,
    usage_request_id_visible: true,
    usage_reconciliation_ready: true,
    monitored_protocol_versions: MCP_COMPATIBILITY_MONITORED_PROTOCOL_VERSIONS,
    supported_oauth_scopes: MCP_OAUTH_SCOPE_DEFINITIONS.map(
      (definition) => definition.scope
    ),
    supported_methods: MCP_SUPPORTED_METHODS,
    third_party_token_passthrough: false,
    tool_registry_version: TOOL_REGISTRY_VERSION,
    tools_list_live: false,
    transport: "streamable_http" as const,
    version: MCP_RUNTIME_VERSION,
    web_rights_do_not_imply_mcp: true
  };
}

export function getMcpRuntimeSchemaSnapshot(): McpRuntimeSchemaSnapshot {
  const tools = createToolDescriptors(REGISTERED_TOOLS);

  return {
    live_tool_execution: false,
    package: "@aiphabee/mcp-runtime",
    protocol_route: "POST /mcp",
    route: MCP_RUNTIME_SCHEMA_SNAPSHOT_ROUTE,
    runtime_schema_serving: true,
    schema_dialect: MCP_JSON_SCHEMA_DIALECT,
    schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
    schema_source_contract: MCP_TOOL_SCHEMA_SOURCE_CONTRACT,
    status: "runtime_schema_snapshot_scaffold",
    tool_count: tools.length,
    tools,
    tools_list_schema_snapshot: true,
    version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION
  };
}

export function getMcpCompatibilityStatusCapabilities() {
  return {
    inspector_target: "@modelcontextprotocol/inspector" as const,
    live_client_e2e_passed: false,
    monitored_protocol_versions: MCP_COMPATIBILITY_MONITORED_PROTOCOL_VERSIONS,
    package: "@aiphabee/mcp-runtime" as const,
    production_sdk_channel: "typescript-sdk-v1.x" as const,
    protocol_route: "POST /mcp" as const,
    public_status_page_live: false,
    runtime_route: "GET /mcp/runtime" as const,
    status: "mcp_compatibility_status_scaffold" as const,
    status_route: "GET /mcp/compatibility/status" as const,
    target_protocol_version: MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION,
    version: MCP_COMPATIBILITY_STATUS_VERSION
  };
}

export function createMcpCompatibilityStatusPlan(input: {
  requestId: string;
}): McpCompatibilityStatusPlan {
  const usage = createMcpUsageSummary(input, 0, 0);

  return {
    data_version: MCP_COMPATIBILITY_STATUS_VERSION,
    inspector: {
      live_inspector_smoke: false,
      planned_command: "npx @modelcontextprotocol/inspector",
      required_checks: [
        "connectivity",
        "capability_negotiation",
        "tools_tab",
        "error_responses"
      ],
      target: "@modelcontextprotocol/inspector"
    },
    live_client_e2e_passed: false,
    methodology_version: MCP_COMPATIBILITY_STATUS_VERSION,
    monitored_protocol_versions: MCP_COMPATIBILITY_MONITORED_PROTOCOL_VERSIONS,
    package: "@aiphabee/mcp-runtime",
    protocol_route: "POST /mcp",
    provenance: [
      {
        data_version: MCP_COMPATIBILITY_STATUS_VERSION,
        methodology_version: MCP_COMPATIBILITY_STATUS_VERSION,
        source: "mcp-compatibility-status",
        source_record_id: "mcp_compatibility_status_scaffold"
      }
    ],
    release_gate: {
      local_contract_required: "npm run check:mcp-compatibility",
      live_client_smoke_required_before_ga: true,
      remote_mcp_rights_required: true
    },
    request_id: input.requestId,
    runtime_route: "GET /mcp/runtime",
    sdk: {
      latest_seen_v1_release: "v1.29.0",
      live_sdk_smoke: false,
      production_channel: "typescript-sdk-v1.x",
      v2_channel_status: "pre_alpha_not_targeted"
    },
    status: "planned_no_live_compatibility_status",
    status_page: {
      public_status_page_live: false,
      route: "GET /mcp/compatibility/status",
      shows_last_successful_client_smoke: true,
      shows_open_incidents: true,
      shows_protocol_version: true
    },
    status_route: "GET /mcp/compatibility/status",
    target_clients: [
      {
        live_e2e_passed: false,
        name: "mcp_inspector",
        status: "planned_no_live"
      },
      {
        live_e2e_passed: false,
        name: "typescript_sdk_client",
        status: "planned_no_live"
      },
      {
        live_e2e_passed: false,
        name: "claude_desktop",
        status: "blocked_gate0"
      },
      {
        live_e2e_passed: false,
        name: "cursor",
        status: "blocked_gate0"
      },
      {
        live_e2e_passed: false,
        name: "chatgpt_connector",
        status: "blocked_gate0"
      }
    ],
    target_protocol_version: MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION,
    test_vectors: [
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "streamable_http_post"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "initialize_negotiation"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "tools_list"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "tools_call_schema_validation"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "structured_content_text_fallback"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "oauth_pkce"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "api_key_lifecycle"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "pagination_limits"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "standard_errors"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "usage_and_request_id"
      },
      {
        local_contract_ready: true,
        live_smoke_passed: false,
        name: "as_of_delay_source_display"
      }
    ],
    usage,
    version: MCP_COMPATIBILITY_STATUS_VERSION
  };
}

export function getMcpProtocolReleaseGateCapabilities() {
  return {
    authentication_gate_ready: true,
    compatibility_status_route: "GET /mcp/compatibility/status" as const,
    input_output_schema_compatibility_ready: true,
    live_auth_middleware: false,
    live_client_e2e_passed: false,
    package: "@aiphabee/mcp-runtime" as const,
    protocol_route: "POST /mcp" as const,
    required_checks: MCP_PROTOCOL_RELEASE_GATE_REQUIRED_CHECKS,
    route: "POST /mcp/release-gates/protocol/plan" as const,
    runtime_route: "GET /mcp/runtime" as const,
    status: "mcp_protocol_release_gate_scaffold" as const,
    streamable_http_ready: true,
    target_protocol_version: MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION,
    version: MCP_PROTOCOL_RELEASE_GATE_VERSION
  };
}

export function createMcpProtocolReleaseGatePlan(
  input: CreateMcpProtocolReleaseGatePlanInput
) {
  const origin = normalizeText(input.origin) ?? DEFAULT_MCP_ALLOWED_ORIGINS[0];
  const allowedOrigins = input.allowedOrigins ?? DEFAULT_MCP_ALLOWED_ORIGINS;
  const toolArguments = {
    instrument_id: "HK:00700"
  };
  const initializePlan = createMcpProtocolPlan({
    allowedOrigins,
    clientName: input.clientName ?? "mcp-release-gate-local",
    clientVersion: input.clientVersion ?? MCP_PROTOCOL_RELEASE_GATE_VERSION,
    method: "initialize",
    origin,
    requestId: `${input.requestId}:initialize`
  });
  const toolsListDefaultDenyPlan = createMcpProtocolPlan({
    allowedOrigins,
    method: "tools/list",
    origin,
    requestId: `${input.requestId}:tools-list-default-deny`
  });
  const originDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      method: "initialize",
      origin: "https://untrusted.example",
      requestId: `${input.requestId}:origin-denied`
    })
  );
  const authDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      connectionId: "mcp_connection_revoked",
      credentialKind: "oauth_connection",
      credentialStatus: "revoked",
      grantedScopes: ["quotes:read"],
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:auth-denied`,
      revokedAt: "2026-06-21T00:00:00.000Z",
      toolArguments,
      toolName: "get_quote_snapshot"
    })
  );
  const rightsDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:rights-denied`,
      toolArguments,
      toolName: "get_quote_snapshot"
    })
  );
  const invalidInputDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      connectionId: "mcp_connection_active",
      credentialKind: "oauth_connection",
      credentialStatus: "active",
      grantedScopes: ["quotes:read"],
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:schema-denied`,
      toolArguments: {
        ...toolArguments,
        unsupported_field: "blocked"
      },
      toolName: "get_quote_snapshot"
    })
  );
  const toolCallPlan = createMcpProtocolPlan({
    allowedOrigins,
    connectionId: "mcp_connection_active",
    credentialKind: "oauth_connection",
    credentialStatus: "active",
    grantedScopes: ["quotes:read"],
    mcpRedistributionRightsConfirmed: true,
    method: "tools/call",
    origin,
    pendingCredits: input.pendingCredits,
    requestId: `${input.requestId}:tool-call-schema`,
    toolArguments,
    toolName: "get_quote_snapshot",
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const compatibilityPlan = createMcpCompatibilityStatusPlan({
    requestId: `${input.requestId}:compatibility`
  });
  const capability = getMcpProtocolReleaseGateCapabilities();
  const validation = {
    auth_enforced_before_tool_execution:
      authDenied.code === "MCP_CREDENTIAL_REVOKED" &&
      authDenied.standard_error_code === "AUTH_REQUIRED" &&
      authDenied.details.enforcedBeforeToolExecution === true &&
      toolCallPlan.revocation_enforcement?.denial.denied === false,
    compatibility_vectors_present: [
      "streamable_http_post",
      "initialize_negotiation",
      "tools_call_schema_validation",
      "structured_content_text_fallback"
    ].every((name) =>
      compatibilityPlan.test_vectors.some(
        (vector) => vector.name === name && vector.local_contract_ready
      )
    ),
    no_frontend_rendering:
      initializePlan.frontend_rendering === false &&
      toolCallPlan.frontend_rendering === false,
    no_live_auth_middleware:
      authDenied.live_auth_middleware === false &&
      toolCallPlan.revocation_enforcement?.live_auth_middleware === false,
    no_live_client_smoke:
      compatibilityPlan.live_client_e2e_passed === false &&
      compatibilityPlan.inspector.live_inspector_smoke === false &&
      compatibilityPlan.sdk.live_sdk_smoke === false,
    no_live_tool_execution: toolCallPlan.live_tool_execution === false,
    origin_required_and_allowed:
      initializePlan.origin_check.required &&
      initializePlan.origin_check.valid &&
      originDenied.code === "ORIGIN_NOT_ALLOWED",
    streamable_http_initialize_contract:
      initializePlan.transport === "streamable_http" &&
      initializePlan.protocol.streamable_http &&
      initializePlan.initialize?.protocol_version ===
        MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION,
    tools_call_input_schema_validation:
      toolCallPlan.tool_call?.input_validation.schema_validation_status ===
        "validated" && invalidInputDenied.code === "TOOL_ARGUMENT_UNSUPPORTED",
    tools_call_output_schema_contract:
      toolCallPlan.tool_call?.output_validation
        .structured_content_matches_output_schema === "planned_no_live" &&
      toolCallPlan.tool_call.output_validation.structured_content_required,
    tools_list_default_deny_until_rights_confirmed:
      toolsListDefaultDenyPlan.tools_list?.returned_tool_count === 0 &&
      toolsListDefaultDenyPlan.rights_gate.default_deny &&
      rightsDenied.code === "MCP_REDISTRIBUTION_RIGHTS_REQUIRED"
  };
  const releaseChecks = capability.required_checks.map((check) => ({
    check,
    evidence:
      check === "streamable_http_initialize_contract"
        ? "createMcpProtocolPlan initialize returns JSON-RPC 2.0 Streamable HTTP metadata and target protocol version"
        : check === "origin_required_and_allowed"
          ? "trusted Origin is accepted and untrusted Origin maps to ORIGIN_NOT_ALLOWED before protocol planning"
          : check === "auth_enforced_before_tool_execution"
            ? "revoked OAuth credential maps to AUTH_REQUIRED before tools/call execution planning"
            : check === "tools_list_default_deny_until_rights_confirmed"
              ? "tools/list returns no descriptors and tools/call is blocked until MCP redistribution rights are confirmed"
              : check === "tools_call_input_schema_validation"
                ? "tools/call validates strict input arguments and rejects unsupported fields"
                : check === "tools_call_output_schema_contract"
                  ? "tools/call exposes output_schema_id and structuredContent output validation metadata"
                  : "compatibility status exposes local Streamable HTTP, initialize, schema, and fallback vectors",
    status: "planned_no_write" as const
  }));

  return {
    auth_gate: {
      active_credential_plan: toolCallPlan.revocation_enforcement,
      denied_error: authDenied,
      live_auth_middleware: false,
      rights_denied_error: rightsDenied
    },
    capability,
    compatibility_gate: {
      inspector: compatibilityPlan.inspector,
      live_client_e2e_passed: compatibilityPlan.live_client_e2e_passed,
      monitored_protocol_versions: compatibilityPlan.monitored_protocol_versions,
      sdk: compatibilityPlan.sdk,
      target_clients: compatibilityPlan.target_clients,
      target_protocol_version: compatibilityPlan.target_protocol_version,
      test_vectors: compatibilityPlan.test_vectors
    },
    data_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
    frontend_rendering: false,
    live_auth_middleware: false,
    live_client_e2e_passed: false,
    live_db_writes: false,
    live_tool_execution: false,
    methodology_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
    model_calls: false,
    origin_gate: {
      allowed_origin_check: initializePlan.origin_check,
      denied_error: originDenied
    },
    persistent_writes: false,
    protocol_gate: {
      initialize: initializePlan.initialize,
      protocol: initializePlan.protocol,
      protocol_route: "POST /mcp",
      transport: initializePlan.transport
    },
    provenance: [
      {
        data_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
        methodology_version: MCP_PROTOCOL_RELEASE_GATE_VERSION,
        source: "mcp-runtime",
        source_record_id: "mcp_protocol_release_gate"
      }
    ],
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_oauth_provider_missing",
        "live_auth_middleware_missing",
        "live_sdk_inspector_smoke_missing",
        "target_client_e2e_missing"
      ],
      gate_status: "blocked_live_mcp_protocol_validation",
      no_live_release_claim: true,
      required_signoffs: ["platform", "security", "data-rights", "developer-relations"]
    },
    request_id: input.requestId,
    route: "POST /mcp/release-gates/protocol/plan" as const,
    schema_compatibility_gate: {
      invalid_input_denial: invalidInputDenied,
      input_schema_id: toolCallPlan.tool_call?.input_schema_id,
      input_validation: toolCallPlan.tool_call?.input_validation,
      output_schema_id: toolCallPlan.tool_call?.output_schema_id,
      output_validation: toolCallPlan.tool_call?.output_validation,
      requested_tool_name: toolCallPlan.tool_call?.requested_tool_name,
      required_scope: toolCallPlan.tool_call?.required_scope,
      schema_validation: toolCallPlan.tool_call?.schema_validation,
      structured_content_validation: toolCallPlan.tool_call?.structured_content_validation
    },
    sql_emitted: false,
    status: "planned_no_write" as const,
    tools_list_gate: {
      default_deny_plan: toolsListDefaultDenyPlan.tools_list,
      rights_gate: toolsListDefaultDenyPlan.rights_gate
    },
    usage: createMcpUsageSummary(input, 0, releaseChecks.length),
    validation,
    version: MCP_PROTOCOL_RELEASE_GATE_VERSION
  };
}

export function getMcpAuthLimitsReleaseGateCapabilities() {
  return {
    api_key_revoke_route: "POST /mcp/api-keys/revoke/plan" as const,
    api_key_rotate_route: "POST /mcp/api-keys/rotate/plan" as const,
    cursor_pagination_ready: true,
    live_api_key_generation: false,
    live_auth_middleware: false,
    live_limiter_enforcement: false,
    live_oauth_provider: false,
    live_tool_execution: false,
    mcp_error_code_version: MCP_STANDARD_ERROR_CODES_VERSION,
    oauth_authorize_route: "POST /mcp/oauth/authorize/plan" as const,
    oauth_revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    package: "@aiphabee/mcp-runtime" as const,
    protocol_route: "POST /mcp" as const,
    required_checks: MCP_AUTH_LIMITS_RELEASE_GATE_REQUIRED_CHECKS,
    route: "POST /mcp/release-gates/auth-limits/plan" as const,
    runtime_route: "GET /mcp/runtime" as const,
    standard_error_codes: MCP_STANDARD_ERROR_CODES,
    status: "mcp_auth_limits_release_gate_scaffold" as const,
    version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION
  };
}

export function createMcpAuthLimitsReleaseGatePlan(
  input: CreateMcpAuthLimitsReleaseGatePlanInput
) {
  const origin = normalizeText(input.origin) ?? DEFAULT_MCP_ALLOWED_ORIGINS[0];
  const allowedOrigins = input.allowedOrigins ?? DEFAULT_MCP_ALLOWED_ORIGINS;
  const requestedScopes = ["security.read", "market.read", "analytics.run"] as const;
  const priceHistoryArgs = {
    cursor: "cursor_1",
    from: "2026-01-02",
    instrument_id: "HK:00700",
    limit: 3,
    to: "2026-01-07"
  };
  const authorizePlan = createMcpOAuthAuthorizePlan({
    clientId: "client_mcp_auth_limits_gate",
    codeChallenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO0123456789_-",
    codeChallengeMethod: "S256",
    origin,
    redirectUri: "https://client.example/oauth/callback",
    requestId: `${input.requestId}:oauth-authorize`,
    requestedScopes,
    workspaceId: input.workspaceId
  });
  const oauthRevokePlan = createMcpOAuthRevokePlan({
    connectionId: "mcp_connection_release_gate",
    reason: "release_gate_revocation_probe",
    requestId: `${input.requestId}:oauth-revoke`
  });
  const apiKeyRotatePlan = createMcpApiKeyRotatePlan({
    ipAllowlist: ["203.0.113.10"],
    keyId: "mcp_key_release_gate",
    reason: "release_gate_rotation_probe",
    requestId: `${input.requestId}:api-key-rotate`,
    requestedScopes,
    rotationAfterDays: 60
  });
  const apiKeyRevokePlan = createMcpApiKeyRevokePlan({
    keyId: "mcp_key_release_gate",
    reason: "release_gate_revoke_probe",
    requestId: `${input.requestId}:api-key-revoke`
  });
  const validPriceHistoryPlan = createMcpProtocolPlan({
    allowedOrigins,
    connectionId: "mcp_connection_active",
    credentialKind: "oauth_connection",
    credentialStatus: "active",
    grantedScopes: ["prices:read"],
    mcpRedistributionRightsConfirmed: true,
    method: "tools/call",
    origin,
    pendingCredits: input.pendingCredits,
    requestId: `${input.requestId}:price-history-valid`,
    toolArguments: priceHistoryArgs,
    toolName: "get_price_history",
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const oauthRevokedDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      connectionId: "mcp_connection_release_gate",
      credentialKind: "oauth_connection",
      credentialStatus: "revoked",
      grantedScopes: ["prices:read"],
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:oauth-revoked-denied`,
      revokedAt: "2026-06-21T00:00:00.000Z",
      toolArguments: priceHistoryArgs,
      toolName: "get_price_history"
    })
  );
  const apiKeyRotatedDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      credentialKind: "api_key",
      credentialStatus: "rotated",
      grantedScopes: ["prices:read"],
      keyId: "mcp_key_release_gate",
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:api-key-rotated-denied`,
      rotatedAt: "2026-06-21T00:00:00.000Z",
      toolArguments: priceHistoryArgs,
      toolName: "get_price_history"
    })
  );
  const tooManyRowsDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      connectionId: "mcp_connection_active",
      credentialKind: "oauth_connection",
      credentialStatus: "active",
      grantedScopes: ["prices:read"],
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:too-many-rows-denied`,
      toolArguments: {
        ...priceHistoryArgs,
        limit: 4
      },
      toolName: "get_price_history"
    })
  );
  const timeRangeDenied = captureMcpProtocolReleaseGateError(() =>
    createMcpProtocolPlan({
      allowedOrigins,
      connectionId: "mcp_connection_active",
      credentialKind: "oauth_connection",
      credentialStatus: "active",
      grantedScopes: ["prices:read"],
      mcpRedistributionRightsConfirmed: true,
      method: "tools/call",
      origin,
      requestId: `${input.requestId}:time-range-denied`,
      toolArguments: {
        ...priceHistoryArgs,
        from: "2025-01-01",
        to: "2026-12-31"
      },
      toolName: "get_price_history"
    })
  );
  const boundedRetrieval = validPriceHistoryPlan.tool_call?.bounded_retrieval;
  const toolLimits = validPriceHistoryPlan.tool_call?.tool_limits;
  const requiredMappings = {
    MCP_CREDENTIAL_REVOKED: getMcpRuntimeStandardError("MCP_CREDENTIAL_REVOKED"),
    MCP_REDISTRIBUTION_RIGHTS_REQUIRED: getMcpRuntimeStandardError(
      "MCP_REDISTRIBUTION_RIGHTS_REQUIRED"
    ),
    TOOL_LIMIT_EXCEEDED: getMcpRuntimeStandardError("TOOL_LIMIT_EXCEEDED"),
    TOOL_SCOPE_REQUIRED: getMcpRuntimeStandardError("TOOL_SCOPE_REQUIRED"),
    TOOL_TIME_RANGE_EXCEEDED: getMcpRuntimeStandardError("TOOL_TIME_RANGE_EXCEEDED")
  };
  const capability = getMcpAuthLimitsReleaseGateCapabilities();
  const validation = {
    api_key_revoke_denies_future_calls:
      apiKeyRevokePlan.revocation_plan.future_calls_denied_after_revoke &&
      apiKeyRevokePlan.api_key_live === false,
    api_key_rotation_denies_old_key:
      apiKeyRotatePlan.api_key.old_key_future_calls_denied_after_rotation &&
      apiKeyRotatePlan.api_key.live_secret_generated === false &&
      apiKeyRotatedDenied.code === "MCP_CREDENTIAL_REVOKED" &&
      apiKeyRotatedDenied.standard_error_code === "AUTH_REQUIRED",
    cursor_pagination_bypass_blocked:
      boundedRetrieval?.cursor_pagination.enabled === true &&
      boundedRetrieval.cursor_pagination.cursor === "cursor_1" &&
      boundedRetrieval.cursor_pagination.cursor_bound_to_request &&
      boundedRetrieval.cursor_pagination.cursor_opaque &&
      boundedRetrieval.plan_or_rights_bypass_blocked,
    oauth_revoke_denies_future_calls:
      oauthRevokePlan.revocation_plan.future_calls_denied_after_revoke &&
      oauthRevokedDenied.code === "MCP_CREDENTIAL_REVOKED" &&
      oauthRevokedDenied.standard_error_code === "AUTH_REQUIRED",
    oauth_scope_catalog_and_pkce_ready:
      authorizePlan.pkce.code_challenge_method === "S256" &&
      authorizePlan.pkce.plain_method_allowed === false &&
      authorizePlan.consent.requested_scope_count === requestedScopes.length &&
      requestedScopes.every((scope) =>
        authorizePlan.consent.scopes.some(
          (grant) => grant.scope === scope && grant.revocable
        )
      ),
    quota_and_limit_bypass_blocked:
      boundedRetrieval?.max_rows_enforced === true &&
      boundedRetrieval.row_limit.max_limit === 3 &&
      boundedRetrieval.row_limit.too_many_rows_error_code === "TOO_MANY_ROWS" &&
      tooManyRowsDenied.code === "TOOL_LIMIT_EXCEEDED" &&
      tooManyRowsDenied.standard_error_code === "TOO_MANY_ROWS" &&
      timeRangeDenied.code === "TOOL_TIME_RANGE_EXCEEDED" &&
      timeRangeDenied.standard_error_code === "OUT_OF_RANGE" &&
      toolLimits?.rate_limit.status === "planned_no_live" &&
      toolLimits.budget.pre_debit_required &&
      toolLimits.budget.failure_refund_required &&
      toolLimits.ordinary_pool_protection,
    standard_error_codes_stable:
      requiredMappings.MCP_CREDENTIAL_REVOKED === "AUTH_REQUIRED" &&
      requiredMappings.MCP_REDISTRIBUTION_RIGHTS_REQUIRED === "DATA_NOT_LICENSED" &&
      requiredMappings.TOOL_LIMIT_EXCEEDED === "TOO_MANY_ROWS" &&
      requiredMappings.TOOL_SCOPE_REQUIRED === "SCOPE_DENIED" &&
      requiredMappings.TOOL_TIME_RANGE_EXCEEDED === "OUT_OF_RANGE" &&
      MCP_STANDARD_ERROR_CODES.includes("RATE_LIMITED") &&
      MCP_STANDARD_ERROR_CODES.includes("BUDGET_EXCEEDED") &&
      getMcpStandardErrorDefinition("RATE_LIMITED").retry_after_required &&
      getMcpStandardErrorDefinition("BUDGET_EXCEEDED").category === "limit"
  };
  const releaseChecks = capability.required_checks.map((check) => ({
    check,
    evidence:
      check === "oauth_scope_catalog_and_pkce_ready"
        ? "OAuth authorize planner exposes S256 PKCE and revocable scope grants for security.read, market.read, and analytics.run"
        : check === "oauth_revoke_denies_future_calls"
          ? "OAuth revoke planner marks future calls denied and revoked connection maps to AUTH_REQUIRED before tools/call"
          : check === "api_key_rotation_denies_old_key"
            ? "API key rotation planner denies old key future calls and rotated key maps to AUTH_REQUIRED before tools/call"
            : check === "api_key_revoke_denies_future_calls"
              ? "API key revoke planner marks future calls denied without storing raw key material"
              : check === "cursor_pagination_bypass_blocked"
                ? "get_price_history bounded retrieval requires opaque request-bound cursor metadata and blocks plan/rights bypass"
                : check === "quota_and_limit_bypass_blocked"
                  ? "get_price_history rejects row-limit and time-window bypasses and exposes no-live rate, concurrency, and budget guards"
                  : "MCP runtime maps auth, scope, rights, row-limit, time-window, rate, and budget failures to stable PRD standard errors",
    status: "planned_no_write" as const
  }));

  return {
    api_key_gate: {
      revoke_plan: apiKeyRevokePlan,
      rotated_key_denial: apiKeyRotatedDenied,
      rotate_plan: apiKeyRotatePlan
    },
    capability,
    data_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
    error_stability_gate: {
      limiter_error_codes: ["RATE_LIMITED", "BUDGET_EXCEEDED"] as const,
      required_mappings: requiredMappings,
      standard_error_code_version: MCP_STANDARD_ERROR_CODES_VERSION,
      standard_error_codes: MCP_STANDARD_ERROR_CODES,
      standard_error_definitions: MCP_STANDARD_ERROR_DEFINITIONS
    },
    frontend_rendering: false,
    limit_gate: {
      bounded_retrieval: boundedRetrieval,
      time_range_denial: timeRangeDenied,
      too_many_rows_denial: tooManyRowsDenied,
      tool_limits: toolLimits,
      valid_tool_call: validPriceHistoryPlan.tool_call
    },
    live_api_key_generation: false,
    live_auth_middleware: false,
    live_db_writes: false,
    live_limiter_enforcement: false,
    live_oauth_provider: false,
    live_tool_execution: false,
    methodology_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
    model_calls: false,
    oauth_scope_gate: {
      authorize_plan: authorizePlan,
      revoke_plan: oauthRevokePlan,
      revoked_connection_denial: oauthRevokedDenied
    },
    persistent_writes: false,
    provenance: [
      {
        data_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
        methodology_version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION,
        source: "mcp-runtime",
        source_record_id: "mcp_auth_limits_release_gate"
      }
    ],
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_oauth_provider_missing",
        "live_token_store_missing",
        "live_api_key_secret_generation_missing",
        "live_limiter_window_reads_missing",
        "live_usage_ledger_writes_missing"
      ],
      gate_status: "blocked_live_mcp_auth_limits_validation",
      no_live_release_claim: true,
      required_signoffs: ["platform", "security", "billing", "data-rights"]
    },
    request_id: input.requestId,
    route: "POST /mcp/release-gates/auth-limits/plan" as const,
    sql_emitted: false,
    status: "planned_no_write" as const,
    usage: createMcpUsageSummary(input, 0, releaseChecks.length),
    validation,
    version: MCP_AUTH_LIMITS_RELEASE_GATE_VERSION
  };
}

export function getMcpTargetClientsConsoleReleaseGateCapabilities() {
  return {
    compatibility_status_route: "GET /mcp/compatibility/status" as const,
    console_reconciliation_ready: true,
    developer_console_live: false,
    first_call_time_target_minutes: 10,
    live_client_e2e_passed: false,
    live_console_log_store: false,
    package: "@aiphabee/mcp-runtime" as const,
    protocol_route: "POST /mcp" as const,
    required_checks: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_REQUIRED_CHECKS,
    route: "POST /mcp/release-gates/target-clients-console/plan" as const,
    runtime_route: "GET /mcp/runtime" as const,
    status: "mcp_target_clients_console_release_gate_scaffold" as const,
    target_client_matrix_ready: true,
    target_protocol_version: MCP_COMPATIBILITY_TARGET_PROTOCOL_VERSION,
    version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION
  };
}

export function getMcpDeveloperConsoleCapabilities() {
  return {
    api_key_create_route: "POST /mcp/api-keys/create/plan" as const,
    api_key_runtime_route: "GET /mcp/api-keys/runtime" as const,
    api_key_secret_generation_live: false,
    compatibility_status_route: "GET /mcp/compatibility/status" as const,
    connection_guide_artifact: "docs/public/mcp.md" as const,
    developer_console_live: false,
    first_call_time_target_minutes: 10,
    frontend_rendering: false,
    live_console_log_store: false,
    live_usage_ledger_reads: false,
    oauth_runtime_route: "GET /mcp/oauth/runtime" as const,
    package: "@aiphabee/mcp-runtime" as const,
    protocol_route: "POST /mcp" as const,
    request_log_fields: MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS,
    route: "POST /mcp/developer-console/plan" as const,
    runtime_route: "GET /mcp/runtime" as const,
    scope_catalog: MCP_OAUTH_SCOPE_DEFINITIONS,
    status: "mcp_developer_console_backend_scaffold" as const,
    target_clients_console_gate_route:
      "POST /mcp/release-gates/target-clients-console/plan" as const,
    usage_request_id_visible: true,
    usage_reconciliation_ready: true,
    version: MCP_DEVELOPER_CONSOLE_VERSION
  };
}

export function createMcpTargetClientsConsoleReleaseGatePlan(
  input: CreateMcpTargetClientsConsoleReleaseGatePlanInput
) {
  const origin = normalizeText(input.origin) ?? DEFAULT_MCP_ALLOWED_ORIGINS[0];
  const allowedOrigins = input.allowedOrigins ?? DEFAULT_MCP_ALLOWED_ORIGINS;
  const compatibilityPlan = createMcpCompatibilityStatusPlan({
    requestId: `${input.requestId}:compatibility`
  });
  const protocolGate = createMcpProtocolReleaseGatePlan({
    allowedOrigins,
    clientName: input.clientName ?? "mcp-target-client-release-gate",
    clientVersion: input.clientVersion ?? MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
    origin,
    pendingCredits: input.pendingCredits,
    requestId: `${input.requestId}:protocol`,
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const authLimitsGate = createMcpAuthLimitsReleaseGatePlan({
    allowedOrigins,
    origin,
    pendingCredits: input.pendingCredits,
    requestId: `${input.requestId}:auth-limits`,
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const targetClientMatrix = compatibilityPlan.target_clients.map((client) => ({
    client_name: client.name,
    connection_guide_artifact: "docs/public/mcp.md",
    first_call_time_target_minutes: 10,
    live_e2e_passed: client.live_e2e_passed,
    planned_checks: [
      "connectivity",
      "initialize",
      "tools/list",
      "tools/call",
      "console_reconciliation"
    ],
    status: client.status
  }));
  const consoleReconciliationFields = MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS;
  const consoleForbiddenFields = MCP_DEVELOPER_CONSOLE_FORBIDDEN_FIELDS;
  const consoleReconciliationGate = {
    api_key_rotation_route: "POST /mcp/api-keys/rotate/plan" as const,
    api_key_runtime_route: "GET /mcp/api-keys/runtime" as const,
    console_live: false,
    forbidden_fields: consoleForbiddenFields,
    log_store_live: false,
    oauth_revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    request_id_visible: true,
    required_fields: consoleReconciliationFields,
    route: "Developer Console: MCP usage ledger view" as const,
    scope_visibility: true,
    status_source: "GET /mcp/compatibility/status" as const,
    usage_ledger_reads_live: false
  };
  const capability = getMcpTargetClientsConsoleReleaseGateCapabilities();
  const validation = {
    compatibility_status_linked:
      compatibilityPlan.status_route === "GET /mcp/compatibility/status" &&
      compatibilityPlan.status_page.shows_last_successful_client_smoke &&
      compatibilityPlan.status_page.shows_protocol_version,
    console_reconciliation_fields_present:
      consoleReconciliationFields.includes("request_id") &&
      consoleReconciliationFields.includes("credits_remaining") &&
      consoleReconciliationFields.includes("scope") &&
      consoleReconciliationFields.includes("credential_reference") &&
      consoleReconciliationFields.includes("standard_error_code") &&
      consoleForbiddenFields.includes("raw_api_key") &&
      consoleReconciliationGate.console_live === false,
    first_call_guide_under_10_minute_target:
      targetClientMatrix.every((client) => client.first_call_time_target_minutes <= 10) &&
      targetClientMatrix.every(
        (client) => client.connection_guide_artifact === "docs/public/mcp.md"
      ),
    inspector_and_sdk_smoke_vectors_planned:
      compatibilityPlan.inspector.required_checks.includes("connectivity") &&
      compatibilityPlan.inspector.required_checks.includes("tools_tab") &&
      compatibilityPlan.sdk.production_channel === "typescript-sdk-v1.x" &&
      compatibilityPlan.test_vectors.some(
        (vector) => vector.name === "usage_and_request_id" && vector.local_contract_ready
      ),
    no_live_console_or_client_claim:
      compatibilityPlan.live_client_e2e_passed === false &&
      compatibilityPlan.inspector.live_inspector_smoke === false &&
      compatibilityPlan.sdk.live_sdk_smoke === false &&
      consoleReconciliationGate.console_live === false &&
      consoleReconciliationGate.log_store_live === false &&
      consoleReconciliationGate.usage_ledger_reads_live === false,
    request_usage_scope_and_key_reconciliation_ready:
      protocolGate.usage.request_id === `${input.requestId}:protocol` &&
      protocolGate.usage.request_id_visible &&
      authLimitsGate.oauth_scope_gate.authorize_plan.consent.clear_scope_display &&
      authLimitsGate.api_key_gate.rotate_plan.api_key.live_secret_generated === false &&
      authLimitsGate.error_stability_gate.standard_error_codes.includes("BUDGET_EXCEEDED"),
    target_client_matrix_present:
      ["mcp_inspector", "typescript_sdk_client", "claude_desktop", "cursor", "chatgpt_connector"].every(
        (clientName) => targetClientMatrix.some((client) => client.client_name === clientName)
      ) && targetClientMatrix.every((client) => client.live_e2e_passed === false)
  };
  const releaseChecks = capability.required_checks.map((check) => ({
    check,
    evidence:
      check === "target_client_matrix_present"
        ? "Compatibility status enumerates Inspector, TypeScript SDK, Claude Desktop, Cursor, and ChatGPT Connector target rows"
        : check === "inspector_and_sdk_smoke_vectors_planned"
          ? "Inspector and TypeScript SDK required checks plus usage/request_id vectors are present but marked no-live"
          : check === "first_call_guide_under_10_minute_target"
            ? "Each target client matrix row points at docs/public/mcp.md with a 10 minute time-to-first-call target"
            : check === "console_reconciliation_fields_present"
              ? "Console reconciliation contract includes request_id, scope, credential reference, usage, error, and provenance fields while excluding secrets and sensitive payloads"
              : check === "request_usage_scope_and_key_reconciliation_ready"
                ? "Protocol usage envelope, OAuth scope display, API key lifecycle metadata, and stable errors are linked for Console reconciliation"
                : check === "compatibility_status_linked"
                  ? "Release gate links target-client rows to GET /mcp/compatibility/status and status page metadata"
                  : "The gate explicitly keeps Developer Console UI, log store, usage ledger reads, SDK/Inspector smoke, and target-client e2e as non-live blockers",
    status: "planned_no_write" as const
  }));

  return {
    auth_limits_gate: {
      api_key_gate: authLimitsGate.api_key_gate,
      error_stability_gate: authLimitsGate.error_stability_gate,
      oauth_scope_gate: authLimitsGate.oauth_scope_gate
    },
    capability,
    compatibility_gate: {
      inspector: compatibilityPlan.inspector,
      monitored_protocol_versions: compatibilityPlan.monitored_protocol_versions,
      sdk: compatibilityPlan.sdk,
      status_page: compatibilityPlan.status_page,
      status_route: compatibilityPlan.status_route,
      target_clients: compatibilityPlan.target_clients,
      target_protocol_version: compatibilityPlan.target_protocol_version,
      test_vectors: compatibilityPlan.test_vectors
    },
    console_reconciliation_gate: consoleReconciliationGate,
    data_version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
    developer_console_live: false,
    frontend_rendering: false,
    live_client_e2e_passed: false,
    live_console_log_store: false,
    live_db_writes: false,
    live_sdk_inspector_smoke: false,
    live_tool_execution: false,
    live_usage_ledger_reads: false,
    methodology_version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
    model_calls: false,
    persistent_writes: false,
    protocol_gate: {
      route: protocolGate.route,
      schema_compatibility_gate: protocolGate.schema_compatibility_gate,
      usage: protocolGate.usage
    },
    provenance: [
      {
        data_version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
        methodology_version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION,
        source: "mcp-runtime",
        source_record_id: "mcp_target_clients_console_release_gate"
      }
    ],
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_target_client_e2e_missing",
        "developer_console_ui_missing",
        "live_console_log_store_missing",
        "live_usage_ledger_reads_missing",
        "public_status_page_deploy_missing"
      ],
      gate_status: "blocked_live_mcp_target_clients_console_validation",
      no_live_release_claim: true,
      required_signoffs: [
        "platform",
        "developer-relations",
        "support",
        "billing",
        "data-rights"
      ]
    },
    request_id: input.requestId,
    route: "POST /mcp/release-gates/target-clients-console/plan" as const,
    sql_emitted: false,
    status: "planned_no_write" as const,
    target_client_gate: {
      first_call_time_target_minutes: 10,
      live_client_e2e_passed: false,
      matrix: targetClientMatrix
    },
    usage: createMcpUsageSummary(input, 0, releaseChecks.length),
    validation,
    version: MCP_TARGET_CLIENTS_CONSOLE_RELEASE_GATE_VERSION
  };
}

export function createMcpDeveloperConsolePlan(input: CreateMcpDeveloperConsolePlanInput) {
  const origin = normalizeText(input.origin) ?? DEFAULT_MCP_ALLOWED_ORIGINS[0];
  const allowedOrigins = input.allowedOrigins ?? DEFAULT_MCP_ALLOWED_ORIGINS;
  const clientName = normalizeText(input.clientName) ?? "mcp-inspector";
  const clientVersion = normalizeText(input.clientVersion) ?? "local";
  const workspaceId = normalizeText(input.workspaceId) ?? "workspace_mcp";
  const usage = createMcpUsageSummary(input, 0, MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS.length);
  const compatibilityPlan = createMcpCompatibilityStatusPlan({
    requestId: `${input.requestId}:compatibility`
  });
  const targetClientsGate = createMcpTargetClientsConsoleReleaseGatePlan({
    allowedOrigins,
    clientName,
    clientVersion,
    origin,
    pendingCredits: input.pendingCredits,
    requestId: `${input.requestId}:target-clients-console`,
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId
  });
  const initializeExample = createMcpProtocolPlan({
    allowedOrigins,
    clientName,
    clientVersion,
    method: "initialize",
    origin,
    requestId: `${input.requestId}:example-initialize`
  });
  const toolsListExample = createMcpProtocolPlan({
    allowedOrigins,
    clientName,
    clientVersion,
    method: "tools/list",
    origin,
    requestId: `${input.requestId}:example-tools-list`
  });
  const toolsCallExample = createMcpProtocolPlan({
    allowedOrigins,
    clientName,
    clientVersion,
    connectionId: "mcp_connection_console_example",
    credentialKind: "oauth_connection",
    credentialStatus: "active",
    grantedScopes: ["quotes:read"],
    method: "tools/call",
    mcpRedistributionRightsConfirmed: true,
    origin,
    requestId: `${input.requestId}:example-tools-call`,
    toolArguments: {
      instrument_id: "HK:00700"
    },
    toolName: "get_quote_snapshot",
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId
  });
  const exampleCalls = [
    {
      live_execution: initializeExample.live_tool_execution,
      method: "initialize" as const,
      protocol_route: "POST /mcp" as const,
      request_id: initializeExample.request_id,
      status: initializeExample.status
    },
    {
      live_execution: toolsListExample.live_tool_execution,
      method: "tools/list" as const,
      protocol_route: "POST /mcp" as const,
      request_id: toolsListExample.request_id,
      returned_tool_count: toolsListExample.tools_list?.returned_tool_count ?? 0,
      status: toolsListExample.status
    },
    {
      live_execution: toolsCallExample.live_tool_execution,
      method: "tools/call" as const,
      protocol_route: "POST /mcp" as const,
      request_id: toolsCallExample.request_id,
      required_scope: toolsCallExample.tool_call?.required_scope ?? "quotes:read",
      status: toolsCallExample.status,
      tool_name: toolsCallExample.tool_call?.requested_tool_name ?? "get_quote_snapshot"
    }
  ];
  const requestLogSampleRow = {
    client_name: clientName,
    client_version: clientVersion,
    credential_kind: "oauth_connection" as const,
    credential_reference: "mcp_connection_console_example",
    credits: toolsCallExample.usage.credits,
    credits_remaining: toolsCallExample.usage.credits_remaining,
    data_version: MCP_DEVELOPER_CONSOLE_VERSION,
    methodology_version: MCP_DEVELOPER_CONSOLE_VERSION,
    request_id: toolsCallExample.request_id,
    scope: toolsCallExample.tool_call?.required_scope ?? "quotes:read",
    source_record_id: "mcp_developer_console_sample_call",
    standard_error_code: null as null | McpStandardErrorCode,
    status: toolsCallExample.status,
    tool_name: toolsCallExample.tool_call?.requested_tool_name ?? "get_quote_snapshot",
    tool_version: "get_quote_snapshot@1",
    usage_event_id: null as null | string,
    workspace_id: workspaceId
  };
  const validation = {
    api_key_and_oauth_routes_linked:
      getMcpApiKeyCapabilities().create_route === "POST /mcp/api-keys/create/plan" &&
      getMcpOAuthCapabilities().authorize_route === "POST /mcp/oauth/authorize/plan",
    connection_guide_surface_ready:
      targetClientsGate.target_client_gate.first_call_time_target_minutes <= 10 &&
      targetClientsGate.target_client_gate.matrix.every(
        (client) => client.connection_guide_artifact === "docs/public/mcp.md"
      ),
    examples_cover_initialize_tools_list_tools_call:
      ["initialize", "tools/list", "tools/call"].every((method) =>
        exampleCalls.some((example) => example.method === method)
      ),
    first_call_guide_under_10_minute_target:
      targetClientsGate.target_client_gate.first_call_time_target_minutes <= 10,
    no_live_console_claim:
      targetClientsGate.developer_console_live === false &&
      targetClientsGate.live_console_log_store === false &&
      targetClientsGate.live_usage_ledger_reads === false,
    quota_usage_summary_visible:
      usage.request_id_visible &&
      usage.freshness_target_minutes === 5 &&
      usage.live_ledger_reads === false,
    request_log_schema_ready:
      MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS.every((field) => field in requestLogSampleRow) &&
      MCP_DEVELOPER_CONSOLE_FORBIDDEN_FIELDS.every((field) => !(field in requestLogSampleRow)),
    scope_catalog_visible:
      MCP_OAUTH_SCOPE_DEFINITIONS.length >= 9 &&
      MCP_OAUTH_SCOPE_DEFINITIONS.some((definition) => definition.scope === "market.read")
  };
  const releaseChecks = MCP_DEVELOPER_CONSOLE_REQUIRED_CHECKS.map((check) => ({
    check,
    evidence:
      check === "connection_guide_surface_ready"
        ? "Connection guide points at docs/public/mcp.md and target-client rows carry a 10 minute first-call target"
        : check === "api_key_and_oauth_routes_linked"
          ? "Console links API key create/rotate/revoke plans and OAuth authorize/token/revoke plans without generating live secrets"
          : check === "scope_catalog_visible"
            ? "Console exposes the PRD 9.7 MCP scope catalog with revocable scope grants"
            : check === "quota_usage_summary_visible"
              ? "Console quota panel uses request_id-visible usage summary with no live ledger reads"
              : check === "request_log_schema_ready"
                ? "Console request log schema includes request, workspace, client, credential, scope, tool, usage, error, and provenance fields while excluding secrets"
                : check === "examples_cover_initialize_tools_list_tools_call"
                  ? "Example panel includes initialize, tools/list, and tools/call protocol examples with no live execution"
                  : check === "first_call_guide_under_10_minute_target"
                    ? "First-call target remains 10 minutes for target clients"
                    : "Developer Console UI, log store, live usage ledger reads, live key generation, live OAuth, and live tools remain disabled",
    status: "planned_no_write" as const
  }));

  return {
    capability: getMcpDeveloperConsoleCapabilities(),
    compatibility_status: {
      live_client_e2e_passed: compatibilityPlan.live_client_e2e_passed,
      route: compatibilityPlan.status_route,
      target_protocol_version: compatibilityPlan.target_protocol_version
    },
    connection_guide: {
      artifact: "docs/public/mcp.md" as const,
      first_call_time_target_minutes: 10,
      protocol_route: "POST /mcp" as const,
      steps: [
        {
          description: "Choose OAuth PKCE or a server-to-server API key.",
          route: "POST /mcp/oauth/authorize/plan" as const,
          step: "choose_credential" as const
        },
        {
          description: "Initialize the Streamable HTTP MCP connection.",
          route: "POST /mcp" as const,
          step: "initialize" as const
        },
        {
          description: "Run tools/list and confirm visible tool metadata.",
          route: "POST /mcp" as const,
          step: "list_tools" as const
        },
        {
          description: "Run a scoped read-only tool call and reconcile request_id.",
          route: "POST /mcp" as const,
          step: "first_tool_call" as const
        }
      ],
      target_clients: targetClientsGate.target_client_gate.matrix
    },
    credentials: {
      api_key: {
        create_route: "POST /mcp/api-keys/create/plan" as const,
        live_secret_generation: false,
        one_time_display: true,
        revoke_route: "POST /mcp/api-keys/revoke/plan" as const,
        rotate_route: "POST /mcp/api-keys/rotate/plan" as const,
        runtime_route: "GET /mcp/api-keys/runtime" as const,
        server_to_server_only: true
      },
      oauth: {
        authorize_route: "POST /mcp/oauth/authorize/plan" as const,
        live_oauth_provider: false,
        pkce_methods: ["S256"] as const,
        revoke_route: "POST /mcp/oauth/revoke/plan" as const,
        runtime_route: "GET /mcp/oauth/runtime" as const,
        third_party_token_passthrough: false,
        token_route: "POST /mcp/oauth/token/plan" as const,
        token_storage_live: false
      }
    },
    data_version: MCP_DEVELOPER_CONSOLE_VERSION,
    developer_console_live: false,
    examples: {
      calls: exampleCalls,
      live_tool_execution: false,
      protocol_route: "POST /mcp" as const
    },
    frontend_rendering: false,
    live_api_key_generation: false,
    live_console_log_store: false,
    live_oauth_provider: false,
    live_tool_execution: false,
    live_usage_ledger_reads: false,
    methodology_version: MCP_DEVELOPER_CONSOLE_VERSION,
    model_calls: false,
    persistent_writes: false,
    provenance: [
      {
        data_version: MCP_DEVELOPER_CONSOLE_VERSION,
        methodology_version: MCP_DEVELOPER_CONSOLE_VERSION,
        source: "mcp-runtime",
        source_record_id: "mcp_developer_console_backend"
      }
    ],
    quota_panel: {
      display_fields: [
        "request_id",
        "plan_code",
        "period",
        "credit_limit",
        "credits_used",
        "credits_pending",
        "credits_remaining"
      ] as const,
      freshness_target_minutes: usage.freshness_target_minutes,
      live_ledger_reads: false,
      request_id: usage.request_id,
      request_id_visible: true,
      usage
    },
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "developer_console_ui_missing",
        "live_console_log_store_missing",
        "live_usage_ledger_reads_missing",
        "live_api_key_secret_generation_missing",
        "live_oauth_provider_missing",
        "live_target_client_e2e_missing"
      ],
      gate_status: "blocked_live_mcp_developer_console_validation" as const,
      no_live_release_claim: true,
      required_signoffs: ["platform", "developer-relations", "support", "billing", "security"]
    },
    request_id: input.requestId,
    request_log_panel: {
      fields: MCP_DEVELOPER_CONSOLE_REQUEST_LOG_FIELDS,
      forbidden_fields: MCP_DEVELOPER_CONSOLE_FORBIDDEN_FIELDS,
      live_log_store: false,
      sample_rows: [requestLogSampleRow],
      status_source: "GET /mcp/compatibility/status" as const,
      usage_ledger_reads_live: false
    },
    route: "POST /mcp/developer-console/plan" as const,
    scope_panel: {
      revoke_route: "POST /mcp/oauth/revoke/plan" as const,
      scope_catalog: MCP_OAUTH_SCOPE_DEFINITIONS.map((definition) => ({
        ...definition,
        revocable: true as const
      })),
      scope_visibility: true
    },
    sql_emitted: false,
    status: "planned_no_live_developer_console" as McpDeveloperConsolePlanStatus,
    target_clients_console_gate: {
      gate_status: targetClientsGate.release_gate.gate_status,
      route: targetClientsGate.route,
      validation: targetClientsGate.validation
    },
    usage,
    validation,
    version: MCP_DEVELOPER_CONSOLE_VERSION
  };
}

export function getMcpClientMaturityCapabilities() {
  return {
    fallback_mode: "tools_only" as const,
    interactive_apps_live: false,
    live_client_e2e_passed: false,
    package: "@aiphabee/mcp-runtime" as const,
    prompts_live: false,
    reference_urls: MCP_CLIENT_MATURITY_REFERENCE_URLS,
    required_checks: MCP_CLIENT_MATURITY_REQUIRED_CHECKS,
    resources_live: false,
    route: "POST /mcp/client-maturity/plan" as const,
    runtime_route: "GET /mcp/runtime" as const,
    status: "mcp_client_maturity_scaffold" as const,
    supported_features: MCP_CLIENT_MATURITY_FEATURES,
    target_client_matrix_ready: true,
    target_clients: MCP_CLIENT_MATURITY_TARGET_CLIENTS,
    target_clients_console_gate_route:
      "POST /mcp/release-gates/target-clients-console/plan" as const,
    tools_live: false,
    tools_only_fallback_ready: true,
    version: MCP_CLIENT_MATURITY_VERSION
  };
}

export function createMcpClientMaturityPlan(input: CreateMcpClientMaturityPlanInput) {
  const requestedClient = normalizeMcpClientMaturityTargetClient(input.clientName);
  const requestedFeature = normalizeMcpClientMaturityFeature(input.requestedFeature);
  const capability = getMcpClientMaturityCapabilities();
  const compatibilityPlan = createMcpCompatibilityStatusPlan({
    requestId: `${input.requestId}:compatibility`
  });
  const targetClientsGate = createMcpTargetClientsConsoleReleaseGatePlan({
    allowedOrigins: input.allowedOrigins,
    clientName: input.clientName,
    clientVersion: input.clientVersion,
    origin: input.origin,
    pendingCredits: input.pendingCredits,
    requestId: `${input.requestId}:target-clients-console`,
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const clientCapabilityMatrix = MCP_CLIENT_MATURITY_TARGET_CLIENTS.map((clientName) => {
    const compatibilityClient = compatibilityPlan.target_clients.find(
      (client) => client.name === clientName
    );
    const chatgptConnector = clientName === "chatgpt_connector";

    return {
      client_name: clientName,
      fallback_mode: "tools_only" as const,
      interactive_apps: {
        app_review_required: true,
        live_enabled: false,
        maturity: chatgptConnector ? "apps_sdk_candidate" : "not_targeted",
        required_client_validation: true
      },
      live_e2e_passed: compatibilityClient?.live_e2e_passed ?? false,
      prompts: {
        live_enabled: false,
        maturity: chatgptConnector ? "client_capability_unverified" : "requires_client_validation",
        required_methods: ["prompts/list", "prompts/get"] as const,
        user_initiated_selection_required: true
      },
      readiness_status: chatgptConnector
        ? ("evaluate_apps_sdk_surface" as const)
        : ("tools_only_until_client_e2e" as const),
      resources: {
        live_enabled: false,
        maturity: chatgptConnector ? "embedded_resource_candidate" : "requires_client_validation",
        required_methods: [
          "resources/list",
          "resources/read",
          "resources/templates/list"
        ] as const,
        uri_permission_checks_required: true
      },
      tools: {
        live_execution: false,
        maturity: "local_contract_ready" as const,
        route: "POST /mcp" as const
      }
    };
  });
  const status: McpClientMaturityPlanStatus =
    input.clientName !== undefined && requestedClient === undefined
      ? "blocked_unknown_client"
      : input.requestedFeature !== undefined && requestedFeature === undefined
        ? "blocked_unsupported_feature"
        : "planned_no_live_mcp_client_maturity";
  const publicationPolicy = {
    component_widgets_live: false,
    fallback_to_tools_only: true,
    interactive_apps_live: false,
    prompts_live: false,
    resources_live: false,
    tools_call_live_execution: false,
    tool_result_embedded_resources_live: false
  };
  const validation = {
    fallback_to_tools_only_documented:
      publicationPolicy.fallback_to_tools_only &&
      clientCapabilityMatrix.every((client) => client.fallback_mode === "tools_only"),
    interactive_apps_support_blocked_until_client_stable:
      publicationPolicy.interactive_apps_live === false &&
      clientCapabilityMatrix.every((client) => client.interactive_apps.live_enabled === false),
    no_live_resources_prompts_apps_claim:
      publicationPolicy.resources_live === false &&
      publicationPolicy.prompts_live === false &&
      publicationPolicy.interactive_apps_live === false &&
      publicationPolicy.component_widgets_live === false &&
      targetClientsGate.live_client_e2e_passed === false,
    prompts_support_guarded_by_client_maturity:
      publicationPolicy.prompts_live === false &&
      clientCapabilityMatrix.every((client) =>
        client.prompts.required_methods.includes("prompts/list")
      ),
    resources_support_guarded_by_client_maturity:
      publicationPolicy.resources_live === false &&
      clientCapabilityMatrix.every((client) =>
        client.resources.required_methods.includes("resources/read")
      ),
    target_clients_capability_matrix_present:
      MCP_CLIENT_MATURITY_TARGET_CLIENTS.every((clientName) =>
        clientCapabilityMatrix.some((client) => client.client_name === clientName)
      )
  };
  const releaseChecks = capability.required_checks.map((check) => ({
    check,
    evidence:
      check === "target_clients_capability_matrix_present"
        ? "Maturity matrix enumerates Inspector, TypeScript SDK, Claude Desktop, Cursor, and ChatGPT Connector across tools/resources/prompts/interactive_apps"
        : check === "resources_support_guarded_by_client_maturity"
          ? "Resources/list/read/templates are documented as client-maturity guarded and not published live"
          : check === "prompts_support_guarded_by_client_maturity"
            ? "Prompts/list/get are documented as user-initiated and not published live"
            : check === "interactive_apps_support_blocked_until_client_stable"
              ? "Interactive Apps remain blocked until client stability, Apps SDK review, and live e2e evidence exist"
              : check === "fallback_to_tools_only_documented"
                ? "Every target client remains in tools-only fallback mode for this scaffold"
                : "Resources, prompts, embedded resources, widgets, Apps SDK components, model calls, and live tool execution are all false",
    status: "planned_no_write" as const
  }));

  return {
    capability,
    client_maturity_gate: {
      candidate_feature: requestedFeature ?? "interactive_apps",
      matrix: clientCapabilityMatrix,
      requested_client: requestedClient ?? "all_target_clients",
      status: "client_maturity_assessment_only" as const
    },
    compatibility_gate: {
      live_client_e2e_passed: compatibilityPlan.live_client_e2e_passed,
      status_route: compatibilityPlan.status_route,
      target_protocol_version: compatibilityPlan.target_protocol_version
    },
    data_version: MCP_CLIENT_MATURITY_VERSION,
    developer_console_live: false,
    frontend_rendering: false,
    live_client_e2e_passed: false,
    live_db_writes: false,
    live_tool_execution: false,
    methodology_version: MCP_CLIENT_MATURITY_VERSION,
    model_calls: false,
    persistent_writes: false,
    provenance: [
      {
        data_version: MCP_CLIENT_MATURITY_VERSION,
        methodology_version: MCP_CLIENT_MATURITY_VERSION,
        source: "mcp-runtime",
        source_record_id: "mcp_client_maturity"
      }
    ],
    publication_policy: publicationPolicy,
    reference_urls: MCP_CLIENT_MATURITY_REFERENCE_URLS,
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_resources_e2e_missing",
        "live_prompts_e2e_missing",
        "interactive_apps_client_stability_missing",
        "client_capability_version_matrix_missing",
        "apps_sdk_security_review_missing"
      ],
      gate_status: "blocked_live_mcp_client_maturity_validation" as const,
      no_live_release_claim: true,
      required_signoffs: ["platform", "security", "developer-relations", "data-rights"]
    },
    request_id: input.requestId,
    route: "POST /mcp/client-maturity/plan" as const,
    sql_emitted: false,
    status,
    target_clients_console_gate: {
      gate_status: targetClientsGate.release_gate.gate_status,
      route: targetClientsGate.route,
      usage: targetClientsGate.usage
    },
    usage: createMcpUsageSummary(input, 0, releaseChecks.length),
    validation,
    version: MCP_CLIENT_MATURITY_VERSION
  };
}

function captureMcpProtocolReleaseGateError(plan: () => McpProtocolPlan) {
  try {
    plan();
  } catch (error) {
    if (error instanceof McpRuntimeInputError) {
      return {
        code: error.code,
        details: error.details,
        live_auth_middleware: false,
        message: error.message,
        standard_error_code: getMcpRuntimeStandardError(error.code)
      };
    }

    throw error;
  }

  throw new Error("expected MCP protocol release gate probe to fail");
}

export function getMcpRuntimeStandardError(
  code: McpRuntimeInputErrorCode
): McpStandardErrorCode {
  return MCP_RUNTIME_INPUT_ERROR_TO_STANDARD_ERROR[code];
}

export function getMcpStandardErrorDefinition(
  code: McpStandardErrorCode
): McpStandardErrorDefinition {
  const definition = MCP_STANDARD_ERROR_DEFINITIONS.find(
    (candidate) => candidate.code === code
  );

  if (definition === undefined) {
    return MCP_STANDARD_ERROR_DEFINITIONS[MCP_STANDARD_ERROR_DEFINITIONS.length - 1];
  }

  return definition;
}

export function getMcpApiKeyCapabilities() {
  return {
    api_key_live: false,
    create_route: "POST /mcp/api-keys/create/plan" as const,
    forbidden_payloads: ["raw_api_key", "client_secret", "bearer_token"] as const,
    hash_algorithm: "hmac_sha256_with_pepper_planned" as const,
    hash_storage_required: true,
    ip_allowlist_supported: true,
    key_prefix: "aipb_srv_" as const,
    one_time_display: true,
    package: "@aiphabee/mcp-runtime" as const,
    revocation_enforcement_route: "POST /mcp/revocations/enforce/plan" as const,
    revoke_route: "POST /mcp/api-keys/revoke/plan" as const,
    revoke_enforced_before_new_calls: true,
    rotate_route: "POST /mcp/api-keys/rotate/plan" as const,
    rotation_old_key_denied: true,
    rotation_supported: true,
    runtime_route: "GET /mcp/api-keys/runtime" as const,
    server_to_server_only: true,
    status: "mcp_api_key_scaffold" as const,
    supported_scopes: MCP_OAUTH_SCOPE_DEFINITIONS.map((definition) => definition.scope),
    version: MCP_API_KEY_VERSION
  };
}

export function getMcpOAuthCapabilities() {
  return {
    authorization_code_lifetime_seconds: 300,
    authorize_route: "POST /mcp/oauth/authorize/plan" as const,
    live_oauth_provider: false,
    package: "@aiphabee/mcp-runtime" as const,
    pkce_methods: ["S256"] as const,
    redirect_uri_validation: "planned" as const,
    revocation_enforcement_route: "POST /mcp/revocations/enforce/plan" as const,
    revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    revoke_enforced_before_new_calls: true,
    runtime_route: "GET /mcp/oauth/runtime" as const,
    scope_catalog: MCP_OAUTH_SCOPE_DEFINITIONS,
    scopes_revocable: true,
    status: "mcp_oauth_pkce_scaffold" as const,
    third_party_token_passthrough: false,
    token_lifetime_seconds: 900,
    token_route: "POST /mcp/oauth/token/plan" as const,
    version: MCP_OAUTH_PKCE_VERSION
  };
}

export function getMcpRevocationEnforcementCapabilities() {
  return {
    api_key_revoke_route: "POST /mcp/api-keys/revoke/plan" as const,
    api_key_rotation_old_key_denied: true,
    credential_kinds: ["oauth_connection", "api_key"] as const,
    credential_statuses: ["active", "revoked", "rotated", "unknown"] as const,
    denied_statuses: ["revoked", "rotated", "unknown"] as const,
    enforced_before_tool_execution: true,
    enforced_before_usage_debit: true,
    live_auth_middleware: false,
    oauth_revoke_route: "POST /mcp/oauth/revoke/plan" as const,
    package: "@aiphabee/mcp-runtime" as const,
    persistent_writes: false,
    protocol_route: "POST /mcp" as const,
    route: "POST /mcp/revocations/enforce/plan" as const,
    runtime_route: "GET /mcp/runtime" as const,
    standard_error_code: "AUTH_REQUIRED" as const,
    status: "mcp_revocation_enforcement_scaffold" as const,
    version: MCP_REVOCATION_ENFORCEMENT_VERSION
  };
}

export function createMcpRevocationEnforcementPlan(
  input: CreateMcpRevocationEnforcementPlanInput
): McpRevocationEnforcementPlan {
  const credentialKind = normalizeMcpCredentialKind(input.credentialKind);
  const credentialStatus = normalizeMcpCredentialStatus(input.credentialStatus);
  const connectionId = normalizeText(input.connectionId);
  const keyId = normalizeText(input.keyId);

  if (credentialKind === undefined) {
    throw new McpRuntimeInputError(
      "CREDENTIAL_KIND_REQUIRED",
      "credentialKind is required for MCP revocation enforcement"
    );
  }

  if (credentialStatus === undefined) {
    throw new McpRuntimeInputError(
      "CREDENTIAL_STATUS_REQUIRED",
      "credentialStatus is required for MCP revocation enforcement"
    );
  }

  if (credentialKind === "oauth_connection" && connectionId === undefined) {
    throw new McpRuntimeInputError(
      "CREDENTIAL_REFERENCE_REQUIRED",
      "connectionId is required for OAuth revocation enforcement"
    );
  }

  if (credentialKind === "api_key" && keyId === undefined) {
    throw new McpRuntimeInputError(
      "CREDENTIAL_REFERENCE_REQUIRED",
      "keyId is required for API key revocation enforcement"
    );
  }

  const method = normalizeMcpMethod(input.method);
  const decision = createRevocationDecision(credentialStatus);
  const sourceRecordId = `mcp_revocation_${credentialKind}_${credentialStatus}`;

  return {
    action: "enforce_revocation",
    credential: {
      connection_id: connectionId,
      credential_kind: credentialKind,
      credential_reference: credentialKind === "api_key" ? keyId ?? "" : connectionId ?? "",
      key_id: keyId,
      raw_credential_stored: false,
      status: credentialStatus
    },
    data_version: MCP_REVOCATION_ENFORCEMENT_VERSION,
    denial: {
      client_action: "reauthorize",
      decision,
      denied: decision !== "allow_planned",
      enforced_before_tool_execution: true,
      enforced_before_usage_debit: true,
      immediate_failure_after_revoke: true,
      immediate_failure_after_rotation: true,
      standard_error_code: "AUTH_REQUIRED"
    },
    live_auth_middleware: false,
    methodology_version: MCP_REVOCATION_ENFORCEMENT_VERSION,
    method,
    persistent_writes: false,
    protocol_route: "POST /mcp",
    provenance: [
      {
        data_version: MCP_REVOCATION_ENFORCEMENT_VERSION,
        methodology_version: MCP_REVOCATION_ENFORCEMENT_VERSION,
        source: "mcp-revocation-enforcement",
        source_record_id: sourceRecordId
      }
    ],
    reason: normalizeText(input.reason),
    request_id: input.requestId,
    revoked_at: normalizeText(input.revokedAt),
    rotated_at: normalizeText(input.rotatedAt),
    route: "POST /mcp/revocations/enforce/plan",
    status: "planned_no_live_revocation_enforcement",
    tool_name: normalizeText(input.toolName),
    usage: {
      cached: false,
      credits: 0,
      rows: 1
    },
    version: MCP_REVOCATION_ENFORCEMENT_VERSION
  };
}

export function createMcpOAuthAuthorizePlan(
  input: CreateMcpOAuthAuthorizePlanInput
): McpOAuthAuthorizePlan {
  const clientId = normalizeText(input.clientId);
  const redirectUri = normalizeText(input.redirectUri);
  const codeChallenge = normalizeText(input.codeChallenge);
  const userId = normalizeText(input.userId);
  const workspaceId = normalizeText(input.workspaceId);

  if (clientId === undefined) {
    throw new McpRuntimeInputError("CLIENT_ID_REQUIRED", "clientId is required");
  }

  if (redirectUri === undefined) {
    throw new McpRuntimeInputError(
      "REDIRECT_URI_REQUIRED",
      "redirectUri is required"
    );
  }

  if (!isAllowedRedirectUri(redirectUri)) {
    throw new McpRuntimeInputError(
      "INVALID_REDIRECT_URI",
      "redirectUri must be https or localhost for this scaffold",
      {
        redirectUri
      }
    );
  }

  if (codeChallenge === undefined) {
    throw new McpRuntimeInputError(
      "CODE_CHALLENGE_REQUIRED",
      "PKCE codeChallenge is required"
    );
  }

  if (input.codeChallengeMethod !== "S256") {
    throw new McpRuntimeInputError(
      "CODE_CHALLENGE_METHOD_UNSUPPORTED",
      "PKCE codeChallengeMethod must be S256",
      {
        codeChallengeMethod: input.codeChallengeMethod
      }
    );
  }

  if (!isValidPkceCodeChallenge(codeChallenge)) {
    throw new McpRuntimeInputError(
      "INVALID_CODE_CHALLENGE",
      "PKCE codeChallenge must be base64url and 43-128 characters"
    );
  }

  const scopes = normalizeAndValidateOAuthScopes(input.requestedScopes);

  return {
    action: "authorize",
    authorization_code: {
      code_emitted: false,
      expires_in_seconds: 300,
      one_time_use: true,
      status: "planned_no_live",
      token_exchange_route: "POST /mcp/oauth/token/plan"
    },
    client_id: clientId,
    consent: {
      clear_scope_display: true,
      requested_scope_count: scopes.length,
      scopes: scopes.map(createScopeGrant),
      user_consent_required: true
    },
    data_version: MCP_OAUTH_PKCE_VERSION,
    live_oauth_provider: false,
    methodology_version: MCP_OAUTH_PKCE_VERSION,
    oauth_flow: "authorization_code_pkce",
    pkce: {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      code_verifier_stored: false,
      plain_method_allowed: false
    },
    provenance: createMcpOAuthProvenance("authorize"),
    redirect_uri: redirectUri,
    request_id: input.requestId,
    revocation: {
      revoke_route: "POST /mcp/oauth/revoke/plan",
      revocable: true
    },
    route: "POST /mcp/oauth/authorize/plan",
    status: "planned_no_live_oauth",
    third_party_token_passthrough: false,
    token_issued: false,
    usage: {
      cached: false,
      credits: 0,
      rows: scopes.length
    },
    user: {
      source: userId === undefined ? "synthetic_default" : "request",
      user_id: userId ?? "user_internal_alpha"
    },
    version: MCP_OAUTH_PKCE_VERSION,
    workspace: {
      source: workspaceId === undefined ? "synthetic_default" : "request",
      workspace_id: workspaceId ?? "workspace_mcp"
    }
  };
}

export function createMcpOAuthTokenPlan(
  input: CreateMcpOAuthTokenPlanInput
): McpOAuthTokenPlan {
  const authorizationCode = normalizeText(input.authorizationCode);
  const codeVerifier = normalizeText(input.codeVerifier);

  if (authorizationCode === undefined) {
    throw new McpRuntimeInputError(
      "AUTHORIZATION_CODE_REQUIRED",
      "authorizationCode is required"
    );
  }

  if (codeVerifier === undefined) {
    throw new McpRuntimeInputError(
      "CODE_VERIFIER_REQUIRED",
      "PKCE codeVerifier is required"
    );
  }

  const scopes = normalizeAndValidateOAuthScopes(input.requestedScopes);

  return {
    action: "token",
    authorization_code: {
      authorization_code_received: true,
      one_time_use_required: true
    },
    client_id: normalizeText(input.clientId),
    data_version: MCP_OAUTH_PKCE_VERSION,
    live_oauth_provider: false,
    methodology_version: MCP_OAUTH_PKCE_VERSION,
    pkce_verification: {
      code_verifier_received: true,
      verification_status: "planned_no_live",
      verifier_hash_stored: false
    },
    provenance: createMcpOAuthProvenance("token"),
    request_id: input.requestId,
    route: "POST /mcp/oauth/token/plan",
    scope_binding: {
      requested_scopes: scopes,
      scopes_bound_to_token: true
    },
    status: "planned_no_live_oauth",
    third_party_token_passthrough: false,
    token: {
      access_token_issued: false,
      audience: "aiphabee-mcp",
      expires_in_seconds: 900,
      refresh_token_issued: false
    },
    usage: {
      cached: false,
      credits: 0,
      rows: scopes.length
    },
    version: MCP_OAUTH_PKCE_VERSION
  };
}

export function createMcpOAuthRevokePlan(
  input: CreateMcpOAuthRevokePlanInput
): McpOAuthRevokePlan {
  const connectionId = normalizeText(input.connectionId);
  const tokenId = normalizeText(input.tokenId);

  if (connectionId === undefined && tokenId === undefined) {
    throw new McpRuntimeInputError(
      "CONNECTION_OR_TOKEN_REQUIRED",
      "connectionId or tokenId is required"
    );
  }

  return {
    action: "revoke",
    connection_id: connectionId,
    data_version: MCP_OAUTH_PKCE_VERSION,
    live_oauth_provider: false,
    methodology_version: MCP_OAUTH_PKCE_VERSION,
    provenance: createMcpOAuthProvenance("revoke"),
    reason: normalizeText(input.reason),
    request_id: input.requestId,
    revocation_plan: {
      future_calls_denied_after_revoke: true,
      revoke_status: "planned_no_live",
      scope_grants_removed: "planned",
      token_invalidation_live: false
    },
    route: "POST /mcp/oauth/revoke/plan",
    status: "planned_no_live_oauth",
    token_id: tokenId,
    usage: {
      cached: false,
      credits: 0,
      rows: 1
    },
    version: MCP_OAUTH_PKCE_VERSION
  };
}

export function createMcpApiKeyCreatePlan(
  input: CreateMcpApiKeyCreatePlanInput
): McpApiKeyCreatePlan {
  assertNoRawApiKey(input.rawApiKey);
  const keyName = normalizeText(input.keyName);
  const workspaceId = normalizeText(input.workspaceId);
  const ownerId = normalizeText(input.ownerId);

  if (keyName === undefined) {
    throw new McpRuntimeInputError("API_KEY_NAME_REQUIRED", "keyName is required");
  }

  const scopes = normalizeAndValidateOAuthScopes(input.requestedScopes);
  const ipAllowlist = normalizeAndValidateIpAllowlist(input.ipAllowlist);
  const rotationAfterDays = normalizeRotationAfterDays(input.rotationAfterDays);

  return {
    ...createMcpApiKeyBasePlan({
      action: "create",
      ipAllowlist,
      requestId: input.requestId,
      scopes
    }),
    action: "create",
    api_key: {
      issued: false,
      key_id: "mcp_api_key_planned",
      key_name: keyName,
      key_status: "planned_no_live",
      live_secret_generated: false
    },
    owner: {
      owner_id: ownerId ?? "owner_internal_alpha",
      source: ownerId === undefined ? "synthetic_default" : "request"
    },
    rotation: {
      default_rotation_after_days: rotationAfterDays,
      rotatable: true,
      rotate_route: "POST /mcp/api-keys/rotate/plan"
    },
    route: "POST /mcp/api-keys/create/plan",
    revocation: {
      future_calls_denied_after_revoke: true,
      revoke_route: "POST /mcp/api-keys/revoke/plan"
    },
    workspace: {
      source: workspaceId === undefined ? "synthetic_default" : "request",
      workspace_id: workspaceId ?? "workspace_mcp"
    }
  };
}

export function createMcpApiKeyRotatePlan(
  input: CreateMcpApiKeyRotatePlanInput
): McpApiKeyRotatePlan {
  assertNoRawApiKey(input.rawApiKey);
  const keyId = normalizeText(input.keyId);

  if (keyId === undefined) {
    throw new McpRuntimeInputError("API_KEY_ID_REQUIRED", "keyId is required");
  }

  const scopes = normalizeAndValidateOAuthScopes(input.requestedScopes);
  const ipAllowlist = normalizeAndValidateIpAllowlist(input.ipAllowlist);
  const rotationAfterDays = normalizeRotationAfterDays(input.rotationAfterDays);

  return {
    ...createMcpApiKeyBasePlan({
      action: "rotate",
      ipAllowlist,
      requestId: input.requestId,
      scopes
    }),
    action: "rotate",
    api_key: {
      key_id: keyId,
      live_secret_generated: false,
      new_key_material_display_once: true,
      old_key_future_calls_denied_after_rotation: true,
      rotation_overlap_seconds: 0,
      rotation_status: "planned_no_live"
    },
    reason: normalizeText(input.reason),
    rotation: {
      next_rotation_after_days: rotationAfterDays,
      rotatable: true
    },
    route: "POST /mcp/api-keys/rotate/plan"
  };
}

export function createMcpApiKeyRevokePlan(
  input: CreateMcpApiKeyRevokePlanInput
): McpApiKeyRevokePlan {
  assertNoRawApiKey(input.rawApiKey);
  const keyId = normalizeText(input.keyId);

  if (keyId === undefined) {
    throw new McpRuntimeInputError("API_KEY_ID_REQUIRED", "keyId is required");
  }

  return {
    action: "revoke",
    api_key_live: false,
    data_version: MCP_API_KEY_VERSION,
    key_id: keyId,
    methodology_version: MCP_API_KEY_VERSION,
    provenance: createMcpApiKeyProvenance("revoke"),
    reason: normalizeText(input.reason),
    request_id: input.requestId,
    revocation_plan: {
      future_calls_denied_after_revoke: true,
      key_hash_disabled: "planned",
      live_invalidation: false,
      revoke_status: "planned_no_live"
    },
    route: "POST /mcp/api-keys/revoke/plan",
    status: "planned_no_live_api_key",
    usage: {
      cached: false,
      credits: 0,
      rows: 1
    },
    version: MCP_API_KEY_VERSION
  };
}

export function createMcpProtocolPlan(
  input: CreateMcpProtocolPlanInput
): McpProtocolPlan {
  const method = normalizeMcpMethod(input.method);
  const allowedOrigins = input.allowedOrigins ?? DEFAULT_MCP_ALLOWED_ORIGINS;
  const origin = normalizeText(input.origin);

  if (method === undefined) {
    throw new McpRuntimeInputError(
      "UNSUPPORTED_METHOD",
      "method must be initialize, tools/list, or tools/call",
      {
        method: input.method,
        supportedMethods: MCP_SUPPORTED_METHODS
      }
    );
  }

  if (origin === undefined) {
    throw new McpRuntimeInputError("ORIGIN_REQUIRED", "Origin header is required");
  }

  if (!allowedOrigins.includes(origin)) {
    throw new McpRuntimeInputError(
      "ORIGIN_NOT_ALLOWED",
      "Origin is not allowed for MCP Streamable HTTP",
      {
        allowedOrigins,
        origin
      }
    );
  }

  const rightsConfirmed = input.mcpRedistributionRightsConfirmed === true;
  const basePlan = createBasePlan({
    accountId: input.accountId,
    allowedOrigins,
    clientName: input.clientName,
    clientVersion: input.clientVersion,
    membershipId: input.membershipId,
    method,
    origin,
    pendingCredits: input.pendingCredits,
    requestId: input.requestId,
    rightsConfirmed,
    subscriptionId: input.subscriptionId,
    usagePlanCode: input.usagePlanCode,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const revocationEnforcement = createOptionalMcpRevocationEnforcementPlan(input, method);
  const guardedBasePlan =
    revocationEnforcement === undefined
      ? basePlan
      : {
          ...basePlan,
          revocation_enforcement: revocationEnforcement
        };

  if (revocationEnforcement?.denial.denied === true) {
    throw new McpRuntimeInputError(
      "MCP_CREDENTIAL_REVOKED",
      "MCP credential is revoked or rotated; reauthorization is required before new calls",
      {
        credentialKind: revocationEnforcement.credential.credential_kind,
        credentialStatus: revocationEnforcement.credential.status,
        decision: revocationEnforcement.denial.decision,
        enforcedBeforeToolExecution:
          revocationEnforcement.denial.enforced_before_tool_execution,
        standardErrorCode: revocationEnforcement.denial.standard_error_code
      }
    );
  }

  if (method === "initialize") {
    return {
      ...guardedBasePlan,
      initialize: {
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        protocol_version: "2025-03-26",
        server_info: {
          name: "aiphabee-mcp",
          version: MCP_RUNTIME_VERSION
        }
      }
    };
  }

  if (method === "tools/list") {
    const tools = rightsConfirmed ? createToolDescriptors(REGISTERED_TOOLS) : [];

    return {
      ...guardedBasePlan,
      tools_list: {
        blocked_tool_count: rightsConfirmed ? 0 : REGISTERED_TOOLS.length,
        returned_tool_count: tools.length,
        schema_snapshot: createToolsListSchemaSnapshotSummary(tools.length),
        tool_catalog_available_after_rights_gate: true,
        tools
      },
      usage: {
        ...createMcpUsageSummary(input, 0, tools.length)
      }
    };
  }

  return createToolCallPlan(guardedBasePlan, input);
}

function createBasePlan(input: {
  accountId?: string;
  allowedOrigins: readonly string[];
  clientName?: string;
  clientVersion?: string;
  membershipId?: string;
  method: McpMethod;
  origin: string;
  pendingCredits?: number;
  requestId: string;
  rightsConfirmed: boolean;
  subscriptionId?: string;
  usagePlanCode?: UsageQuotaPlanCode;
  usedCredits?: number;
  workspaceId?: string;
}): McpProtocolPlan {
  return {
    api_key_live: false,
    client: {
      name: normalizeText(input.clientName) ?? "unknown_mcp_client",
      version: normalizeText(input.clientVersion) ?? "unknown"
    },
    data_version: MCP_RUNTIME_VERSION,
    default_deny: true,
    developer_console: {
      console_ready: false,
      first_call_guide: "planned",
      logs_visible: false
    },
    endpoint: "/mcp",
    frontend_rendering: false,
    live_tool_execution: false,
    method: input.method,
    methodology_version: MCP_RUNTIME_VERSION,
    oauth_live: false,
    origin_check: {
      allowed_origins: input.allowedOrigins,
      origin: input.origin,
      required: true,
      valid: true
    },
    protocol: {
      json_rpc: "2.0",
      streamable_http: true,
      supported_methods: MCP_SUPPORTED_METHODS
    },
    provenance: [
      {
        data_version: MCP_RUNTIME_VERSION,
        methodology_version: MCP_RUNTIME_VERSION,
        source: "mcp-runtime",
        source_record_id: `mcp_${input.method.replace("/", "_")}`
      }
    ],
    request_id: input.requestId,
    response_shape: {
      mcp_error_detail_fields: [
        "category",
        "client_action",
        "internal_code",
        "mcp_error_version",
        "recoverable",
        "request_id",
        "retry_after_required",
        "source_record_id"
      ],
      standard_error_categories: MCP_STANDARD_ERROR_CATEGORIES,
      standard_error_code_version: MCP_STANDARD_ERROR_CODES_VERSION,
      standard_error_codes: MCP_STANDARD_ERROR_CODES,
      standard_error_definitions: MCP_STANDARD_ERROR_DEFINITIONS,
      standard_response_envelope: true,
      structured_content_required: true
    },
    rights_gate: {
      blocked_reason: input.rightsConfirmed
        ? undefined
        : "MCP_API_REDISTRIBUTION_RIGHTS_NOT_CONFIRMED",
      default_deny: true,
      mcp_api_redistribution_rights_confirmed: input.rightsConfirmed,
      web_rights_do_not_imply_mcp: true
    },
    status: input.rightsConfirmed
      ? "planned_no_live_execution"
      : "planned_default_deny",
    transport: "streamable_http",
    usage: createMcpUsageSummary(input, 0, 0),
    version: MCP_RUNTIME_VERSION
  };
}

function createToolCallPlan(
  basePlan: McpProtocolPlan,
  input: CreateMcpProtocolPlanInput
): McpProtocolPlan {
  const toolName = normalizeText(input.toolName);

  if (toolName === undefined) {
    throw new McpRuntimeInputError(
      "TOOL_NAME_REQUIRED",
      "tools/call requires a registered tool name"
    );
  }

  if (!isRegisteredToolName(toolName)) {
    throw new McpRuntimeInputError("TOOL_NOT_REGISTERED", "tool is not registered", {
      toolName
    });
  }

  const tool = REGISTERED_TOOLS.find((candidate) => candidate.name === toolName);

  if (tool === undefined) {
    throw new McpRuntimeInputError("TOOL_NOT_REGISTERED", "tool is not registered", {
      toolName
    });
  }

  if (!basePlan.rights_gate.mcp_api_redistribution_rights_confirmed) {
    throw new McpRuntimeInputError(
      "MCP_REDISTRIBUTION_RIGHTS_REQUIRED",
      "MCP/API redistribution rights are not confirmed",
      {
        toolName
      }
    );
  }

  const grantedScopes = new Set(input.grantedScopes ?? []);
  if (!grantedScopes.has(tool.permissions.requiredScope)) {
    throw new McpRuntimeInputError(
      "TOOL_SCOPE_REQUIRED",
      "required MCP tool scope is missing",
      {
        requiredScope: tool.permissions.requiredScope,
        toolName
      }
    );
  }

  const inputValidation = createToolInputValidationPlan(tool, input.toolArguments);
  const boundedRetrieval = createToolBoundedRetrievalPlan(tool, input.toolArguments);
  const usageEnvelope = createMcpToolUsageEnvelope(tool, input, boundedRetrieval);
  const toolLimits = createMcpToolLimitsPlan(tool, input, boundedRetrieval, usageEnvelope);

  return {
    ...basePlan,
    tool_call: {
      bounded_retrieval: boundedRetrieval,
      input_schema_id: tool.schema.inputSchemaId,
      input_validation: inputValidation,
      live_execution: false,
      output_schema_id: tool.schema.outputSchemaId,
      output_validation: {
        output_schema_id: tool.schema.outputSchemaId,
        raw_text_only_response_allowed: false,
        structured_content_matches_output_schema: "planned_no_live",
        structured_content_required: true
      },
      requested_tool_name: tool.name,
      required_scope: tool.permissions.requiredScope,
      schema_validation: "validated",
      structured_content_validation: "planned_no_live",
      tool_limits: toolLimits,
      usage_envelope: usageEnvelope
    },
    usage: createMcpUsageSummary(
      input,
      usageEnvelope.estimated_credits,
      boundedRetrieval.row_limit.effective_limit
    )
  };
}

function createMcpToolLimitsPlan(
  tool: RegisteredToolDefinition,
  input: CreateMcpProtocolPlanInput,
  boundedRetrieval: McpToolBoundedRetrievalPlan,
  usageEnvelope: McpUsageEnvelopePlan
): McpToolLimitsPlan {
  const estimatedCredits = usageEnvelope.estimated_credits;
  const highCost = estimatedCredits >= MCP_TOOL_LIMITER_HIGH_COST_THRESHOLD;
  const pool = highCost ? "mcp_high_cost" : "mcp_standard";
  const maxParallel = highCost
    ? MCP_TOOL_LIMITER_HIGH_COST_MAX_PARALLEL
    : MCP_TOOL_LIMITER_STANDARD_MAX_PARALLEL;
  const scope = createMcpToolLimiterScope(tool, input);

  return {
    budget: {
      allowed_after_estimate: usageEnvelope.credits_remaining_after_estimate >= 0,
      budget_exceeded: usageEnvelope.credits_remaining_after_estimate < 0,
      budget_exceeded_error_code: "BUDGET_EXCEEDED",
      estimated_credits: estimatedCredits,
      failure_refund_required: true,
      live_debit: false,
      pre_debit_required: true,
      remaining_credits_after_estimate: usageEnvelope.credits_remaining_after_estimate
    },
    concurrency: {
      high_cost_pool_isolated: true,
      live_inflight_reads: false,
      max_parallel: maxParallel,
      pool
    },
    durable_queue: {
      enqueue_status: highCost ? "planned_no_live" : "not_required",
      idempotency_key: `mcp_tool_limit_${toLimiterKeyPart(input.requestId)}_${toLimiterKeyPart(scope.key_material.rate_limit_key)}`,
      live_queue_writes: false,
      queue_name: highCost ? "mcp-high-cost" : null,
      required: highCost
    },
    limiter_version: MCP_TOOL_LIMITER_VERSION,
    ordinary_pool_protection: true,
    rate_limit: {
      burst_limit: MCP_TOOL_LIMITER_BURST_LIMIT,
      live_window_reads: false,
      per_minute_limit: MCP_TOOL_LIMITER_RATE_LIMIT_PER_MINUTE,
      rate_limited: false,
      rate_limited_error_code: "RATE_LIMITED",
      retry_after_seconds: null,
      status: "planned_no_live"
    },
    scope,
    tool_name: tool.name,
    weight: {
      credit_weight: estimatedCredits,
      high_cost: highCost,
      high_cost_threshold: MCP_TOOL_LIMITER_HIGH_COST_THRESHOLD,
      row_estimate: boundedRetrieval.row_limit.effective_limit
    }
  };
}

function createMcpToolLimiterScope(
  tool: RegisteredToolDefinition,
  input: CreateMcpProtocolPlanInput
): McpToolLimiterScope {
  const accountId = normalizeText(input.accountId);
  const membershipId = normalizeText(input.membershipId);
  const workspaceId = normalizeText(input.workspaceId);
  const clientName = normalizeText(input.clientName);
  const clientVersion = normalizeText(input.clientVersion);
  const origin = normalizeText(input.origin);
  const dataset = tool.permissions.dataClasses[0] ?? tool.name;
  const ipRiskLevel = normalizeIpRiskLevel(input.ipRiskLevel);
  const scopeParts = {
    client: clientName ?? "client_unresolved",
    dataset,
    ipRisk: ipRiskLevel,
    tool: tool.name,
    user: accountId ?? "account_unresolved",
    workspace: workspaceId ?? "workspace_unresolved"
  };
  const scopedKey = [
    `user=${scopeParts.user}`,
    `workspace=${scopeParts.workspace}`,
    `client=${scopeParts.client}`,
    `tool=${scopeParts.tool}`,
    `dataset=${scopeParts.dataset}`,
    `ip_risk=${scopeParts.ipRisk}`
  ]
    .map(toLimiterKeyPart)
    .join("|");

  return {
    client: {
      name: scopeParts.client,
      origin: origin ?? "origin_unresolved",
      source: clientName === undefined ? "unresolved" : "request",
      version: clientVersion ?? "unknown"
    },
    dataset: {
      name: dataset,
      source: "tool_registry_data_class"
    },
    dimension_keys: ["user", "workspace", "client", "tool", "dataset", "ip_risk"],
    ip_risk: {
      client_ip_present: normalizeText(input.clientIp) !== undefined,
      live_reputation_lookup: false,
      raw_ip_stored: false,
      risk_level: ipRiskLevel,
      source: ipRiskLevel === "unknown" ? "unrated" : "request"
    },
    key_material: {
      budget_key: `budget|${scopedKey}`,
      concurrency_key: `concurrency|${scopedKey}`,
      rate_limit_key: `rate|${scopedKey}`
    },
    tool: {
      name: tool.name,
      required_scope: tool.permissions.requiredScope
    },
    user: {
      account_id: scopeParts.user,
      membership_id: membershipId ?? "membership_unresolved",
      source: accountId === undefined ? "unresolved" : "request"
    },
    workspace: {
      source: workspaceId === undefined ? "unresolved" : "request",
      workspace_id: scopeParts.workspace
    }
  };
}

function normalizeIpRiskLevel(value: string | undefined): McpIpRiskLevel {
  const normalized = normalizeText(value)?.toLowerCase();

  return normalized === "high" || normalized === "medium" || normalized === "low"
    ? normalized
    : "unknown";
}

function toLimiterKeyPart(value: string): string {
  return value.replace(/[^A-Za-z0-9_.:=-]/gu, "_");
}

function createToolDescriptors(
  tools: readonly RegisteredToolDefinition[]
): McpToolDescriptor[] {
  return tools.map((tool) => ({
    breaking_changes_require_new_major: tool.lifecycle.breakingChangesRequireNewMajor,
    deprecation: {
      announced_at: tool.lifecycle.deprecation.announcedAt,
      migration_guide: tool.lifecycle.deprecation.migrationGuide,
      minimum_notice_days: tool.lifecycle.deprecation.minimumNoticeDays,
      status: tool.lifecycle.deprecation.status,
      sunset_at: tool.lifecycle.deprecation.sunsetAt
    },
    description: tool.description,
    input_schema_id: tool.schema.inputSchemaId,
    major_version: tool.lifecycle.majorVersion,
    name: tool.name,
    output_schema_id: tool.schema.outputSchemaId,
    public_version: tool.lifecycle.publicVersion,
    required_scope: tool.permissions.requiredScope,
    retrieval_limits: createToolRetrievalLimitsDescriptor(tool),
    schema_snapshot: createToolSchemaSnapshotDescriptor(tool),
    version: tool.version
  }));
}

function createToolsListSchemaSnapshotSummary(
  returnedSchemaCount: number
): McpToolsListSchemaSnapshotSummary {
  return {
    returned_schema_count: returnedSchemaCount,
    runtime_schema_serving: true,
    schema_catalog_available_after_rights_gate: true,
    schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
    schema_source_contract: MCP_TOOL_SCHEMA_SOURCE_CONTRACT,
    tool_schema_count: REGISTERED_TOOLS.length,
    tools_list_schema_snapshot: true
  };
}

function createToolSchemaSnapshotDescriptor(
  tool: RegisteredToolDefinition
): McpToolSchemaSnapshotDescriptor {
  const inputRule = MCP_TOOL_INPUT_VALIDATION_RULES[tool.name];

  return {
    input_schema: {
      additional_properties_allowed: false,
      allowed_properties: inputRule.allowed,
      any_of: inputRule.anyOf,
      id: tool.schema.inputSchemaId,
      required: inputRule.required
    },
    output_schema: {
      id: tool.schema.outputSchemaId,
      raw_text_only_response_allowed: false,
      required_envelope_fields: MCP_STANDARD_RESPONSE_ENVELOPE_FIELDS,
      standard_response_envelope: tool.schema.standardResponseEnvelope,
      structured_content_required: true
    },
    schema_dialect: MCP_JSON_SCHEMA_DIALECT,
    schema_snapshot_version: MCP_RUNTIME_SCHEMA_SNAPSHOT_VERSION,
    schema_source_contract: MCP_TOOL_SCHEMA_SOURCE_CONTRACT,
    standard_error_codes: tool.schema.standardErrorCodes
  };
}

function createToolRetrievalLimitsDescriptor(
  tool: RegisteredToolDefinition
): McpToolRetrievalLimitsDescriptor {
  return {
    cursor_pagination: {
      cursor_bound_to_request: tool.retrieval.cursorPagination.cursorBoundToRequest,
      cursor_opaque: tool.retrieval.cursorPagination.cursorOpaque,
      enabled: tool.retrieval.cursorPagination.enabled,
      parameter: tool.retrieval.cursorPagination.parameter
    },
    enforced_before_execution: tool.retrieval.enforcedBeforeExecution,
    plan_or_rights_bypass_blocked: tool.retrieval.planOrRightsBypassBlocked,
    row_limit: {
      default_limit: tool.retrieval.rowLimit.defaultLimit,
      max_limit: tool.retrieval.rowLimit.maxLimit,
      parameter: tool.retrieval.rowLimit.parameter
    },
    time_range_limit: {
      from_parameters: tool.retrieval.timeRangeLimit.fromParameters,
      max_window_days: tool.retrieval.timeRangeLimit.maxWindowDays,
      required: tool.retrieval.timeRangeLimit.required,
      to_parameters: tool.retrieval.timeRangeLimit.toParameters
    }
  };
}

function createToolInputValidationPlan(
  tool: RegisteredToolDefinition,
  rawArguments: unknown
): McpToolInputValidationPlan {
  if (rawArguments !== undefined && !isPlainRecord(rawArguments)) {
    throw new McpRuntimeInputError(
      "TOOL_ARGUMENTS_OBJECT_REQUIRED",
      "tools/call arguments must be an object"
    );
  }

  const args = rawArguments ?? {};
  const argumentKeys = Object.keys(args);
  const rules = MCP_TOOL_INPUT_VALIDATION_RULES[tool.name];
  const allowedArguments = rules.allowed as readonly string[];
  const unsupportedArguments = argumentKeys.filter((key) => !allowedArguments.includes(key));

  if (unsupportedArguments.length > 0) {
    throw new McpRuntimeInputError(
      "TOOL_ARGUMENT_UNSUPPORTED",
      "tools/call arguments include fields outside the input schema",
      {
        inputSchemaId: tool.schema.inputSchemaId,
        toolName: tool.name,
        unsupportedArguments
      }
    );
  }

  const missingRequiredArguments = rules.required.filter((key) => !argumentKeys.includes(key));
  const anyOfSatisfied =
    rules.anyOf.length === 0 ||
    rules.anyOf.some((requiredGroup) => requiredGroup.every((key) => argumentKeys.includes(key)));

  if (missingRequiredArguments.length > 0 || !anyOfSatisfied) {
    throw new McpRuntimeInputError(
      "TOOL_ARGUMENT_REQUIRED",
      "tools/call arguments are missing required input schema fields",
      {
        anyOf: rules.anyOf,
        inputSchemaId: tool.schema.inputSchemaId,
        missingRequiredArguments,
        toolName: tool.name
      }
    );
  }

  return {
    additional_properties_allowed: false,
    arguments_valid: true,
    input_schema_id: tool.schema.inputSchemaId,
    missing_required_arguments: [],
    required_fields_present: true,
    schema_validation_status: "validated",
    schema_validation_version: MCP_TOOL_SCHEMA_VALIDATION_VERSION,
    unsupported_arguments: []
  };
}

function createToolBoundedRetrievalPlan(
  tool: RegisteredToolDefinition,
  rawArguments: unknown
): McpToolBoundedRetrievalPlan {
  const args = isPlainRecord(rawArguments) ? rawArguments : {};
  const requestedLimit = getRequestedLimit(tool, args);
  const cursor = getRequestedCursor(tool, args);
  const timeRange = getRequestedTimeRange(tool, args);

  return {
    cursor_pagination: {
      cursor,
      cursor_bound_to_request: tool.retrieval.cursorPagination.cursorBoundToRequest,
      cursor_opaque: tool.retrieval.cursorPagination.cursorOpaque,
      enabled: tool.retrieval.cursorPagination.enabled,
      parameter: tool.retrieval.cursorPagination.parameter
    },
    enforcement_status: "validated",
    max_rows_enforced: true,
    pagination_limits_version: MCP_PAGINATION_LIMITS_VERSION,
    plan_or_rights_bypass_blocked: tool.retrieval.planOrRightsBypassBlocked,
    row_limit: {
      default_limit: tool.retrieval.rowLimit.defaultLimit,
      effective_limit: requestedLimit,
      max_limit: tool.retrieval.rowLimit.maxLimit,
      requested_limit: requestedLimit,
      requested_limit_parameter: tool.retrieval.rowLimit.parameter,
      too_many_rows_error_code: "TOO_MANY_ROWS"
    },
    time_range_limit: {
      from: timeRange.from,
      from_parameters: tool.retrieval.timeRangeLimit.fromParameters,
      max_window_days: tool.retrieval.timeRangeLimit.maxWindowDays,
      out_of_range_error_code: "OUT_OF_RANGE",
      required: tool.retrieval.timeRangeLimit.required,
      time_range_enforced: true,
      to: timeRange.to,
      to_parameters: tool.retrieval.timeRangeLimit.toParameters,
      window_days: timeRange.windowDays
    }
  };
}

function createMcpToolUsageEnvelope(
  tool: RegisteredToolDefinition,
  input: CreateMcpProtocolPlanInput,
  boundedRetrieval: McpToolBoundedRetrievalPlan
): McpUsageEnvelopePlan {
  const estimatedCredits = Math.max(1, boundedRetrieval.row_limit.effective_limit);
  const quotaDisplay = createUsageQuotaDisplayPlan({
    accountId: input.accountId,
    channel: "mcp",
    pendingCredits: normalizeUsageCreditCount(input.pendingCredits) + estimatedCredits,
    planCode: input.usagePlanCode,
    requestId: input.requestId,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });
  const dataset = tool.permissions.dataClasses[0] ?? tool.name;
  const ledgerEvent = createUsageLedgerEventPlan({
    accountId: input.accountId,
    cached: false,
    channel: "mcp",
    credits: estimatedCredits,
    dataVersion: MCP_USAGE_ENVELOPE_VERSION,
    dataset,
    gatewayStatus: "planned_no_live_execution",
    membershipId: input.membershipId,
    meteredFields: tool.permissions.dataClasses.length,
    meteredRows: boundedRetrieval.row_limit.effective_limit,
    methodologyVersion: MCP_USAGE_ENVELOPE_VERSION,
    occurredAt: "1970-01-01T00:00:00.000Z",
    operation: "tool_call",
    outputUnits: 0,
    qualityState: "PASS",
    requestId: input.requestId,
    rightsPolicyVersion: "mcp-default-deny-planned-v0",
    sourceRecordId: `mcp_usage_${tool.name}`,
    subscriptionId: input.subscriptionId,
    toolName: tool.name,
    workspaceId: input.workspaceId
  });

  return {
    billable_credits: 0,
    channel: "mcp",
    credits_remaining_after_estimate: quotaDisplay.quota.credits_remaining,
    estimated_credits: estimatedCredits,
    ledger_event: ledgerEvent,
    live_billing_reconciliation: false,
    live_ledger_reads: false,
    persistent_writes: false,
    quota_display: quotaDisplay,
    reconciliation: {
      status: "planned_no_live",
      target_delay_minutes: 5,
      usage_ledger_event_writer_version: USAGE_LEDGER_EVENT_WRITER_VERSION,
      usage_quota_display_version: USAGE_QUOTA_DISPLAY_VERSION
    },
    request_id: input.requestId,
    request_id_visible: true,
    usage_envelope_version: MCP_USAGE_ENVELOPE_VERSION
  };
}

function createMcpUsageSummary(
  input: {
    accountId?: string;
    pendingCredits?: number;
    requestId: string;
    usagePlanCode?: UsageQuotaPlanCode;
    usedCredits?: number;
    workspaceId?: string;
  },
  estimatedCredits: number,
  rows: number
): McpUsageSummary {
  const quotaDisplay = createUsageQuotaDisplayPlan({
    accountId: input.accountId,
    channel: "mcp",
    pendingCredits: normalizeUsageCreditCount(input.pendingCredits) + estimatedCredits,
    planCode: input.usagePlanCode,
    requestId: input.requestId,
    usedCredits: input.usedCredits,
    workspaceId: input.workspaceId
  });

  return {
    cached: false,
    credit_limit: quotaDisplay.quota.credit_limit,
    credits: estimatedCredits,
    credits_pending: quotaDisplay.quota.credits_pending,
    credits_remaining: quotaDisplay.quota.credits_remaining,
    credits_used: quotaDisplay.quota.credits_used,
    freshness_target_minutes: quotaDisplay.freshness_target_minutes,
    live_ledger_reads: quotaDisplay.live_ledger_reads,
    request_id: input.requestId,
    request_id_visible: true,
    rows,
    usage_reconciliation_status: "planned_no_live"
  };
}

function normalizeUsageCreditCount(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function getRequestedLimit(
  tool: RegisteredToolDefinition,
  args: Record<string, unknown>
): number {
  const parameter = tool.retrieval.rowLimit.parameter;
  if (parameter === null) {
    return tool.retrieval.rowLimit.defaultLimit;
  }

  const rawLimit = getFirstArgumentValue(args, [parameter, toCamelCase(parameter)]);
  if (rawLimit === undefined) {
    return tool.retrieval.rowLimit.defaultLimit;
  }

  if (typeof rawLimit !== "number" || !Number.isInteger(rawLimit) || rawLimit < 1) {
    throw new McpRuntimeInputError(
      "TOOL_LIMIT_INVALID",
      "tools/call limit must be a positive integer",
      {
        limitParameter: parameter,
        maxLimit: tool.retrieval.rowLimit.maxLimit,
        toolName: tool.name
      }
    );
  }

  if (rawLimit > tool.retrieval.rowLimit.maxLimit) {
    throw new McpRuntimeInputError(
      "TOOL_LIMIT_EXCEEDED",
      "tools/call requested rows exceed the tool maximum row limit",
      {
        limitParameter: parameter,
        maxLimit: tool.retrieval.rowLimit.maxLimit,
        requestedLimit: rawLimit,
        toolName: tool.name
      }
    );
  }

  return rawLimit;
}

function getRequestedCursor(
  tool: RegisteredToolDefinition,
  args: Record<string, unknown>
): null | string {
  const parameter = tool.retrieval.cursorPagination.parameter;
  if (parameter === null) {
    return null;
  }

  const rawCursor = getArgumentValue(args, parameter);
  if (rawCursor === undefined) {
    return null;
  }

  if (typeof rawCursor !== "string" || rawCursor.trim().length === 0) {
    throw new McpRuntimeInputError(
      "TOOL_CURSOR_INVALID",
      "tools/call cursor must be an opaque non-empty string",
      {
        cursorParameter: parameter,
        toolName: tool.name
      }
    );
  }

  return rawCursor;
}

function getRequestedTimeRange(
  tool: RegisteredToolDefinition,
  args: Record<string, unknown>
): { from: null | string; to: null | string; windowDays: null | number } {
  const timeRangeLimit = tool.retrieval.timeRangeLimit;
  const rawFrom = getFirstArgumentValue(args, timeRangeLimit.fromParameters);
  const rawTo = getFirstArgumentValue(args, timeRangeLimit.toParameters);
  const nestedRangeProvided = [...timeRangeLimit.fromParameters, ...timeRangeLimit.toParameters]
    .filter((parameter) => parameter.includes("."))
    .some((parameter) => getArgumentValue(args, parameter.split(".")[0] ?? "") !== undefined);

  if (rawFrom === undefined && rawTo === undefined && !timeRangeLimit.required) {
    return {
      from: null,
      to: null,
      windowDays: null
    };
  }

  if (typeof rawFrom !== "string" || typeof rawTo !== "string") {
    throw new McpRuntimeInputError(
      "TOOL_TIME_RANGE_INVALID",
      "tools/call time range requires ISO date from/to strings",
      {
        fromParameters: timeRangeLimit.fromParameters,
        nestedRangeProvided,
        required: timeRangeLimit.required,
        toParameters: timeRangeLimit.toParameters,
        toolName: tool.name
      }
    );
  }

  if (!isIsoDate(rawFrom) || !isIsoDate(rawTo)) {
    throw new McpRuntimeInputError(
      "TOOL_TIME_RANGE_INVALID",
      "tools/call time range must use YYYY-MM-DD dates",
      {
        from: rawFrom,
        to: rawTo,
        toolName: tool.name
      }
    );
  }

  const fromMs = Date.parse(`${rawFrom}T00:00:00Z`);
  const toMs = Date.parse(`${rawTo}T00:00:00Z`);
  if (fromMs > toMs) {
    throw new McpRuntimeInputError(
      "TOOL_TIME_RANGE_INVALID",
      "tools/call time range must have from <= to",
      {
        from: rawFrom,
        to: rawTo,
        toolName: tool.name
      }
    );
  }

  const windowDays = Math.floor((toMs - fromMs) / 86_400_000) + 1;
  const maxWindowDays = timeRangeLimit.maxWindowDays;
  if (maxWindowDays !== null && windowDays > maxWindowDays) {
    throw new McpRuntimeInputError(
      "TOOL_TIME_RANGE_EXCEEDED",
      "tools/call time range exceeds the maximum window",
      {
        from: rawFrom,
        maxWindowDays,
        to: rawTo,
        toolName: tool.name,
        windowDays
      }
    );
  }

  return {
    from: rawFrom,
    to: rawTo,
    windowDays
  };
}

function getFirstArgumentValue(
  args: Record<string, unknown>,
  parameters: readonly string[]
): unknown {
  for (const parameter of parameters) {
    const value = getArgumentValue(args, parameter);
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function getArgumentValue(args: Record<string, unknown>, parameter: string): unknown {
  const parts = parameter.split(".");
  let current: unknown = args;

  for (const part of parts) {
    if (!isPlainRecord(current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function createMcpApiKeyBasePlan(input: {
  action: "create" | "rotate";
  ipAllowlist: string[];
  requestId: string;
  scopes: McpOAuthScope[];
}): McpApiKeyBasePlan {
  return {
    api_key_live: false,
    data_version: MCP_API_KEY_VERSION,
    frontend_rendering: false,
    hash_storage: {
      hash_algorithm: "hmac_sha256_with_pepper_planned",
      key_hash_stored: true,
      key_last_four_stored: true,
      pepper_required: true,
      raw_key_stored: false,
      storage_status: "planned_no_live"
    },
    ip_restrictions: {
      allowlist: input.ipAllowlist,
      enforcement_status: "planned_no_live",
      ip_allowlist_supported: true,
      validated: true
    },
    key_material: {
      display_window: "create_or_rotate_response_only",
      key_material_returned: false,
      key_prefix: "aipb_srv_",
      one_time_display: true
    },
    methodology_version: MCP_API_KEY_VERSION,
    provenance: createMcpApiKeyProvenance(input.action),
    request_id: input.requestId,
    scope_binding: {
      requested_scopes: input.scopes,
      scope_grants: input.scopes.map(createApiKeyScopeGrant),
      scopes_bound_to_key: true
    },
    server_to_server: {
      allowed_only: true,
      browser_use_allowed: false
    },
    status: "planned_no_live_api_key",
    usage: {
      cached: false,
      credits: 0,
      rows: input.scopes.length
    },
    version: MCP_API_KEY_VERSION
  };
}

function normalizeAndValidateOAuthScopes(
  requestedScopes: readonly string[] | undefined
): McpOAuthScope[] {
  const scopes = [...new Set(requestedScopes ?? [])]
    .map((scope) => normalizeText(scope))
    .filter((scope): scope is string => scope !== undefined);

  if (scopes.length === 0) {
    throw new McpRuntimeInputError(
      "SCOPE_REQUIRED",
      "at least one OAuth scope is required"
    );
  }

  const unsupportedScopes = scopes.filter((scope) => !isMcpOAuthScope(scope));
  if (unsupportedScopes.length > 0) {
    throw new McpRuntimeInputError("UNSUPPORTED_SCOPE", "OAuth scope is unsupported", {
      supportedScopes: MCP_OAUTH_SCOPE_DEFINITIONS.map((definition) => definition.scope),
      unsupportedScopes
    });
  }

  return scopes as McpOAuthScope[];
}

function createScopeGrant(scope: McpOAuthScope): McpOAuthScopeGrant {
  const definition = MCP_OAUTH_SCOPE_DEFINITIONS.find(
    (candidate) => candidate.scope === scope
  );

  if (definition === undefined) {
    throw new McpRuntimeInputError("UNSUPPORTED_SCOPE", "OAuth scope is unsupported", {
      scope
    });
  }

  return {
    data_classes: definition.data_classes,
    description: definition.description,
    risk_level: definition.risk_level,
    revocable: true,
    scope: definition.scope,
    write: definition.write
  };
}

function createApiKeyScopeGrant(scope: McpOAuthScope): McpApiKeyScopeGrant {
  const grant = createScopeGrant(scope);

  return {
    data_classes: grant.data_classes,
    scope: grant.scope,
    write: grant.write
  };
}

function createMcpOAuthProvenance(action: "authorize" | "revoke" | "token") {
  return [
    {
      data_version: MCP_OAUTH_PKCE_VERSION,
      methodology_version: MCP_OAUTH_PKCE_VERSION,
      source: "mcp-oauth-pkce",
      source_record_id: `mcp_oauth_${action}`
    }
  ];
}

function createMcpApiKeyProvenance(action: "create" | "revoke" | "rotate") {
  return [
    {
      data_version: MCP_API_KEY_VERSION,
      methodology_version: MCP_API_KEY_VERSION,
      source: "mcp-api-key",
      source_record_id: `mcp_api_key_${action}`
    }
  ];
}

function assertNoRawApiKey(rawApiKey: string | undefined): void {
  if (normalizeText(rawApiKey) !== undefined) {
    throw new McpRuntimeInputError(
      "RAW_API_KEY_FORBIDDEN",
      "raw API key material must not be submitted to planning routes"
    );
  }
}

function normalizeAndValidateIpAllowlist(
  ipAllowlist: readonly string[] | undefined
): string[] {
  const normalized = [...new Set(ipAllowlist ?? [])]
    .map((item) => normalizeText(item))
    .filter((item): item is string => item !== undefined);

  const invalidValues = normalized.filter((item) => !isValidIpAllowlistValue(item));
  if (invalidValues.length > 0) {
    throw new McpRuntimeInputError(
      "INVALID_IP_ALLOWLIST",
      "ipAllowlist must contain IP addresses or CIDR ranges",
      {
        invalidValues
      }
    );
  }

  return normalized;
}

function normalizeRotationAfterDays(value: number | undefined): number {
  if (value === undefined) {
    return 90;
  }

  if (!Number.isInteger(value) || value < 1 || value > 365) {
    throw new McpRuntimeInputError(
      "INVALID_API_KEY_ROTATION_DAYS",
      "rotationAfterDays must be an integer between 1 and 365"
    );
  }

  return value;
}

function isMcpOAuthScope(value: string): value is McpOAuthScope {
  return MCP_OAUTH_SCOPE_DEFINITIONS.some((definition) => definition.scope === value);
}

function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

function isValidPkceCodeChallenge(value: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/u.test(value);
}

function isValidIpAllowlistValue(value: string): boolean {
  return isValidIpv4Cidr(value) || isValidIpv6Cidr(value);
}

function isValidIpv4Cidr(value: string): boolean {
  const match = value.match(/^(\d{1,3})(?:\.(\d{1,3})){3}(?:\/(\d{1,2}))?$/u);
  if (match === null) {
    return false;
  }

  const [address, cidr] = value.split("/");
  const octets = address.split(".").map((octet) => Number(octet));
  const cidrNumber = cidr === undefined ? undefined : Number(cidr);

  return (
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
    (cidrNumber === undefined ||
      (Number.isInteger(cidrNumber) && cidrNumber >= 0 && cidrNumber <= 32))
  );
}

function isValidIpv6Cidr(value: string): boolean {
  if (!value.includes(":")) {
    return false;
  }

  const [address, cidr] = value.split("/");
  const cidrNumber = cidr === undefined ? undefined : Number(cidr);

  return (
    /^[0-9A-Fa-f:]+$/u.test(address) &&
    address.includes(":") &&
    (cidrNumber === undefined ||
      (Number.isInteger(cidrNumber) && cidrNumber >= 0 && cidrNumber <= 128))
  );
}

function createOptionalMcpRevocationEnforcementPlan(
  input: CreateMcpProtocolPlanInput,
  method: McpMethod
): McpRevocationEnforcementPlan | undefined {
  const hasCredentialContext =
    normalizeText(input.credentialKind) !== undefined ||
    normalizeText(input.credentialStatus) !== undefined ||
    normalizeText(input.connectionId) !== undefined ||
    normalizeText(input.keyId) !== undefined;

  if (!hasCredentialContext) {
    return undefined;
  }

  return createMcpRevocationEnforcementPlan({
    connectionId: input.connectionId,
    credentialKind: input.credentialKind,
    credentialStatus: input.credentialStatus,
    keyId: input.keyId,
    method,
    reason: input.revocationReason,
    requestId: input.requestId,
    revokedAt: input.revokedAt,
    rotatedAt: input.rotatedAt,
    toolName: input.toolName
  });
}

function normalizeMcpCredentialKind(value: string | undefined): McpCredentialKind | undefined {
  const normalized = normalizeText(value);
  if (normalized === undefined) {
    return undefined;
  }

  if (normalized === "api_key" || normalized === "oauth_connection") {
    return normalized;
  }

  throw new McpRuntimeInputError(
    "CREDENTIAL_KIND_REQUIRED",
    "credentialKind must be oauth_connection or api_key",
    {
      credentialKind: normalized
    }
  );
}

function normalizeMcpCredentialStatus(
  value: string | undefined
): McpCredentialStatus | undefined {
  const normalized = normalizeText(value);
  if (normalized === undefined) {
    return undefined;
  }

  if (
    normalized === "active" ||
    normalized === "revoked" ||
    normalized === "rotated" ||
    normalized === "unknown"
  ) {
    return normalized;
  }

  throw new McpRuntimeInputError(
    "CREDENTIAL_STATUS_UNSUPPORTED",
    "credentialStatus must be active, revoked, rotated, or unknown",
    {
      credentialStatus: normalized
    }
  );
}

function createRevocationDecision(
  credentialStatus: McpCredentialStatus
): McpRevocationEnforcementPlan["denial"]["decision"] {
  if (credentialStatus === "active") {
    return "allow_planned";
  }

  if (credentialStatus === "revoked") {
    return "deny_revoked";
  }

  if (credentialStatus === "rotated") {
    return "deny_rotated";
  }

  return "deny_unknown";
}

function normalizeMcpMethod(value: string | undefined): McpMethod | undefined {
  return MCP_SUPPORTED_METHODS.includes(value as McpMethod)
    ? (value as McpMethod)
    : undefined;
}

function normalizeMcpClientMaturityFeature(
  value: string | undefined
): McpClientMaturityFeature | undefined {
  const normalized = normalizeSlug(value);
  return MCP_CLIENT_MATURITY_FEATURES.includes(normalized as McpClientMaturityFeature)
    ? (normalized as McpClientMaturityFeature)
    : undefined;
}

function normalizeMcpClientMaturityTargetClient(
  value: string | undefined
): McpClientMaturityTargetClient | undefined {
  const normalized = normalizeSlug(value);
  return MCP_CLIENT_MATURITY_TARGET_CLIENTS.includes(
    normalized as McpClientMaturityTargetClient
  )
    ? (normalized as McpClientMaturityTargetClient)
    : undefined;
}

function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function normalizeSlug(value: string | undefined): string | undefined {
  const normalized = normalizeText(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/gu, (_, character: string) => character.toUpperCase());
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
