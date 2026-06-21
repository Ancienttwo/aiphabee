import {
  DEFAULT_DATA_ACCESS_POLICY,
  createRestrictedExportPlan,
  type DataAccessPolicy,
  type DataQualityState,
  type RestrictedExportPlan
} from "@aiphabee/data-access-gateway";
import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const PRIVATE_SHARING_VERSION =
  "2026-06-21.phase3.private-share-link-scaffold.v0";
export const PRIVATE_SHARING_REQUIRED_SCOPE = "exports.read";
export const PRIVATE_SHARE_DEFAULT_EXPIRY_HOURS = 72;
export const PRIVATE_SHARE_MAX_EXPIRY_HOURS = 168;
export const PRIVATE_SHARE_WATERMARK_FIELDS = [
  "request_id",
  "share_ref",
  "creator_workspace_id",
  "recipient_workspace_id",
  "dataset",
  "rights_policy_version",
  "as_of"
] as const;
export const PRIVATE_SHARE_TABLES = [
  "core.private_share_link",
  "audit.private_share_event",
  "governance.private_sharing_contract"
] as const;

export type PrivateShareLinkStatus =
  | "blocked_creator_gateway_denied"
  | "blocked_creator_missing_scope"
  | "blocked_invalid_expiry"
  | "blocked_missing_context"
  | "blocked_recipient_gateway_denied"
  | "blocked_recipient_missing_scope"
  | "planned_no_write";

export interface PrivateShareLinkPlanInput {
  asOf?: string;
  creatorAccountId?: string;
  creatorPlan?: string;
  creatorScopes?: string[];
  creatorWorkspaceId?: string;
  dataset?: string;
  expiresInHours?: number;
  fields?: string[];
  qualityState?: DataQualityState;
  recipientAccountId?: string;
  recipientPlan?: string;
  recipientScopes?: string[];
  recipientWorkspaceId?: string;
  requestId?: string;
  requestedRows?: number;
  runId?: string;
  timeRange?: {
    from: string;
    to: string;
  };
}

export interface PrivateShareGatewaySummary {
  allowed_fields: string[];
  denied_fields: Array<{
    field: string;
    reason: string;
  }>;
  error_code?: string;
  rights_policy_version: string;
  scope_granted: boolean;
  served_rows: number;
  status: RestrictedExportPlan["status"] | "not_evaluated";
}

export interface PrivateShareLinkPlan {
  access_policy: {
    creator_allowed_fields: string[];
    effective_fields: string[];
    recipient_allowed_fields: string[];
    recipient_entitlement_rechecked: true;
    recipient_rights_policy_version: string;
    recipient_data_rights_expansion: false;
    redacted_fields: string[];
    requested_fields: string[];
    release_state: "blocked" | "planned_private_share";
    share_expands_recipient_rights: false;
  };
  audit: {
    event_kind: "sharing.private_link.plan";
    table: "audit.private_share_event";
    write_status: "planned_no_write";
  };
  data_version: "private-sharing-scaffold-v0";
  dataset: string;
  expires_at: string;
  frontend: false;
  gateway_decisions: {
    creator: PrivateShareGatewaySummary;
    recipient: PrivateShareGatewaySummary;
  };
  link: {
    link_handle_materialized: false;
    public_indexing: false;
    share_ref: "planned_no_write";
    url: "not_generated";
    visibility: "private_link";
  };
  live_data_access: false;
  methodology_version: typeof PRIVATE_SHARING_VERSION;
  persistent_writes: false;
  provenance: ProvenanceRef[];
  request_id: string;
  requested_rows: number;
  scope: {
    creator: {
      granted: boolean;
      required: typeof PRIVATE_SHARING_REQUIRED_SCOPE;
    };
    recipient: {
      granted: boolean;
      required: typeof PRIVATE_SHARING_REQUIRED_SCOPE;
    };
  };
  sql_emitted: false;
  status: PrivateShareLinkStatus;
  tables: typeof PRIVATE_SHARE_TABLES;
  toolName: "private_share_link_plan";
  usage: UsageSummary;
  validation: {
    expiry_within_limit: boolean;
    required_context_present: boolean;
  };
  version: typeof PRIVATE_SHARING_VERSION;
  watermark: {
    fields: typeof PRIVATE_SHARE_WATERMARK_FIELDS;
    required: true;
    text: string;
  };
}

export function getPrivateSharingCapabilities() {
  return {
    artifact_writes: false,
    capability_name: "private_sharing_links",
    data_version: "private-sharing-scaffold-v0",
    frontend: false,
    link_handle_materialized: false,
    live_data_access: false,
    max_expires_in_hours: PRIVATE_SHARE_MAX_EXPIRY_HOURS,
    persistent_writes: false,
    public_indexing: false,
    recipient_data_rights_expansion: false,
    recipient_entitlement_recheck: true,
    required_scope: PRIVATE_SHARING_REQUIRED_SCOPE,
    required_watermark_fields: PRIVATE_SHARE_WATERMARK_FIELDS,
    route: "POST /sharing/private-links/plan",
    runtime_route: "GET /sharing/runtime",
    status: "private_share_link_scaffold" as const,
    supported_statuses: [
      "planned_no_write",
      "blocked_missing_context",
      "blocked_invalid_expiry",
      "blocked_creator_missing_scope",
      "blocked_recipient_missing_scope",
      "blocked_creator_gateway_denied",
      "blocked_recipient_gateway_denied"
    ] satisfies PrivateShareLinkStatus[],
    tables: PRIVATE_SHARE_TABLES,
    uses_data_access_gateway: true,
    version: PRIVATE_SHARING_VERSION,
    watermark_required: true
  };
}

export function createPrivateShareLinkPlan(
  input: PrivateShareLinkPlanInput,
  policy: DataAccessPolicy = createSyntheticPrivateSharePolicy(
    input.creatorWorkspaceId,
    input.recipientWorkspaceId
  )
): PrivateShareLinkPlan {
  const requestId = normalizeText(input.requestId) ?? "request_unattributed";
  const asOf = normalizeAsOf(input.asOf);
  const dataset = normalizeText(input.dataset) ?? "synthetic_profile";
  const requestedFields = normalizeFields(input.fields);
  const requestedRows = normalizePositiveInteger(input.requestedRows) ?? 1;
  const expiresInHours = input.expiresInHours ?? PRIVATE_SHARE_DEFAULT_EXPIRY_HOURS;
  const expiryWithinLimit =
    Number.isFinite(expiresInHours) &&
    expiresInHours > 0 &&
    expiresInHours <= PRIVATE_SHARE_MAX_EXPIRY_HOURS;
  const requiredContextPresent =
    normalizeText(input.creatorAccountId) !== undefined &&
    normalizeText(input.creatorWorkspaceId) !== undefined &&
    normalizeText(input.recipientAccountId) !== undefined &&
    normalizeText(input.recipientWorkspaceId) !== undefined;
  const creatorScopeGranted = (input.creatorScopes ?? []).includes(PRIVATE_SHARING_REQUIRED_SCOPE);
  const recipientScopeGranted = (input.recipientScopes ?? []).includes(
    PRIVATE_SHARING_REQUIRED_SCOPE
  );
  const creatorPlan =
    requiredContextPresent && expiryWithinLimit
      ? createRestrictedExportPlan(
          {
            accountId: input.creatorAccountId,
            dataset,
            fields: requestedFields,
            format: "pdf",
            plan: normalizeText(input.creatorPlan) ?? "pro",
            qualityState: input.qualityState ?? "PASS",
            requestId,
            requestedRows,
            runId: input.runId,
            scopes: input.creatorScopes ?? [],
            timeRange: input.timeRange,
            workspaceId: input.creatorWorkspaceId
          },
          policy
        )
      : undefined;
  const recipientPlan =
    requiredContextPresent && expiryWithinLimit
      ? createRestrictedExportPlan(
          {
            accountId: input.recipientAccountId,
            dataset,
            fields: requestedFields,
            format: "pdf",
            plan: normalizeText(input.recipientPlan) ?? "pro",
            qualityState: input.qualityState ?? "PASS",
            requestId,
            requestedRows,
            runId: input.runId,
            scopes: input.recipientScopes ?? [],
            timeRange: input.timeRange,
            workspaceId: input.recipientWorkspaceId
          },
          policy
        )
      : undefined;
  const creatorAllowedFields = creatorPlan?.gateway_decision?.allowed_fields ?? [];
  const recipientAllowedFields = recipientPlan?.gateway_decision?.allowed_fields ?? [];
  const effectiveFields = creatorAllowedFields.filter((field) =>
    recipientAllowedFields.includes(field)
  );
  const redactedFields = requestedFields.filter((field) => !effectiveFields.includes(field));
  const status = getPrivateShareStatus({
    creatorPlan,
    creatorScopeGranted,
    effectiveFields,
    expiryWithinLimit,
    recipientPlan,
    recipientScopeGranted,
    requiredContextPresent
  });
  const releaseState = status === "planned_no_write" ? "planned_private_share" : "blocked";
  const recipientRightsPolicyVersion =
    recipientPlan?.gateway_decision?.rights_policy_version ?? policy.rightsPolicyVersion;
  const usage: UsageSummary = {
    cached: false,
    credits: 0,
    rows: status === "planned_no_write" ? effectiveFields.length : 0
  };
  const provenance = createProvenance(policy.rightsPolicyVersion);
  const expiresAt = expiryWithinLimit
    ? new Date(new Date(asOf).getTime() + expiresInHours * 60 * 60 * 1000).toISOString()
    : asOf;

  return {
    access_policy: {
      creator_allowed_fields: creatorAllowedFields,
      effective_fields: effectiveFields,
      recipient_allowed_fields: recipientAllowedFields,
      recipient_entitlement_rechecked: true,
      recipient_rights_policy_version: recipientRightsPolicyVersion,
      recipient_data_rights_expansion: false,
      redacted_fields: redactedFields,
      requested_fields: requestedFields,
      release_state: releaseState,
      share_expands_recipient_rights: false
    },
    audit: {
      event_kind: "sharing.private_link.plan",
      table: "audit.private_share_event",
      write_status: "planned_no_write"
    },
    data_version: "private-sharing-scaffold-v0",
    dataset,
    expires_at: expiresAt,
    frontend: false,
    gateway_decisions: {
      creator: summarizeGatewayPlan(creatorPlan, creatorScopeGranted, policy),
      recipient: summarizeGatewayPlan(recipientPlan, recipientScopeGranted, policy)
    },
    link: {
      link_handle_materialized: false,
      public_indexing: false,
      share_ref: "planned_no_write",
      url: "not_generated",
      visibility: "private_link"
    },
    live_data_access: false,
    methodology_version: PRIVATE_SHARING_VERSION,
    persistent_writes: false,
    provenance,
    request_id: requestId,
    requested_rows: requestedRows,
    scope: {
      creator: {
        granted: creatorScopeGranted,
        required: PRIVATE_SHARING_REQUIRED_SCOPE
      },
      recipient: {
        granted: recipientScopeGranted,
        required: PRIVATE_SHARING_REQUIRED_SCOPE
      }
    },
    sql_emitted: false,
    status,
    tables: PRIVATE_SHARE_TABLES,
    toolName: "private_share_link_plan",
    usage,
    validation: {
      expiry_within_limit: expiryWithinLimit,
      required_context_present: requiredContextPresent
    },
    version: PRIVATE_SHARING_VERSION,
    watermark: {
      fields: PRIVATE_SHARE_WATERMARK_FIELDS,
      required: true,
      text: [
        `request_id=${requestId}`,
        "share_ref=planned_no_write",
        `creator_workspace_id=${input.creatorWorkspaceId ?? "missing"}`,
        `recipient_workspace_id=${input.recipientWorkspaceId ?? "missing"}`,
        `dataset=${dataset}`,
        `rights_policy_version=${recipientRightsPolicyVersion}`,
        `as_of=${asOf}`
      ].join(";")
    }
  };
}

export function createSyntheticPrivateSharePolicy(
  creatorWorkspaceId = "ws_synthetic_share_creator",
  recipientWorkspaceId = "ws_synthetic_share_recipient"
): DataAccessPolicy {
  return {
    ...DEFAULT_DATA_ACCESS_POLICY,
    channels: {
      ...DEFAULT_DATA_ACCESS_POLICY.channels,
      export: "approved"
    },
    entitlementPolicies: [creatorWorkspaceId, recipientWorkspaceId].map((workspaceId) => ({
      channel: "export",
      dataset: "synthetic_profile",
      exportAllowed: true,
      fieldPattern: "synthetic_profile.company_name",
      maxWindowDays: 31,
      plan: "pro",
      status: "approved",
      workspaceId
    })),
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
    rightsPolicyVersion: "synthetic-private-share-policy-v0"
  };
}

function getPrivateShareStatus(input: {
  creatorPlan?: RestrictedExportPlan;
  creatorScopeGranted: boolean;
  effectiveFields: string[];
  expiryWithinLimit: boolean;
  recipientPlan?: RestrictedExportPlan;
  recipientScopeGranted: boolean;
  requiredContextPresent: boolean;
}): PrivateShareLinkStatus {
  if (!input.requiredContextPresent) {
    return "blocked_missing_context";
  }

  if (!input.expiryWithinLimit) {
    return "blocked_invalid_expiry";
  }

  if (!input.creatorScopeGranted) {
    return "blocked_creator_missing_scope";
  }

  if (!input.recipientScopeGranted) {
    return "blocked_recipient_missing_scope";
  }

  if (input.creatorPlan?.status !== "planned_no_write") {
    return "blocked_creator_gateway_denied";
  }

  if (input.recipientPlan?.status !== "planned_no_write" || input.effectiveFields.length === 0) {
    return "blocked_recipient_gateway_denied";
  }

  return "planned_no_write";
}

function summarizeGatewayPlan(
  plan: RestrictedExportPlan | undefined,
  scopeGranted: boolean,
  policy: DataAccessPolicy
): PrivateShareGatewaySummary {
  if (plan === undefined) {
    return {
      allowed_fields: [],
      denied_fields: [],
      rights_policy_version: policy.rightsPolicyVersion,
      scope_granted: scopeGranted,
      served_rows: 0,
      status: "not_evaluated"
    };
  }

  return {
    allowed_fields: plan.gateway_decision?.allowed_fields ?? [],
    denied_fields: (plan.gateway_decision?.denied_fields ?? []).map((field) => ({
      field: field.field,
      reason: field.reason
    })),
    error_code: plan.gateway_decision?.error_code,
    rights_policy_version:
      plan.gateway_decision?.rights_policy_version ?? policy.rightsPolicyVersion,
    scope_granted: plan.scope.granted,
    served_rows: plan.row_policy.served_rows,
    status: plan.status
  };
}

function normalizeFields(fields: string[] | undefined): string[] {
  const normalized = (fields ?? ["synthetic_profile.company_name"])
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  return [...new Set(normalized)].sort();
}

function normalizeText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizePositiveInteger(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function normalizeAsOf(value: string | undefined): string {
  if (value !== undefined) {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return "1970-01-01T00:00:00.000Z";
}

function createProvenance(rightsPolicyVersion: string): ProvenanceRef[] {
  return [
    {
      data_version: "private-sharing-scaffold-v0",
      methodology_version: PRIVATE_SHARING_VERSION,
      source: "sharing-runtime",
      source_record_id: "private-share-link-plan"
    },
    {
      data_version: rightsPolicyVersion,
      methodology_version: PRIVATE_SHARING_VERSION,
      source: "data-access-gateway",
      source_record_id: "recipient-entitlement-recheck"
    }
  ];
}
