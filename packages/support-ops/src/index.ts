export const SUPPORT_OPERATIONS_VERSION =
  "2026-06-21.phase3.support-request-id-investigation-scaffold.v0";

export const SUPPORT_HELP_TOPIC_CODES = [
  "account_billing",
  "mcp_connection",
  "data_quality",
  "usage_quota",
  "privacy_account",
  "incident_status"
] as const;

export const SUPPORT_INVESTIGATION_ALLOWED_FIELDS = [
  "request_id",
  "route",
  "tool_name",
  "dataset",
  "data_version",
  "methodology_version",
  "error_code",
  "usage_credits",
  "usage_rows",
  "usage_event_id",
  "ledger_entry_id",
  "invoice_line_id",
  "status_component",
  "as_of"
] as const;

export const SUPPORT_INVESTIGATION_FORBIDDEN_FIELDS = [
  "raw_prompt",
  "generated_answer",
  "raw_email",
  "password",
  "oauth_access_token",
  "oauth_refresh_token",
  "session_secret",
  "api_key_material",
  "payment_method",
  "portfolio_holdings",
  "document_body",
  "personal_contact_detail"
] as const;

export type SupportHelpTopicCode = (typeof SUPPORT_HELP_TOPIC_CODES)[number];
export type SupportInvestigationAllowedField =
  (typeof SUPPORT_INVESTIGATION_ALLOWED_FIELDS)[number];
export type SupportInvestigationForbiddenField =
  (typeof SUPPORT_INVESTIGATION_FORBIDDEN_FIELDS)[number];
export type SupportInvestigationPlanStatus =
  | "blocked_missing_context"
  | "blocked_sensitive_content_request"
  | "planned_no_write";

export interface SupportOperationsCapabilities {
  default_sensitive_content_access: false;
  frontend: false;
  help_center_route: "GET /support/help-center";
  investigation_route: "POST /support/request-id-investigation/plan";
  live_billing_provider_reads: false;
  live_log_reads: false;
  package: "@aiphabee/support-ops";
  persistent_writes: false;
  request_id_required: true;
  route: "GET /support/runtime";
  sensitive_fields_forbidden_by_default: typeof SUPPORT_INVESTIGATION_FORBIDDEN_FIELDS;
  sql_emitted: false;
  status: "support_request_id_investigation_scaffold";
  support_agent_required: true;
  support_help_topics: typeof SUPPORT_HELP_TOPIC_CODES;
  support_lookup_fields: typeof SUPPORT_INVESTIGATION_ALLOWED_FIELDS;
  tables: readonly [
    "aiphabee_core.support_ticket",
    "aiphabee_audit.support_investigation_event",
    "aiphabee_governance.support_request_id_contract"
  ];
  version: typeof SUPPORT_OPERATIONS_VERSION;
}

export interface SupportHelpTopic {
  doc_path: "docs/public/help-center.md";
  escalation_path: "POST /support/request-id-investigation/plan";
  request_id_recommended: boolean;
  topic_code: SupportHelpTopicCode;
  title: string;
}

export interface SupportHelpCenter {
  doc_path: "docs/public/help-center.md";
  help_topics: readonly [
    SupportHelpTopic,
    SupportHelpTopic,
    SupportHelpTopic,
    SupportHelpTopic,
    SupportHelpTopic,
    SupportHelpTopic
  ];
  live_chat_enabled: false;
  persistent_writes: false;
  request_id_visible: true;
  route: "GET /support/help-center";
  sql_emitted: false;
  status: "planned_no_write";
  version: typeof SUPPORT_OPERATIONS_VERSION;
}

export interface SupportRequestIdInvestigationPlanInput {
  category?: string;
  includeSensitiveContent?: boolean;
  reason?: string;
  requestId: string;
  supportAgentId?: string;
  targetRequestId?: string;
  workspaceId?: string;
}

export interface SupportRequestIdInvestigationPlan {
  audit: {
    audit_event: "support.request_id_investigation.plan";
    audit_event_ref: string;
    support_agent_id: string;
    table: "aiphabee_audit.support_investigation_event";
    write_status: "planned_no_write";
  };
  help_center: {
    category: SupportHelpTopicCode;
    doc_path: "docs/public/help-center.md";
    route: "GET /support/help-center";
  };
  investigation: {
    allowed_lookup_fields: readonly SupportInvestigationAllowedField[];
    billing_trace: {
      invoice_line_id: string;
      ledger_entry_id: string;
      request_id_join: true;
      usage_event_id: string;
    };
    live_billing_provider_reads: false;
    live_log_reads: false;
    planned_sources: readonly [
      "standard_response_envelope",
      "mcp_error_detail",
      "usage_ledger_event",
      "usage_billing_reconciliation",
      "public_status_component"
    ];
    target_request_id: string;
  };
  persistent_writes: false;
  privacy: {
    default_sensitive_content_access: false;
    forbidden_fields: typeof SUPPORT_INVESTIGATION_FORBIDDEN_FIELDS;
    include_sensitive_content_requested: boolean;
    sensitive_content_released: false;
  };
  request_id: string;
  request_id_visible: true;
  sql_emitted: false;
  status: SupportInvestigationPlanStatus;
  support_ticket: {
    reason: string;
    support_ticket_ref: string;
    table: "aiphabee_core.support_ticket";
    ticket_status: "blocked" | "planned_no_write";
    workspace_id: string;
  };
  tables: SupportOperationsCapabilities["tables"];
  validation: {
    required_context_present: boolean;
    sensitive_request_blocked: boolean;
    support_agent_required: true;
    target_request_id_required: true;
  };
  version: typeof SUPPORT_OPERATIONS_VERSION;
}

const SUPPORT_OPERATIONS_TABLES: SupportOperationsCapabilities["tables"] = [
  "aiphabee_core.support_ticket",
  "aiphabee_audit.support_investigation_event",
  "aiphabee_governance.support_request_id_contract"
];

const SUPPORT_HELP_TOPICS: SupportHelpCenter["help_topics"] = [
  {
    doc_path: "docs/public/help-center.md",
    escalation_path: "POST /support/request-id-investigation/plan",
    request_id_recommended: true,
    title: "Account and billing",
    topic_code: "account_billing"
  },
  {
    doc_path: "docs/public/help-center.md",
    escalation_path: "POST /support/request-id-investigation/plan",
    request_id_recommended: true,
    title: "MCP connection",
    topic_code: "mcp_connection"
  },
  {
    doc_path: "docs/public/help-center.md",
    escalation_path: "POST /support/request-id-investigation/plan",
    request_id_recommended: true,
    title: "Data quality",
    topic_code: "data_quality"
  },
  {
    doc_path: "docs/public/help-center.md",
    escalation_path: "POST /support/request-id-investigation/plan",
    request_id_recommended: true,
    title: "Usage and quota",
    topic_code: "usage_quota"
  },
  {
    doc_path: "docs/public/help-center.md",
    escalation_path: "POST /support/request-id-investigation/plan",
    request_id_recommended: false,
    title: "Privacy and account",
    topic_code: "privacy_account"
  },
  {
    doc_path: "docs/public/help-center.md",
    escalation_path: "POST /support/request-id-investigation/plan",
    request_id_recommended: true,
    title: "Incident status",
    topic_code: "incident_status"
  }
];

export function getSupportOperationsCapabilities(): SupportOperationsCapabilities {
  return {
    default_sensitive_content_access: false,
    frontend: false,
    help_center_route: "GET /support/help-center",
    investigation_route: "POST /support/request-id-investigation/plan",
    live_billing_provider_reads: false,
    live_log_reads: false,
    package: "@aiphabee/support-ops",
    persistent_writes: false,
    request_id_required: true,
    route: "GET /support/runtime",
    sensitive_fields_forbidden_by_default: SUPPORT_INVESTIGATION_FORBIDDEN_FIELDS,
    sql_emitted: false,
    status: "support_request_id_investigation_scaffold",
    support_agent_required: true,
    support_help_topics: SUPPORT_HELP_TOPIC_CODES,
    support_lookup_fields: SUPPORT_INVESTIGATION_ALLOWED_FIELDS,
    tables: SUPPORT_OPERATIONS_TABLES,
    version: SUPPORT_OPERATIONS_VERSION
  };
}

export function getSupportHelpCenter(): SupportHelpCenter {
  return {
    doc_path: "docs/public/help-center.md",
    help_topics: SUPPORT_HELP_TOPICS,
    live_chat_enabled: false,
    persistent_writes: false,
    request_id_visible: true,
    route: "GET /support/help-center",
    sql_emitted: false,
    status: "planned_no_write",
    version: SUPPORT_OPERATIONS_VERSION
  };
}

export function createSupportRequestIdInvestigationPlan(
  input: SupportRequestIdInvestigationPlanInput
): SupportRequestIdInvestigationPlan {
  const targetRequestId = normalizeIdentifier(input.targetRequestId, "request_unresolved");
  const supportAgentId = normalizeIdentifier(input.supportAgentId, "support_agent_unresolved");
  const workspaceId = normalizeIdentifier(input.workspaceId, "workspace_unresolved");
  const requiredContextPresent =
    input.targetRequestId !== undefined &&
    input.targetRequestId.length > 0 &&
    input.supportAgentId !== undefined &&
    input.supportAgentId.length > 0;
  const sensitiveRequestBlocked = input.includeSensitiveContent === true;
  const status: SupportInvestigationPlanStatus = sensitiveRequestBlocked
    ? "blocked_sensitive_content_request"
    : requiredContextPresent
      ? "planned_no_write"
      : "blocked_missing_context";
  const category = normalizeSupportHelpTopic(input.category);

  return {
    audit: {
      audit_event: "support.request_id_investigation.plan",
      audit_event_ref: `support_investigation_${sanitizeForId(input.requestId)}_${sanitizeForId(
        targetRequestId
      )}`,
      support_agent_id: supportAgentId,
      table: "aiphabee_audit.support_investigation_event",
      write_status: "planned_no_write"
    },
    help_center: {
      category,
      doc_path: "docs/public/help-center.md",
      route: "GET /support/help-center"
    },
    investigation: {
      allowed_lookup_fields: SUPPORT_INVESTIGATION_ALLOWED_FIELDS,
      billing_trace: {
        invoice_line_id: `invoice_line_${sanitizeForId(targetRequestId)}`,
        ledger_entry_id: `ledger_entry_${sanitizeForId(targetRequestId)}`,
        request_id_join: true,
        usage_event_id: `usage_event_${sanitizeForId(targetRequestId)}`
      },
      live_billing_provider_reads: false,
      live_log_reads: false,
      planned_sources: [
        "standard_response_envelope",
        "mcp_error_detail",
        "usage_ledger_event",
        "usage_billing_reconciliation",
        "public_status_component"
      ],
      target_request_id: targetRequestId
    },
    persistent_writes: false,
    privacy: {
      default_sensitive_content_access: false,
      forbidden_fields: SUPPORT_INVESTIGATION_FORBIDDEN_FIELDS,
      include_sensitive_content_requested: input.includeSensitiveContent === true,
      sensitive_content_released: false
    },
    request_id: input.requestId,
    request_id_visible: true,
    sql_emitted: false,
    status,
    support_ticket: {
      reason: normalizeIdentifier(input.reason, "reason_unresolved"),
      support_ticket_ref: `support_ticket_${sanitizeForId(targetRequestId)}`,
      table: "aiphabee_core.support_ticket",
      ticket_status: status === "planned_no_write" ? "planned_no_write" : "blocked",
      workspace_id: workspaceId
    },
    tables: SUPPORT_OPERATIONS_TABLES,
    validation: {
      required_context_present: requiredContextPresent,
      sensitive_request_blocked: sensitiveRequestBlocked,
      support_agent_required: true,
      target_request_id_required: true
    },
    version: SUPPORT_OPERATIONS_VERSION
  };
}

function normalizeSupportHelpTopic(value: string | undefined): SupportHelpTopicCode {
  return SUPPORT_HELP_TOPIC_CODES.includes(value as SupportHelpTopicCode)
    ? (value as SupportHelpTopicCode)
    : "usage_quota";
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  return value !== undefined && value.length > 0 ? value : fallback;
}

function sanitizeForId(value: string): string {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
  return sanitized.length > 0 ? sanitized : "unresolved";
}
