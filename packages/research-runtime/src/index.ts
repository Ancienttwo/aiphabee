export const RESEARCH_RUN_SAVE_VERSION =
  "2026-06-21.phase2.research-run-save-scaffold.v0";

export type ResearchRunSaveStatus = "planned_no_write";
export type ResearchRunInputErrorCode =
  | "EVIDENCE_SNAPSHOT_REQUIRED"
  | "MODEL_VERSION_REQUIRED"
  | "PROMPT_VERSION_REQUIRED"
  | "QUESTION_REQUIRED"
  | "TOOL_INPUT_REQUIRED";

export class ResearchRunInputError extends Error {
  readonly code: ResearchRunInputErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: ResearchRunInputErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export type ResearchRunJsonValue =
  | boolean
  | number
  | string
  | null
  | ResearchRunJsonValue[]
  | { [key: string]: ResearchRunJsonValue };

export interface ResearchRunToolCallInput {
  dataVersion?: string;
  input?: ResearchRunJsonValue;
  inputSchemaId?: string;
  methodologyVersion?: string;
  outputSchemaId?: string;
  requestId?: string;
  toolCallId?: string;
  toolName?: string;
  toolVersion?: string;
}

export interface ResearchRunEvidenceInput {
  citationLabel?: string;
  dataVersion?: string;
  documentLocation?: {
    anchor?: string;
    documentId?: string;
    page?: number;
    paragraph?: number;
    sourceRecordId?: string;
  };
  evidenceRecordId?: string;
  methodologyVersion?: string;
  sourceRecordIds?: string[];
}

export interface CreateResearchRunSavePlanInput {
  answerHash?: string;
  asOf?: string;
  channel?: "api" | "mcp" | "web";
  evidenceRecords?: ResearchRunEvidenceInput[];
  modelProvider?: string;
  modelVersion?: string;
  parameters?: Record<string, ResearchRunJsonValue>;
  promptTemplateId?: string;
  promptVersion?: string;
  question?: string;
  requestId: string;
  runId?: string;
  toolCalls?: ResearchRunToolCallInput[];
  userId?: string;
  workspaceId?: string;
}

export interface ResearchRunSavedToolCall {
  data_version: string;
  input_hash: string;
  input_schema_id?: string;
  input_snapshot: ResearchRunJsonValue;
  methodology_version: string;
  output_schema_id?: string;
  request_id: string;
  tool_call_id: string;
  tool_name: string;
  tool_version: string;
}

export interface ResearchRunSavedEvidenceRecord {
  citation_label?: string;
  data_version: string;
  document_location?: {
    anchor?: string;
    document_id?: string;
    page?: number;
    paragraph?: number;
    source_record_id?: string;
  };
  evidence_record_id: string;
  methodology_version: string;
  source_record_ids: string[];
}

export interface ResearchRunSavePlan {
  answer_snapshot: {
    answer_hash?: string;
    output_hash_recorded: boolean;
  };
  as_of: string;
  channel: "api" | "mcp" | "web";
  data_version: typeof RESEARCH_RUN_SAVE_VERSION;
  evidence_snapshot: {
    evidence_record_count: number;
    records: ResearchRunSavedEvidenceRecord[];
    snapshot_hash: string;
  };
  frontend_rendering: false;
  immutable_report_snapshot: true;
  live_db_writes: false;
  methodology_version: typeof RESEARCH_RUN_SAVE_VERSION;
  model_snapshot: {
    model_provider: string;
    model_version: string;
    prompt_template_id?: string;
    prompt_version: string;
  };
  persistence_plan: {
    old_report_mutation_allowed: false;
    sql_emitted: false;
    tables: readonly [
      "core.research_run",
      "core.research_run_tool_call",
      "core.research_run_evidence_snapshot",
      "core.research_run_model_snapshot"
    ];
    write_status: "planned_no_write";
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  question_snapshot: {
    question: string;
    question_hash: string;
  };
  replay_seed: {
    deterministic_replay_ready: true;
    replay_route: "POST /research/runs/replay/plan";
    replay_status: "planned";
    snapshot_id: string;
  };
  request_id: string;
  research_run_id: string;
  run_id: string;
  schema_validation: {
    errors: string[];
    required_fields: readonly [
      "question",
      "tool_calls",
      "evidence_records",
      "model_version",
      "prompt_version"
    ];
    valid: true;
  };
  snapshot_id: string;
  sql_emitted: false;
  status: ResearchRunSaveStatus;
  tool_input_snapshot: {
    tool_call_count: number;
    tool_calls: ResearchRunSavedToolCall[];
  };
  toolName: "save_research_run";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  user: {
    source: "request" | "synthetic_default";
    user_id: string;
  };
  version: typeof RESEARCH_RUN_SAVE_VERSION;
  workspace: {
    source: "request" | "synthetic_default";
    workspace_id: string;
  };
}

const REQUIRED_RESEARCH_RUN_FIELDS = [
  "question",
  "tool_calls",
  "evidence_records",
  "model_version",
  "prompt_version"
] as const;
const RESEARCH_RUN_TABLES = [
  "core.research_run",
  "core.research_run_tool_call",
  "core.research_run_evidence_snapshot",
  "core.research_run_model_snapshot"
] as const;

export function getResearchRuntimeCapabilities() {
  return {
    frontend_rendering: false,
    immutable_report_snapshot: true,
    live_db_writes: false,
    package: "@aiphabee/research-runtime" as const,
    replay_seed_ready: true,
    required_fields: REQUIRED_RESEARCH_RUN_FIELDS,
    route: "POST /research/runs/save/plan" as const,
    runtime_route: "GET /research/runtime" as const,
    sql_emitted: false,
    status: "research_run_save_scaffold" as const,
    supported_snapshots: [
      "question",
      "tool_inputs",
      "evidence_records",
      "model_version",
      "prompt_version"
    ] as const,
    tables: RESEARCH_RUN_TABLES,
    tool_name: "save_research_run" as const,
    version: RESEARCH_RUN_SAVE_VERSION
  };
}

export function createResearchRunSavePlan(
  input: CreateResearchRunSavePlanInput
): ResearchRunSavePlan {
  const asOf = normalizeAsOf(input.asOf);
  const question = normalizeText(input.question);
  const modelVersion = normalizeText(input.modelVersion);
  const promptVersion = normalizeText(input.promptVersion);

  if (question === undefined) {
    throw new ResearchRunInputError("QUESTION_REQUIRED", "question is required");
  }

  if (modelVersion === undefined) {
    throw new ResearchRunInputError(
      "MODEL_VERSION_REQUIRED",
      "modelVersion is required"
    );
  }

  if (promptVersion === undefined) {
    throw new ResearchRunInputError(
      "PROMPT_VERSION_REQUIRED",
      "promptVersion is required"
    );
  }

  const toolCalls = normalizeToolCalls(input.toolCalls);
  if (toolCalls.length === 0) {
    throw new ResearchRunInputError(
      "TOOL_INPUT_REQUIRED",
      "at least one tool input snapshot is required"
    );
  }

  const evidenceRecords = normalizeEvidenceRecords(input.evidenceRecords);
  if (evidenceRecords.length === 0) {
    throw new ResearchRunInputError(
      "EVIDENCE_SNAPSHOT_REQUIRED",
      "at least one evidence snapshot record is required"
    );
  }

  const runId =
    normalizeText(input.runId) ??
    `research_run_${hashStableValue([
      input.requestId,
      question,
      modelVersion,
      promptVersion
    ])}`;
  const snapshotHash = hashStableValue({
    evidenceRecords,
    modelVersion,
    promptVersion,
    question,
    toolCalls
  });
  const snapshotId = `research_snapshot_${snapshotHash}`;
  const userId = normalizeText(input.userId);
  const workspaceId = normalizeText(input.workspaceId);

  return {
    answer_snapshot: {
      answer_hash: normalizeText(input.answerHash),
      output_hash_recorded: normalizeText(input.answerHash) !== undefined
    },
    as_of: asOf,
    channel: input.channel ?? "web",
    data_version: RESEARCH_RUN_SAVE_VERSION,
    evidence_snapshot: {
      evidence_record_count: evidenceRecords.length,
      records: evidenceRecords,
      snapshot_hash: snapshotHash
    },
    frontend_rendering: false,
    immutable_report_snapshot: true,
    live_db_writes: false,
    methodology_version: RESEARCH_RUN_SAVE_VERSION,
    model_snapshot: {
      model_provider: normalizeText(input.modelProvider) ?? "not_configured",
      model_version: modelVersion,
      prompt_template_id: normalizeText(input.promptTemplateId),
      prompt_version: promptVersion
    },
    persistence_plan: {
      old_report_mutation_allowed: false,
      sql_emitted: false,
      tables: RESEARCH_RUN_TABLES,
      write_status: "planned_no_write"
    },
    provenance: [
      {
        data_version: RESEARCH_RUN_SAVE_VERSION,
        methodology_version: RESEARCH_RUN_SAVE_VERSION,
        source: "research-run-save-plan",
        source_record_id: snapshotId
      },
      ...evidenceRecords.flatMap((record) =>
        record.source_record_ids.map((sourceRecordId) => ({
          data_version: record.data_version,
          methodology_version: record.methodology_version,
          source: "evidence-snapshot",
          source_record_id: sourceRecordId
        }))
      )
    ],
    question_snapshot: {
      question,
      question_hash: hashStableValue(question)
    },
    replay_seed: {
      deterministic_replay_ready: true,
      replay_route: "POST /research/runs/replay/plan",
      replay_status: "planned",
      snapshot_id: snapshotId
    },
    request_id: input.requestId,
    research_run_id: runId,
    run_id: runId,
    schema_validation: {
      errors: [],
      required_fields: REQUIRED_RESEARCH_RUN_FIELDS,
      valid: true
    },
    snapshot_id: snapshotId,
    sql_emitted: false,
    status: "planned_no_write",
    tool_input_snapshot: {
      tool_call_count: toolCalls.length,
      tool_calls: toolCalls
    },
    toolName: "save_research_run",
    usage: {
      cached: false,
      credits: 1,
      rows: 1 + toolCalls.length + evidenceRecords.length
    },
    user: {
      source: userId === undefined ? "synthetic_default" : "request",
      user_id: userId ?? "user_internal_alpha"
    },
    version: RESEARCH_RUN_SAVE_VERSION,
    workspace: {
      source: workspaceId === undefined ? "synthetic_default" : "request",
      workspace_id: workspaceId ?? "workspace_research"
    }
  };
}

function normalizeToolCalls(
  toolCalls: ResearchRunToolCallInput[] | undefined
): ResearchRunSavedToolCall[] {
  if (toolCalls === undefined) {
    return [];
  }

  return toolCalls
    .map((toolCall, index): ResearchRunSavedToolCall | undefined => {
      const toolName = normalizeText(toolCall.toolName);
      const inputSnapshot = toolCall.input;
      const requestId = normalizeText(toolCall.requestId);
      const dataVersion = normalizeText(toolCall.dataVersion);
      const methodologyVersion = normalizeText(toolCall.methodologyVersion);

      if (
        toolName === undefined ||
        inputSnapshot === undefined ||
        requestId === undefined ||
        dataVersion === undefined ||
        methodologyVersion === undefined
      ) {
        return undefined;
      }

      return {
        data_version: dataVersion,
        input_hash: hashStableValue(inputSnapshot),
        input_schema_id: normalizeText(toolCall.inputSchemaId),
        input_snapshot: inputSnapshot,
        methodology_version: methodologyVersion,
        output_schema_id: normalizeText(toolCall.outputSchemaId),
        request_id: requestId,
        tool_call_id:
          normalizeText(toolCall.toolCallId) ?? `tool_call_${index + 1}_${toolName}`,
        tool_name: toolName,
        tool_version: normalizeText(toolCall.toolVersion) ?? "0.0.0"
      };
    })
    .filter((toolCall): toolCall is ResearchRunSavedToolCall => toolCall !== undefined);
}

function normalizeEvidenceRecords(
  evidenceRecords: ResearchRunEvidenceInput[] | undefined
): ResearchRunSavedEvidenceRecord[] {
  if (evidenceRecords === undefined) {
    return [];
  }

  return evidenceRecords
    .map((record): ResearchRunSavedEvidenceRecord | undefined => {
      const evidenceRecordId = normalizeText(record.evidenceRecordId);
      const dataVersion = normalizeText(record.dataVersion);
      const methodologyVersion = normalizeText(record.methodologyVersion);
      const sourceRecordIds =
        record.sourceRecordIds
          ?.map((sourceRecordId) => normalizeText(sourceRecordId))
          .filter((sourceRecordId): sourceRecordId is string => sourceRecordId !== undefined) ??
        [];

      if (
        evidenceRecordId === undefined ||
        dataVersion === undefined ||
        methodologyVersion === undefined ||
        sourceRecordIds.length === 0
      ) {
        return undefined;
      }

      return {
        citation_label: normalizeText(record.citationLabel),
        data_version: dataVersion,
        document_location: normalizeDocumentLocation(record.documentLocation),
        evidence_record_id: evidenceRecordId,
        methodology_version: methodologyVersion,
        source_record_ids: sourceRecordIds
      };
    })
    .filter(
      (record): record is ResearchRunSavedEvidenceRecord => record !== undefined
    );
}

function normalizeDocumentLocation(
  location: ResearchRunEvidenceInput["documentLocation"]
): ResearchRunSavedEvidenceRecord["document_location"] | undefined {
  if (location === undefined) {
    return undefined;
  }

  const documentId = normalizeText(location.documentId);
  const sourceRecordId = normalizeText(location.sourceRecordId);

  if (documentId === undefined && sourceRecordId === undefined) {
    return undefined;
  }

  return {
    anchor: normalizeText(location.anchor),
    document_id: documentId,
    page: normalizePositiveInteger(location.page),
    paragraph: normalizePositiveInteger(location.paragraph),
    source_record_id: sourceRecordId
  };
}

function normalizeAsOf(value: string | undefined): string {
  const normalized = normalizeText(value);

  if (normalized !== undefined && !Number.isNaN(Date.parse(normalized))) {
    return normalized;
  }

  return "2026-01-07T16:15:00+08:00";
}

function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function normalizePositiveInteger(value: number | undefined): number | undefined {
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined;
}

function hashStableValue(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => {
      const record = value as Record<string, unknown>;
      return `${JSON.stringify(key)}:${stableStringify(record[key])}`;
    })
    .join(",")}}`;
}
