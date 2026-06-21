export const RESEARCH_RUN_SAVE_VERSION =
  "2026-06-21.phase2.research-run-save-scaffold.v0";
export const RESEARCH_RUN_REPLAY_VERSION =
  "2026-06-21.phase2.research-run-replay-scaffold.v0";

export type ResearchRunSaveStatus = "planned_no_write";
export type ResearchRunReplayStatus = "planned_no_write";
export type ResearchRunDiffCategory = "data" | "model" | "parameters";
export type ResearchRunInputErrorCode =
  | "CURRENT_RUN_REQUIRED"
  | "EVIDENCE_SNAPSHOT_REQUIRED"
  | "MODEL_VERSION_REQUIRED"
  | "PROMPT_VERSION_REQUIRED"
  | "QUESTION_REQUIRED"
  | "SAVED_RUN_REQUIRED"
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

export type CreateResearchRunReplayCurrentRunInput = Omit<
  CreateResearchRunSavePlanInput,
  "requestId"
> & {
  requestId?: string;
};

export interface CreateResearchRunReplayPlanInput {
  currentRun?: CreateResearchRunReplayCurrentRunInput;
  replayReason?: string;
  requestId: string;
  savedRun?: ResearchRunSavePlan;
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

export interface ResearchRunParameterSnapshot {
  parameter_hash: string;
  parameters: Record<string, ResearchRunJsonValue>;
  parameters_recorded: boolean;
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
  parameter_snapshot: ResearchRunParameterSnapshot;
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

export interface ResearchRunDataDiff {
  changed: boolean;
  changed_data_versions: Array<{
    current?: string;
    field: string;
    previous?: string;
  }>;
  changed_source_record_ids: string[];
  current_evidence_hash: string;
  current_source_record_ids: string[];
  data_version_changed: boolean;
  previous_evidence_hash: string;
  previous_source_record_ids: string[];
}

export interface ResearchRunModelDiff {
  changed: boolean;
  current_model_provider: string;
  current_model_version: string;
  current_prompt_template_id?: string;
  current_prompt_version: string;
  model_provider_changed: boolean;
  model_version_changed: boolean;
  previous_model_provider: string;
  previous_model_version: string;
  previous_prompt_template_id?: string;
  previous_prompt_version: string;
  prompt_template_changed: boolean;
  prompt_version_changed: boolean;
}

export interface ResearchRunParameterDiff {
  added_keys: string[];
  changed: boolean;
  changed_keys: string[];
  current_parameter_hash: string;
  current_parameters: Record<string, ResearchRunJsonValue>;
  current_tool_input_hashes: string[];
  previous_parameter_hash: string;
  previous_parameters: Record<string, ResearchRunJsonValue>;
  previous_tool_input_hashes: string[];
  question_changed: boolean;
  removed_keys: string[];
  tool_input_changed: boolean;
}

export interface ResearchRunReplayPlan {
  as_of: string;
  current_run_plan: ResearchRunSavePlan;
  data_version: typeof RESEARCH_RUN_REPLAY_VERSION;
  diff_summary: {
    categories: ResearchRunDiffCategory[];
    changed: boolean;
    data_changed: boolean;
    model_changed: boolean;
    parameters_changed: boolean;
  };
  diffs: {
    data: ResearchRunDataDiff;
    model: ResearchRunModelDiff;
    parameters: ResearchRunParameterDiff;
  };
  frontend_rendering: false;
  immutable_report_snapshot: true;
  live_db_writes: false;
  methodology_version: typeof RESEARCH_RUN_REPLAY_VERSION;
  old_report: {
    immutable_report_snapshot: true;
    mutation_allowed: false;
    preserved_snapshot_id: string;
    silent_rewrite_allowed: false;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  replay_execution: {
    execution_status: "planned_no_write";
    live_model_call: false;
    live_tool_execution: false;
    sql_emitted: false;
  };
  replay_reason?: string;
  replay_snapshot_id: string;
  request_id: string;
  route: "POST /research/runs/replay/plan";
  saved_snapshot_id: string;
  sql_emitted: false;
  status: ResearchRunReplayStatus;
  toolName: "replay_research_run";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  version: typeof RESEARCH_RUN_REPLAY_VERSION;
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
    old_report_immutability_ready: true,
    package: "@aiphabee/research-runtime" as const,
    replay_diff_ready: true,
    replay_route: "POST /research/runs/replay/plan" as const,
    replay_seed_ready: true,
    required_fields: REQUIRED_RESEARCH_RUN_FIELDS,
    route: "POST /research/runs/save/plan" as const,
    runtime_route: "GET /research/runtime" as const,
    sql_emitted: false,
    status: "research_run_save_scaffold" as const,
    supported_diffs: ["data", "model", "parameters"] as const,
    supported_snapshots: [
      "question",
      "tool_inputs",
      "evidence_records",
      "model_version",
      "prompt_version",
      "parameters"
    ] as const,
    tables: RESEARCH_RUN_TABLES,
    replay_tool_name: "replay_research_run" as const,
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
    parameters: normalizeParameters(input.parameters),
    promptVersion,
    question,
    toolCalls
  });
  const snapshotId = `research_snapshot_${snapshotHash}`;
  const parameterSnapshot = createParameterSnapshot(input.parameters);
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
    parameter_snapshot: parameterSnapshot,
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

export function createResearchRunReplayPlan(
  input: CreateResearchRunReplayPlanInput
): ResearchRunReplayPlan {
  const savedRun = input.savedRun;

  if (savedRun === undefined || normalizeText(savedRun.snapshot_id) === undefined) {
    throw new ResearchRunInputError(
      "SAVED_RUN_REQUIRED",
      "savedRun with snapshot_id is required"
    );
  }

  if (input.currentRun === undefined) {
    throw new ResearchRunInputError(
      "CURRENT_RUN_REQUIRED",
      "currentRun replay input is required"
    );
  }

  const currentRunPlan = createResearchRunSavePlan({
    ...input.currentRun,
    requestId: input.currentRun.requestId ?? input.requestId
  });
  const dataDiff = createResearchRunDataDiff(savedRun, currentRunPlan);
  const modelDiff = createResearchRunModelDiff(savedRun, currentRunPlan);
  const parameterDiff = createResearchRunParameterDiff(savedRun, currentRunPlan);
  const categories: ResearchRunDiffCategory[] = [
    dataDiff.changed ? "data" : undefined,
    modelDiff.changed ? "model" : undefined,
    parameterDiff.changed ? "parameters" : undefined
  ].filter((category): category is ResearchRunDiffCategory => category !== undefined);

  return {
    as_of: currentRunPlan.as_of,
    current_run_plan: currentRunPlan,
    data_version: RESEARCH_RUN_REPLAY_VERSION,
    diff_summary: {
      categories,
      changed: categories.length > 0,
      data_changed: dataDiff.changed,
      model_changed: modelDiff.changed,
      parameters_changed: parameterDiff.changed
    },
    diffs: {
      data: dataDiff,
      model: modelDiff,
      parameters: parameterDiff
    },
    frontend_rendering: false,
    immutable_report_snapshot: true,
    live_db_writes: false,
    methodology_version: RESEARCH_RUN_REPLAY_VERSION,
    old_report: {
      immutable_report_snapshot: true,
      mutation_allowed: false,
      preserved_snapshot_id: savedRun.snapshot_id,
      silent_rewrite_allowed: false
    },
    provenance: [
      {
        data_version: RESEARCH_RUN_REPLAY_VERSION,
        methodology_version: RESEARCH_RUN_REPLAY_VERSION,
        source: "research-run-replay-plan",
        source_record_id: `${savedRun.snapshot_id}_to_${currentRunPlan.snapshot_id}`
      },
      ...currentRunPlan.provenance
    ],
    replay_execution: {
      execution_status: "planned_no_write",
      live_model_call: false,
      live_tool_execution: false,
      sql_emitted: false
    },
    replay_reason: normalizeText(input.replayReason),
    replay_snapshot_id: currentRunPlan.snapshot_id,
    request_id: input.requestId,
    route: "POST /research/runs/replay/plan",
    saved_snapshot_id: savedRun.snapshot_id,
    sql_emitted: false,
    status: "planned_no_write",
    toolName: "replay_research_run",
    usage: {
      cached: false,
      credits: 1,
      rows:
        2 +
        dataDiff.changed_source_record_ids.length +
        modelDiffChangedCount(modelDiff) +
        parameterDiff.changed_keys.length
    },
    version: RESEARCH_RUN_REPLAY_VERSION
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

function createParameterSnapshot(
  parameters: Record<string, ResearchRunJsonValue> | undefined
): ResearchRunParameterSnapshot {
  const normalized = normalizeParameters(parameters);

  return {
    parameter_hash: hashStableValue(normalized),
    parameters: normalized,
    parameters_recorded: Object.keys(normalized).length > 0
  };
}

function normalizeParameters(
  parameters: Record<string, ResearchRunJsonValue> | undefined
): Record<string, ResearchRunJsonValue> {
  if (parameters === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parameters)
      .filter((entry): entry is [string, ResearchRunJsonValue] => {
        const [key, value] = entry;
        return key.length > 0 && value !== undefined;
      })
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function createResearchRunDataDiff(
  savedRun: ResearchRunSavePlan,
  currentRunPlan: ResearchRunSavePlan
): ResearchRunDataDiff {
  const previousEvidenceHash = hashStableValue(savedRun.evidence_snapshot.records);
  const currentEvidenceHash = hashStableValue(currentRunPlan.evidence_snapshot.records);
  const previousSourceRecordIds = collectSourceRecordIds(savedRun);
  const currentSourceRecordIds = collectSourceRecordIds(currentRunPlan);
  const changedDataVersions = compareStringMaps(
    collectDataVersionMap(savedRun),
    collectDataVersionMap(currentRunPlan)
  );

  return {
    changed:
      previousEvidenceHash !== currentEvidenceHash ||
      changedDataVersions.length > 0,
    changed_data_versions: changedDataVersions,
    changed_source_record_ids: symmetricDifference(
      previousSourceRecordIds,
      currentSourceRecordIds
    ),
    current_evidence_hash: currentEvidenceHash,
    current_source_record_ids: currentSourceRecordIds,
    data_version_changed: changedDataVersions.length > 0,
    previous_evidence_hash: previousEvidenceHash,
    previous_source_record_ids: previousSourceRecordIds
  };
}

function createResearchRunModelDiff(
  savedRun: ResearchRunSavePlan,
  currentRunPlan: ResearchRunSavePlan
): ResearchRunModelDiff {
  const previous = savedRun.model_snapshot;
  const current = currentRunPlan.model_snapshot;

  return {
    changed:
      previous.model_provider !== current.model_provider ||
      previous.model_version !== current.model_version ||
      previous.prompt_template_id !== current.prompt_template_id ||
      previous.prompt_version !== current.prompt_version,
    current_model_provider: current.model_provider,
    current_model_version: current.model_version,
    current_prompt_template_id: current.prompt_template_id,
    current_prompt_version: current.prompt_version,
    model_provider_changed: previous.model_provider !== current.model_provider,
    model_version_changed: previous.model_version !== current.model_version,
    previous_model_provider: previous.model_provider,
    previous_model_version: previous.model_version,
    previous_prompt_template_id: previous.prompt_template_id,
    previous_prompt_version: previous.prompt_version,
    prompt_template_changed: previous.prompt_template_id !== current.prompt_template_id,
    prompt_version_changed: previous.prompt_version !== current.prompt_version
  };
}

function createResearchRunParameterDiff(
  savedRun: ResearchRunSavePlan,
  currentRunPlan: ResearchRunSavePlan
): ResearchRunParameterDiff {
  const previousParameterSnapshot =
    savedRun.parameter_snapshot ?? createParameterSnapshot(undefined);
  const currentParameterSnapshot = currentRunPlan.parameter_snapshot;
  const previousToolInputHashes = savedRun.tool_input_snapshot.tool_calls.map(
    (toolCall) => toolCall.input_hash
  );
  const currentToolInputHashes = currentRunPlan.tool_input_snapshot.tool_calls.map(
    (toolCall) => toolCall.input_hash
  );
  const toolInputChanged =
    stableStringify(previousToolInputHashes) !== stableStringify(currentToolInputHashes);
  const questionChanged =
    savedRun.question_snapshot.question_hash !==
    currentRunPlan.question_snapshot.question_hash;
  const keyDiff = compareParameterKeys(
    previousParameterSnapshot.parameters,
    currentParameterSnapshot.parameters
  );

  return {
    added_keys: keyDiff.addedKeys,
    changed:
      previousParameterSnapshot.parameter_hash !==
        currentParameterSnapshot.parameter_hash ||
      toolInputChanged ||
      questionChanged,
    changed_keys: keyDiff.changedKeys,
    current_parameter_hash: currentParameterSnapshot.parameter_hash,
    current_parameters: currentParameterSnapshot.parameters,
    current_tool_input_hashes: currentToolInputHashes,
    previous_parameter_hash: previousParameterSnapshot.parameter_hash,
    previous_parameters: previousParameterSnapshot.parameters,
    previous_tool_input_hashes: previousToolInputHashes,
    question_changed: questionChanged,
    removed_keys: keyDiff.removedKeys,
    tool_input_changed: toolInputChanged
  };
}

function collectSourceRecordIds(plan: ResearchRunSavePlan): string[] {
  return uniqueSorted(
    plan.evidence_snapshot.records.flatMap((record) => record.source_record_ids)
  );
}

function collectDataVersionMap(plan: ResearchRunSavePlan): Map<string, string> {
  const entries = [
    ...plan.evidence_snapshot.records.flatMap((record) => [
      [`evidence:${record.evidence_record_id}:data_version`, record.data_version] as const,
      [
        `evidence:${record.evidence_record_id}:methodology_version`,
        record.methodology_version
      ] as const
    ]),
    ...plan.tool_input_snapshot.tool_calls.flatMap((toolCall) => [
      [`tool:${toolCall.tool_call_id}:data_version`, toolCall.data_version] as const,
      [
        `tool:${toolCall.tool_call_id}:methodology_version`,
        toolCall.methodology_version
      ] as const
    ])
  ];

  return new Map(entries);
}

function compareStringMaps(
  previous: Map<string, string>,
  current: Map<string, string>
): Array<{ current?: string; field: string; previous?: string }> {
  const changes: Array<{ current?: string; field: string; previous?: string }> = [];

  for (const field of uniqueSorted([...previous.keys(), ...current.keys()])) {
    const previousValue = previous.get(field);
    const currentValue = current.get(field);

    if (previousValue !== currentValue) {
      changes.push({
        current: currentValue,
        field,
        previous: previousValue
      });
    }
  }

  return changes;
}

function compareParameterKeys(
  previous: Record<string, ResearchRunJsonValue>,
  current: Record<string, ResearchRunJsonValue>
): { addedKeys: string[]; changedKeys: string[]; removedKeys: string[] } {
  const previousKeys = new Set(Object.keys(previous));
  const currentKeys = new Set(Object.keys(current));
  const addedKeys = uniqueSorted(
    [...currentKeys].filter((key) => !previousKeys.has(key))
  );
  const removedKeys = uniqueSorted(
    [...previousKeys].filter((key) => !currentKeys.has(key))
  );
  const changedKeys = uniqueSorted(
    [...previousKeys].filter(
      (key) =>
        currentKeys.has(key) &&
        stableStringify(previous[key]) !== stableStringify(current[key])
    )
  );

  return {
    addedKeys,
    changedKeys,
    removedKeys
  };
}

function symmetricDifference(left: string[], right: string[]): string[] {
  const leftSet = new Set(left);
  const rightSet = new Set(right);

  return uniqueSorted([
    ...left.filter((item) => !rightSet.has(item)),
    ...right.filter((item) => !leftSet.has(item))
  ]);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function modelDiffChangedCount(diff: ResearchRunModelDiff): number {
  return [
    diff.model_provider_changed,
    diff.model_version_changed,
    diff.prompt_template_changed,
    diff.prompt_version_changed
  ].filter(Boolean).length;
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
