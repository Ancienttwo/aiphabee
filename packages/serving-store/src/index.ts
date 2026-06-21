export const SERVING_STORE_READ_VERSION =
  "2026-06-20.phase1.serving-read-scaffold.v0";
export const SERVING_STORE_QUALITY_RELEASE_VERSION =
  "2026-06-20.phase1.quality-release-isolation.v0";
export const SERVING_STORE_QUERY_PLAN_VERSION =
  "2026-06-20.phase1.live-serving-query-planner-scaffold.v0";
export const SERVING_STORE_SQL_DESCRIPTOR_VERSION =
  "2026-06-20.phase1.serving-sql-descriptor-scaffold.v0";
export const SERVING_STORE_SQL_TEXT_VERSION =
  "2026-06-20.phase1.serving-sql-text-compiler-scaffold.v0";
export const SERVING_STORE_EXECUTION_ADAPTER_VERSION =
  "2026-06-20.phase1.serving-execution-adapter-scaffold.v0";

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
export type ServingSqlDescriptorStatus =
  | "descriptor_blocked"
  | "descriptor_planned";
export type ServingSqlTextStatus = "sql_text_blocked" | "sql_text_planned";
export type ServingExecutionAdapterStatus =
  | "execution_blocked"
  | "execution_deferred";
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

export interface ServingSqlDescriptorInput {
  queryPlan: ServingQueryPlan;
}

export interface ServingSqlTextInput {
  descriptor: ServingSqlDescriptor;
}

export interface ServingExecutionAdapterInput {
  sqlTextPlan: ServingSqlTextPlan;
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

export interface ServingSqlDescriptor {
  bindings: {
    fieldSet: string[];
    limit: number;
    servingSnapshotId: string;
    timeFrom?: string;
    timeTo?: string;
  };
  blockedReason?: string;
  dataset: string;
  executionReady: false;
  from: "core.serving_record";
  liveRead: false;
  orderBy: readonly [
    {
      direction: "asc";
      field: "core.serving_record.entity_id";
    }
  ];
  selectedFieldPaths: string[];
  sqlEmitted: false;
  sqlTextEmitted: false;
  statementId: "serving_record_projection_by_snapshot_v0";
  status: ServingSqlDescriptorStatus;
  tables: readonly [
    "core.serving_dataset",
    "core.serving_field",
    "core.serving_snapshot",
    "core.serving_record"
  ];
  where: {
    servingSnapshotId: string;
    timeRange?: {
      from: string;
      to: string;
    };
  };
  version: typeof SERVING_STORE_SQL_DESCRIPTOR_VERSION;
}

export interface ServingSqlTextPlan {
  blockedReason?: string;
  descriptorStatementId: ServingSqlDescriptor["statementId"];
  executionReady: false;
  liveRead: false;
  parameterOrder: readonly [
    "serving_snapshot_id",
    "field_set",
    "time_from",
    "time_to",
    "limit"
  ];
  parameters: {
    fieldSet: string[];
    limit: number;
    servingSnapshotId: string;
    timeFrom?: string;
    timeTo?: string;
  };
  sqlExecuted: false;
  sqlText?: string;
  sqlTextEmitted: boolean;
  status: ServingSqlTextStatus;
  version: typeof SERVING_STORE_SQL_TEXT_VERSION;
}

export interface ServingExecutionAdapterPlan {
  adapter: "hyperdrive";
  blockedReason?: string;
  deferredReason?: "LIVE_SERVING_EXECUTION_DISABLED";
  executionReady: false;
  liveRead: false;
  parameterOrder: ServingSqlTextPlan["parameterOrder"];
  parameters: ServingSqlTextPlan["parameters"];
  rows: [];
  servedRows: 0;
  sqlExecuted: false;
  sqlTextAccepted: boolean;
  statementId: ServingSqlTextPlan["descriptorStatementId"];
  status: ServingExecutionAdapterStatus;
  version: typeof SERVING_STORE_EXECUTION_ADAPTER_VERSION;
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

export function createServingSqlDescriptor(
  input: ServingSqlDescriptorInput
): ServingSqlDescriptor {
  const queryPlan = input.queryPlan;
  const blockedReason =
    queryPlan.status === "query_planned"
      ? undefined
      : queryPlan.blockedReason ?? "SERVING_QUERY_NOT_PLANNED";
  const status: ServingSqlDescriptorStatus =
    blockedReason === undefined ? "descriptor_planned" : "descriptor_blocked";
  const selectedFieldPaths =
    status === "descriptor_planned" ? queryPlan.allowedFields : [];
  const timeRange = queryPlan.cacheKeyMaterial.timeRange;

  return {
    bindings: {
      fieldSet: selectedFieldPaths,
      limit: status === "descriptor_planned" ? queryPlan.plannedRows : 0,
      servingSnapshotId: queryPlan.cacheKeyMaterial.servingSnapshotId,
      timeFrom: timeRange?.from,
      timeTo: timeRange?.to
    },
    blockedReason,
    dataset: queryPlan.dataset,
    executionReady: false,
    from: "core.serving_record",
    liveRead: false,
    orderBy: [
      {
        direction: "asc",
        field: "core.serving_record.entity_id"
      }
    ],
    selectedFieldPaths,
    sqlEmitted: false,
    sqlTextEmitted: false,
    statementId: "serving_record_projection_by_snapshot_v0",
    status,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ],
    where: {
      servingSnapshotId: queryPlan.cacheKeyMaterial.servingSnapshotId,
      timeRange
    },
    version: SERVING_STORE_SQL_DESCRIPTOR_VERSION
  };
}

export function createServingSqlTextPlan(
  input: ServingSqlTextInput
): ServingSqlTextPlan {
  const descriptor = input.descriptor;
  const blockedReason =
    descriptor.status === "descriptor_planned"
      ? undefined
      : descriptor.blockedReason ?? "SERVING_SQL_DESCRIPTOR_NOT_PLANNED";
  const status: ServingSqlTextStatus =
    blockedReason === undefined ? "sql_text_planned" : "sql_text_blocked";

  return {
    blockedReason,
    descriptorStatementId: descriptor.statementId,
    executionReady: false,
    liveRead: false,
    parameterOrder: [
      "serving_snapshot_id",
      "field_set",
      "time_from",
      "time_to",
      "limit"
    ],
    parameters: {
      fieldSet: status === "sql_text_planned" ? descriptor.bindings.fieldSet : [],
      limit: status === "sql_text_planned" ? descriptor.bindings.limit : 0,
      servingSnapshotId: descriptor.bindings.servingSnapshotId,
      timeFrom: descriptor.bindings.timeFrom,
      timeTo: descriptor.bindings.timeTo
    },
    sqlExecuted: false,
    sqlText:
      status === "sql_text_planned"
        ? createServingRecordProjectionSqlText()
        : undefined,
    sqlTextEmitted: status === "sql_text_planned",
    status,
    version: SERVING_STORE_SQL_TEXT_VERSION
  };
}

export function createServingExecutionAdapterPlan(
  input: ServingExecutionAdapterInput
): ServingExecutionAdapterPlan {
  const sqlTextPlan = input.sqlTextPlan;
  const blockedReason =
    sqlTextPlan.status === "sql_text_planned"
      ? undefined
      : sqlTextPlan.blockedReason ?? "SERVING_SQL_TEXT_NOT_PLANNED";
  const status: ServingExecutionAdapterStatus =
    blockedReason === undefined ? "execution_deferred" : "execution_blocked";

  return {
    adapter: "hyperdrive",
    blockedReason,
    deferredReason:
      status === "execution_deferred" ? "LIVE_SERVING_EXECUTION_DISABLED" : undefined,
    executionReady: false,
    liveRead: false,
    parameterOrder: sqlTextPlan.parameterOrder,
    parameters: sqlTextPlan.parameters,
    rows: [],
    servedRows: 0,
    sqlExecuted: false,
    sqlTextAccepted: status === "execution_deferred",
    statementId: sqlTextPlan.descriptorStatementId,
    status,
    version: SERVING_STORE_EXECUTION_ADAPTER_VERSION
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

export function getServingStoreExecutionAdapterCapabilities() {
  return {
    adapter: "hyperdrive" as const,
    blocks_blocked_sql_text: true,
    execution_ready: false,
    live_reads: false,
    returns_empty_rows: true,
    rows_returned: false,
    sql_executed: false,
    status: "execution_adapter_scaffold" as const,
    version: SERVING_STORE_EXECUTION_ADAPTER_VERSION
  };
}

export function getServingStoreSqlTextCompilerCapabilities() {
  return {
    execution_ready: false,
    live_reads: false,
    parameter_order: [
      "serving_snapshot_id",
      "field_set",
      "time_from",
      "time_to",
      "limit"
    ] as const,
    sql_executed: false,
    sql_text_emitted: true,
    statement_ids: ["serving_record_projection_by_snapshot_v0"] as const,
    status: "sql_text_compiler_scaffold" as const,
    template_source: "allow_listed_statement_id" as const,
    uses_parameterized_bindings: true,
    version: SERVING_STORE_SQL_TEXT_VERSION
  };
}

export function getServingStoreSqlDescriptorCapabilities() {
  return {
    blocks_unplanned_queries: true,
    execution_ready: false,
    live_reads: false,
    parameterized_bindings: true,
    sql_emitted: false,
    sql_text_emitted: false,
    statement_ids: ["serving_record_projection_by_snapshot_v0"] as const,
    status: "sql_descriptor_scaffold" as const,
    tables: [
      "core.serving_dataset",
      "core.serving_field",
      "core.serving_snapshot",
      "core.serving_record"
    ] as const,
    uses_allowed_field_set: true,
    uses_row_limit: true,
    uses_snapshot_binding: true,
    version: SERVING_STORE_SQL_DESCRIPTOR_VERSION
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

function createServingRecordProjectionSqlText(): string {
  return [
    "select",
    "  core.serving_record.serving_record_id,",
    "  core.serving_record.entity_type,",
    "  core.serving_record.entity_id,",
    "  core.serving_record.payload,",
    "  core.serving_record.field_set,",
    "  core.serving_record.source_record_id",
    "from core.serving_record",
    "where core.serving_record.serving_snapshot_id = $1",
    "  and core.serving_record.field_set @> $2::text[]",
    "  and ($3::date is null or core.serving_record.effective_to is null or core.serving_record.effective_to >= $3::date)",
    "  and ($4::date is null or core.serving_record.effective_from is null or core.serving_record.effective_from <= $4::date)",
    "order by core.serving_record.entity_id asc",
    "limit $5"
  ].join("\n");
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
