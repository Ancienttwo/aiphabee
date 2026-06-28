export const RESEARCH_RUN_SAVE_VERSION =
  "2026-06-21.phase2.research-run-save-scaffold.v0";
export const RESEARCH_RUN_REPLAY_VERSION =
  "2026-06-21.phase2.research-run-replay-scaffold.v0";
export const DEEP_REPORT_WORKFLOW_VERSION =
  "2026-06-21.phase2.deep-report-workflow-scaffold.v0";
export const STATIC_REPORT_VERSION =
  "2026-06-21.phase3.static-report-metadata-scaffold.v0";
export const DATA_CORRECTION_NOTIFICATION_VERSION =
  "2026-06-21.phase2.data-correction-notifications-scaffold.v0";
export const GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION =
  "2026-06-21.phase3.golden-correction-rollback-drill-scaffold.v0";
export const DATA_CORRECTION_NOTIFICATION_CHANNELS = ["in_app", "email"] as const;
export const GOLDEN_CORRECTION_ROLLBACK_DRILL_STEPS = [
  "golden_fixture_gate",
  "correction_event_plan",
  "affected_report_mark",
  "user_notification_plan",
  "rollback_replay_plan"
] as const;
export const STATIC_REPORT_FORMATS = ["html", "pdf", "image"] as const;
export const STATIC_REPORT_REQUIRED_SCOPE = "exports.read";

export type ResearchRunSaveStatus = "planned_no_write";
export type ResearchRunReplayStatus = "planned_no_write";
export type ResearchRunDiffCategory = "data" | "model" | "parameters";
export type DeepReportWorkflowStatus = "planned_no_write";
export type StaticReportFormat = (typeof STATIC_REPORT_FORMATS)[number];
export type StaticReportStatus =
  | "blocked_metadata_incomplete"
  | "blocked_missing_context"
  | "blocked_unlicensed_scope"
  | "blocked_unsupported_format"
  | "planned_no_write";
export type DataCorrectionNotificationChannel =
  (typeof DATA_CORRECTION_NOTIFICATION_CHANNELS)[number];
export type DataCorrectionNotificationStatus =
  | "blocked_missing_context"
  | "planned_no_write";
export type DataCorrectionSeverity = "low" | "medium" | "high";
export type GoldenCorrectionRollbackDrillStep =
  (typeof GOLDEN_CORRECTION_ROLLBACK_DRILL_STEPS)[number];
export type GoldenCorrectionRollbackDrillStatus =
  | "blocked_missing_context"
  | "planned_no_write";
export type DeepReportWorkflowStageId =
  | "data_fetch"
  | "deterministic_analysis"
  | "section_generation"
  | "citation_validation"
  | "evidence_index"
  | "rerun_seed";
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

export interface CreateDeepReportWorkflowPlanInput {
  asOf?: string;
  dataDelayMinutes?: number;
  modelVersion?: string;
  promptVersion?: string;
  question?: string;
  reportId?: string;
  requestId: string;
  sections?: string[];
  securityQuery?: string;
  taskId?: string;
  userId?: string;
  workflowTaskId?: string;
  workspaceId?: string;
}

export interface CreateStaticReportPlanInput {
  asOf?: string;
  dataDelayMinutes?: number;
  dataVersion?: string;
  disclaimer?: string;
  format?: string;
  generatedAt?: string;
  methodologyVersion?: string;
  reportId?: string;
  requestId: string;
  rightsPolicyVersion?: string;
  scopes?: string[];
  sections?: string[];
  sourceRunId?: string;
  title?: string;
  userId?: string;
  workspaceId?: string;
}

export interface DataCorrectionSourceInput {
  correctedDataVersion?: string;
  correctionId?: string;
  previousDataVersion?: string;
  reason?: string;
  severity?: DataCorrectionSeverity;
  sourceRecordId?: string;
}

export interface CreateDataCorrectionNotificationPlanInput {
  affectedRuns?: ResearchRunSavePlan[];
  asOf?: string;
  corrections?: DataCorrectionSourceInput[];
  notificationChannels?: DataCorrectionNotificationChannel[];
  requestId: string;
  userId?: string;
  workspaceId?: string;
}

export interface CreateGoldenCorrectionRollbackDrillPlanInput {
  asOf?: string;
  correction?: DataCorrectionSourceInput;
  currentRun?: CreateResearchRunReplayCurrentRunInput;
  goldenManifestVersion?: string;
  goldenSampleCount?: number;
  notificationChannels?: DataCorrectionNotificationChannel[];
  qualityRuleCount?: number;
  requestId: string;
  rollbackReason?: string;
  savedRun?: ResearchRunSavePlan;
  toolGoldenSampleCount?: number;
  userId?: string;
  workspaceId?: string;
}

export interface DeepReportWorkflowStage {
  checkpoint_writes: false;
  input_contract: string[];
  live_tool_execution: false;
  model_calls: false;
  order: number;
  output_contract: string[];
  persistent_writes: false;
  requires_previous_stage: boolean;
  stage_id: DeepReportWorkflowStageId;
  status: DeepReportWorkflowStatus;
}

export interface DeepReportEvidenceIndexRecord {
  citation_status: "planned_validation";
  claim_label: "fact" | "calculation" | "inference" | "unknown";
  data_version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  evidence_record_id: string;
  methodology_version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  section_id: string;
  source_record_ids: string[];
}

export interface DeepReportWorkflowPlan {
  as_of: string;
  citation_validation: {
    every_claim_requires_evidence: true;
    required: true;
    status: DeepReportWorkflowStatus;
    unsupported_claim_label: "unknown";
  };
  data_fetch_plan: {
    live_tool_execution: false;
    output_contract: readonly ["source_record_id", "data_version", "methodology_version"];
    required_tools: readonly [
      "resolve_security",
      "get_entitlements",
      "get_security_profile",
      "get_quote_snapshot",
      "get_price_history",
      "get_financial_facts",
      "get_data_lineage",
      "search_announcements",
      "search_documents",
      "diff_announcements"
    ];
    registered_tools_only: true;
    status: DeepReportWorkflowStatus;
  };
  data_version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  deterministic_analysis_plan: {
    deterministic_calculations: true;
    model_calls: false;
    output_contract: readonly ["facts", "calculations", "inferences", "unknowns"];
    status: DeepReportWorkflowStatus;
  };
  evidence_index: {
    evidence_index_id: string;
    records: DeepReportEvidenceIndexRecord[];
    table: "aiphabee_core.deep_report_evidence_index";
    version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  };
  frontend_rendering: false;
  live_db_writes: false;
  live_tool_execution: false;
  methodology_version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  model_calls: false;
  persistence_plan: {
    checkpoint_writes: false;
    live_db_writes: false;
    r2_writes: false;
    sql_emitted: false;
    tables: readonly [
      "aiphabee_core.deep_report_snapshot",
      "aiphabee_core.deep_report_evidence_index",
      "aiphabee_core.workflow_task",
      "aiphabee_core.workflow_task_checkpoint"
    ];
    write_status: DeepReportWorkflowStatus;
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  report_id: string;
  report_snapshot: {
    as_of: string;
    data_delay_minutes: number;
    disclaimer: string;
    generated_at: string;
    immutable_report_snapshot: true;
    report_id: string;
    snapshot_id: string;
    static_report_allowed: true;
    table: "aiphabee_core.deep_report_snapshot";
    version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  };
  request_id: string;
  rerun: {
    data_model_parameter_diff_ready: true;
    deterministic_replay_ready: true;
    old_report_mutation_allowed: false;
    replay_route: "POST /research/runs/replay/plan";
    saved_snapshot_id: string;
    silent_rewrite_allowed: false;
  };
  section_plan: {
    generation_status: "planned_no_model";
    model_calls: false;
    sections: string[];
  };
  sql_emitted: false;
  stages: DeepReportWorkflowStage[];
  status: DeepReportWorkflowStatus;
  task_id: string;
  toolName: "plan_deep_report_workflow";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  usage_estimate: {
    debit_status: "not_debited";
    estimated_credits: number;
    failure_refund_ready: true;
    high_cost_confirmation_required: true;
  };
  user: {
    source: "request" | "synthetic_default";
    user_id: string;
  };
  version: typeof DEEP_REPORT_WORKFLOW_VERSION;
  workflow: {
    binding: "AIPHABEE_RESEARCH_WORKFLOW";
    checkpoint_writes: false;
    execution_status: DeepReportWorkflowStatus;
    live_execution: false;
    provider: "cloudflare_workflows";
    queue_writes: false;
    task_id: string;
  };
  workflow_task_id: string;
  workspace: {
    source: "request" | "synthetic_default";
    workspace_id: string;
  };
}

export interface StaticReportPlan {
  artifact: {
    html: "not_requested" | "planned_no_write";
    image: "not_requested" | "planned_no_write";
    pdf: "not_requested" | "planned_no_write";
    public_url: "not_generated";
    r2_write: false;
    written: false;
  };
  data_version: typeof STATIC_REPORT_VERSION;
  frontend_rendering: false;
  live_db_writes: false;
  live_tool_execution: false;
  metadata: {
    as_of: string;
    data_delay_minutes: number;
    data_version: string;
    disclaimer: string;
    generated_at: string;
    methodology_version: string;
    required_fields: readonly [
      "generated_at",
      "data_delay_minutes",
      "data_version",
      "methodology_version",
      "rights_policy_version",
      "disclaimer"
    ];
    rights_policy_version: string;
  };
  methodology_version: typeof STATIC_REPORT_VERSION;
  model_calls: false;
  persistence_plan: {
    artifact_writes: false;
    live_db_writes: false;
    r2_writes: false;
    sql_emitted: false;
    tables: typeof STATIC_REPORT_TABLES;
    write_status: "blocked" | "planned_no_write";
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  report: {
    format?: StaticReportFormat;
    report_id: string;
    sections: string[];
    source_run_id: string;
    static_report_allowed: boolean;
    table: "aiphabee_core.static_report_artifact";
    title: string;
  };
  request_id: string;
  rights_boundary: {
    allowed_scope_only: true;
    field_authorization_source: "data_access_gateway_or_report_snapshot";
    raw_partner_data_embedded: false;
    redistribution_requires_rights_policy: true;
    required_scope: typeof STATIC_REPORT_REQUIRED_SCOPE;
    scope_granted: boolean;
  };
  sql_emitted: false;
  status: StaticReportStatus;
  toolName: "plan_static_report_artifact";
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    metadata_complete: boolean;
    required_context_present: boolean;
    supported_format: boolean;
  };
  version: typeof STATIC_REPORT_VERSION;
  watermark: {
    fields: readonly [
      "request_id",
      "report_id",
      "generated_at",
      "data_delay_minutes",
      "data_version",
      "methodology_version",
      "rights_policy_version",
      "disclaimer"
    ];
    required: true;
    text: string;
  };
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
      "aiphabee_core.research_run",
      "aiphabee_core.research_run_tool_call",
      "aiphabee_core.research_run_evidence_snapshot",
      "aiphabee_core.research_run_model_snapshot"
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

export interface DataCorrectionNotificationCapabilities {
  affected_report_marking_required: true;
  event_queue: "AIPHABEE_EVENTS_QUEUE";
  evidence_snapshot_marking_required: true;
  frontend_rendering: false;
  live_db_writes: false;
  live_tool_execution: false;
  notification_fanout: false;
  package: "@aiphabee/research-runtime";
  persistent_writes: false;
  route: "POST /research/data-corrections/plan";
  runtime_route: "GET /research/runtime";
  saved_report_notification_required: true;
  sql_emitted: false;
  status: "data_correction_notifications_scaffold";
  supported_notification_channels: readonly DataCorrectionNotificationChannel[];
  tables: readonly [
    "aiphabee_core.data_correction_event",
    "aiphabee_core.research_run_correction_impact",
    "aiphabee_core.user_notification"
  ];
  tool_name: "plan_data_correction_notifications";
  version: typeof DATA_CORRECTION_NOTIFICATION_VERSION;
}

export interface GoldenCorrectionRollbackDrillCapabilities {
  correction_route: "POST /research/data-corrections/plan";
  frontend_rendering: false;
  golden_fixture_command: "npm run test:golden";
  golden_manifest_path: "tests/golden/manifest.json";
  live_db_writes: false;
  live_rollback_execution: false;
  package: "@aiphabee/research-runtime";
  persistent_writes: false;
  replay_route: "POST /research/runs/replay/plan";
  required_steps: typeof GOLDEN_CORRECTION_ROLLBACK_DRILL_STEPS;
  route: "POST /research/golden-correction-rollback-drill/plan";
  runtime_route: "GET /research/runtime";
  sql_emitted: false;
  status: "golden_correction_rollback_drill_scaffold";
  tables: readonly [
    "aiphabee_core.golden_correction_rollback_drill",
    "aiphabee_governance.golden_correction_rollback_drill_contract",
    "aiphabee_core.data_correction_event",
    "aiphabee_core.research_run_correction_impact"
  ];
  tool_golden_manifest_path: "tests/golden/tools/manifest.json";
  version: typeof GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION;
}

export interface DataCorrectionEventPlan {
  corrected_data_version: string;
  correction_event_id: string;
  previous_data_version?: string;
  reason: string;
  severity: DataCorrectionSeverity;
  source_record_id: string;
  table: "aiphabee_core.data_correction_event";
  write_status: "blocked" | "planned_no_write";
}

export interface DataCorrectionImpactPlan {
  evidence_record_ids: string[];
  impact_id: string;
  impacted_source_record_ids: string[];
  notification_required: true;
  research_run_id: string;
  snapshot_id: string;
  table: "aiphabee_core.research_run_correction_impact";
  user_id: string;
  workspace_id: string;
  write_status: "blocked" | "planned_no_write";
}

export interface DataCorrectionUserNotificationPlan {
  channel: DataCorrectionNotificationChannel;
  event_queue: "AIPHABEE_EVENTS_QUEUE";
  fanout_status: "planned_no_write";
  notification_event_id: string;
  research_run_id: string;
  snapshot_id: string;
  table: "aiphabee_core.user_notification";
  user_id: string;
  workspace_id: string;
}

export interface DataCorrectionNotificationPlan {
  affected_reports: {
    count: number;
    items: DataCorrectionImpactPlan[];
    marking_status: "blocked" | "planned_no_write";
  };
  as_of: string;
  corrections: DataCorrectionEventPlan[];
  data_version: typeof DATA_CORRECTION_NOTIFICATION_VERSION;
  frontend_rendering: false;
  live_db_writes: false;
  live_tool_execution: false;
  methodology_version: typeof DATA_CORRECTION_NOTIFICATION_VERSION;
  notification_fanout: false;
  notification_plan: {
    channels: DataCorrectionNotificationChannel[];
    event_queue: "AIPHABEE_EVENTS_QUEUE";
    fanout_status: "planned_no_write";
    notification_required: true;
    notifications: DataCorrectionUserNotificationPlan[];
    table: "aiphabee_core.user_notification";
    user_notification_count: number;
  };
  persistence_plan: {
    live_db_writes: false;
    queue_writes: false;
    sql_emitted: false;
    tables: DataCorrectionNotificationCapabilities["tables"];
    write_status: "blocked" | "planned_no_write";
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  replay: {
    old_report_mutation_allowed: false;
    replay_route: "POST /research/runs/replay/plan";
    rerun_recommended: boolean;
    silent_rewrite_allowed: false;
  };
  request_id: string;
  sql_emitted: false;
  status: DataCorrectionNotificationStatus;
  toolName: "plan_data_correction_notifications";
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    affected_reports_present: boolean;
    corrections_present: boolean;
    required_context_present: boolean;
  };
  version: typeof DATA_CORRECTION_NOTIFICATION_VERSION;
}

export interface GoldenCorrectionRollbackDrillPlan {
  as_of: string;
  correction_notification_plan: DataCorrectionNotificationPlan;
  data_version: typeof GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION;
  drill_steps: Array<{
    live_execution: false;
    order: number;
    status: GoldenCorrectionRollbackDrillStatus;
    step_id: GoldenCorrectionRollbackDrillStep;
  }>;
  frontend_rendering: false;
  golden_fixture_gate: {
    command: "npm run test:golden";
    manifest_path: "tests/golden/manifest.json";
    passed: true;
    production_partner_corpus_loaded: false;
    quality_rule_count: number;
    sample_count: number;
    status: "synthetic_fixture_gate_passed";
    tool_golden_manifest_path: "tests/golden/tools/manifest.json";
    tool_sample_count: number;
    version: string;
  };
  live_db_writes: false;
  live_rollback_execution: false;
  methodology_version: typeof GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION;
  persistence_plan: {
    live_db_writes: false;
    queue_writes: false;
    sql_emitted: false;
    tables: GoldenCorrectionRollbackDrillCapabilities["tables"];
    write_status: "planned_no_write";
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  rollback_replay_plan: ResearchRunReplayPlan;
  sql_emitted: false;
  status: GoldenCorrectionRollbackDrillStatus;
  toolName: "plan_golden_correction_rollback_drill";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  validation: {
    correction_plan_ready: boolean;
    golden_fixture_gate_passed: true;
    old_report_immutable: boolean;
    required_context_present: boolean;
    rollback_replay_ready: boolean;
  };
  version: typeof GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION;
}

const REQUIRED_RESEARCH_RUN_FIELDS = [
  "question",
  "tool_calls",
  "evidence_records",
  "model_version",
  "prompt_version"
] as const;
const RESEARCH_RUN_TABLES = [
  "aiphabee_core.research_run",
  "aiphabee_core.research_run_tool_call",
  "aiphabee_core.research_run_evidence_snapshot",
  "aiphabee_core.research_run_model_snapshot"
] as const;
const DEEP_REPORT_WORKFLOW_TABLES = [
  "aiphabee_core.deep_report_snapshot",
  "aiphabee_core.deep_report_evidence_index",
  "aiphabee_core.workflow_task",
  "aiphabee_core.workflow_task_checkpoint"
] as const;
const STATIC_REPORT_TABLES = [
  "aiphabee_core.static_report_artifact",
  "aiphabee_audit.static_report_event",
  "aiphabee_governance.static_report_contract"
] as const;
const DATA_CORRECTION_NOTIFICATION_TABLES = [
  "aiphabee_core.data_correction_event",
  "aiphabee_core.research_run_correction_impact",
  "aiphabee_core.user_notification"
] as const;
const GOLDEN_CORRECTION_ROLLBACK_DRILL_TABLES = [
  "aiphabee_core.golden_correction_rollback_drill",
  "aiphabee_governance.golden_correction_rollback_drill_contract",
  "aiphabee_core.data_correction_event",
  "aiphabee_core.research_run_correction_impact"
] as const;
const DEFAULT_DEEP_REPORT_TOOLS = [
  "resolve_security",
  "get_entitlements",
  "get_security_profile",
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts",
  "get_data_lineage",
  "search_announcements",
  "search_documents",
  "diff_announcements"
] as const;
const DEFAULT_DEEP_REPORT_SECTIONS = [
  "executive_summary",
  "business_snapshot",
  "financial_analysis",
  "risk_events",
  "evidence_appendix",
  "disclaimer"
] as const;
const DEEP_REPORT_WORKFLOW_STAGE_DEFINITIONS: Array<{
  id: DeepReportWorkflowStageId;
  input: string[];
  output: string[];
}> = [
  {
    id: "data_fetch",
    input: ["question", "security_query", "as_of"],
    output: ["tool_input_snapshot", "source_records"]
  },
  {
    id: "deterministic_analysis",
    input: ["source_records", "methodology_version"],
    output: ["facts", "calculations", "unknowns"]
  },
  {
    id: "section_generation",
    input: ["facts", "calculations", "unknowns", "section_plan"],
    output: ["section_drafts"]
  },
  {
    id: "citation_validation",
    input: ["section_drafts", "source_records"],
    output: ["citation_status", "unsupported_claims"]
  },
  {
    id: "evidence_index",
    input: ["citation_status", "source_records"],
    output: ["evidence_index_records"]
  },
  {
    id: "rerun_seed",
    input: ["report_snapshot", "evidence_index_records"],
    output: ["saved_snapshot_id", "replay_route"]
  }
];

export function getResearchRuntimeCapabilities() {
  return {
    data_correction_notifications: getDataCorrectionNotificationCapabilities(),
    deep_report_workflow: getDeepReportWorkflowCapabilities(),
    frontend_rendering: false,
    golden_correction_rollback_drill: getGoldenCorrectionRollbackDrillCapabilities(),
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
    static_report_artifact: getStaticReportCapabilities(),
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

export function getDataCorrectionNotificationCapabilities(): DataCorrectionNotificationCapabilities {
  return {
    affected_report_marking_required: true,
    event_queue: "AIPHABEE_EVENTS_QUEUE",
    evidence_snapshot_marking_required: true,
    frontend_rendering: false,
    live_db_writes: false,
    live_tool_execution: false,
    notification_fanout: false,
    package: "@aiphabee/research-runtime",
    persistent_writes: false,
    route: "POST /research/data-corrections/plan",
    runtime_route: "GET /research/runtime",
    saved_report_notification_required: true,
    sql_emitted: false,
    status: "data_correction_notifications_scaffold",
    supported_notification_channels: DATA_CORRECTION_NOTIFICATION_CHANNELS,
    tables: DATA_CORRECTION_NOTIFICATION_TABLES,
    tool_name: "plan_data_correction_notifications",
    version: DATA_CORRECTION_NOTIFICATION_VERSION
  };
}

export function getGoldenCorrectionRollbackDrillCapabilities(): GoldenCorrectionRollbackDrillCapabilities {
  return {
    correction_route: "POST /research/data-corrections/plan",
    frontend_rendering: false,
    golden_fixture_command: "npm run test:golden",
    golden_manifest_path: "tests/golden/manifest.json",
    live_db_writes: false,
    live_rollback_execution: false,
    package: "@aiphabee/research-runtime",
    persistent_writes: false,
    replay_route: "POST /research/runs/replay/plan",
    required_steps: GOLDEN_CORRECTION_ROLLBACK_DRILL_STEPS,
    route: "POST /research/golden-correction-rollback-drill/plan",
    runtime_route: "GET /research/runtime",
    sql_emitted: false,
    status: "golden_correction_rollback_drill_scaffold",
    tables: GOLDEN_CORRECTION_ROLLBACK_DRILL_TABLES,
    tool_golden_manifest_path: "tests/golden/tools/manifest.json",
    version: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION
  };
}

export function getDeepReportWorkflowCapabilities() {
  return {
    citation_validation_required: true,
    evidence_index_required: true,
    frontend_rendering: false,
    high_cost_confirmation_required: true,
    live_db_writes: false,
    live_tool_execution: false,
    live_workflow_execution: false,
    model_calls: false,
    package: "@aiphabee/research-runtime" as const,
    replay_route: "POST /research/runs/replay/plan" as const,
    route: "POST /research/reports/deep/plan" as const,
    runtime_route: "GET /research/runtime" as const,
    sql_emitted: false,
    stages: DEEP_REPORT_WORKFLOW_STAGE_DEFINITIONS.map((stage) => stage.id),
    status: "deep_report_workflow_scaffold" as const,
    tables: DEEP_REPORT_WORKFLOW_TABLES,
    tool_name: "plan_deep_report_workflow" as const,
    version: DEEP_REPORT_WORKFLOW_VERSION,
    workflow_binding: "AIPHABEE_RESEARCH_WORKFLOW" as const
  };
}

export function getStaticReportCapabilities() {
  return {
    artifact_writes: false,
    data_delay_required: true,
    disclaimer_required: true,
    frontend_rendering: false,
    generated_at_required: true,
    live_db_writes: false,
    live_tool_execution: false,
    metadata_required_fields: [
      "generated_at",
      "data_delay_minutes",
      "data_version",
      "methodology_version",
      "rights_policy_version",
      "disclaimer"
    ] as const,
    model_calls: false,
    package: "@aiphabee/research-runtime" as const,
    persistent_writes: false,
    required_scope: STATIC_REPORT_REQUIRED_SCOPE,
    rights_policy_required: true,
    route: "POST /research/reports/static/plan" as const,
    runtime_route: "GET /research/runtime" as const,
    sql_emitted: false,
    status: "static_report_metadata_scaffold" as const,
    supported_formats: STATIC_REPORT_FORMATS,
    tables: STATIC_REPORT_TABLES,
    tool_name: "plan_static_report_artifact" as const,
    version: STATIC_REPORT_VERSION,
    watermark_required: true
  };
}

export function createDataCorrectionNotificationPlan(
  input: CreateDataCorrectionNotificationPlanInput
): DataCorrectionNotificationPlan {
  const asOf = normalizeAsOf(input.asOf);
  const corrections = normalizeDataCorrectionEvents(input.corrections);
  const sourceRecordIds = new Set(corrections.map((correction) => correction.source_record_id));
  const userId = normalizeText(input.userId);
  const workspaceId = normalizeText(input.workspaceId);
  const channels = normalizeDataCorrectionNotificationChannels(input.notificationChannels);
  const impactedReports = createDataCorrectionImpacts(
    input.affectedRuns ?? [],
    sourceRecordIds,
    userId,
    workspaceId
  );
  const correctionsPresent = corrections.length > 0;
  const affectedReportsPresent = impactedReports.length > 0;
  const status: DataCorrectionNotificationStatus =
    correctionsPresent && affectedReportsPresent
      ? "planned_no_write"
      : "blocked_missing_context";
  const writeStatus = status === "planned_no_write" ? "planned_no_write" : "blocked";
  const notificationPlans = createDataCorrectionNotificationItems(
    impactedReports,
    channels
  );

  return {
    affected_reports: {
      count: impactedReports.length,
      items: impactedReports.map((impact) => ({
        ...impact,
        write_status: writeStatus
      })),
      marking_status: writeStatus
    },
    as_of: asOf,
    corrections: corrections.map((correction) => ({
      ...correction,
      write_status: writeStatus
    })),
    data_version: DATA_CORRECTION_NOTIFICATION_VERSION,
    frontend_rendering: false,
    live_db_writes: false,
    live_tool_execution: false,
    methodology_version: DATA_CORRECTION_NOTIFICATION_VERSION,
    notification_fanout: false,
    notification_plan: {
      channels,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write",
      notification_required: true,
      notifications: notificationPlans,
      table: "aiphabee_core.user_notification",
      user_notification_count: notificationPlans.length
    },
    persistence_plan: {
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: DATA_CORRECTION_NOTIFICATION_TABLES,
      write_status: writeStatus
    },
    provenance: [
      {
        data_version: DATA_CORRECTION_NOTIFICATION_VERSION,
        methodology_version: DATA_CORRECTION_NOTIFICATION_VERSION,
        source: "data-correction-notification-plan",
        source_record_id: `data_correction_${hashStableValue({
          corrections: corrections.map((correction) => correction.correction_event_id),
          requestId: input.requestId
        })}`
      },
      ...impactedReports.map((impact) => ({
        data_version: DATA_CORRECTION_NOTIFICATION_VERSION,
        methodology_version: DATA_CORRECTION_NOTIFICATION_VERSION,
        source: "research-run-correction-impact",
        source_record_id: impact.impact_id
      }))
    ],
    replay: {
      old_report_mutation_allowed: false,
      replay_route: "POST /research/runs/replay/plan",
      rerun_recommended: affectedReportsPresent,
      silent_rewrite_allowed: false
    },
    request_id: input.requestId,
    sql_emitted: false,
    status,
    toolName: "plan_data_correction_notifications",
    usage: {
      cached: false,
      credits: 0,
      rows: corrections.length + impactedReports.length + notificationPlans.length
    },
    validation: {
      affected_reports_present: affectedReportsPresent,
      corrections_present: correctionsPresent,
      required_context_present: correctionsPresent && affectedReportsPresent
    },
    version: DATA_CORRECTION_NOTIFICATION_VERSION
  };
}

export function createGoldenCorrectionRollbackDrillPlan(
  input: CreateGoldenCorrectionRollbackDrillPlanInput
): GoldenCorrectionRollbackDrillPlan {
  const asOf = normalizeAsOf(input.asOf);
  const userId = normalizeText(input.userId) ?? "user_internal_alpha";
  const workspaceId = normalizeText(input.workspaceId) ?? "workspace_research";
  const correction = createGoldenDrillCorrection(input.correction);
  const savedRun =
    input.savedRun ??
    createGoldenDrillSavedRun({
      asOf,
      correction,
      requestId: input.requestId,
      userId,
      workspaceId
    });
  const correctionNotificationPlan = createDataCorrectionNotificationPlan({
    affectedRuns: [savedRun],
    asOf,
    corrections: [correction],
    notificationChannels: input.notificationChannels ?? ["in_app"],
    requestId: `${input.requestId}:correction`,
    userId,
    workspaceId
  });
  const rollbackReplayPlan = createResearchRunReplayPlan({
    currentRun:
      input.currentRun ??
      createGoldenDrillCurrentRunInput({
        asOf,
        correction,
        requestId: input.requestId,
        userId,
        workspaceId
      }),
    replayReason: normalizeText(input.rollbackReason) ?? "golden_correction_rollback_drill",
    requestId: `${input.requestId}:rollback`,
    savedRun
  });
  const correctionPlanReady = correctionNotificationPlan.status === "planned_no_write";
  const rollbackReplayReady = rollbackReplayPlan.status === "planned_no_write";
  const oldReportImmutable =
    rollbackReplayPlan.old_report.immutable_report_snapshot &&
    !rollbackReplayPlan.old_report.mutation_allowed &&
    !rollbackReplayPlan.old_report.silent_rewrite_allowed;
  const status: GoldenCorrectionRollbackDrillStatus =
    correctionPlanReady && rollbackReplayReady && oldReportImmutable
      ? "planned_no_write"
      : "blocked_missing_context";

  return {
    as_of: asOf,
    correction_notification_plan: correctionNotificationPlan,
    data_version: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION,
    drill_steps: GOLDEN_CORRECTION_ROLLBACK_DRILL_STEPS.map((step, index) => ({
      live_execution: false,
      order: index + 1,
      status,
      step_id: step
    })),
    frontend_rendering: false,
    golden_fixture_gate: {
      command: "npm run test:golden",
      manifest_path: "tests/golden/manifest.json",
      passed: true,
      production_partner_corpus_loaded: false,
      quality_rule_count: normalizePositiveInteger(input.qualityRuleCount) ?? 12,
      sample_count: normalizePositiveInteger(input.goldenSampleCount) ?? 8,
      status: "synthetic_fixture_gate_passed",
      tool_golden_manifest_path: "tests/golden/tools/manifest.json",
      tool_sample_count: normalizePositiveInteger(input.toolGoldenSampleCount) ?? 16,
      version:
        normalizeText(input.goldenManifestVersion) ??
        "golden-fixtures-version=2026-06-20.phase0.v0"
    },
    live_db_writes: false,
    live_rollback_execution: false,
    methodology_version: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION,
    persistence_plan: {
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: GOLDEN_CORRECTION_ROLLBACK_DRILL_TABLES,
      write_status: "planned_no_write"
    },
    provenance: [
      {
        data_version: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION,
        methodology_version: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION,
        source: "golden-correction-rollback-drill",
        source_record_id: `golden_correction_rollback_${hashStableValue({
          correction: correction.sourceRecordId,
          requestId: input.requestId,
          savedSnapshot: savedRun.snapshot_id
        })}`
      },
      {
        data_version: DATA_CORRECTION_NOTIFICATION_VERSION,
        methodology_version: DATA_CORRECTION_NOTIFICATION_VERSION,
        source: "data-correction-notification-plan",
        source_record_id: correctionNotificationPlan.provenance[0]?.source_record_id ?? "correction_plan"
      },
      {
        data_version: RESEARCH_RUN_REPLAY_VERSION,
        methodology_version: RESEARCH_RUN_REPLAY_VERSION,
        source: "research-run-replay-plan",
        source_record_id: `${rollbackReplayPlan.saved_snapshot_id}_to_${rollbackReplayPlan.replay_snapshot_id}`
      }
    ],
    request_id: input.requestId,
    rollback_replay_plan: rollbackReplayPlan,
    sql_emitted: false,
    status,
    toolName: "plan_golden_correction_rollback_drill",
    usage: {
      cached: false,
      credits: correctionNotificationPlan.usage.credits + rollbackReplayPlan.usage.credits,
      rows:
        GOLDEN_CORRECTION_ROLLBACK_DRILL_STEPS.length +
        correctionNotificationPlan.usage.rows +
        rollbackReplayPlan.usage.rows
    },
    validation: {
      correction_plan_ready: correctionPlanReady,
      golden_fixture_gate_passed: true,
      old_report_immutable: oldReportImmutable,
      required_context_present: correctionPlanReady && rollbackReplayReady,
      rollback_replay_ready: rollbackReplayReady
    },
    version: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION
  };
}

function createGoldenDrillCorrection(
  correction: DataCorrectionSourceInput | undefined
): DataCorrectionSourceInput {
  return {
    correctedDataVersion:
      normalizeText(correction?.correctedDataVersion) ?? "golden-fixtures-corrected-v1",
    correctionId:
      normalizeText(correction?.correctionId) ?? "correction_src_hk_financial_restatement_pass_001",
    previousDataVersion: normalizeText(correction?.previousDataVersion) ?? "golden-fixtures-v0",
    reason: normalizeText(correction?.reason) ?? "golden_correction_rollback_drill",
    severity: correction?.severity ?? "high",
    sourceRecordId:
      normalizeText(correction?.sourceRecordId) ?? "src_hk_financial_restatement_pass_001"
  };
}

function createGoldenDrillSavedRun(input: {
  asOf: string;
  correction: DataCorrectionSourceInput;
  requestId: string;
  userId: string;
  workspaceId: string;
}): ResearchRunSavePlan {
  const sourceRecordId =
    normalizeText(input.correction.sourceRecordId) ?? "src_hk_financial_restatement_pass_001";
  const dataVersion = normalizeText(input.correction.previousDataVersion) ?? "golden-fixtures-v0";

  return createResearchRunSavePlan({
    answerHash: "answer_hash_golden_correction_before",
    asOf: input.asOf,
    channel: "web",
    evidenceRecords: [
      {
        citationLabel: "golden-correction-source",
        dataVersion,
        evidenceRecordId: "evidence_golden_correction_before",
        methodologyVersion: "quality_rules_v0",
        sourceRecordIds: [sourceRecordId]
      }
    ],
    modelProvider: "deterministic_drill",
    modelVersion: "golden-correction-drill-model-v0",
    parameters: {
      drill: "golden_correction_rollback",
      phase: "before_correction"
    },
    promptVersion: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION,
    question: "Golden correction rollback drill",
    requestId: `${input.requestId}:saved`,
    runId: "research_run_golden_correction_drill",
    toolCalls: [
      {
        dataVersion,
        input: {
          as_of: input.asOf,
          instrument_id: "eq_hk_00700",
          source_record_id: sourceRecordId
        },
        inputSchemaId: "tool.get_financial_facts.input.v0",
        methodologyVersion: "financial-quality-v0",
        outputSchemaId: "tool.get_financial_facts.output.v0",
        requestId: `${input.requestId}:tool-before`,
        toolCallId: "tool_call_golden_correction_before",
        toolName: "get_financial_facts",
        toolVersion: "1"
      }
    ],
    userId: input.userId,
    workspaceId: input.workspaceId
  });
}

function createGoldenDrillCurrentRunInput(input: {
  asOf: string;
  correction: DataCorrectionSourceInput;
  requestId: string;
  userId: string;
  workspaceId: string;
}): CreateResearchRunReplayCurrentRunInput {
  const sourceRecordId =
    normalizeText(input.correction.sourceRecordId) ?? "src_hk_financial_restatement_pass_001";
  const dataVersion =
    normalizeText(input.correction.correctedDataVersion) ?? "golden-fixtures-corrected-v1";

  return {
    answerHash: "answer_hash_golden_correction_after",
    asOf: input.asOf,
    channel: "web",
    evidenceRecords: [
      {
        citationLabel: "golden-correction-source",
        dataVersion,
        evidenceRecordId: "evidence_golden_correction_after",
        methodologyVersion: "quality_rules_v0",
        sourceRecordIds: [sourceRecordId]
      }
    ],
    modelProvider: "deterministic_drill",
    modelVersion: "golden-correction-drill-model-v0",
    parameters: {
      drill: "golden_correction_rollback",
      phase: "after_correction"
    },
    promptVersion: GOLDEN_CORRECTION_ROLLBACK_DRILL_VERSION,
    question: "Golden correction rollback drill",
    requestId: `${input.requestId}:current`,
    runId: "research_run_golden_correction_drill_replay",
    toolCalls: [
      {
        dataVersion,
        input: {
          as_of: input.asOf,
          instrument_id: "eq_hk_00700",
          source_record_id: sourceRecordId
        },
        inputSchemaId: "tool.get_financial_facts.input.v0",
        methodologyVersion: "financial-quality-v0",
        outputSchemaId: "tool.get_financial_facts.output.v0",
        requestId: `${input.requestId}:tool-after`,
        toolCallId: "tool_call_golden_correction_after",
        toolName: "get_financial_facts",
        toolVersion: "1"
      }
    ],
    userId: input.userId,
    workspaceId: input.workspaceId
  };
}

export function createDeepReportWorkflowPlan(
  input: CreateDeepReportWorkflowPlanInput
): DeepReportWorkflowPlan {
  const asOf = normalizeAsOf(input.asOf);
  const question = normalizeText(input.question);

  if (question === undefined) {
    throw new ResearchRunInputError("QUESTION_REQUIRED", "question is required");
  }

  const sections = normalizeDeepReportSections(input.sections);
  const modelVersion = normalizeText(input.modelVersion) ?? "model.not_configured";
  const promptVersion = normalizeText(input.promptVersion) ?? DEEP_REPORT_WORKFLOW_VERSION;
  const dataDelayMinutes = normalizePositiveInteger(input.dataDelayMinutes) ?? 15;
  const userId = normalizeText(input.userId);
  const workspaceId = normalizeText(input.workspaceId);
  const securityQuery = normalizeText(input.securityQuery);
  const reportHash = hashStableValue({
    asOf,
    modelVersion,
    promptVersion,
    question,
    requestId: input.requestId,
    sections,
    securityQuery
  });
  const reportId = normalizeText(input.reportId) ?? `deep_report_${reportHash}`;
  const workflowTaskId =
    normalizeText(input.workflowTaskId) ??
    normalizeText(input.taskId) ??
    `workflow_task_${reportHash}`;
  const snapshotId = `deep_report_snapshot_${reportHash}`;
  const evidenceIndexId = `deep_report_evidence_index_${reportHash}`;
  const evidenceRecords = createDeepReportEvidenceIndexRecords(
    evidenceIndexId,
    sections
  );
  const usageCredits = 20;

  return {
    as_of: asOf,
    citation_validation: {
      every_claim_requires_evidence: true,
      required: true,
      status: "planned_no_write",
      unsupported_claim_label: "unknown"
    },
    data_fetch_plan: {
      live_tool_execution: false,
      output_contract: ["source_record_id", "data_version", "methodology_version"],
      registered_tools_only: true,
      required_tools: DEFAULT_DEEP_REPORT_TOOLS,
      status: "planned_no_write"
    },
    data_version: DEEP_REPORT_WORKFLOW_VERSION,
    deterministic_analysis_plan: {
      deterministic_calculations: true,
      model_calls: false,
      output_contract: ["facts", "calculations", "inferences", "unknowns"],
      status: "planned_no_write"
    },
    evidence_index: {
      evidence_index_id: evidenceIndexId,
      records: evidenceRecords,
      table: "aiphabee_core.deep_report_evidence_index",
      version: DEEP_REPORT_WORKFLOW_VERSION
    },
    frontend_rendering: false,
    live_db_writes: false,
    live_tool_execution: false,
    methodology_version: DEEP_REPORT_WORKFLOW_VERSION,
    model_calls: false,
    persistence_plan: {
      checkpoint_writes: false,
      live_db_writes: false,
      r2_writes: false,
      sql_emitted: false,
      tables: DEEP_REPORT_WORKFLOW_TABLES,
      write_status: "planned_no_write"
    },
    provenance: [
      {
        data_version: DEEP_REPORT_WORKFLOW_VERSION,
        methodology_version: DEEP_REPORT_WORKFLOW_VERSION,
        source: "deep-report-workflow-plan",
        source_record_id: snapshotId
      },
      ...evidenceRecords.flatMap((record) =>
        record.source_record_ids.map((sourceRecordId) => ({
          data_version: record.data_version,
          methodology_version: record.methodology_version,
          source: "deep-report-evidence-index",
          source_record_id: sourceRecordId
        }))
      )
    ],
    report_id: reportId,
    report_snapshot: {
      as_of: asOf,
      data_delay_minutes: dataDelayMinutes,
      disclaimer:
        "Generated as a research scaffold with delayed synthetic data; not investment advice.",
      generated_at: asOf,
      immutable_report_snapshot: true,
      report_id: reportId,
      snapshot_id: snapshotId,
      static_report_allowed: true,
      table: "aiphabee_core.deep_report_snapshot",
      version: DEEP_REPORT_WORKFLOW_VERSION
    },
    request_id: input.requestId,
    rerun: {
      data_model_parameter_diff_ready: true,
      deterministic_replay_ready: true,
      old_report_mutation_allowed: false,
      replay_route: "POST /research/runs/replay/plan",
      saved_snapshot_id: snapshotId,
      silent_rewrite_allowed: false
    },
    section_plan: {
      generation_status: "planned_no_model",
      model_calls: false,
      sections
    },
    sql_emitted: false,
    stages: createDeepReportWorkflowStages(),
    status: "planned_no_write",
    task_id: workflowTaskId,
    toolName: "plan_deep_report_workflow",
    usage: {
      cached: false,
      credits: usageCredits,
      rows:
        DEEP_REPORT_WORKFLOW_STAGE_DEFINITIONS.length +
        DEFAULT_DEEP_REPORT_TOOLS.length +
        sections.length +
        evidenceRecords.length
    },
    usage_estimate: {
      debit_status: "not_debited",
      estimated_credits: usageCredits,
      failure_refund_ready: true,
      high_cost_confirmation_required: true
    },
    user: {
      source: userId === undefined ? "synthetic_default" : "request",
      user_id: userId ?? "user_internal_alpha"
    },
    version: DEEP_REPORT_WORKFLOW_VERSION,
    workflow: {
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      checkpoint_writes: false,
      execution_status: "planned_no_write",
      live_execution: false,
      provider: "cloudflare_workflows",
      queue_writes: false,
      task_id: workflowTaskId
    },
    workflow_task_id: workflowTaskId,
    workspace: {
      source: workspaceId === undefined ? "synthetic_default" : "request",
      workspace_id: workspaceId ?? "workspace_research"
    }
  };
}

export function createStaticReportPlan(input: CreateStaticReportPlanInput): StaticReportPlan {
  const asOf = normalizeAsOf(input.asOf);
  const generatedAt = normalizeAsOf(input.generatedAt ?? input.asOf);
  const dataDelayMinutes = normalizePositiveInteger(input.dataDelayMinutes);
  const dataVersion = normalizeText(input.dataVersion) ?? STATIC_REPORT_VERSION;
  const methodologyVersion = normalizeText(input.methodologyVersion) ?? STATIC_REPORT_VERSION;
  const rightsPolicyVersion =
    normalizeText(input.rightsPolicyVersion) ?? "static-report-default-deny-v0";
  const disclaimer =
    normalizeText(input.disclaimer) ??
    "Generated as a static research report with delayed data; not investment advice.";
  const format = normalizeStaticReportFormat(input.format ?? "pdf");
  const reportHash = hashStableValue({
    asOf,
    dataVersion,
    generatedAt,
    requestId: input.requestId,
    sourceRunId: input.sourceRunId,
    title: input.title
  });
  const reportId = normalizeText(input.reportId) ?? `static_report_${reportHash}`;
  const sourceRunId = normalizeText(input.sourceRunId);
  const workspaceId = normalizeText(input.workspaceId);
  const scopeGranted = (input.scopes ?? []).includes(STATIC_REPORT_REQUIRED_SCOPE);
  const requiredContextPresent = sourceRunId !== undefined && workspaceId !== undefined;
  const metadataComplete =
    dataDelayMinutes !== undefined &&
    dataVersion.length > 0 &&
    methodologyVersion.length > 0 &&
    rightsPolicyVersion.length > 0 &&
    disclaimer.length > 0;
  const supportedFormat = format !== undefined;
  const status = getStaticReportStatus({
    metadataComplete,
    requiredContextPresent,
    scopeGranted,
    supportedFormat
  });
  const writeStatus = status === "planned_no_write" ? "planned_no_write" : "blocked";
  const sections = normalizeDeepReportSections(input.sections);
  const usageRows = status === "planned_no_write" ? 6 + sections.length : 0;

  return {
    artifact: {
      html: format === "html" && status === "planned_no_write" ? "planned_no_write" : "not_requested",
      image:
        format === "image" && status === "planned_no_write" ? "planned_no_write" : "not_requested",
      pdf: format === "pdf" && status === "planned_no_write" ? "planned_no_write" : "not_requested",
      public_url: "not_generated",
      r2_write: false,
      written: false
    },
    data_version: STATIC_REPORT_VERSION,
    frontend_rendering: false,
    live_db_writes: false,
    live_tool_execution: false,
    metadata: {
      as_of: asOf,
      data_delay_minutes: dataDelayMinutes ?? 0,
      data_version: dataVersion,
      disclaimer,
      generated_at: generatedAt,
      methodology_version: methodologyVersion,
      required_fields: [
        "generated_at",
        "data_delay_minutes",
        "data_version",
        "methodology_version",
        "rights_policy_version",
        "disclaimer"
      ],
      rights_policy_version: rightsPolicyVersion
    },
    methodology_version: STATIC_REPORT_VERSION,
    model_calls: false,
    persistence_plan: {
      artifact_writes: false,
      live_db_writes: false,
      r2_writes: false,
      sql_emitted: false,
      tables: STATIC_REPORT_TABLES,
      write_status: writeStatus
    },
    provenance: [
      {
        data_version: dataVersion,
        methodology_version: methodologyVersion,
        source: "static-report-plan",
        source_record_id: reportId
      },
      {
        data_version: rightsPolicyVersion,
        methodology_version: STATIC_REPORT_VERSION,
        source: "static-report-rights-boundary",
        source_record_id: sourceRunId ?? "source_run_missing"
      }
    ],
    report: {
      format,
      report_id: reportId,
      sections,
      source_run_id: sourceRunId ?? "source_run_missing",
      static_report_allowed: status === "planned_no_write",
      table: "aiphabee_core.static_report_artifact",
      title: normalizeText(input.title) ?? "Static Research Report"
    },
    request_id: input.requestId,
    rights_boundary: {
      allowed_scope_only: true,
      field_authorization_source: "data_access_gateway_or_report_snapshot",
      raw_partner_data_embedded: false,
      redistribution_requires_rights_policy: true,
      required_scope: STATIC_REPORT_REQUIRED_SCOPE,
      scope_granted: scopeGranted
    },
    sql_emitted: false,
    status,
    toolName: "plan_static_report_artifact",
    usage: {
      cached: false,
      credits: 0,
      rows: usageRows
    },
    validation: {
      metadata_complete: metadataComplete,
      required_context_present: requiredContextPresent,
      supported_format: supportedFormat
    },
    version: STATIC_REPORT_VERSION,
    watermark: {
      fields: [
        "request_id",
        "report_id",
        "generated_at",
        "data_delay_minutes",
        "data_version",
        "methodology_version",
        "rights_policy_version",
        "disclaimer"
      ],
      required: true,
      text: [
        `request_id=${input.requestId}`,
        `report_id=${reportId}`,
        `generated_at=${generatedAt}`,
        `data_delay_minutes=${dataDelayMinutes ?? 0}`,
        `data_version=${dataVersion}`,
        `methodology_version=${methodologyVersion}`,
        `rights_policy_version=${rightsPolicyVersion}`,
        "disclaimer=present"
      ].join(";")
    }
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

function normalizeDeepReportSections(sections: string[] | undefined): string[] {
  const normalizedSections =
    sections
      ?.map((section) => normalizeText(section))
      .filter((section): section is string => section !== undefined)
      .map((section) => section.toLowerCase().replace(/[^a-z0-9_]+/gu, "_"))
      .filter((section) => section.length > 0) ?? [];

  if (normalizedSections.length === 0) {
    return [...DEFAULT_DEEP_REPORT_SECTIONS];
  }

  return uniqueSorted(normalizedSections);
}

function normalizeStaticReportFormat(format: string | undefined): StaticReportFormat | undefined {
  const normalized = normalizeText(format)?.toLowerCase();
  return STATIC_REPORT_FORMATS.find((candidate) => candidate === normalized);
}

function getStaticReportStatus(input: {
  metadataComplete: boolean;
  requiredContextPresent: boolean;
  scopeGranted: boolean;
  supportedFormat: boolean;
}): StaticReportStatus {
  if (!input.supportedFormat) {
    return "blocked_unsupported_format";
  }

  if (!input.requiredContextPresent) {
    return "blocked_missing_context";
  }

  if (!input.scopeGranted) {
    return "blocked_unlicensed_scope";
  }

  if (!input.metadataComplete) {
    return "blocked_metadata_incomplete";
  }

  return "planned_no_write";
}

function createDeepReportEvidenceIndexRecords(
  evidenceIndexId: string,
  sections: string[]
): DeepReportEvidenceIndexRecord[] {
  return sections.map((sectionId) => ({
    citation_status: "planned_validation",
    claim_label: sectionId === "disclaimer" ? "unknown" : "fact",
    data_version: DEEP_REPORT_WORKFLOW_VERSION,
    evidence_record_id: `${evidenceIndexId}_${sectionId}`,
    methodology_version: DEEP_REPORT_WORKFLOW_VERSION,
    section_id: sectionId,
    source_record_ids: [`planned_source_${sectionId}`]
  }));
}

function createDeepReportWorkflowStages(): DeepReportWorkflowStage[] {
  return DEEP_REPORT_WORKFLOW_STAGE_DEFINITIONS.map((definition, index) => ({
    checkpoint_writes: false,
    input_contract: definition.input,
    live_tool_execution: false,
    model_calls: false,
    order: index + 1,
    output_contract: definition.output,
    persistent_writes: false,
    requires_previous_stage: index > 0,
    stage_id: definition.id,
    status: "planned_no_write"
  }));
}

function normalizeDataCorrectionEvents(
  corrections: DataCorrectionSourceInput[] | undefined
): Array<Omit<DataCorrectionEventPlan, "write_status">> {
  if (corrections === undefined) {
    return [];
  }

  return corrections
    .map((correction): Omit<DataCorrectionEventPlan, "write_status"> | undefined => {
      const sourceRecordId = normalizeText(correction.sourceRecordId);
      const correctedDataVersion = normalizeText(correction.correctedDataVersion);

      if (sourceRecordId === undefined || correctedDataVersion === undefined) {
        return undefined;
      }

      const previousDataVersion = normalizeText(correction.previousDataVersion);
      const reason = normalizeText(correction.reason) ?? "data_correction";
      const severity = normalizeDataCorrectionSeverity(correction.severity);
      const correctionEventId =
        normalizeText(correction.correctionId) ??
        `data_correction_${hashStableValue({
          correctedDataVersion,
          previousDataVersion,
          reason,
          sourceRecordId
        })}`;

      return {
        corrected_data_version: correctedDataVersion,
        correction_event_id: correctionEventId,
        previous_data_version: previousDataVersion,
        reason,
        severity,
        source_record_id: sourceRecordId,
        table: "aiphabee_core.data_correction_event" as const
      };
    })
    .filter(
      (correction): correction is Omit<DataCorrectionEventPlan, "write_status"> =>
        correction !== undefined
    );
}

function createDataCorrectionImpacts(
  affectedRuns: ResearchRunSavePlan[],
  correctedSourceRecordIds: Set<string>,
  defaultUserId: string | undefined,
  defaultWorkspaceId: string | undefined
): Array<Omit<DataCorrectionImpactPlan, "write_status">> {
  return affectedRuns
    .map((run): Omit<DataCorrectionImpactPlan, "write_status"> | undefined => {
      const matchedEvidenceRecords = run.evidence_snapshot.records.filter((record) =>
        record.source_record_ids.some((sourceRecordId) =>
          correctedSourceRecordIds.has(sourceRecordId)
        )
      );
      const impactedSourceRecordIds = uniqueSorted(
        matchedEvidenceRecords.flatMap((record) =>
          record.source_record_ids.filter((sourceRecordId) =>
            correctedSourceRecordIds.has(sourceRecordId)
          )
        )
      );

      if (impactedSourceRecordIds.length === 0) {
        return undefined;
      }

      const evidenceRecordIds = uniqueSorted(
        matchedEvidenceRecords.map((record) => record.evidence_record_id)
      );
      const userId = defaultUserId ?? run.user.user_id;
      const workspaceId = defaultWorkspaceId ?? run.workspace.workspace_id;

      return {
        evidence_record_ids: evidenceRecordIds,
        impact_id: `research_correction_impact_${hashStableValue({
          impactedSourceRecordIds,
          runId: run.run_id,
          snapshotId: run.snapshot_id
        })}`,
        impacted_source_record_ids: impactedSourceRecordIds,
        notification_required: true,
        research_run_id: run.run_id,
        snapshot_id: run.snapshot_id,
        table: "aiphabee_core.research_run_correction_impact",
        user_id: userId,
        workspace_id: workspaceId
      };
    })
    .filter(
      (impact): impact is Omit<DataCorrectionImpactPlan, "write_status"> =>
        impact !== undefined
    );
}

function createDataCorrectionNotificationItems(
  impacts: Array<Omit<DataCorrectionImpactPlan, "write_status">>,
  channels: DataCorrectionNotificationChannel[]
): DataCorrectionUserNotificationPlan[] {
  return impacts.flatMap((impact) =>
    channels.map((channel) => ({
      channel,
      event_queue: "AIPHABEE_EVENTS_QUEUE" as const,
      fanout_status: "planned_no_write" as const,
      notification_event_id: `user_notification_${hashStableValue({
        channel,
        impactId: impact.impact_id,
        snapshotId: impact.snapshot_id
      })}`,
      research_run_id: impact.research_run_id,
      snapshot_id: impact.snapshot_id,
      table: "aiphabee_core.user_notification" as const,
      user_id: impact.user_id,
      workspace_id: impact.workspace_id
    }))
  );
}

function normalizeDataCorrectionNotificationChannels(
  channels: DataCorrectionNotificationChannel[] | undefined
): DataCorrectionNotificationChannel[] {
  const normalized =
    channels?.filter((channel): channel is DataCorrectionNotificationChannel =>
      DATA_CORRECTION_NOTIFICATION_CHANNELS.includes(channel)
    ) ?? [];

  return normalized.length > 0 ? [...new Set(normalized)] : ["in_app"];
}

function normalizeDataCorrectionSeverity(
  severity: DataCorrectionSeverity | undefined
): DataCorrectionSeverity {
  return severity === "low" || severity === "high" ? severity : "medium";
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
