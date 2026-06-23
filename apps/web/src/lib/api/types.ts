/**
 * Frontend-facing API types.
 *
 * Envelope types come from the shared `@aiphabee/data-contracts` package — the
 * real cross-tier contract. Payload shapes below mirror the worker source of
 * truth but are declared locally so the web app stays decoupled from the heavy
 * server packages:
 *   - AgentProgressStreamEvent  -> packages/agent-runtime/src/index.ts
 *   - ResolveSecurity*          -> packages/security-tools/src/index.ts
 *   - StockWorkbenchSnapshot    -> packages/workbench (createStockWorkbenchSnapshot)
 * If the worker changes these, refine here (Phase 2 adds a contract test).
 */
import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export type {
  AiphaBeeErrorCode,
  ErrorEnvelope,
  MarketStatus,
  ProvenanceRef,
  ResponseEnvelope,
  SuccessEnvelope,
  UsageSummary,
} from "@aiphabee/data-contracts";

// --- resolve_security (packages/security-tools) --------------------------
export type ResolveSecurityStatus = "ambiguous" | "not_found" | "resolved";

export interface ResolveSecurityCandidate {
  currency: string;
  exchange: string;
  instrumentId: string;
  listingId: string;
  market: string;
  matchReason: string;
  name: { en: string; zhHans: string; zhHant: string };
  status: "delisted" | "listed" | "suspended";
  symbol: string;
  validFrom: string;
  validTo?: string;
}

export interface ResolveSecurityData {
  candidates: ResolveSecurityCandidate[];
  market?: string;
  normalizedQuery: string;
  provenance: ProvenanceRef[];
  query: string;
  selectedInstrumentId?: string;
  status: ResolveSecurityStatus;
  usage: UsageSummary;
  [key: string]: unknown;
}

// --- agent progress stream (packages/agent-runtime) ----------------------
export type AgentProgressStatus = "completed" | "planned" | "started" | "stopped";

export interface AgentProgressStreamEvent {
  event: string;
  event_index: number;
  payload: {
    execution: string;
    public_label?: string;
    request_id: string;
    run_id: string;
    status: AgentProgressStatus;
    step_id?: string;
    tool_name?: string;
  };
}

// --- stock workbench snapshot (packages/workbench) -----------------------
// Each section result carries its own provenance/usage/status. Upstream tool
// sections (profile/quote/price/financial/corporate) use camelCase
// dataVersion/methodologyVersion; the two workbench-native sections
// (derived_metrics, announcement_search) use snake_case. ProvenanceRef is
// always snake_case. Sections may be empty when status !== "found".

/** Generic section envelope — provenance + usage every section shares. */
export interface WorkbenchSection {
  status: string;
  usage: UsageSummary;
  provenance?: ProvenanceRef[];
  asOf?: string;
  dataVersion?: string;
  methodologyVersion?: string;
  [key: string]: unknown;
}

export type QualityState = "HOLD" | "PASS";

export interface SecurityProfile {
  company: { companyId: string; country: string; name: { en: string; zhHans: string; zhHant: string } };
  currency: string;
  exchange: string;
  industry: { classificationSystem: string; industry: string; sector: string };
  instrumentId: string;
  lifecycle: { listedAt: string; delistedAt?: string; suspendedAt?: string };
  listingId: string;
  listingStatus: "delisted" | "listed" | "suspended";
  market: string;
  symbol: string;
}
export interface SecurityProfileSection extends WorkbenchSection {
  profile?: SecurityProfile;
}

export type QuoteField =
  | "change"
  | "changePercent"
  | "lastPrice"
  | "previousClose"
  | "turnover"
  | "volume";
export interface QuoteSnapshot {
  asOf: string;
  currency: string;
  delay: { minutes: number; type: "close" | "delayed" };
  exchange: string;
  fields: Partial<Record<QuoteField, number>>;
  marketStatus: string;
  qualityState: QualityState;
  symbol: string;
}
export interface QuoteSection extends WorkbenchSection {
  quote?: QuoteSnapshot;
  mode?: string;
}

export interface FinancialFactRow {
  currency: string;
  metricId: string;
  periodEnd: string;
  periodType: string;
  qualityState: QualityState;
  scale: number;
  sourceRecordId: string;
  statementType: string;
  unit: string;
  value: number;
  versionStatus: "latest" | "prior";
}
export interface FinancialFactsSection extends WorkbenchSection {
  facts?: {
    accountingStandard: string;
    currency: string;
    facts: FinancialFactRow[];
    rowCount: number;
    totalRows: number;
    unit: string;
  };
}

export interface DerivedMetricValue {
  anomaly_flags: string[];
  blocked_reason?: string;
  category: "profitability" | "valuation";
  inputs: Record<string, number | string>;
  metric_id: string;
  period_end?: string;
  source_record_ids: string[];
  status: "blocked" | "computed";
  unit: "multiple" | "ratio";
  value?: number;
}
export interface DerivedMetricDefinition {
  category: string;
  formula: string;
  label: string;
  metric_id: string;
  unit: string;
}
export interface DerivedMetricsSection {
  data_version: string;
  definitions: DerivedMetricDefinition[];
  methodology_version: string;
  metrics: DerivedMetricValue[];
  status: string;
  usage: UsageSummary;
}

export interface AnnouncementLocator {
  anchor: string;
  document_id: string;
  original_url: string;
  page: number;
  source_record_id: string;
}
export interface Announcement {
  announcement_id: string;
  category: string;
  evidence_locator: AnnouncementLocator;
  language: string;
  published_at: string;
  source_record_id: string;
  summary: string;
  symbol: string;
  title: string;
}
export interface AnnouncementSection {
  announcements: Announcement[];
  data_version: string;
  methodology_version: string;
  row_count: number;
  status: string;
  total_count: number;
  usage: UsageSummary;
}

export interface CorporateActionRow {
  actionId: string;
  actionType: string;
  announcementDate: string;
  effectiveDate: string;
  exDate?: string;
  paymentDate?: string;
  qualityState: QualityState;
  sourceRecordId: string;
  status: "announced" | "confirmed";
  summary: string;
  terms: {
    buybackValue?: number;
    cashAmount?: number;
    currency?: string;
    offerPrice?: number;
    ratio?: number;
    shares?: number;
  };
}
export interface CorporateActionsSection extends WorkbenchSection {
  timeline?: {
    actions: CorporateActionRow[];
    currency: string;
    rowCount: number;
    totalRows: number;
  };
}

export interface PriceHistoryRow {
  date: string;
  fields: Partial<Record<string, number>>;
}
export interface PriceHistorySection extends WorkbenchSection {
  history?: {
    adjustment: string;
    rowCount: number;
    rows: PriceHistoryRow[];
    totalRows: number;
  };
}

export interface StockWorkbenchSnapshot {
  announcement_search: AnnouncementSection;
  capability?: unknown;
  corporate_actions: CorporateActionsSection;
  data_quality: { blocking_statuses: string[]; section_statuses: Record<string, string> };
  derived_metrics: DerivedMetricsSection;
  evidence: { provenance_count: number; source_record_ids: string[] };
  financial_facts: FinancialFactsSection;
  instrument_id?: string;
  price_history: PriceHistorySection;
  quote_snapshot: QuoteSection;
  security_profile: SecurityProfileSection;
  status: "blocked_resolution" | "partial" | "ready";
  version: string;
  [key: string]: unknown;
}

// --- module runtime capability probe -------------------------------------
export type RuntimeCapabilities = Record<string, unknown>;

// --- agent research plan (POST /agent/runs/plan) -------------------------
// The plan is a *pre-execution* description: the phased tool steps the agent
// will run, the answer structure it must follow (PRD 8.3), and the numeric
// source guard that blocks any number not bound to a tool result or
// deterministic calculation. No model is called to produce it.
export interface AgentPlanToolCall {
  allow_arbitrary_sql: boolean;
  allow_arbitrary_url: boolean;
  data_classes: string[];
  live_data_access: boolean;
  name: string;
  required_scope: string;
  status: string;
}
export interface AgentPlanStep {
  index: number;
  phase: string;
  public_label: string;
  step_id: string;
  tool_calls: AgentPlanToolCall[];
}
export interface AnswerStructureSection {
  order: number;
  required: boolean;
  section_id: string;
  source: string;
}
export interface AgentPlan {
  actual_tool_execution: boolean;
  answer_evidence_contract: {
    answer_structure: {
      key_evidence_items: { max: number; min: number };
      max_direct_answer_sentences: number;
      max_next_steps: number;
      min_direct_answer_sentences: number;
      ordered_sections: AnswerStructureSection[];
    };
  };
  budget: {
    max_credits: number;
    max_parallel_tools: number;
    max_rows: number;
    max_steps: number;
    max_tokens: number;
  };
  chain_of_thought_exposed: boolean;
  model_calls: boolean;
  numeric_source_guard: {
    allowed_sources: string[];
    answer_contract: {
      failure_code: string;
      requires_calculation_ref: boolean;
      requires_source_record_ref: boolean;
      unknown_value_label: string;
      unsupported_numeric_claim_behavior: string;
    };
    blocked_sources: string[];
  };
  planned_step_count: number;
  steps: AgentPlanStep[];
  [key: string]: unknown;
}

// --- analytics: screen-securities (packages/analytics-tools) --------------
export interface ScreenCondition {
  editable?: boolean;
  field: string;
  missing_value_rule?: string;
  operator: string;
  time_basis?: string;
  value: number;
}
export interface ScreenHit {
  instrument_id?: string;
  matched_conditions: string[];
  rank: number;
  score: number;
  source_record_ids: string[];
  symbol?: string;
  why: string[];
}
export interface ScreenRejected {
  input: string;
  reasons: string[];
  symbol?: string;
}
export interface ScreenResult {
  execution_preview: {
    hit_count: number;
    hits: ScreenHit[];
    ranking_method: string;
    rejected_count: number;
    rejected_rows: ScreenRejected[];
    universe_size: number;
  };
  natural_language?: string;
  parsed_conditions: ScreenCondition[];
  requires_confirmation_before_live_execution: boolean;
  status: string;
  usage: UsageSummary;
  [key: string]: unknown;
}

// --- analytics: compare-securities ---------------------------------------
export interface CompareRow {
  candidates?: ResolveSecurityCandidate[];
  currency?: string;
  financials: Partial<Record<string, number>>;
  input: string;
  instrument_id?: string;
  missing_metrics: string[];
  quality_flags: string[];
  quote?: { as_of: string; last_price?: number; market_status: string };
  status: "blocked_resolution" | "comparable" | "incomparable";
  symbol?: string;
}
export interface CompareResult {
  requested_securities: string[];
  row_count: number;
  rows: CompareRow[];
  status: "compared" | "invalid_input" | "partial";
  unified_comparison: {
    base_currency?: string;
    currency_conversion: string;
    incomparable_reasons: string[];
    max_securities: number;
    min_securities: number;
  };
  usage: UsageSummary;
  [key: string]: unknown;
}

// --- documents: search-announcements -------------------------------------
export interface AnnouncementResultItem {
  announcement_id: string;
  category: string;
  document_id: string;
  evidence_locator: { anchor: string; document_id: string; original_url: string; page: number; source_record_id: string };
  instrument_id: string;
  language: string;
  matched_fields: string[];
  published_at: string;
  summary: string;
  symbol: string;
  title: string;
}
export interface SearchAnnouncementsResult {
  categories: string[];
  resolve_security?: ResolveSecurityData;
  results: AnnouncementResultItem[];
  row_count: number;
  status: "blocked_resolution" | "found" | "not_found";
  total_count: number;
  usage: UsageSummary;
  [key: string]: unknown;
}

// --- documents: get-announcement -----------------------------------------
export interface AnnouncementExcerpt {
  authorization: { max_excerpt_chars: number; truncated: boolean };
  evidence_locator: { anchor: string; page: number; paragraph: number };
  excerpt: string;
  sanitization: { removed_items: string[]; status: string };
  section_id: string;
  section_title: string;
}
export interface GetAnnouncementResult {
  allowed_sections: string[];
  excerpts: AnnouncementExcerpt[];
  sanitization_summary: { removed_item_count: number; sections_reviewed: number; sections_sanitized: number };
  source?: {
    announcement_id: string;
    category: string;
    instrument_id: string;
    language: string;
    published_at: string;
    symbol: string;
    title: string;
  };
  status: "found" | "not_found" | "section_not_found";
  usage: UsageSummary;
  [key: string]: unknown;
}
