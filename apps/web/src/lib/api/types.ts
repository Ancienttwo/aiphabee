/**
 * Frontend-facing API types.
 *
 * Envelope types come from the shared `@aiphabee/data-contracts` package — the
 * real cross-tier contract. Payload shapes below mirror the worker source of
 * truth but are declared locally so the web app stays decoupled from the heavy
 * server packages:
 *   - AgentProgressStreamEvent  -> packages/agent-runtime/src/index.ts
 *   - ResolveSecurity*          -> packages/security-tools/src/index.ts
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
  listingId?: string;
  market: string;
  matchReason: string;
  name: { en: string; zhHans: string; zhHant: string };
  status: "delisted" | "listed" | "suspended";
  symbol: string;
  validFrom?: string;
  validTo?: string;
}

export interface ResolveSecurityData {
  candidates: ResolveSecurityCandidate[];
  dataVersion?: string;
  liveDataAccess?: boolean;
  market?: string;
  methodologyVersion?: string;
  normalizedQuery: string;
  provenance: ProvenanceRef[];
  query: string;
  selectedInstrumentId?: string;
  status: ResolveSecurityStatus;
  usage: UsageSummary;
}

// --- get_security_profile (live company header, packages/security-tools) --
// Distinct from the synthetic SecurityProfile below (workbench snapshot
// tabs): this is the live Serving-backed shape returned by the
// resolveProfile RPC. It has no company/top-level industry object (Netquity
// BasicData has neither); coverage.industry communicates that gap instead of
// omitting or synthesizing it.
export interface LiveSecurityProfileCoverageItem {
  reason?: string;
  status: "available" | "planned" | "unavailable";
}

export interface LiveSecurityProfile {
  coverage: {
    industry: LiveSecurityProfileCoverageItem;
  };
  currency: string;
  exchange: string;
  instrumentId: string;
  lifecycle: {
    delistedAt?: string;
    listedAt?: string;
    suspendedAt?: string;
  };
  listingId?: string;
  listingStatus: "delisted" | "listed" | "suspended";
  market: string;
  name: { en: string; zhHans: string; zhHant: string };
  symbol: string;
}

export interface GetSecurityProfileData {
  asOf: string;
  dataVersion?: string;
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  profile?: LiveSecurityProfile;
  provenance: ProvenanceRef[];
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_financial_facts (live, packages/financial-facts) ----------------
// Distinct from the synthetic FinancialFactRow/FinancialFactsSection below
// (workbench snapshot tab): this is the live, Serving-backed shape returned
// by the resolveFinancialFacts RPC. There is no accountingStandard,
// companyId, restatementVersion or versionStatus (no rights-pinned source
// for any of them); scale/unit describe raw unscaled currency amounts, not
// the synthetic fixtures' million-scale convention. `coverage` distinguishes
// an instrument that reports under the bank/insurance statement schema
// (status "unavailable", facts always []) from one this promotion actually
// covers (status "available").
export interface LiveFinancialFactsCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export interface LiveFinancialFactRow {
  currency: string;
  instrumentId: string;
  metricId: string;
  periodEnd: string;
  periodType: "FY" | "H1";
  publishedAt: string;
  qualityState: QualityState;
  scale: number;
  sourceRecordId: string;
  statementId: string;
  statementType: string;
  unit: string;
  value: number;
}

export interface GetLiveFinancialFactsData {
  asOf: string;
  coverage?: LiveFinancialFactsCoverage;
  dataVersion?: string;
  facts?: LiveFinancialFactRow[];
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_quote_snapshot (live, packages/market-data) ----------------------
// Distinct from the synthetic QuoteSnapshot/QuoteSection below (workbench
// snapshot tab): this is the live, Serving-backed shape returned by the
// resolveQuoteSnapshot RPC. It is end-of-day (EOD) closing data, never
// real-time or intraday -- there is no "delay"/"marketStatus" session-state
// concept (unlike the synthetic QuoteSnapshot), only a tradeDate. Every
// price/volume field besides tradeDate/currency is independently nullable
// (the vendor row itself may be null); sharesOutstanding is populated for a
// minority of instruments. `coverage` distinguishes an instrument with no
// promoted EOD row (status "unavailable", quote always absent) from one
// this promotion covers (status "available").
export interface LiveQuoteSnapshotCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export interface LiveQuoteSnapshotRow {
  close?: number;
  currency: string;
  high?: number;
  instrumentId: string;
  low?: number;
  open?: number;
  sharesOutstanding?: number;
  tradeDate: string;
  turnover?: number;
  volume?: number;
}

export interface GetLiveQuoteSnapshotData {
  asOf: string;
  coverage?: LiveQuoteSnapshotCoverage;
  dataVersion?: string;
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  quote?: LiveQuoteSnapshotRow;
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_corporate_actions (live, packages/corporate-actions) ------------
// Distinct from the synthetic CorporateActionToolRow/CorporateActionsSection
// below (workbench snapshot tab): this is the live, Serving-backed shape
// returned by the resolveCorporateActions RPC. There is no adjustmentImpact
// (no rights-pinned source for a computed priceAdjustmentFactor -- the
// vendor tables carry no reinvestmentPrice column at all); only 4 of the 6
// synthetic CorporateActionToolType values are ever live-promoted (dividend,
// buyback, split, consolidation). `terms` is independently optional and
// type-shaped per actionType: dividend carries cashAmount+currency, buyback
// carries buybackValue+shares+currency, split/consolidation carry no terms
// at all (no clean structured ratio column in the vendor tables -- their own
// free-text particulars are promoted verbatim as `summary` instead).
// `coverage` distinguishes an instrument with no promoted action at all
// (status "unavailable", actions always []) from one this promotion covers
// (status "available").
export interface LiveCorporateActionsCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export interface LiveCorporateActionTerms {
  buybackValue?: number;
  cashAmount?: number;
  currency?: string;
  shares?: number;
}

export interface LiveCorporateActionRow {
  actionId: string;
  actionType: "buyback" | "consolidation" | "dividend" | "split";
  announcementDate: string;
  effectiveDate: string;
  exDate?: string;
  instrumentId: string;
  paymentDate?: string;
  sourceRecordId: string;
  summary?: string;
  terms?: LiveCorporateActionTerms;
}

export interface GetLiveCorporateActionsData {
  actions?: LiveCorporateActionRow[];
  asOf: string;
  coverage?: LiveCorporateActionsCoverage;
  dataVersion?: string;
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_sdi_disclosures (live, packages/sdi-disclosure) -----------------
// Unlike the sections above, SDI (disclosure of interests) has no synthetic
// counterpart anywhere in this file or in packages/workbench: it never had
// a Phase 1 synthetic tool, so this is a genuinely new tab, not a
// synthetic->live cutover. Every nq_sdidata.sdi row is one filing, and a
// single filing can independently carry up to three legally distinct
// position blocks -- Long Position, Short Position, and Lending Pool --
// so `disclosures[].positions` nests 1-3 entries per filing rather than a
// flat per-type array like corporate_actions' `actions`. No nature-of-
// change category (increase/decrease/passive) or threshold-crossing flag
// is ever promoted: eventCode is the vendor's own undecoded code, exposed
// verbatim, never translated into an interpreted label. `coverage`
// distinguishes an instrument with no promoted filing at all (status
// "unavailable", disclosures always []) from one this promotion covers
// (status "available").
export interface SdiDisclosureCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export type LiveSdiPositionType = "long" | "pool" | "short";

export interface LiveSdiPosition {
  currency?: string;
  eventCode?: string;
  positionType: LiveSdiPositionType;
  presentBalancePercent?: number;
  presentBalanceShares?: number;
  previousBalancePercent?: number;
  previousBalanceShares?: number;
  shares?: number;
}

export interface LiveSdiHolderName {
  en: string;
  zhHans: string;
  zhHant: string;
}

export interface LiveSdiDisclosureRow {
  amendsReferenceNo?: string;
  disclosureId: string;
  formType: "1" | "2" | "3A";
  holderName: LiveSdiHolderName;
  instrumentId: string;
  positions: LiveSdiPosition[];
  referenceNo: string;
  reportDate: string;
  shareClass: string;
  sourceRecordId: string;
  supersededByReferenceNo?: string;
  transactionDate: string;
}

export interface GetLiveSdiDisclosuresData {
  asOf: string;
  coverage?: SdiDisclosureCoverage;
  dataVersion?: string;
  disclosures?: LiveSdiDisclosureRow[];
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_directorate (live, packages/directorate) -------------------------
// Like sdi_disclosure, directorate has no synthetic counterpart anywhere in
// this file or in packages/workbench: it never had a Phase 1 synthetic
// tool, so this is a genuinely new tab, not a synthetic->live cutover.
// Every nq_biography.biography row is one director or senior-management
// person at one company (capacity 'D'|'S', the only two vendor values,
// promoted verbatim -- no executive/independent-non-executive
// classification is derived, since that finer distinction exists only as
// free-text prose inside title.en/chititle and the same prose can describe
// a person's *other* directorships, not this company's own board
// classification). age/biography/remuneration/title.en are each
// independently optional per their own verified population gaps; no
// appointment/departure date, committee membership, or cross-company
// person id is promoted (none exists as a vendor column in
// nq_biography.biography). `coverage` distinguishes an instrument with no
// promoted biography row at all (status "unavailable", directors always [])
// from one this promotion covers (status "available").
export type LiveDirectorateCapacity = "D" | "S";

export interface DirectorateCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export interface LiveDirectorateName {
  en: string;
  zhHans: string;
  zhHant: string;
}

export interface LiveDirectorateTitle {
  en?: string;
  zhHans: string;
  zhHant: string;
}

export interface LiveDirectorateBiography {
  en?: string;
  zhHans?: string;
  zhHant?: string;
}

export interface LiveDirectorateRemuneration {
  currency?: string;
  currentAmount?: number;
  currentYearEnd?: string;
  previousAmount?: number;
  previousYearEnd?: string;
}

export interface LiveDirectorateProfileRow {
  age?: number;
  biography?: LiveDirectorateBiography;
  capacity: LiveDirectorateCapacity;
  instrumentId: string;
  name: LiveDirectorateName;
  profileId: string;
  remuneration?: LiveDirectorateRemuneration;
  sourceRecordId: string;
  title: LiveDirectorateTitle;
}

export interface GetLiveDirectorateData {
  asOf: string;
  coverage?: DirectorateCoverage;
  dataVersion?: string;
  directors?: LiveDirectorateProfileRow[];
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_ownership (live, packages/ownership) -----------------------------
// Like sdi_disclosure and directorate, ownership has no synthetic
// counterpart anywhere in this file or in packages/workbench: it never had
// a Phase 1 synthetic tool, so this is a genuinely new tab, not a
// synthetic->live cutover. 3 independently optional buckets per instrument:
// shareCapital (nq_issueshare.issueshare, a current-state object -- not an
// array), freeFloat (nq_freefloatshare2.freefloatshare, also a current-state
// object), and holders (nq_listcompheld.data, one entry per
// substantial-shareholder-or-director holding row). Every listcompheld row
// is one holding record; a cross-holding is simply the subset where the
// holder is itself a listed company (holderType 'L') with a resolvable
// listcode, so each holders[] entry independently optionally carries a
// crossHolding sub-object instead of a second, duplicate array (see
// deploy/ingest/netquity-ownership-staging.contract.json's
// payload_shape_choice). holderType/groupType/sourceType are each promoted
// as their raw undecoded vendor code (no reference table exists in the
// mirrored schema), never translated into an interpreted label.
// `coverage` distinguishes an instrument with no promoted ownership data at
// all (status "unavailable", all 3 buckets absent) from one this promotion
// covers (status "available", at least one bucket present).
export interface OwnershipCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export interface LiveShareCapital {
  asOf: string;
  hasSecondaryListing: "N" | "Y";
  hkShareClass: string;
  hkShares?: number;
  isHShare: "N" | "Y";
  issuedShares: number;
  issuedSharesChange: number;
  nonHkShareClass?: string;
  nonHkShares?: number;
  preferenceShares?: number;
  sharesInCcass?: number;
  sharesOutsideCcass?: number;
  weightedVotingRightsRatio?: number;
}

export interface LiveFreeFloat {
  asOf: string;
  freeFloatPercent: number;
  freeFloatShares: number;
  issuedShares: number;
  nonFreeFloatShares: number;
}

export interface LiveOwnershipHolderName {
  en: string;
  zhHans: string;
  zhHant: string;
}

export interface LiveOwnershipCrossHolding {
  instrumentId: string;
}

export interface LiveOwnershipHolder {
  asOf: string;
  crossHolding?: LiveOwnershipCrossHolding;
  groupType: string;
  heldPercent: number;
  heldShares: number;
  holderId: string;
  holderType: string;
  instrumentId: string;
  name: LiveOwnershipHolderName;
  sourceRecordId: string;
  sourceType: string;
}

export interface GetLiveOwnershipData {
  asOf: string;
  coverage?: OwnershipCoverage;
  dataVersion?: string;
  freeFloat?: LiveFreeFloat;
  holders?: LiveOwnershipHolder[];
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  shareCapital?: LiveShareCapital;
  status: "found" | "not_found";
  usage: UsageSummary;
}

// --- get_related_warrants (live, packages/related-warrants) ---------------
// Like sdi_disclosure, directorate, and ownership, related_warrants has no
// synthetic counterpart anywhere in this file or in packages/workbench: it
// never had a Phase 1 synthetic tool, so this is a genuinely new tab, not a
// synthetic->live cutover. One bucket per instrument: warrants[]
// (nq_basicdata.relatedcode joined to nq_basicdata.stock), the list of
// derivative warrant / CBBC codes associated with this underlying. Every
// entry shares the identical shape regardless of category; category is
// promoted as a raw, undecoded relatedcode column key (no reference table
// for comp_warrant/dp_warrant/dc_warrant/cc_warrant/ce_warrant exists in the
// mirrored schema -- see
// deploy/ingest/netquity-related-warrants-staging.contract.json's
// excluded_from_this_cut.warrant_terms_no_fact_table). `coverage`
// distinguishes an instrument with no related warrant at all (status
// "unavailable", warrants absent -- the overwhelming norm) from one this
// promotion covers (status "available", warrants non-empty).
export interface RelatedWarrantsCoverage {
  reason?: string;
  status: "available" | "unavailable";
}

export type LiveRelatedWarrantCategory = "cc_warrant" | "ce_warrant" | "comp_warrant" | "dc_warrant" | "dp_warrant";

export interface LiveRelatedWarrantName {
  en: string;
  zhHans: string;
  zhHant: string;
}

export interface LiveRelatedWarrant {
  category: LiveRelatedWarrantCategory;
  instrumentId: string;
  name: LiveRelatedWarrantName;
  sourceRecordId: string;
}

export interface GetLiveRelatedWarrantsData {
  asOf: string;
  coverage?: RelatedWarrantsCoverage;
  dataVersion?: string;
  instrumentId: string;
  liveDataAccess?: boolean;
  methodologyVersion?: string;
  provenance: ProvenanceRef[];
  status: "found" | "not_found";
  usage: UsageSummary;
  warrants?: LiveRelatedWarrant[];
}

// --- resolveDerivedMetrics (live, packages/workbench createLiveDerivedMetrics) --
// Unlike the sections above, this does not gate on its own Serving dataset:
// resolveDerivedMetrics conjuncts the financial_facts and quote_snapshot Web
// entitlement gates (both required, no separate "derived metrics"
// entitlement row exists) and combines their released rows. metrics/
// definitions reuse the same DerivedMetricValue/DerivedMetricDefinition
// shapes as the synthetic DerivedMetricsSection below (the live and
// synthetic per-metric value/definition shapes are identical); only the
// envelope-level fields around them differ, matching the live vs. synthetic
// naming split documented below (this is a workbench-native section, so its
// own top-level fields are snake_case, same as the synthetic
// DerivedMetricsSection). financial_facts_as_of/quote_as_of/
// financial_period_end are independently optional -- either input dataset
// may have no released row for this instrument (404) without failing the
// whole resolution, so the engine renders a per-metric blocked_reason
// instead of omitting or fabricating a value. data_version is a composite of
// whichever source dataset(s) actually contributed ("" when neither did).
export interface GetLiveDerivedMetricsData {
  data_version: string;
  definitions: DerivedMetricDefinition[];
  financial_facts_as_of?: string;
  financial_period_end?: string;
  live_data_access: true;
  methodology_version: string;
  metrics: DerivedMetricValue[];
  provenance: ProvenanceRef[];
  quote_as_of?: string;
  status: "blocked" | "computed" | "partial";
  usage: UsageSummary;
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
