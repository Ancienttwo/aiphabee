/**
 * Rich IPO workbench record contract (FP1).
 *
 * Mirrors the design prototype's mock record shape
 * (`docs/AiphaBee Design System/apps/ipo-workbench/data.jsx`) — the source of
 * truth for the IPO workbench's fields, lookups, and product semantics. This
 * `IpoRecord` is the fixture-authoring contract. `ResolvedIpoRecord` describes
 * the locale-selected `data` payload returned inside the shared
 * `ResponseEnvelope<T>` (see `./types`, `@aiphabee/data-contracts`).
 *
 * IMPORTANT: locale-keyed fixture records never cross the response boundary;
 * the mock API resolves every textual leaf before returning a payload.
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

/** Locales carried by authoritative IPO fixture prose. */
export type IpoContentLocale = "zh-Hant" | "zh-Hans" | "en";

/**
 * One authoritative piece of IPO prose in every supported locale.
 * Partial locale maps are forbidden: consumers select the requested value
 * without fallback or machine-generated translation.
 */
export interface IpoLocalizedText {
  readonly kind: "ipo_localized_text";
  readonly values: Readonly<Record<IpoContentLocale, string>>;
}

/** Replace locale-keyed prose leaves with the selected display string. */
export type ResolvedIpoValue<T> = T extends IpoLocalizedText
  ? string
  : T extends ReadonlyArray<infer Item>
    ? ResolvedIpoValue<Item>[]
    : T extends object
      ? { [Key in keyof T]: ResolvedIpoValue<T[Key]> }
      : T;

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

/**
 * Offer terms block (vendor fact). `null` numerics = not yet disclosed;
 * textual vendor values are authoritative for all supported locales.
 */
export interface IpoTerms {
  priceLow: number | null;
  priceHigh: number | null;
  finalPrice: number | null;
  ccy: string;
  entryFee: number | null;
  lotSize: number;
  sharesOffered: IpoLocalizedText;
  greenshoe: IpoLocalizedText;
  publicPct: number;
  intlPct: number;
  raiseHKD: IpoLocalizedText;
  mcapHKD: IpoLocalizedText;
  nta: IpoLocalizedText;
  pe: IpoLocalizedText;
  pb: IpoLocalizedText;
}

/** Subscription window with locale-authoritative display values. */
export interface IpoSubPeriod {
  start: IpoLocalizedText;
  end: IpoLocalizedText;
}

/**
 * Live / point-in-time metrics. Subscribing rows carry real-time sub
 * multiples; allotted rows carry win-rate / clawback outcomes; nullable fields
 * are simply not applicable to the current stage.
 */
export interface IpoLive {
  subPublic: number | null;
  subIntl: number | null;
  marginDays: IpoLocalizedText | null;
  greyChg: number | null;
  validApps: IpoLocalizedText | null;
  oneLotRate: number | null;
  /** 頂頭槌 — sensitive; gate behind premium. */
  headHammer: IpoLocalizedText | null;
  clawbackApplied: IpoLocalizedText | null;
}

/** One timetable milestone (vendor fact). */
export interface IpoTimetableEvent {
  type: string;
  title: IpoLocalizedText;
  at: IpoLocalizedText;
  done: boolean;
  active?: boolean;
  danger?: boolean;
}

/** Public-offer pool. `apps` null until disclosed. */
export interface IpoPool {
  name: string;
  desc: IpoLocalizedText;
  lots: IpoLocalizedText;
  apps: IpoLocalizedText | null;
}

/** Clawback ladder tier; `active` marks the triggered band. */
export interface IpoClawbackTier {
  trigger: IpoLocalizedText;
  publicPct: IpoLocalizedText;
  active?: boolean;
}

/** One application-amount tier. `applied` (count) is sensitive (premium). */
export interface IpoApplicationTier {
  lots: number;
  shares: number;
  amount: number;
  rate?: IpoLocalizedText;
  hot?: boolean;
  /** Applied applicant count — sensitive; gate behind premium. */
  applied?: IpoLocalizedText;
}

/** One row of a published allotment result table. */
export interface IpoAllotmentRow {
  lots: number;
  /** Applied applicant count — sensitive; gate behind premium. */
  applied: IpoLocalizedText;
  rate: IpoLocalizedText;
}

/**
 * Published allotment outcome. `null` on the record = allotment not yet
 * announced (UI shows pending, must not error).
 */
export interface IpoAllotment {
  oneLotRate: number;
  validApps: IpoLocalizedText;
  /** 頂頭槌 — sensitive; gate behind premium. */
  headHammer: IpoLocalizedText;
  clawbackApplied: IpoLocalizedText;
  subPublic: number;
  finalPrice: number;
  result: IpoAllotmentRow[];
}

/** Cornerstone investor. `amount` is sensitive — gate behind enterprise. */
export interface IpoCornerstone {
  name: string;
  amount: IpoLocalizedText;
  pct: number;
  lockup: IpoLocalizedText;
}

/** Lock-up (禁售期) cohort. */
export interface IpoLockup {
  type: IpoLocalizedText;
  endDate: IpoLocalizedText;
  pct: IpoLocalizedText;
  shares: IpoLocalizedText;
}

/** Sponsor / bookrunner with a 0–5 rating. */
export interface IpoSponsor {
  name: string;
  role: IpoLocalizedText;
  rating: number;
}

/** Use-of-proceeds slice. */
export interface IpoProceedsSlice {
  pct: number;
  label: IpoLocalizedText;
}

/** Company-info key/value row. */
export interface IpoCompanyFact {
  k: IpoLocalizedText;
  v: IpoLocalizedText;
}

/** Company profile block (vendor fact). */
export interface IpoProfile {
  overview: IpoLocalizedText;
  useOfProceeds: IpoProceedsSlice[];
  risks: IpoLocalizedText[];
  advantages: IpoLocalizedText[];
  company: IpoCompanyFact[];
}

/** Risk-summary item severity. */
export type IpoRiskLevel = "high" | "mid" | "low";

/** One risk-summary line (analysis layer). */
export interface IpoRisk {
  level: IpoRiskLevel;
  text: IpoLocalizedText;
}

/**
 * Evidence / data-version stamp attached to every record (→ `EvidenceChip`,
 * `Provenance`). `methodology` identifies the analysis-layer model version.
 */
export interface IpoEvidence {
  asOf: string;
  dataVersion: string;
  methodology: string;
  source: IpoLocalizedText;
}

/**
 * Canonical locale-keyed IPO fixture record before presentation selection.
 */
export interface IpoRecord {
  // --- identity (vendor fact) ---
  id: string;
  name: string;
  cn: string;
  ticker: string;
  exchange: string;
  board: IpoLocalizedText;
  sector: IpoSector;
  listingType: IpoListingType;

  // --- lifecycle + analysis layer ---
  stage: IpoStage;
  sentiment: IpoSentiment;
  score: number;
  confidence: number;
  /** Research signal key (descriptive, non-advice). */
  demandSignal: DemandSignal;
  tierLabel: IpoLocalizedText;
  desc: IpoLocalizedText;

  // --- schedule (vendor fact) ---
  subPeriod: IpoSubPeriod;
  listingDate: IpoLocalizedText;
  pricingDate: IpoLocalizedText;
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
  aiNote: IpoLocalizedText;

  // --- evidence ---
  evidence: IpoEvidence;
}

/** Locale-resolved payload returned by the mock API and rendered by the UI. */
export type ResolvedIpoRecord = ResolvedIpoValue<IpoRecord>;

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
export type IpoSnapshot = ResolvedIpoRecord;

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
  rows: ResolvedIpoRecord[];
  rowCount: number;
  filters: IpoScreenFilters;
}

/** Compare result payload (`POST /analytics/compare-ipos`). */
export interface IpoCompareResult {
  requested: string[];
  rows: ResolvedIpoRecord[];
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
