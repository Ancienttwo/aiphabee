import type { AiphaBeeErrorCode, ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";
import {
  createServingReadPlan,
  type ServingReadPlan
} from "@aiphabee/serving-store";

export const DATA_ACCESS_GATEWAY_VERSION =
  "2026-06-20.phase1.quality-release-isolation.v0";

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

export interface DataAccessRequest {
  channel: DataAccessChannel;
  dataset: string;
  exportRequested?: boolean;
  plan: string;
  qualityState: DataQualityState;
  requestedFields: string[];
  requestedRows: number;
  timeRange?: {
    from: string;
    to: string;
  };
  workspaceId?: string;
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
  servingRead: ServingReadPlan;
  status: DataAccessDecisionStatus;
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
  const warnings = getWarnings(request.qualityState, fieldDecision.deniedFields);

  return {
    allowedFields: finalAllowedFields,
    cacheKey: createDataAccessCacheKey(request, policy, fieldDecision.allowedFields),
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
    provenance: [
      {
        data_version: "gateway-scaffold-v0",
        methodology_version: policy.methodologyVersion,
        source: "data-access-gateway",
        source_record_id: "policy-evaluation"
      }
    ],
    qualityState: request.qualityState,
    rightsPolicyVersion: policy.rightsPolicyVersion,
    servingRead,
    status: finalStatus,
    usage: {
      cached: false,
      credits: servedRows > 0 ? 1 : 0,
      rows: servedRows
    },
    warnings
  };
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
  return policy.fieldPolicies.find(
    (policyEntry) =>
      policyEntry.channel === request.channel &&
      policyEntry.field === field &&
      (policyEntry.dataset === undefined || policyEntry.dataset === request.dataset) &&
      (policyEntry.plan === undefined || policyEntry.plan === request.plan)
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
      entitlement.plan === request.plan &&
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
