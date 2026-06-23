import {
  createAgentProgressStreamReport,
  validatePostGenerationEvidenceBinding,
  type AgentPostGenerationEvidenceBindingValidation,
  type AgentProgressStreamReport,
  type AgentToolLoopProgressEvent,
  type RegisteredAgentToolName,
} from "@aiphabee/agent-runtime";
import {
  createErrorEnvelope,
  createSuccessEnvelope,
} from "@aiphabee/data-contracts";
import {
  diffAnnouncements,
  getAnnouncement,
  searchAnnouncements,
} from "@aiphabee/document-tools";
import type {
  DiffAnnouncementsResult,
  GetAnnouncementResult,
  SearchAnnouncementCategory,
  SearchAnnouncementsResult,
} from "@aiphabee/document-tools";
import {
  createResearchRunReplayPlan,
  createResearchRunSavePlan,
} from "@aiphabee/research-runtime";
import { createMcpDeveloperConsolePlan } from "@aiphabee/mcp-runtime";
import type {
  ResearchRunReplayPlan,
  ResearchRunSavePlan,
} from "@aiphabee/research-runtime";
import type {
  EnvelopeMeta,
  ErrorEnvelope,
  ProvenanceRef,
  SuccessEnvelope,
} from "@aiphabee/data-contracts";
import {
  IPOS,
  SECTOR_LABEL,
  STATUS_CONFIG,
  findIpo,
  type IpoRecord,
  type IpoStatus,
  type Sector,
} from "../data/ipos";

/**
 * Mock API — serves the illustrative dataset through the real
 * `@aiphabee/data-contracts` response envelope. This keeps the UI coupled to
 * the canonical contract (provenance, usage, market_status), so swapping to
 * the live worker later is a one-module change. NOT live market data.
 */

// Fixed timestamps keep SSR and client output identical (no hydration drift).
const MOCK_AS_OF = "2026-06-20T00:00:00.000Z";

const MOCK_PROVENANCE: ProvenanceRef[] = [
  {
    source: "mock-fixture",
    source_record_id: "ui-kit-mock-v1",
    data_version: "ui-kit-mock-v1",
    methodology_version: "ui-kit-mock-v1",
  },
];

function mockMeta(requestId: string, rows: number): EnvelopeMeta {
  return {
    asOf: MOCK_AS_OF,
    requestId,
    marketStatus: "not_applicable",
    methodologyVersion: "ui-kit-mock-v1",
    provenance: MOCK_PROVENANCE,
    usage: { cached: true, credits: 0, rows },
  };
}

export function getIpos(): SuccessEnvelope<IpoRecord[]> {
  return createSuccessEnvelope(IPOS, mockMeta("mock-ipos", IPOS.length));
}

export function getIpo(
  id: string,
): SuccessEnvelope<IpoRecord> | ErrorEnvelope {
  const ipo = findIpo(id);
  if (!ipo) {
    return createErrorEnvelope(
      "NOT_FOUND",
      `No IPO matches id "${id}".`,
      mockMeta(`mock-ipo-${id}`, 0),
    );
  }
  return createSuccessEnvelope(ipo, mockMeta(`mock-ipo-${id}`, 1));
}

export type ComparisonMetricKey =
  | "score"
  | "subscription"
  | "confidence"
  | "rating"
  | "cornerstone";

export interface ComparisonMetric {
  key: ComparisonMetricKey;
  label: string;
  unit: "score" | "multiple" | "percent" | "stars";
  higherIsBetter: boolean;
}

export interface ComparisonRow {
  ipo: IpoRecord;
  metrics: Record<ComparisonMetricKey, number>;
  why: string[];
  rejected_reasons: string[];
}

export interface ComparisonResult {
  requested_ids: string[];
  rows: ComparisonRow[];
  metrics: ComparisonMetric[];
  incomparable_reasons: string[];
  source: "mock-fixture";
}

export interface AgentAskEvidenceCard {
  asOf: string;
  cardId: string;
  claimId: string;
  currency: string;
  dataPoint: string;
  dataVersion: string;
  documentLocation: string;
  evidenceStrength: "strong" | "medium" | "weak" | "unknown";
  label: string;
  methodologyVersion: string;
  sourceRecordId: string;
  sourceTool: RegisteredAgentToolName;
  unit: string;
  warnings: string[];
}

export interface AgentAskProgressUiEvent {
  event: AgentToolLoopProgressEvent;
  eventIndex: number;
  publicLabel: string;
  status: string;
  stepId?: string;
  toolName?: string;
}

export interface AgentAskEvidenceSnapshot {
  answer: {
    direct: string;
    orderedSections: string[];
    redactionBoundary: string;
  };
  blockingProbe: AgentPostGenerationEvidenceBindingValidation;
  evidenceCards: AgentAskEvidenceCard[];
  guardrails: {
    actualToolExecution: false;
    chainOfThoughtExposed: false;
    liveEvidenceWrites: false;
    modelCalls: false;
    persistentWrites: false;
    rawGeneratedAnswerReturned: false;
  };
  missingSourceCard: {
    claimId: string;
    message: string;
    missingFields: string[];
  };
  progress: AgentProgressStreamReport;
  publicProgressEvents: AgentAskProgressUiEvent[];
  source: "agent-runtime-plan";
  sourcedValidation: AgentPostGenerationEvidenceBindingValidation;
}

export type ScreeningOperator = ">=" | "<=" | "=";
export type ScreeningField =
  | "score"
  | "subscription"
  | "confidence"
  | "sector"
  | "status"
  | "cornerstone";

export interface ScreeningCondition {
  field: ScreeningField;
  operator: ScreeningOperator;
  value: number | string | boolean;
  label: string;
  source_tool: "screen_securities";
  time_basis: "as_of_fixture";
  missing_value_rule: "fail_closed";
}

export interface ScreeningInput {
  minScore?: number;
  minSubscription?: number;
  minConfidence?: number;
  sector?: Sector | "all";
  status?: IpoStatus | "all";
  requireCornerstone?: boolean;
}

export interface ScreeningHit {
  ipo: IpoRecord;
  rank: number;
  why: string[];
}

export interface ScreeningRejected {
  ipo: IpoRecord;
  rejected_reasons: string[];
}

export interface ScreeningResult {
  conditions: ScreeningCondition[];
  hits: ScreeningHit[];
  rejected: ScreeningRejected[];
  confirmation_required_before_live_execution: true;
  source: "mock-fixture";
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  { key: "score", label: "Aipha score", unit: "score", higherIsBetter: true },
  { key: "subscription", label: "超额认购", unit: "multiple", higherIsBetter: true },
  { key: "confidence", label: "模型置信度", unit: "percent", higherIsBetter: true },
  { key: "rating", label: "机构评分", unit: "stars", higherIsBetter: true },
  { key: "cornerstone", label: "基石占比", unit: "percent", higherIsBetter: true },
];

function cornerstonePct(ipo: IpoRecord): number {
  return ipo.cornerstones.reduce((sum, item) => sum + item.pct, 0);
}

function comparisonMetrics(ipo: IpoRecord): Record<ComparisonMetricKey, number> {
  return {
    score: ipo.score,
    subscription: ipo.sub,
    confidence: ipo.confidence,
    rating: ipo.rating,
    cornerstone: cornerstonePct(ipo),
  };
}

function explainComparison(ipo: IpoRecord): string[] {
  const strongestDimension = [...ipo.dims].sort((a, b) => b.score - a.score)[0];
  const reasons = [
    `${ipo.ticker} ${ipo.score}/100，${ipo.tierLabel}，${STATUS_CONFIG[ipo.status].label}`,
    `${strongestDimension.label} ${strongestDimension.score}/100 是当前最强维度`,
    `基石占比 ${cornerstonePct(ipo).toFixed(1)}%，认购 ${ipo.sub.toFixed(1)}x`,
  ];

  if (ipo.confidence < 60) {
    reasons.push("模型置信度低于 60%，需要二次复核");
  }

  return reasons;
}

export function compareIpos(
  ids: string[],
): SuccessEnvelope<ComparisonResult> | ErrorEnvelope {
  if (ids.length < 2 || ids.length > 5) {
    return createErrorEnvelope(
      "OUT_OF_RANGE",
      "compareIpos requires 2 to 5 IPO ids.",
      mockMeta("mock-compare-invalid-size", 0),
    );
  }

  const uniqueIds = [...new Set(ids)];
  const rows: ComparisonRow[] = [];
  const missing: string[] = [];

  for (const id of uniqueIds) {
    const ipo = findIpo(id);
    if (!ipo) {
      missing.push(id);
      continue;
    }
    rows.push({
      ipo,
      metrics: comparisonMetrics(ipo),
      why: explainComparison(ipo),
      rejected_reasons: [],
    });
  }

  if (missing.length) {
    return createErrorEnvelope(
      "NOT_FOUND",
      `No IPO matches id(s): ${missing.join(", ")}.`,
      mockMeta("mock-compare-missing", rows.length),
    );
  }

  return createSuccessEnvelope(
    {
      requested_ids: ids,
      rows,
      metrics: COMPARISON_METRICS,
      incomparable_reasons: [],
      source: "mock-fixture",
    },
    mockMeta("mock-compare-ipos", rows.length),
  );
}

function clampScore(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampSubscription(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Number(value.toFixed(1)));
}

export function normalizeScreeningInput(input: ScreeningInput = {}): Required<ScreeningInput> {
  return {
    minScore: clampScore(input.minScore, 50),
    minSubscription: clampSubscription(input.minSubscription, 10),
    minConfidence: clampScore(input.minConfidence, 55),
    sector: input.sector ?? "all",
    status: input.status ?? "all",
    requireCornerstone: input.requireCornerstone ?? false,
  };
}

function buildScreeningConditions(input: Required<ScreeningInput>): ScreeningCondition[] {
  const conditions: ScreeningCondition[] = [
    {
      field: "score",
      operator: ">=",
      value: input.minScore,
      label: `Aipha score >= ${input.minScore}`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    },
    {
      field: "subscription",
      operator: ">=",
      value: input.minSubscription,
      label: `超额认购 >= ${input.minSubscription}x`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    },
    {
      field: "confidence",
      operator: ">=",
      value: input.minConfidence,
      label: `模型置信度 >= ${input.minConfidence}%`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    },
  ];

  if (input.sector !== "all") {
    conditions.push({
      field: "sector",
      operator: "=",
      value: input.sector,
      label: `板块 = ${SECTOR_LABEL[input.sector]}`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    });
  }

  if (input.status !== "all") {
    conditions.push({
      field: "status",
      operator: "=",
      value: input.status,
      label: `状态 = ${STATUS_CONFIG[input.status].label}`,
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    });
  }

  if (input.requireCornerstone) {
    conditions.push({
      field: "cornerstone",
      operator: ">=",
      value: true,
      label: "至少一个基石投资者",
      source_tool: "screen_securities",
      time_basis: "as_of_fixture",
      missing_value_rule: "fail_closed",
    });
  }

  return conditions;
}

function screenRejectedReasons(ipo: IpoRecord, input: Required<ScreeningInput>): string[] {
  const reasons: string[] = [];

  if (ipo.score < input.minScore) reasons.push(`score ${ipo.score} < ${input.minScore}`);
  if (ipo.sub < input.minSubscription) reasons.push(`subscription ${ipo.sub}x < ${input.minSubscription}x`);
  if (ipo.confidence < input.minConfidence) reasons.push(`confidence ${ipo.confidence}% < ${input.minConfidence}%`);
  if (input.sector !== "all" && ipo.sector !== input.sector) {
    reasons.push(`sector ${SECTOR_LABEL[ipo.sector]} != ${SECTOR_LABEL[input.sector]}`);
  }
  if (input.status !== "all" && ipo.status !== input.status) {
    reasons.push(`status ${STATUS_CONFIG[ipo.status].label} != ${STATUS_CONFIG[input.status].label}`);
  }
  if (input.requireCornerstone && ipo.cornerstones.length === 0) {
    reasons.push("no cornerstone investor");
  }

  return reasons;
}

function explainScreenHit(ipo: IpoRecord): string[] {
  const strongestDimension = [...ipo.dims].sort((a, b) => b.score - a.score)[0];
  return [
    `${ipo.ticker} passes all structured conditions`,
    `${strongestDimension.label} ${strongestDimension.score}/100 leads the profile`,
    ipo.cornerstones.length
      ? `${ipo.cornerstones.length} cornerstone investor(s), total ${cornerstonePct(ipo).toFixed(1)}%`
      : "No cornerstone investor disclosed in fixture",
  ];
}

export function screenIpos(
  input: ScreeningInput = {},
): SuccessEnvelope<ScreeningResult> {
  const normalized = normalizeScreeningInput(input);
  const hits: ScreeningHit[] = [];
  const rejected: ScreeningRejected[] = [];

  for (const ipo of IPOS) {
    const rejected_reasons = screenRejectedReasons(ipo, normalized);
    if (rejected_reasons.length) {
      rejected.push({ ipo, rejected_reasons });
    } else {
      hits.push({ ipo, rank: 0, why: explainScreenHit(ipo) });
    }
  }

  const rankedHits = hits
    .sort((a, b) => b.ipo.score + b.ipo.sub / 10 - (a.ipo.score + a.ipo.sub / 10))
    .map((hit, index) => ({ ...hit, rank: index + 1 }));

  return createSuccessEnvelope(
    {
      conditions: buildScreeningConditions(normalized),
      hits: rankedHits,
      rejected,
      confirmation_required_before_live_execution: true,
      source: "mock-fixture",
    },
    mockMeta("mock-screen-ipos", rankedHits.length),
  );
}

export interface ResearchLibraryInput {
  category?: SearchAnnouncementCategory | "all";
  keyword?: string;
  language?: "en" | "zh-Hant" | "all";
}

export interface ResearchLibrarySnapshot {
  detail: GetAnnouncementResult;
  diff: DiffAnnouncementsResult;
  replay: ResearchRunReplayPlan;
  savedRun: ResearchRunSavePlan;
  search: SearchAnnouncementsResult;
  source: "mock-fixture";
}

export type DeveloperConsolePlan = ReturnType<typeof createMcpDeveloperConsolePlan>;

export interface DeveloperConsoleSnapshot {
  guardrails: {
    liveApiKeyGeneration: boolean;
    liveConsoleLogStore: boolean;
    liveOAuthProvider: boolean;
    liveTargetClientE2E: boolean;
    rawSecretDisplay: boolean;
  };
  plan: DeveloperConsolePlan;
  source: "mcp-runtime-plan";
}

const DEFAULT_RESEARCH_INPUT: Required<ResearchLibraryInput> = {
  category: "all",
  keyword: "results",
  language: "all",
};

const DEFAULT_BASE_DOCUMENT_ID = "doc_ann_00700_20240320_results";
const DEFAULT_COMPARISON_DOCUMENT_ID = "doc_ann_00700_20250320_results";

export function normalizeResearchLibraryInput(
  input: ResearchLibraryInput = {},
): Required<ResearchLibraryInput> {
  return {
    category: input.category ?? DEFAULT_RESEARCH_INPUT.category,
    keyword: input.keyword ?? DEFAULT_RESEARCH_INPUT.keyword,
    language: input.language ?? DEFAULT_RESEARCH_INPUT.language,
  };
}

export function searchResearchLibrary(
  input: ResearchLibraryInput = {},
): SuccessEnvelope<SearchAnnouncementsResult> {
  const normalized = normalizeResearchLibraryInput(input);
  const categories = normalized.category === "all" ? undefined : [normalized.category];
  const language = normalized.language === "all" ? undefined : normalized.language;
  const result = searchAnnouncements({
    categories,
    from: "2024-01-01",
    instrumentId: "eq_hk_00700",
    keyword: normalized.keyword,
    language,
    limit: 5,
    requestId: "mock-research-search",
    to: "2026-12-31",
  });

  return createSuccessEnvelope(
    result,
    mockMeta("mock-research-search", result.row_count),
  );
}

export function getResearchAnnouncement(
  documentId = DEFAULT_COMPARISON_DOCUMENT_ID,
): SuccessEnvelope<GetAnnouncementResult> {
  const result = getAnnouncement({
    documentId,
    maxExcerptChars: 280,
    requestId: "mock-research-detail",
    sections: ["financial_highlights", "management_discussion", "dividend_timetable", "repurchase_summary"],
  });

  return createSuccessEnvelope(
    result,
    mockMeta("mock-research-detail", result.row_count),
  );
}

export function diffResearchAnnouncements(
  baseDocumentId = DEFAULT_BASE_DOCUMENT_ID,
  comparisonDocumentId = DEFAULT_COMPARISON_DOCUMENT_ID,
): SuccessEnvelope<DiffAnnouncementsResult> {
  const result = diffAnnouncements({
    baseDocumentId,
    comparisonDocumentId,
    requestId: "mock-research-diff",
    sections: ["financial_highlights"],
  });

  return createSuccessEnvelope(
    result,
    mockMeta("mock-research-diff", result.row_count),
  );
}

export function getResearchLibrarySnapshot(
  input: ResearchLibraryInput = {},
): SuccessEnvelope<ResearchLibrarySnapshot> {
  const search = searchResearchLibrary(input).data;
  const detail = getResearchAnnouncement(DEFAULT_COMPARISON_DOCUMENT_ID).data;
  const diff = diffResearchAnnouncements(
    DEFAULT_BASE_DOCUMENT_ID,
    DEFAULT_COMPARISON_DOCUMENT_ID,
  ).data;
  const baseEvidence = detail.excerpts.slice(0, 1).map((excerpt) => ({
    citationLabel: excerpt.section_title,
    dataVersion: detail.data_version,
    documentLocation: {
      anchor: excerpt.evidence_locator.anchor,
      documentId: excerpt.evidence_locator.document_id,
      page: excerpt.evidence_locator.page,
      paragraph: excerpt.evidence_locator.paragraph,
      sourceRecordId: excerpt.evidence_locator.source_record_id,
    },
    evidenceRecordId: `ev_${excerpt.evidence_locator.source_record_id}`,
    methodologyVersion: detail.methodology_version,
    sourceRecordIds: [excerpt.evidence_locator.source_record_id],
  }));
  const currentEvidence = detail.excerpts.map((excerpt) => ({
    citationLabel: excerpt.section_title,
    dataVersion: detail.data_version,
    documentLocation: {
      anchor: excerpt.evidence_locator.anchor,
      documentId: excerpt.evidence_locator.document_id,
      page: excerpt.evidence_locator.page,
      paragraph: excerpt.evidence_locator.paragraph,
      sourceRecordId: excerpt.evidence_locator.source_record_id,
    },
    evidenceRecordId: `ev_${excerpt.evidence_locator.source_record_id}`,
    methodologyVersion: detail.methodology_version,
    sourceRecordIds: [excerpt.evidence_locator.source_record_id],
  }));
  const savedRun = createResearchRunSavePlan({
    answerHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    evidenceRecords: baseEvidence,
    modelProvider: "mock-provider",
    modelVersion: "mock-model-v1",
    parameters: { temperature: 0, topK: 3 },
    promptTemplateId: "research-library-summary",
    promptVersion: "prompt-v1",
    question: "Summarize Tencent annual result evidence and preserve the report snapshot.",
    requestId: "mock-research-save",
    toolCalls: [
      {
        dataVersion: search.data_version,
        input: {
          instrumentId: "eq_hk_00700",
          keyword: normalizeResearchLibraryInput(input).keyword,
        },
        inputSchemaId: "search_announcements.input",
        methodologyVersion: search.methodology_version,
        outputSchemaId: "search_announcements.output",
        requestId: "mock-research-search",
        toolCallId: "tool_search_announcements",
        toolName: "search_announcements",
        toolVersion: search.data_version,
      },
    ],
  });
  const replay = createResearchRunReplayPlan({
    currentRun: {
      answerHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      evidenceRecords: currentEvidence,
      modelProvider: "mock-provider",
      modelVersion: "mock-model-v2",
      parameters: { temperature: 0, topK: 5 },
      promptTemplateId: "research-library-summary",
      promptVersion: "prompt-v2",
      question: "Summarize Tencent annual result evidence and preserve the report snapshot.",
      toolCalls: [
        {
          dataVersion: diff.data_version,
          input: {
            baseDocumentId: DEFAULT_BASE_DOCUMENT_ID,
            comparisonDocumentId: DEFAULT_COMPARISON_DOCUMENT_ID,
            sections: ["financial_highlights"],
          },
          inputSchemaId: "diff_announcements.input",
          methodologyVersion: diff.methodology_version,
          outputSchemaId: "diff_announcements.output",
          requestId: "mock-research-diff",
          toolCallId: "tool_diff_announcements",
          toolName: "diff_announcements",
          toolVersion: diff.data_version,
        },
      ],
    },
    replayReason: "new annual result filing changed evidence and prompt version",
    requestId: "mock-research-replay",
    savedRun,
  });

  return createSuccessEnvelope(
    {
      detail,
      diff,
      replay,
      savedRun,
      search,
      source: "mock-fixture",
    },
    mockMeta("mock-research-library", search.row_count + detail.row_count + diff.row_count),
  );
}

export function getDeveloperConsoleSnapshot(): SuccessEnvelope<DeveloperConsoleSnapshot> {
  const plan = createMcpDeveloperConsolePlan({
    allowedOrigins: ["https://app.aiphabee.local", "http://localhost:3001"],
    clientName: "mcp_inspector",
    clientVersion: "local-redacted",
    origin: "https://app.aiphabee.local",
    pendingCredits: 2,
    requestId: "mock-developer-console",
    usagePlanCode: "team",
    usedCredits: 18,
    workspaceId: "workspace_redacted",
  });

  return createSuccessEnvelope(
    {
      guardrails: {
        liveApiKeyGeneration: plan.live_api_key_generation,
        liveConsoleLogStore: plan.live_console_log_store,
        liveOAuthProvider: plan.live_oauth_provider,
        liveTargetClientE2E: plan.compatibility_status.live_client_e2e_passed,
        rawSecretDisplay: false,
      },
      plan,
      source: "mcp-runtime-plan",
    },
    mockMeta("mock-developer-console", plan.release_checks.length),
  );
}

const AGENT_ASK_REQUEST_ID = "mock-agent-ui-progress";
const AGENT_ASK_PROMPT =
  "用公开可解释证据概括 00700.HK 的 IPO 可比公司风险信号，并标注每个具体数字来源。";
const AGENT_ASK_TOOLS: RegisteredAgentToolName[] = [
  "resolve_security",
  "get_quote_snapshot",
  "get_price_history",
  "get_financial_facts",
  "get_data_lineage",
];

const AGENT_ASK_EVIDENCE_CARDS: AgentAskEvidenceCard[] = [
  {
    asOf: "2026-06-20T00:00:00.000Z",
    cardId: "ev_card_quote_00700",
    claimId: "claim_market_cap",
    currency: "HKD",
    dataPoint: "Market cap observed at HK$3.62T",
    dataVersion: "market-data-fixture-v1",
    documentLocation: "quote_snapshot:eq_hk_00700:latest",
    evidenceStrength: "strong",
    label: "Fact",
    methodologyVersion: "quote-snapshot-method-v1",
    sourceRecordId: "quote_eq_hk_00700_20260620",
    sourceTool: "get_quote_snapshot",
    unit: "HKD",
    warnings: ["fixture_not_live_market_data"],
  },
  {
    asOf: "2026-06-20T00:00:00.000Z",
    cardId: "ev_card_revenue_00700",
    claimId: "claim_revenue_growth",
    currency: "CNY",
    dataPoint: "Revenue growth observed at 8.4%",
    dataVersion: "financial-facts-fixture-v1",
    documentLocation: "financial_facts:eq_hk_00700:annual_results",
    evidenceStrength: "medium",
    label: "Calculation",
    methodologyVersion: "financial-facts-method-v1",
    sourceRecordId: "financials_eq_hk_00700_2025",
    sourceTool: "get_financial_facts",
    unit: "percent",
    warnings: ["requires_filing_refresh_before_live_use"],
  },
  {
    asOf: "2026-06-20T00:00:00.000Z",
    cardId: "ev_card_lineage_00700",
    claimId: "claim_source_lineage",
    currency: "not_applicable",
    dataPoint: "Lineage confirms quote and filing sources stay separated",
    dataVersion: "data-lineage-fixture-v1",
    documentLocation: "lineage:eq_hk_00700:source_record_links",
    evidenceStrength: "medium",
    label: "Inference",
    methodologyVersion: "data-lineage-method-v1",
    sourceRecordId: "lineage_eq_hk_00700_20260620",
    sourceTool: "get_data_lineage",
    unit: "not_applicable",
    warnings: ["no_live_evidence_write"],
  },
];

function summarizeProgressEvent(event: AgentProgressStreamReport["stream_events"][number]): AgentAskProgressUiEvent {
  return {
    event: event.event,
    eventIndex: event.event_index,
    publicLabel:
      typeof event.payload.public_label === "string"
        ? event.payload.public_label
        : event.event === "run.started"
          ? "Run accepted by guarded stream"
          : event.event === "run.completed"
            ? "Guarded stream completed"
            : "Progress event",
    status: String(event.payload.status),
    stepId: typeof event.payload.step_id === "string" ? event.payload.step_id : undefined,
    toolName: typeof event.payload.tool_name === "string" ? event.payload.tool_name : undefined,
  };
}

export function getAgentAskEvidenceSnapshot(): SuccessEnvelope<AgentAskEvidenceSnapshot> {
  const progress = createAgentProgressStreamReport({
    channel: "web",
    currency: "HKD",
    locale: "zh-Hans",
    maxSteps: 4,
    prompt: AGENT_ASK_PROMPT,
    requestId: AGENT_ASK_REQUEST_ID,
    requestedTools: AGENT_ASK_TOOLS,
    responseDepth: "professional",
    securities: ["00700.HK"],
    userId: "user_redacted",
    workspaceId: "workspace_redacted",
  });
  const evidenceCardRefs = AGENT_ASK_EVIDENCE_CARDS.map((card) => ({
    cardId: card.cardId,
    dataVersion: card.dataVersion,
    methodologyVersion: card.methodologyVersion,
    sourceRecordId: card.sourceRecordId,
  }));
  const sourcedValidation = validatePostGenerationEvidenceBinding({
    asOf: "2026-06-20T00:00:00.000Z",
    claims: [
      {
        claimId: "claim_market_cap",
        evidenceCardId: "ev_card_quote_00700",
        label: "fact",
        text: "00700.HK market cap is HK$3.62T in the bounded fixture.",
      },
      {
        calculationId: "calc_revenue_growth",
        claimId: "claim_revenue_growth",
        label: "calculation",
        text: "Revenue growth is 8.4% using the annual-result fixture.",
      },
    ],
    calculations: [
      {
        calculationId: "calc_revenue_growth",
        methodologyVersion: "financial-facts-method-v1",
        sourceRecordIds: ["financials_eq_hk_00700_2025"],
      },
    ],
    evidenceCards: evidenceCardRefs,
    requestId: `${AGENT_ASK_REQUEST_ID}:sourced`,
  });
  const blockingProbe = validatePostGenerationEvidenceBinding({
    asOf: "2026-06-20T00:00:00.000Z",
    claims: [
      {
        claimId: "claim_unsourced_price_target",
        label: "fact",
        text: "The generated answer says the target price is HK$480 without a source card.",
      },
    ],
    evidenceCards: evidenceCardRefs,
    requestId: `${AGENT_ASK_REQUEST_ID}:blocked`,
  });

  return createSuccessEnvelope(
    {
      answer: {
        direct:
          "当前结果是 guarded no-model preview：具体数字必须绑定 evidence card，缺来源数字会被拦截。",
        orderedSections: progress.plan.answer_evidence_contract.answer_structure.ordered_sections.map(
          (section) => section.section_id,
        ),
        redactionBoundary: "hash-only frontend evidence; no raw prompt, model output, secret, or connection string in packet",
      },
      blockingProbe,
      evidenceCards: AGENT_ASK_EVIDENCE_CARDS,
      guardrails: {
        actualToolExecution: progress.actual_tool_execution,
        chainOfThoughtExposed: progress.chain_of_thought_exposed,
        liveEvidenceWrites: false,
        modelCalls: progress.model_calls,
        persistentWrites: false,
        rawGeneratedAnswerReturned: false,
      },
      missingSourceCard: {
        claimId: "claim_unsourced_price_target",
        message: "Missing source binding blocks this generated numeric claim before user-visible release.",
        missingFields:
          blockingProbe.numeric_claims.find((claim) => claim.claim_id === "claim_unsourced_price_target")
            ?.missing_fields ?? [],
      },
      progress,
      publicProgressEvents: progress.stream_events.map(summarizeProgressEvent),
      source: "agent-runtime-plan",
      sourcedValidation,
    },
    mockMeta("mock-agent-ask-evidence", progress.stream_events.length + AGENT_ASK_EVIDENCE_CARDS.length),
  );
}
