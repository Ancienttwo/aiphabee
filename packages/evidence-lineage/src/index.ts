import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";
import {
  DATA_ACCESS_GATEWAY_VERSION,
  createPolicyFromEntitlementRows,
  evaluateDataAccessRequest,
  type DataAccessChannel,
  type DataAccessDecision,
  type DataAccessDeniedReason,
  type DataAccessFieldStatus,
  type DataEntitlementRow,
  type EntitlementPolicySourcePlan,
  type WorkspaceEntitlementRow,
  type WorkspaceSubscriptionRow
} from "@aiphabee/data-access-gateway";

export const EVIDENCE_LINEAGE_TOOLS_VERSION =
  "2026-06-21.phase1.evidence-lineage-tools-scaffold.v0";
export const EVIDENCE_LINEAGE_SERVICE_VERSION =
  "2026-06-21.phase1.evidence-lineage-service-scaffold.v0";
export const DATA_LINEAGE_DATA_VERSION = "data-lineage-synthetic-v0";
export const ENTITLEMENTS_DATA_VERSION = "entitlements-synthetic-v0";
export const EVIDENCE_SERVICE_DATA_VERSION = "evidence-lineage-service-scaffold-v0";

export type DataLineageInputErrorCode = "LOOKUP_REQUIRED" | "INVALID_AS_OF";
export type DataLineageStatus = "data_quality_hold" | "found" | "not_found";
export type DataLineageQualityState = "HOLD" | "PASS";
export type DataLineageLookupKind = "evidence_id" | "record_id";
export type EntitlementsInputErrorCode =
  | "INVALID_AS_OF"
  | "INVALID_CHANNEL"
  | "INVALID_FIELDS"
  | "INVALID_LIMIT"
  | "INVALID_RANGE";
export type EntitlementsStatus =
  | "data_not_licensed"
  | "found"
  | "out_of_range"
  | "scope_denied"
  | "too_many_rows";
export type EvidenceServiceInputErrorCode =
  | "INVALID_AS_OF"
  | "SOURCE_RECORD_REQUIRED"
  | "TOOL_NAME_REQUIRED";
export type EvidenceRecordPlanStatus = "planned_no_write";

export interface GetDataLineageInput {
  asOf?: string;
  evidenceId?: string;
  includeUpstream?: boolean;
  recordId?: string;
}

export interface LineageUpstreamRef {
  dataset: string;
  recordId: string;
  source: string;
}

export interface DataLineageEntry {
  createdAt: string;
  dataVersion: string;
  dataset: string;
  evidenceId: string;
  fields: string[];
  formula?: string;
  methodologyVersion: string;
  qualityState: DataLineageQualityState;
  recordId: string;
  source: string;
  sourceBatchId: string;
  sourceRecordId: string;
  sourceRowHash: string;
  toolName: string;
  upstream: LineageUpstreamRef[];
  version: number;
}

export interface GetDataLineageResult {
  asOf: string;
  dataVersion: typeof DATA_LINEAGE_DATA_VERSION;
  evidenceId?: string;
  lineage?: DataLineageEntry;
  liveDataAccess: false;
  lookupKind: DataLineageLookupKind;
  lookupValue: string;
  methodologyVersion: typeof EVIDENCE_LINEAGE_TOOLS_VERSION;
  provenance: ProvenanceRef[];
  recordId?: string;
  status: DataLineageStatus;
  toolName: "get_data_lineage";
  usage: UsageSummary;
}

export interface GetEntitlementsInput {
  asOf?: string;
  channel?: string;
  dataset?: string;
  exportRequested?: boolean;
  fields?: string[];
  plan?: string;
  requestedRows?: number;
  timeRange?: {
    from: string;
    to: string;
  };
  toolName?: string;
  workspaceId?: string;
}

export interface EntitlementScope {
  allowedFields: string[];
  channel: DataAccessChannel;
  dataset?: string;
  datasets: string[];
  delaySeconds?: number;
  deniedFields: Array<{
    field: string;
    reason: DataAccessDeniedReason;
  }>;
  exportAllowed: boolean;
  historyDays?: number;
  limitationCodes: string[];
  maxRows: number;
  maxWindowDays: number;
  plan: string;
  requestedFields: string[];
  toolName?: string;
  tools: string[];
  workspaceId: string;
}

export interface GetEntitlementsResult {
  asOf: string;
  channel: DataAccessChannel;
  dataVersion: typeof ENTITLEMENTS_DATA_VERSION;
  dataset?: string;
  decision?: DataAccessDecision;
  entitlements: EntitlementScope;
  liveDataAccess: false;
  methodologyVersion: typeof EVIDENCE_LINEAGE_TOOLS_VERSION;
  plan: string;
  policySource: Pick<
    EntitlementPolicySourcePlan,
    | "liveDbReads"
    | "partnerRightsMatrixLoaded"
    | "rowCounts"
    | "sourceRecords"
    | "sqlEmitted"
    | "status"
    | "tables"
    | "version"
  >;
  provenance: ProvenanceRef[];
  rejectedDataset?: string;
  rejectedToolName?: string;
  rejectedWorkspaceId?: string;
  requestedFields: string[];
  status: EntitlementsStatus;
  toolName: "get_entitlements";
  usage: UsageSummary;
  workspaceId: string;
}

export interface EvidenceSourceRecordInput {
  dataVersion: string;
  methodologyVersion?: string;
  source: string;
  sourceRecordId: string;
}

export interface CreateEvidenceRecordPlanInput {
  asOf?: string;
  dataVersion: string;
  inputSchemaId?: string;
  methodologyVersion: string;
  outputSchemaId?: string;
  requestId: string;
  sourceRecords: EvidenceSourceRecordInput[];
  toolName: string;
  toolVersion?: string;
  userVisibleLabel?: string;
}

export interface EvidenceSourceRefPlan {
  dataVersion: string;
  evidenceRecordId: string;
  evidenceSourceRefId: string;
  methodologyVersion?: string;
  source: string;
  sourceRecordId: string;
}

export interface EvidenceRecordPlan {
  asOf: string;
  citation: {
    label: string;
    sourceRecordIds: string[];
    visibility: "user_visible";
  };
  dataVersion: string;
  evidenceRecord: {
    dataVersion: string;
    evidenceRecordId: string;
    inputSchemaId?: string;
    methodologyVersion: string;
    outputSchemaId?: string;
    requestId: string;
    rightsState: "default_deny";
    toolName: string;
    toolVersion: string;
  };
  liveDbWrites: false;
  methodologyVersion: typeof EVIDENCE_LINEAGE_SERVICE_VERSION;
  provenance: ProvenanceRef[];
  sourceRefs: EvidenceSourceRefPlan[];
  sqlEmitted: false;
  status: EvidenceRecordPlanStatus;
  tables: readonly ["core.evidence_record", "core.evidence_source_ref"];
  usage: UsageSummary;
  version: typeof EVIDENCE_LINEAGE_SERVICE_VERSION;
}

interface SyntheticLineageRecord {
  createdAt: string;
  dataVersion: string;
  dataset: string;
  evidenceId: string;
  fields: readonly string[];
  formula?: string;
  methodologyVersion: string;
  qualityState: DataLineageQualityState;
  recordId: string;
  source: string;
  sourceBatchId: string;
  sourceRecordId: string;
  sourceRowHash: string;
  toolName: string;
  upstream: readonly LineageUpstreamRef[];
  version: number;
}

export class DataLineageInputError extends Error {
  readonly code: DataLineageInputErrorCode;

  constructor(code: DataLineageInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class EntitlementsInputError extends Error {
  readonly code: EntitlementsInputErrorCode;

  constructor(code: EntitlementsInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class EvidenceServiceInputError extends Error {
  readonly code: EvidenceServiceInputErrorCode;

  constructor(code: EvidenceServiceInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const DEFAULT_AS_OF = "2026-01-07T16:15:00+08:00";
const DEFAULT_WORKSPACE_ID = "ws_demo_pro";
const DEFAULT_CHANNEL: DataAccessChannel = "web";
const DEFAULT_REQUESTED_ROWS = 1;

const TOOL_TO_DATASET: Record<string, string> = {
  get_corporate_actions: "corporate_actions",
  get_data_lineage: "lineage",
  get_entitlements: "entitlements",
  get_event_timeline: "event_timeline",
  get_financial_facts: "financial_facts",
  get_market_calendar: "market_calendar",
  get_price_history: "price_history",
  get_quote_snapshot: "quote_snapshot",
  get_security_profile: "security_profile",
  resolve_security: "security_master"
};

const DATASET_TO_TOOL = Object.fromEntries(
  Object.entries(TOOL_TO_DATASET).map(([toolName, dataset]) => [dataset, toolName])
) as Record<string, string>;

const DEFAULT_FIELDS_BY_DATASET: Record<string, readonly string[]> = {
  corporate_actions: ["action_type", "effective_date", "adjustment_factor"],
  entitlements: ["scope", "limits", "restrictions"],
  event_timeline: ["event_type", "event_scope", "date", "source_record_id"],
  financial_facts: ["revenue", "net_income", "assets", "equity"],
  lineage: ["source_record_id", "data_version", "methodology_version"],
  market_calendar: ["date", "session", "market_status"],
  price_history: ["open", "high", "low", "close", "volume", "turnover", "return"],
  quote_snapshot: ["lastPrice", "previousClose", "change", "changePercent", "volume"],
  security_master: ["instrument_id", "symbol", "market"],
  security_profile: ["identity.name", "identity.symbol", "listing_status", "currency"]
};

const DATASET_LIMITS: Record<string, { delaySeconds: number; historyDays: number }> = {
  corporate_actions: { delaySeconds: 900, historyDays: 3650 },
  entitlements: { delaySeconds: 0, historyDays: 3650 },
  event_timeline: { delaySeconds: 900, historyDays: 3650 },
  financial_facts: { delaySeconds: 86_400, historyDays: 1095 },
  lineage: { delaySeconds: 0, historyDays: 3650 },
  market_calendar: { delaySeconds: 0, historyDays: 730 },
  price_history: { delaySeconds: 900, historyDays: 366 },
  quote_snapshot: { delaySeconds: 900, historyDays: 30 },
  security_master: { delaySeconds: 86_400, historyDays: 3650 },
  security_profile: { delaySeconds: 86_400, historyDays: 3650 }
};

const SYNTHETIC_LINEAGE_RECORDS: readonly SyntheticLineageRecord[] = [
  {
    createdAt: "2026-01-07T16:15:00+08:00",
    dataVersion: "quote-snapshot-synthetic-v0",
    dataset: "quote_snapshot",
    evidenceId: "ev_quote_00700_20260107_close",
    fields: ["lastPrice", "previousClose", "volume", "turnover"],
    methodologyVersion: "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0",
    qualityState: "PASS",
    recordId: "quote:eq_hk_00700:2026-01-07:close",
    source: "synthetic.market_data.quote",
    sourceBatchId: "batch-hk-quotes-20260107",
    sourceRecordId: "quote-snapshot:eq_hk_00700:2026-01-07:close",
    sourceRowHash: "sha256:synthetic-quote-00700-20260107-close",
    toolName: "get_quote_snapshot",
    upstream: [
      {
        dataset: "security_master",
        recordId: "security:eq_hk_00700",
        source: "synthetic.security_master"
      }
    ],
    version: 1
  },
  {
    createdAt: "2024-04-01T00:00:00Z",
    dataVersion: "financial-facts-synthetic-v0",
    dataset: "financial_facts",
    evidenceId: "ev_financial_facts_00700_fy2023",
    fields: ["revenue", "net_income", "assets", "equity"],
    formula: "standardized_statement_row = source_fact.value * scale",
    methodologyVersion: "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
    qualityState: "PASS",
    recordId: "financial_fact:eq_hk_00700:2023-12-31:restatement-1",
    source: "synthetic.financial_facts.statement",
    sourceBatchId: "batch-financial-facts-20240401",
    sourceRecordId: "financial-facts:eq_hk_00700:2023-12-31:v1",
    sourceRowHash: "sha256:synthetic-financial-facts-00700-2023-v1",
    toolName: "get_financial_facts",
    upstream: [
      {
        dataset: "security_master",
        recordId: "security:eq_hk_00700",
        source: "synthetic.security_master"
      }
    ],
    version: 1
  },
  {
    createdAt: "2026-01-07T16:15:00+08:00",
    dataVersion: "quote-snapshot-synthetic-v0",
    dataset: "quote_snapshot",
    evidenceId: "ev_quote_08001_quality_hold",
    fields: ["lastPrice", "volume"],
    methodologyVersion: "2026-06-21.phase1.get-quote-snapshot-tool-scaffold.v0",
    qualityState: "HOLD",
    recordId: "quote:eq_hk_08001:2026-01-07:quality-hold",
    source: "synthetic.market_data.quote",
    sourceBatchId: "batch-hk-quotes-20260107",
    sourceRecordId: "quote-snapshot:eq_hk_08001:2026-01-07:hold",
    sourceRowHash: "sha256:synthetic-quote-08001-20260107-hold",
    toolName: "get_quote_snapshot",
    upstream: [
      {
        dataset: "security_master",
        recordId: "security:eq_hk_08001",
        source: "synthetic.security_master"
      }
    ],
    version: 1
  }
];

const SYNTHETIC_DATA_ENTITLEMENTS: readonly DataEntitlementRow[] = [
  createDataEntitlement("ent_security_master_web_all", "web", "security_master", "*", false, 3650),
  createDataEntitlement("ent_security_profile_web_all", "web", "security_profile", "*", false, 3650),
  createDataEntitlement("ent_market_calendar_web_all", "web", "market_calendar", "*", false, 730),
  createDataEntitlement("ent_quote_snapshot_web_all", "web", "quote_snapshot", "*", false, 30),
  createDataEntitlement("ent_quote_snapshot_api_all", "api", "quote_snapshot", "*", false, 30),
  createDataEntitlement("ent_price_history_web_all", "web", "price_history", "*", false, 366),
  createDataEntitlement(
    "ent_corporate_actions_web_all",
    "web",
    "corporate_actions",
    "*",
    false,
    3650
  ),
  createDataEntitlement("ent_financial_facts_web_revenue", "web", "financial_facts", "revenue", false, 1095),
  createDataEntitlement(
    "ent_financial_facts_web_net_income",
    "web",
    "financial_facts",
    "net_income",
    false,
    1095
  ),
  createDataEntitlement("ent_financial_facts_web_assets", "web", "financial_facts", "assets", false, 1095),
  createDataEntitlement("ent_financial_facts_web_equity", "web", "financial_facts", "equity", false, 1095),
  createDataEntitlement(
    "ent_financial_facts_web_capital_expenditure",
    "web",
    "financial_facts",
    "capital_expenditure",
    false,
    1095
  ),
  createDataEntitlement("ent_lineage_web_all", "web", "lineage", "*", false, 3650),
  createDataEntitlement("ent_entitlements_web_all", "web", "entitlements", "*", false, 3650)
];

const SYNTHETIC_SUBSCRIPTIONS: readonly WorkspaceSubscriptionRow[] = [
  {
    billingState: "active",
    planCode: "pro",
    subscriptionId: "sub_demo_pro",
    validFrom: "2026-01-01T00:00:00Z",
    workspaceId: "ws_demo_pro"
  },
  {
    billingState: "active",
    planCode: "free",
    subscriptionId: "sub_demo_free",
    validFrom: "2026-01-01T00:00:00Z",
    workspaceId: "ws_demo_free"
  }
];

const FREE_ENTITLEMENT_IDS = new Set([
  "ent_security_master_web_all",
  "ent_security_profile_web_all",
  "ent_market_calendar_web_all",
  "ent_quote_snapshot_web_all",
  "ent_lineage_web_all",
  "ent_entitlements_web_all"
]);

const SYNTHETIC_WORKSPACE_ENTITLEMENTS: readonly WorkspaceEntitlementRow[] = [
  ...SYNTHETIC_DATA_ENTITLEMENTS.map((entitlement) =>
    createWorkspaceEntitlement({
      entitlementId: entitlement.entitlementId,
      sourceRecordId: `workspace-entitlement:ws_demo_pro:${entitlement.entitlementId}`,
      status:
        entitlement.entitlementId === "ent_financial_facts_web_capital_expenditure"
          ? "blocked"
          : "approved",
      subscriptionId: "sub_demo_pro",
      workspaceEntitlementId: `we_pro_${entitlement.entitlementId}`,
      workspaceId: "ws_demo_pro"
    })
  ),
  ...SYNTHETIC_DATA_ENTITLEMENTS.filter((entitlement) =>
    FREE_ENTITLEMENT_IDS.has(entitlement.entitlementId)
  ).map((entitlement) =>
    createWorkspaceEntitlement({
      entitlementId: entitlement.entitlementId,
      sourceRecordId: `workspace-entitlement:ws_demo_free:${entitlement.entitlementId}`,
      status: "approved",
      subscriptionId: "sub_demo_free",
      workspaceEntitlementId: `we_free_${entitlement.entitlementId}`,
      workspaceId: "ws_demo_free"
    })
  )
];

export function getDataLineage(input: GetDataLineageInput): GetDataLineageResult {
  const asOf = normalizeAsOf(input.asOf, "lineage");
  const lookup = normalizeLineageLookup(input);
  const record = SYNTHETIC_LINEAGE_RECORDS.find((candidate) =>
    lookup.kind === "evidence_id"
      ? candidate.evidenceId === lookup.value
      : candidate.recordId === lookup.value
  );

  if (record === undefined) {
    return {
      asOf,
      dataVersion: DATA_LINEAGE_DATA_VERSION,
      liveDataAccess: false,
      lookupKind: lookup.kind,
      lookupValue: lookup.value,
      methodologyVersion: EVIDENCE_LINEAGE_TOOLS_VERSION,
      provenance: createLineageProvenance(undefined, lookup.value),
      status: "not_found",
      toolName: "get_data_lineage",
      usage: createUsage(0, 1)
    };
  }

  const lineage = toLineageEntry(record, input.includeUpstream !== false);

  return {
    asOf,
    dataVersion: DATA_LINEAGE_DATA_VERSION,
    evidenceId: record.evidenceId,
    lineage,
    liveDataAccess: false,
    lookupKind: lookup.kind,
    lookupValue: lookup.value,
    methodologyVersion: EVIDENCE_LINEAGE_TOOLS_VERSION,
    provenance: createLineageProvenance(record, lookup.value),
    recordId: record.recordId,
    status: record.qualityState === "HOLD" ? "data_quality_hold" : "found",
    toolName: "get_data_lineage",
    usage: createUsage(1, 1)
  };
}

export function getEntitlements(input: GetEntitlementsInput = {}): GetEntitlementsResult {
  const asOf = normalizeAsOf(input.asOf, "entitlements");
  const workspaceId = normalizeText(input.workspaceId) ?? DEFAULT_WORKSPACE_ID;
  const channel = normalizeChannel(input.channel);
  const plan = normalizeText(input.plan) ?? getWorkspacePlan(workspaceId);
  const toolName = normalizeText(input.toolName);
  const mappedDataset = toolName === undefined ? undefined : TOOL_TO_DATASET[toolName];
  const dataset = normalizeText(input.dataset) ?? mappedDataset;
  const requestedFields = normalizeEntitlementFields(input.fields, dataset);
  const requestedRows = normalizeRequestedRows(input.requestedRows);
  const timeRange = normalizeTimeRange(input.timeRange);
  const policySource = createPolicyFromEntitlementRows({
    asOf,
    dataEntitlements: [...SYNTHETIC_DATA_ENTITLEMENTS],
    subscriptionRows: [...SYNTHETIC_SUBSCRIPTIONS],
    workspaceEntitlements: [...SYNTHETIC_WORKSPACE_ENTITLEMENTS]
  });
  const provenance = createEntitlementsProvenance(policySource);

  if (!workspaceExists(workspaceId)) {
    return createEntitlementsResult({
      asOf,
      channel,
      plan,
      policySource,
      provenance,
      requestedFields,
      status: "scope_denied",
      workspaceId,
      rejectedWorkspaceId: workspaceId,
      toolName
    });
  }

  if (toolName !== undefined && mappedDataset === undefined) {
    return createEntitlementsResult({
      asOf,
      channel,
      plan,
      policySource,
      provenance,
      rejectedToolName: toolName,
      requestedFields,
      status: "data_not_licensed",
      workspaceId,
      toolName
    });
  }

  if (dataset !== undefined && !isSupportedDataset(dataset)) {
    return createEntitlementsResult({
      asOf,
      channel,
      dataset,
      plan,
      policySource,
      provenance,
      rejectedDataset: dataset,
      requestedFields,
      status: "data_not_licensed",
      workspaceId,
      toolName
    });
  }

  if (dataset === undefined) {
    return createEntitlementsResult({
      asOf,
      channel,
      plan,
      policySource,
      provenance,
      requestedFields,
      status: "found",
      workspaceId
    });
  }

  const decision = evaluateDataAccessRequest(
    {
      channel,
      dataset,
      exportRequested: input.exportRequested === true,
      plan,
      qualityState: "PASS",
      requestedFields,
      requestedRows,
      timeRange,
      workspaceId
    },
    policySource.policy
  );

  return createEntitlementsResult({
    asOf,
    channel,
    dataset,
    decision,
    plan,
    policySource,
    provenance,
    requestedFields,
    status: mapDecisionStatus(decision),
    workspaceId,
    toolName: toolName ?? DATASET_TO_TOOL[dataset]
  });
}

export function getDataLineageCapabilities() {
  return {
    handler_ready: true,
    live_data_access: false,
    no_sql_execution: true,
    no_url_fetch: true,
    source_record_lookup: true,
    standard_response_envelope: true,
    status: "get_data_lineage_scaffold" as const,
    supported_inputs: ["evidence_id", "record_id", "as_of", "include_upstream"] as const,
    tool_name: "get_data_lineage" as const,
    version: EVIDENCE_LINEAGE_TOOLS_VERSION
  };
}

export function getEntitlementsCapabilities() {
  return {
    gateway_policy_compiler: true,
    handler_ready: true,
    live_data_access: false,
    no_sql_execution: true,
    no_url_fetch: true,
    standard_response_envelope: true,
    status: "get_entitlements_scaffold" as const,
    supported_inputs: [
      "workspace_id",
      "channel",
      "tool_name",
      "dataset",
      "fields",
      "as_of",
      "time_range",
      "requested_rows",
      "export_requested"
    ] as const,
    tool_name: "get_entitlements" as const,
    version: EVIDENCE_LINEAGE_TOOLS_VERSION
  };
}

export function getEvidenceLineageCapabilities() {
  return {
    data_lineage: getDataLineageCapabilities(),
    entitlements: getEntitlementsCapabilities(),
    handler_ready_tool_count: 2,
    live_data_access: false,
    status: "evidence_lineage_tools_scaffold" as const,
    version: EVIDENCE_LINEAGE_TOOLS_VERSION
  };
}

export function createEvidenceRecordPlan(
  input: CreateEvidenceRecordPlanInput
): EvidenceRecordPlan {
  const asOf = normalizeEvidenceServiceAsOf(input.asOf);
  const toolName = normalizeEvidenceServiceText(input.toolName);
  const requestId = normalizeEvidenceServiceText(input.requestId);
  const dataVersion = normalizeEvidenceServiceText(input.dataVersion);
  const methodologyVersion = normalizeEvidenceServiceText(input.methodologyVersion);

  if (toolName === undefined || requestId === undefined) {
    throw new EvidenceServiceInputError(
      "TOOL_NAME_REQUIRED",
      "toolName and requestId are required"
    );
  }

  if (dataVersion === undefined || methodologyVersion === undefined) {
    throw new EvidenceServiceInputError(
      "SOURCE_RECORD_REQUIRED",
      "dataVersion and methodologyVersion are required"
    );
  }

  const sourceRecords = normalizeEvidenceSourceRecords(input.sourceRecords);
  const evidenceRecordId = `evidence_${hashEvidenceKey(
    [toolName, requestId, dataVersion, methodologyVersion, asOf].join("|")
  )}`;
  const toolVersion = input.toolVersion ?? "0.0.0";
  const sourceRefs = sourceRecords.map((sourceRecord, index) => ({
    dataVersion: sourceRecord.dataVersion,
    evidenceRecordId,
    evidenceSourceRefId: `${evidenceRecordId}_src_${index + 1}`,
    methodologyVersion: sourceRecord.methodologyVersion,
    source: sourceRecord.source,
    sourceRecordId: sourceRecord.sourceRecordId
  }));
  const label =
    normalizeEvidenceServiceText(input.userVisibleLabel) ??
    `${toolName} evidence for ${sourceRecords[0]?.sourceRecordId ?? requestId}`;

  return {
    asOf,
    citation: {
      label,
      sourceRecordIds: sourceRefs.map((sourceRef) => sourceRef.sourceRecordId),
      visibility: "user_visible"
    },
    dataVersion: EVIDENCE_SERVICE_DATA_VERSION,
    evidenceRecord: {
      dataVersion,
      evidenceRecordId,
      inputSchemaId: normalizeEvidenceServiceText(input.inputSchemaId),
      methodologyVersion,
      outputSchemaId: normalizeEvidenceServiceText(input.outputSchemaId),
      requestId,
      rightsState: "default_deny",
      toolName,
      toolVersion
    },
    liveDbWrites: false,
    methodologyVersion: EVIDENCE_LINEAGE_SERVICE_VERSION,
    provenance: [
      {
        data_version: EVIDENCE_SERVICE_DATA_VERSION,
        methodology_version: EVIDENCE_LINEAGE_SERVICE_VERSION,
        source: "evidence-lineage-service",
        source_record_id: evidenceRecordId
      },
      ...sourceRefs.map((sourceRef) => ({
        data_version: sourceRef.dataVersion,
        methodology_version: sourceRef.methodologyVersion,
        source: sourceRef.source,
        source_record_id: sourceRef.sourceRecordId
      }))
    ],
    sourceRefs,
    sqlEmitted: false,
    status: "planned_no_write",
    tables: ["core.evidence_record", "core.evidence_source_ref"],
    usage: createUsage(sourceRefs.length, 1),
    version: EVIDENCE_LINEAGE_SERVICE_VERSION
  };
}

export function getEvidenceServiceCapabilities() {
  return {
    citation_planner: true,
    default_rights_status: "default_deny" as const,
    durable_schema_ready: true,
    handler_ready: true,
    live_db_writes: false,
    no_sql_execution: true,
    source_record_linking: true,
    status: "evidence_lineage_service_scaffold" as const,
    tables: ["core.evidence_record", "core.evidence_source_ref"] as const,
    tool_call_linking: true,
    user_visible_citations: true,
    version: EVIDENCE_LINEAGE_SERVICE_VERSION
  };
}

function createDataEntitlement(
  entitlementId: string,
  channel: DataAccessChannel,
  dataset: string,
  fieldPattern: string,
  exportAllowed: boolean,
  timeRangeDays: number
): DataEntitlementRow {
  return {
    channel,
    dataset,
    entitlementId,
    exportAllowed,
    fieldPattern,
    rightsPolicyVersion: "rights-synthetic-hk-v0",
    sourceRecordId: `data-entitlement:${entitlementId}`,
    status: "approved",
    timeRangeDays
  };
}

function createWorkspaceEntitlement(input: {
  entitlementId: string;
  sourceRecordId: string;
  status: DataAccessFieldStatus;
  subscriptionId: string;
  workspaceEntitlementId: string;
  workspaceId: string;
}): WorkspaceEntitlementRow {
  return {
    entitlementId: input.entitlementId,
    sourceRecordId: input.sourceRecordId,
    status: input.status,
    subscriptionId: input.subscriptionId,
    validFrom: "2026-01-01T00:00:00Z",
    workspaceEntitlementId: input.workspaceEntitlementId,
    workspaceId: input.workspaceId
  };
}

function normalizeLineageLookup(input: GetDataLineageInput): {
  kind: DataLineageLookupKind;
  value: string;
} {
  const evidenceId = normalizeText(input.evidenceId);
  const recordId = normalizeText(input.recordId);

  if (evidenceId !== undefined) {
    return {
      kind: "evidence_id",
      value: evidenceId
    };
  }

  if (recordId !== undefined) {
    return {
      kind: "record_id",
      value: recordId
    };
  }

  throw new DataLineageInputError(
    "LOOKUP_REQUIRED",
    "either evidenceId or recordId is required"
  );
}

function normalizeAsOf(value: string | undefined, tool: "entitlements" | "lineage"): string {
  const normalized = normalizeText(value) ?? DEFAULT_AS_OF;

  if (Number.isNaN(Date.parse(normalized))) {
    if (tool === "lineage") {
      throw new DataLineageInputError("INVALID_AS_OF", "asOf must be an ISO timestamp");
    }

    throw new EntitlementsInputError("INVALID_AS_OF", "asOf must be an ISO timestamp");
  }

  return normalized;
}

function normalizeText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeChannel(value: string | undefined): DataAccessChannel {
  if (value === undefined) {
    return DEFAULT_CHANNEL;
  }

  if (value === "api" || value === "export" || value === "mcp" || value === "web") {
    return value;
  }

  throw new EntitlementsInputError(
    "INVALID_CHANNEL",
    "channel must be api, export, mcp, or web"
  );
}

function normalizeEntitlementFields(
  fields: string[] | undefined,
  dataset: string | undefined
): string[] {
  if (fields !== undefined) {
    if (fields.some((field) => typeof field !== "string" || field.trim().length === 0)) {
      throw new EntitlementsInputError(
        "INVALID_FIELDS",
        "fields must be non-empty strings"
      );
    }

    return [...new Set(fields.map((field) => field.trim()))].sort();
  }

  if (dataset !== undefined && isSupportedDataset(dataset)) {
    return [...DEFAULT_FIELDS_BY_DATASET[dataset]];
  }

  return [];
}

function normalizeRequestedRows(value: number | undefined): number {
  if (value === undefined) {
    return DEFAULT_REQUESTED_ROWS;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new EntitlementsInputError(
      "INVALID_LIMIT",
      "requestedRows must be a positive integer"
    );
  }

  return value;
}

function normalizeTimeRange(value: GetEntitlementsInput["timeRange"]) {
  if (value === undefined) {
    return undefined;
  }

  if (!isIsoDate(value.from) || !isIsoDate(value.to)) {
    throw new EntitlementsInputError(
      "INVALID_RANGE",
      "timeRange.from and timeRange.to must be ISO dates"
    );
  }

  if (Date.parse(`${value.from}T00:00:00Z`) > Date.parse(`${value.to}T00:00:00Z`)) {
    throw new EntitlementsInputError(
      "INVALID_RANGE",
      "timeRange.from must be before or equal to timeRange.to"
    );
  }

  return value;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isSupportedDataset(dataset: string): boolean {
  return Object.hasOwn(DEFAULT_FIELDS_BY_DATASET, dataset);
}

function workspaceExists(workspaceId: string): boolean {
  return SYNTHETIC_SUBSCRIPTIONS.some((subscription) => subscription.workspaceId === workspaceId);
}

function getWorkspacePlan(workspaceId: string): string {
  return (
    SYNTHETIC_SUBSCRIPTIONS.find((subscription) => subscription.workspaceId === workspaceId)
      ?.planCode ?? "pro"
  );
}

function mapDecisionStatus(decision: DataAccessDecision): EntitlementsStatus {
  if (decision.error?.code === "OUT_OF_RANGE") {
    return "out_of_range";
  }

  if (decision.error?.code === "TOO_MANY_ROWS") {
    return "too_many_rows";
  }

  if (decision.error?.code === "DATA_NOT_LICENSED") {
    return "data_not_licensed";
  }

  return "found";
}

function createEntitlementsResult(input: {
  asOf: string;
  channel: DataAccessChannel;
  dataset?: string;
  decision?: DataAccessDecision;
  plan: string;
  policySource: EntitlementPolicySourcePlan;
  provenance: ProvenanceRef[];
  rejectedDataset?: string;
  rejectedToolName?: string;
  rejectedWorkspaceId?: string;
  requestedFields: string[];
  status: EntitlementsStatus;
  toolName?: string;
  workspaceId: string;
}): GetEntitlementsResult {
  return {
    asOf: input.asOf,
    channel: input.channel,
    dataVersion: ENTITLEMENTS_DATA_VERSION,
    dataset: input.dataset,
    decision: input.decision,
    entitlements: createScope(input),
    liveDataAccess: false,
    methodologyVersion: EVIDENCE_LINEAGE_TOOLS_VERSION,
    plan: input.plan,
    policySource: {
      liveDbReads: input.policySource.liveDbReads,
      partnerRightsMatrixLoaded: input.policySource.partnerRightsMatrixLoaded,
      rowCounts: input.policySource.rowCounts,
      sourceRecords: input.policySource.sourceRecords,
      sqlEmitted: input.policySource.sqlEmitted,
      status: input.policySource.status,
      tables: input.policySource.tables,
      version: input.policySource.version
    },
    provenance: input.provenance,
    rejectedDataset: input.rejectedDataset,
    rejectedToolName: input.rejectedToolName,
    rejectedWorkspaceId: input.rejectedWorkspaceId,
    requestedFields: input.requestedFields,
    status: input.status,
    toolName: "get_entitlements",
    usage: createUsage(input.status === "found" ? 1 : 0, 2),
    workspaceId: input.workspaceId
  };
}

function createScope(input: {
  channel: DataAccessChannel;
  dataset?: string;
  decision?: DataAccessDecision;
  policySource: EntitlementPolicySourcePlan;
  requestedFields: string[];
  toolName?: string;
  workspaceId: string;
  plan: string;
}): EntitlementScope {
  const availablePolicies = input.policySource.policy.entitlementPolicies.filter(
    (policy) =>
      policy.workspaceId === input.workspaceId &&
      policy.channel === input.channel &&
      policy.status === "approved"
  );
  const datasets = [
    ...new Set(availablePolicies.map((policy) => policy.dataset).filter(isSupportedDataset))
  ].sort();
  const tools = datasets.map((dataset) => DATASET_TO_TOOL[dataset]).filter(Boolean).sort();
  const datasetPolicies =
    input.dataset === undefined
      ? availablePolicies
      : availablePolicies.filter((policy) => policy.dataset === input.dataset);
  const exportAllowed = datasetPolicies.some((policy) => policy.exportAllowed);
  const datasetLimits = input.dataset === undefined ? undefined : DATASET_LIMITS[input.dataset];
  const limitationCodes = [
    "synthetic_fixture_only",
    "live_db_reads_disabled",
    "partner_rights_matrix_absent",
    ...(exportAllowed ? [] : ["export_blocked"]),
    ...(input.decision?.warnings ?? []),
    ...(input.decision?.error?.code !== undefined ? [input.decision.error.code] : [])
  ];

  return {
    allowedFields:
      input.decision?.allowedFields ??
      expandFieldPatterns(datasetPolicies, input.dataset).sort(),
    channel: input.channel,
    dataset: input.dataset,
    datasets,
    delaySeconds: datasetLimits?.delaySeconds,
    deniedFields: input.decision?.deniedFields ?? [],
    exportAllowed,
    historyDays: datasetLimits?.historyDays,
    limitationCodes: [...new Set(limitationCodes)].sort(),
    maxRows: input.policySource.policy.maxRows,
    maxWindowDays: input.policySource.policy.maxWindowDays,
    plan: input.plan,
    requestedFields: input.requestedFields,
    toolName: input.toolName,
    tools,
    workspaceId: input.workspaceId
  };
}

function expandFieldPatterns(
  policies: readonly { dataset: string; fieldPattern: string }[],
  dataset: string | undefined
): string[] {
  return [
    ...new Set(
      policies.flatMap((policy) => {
        if (policy.fieldPattern === "*" && dataset !== undefined) {
          return DEFAULT_FIELDS_BY_DATASET[dataset] ?? ["*"];
        }

        return [policy.fieldPattern];
      })
    )
  ];
}

function toLineageEntry(
  record: SyntheticLineageRecord,
  includeUpstream: boolean
): DataLineageEntry {
  return {
    createdAt: record.createdAt,
    dataVersion: record.dataVersion,
    dataset: record.dataset,
    evidenceId: record.evidenceId,
    fields: [...record.fields],
    formula: record.formula,
    methodologyVersion: record.methodologyVersion,
    qualityState: record.qualityState,
    recordId: record.recordId,
    source: record.source,
    sourceBatchId: record.sourceBatchId,
    sourceRecordId: record.sourceRecordId,
    sourceRowHash: record.sourceRowHash,
    toolName: record.toolName,
    upstream: includeUpstream ? record.upstream.map((upstream) => ({ ...upstream })) : [],
    version: record.version
  };
}

function createLineageProvenance(
  record: SyntheticLineageRecord | undefined,
  lookupValue: string
): ProvenanceRef[] {
  return [
    {
      data_version: DATA_LINEAGE_DATA_VERSION,
      methodology_version: EVIDENCE_LINEAGE_TOOLS_VERSION,
      source: "evidence-lineage",
      source_record_id: record?.sourceRecordId ?? `missing:${lookupValue}`
    }
  ];
}

function createEntitlementsProvenance(
  policySource: EntitlementPolicySourcePlan
): ProvenanceRef[] {
  return [
    {
      data_version: ENTITLEMENTS_DATA_VERSION,
      methodology_version: EVIDENCE_LINEAGE_TOOLS_VERSION,
      source: "entitlement-policy-source",
      source_record_id: policySource.sourceRecords.join("|") || "synthetic-entitlements-empty"
    },
    {
      data_version: "gateway-policy-source-v0",
      methodology_version: DATA_ACCESS_GATEWAY_VERSION,
      source: "data-access-gateway",
      source_record_id: "createPolicyFromEntitlementRows"
    }
  ];
}

function normalizeEvidenceServiceAsOf(value: string | undefined): string {
  const normalized = normalizeEvidenceServiceText(value) ?? DEFAULT_AS_OF;

  if (Number.isNaN(Date.parse(normalized))) {
    throw new EvidenceServiceInputError("INVALID_AS_OF", "asOf must be an ISO timestamp");
  }

  return normalized;
}

function normalizeEvidenceSourceRecords(
  sourceRecords: EvidenceSourceRecordInput[]
): EvidenceSourceRecordInput[] {
  if (!Array.isArray(sourceRecords) || sourceRecords.length === 0) {
    throw new EvidenceServiceInputError(
      "SOURCE_RECORD_REQUIRED",
      "at least one source record is required"
    );
  }

  return sourceRecords.map((sourceRecord) => {
    const source = normalizeEvidenceServiceText(sourceRecord.source);
    const sourceRecordId = normalizeEvidenceServiceText(sourceRecord.sourceRecordId);
    const dataVersion = normalizeEvidenceServiceText(sourceRecord.dataVersion);

    if (source === undefined || sourceRecordId === undefined || dataVersion === undefined) {
      throw new EvidenceServiceInputError(
        "SOURCE_RECORD_REQUIRED",
        "source records require source, sourceRecordId, and dataVersion"
      );
    }

    return {
      dataVersion,
      methodologyVersion: normalizeEvidenceServiceText(sourceRecord.methodologyVersion),
      source,
      sourceRecordId
    };
  });
}

function normalizeEvidenceServiceText(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function hashEvidenceKey(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function createUsage(rows: number, credits: number): UsageSummary {
  return {
    cached: false,
    credits,
    rows
  };
}
