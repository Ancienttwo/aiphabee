export const SERVING_STORE_READ_VERSION =
  "2026-06-20.phase1.serving-read-scaffold.v0";
export const SERVING_STORE_QUALITY_RELEASE_VERSION =
  "2026-06-20.phase1.quality-release-isolation.v0";
export const SERVING_STORE_QUERY_PLAN_VERSION =
  "2026-06-20.phase1.live-serving-query-planner-scaffold.v0";

export type ServingQualityState = "HOLD" | "PASS" | "REJECT_RAW" | "WARN";
export type ServingReleaseState = "held" | "released" | "withdrawn";
export type ServingReadGatewayStatus =
  | "allow"
  | "allow_with_redactions"
  | "deny"
  | "quality_hold";
export type ServingReadPlanStatus =
  | "blocked_by_gateway"
  | "quality_hold"
  | "read_planned";
export type ServingQueryPlanStatus = "query_blocked" | "query_planned";
export type ServingQualityScope = "field" | "record" | "snapshot";

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

export interface ServingQualitySubject {
  id: string;
  qualityState: ServingQualityState;
  scope: ServingQualityScope;
}

export interface ServingQualityReleasePlanInput {
  dataVersion: string;
  dataset: string;
  fieldQualityStates?: ServingQualitySubject[];
  methodologyVersion: string;
  recordQualityStates?: ServingQualitySubject[];
  rightsPolicyVersion: string;
  rowCount: number;
  snapshotQualityState: ServingQualityState;
  sourceRecordId: string;
}

export interface ServingQueryPlanInput {
  readPlan: ServingReadPlan;
  releaseState: ServingReleaseState;
  rowCount: number;
  servingSnapshotId: string;
  snapshotQualityState: ServingQualityState;
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

export interface ServingQueryPlan {
  allowedFields: string[];
  blockedReason?: string;
  cacheKeyMaterial: {
    dataVersion: string;
    fieldSet: string[];
    methodologyVersion: string;
    releaseState: ServingReleaseState;
    rightsPolicyVersion: string;
    servingSnapshotId: string;
    timeRange?: {
      from: string;
      to: string;
    };
  };
  dataset: string;
  filters: {
    servingSnapshotId: string;
    timeRange?: {
      from: string;
      to: string;
    };
  };
  liveRead: false;
  plannedRows: number;
  qualityState: ServingQualityState;
  releaseState: ServingReleaseState;
  requestedFields: string[];
  requestedRows: number;
  rowLimit: number;
  snapshotRowCount: number;
  sqlEmitted: false;
  status: ServingQueryPlanStatus;
  tables: readonly [
    "core.serving_dataset",
    "core.serving_field",
    "core.serving_snapshot",
    "core.serving_record"
  ];
  version: typeof SERVING_STORE_QUERY_PLAN_VERSION;
}

export interface ServingQualityReleasePlan {
  blockedQualityStates: ServingQualityState[];
  dataVersion: string;
  dataset: string;
  fieldQualityStates: ServingQualitySubject[];
  gatewayErrorCode?: "DATA_QUALITY_HOLD";
  isolatedRows: number;
  methodologyVersion: string;
  recordQualityStates: ServingQualitySubject[];
  releaseState: ServingReleaseState;
  releasedRows: number;
  rightsPolicyVersion: string;
  rowCount: number;
  servingEligible: boolean;
  snapshotQualityState: ServingQualityState;
  sourceRecordId: string;
  sqlEmitted: false;
  tables: readonly [
    "core.serving_dataset",
    "core.serving_field",
    "core.serving_snapshot",
    "core.serving_record"
  ];
  version: typeof SERVING_STORE_QUALITY_RELEASE_VERSION;
  warnings: string[];
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

export function createServingQualityReleasePlan(
  input: ServingQualityReleasePlanInput
): ServingQualityReleasePlan {
  const fieldQualityStates = [...(input.fieldQualityStates ?? [])];
  const recordQualityStates = [...(input.recordQualityStates ?? [])];
  const subjectStates = [
    input.snapshotQualityState,
    ...fieldQualityStates.map((subject) => subject.qualityState),
    ...recordQualityStates.map((subject) => subject.qualityState)
  ];
  const hasRejectRaw = subjectStates.includes("REJECT_RAW");
  const hasHold = subjectStates.includes("HOLD");
  const hasWarn = subjectStates.includes("WARN");
  const releaseState: ServingReleaseState = hasRejectRaw
    ? "withdrawn"
    : hasHold
      ? "held"
      : "released";
  const servingEligible = releaseState === "released";
  const blockedQualityStates = uniqueStates(
    subjectStates.filter((state) => state === "HOLD" || state === "REJECT_RAW")
  );

  return {
    blockedQualityStates,
    dataVersion: input.dataVersion,
    dataset: input.dataset,
    fieldQualityStates,
    gatewayErrorCode: servingEligible ? undefined : "DATA_QUALITY_HOLD",
    isolatedRows: servingEligible ? 0 : input.rowCount,
    methodologyVersion: input.methodologyVersion,
    recordQualityStates,
    releaseState,
    releasedRows: servingEligible ? input.rowCount : 0,
    rightsPolicyVersion: input.rightsPolicyVersion,
    rowCount: input.rowCount,
    servingEligible,
    snapshotQualityState: input.snapshotQualityState,
    sourceRecordId: input.sourceRecordId,
    sqlEmitted: false,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ],
    version: SERVING_STORE_QUALITY_RELEASE_VERSION,
    warnings: hasWarn ? ["quality_state_warn"] : []
  };
}

export function createServingQueryPlan(input: ServingQueryPlanInput): ServingQueryPlan {
  const readPlan = input.readPlan;
  const blockedReason = getServingQueryBlockedReason(input);
  const status: ServingQueryPlanStatus =
    blockedReason === undefined ? "query_planned" : "query_blocked";
  const allowedFields = status === "query_planned" ? readPlan.allowedFields : [];
  const plannedRows =
    status === "query_planned"
      ? Math.min(readPlan.requestedRows, readPlan.rowLimit, input.rowCount)
      : 0;

  return {
    allowedFields,
    blockedReason,
    cacheKeyMaterial: {
      ...readPlan.cacheKeyMaterial,
      fieldSet: allowedFields,
      releaseState: input.releaseState,
      servingSnapshotId: input.servingSnapshotId
    },
    dataset: readPlan.dataset,
    filters: {
      servingSnapshotId: input.servingSnapshotId,
      timeRange: readPlan.cacheKeyMaterial.timeRange
    },
    liveRead: false,
    plannedRows,
    qualityState: input.snapshotQualityState,
    releaseState: input.releaseState,
    requestedFields: readPlan.requestedFields,
    requestedRows: readPlan.requestedRows,
    rowLimit: readPlan.rowLimit,
    snapshotRowCount: input.rowCount,
    sqlEmitted: false,
    status,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ],
    version: SERVING_STORE_QUERY_PLAN_VERSION
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

export function getServingStoreQueryPlannerCapabilities() {
  return {
    blocks_unreleased_snapshots: true,
    live_reads: false,
    planner_version: SERVING_STORE_QUERY_PLAN_VERSION,
    requires_release_state: "released" as const,
    sql_emitted: false,
    status: "query_planner_scaffold" as const,
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
      "time_range",
      "serving_snapshot_id",
      "release_state"
    ] as const,
    uses_release_state: true,
    uses_row_limit: true
  };
}

export function getServingStoreQualityReleaseCapabilities() {
  return {
    blocks_quality_states: ["HOLD", "REJECT_RAW"] as const,
    gateway_error_code: "DATA_QUALITY_HOLD" as const,
    live_reads: false,
    live_writes: false,
    release_states: ["held", "released", "withdrawn"] as const,
    released_quality_states: ["PASS", "WARN"] as const,
    sql_emitted: false,
    status: "quality_release_isolation_scaffold" as const,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ] as const,
    uses_quality_state: true,
    version: SERVING_STORE_QUALITY_RELEASE_VERSION,
    warn_quality_states: ["WARN"] as const
  };
}

function getServingQueryBlockedReason(
  input: ServingQueryPlanInput
): string | undefined {
  if (input.readPlan.status !== "read_planned") {
    return input.readPlan.blockedReason ?? "DATA_NOT_LICENSED";
  }

  if (
    input.snapshotQualityState === "HOLD" ||
    input.snapshotQualityState === "REJECT_RAW"
  ) {
    return "DATA_QUALITY_HOLD";
  }

  if (input.releaseState !== "released") {
    return "SERVING_SNAPSHOT_NOT_RELEASED";
  }

  return undefined;
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

function uniqueStates(states: ServingQualityState[]): ServingQualityState[] {
  return [...new Set(states)].sort();
}
