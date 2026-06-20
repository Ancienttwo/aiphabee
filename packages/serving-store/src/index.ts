export const SERVING_STORE_READ_VERSION =
  "2026-06-20.phase1.serving-read-scaffold.v0";

export type ServingQualityState = "HOLD" | "PASS" | "REJECT_RAW" | "WARN";
export type ServingReadGatewayStatus =
  | "allow"
  | "allow_with_redactions"
  | "deny"
  | "quality_hold";
export type ServingReadPlanStatus =
  | "blocked_by_gateway"
  | "quality_hold"
  | "read_planned";

export interface ServingReadPlanInput {
  allowedFields: string[];
  dataVersion: string;
  dataset: string;
  errorCode?: string;
  gatewayStatus: ServingReadGatewayStatus;
  maxRows: number;
  methodologyVersion: string;
  qualityState: ServingQualityState;
  requestedFields: string[];
  requestedRows: number;
  rightsPolicyVersion: string;
  timeRange?: {
    from: string;
    to: string;
  };
}

export interface ServingReadPlan {
  allowedFields: string[];
  blockedReason?: string;
  cacheKeyMaterial: {
    dataVersion: string;
    fieldSet: string[];
    methodologyVersion: string;
    rightsPolicyVersion: string;
    timeRange?: {
      from: string;
      to: string;
    };
  };
  dataset: string;
  liveRead: false;
  qualityState: ServingQualityState;
  releaseState: "held";
  requestedFields: string[];
  requestedRows: number;
  rowLimit: number;
  servedRows: 0;
  sqlEmitted: false;
  status: ServingReadPlanStatus;
  tables: readonly [
    "core.serving_dataset",
    "core.serving_field",
    "core.serving_snapshot",
    "core.serving_record"
  ];
  version: typeof SERVING_STORE_READ_VERSION;
}

export function createServingReadPlan(input: ServingReadPlanInput): ServingReadPlan {
  const allowedFields = normalizeFields(input.allowedFields);
  const status = getServingReadStatus(input, allowedFields);
  const blockedReason = getBlockedReason(input, status);

  return {
    allowedFields: status === "read_planned" ? allowedFields : [],
    blockedReason,
    cacheKeyMaterial: {
      dataVersion: input.dataVersion,
      fieldSet: status === "read_planned" ? allowedFields : [],
      methodologyVersion: input.methodologyVersion,
      rightsPolicyVersion: input.rightsPolicyVersion,
      timeRange: input.timeRange
    },
    dataset: input.dataset,
    liveRead: false,
    qualityState: input.qualityState,
    releaseState: "held",
    requestedFields: normalizeFields(input.requestedFields),
    requestedRows: input.requestedRows,
    rowLimit: input.maxRows,
    servedRows: 0,
    sqlEmitted: false,
    status,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ],
    version: SERVING_STORE_READ_VERSION
  };
}

export function getServingStoreReadCapabilities() {
  return {
    blocks_default_deny: true,
    blocks_quality_hold: true,
    live_reads: false,
    planner_version: SERVING_STORE_READ_VERSION,
    release_state_default: "held" as const,
    sql_emitted: false,
    status: "read_planner_scaffold" as const,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ] as const,
    uses_cache_key_material: [
      "data_version",
      "rights_policy_version",
      "methodology_version",
      "field_set",
      "time_range"
    ] as const,
    uses_quality_state: true,
    uses_versioned_snapshots: true
  };
}

function getServingReadStatus(
  input: ServingReadPlanInput,
  allowedFields: string[]
): ServingReadPlanStatus {
  if (
    input.gatewayStatus === "quality_hold" ||
    input.qualityState === "HOLD" ||
    input.qualityState === "REJECT_RAW"
  ) {
    return "quality_hold";
  }

  if (input.gatewayStatus === "deny" || allowedFields.length === 0) {
    return "blocked_by_gateway";
  }

  return "read_planned";
}

function getBlockedReason(
  input: ServingReadPlanInput,
  status: ServingReadPlanStatus
): string | undefined {
  if (status === "read_planned") {
    return undefined;
  }

  if (status === "quality_hold") {
    return "DATA_QUALITY_HOLD";
  }

  return input.errorCode ?? "DATA_NOT_LICENSED";
}

function normalizeFields(fields: string[]): string[] {
  return [...new Set(fields.filter((field) => field.length > 0))].sort();
}
