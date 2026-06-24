/**
 * Rich IPO workbench record contract (FP1).
 *
 * Mirrors the design prototype's mock record shape
 * (`docs/AiphaBee Design System/apps/ipo-workbench/data.jsx`) — the source of
 * truth for the IPO workbench's fields, lookups, and product semantics. These
 * types describe the `data` payload Codex's worker returns inside the shared
 * `ResponseEnvelope<T>` (see `./types`, `@aiphabee/data-contracts`).
 *
 * IMPORTANT: this is a NEW, additive contract. The legacy `../../data/ipos.ts`
 * record (also named `IpoRecord`) feeds the existing `/ipos` routes and stays
 * untouched. The two never coexist in one module, so the shared type name is
 * intentional — this is the canonical workbench shape the later phases consume.
 *
 * Product semantics preserved from the prototype:
 *  - Fact layer vs analysis layer: vendor facts are tagged
 *    `provenance · netquity_hk_ipo`; AiphaBee analysis is tagged
 *    `aiphabee_research · <methodology>` (see `IpoEvidence`, `Provenance`).
 *  - Research signal != investment advice: `demandSignal` (`DemandSignal`)
 *    maps to descriptive demand wording via `DEMAND_SIGNAL_CFG`.
 *  - Field gating: sensitive fields (`cornerstones[].amount`,
 *    `applicationTiers[].applied`, 頂頭槌) render a locked state when the
 *    account is not entitled (see `LockedValue`).
 */
import type { BadgeTone } from "../../ds";

/** IPO lifecycle stage — the pipeline lanes. */
export type IpoStage =
  | "processing"
  | "subscribing"
  | "grey"
  | "allotted"
  | "withdrawn";

/** Vendor sector taxonomy (label map: `SECTOR_LABEL`). */
export type IpoSector =
  | "tech"
  | "health"
  | "fintech"
  | "industrial"
  | "energy"
  | "consumer"
  | "property";

/** HKEX listing route (label map: `LISTING_TYPE`). */
export type IpoListingType = "normal" | "18a" | "18c" | "intro";

/** Aggregate research sentiment (tone/label maps: `SENTIMENT_*`). */
export type IpoSentiment = "bullish" | "cautious" | "neutral" | "bearish";

/**
 * AiphaBee research signal key (config: `DEMAND_SIGNAL_CFG`).
 * Descriptive demand strength only (Gate-0).
 */
export type DemandSignal = "strong" | "solid" | "neutral" | "weak" | "unknown";

/** Offer terms block (vendor fact). `null` numerics = not yet disclosed. */
export interface IpoTerms {
  priceLow: number | null;
  priceHigh: number | null;
  finalPrice: number | null;
  ccy: string;
  entryFee: number | null;
  lotSize: number;
  sharesOffered: string;
  greenshoe: string;
  publicPct: number;
  intlPct: number;
  raiseHKD: string;
  mcapHKD: string;
  nta: string;
  pe: string;
  pb: string;
}

/** Subscription window (string-typed; `不适用` for By Introduction). */
export interface IpoSubPeriod {
  start: string;
  end: string;
}

/**
 * Live / point-in-time metrics. Subscribing rows carry real-time sub
 * multiples; allotted rows carry win-rate / clawback outcomes; nullable fields
 * are simply not applicable to the current stage.
 */
export interface IpoLive {
  subPublic: number | null;
  subIntl: number | null;
  marginDays: string | null;
  greyChg: number | null;
  validApps: string | null;
  oneLotRate: number | null;
  /** 頂頭槌 — sensitive; gate behind premium. */
  headHammer: string | null;
  clawbackApplied: string | null;
}

/** One timetable milestone (vendor fact). */
export interface IpoTimetableEvent {
  type: string;
  title: string;
  at: string;
  done: boolean;
  active?: boolean;
  danger?: boolean;
}

/** Public-offer pool. `apps` null until disclosed. */
export interface IpoPool {
  name: string;
  desc: string;
  lots: string;
  apps: string | null;
}

/** Clawback ladder tier; `active` marks the triggered band. */
export interface IpoClawbackTier {
  trigger: string;
  publicPct: string;
  active?: boolean;
}

/** One application-amount tier. `applied` (count) is sensitive (premium). */
export interface IpoApplicationTier {
  lots: number;
  shares: number;
  amount: number;
  rate?: string;
  hot?: boolean;
  /** Applied applicant count — sensitive; gate behind premium. */
  applied?: string;
}

/** One row of a published allotment result table. */
export interface IpoAllotmentRow {
  lots: number;
  /** Applied applicant count — sensitive; gate behind premium. */
  applied: string;
  rate: string;
}

/**
 * Published allotment outcome. `null` on the record = allotment not yet
 * announced (UI shows pending, must not error).
 */
export interface IpoAllotment {
  oneLotRate: number;
  validApps: string;
  /** 頂頭槌 — sensitive; gate behind premium. */
  headHammer: string;
  clawbackApplied: string;
  subPublic: number;
  finalPrice: number;
  result: IpoAllotmentRow[];
}

/** Cornerstone investor. `amount` is sensitive — gate behind enterprise. */
export interface IpoCornerstone {
  name: string;
  amount: string;
  pct: number;
  lockup: string;
}

/** Lock-up (禁售期) cohort. */
export interface IpoLockup {
  type: string;
  endDate: string;
  pct: string;
  shares: string;
}

/** Sponsor / bookrunner with a 0–5 rating. */
export interface IpoSponsor {
  name: string;
  role: string;
  rating: number;
}

/** Use-of-proceeds slice. */
export interface IpoProceedsSlice {
  pct: number;
  label: string;
}

/** Company-info key/value row. */
export interface IpoCompanyFact {
  k: string;
  v: string;
}

/** Company profile block (vendor fact). */
export interface IpoProfile {
  overview: string;
  useOfProceeds: IpoProceedsSlice[];
  risks: string[];
  advantages: string[];
  company: IpoCompanyFact[];
}

/** Risk-summary item severity. */
export type IpoRiskLevel = "high" | "mid" | "low";

/** One risk-summary line (analysis layer). */
export interface IpoRisk {
  level: IpoRiskLevel;
  text: string;
}

/**
 * Evidence / data-version stamp attached to every record (→ `EvidenceChip`,
 * `Provenance`). `methodology` identifies the analysis-layer model version.
 */
export interface IpoEvidence {
  asOf: string;
  dataVersion: string;
  methodology: string;
  source: string;
}

/**
 * The canonical IPO workbench record — the detail-snapshot `data` payload.
 */
export interface IpoRecord {
  // --- identity (vendor fact) ---
  id: string;
  name: string;
  cn: string;
  ticker: string;
  exchange: string;
  board: string;
  sector: IpoSector;
  listingType: IpoListingType;

  // --- lifecycle + analysis layer ---
  stage: IpoStage;
  sentiment: IpoSentiment;
  score: number;
  confidence: number;
  /** Research signal key (descriptive, non-advice). */
  demandSignal: DemandSignal;
  tierLabel: string;
  desc: string;

  // --- schedule (vendor fact) ---
  subPeriod: IpoSubPeriod;
  listingDate: string;
  pricingDate: string;
  live: IpoLive;

  // --- structured sections (vendor fact) ---
  terms: IpoTerms;
  timetable: IpoTimetableEvent[];
  /** `null` for By Introduction / not-yet-open offers (no public pool). */
  pools: IpoPool[] | null;
  /** `null` when no clawback mechanism applies (e.g. By Introduction). */
  clawback: IpoClawbackTier[] | null;
  /** `null` until application tiers are published. */
  applicationTiers: IpoApplicationTier[] | null;
  /** `null` until the allotment result is announced (UI shows pending). */
  allotment: IpoAllotment | null;
  cornerstones: IpoCornerstone[];
  lockup: IpoLockup[];
  sponsors: IpoSponsor[];

  // --- analysis layer (aiphabee_research) ---
  profile: IpoProfile;
  riskSummary: IpoRisk[];
  /** Research-signal narrative (descriptive, non-advice). */
  aiNote: string;

  // --- evidence ---
  evidence: IpoEvidence;
}

// --- lookups (typed shapes for the fixtures' label/config maps) ----------

/** One pipeline lane descriptor (`STAGES` entry). */
export interface IpoStageConfig {
  key: IpoStage;
  label: string;
  en: string;
  tone: string;
  icon: string;
}

/** Research-signal display config (`DEMAND_SIGNAL_CFG` entry). */
export interface DemandSignalConfig {
  tone: BadgeTone;
  label: string;
}

// --- API payloads (envelope `data` shapes for the new endpoints) ---------

/** Detail snapshot payload (`POST /workbench/ipo/snapshot`). */
export type IpoSnapshot = IpoRecord;

/** Filters accepted by `POST /analytics/screen-ipos`. */
export interface IpoScreenFilters {
  stage?: IpoStage;
  sector?: IpoSector;
  /** Free-text query (name / ticker / cn). */
  q?: string;
  /** Sort key (e.g. `score`, `sub`, `listing`). */
  sort?: string;
}

/** Screen result payload (`POST /analytics/screen-ipos`). */
export interface IpoScreenResult {
  rows: IpoRecord[];
  rowCount: number;
  filters: IpoScreenFilters;
}

/** Compare result payload (`POST /analytics/compare-ipos`). */
export interface IpoCompareResult {
  requested: string[];
  rows: IpoRecord[];
  rowCount: number;
}

/** One calendar agenda item (cross-IPO timetable event). */
export interface IpoCalendarEvent {
  ipoId: string;
  name: string;
  cn: string;
  ticker: string;
  stage: IpoStage;
  type: string;
  title: string;
  at: string;
  done: boolean;
}

/** Date range filter for `GET|POST /ipos/calendar`. */
export interface IpoCalendarRange {
  from?: string;
  to?: string;
}

/** Calendar result payload (`GET|POST /ipos/calendar`). */
export interface IpoCalendarResult {
  events: IpoCalendarEvent[];
  eventCount: number;
  range: IpoCalendarRange;
}
