import {
  DEFAULT_DATA_ACCESS_POLICY,
  createRestrictedExportPlan,
  type DataAccessPolicy,
  type DataQualityState,
  type RestrictedExportPlan
} from "@aiphabee/data-access-gateway";
import {
  createAccountDataRequestPlan,
  getAccountDataRequestCapabilities,
  type AccountDataRequestCapabilities,
  type AccountDataRequestPlan
} from "@aiphabee/account-runtime";
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
  "aiphabee_core.private_share_link",
  "aiphabee_audit.private_share_event",
  "aiphabee_governance.private_sharing_contract"
] as const;
export const PRIVACY_SHARE_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.privacy-share-release-gate-scaffold.v0";
export const PRIVACY_SHARE_RELEASE_GATE_CHECKS = [
  "personal_data_download_delivery_is_scoped_and_no_write",
  "personal_data_delete_respects_retention_holds",
  "share_link_rechecks_recipient_entitlement",
  "share_link_effective_fields_are_intersection",
  "share_link_does_not_expand_rights",
  "private_link_has_expiry_watermark_and_no_public_index"
] as const;
export const PRIVACY_SHARE_RELEASE_GATE_TABLES = [
  "aiphabee_core.privacy_share_release_gate",
  "aiphabee_governance.privacy_share_release_gate_contract"
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
    table: "aiphabee_audit.private_share_event";
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

export interface PrivacyShareReleaseGatePlanInput {
  accountId?: string;
  asOf?: string;
  creatorAccountId?: string;
  creatorPlan?: string;
  creatorScopes?: string[];
  creatorWorkspaceId?: string;
  dataset?: string;
  expiresInHours?: number;
  fields?: string[];
  recipientAccountId?: string;
  recipientPlan?: string;
  recipientScopes?: string[];
  recipientWorkspaceId?: string;
  requestId: string;
  requestedAt?: string;
  requestedRows?: number;
  requestScopes?: string[];
  retentionPolicyVersion?: string;
  runId?: string;
  timeRange?: {
    from: string;
    to: string;
  };
  verifiedBy?: string;
  workspaceId?: string;
}

export interface PrivacyShareReleaseGateCapabilities {
  account_data_request_route: "POST /account/data-requests/plan";
  account_data_runtime_route: "GET /account/runtime";
  account_data_secure_delivery_required: true;
  frontend: false;
  live_data_access: false;
  live_data_export: false;
  live_db_writes: false;
  package: "@aiphabee/sharing-runtime";
  persistent_writes: false;
  private_share_route: "POST /sharing/private-links/plan";
  recipient_data_rights_expansion: false;
  recipient_entitlement_recheck: true;
  required_checks: typeof PRIVACY_SHARE_RELEASE_GATE_CHECKS;
  route: "POST /sharing/release-gates/privacy-share/plan";
  runtime_route: "GET /sharing/runtime";
  share_expands_recipient_rights: false;
  sql_emitted: false;
  status: "privacy_share_release_gate_scaffold";
  tables: typeof PRIVACY_SHARE_RELEASE_GATE_TABLES;
  version: typeof PRIVACY_SHARE_RELEASE_GATE_VERSION;
  watermark_required: true;
}

export interface PrivacyShareReleaseGatePlan {
  account_data_request_gate: {
    capability: AccountDataRequestCapabilities;
    delete_plan: AccountDataRequestPlan;
    download_plan: AccountDataRequestPlan;
    retention_controls: {
      delete_allowed_scopes: readonly string[];
      download_secure_delivery_required: boolean;
      retention_hold_scopes: readonly string[];
      retained_for_audit_scopes: string[];
      unsupported_scopes_blocked: boolean;
    };
  };
  capability: PrivacyShareReleaseGateCapabilities;
  frontend: false;
  live_data_access: false;
  live_data_export: false;
  live_db_writes: false;
  persistent_writes: false;
  private_share_gate: {
    capability: ReturnType<typeof getPrivateSharingCapabilities>;
    no_expansion_policy: {
      effective_fields: string[];
      recipient_allowed_fields: string[];
      recipient_data_rights_expansion: false;
      recipient_entitlement_rechecked: true;
      redacted_fields: string[];
      requested_fields: string[];
      share_expands_recipient_rights: false;
    };
    plan: PrivateShareLinkPlan;
  };
  release_checks: Array<{
    check: (typeof PRIVACY_SHARE_RELEASE_GATE_CHECKS)[number];
    evidence: string;
    status: "planned_no_write";
  }>;
  release_gate: {
    blockers: readonly [
      "live_privacy_delivery_job_missing",
      "live_retention_policy_source_missing",
      "live_share_handle_generation_missing",
      "external_privacy_legal_signoff_missing",
      "frontend_privacy_share_release_ui_missing"
    ];
    gate_status: "blocked_live_privacy_share_validation";
    no_live_release_claim: true;
    required_signoffs: readonly ["security", "privacy", "data_governance", "legal"];
  };
  request_id: string;
  route: "POST /sharing/release-gates/privacy-share/plan";
  sql_emitted: false;
  status: "planned_no_write";
  tables: typeof PRIVACY_SHARE_RELEASE_GATE_TABLES;
  validation: {
    all_checks_passed: boolean;
    live_release_claimed: false;
    personal_data_delete_respects_retention_holds: boolean;
    personal_data_download_delivery_is_scoped_and_no_write: boolean;
    private_link_has_expiry_watermark_and_no_public_index: boolean;
    share_link_does_not_expand_rights: boolean;
    share_link_effective_fields_are_intersection: boolean;
    share_link_rechecks_recipient_entitlement: boolean;
  };
  version: typeof PRIVACY_SHARE_RELEASE_GATE_VERSION;
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

export function getPrivacyShareReleaseGateCapabilities(): PrivacyShareReleaseGateCapabilities {
  return {
    account_data_request_route: "POST /account/data-requests/plan",
    account_data_runtime_route: "GET /account/runtime",
    account_data_secure_delivery_required: true,
    frontend: false,
    live_data_access: false,
    live_data_export: false,
    live_db_writes: false,
    package: "@aiphabee/sharing-runtime",
    persistent_writes: false,
    private_share_route: "POST /sharing/private-links/plan",
    recipient_data_rights_expansion: false,
    recipient_entitlement_recheck: true,
    required_checks: PRIVACY_SHARE_RELEASE_GATE_CHECKS,
    route: "POST /sharing/release-gates/privacy-share/plan",
    runtime_route: "GET /sharing/runtime",
    share_expands_recipient_rights: false,
    sql_emitted: false,
    status: "privacy_share_release_gate_scaffold",
    tables: PRIVACY_SHARE_RELEASE_GATE_TABLES,
    version: PRIVACY_SHARE_RELEASE_GATE_VERSION,
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
      table: "aiphabee_audit.private_share_event",
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

export function createPrivacyShareReleaseGatePlan(
  input: PrivacyShareReleaseGatePlanInput
): PrivacyShareReleaseGatePlan {
  const requestId = normalizeText(input.requestId) ?? "request_unattributed";
  const asOf = normalizeAsOf(input.asOf ?? input.requestedAt);
  const accountId =
    normalizeText(input.accountId ?? input.creatorAccountId) ?? "acct_privacy_owner";
  const workspaceId =
    normalizeText(input.workspaceId ?? input.creatorWorkspaceId) ?? "ws_privacy_owner";
  const creatorAccountId = normalizeText(input.creatorAccountId) ?? accountId;
  const creatorWorkspaceId = normalizeText(input.creatorWorkspaceId) ?? workspaceId;
  const recipientAccountId = normalizeText(input.recipientAccountId) ?? "acct_privacy_recipient";
  const recipientWorkspaceId =
    normalizeText(input.recipientWorkspaceId) ?? "ws_privacy_recipient";
  const retentionPolicyVersion =
    normalizeText(input.retentionPolicyVersion) ?? "retention-policy-scaffold-v0";
  const requestedScopes = normalizeStringList(input.requestScopes, [
    "account_profile",
    "authorized_memory",
    "subscription_billing",
    "usage_ledger",
    "audit_log"
  ]);
  const requestedFields = normalizeFields(
    input.fields ?? ["synthetic_profile.company_name", "synthetic_profile.revenue"]
  );
  const creatorScopes = normalizeStringList(input.creatorScopes, [PRIVATE_SHARING_REQUIRED_SCOPE]);
  const recipientScopes = normalizeStringList(input.recipientScopes, [
    PRIVATE_SHARING_REQUIRED_SCOPE
  ]);
  const sharePolicy = createSyntheticPrivateSharePolicy(creatorWorkspaceId, recipientWorkspaceId);
  const downloadPlan = createAccountDataRequestPlan({
    accountId,
    action: "download",
    requestedAt: asOf,
    requestId: `${requestId}:personal-data-download`,
    requestScopes: requestedScopes,
    retentionPolicyVersion,
    verifiedBy: input.verifiedBy,
    workspaceId
  });
  const deletePlan = createAccountDataRequestPlan({
    accountId,
    action: "delete",
    requestedAt: asOf,
    requestId: `${requestId}:personal-data-delete`,
    requestScopes: requestedScopes,
    retentionPolicyVersion,
    verifiedBy: input.verifiedBy,
    workspaceId
  });
  const sharePlan = createPrivateShareLinkPlan(
    {
      asOf,
      creatorAccountId,
      creatorPlan: input.creatorPlan,
      creatorScopes,
      creatorWorkspaceId,
      dataset: input.dataset,
      expiresInHours: input.expiresInHours ?? 24,
      fields: requestedFields,
      recipientAccountId,
      recipientPlan: input.recipientPlan,
      recipientScopes,
      recipientWorkspaceId,
      requestId: `${requestId}:private-share-no-expansion`,
      requestedRows: input.requestedRows ?? 1,
      runId: input.runId,
      timeRange: input.timeRange
    },
    sharePolicy
  );
  const retainedForAuditScopes = deletePlan.execution_plan
    .filter((step) => step.action === "retain")
    .map((step) => step.scope);
  const expectedEffectiveFields = sharePlan.access_policy.creator_allowed_fields.filter((field) =>
    sharePlan.access_policy.recipient_allowed_fields.includes(field)
  );
  const validation = {
    personal_data_download_delivery_is_scoped_and_no_write:
      downloadPlan.status === "planned_no_write" &&
      downloadPlan.persistent_writes === false &&
      downloadPlan.sql_emitted === false &&
      downloadPlan.delivery.secure_delivery_required &&
      downloadPlan.delivery.download_status === "planned_no_write" &&
      downloadPlan.request.scopes.length > 0 &&
      downloadPlan.request.unsupported_scopes.length === 0,
    personal_data_delete_respects_retention_holds:
      deletePlan.status === "planned_no_write" &&
      deletePlan.persistent_writes === false &&
      deletePlan.sql_emitted === false &&
      deletePlan.request.unsupported_scopes.length === 0 &&
      deletePlan.retention_policy.retention_hold_scopes.every(
        (scope) => !deletePlan.request.scopes.includes(scope) || retainedForAuditScopes.includes(scope)
      ),
    share_link_rechecks_recipient_entitlement:
      sharePlan.access_policy.recipient_entitlement_rechecked === true &&
      sharePlan.gateway_decisions.recipient.status === "planned_no_write",
    share_link_effective_fields_are_intersection:
      arraysEqual(sharePlan.access_policy.effective_fields, expectedEffectiveFields) &&
      sharePlan.access_policy.redacted_fields.every(
        (field) => !sharePlan.access_policy.effective_fields.includes(field)
      ),
    share_link_does_not_expand_rights:
      sharePlan.access_policy.share_expands_recipient_rights === false &&
      sharePlan.access_policy.recipient_data_rights_expansion === false,
    private_link_has_expiry_watermark_and_no_public_index:
      sharePlan.validation.expiry_within_limit &&
      sharePlan.watermark.required === true &&
      sharePlan.link.link_handle_materialized === false &&
      sharePlan.link.public_indexing === false &&
      sharePlan.persistent_writes === false
  };
  const allChecksPassed = Object.values(validation).every(Boolean);
  const releaseChecks = PRIVACY_SHARE_RELEASE_GATE_CHECKS.map((check) => ({
    check,
    evidence:
      check === "personal_data_download_delivery_is_scoped_and_no_write"
        ? "account data download planner returns secure JSON delivery, scoped request items, no SQL, and planned_no_write"
        : check === "personal_data_delete_respects_retention_holds"
          ? "account data delete planner retains subscription_billing, usage_ledger, and audit_log under retention policy"
          : check === "share_link_rechecks_recipient_entitlement"
            ? "private share planner runs a recipient Data Gateway export check before link materialization"
            : check === "share_link_effective_fields_are_intersection"
              ? "private share effective fields equal creator and recipient allowed-field intersection"
              : check === "share_link_does_not_expand_rights"
                ? "private share access policy keeps recipient_data_rights_expansion=false and share_expands_recipient_rights=false"
                : "private share plan requires expiry, watermark, private visibility, no public indexing, and no link handle materialization",
    status: "planned_no_write" as const
  }));

  return {
    account_data_request_gate: {
      capability: getAccountDataRequestCapabilities(),
      delete_plan: deletePlan,
      download_plan: downloadPlan,
      retention_controls: {
        delete_allowed_scopes: deletePlan.retention_policy.delete_allowed_scopes,
        download_secure_delivery_required: downloadPlan.delivery.secure_delivery_required,
        retention_hold_scopes: deletePlan.retention_policy.retention_hold_scopes,
        retained_for_audit_scopes: retainedForAuditScopes,
        unsupported_scopes_blocked:
          downloadPlan.request.unsupported_scopes.length === 0 &&
          deletePlan.request.unsupported_scopes.length === 0
      }
    },
    capability: getPrivacyShareReleaseGateCapabilities(),
    frontend: false,
    live_data_access: false,
    live_data_export: false,
    live_db_writes: false,
    persistent_writes: false,
    private_share_gate: {
      capability: getPrivateSharingCapabilities(),
      no_expansion_policy: {
        effective_fields: sharePlan.access_policy.effective_fields,
        recipient_allowed_fields: sharePlan.access_policy.recipient_allowed_fields,
        recipient_data_rights_expansion: false,
        recipient_entitlement_rechecked: true,
        redacted_fields: sharePlan.access_policy.redacted_fields,
        requested_fields: sharePlan.access_policy.requested_fields,
        share_expands_recipient_rights: false
      },
      plan: sharePlan
    },
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_privacy_delivery_job_missing",
        "live_retention_policy_source_missing",
        "live_share_handle_generation_missing",
        "external_privacy_legal_signoff_missing",
        "frontend_privacy_share_release_ui_missing"
      ],
      gate_status: "blocked_live_privacy_share_validation",
      no_live_release_claim: true,
      required_signoffs: ["security", "privacy", "data_governance", "legal"]
    },
    request_id: requestId,
    route: "POST /sharing/release-gates/privacy-share/plan",
    sql_emitted: false,
    status: "planned_no_write",
    tables: PRIVACY_SHARE_RELEASE_GATE_TABLES,
    validation: {
      ...validation,
      all_checks_passed: allChecksPassed,
      live_release_claimed: false
    },
    version: PRIVACY_SHARE_RELEASE_GATE_VERSION
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

function normalizeStringList(values: string[] | undefined, fallback: string[]): string[] {
  const normalized = (values ?? fallback)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return [...new Set(normalized)];
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => right[index] === value);
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
