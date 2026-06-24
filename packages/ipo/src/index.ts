export const IPO_PIPELINE_VERSION =
  "2026-06-24.phase1.ipo-pipeline-foundation.v0";
export const IPO_RIGHTS_POLICY_VERSION = "ipo-rights-policy-scaffold-v0";
export const IPO_FIXTURE_DATA_VERSION = "ipo-fixture-scaffold-v0";
export const IPO_RESEARCH_METHODOLOGY_VERSION = "ipo-research-signal@scaffold-v0";

export type IpoRightsStatus = "default_deny" | "approved" | "blocked";
export type IpoQualityState = "PASS" | "WARN" | "HOLD" | "REJECT_RAW";
export type IpoStatus = "pending" | "priced" | "listed" | "withdrawn";
export type IpoServingStatus = "fixture_scaffold" | "no_released_data" | "released_serving";
export type IpoCalendarEventType =
  | "application_start"
  | "application_end"
  | "pricing"
  | "allotment"
  | "grey_market"
  | "listing"
  | "lockup";
export type IpoResearchSignal =
  | "strong_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "strong_negative";

export interface IpoMdbTableSpec {
  name: string;
  primaryKey: string;
  recordKind: string;
}

export interface IpoCodeTableSpec {
  name: string;
  purpose: string;
}

export interface IpoProvenance {
  data_version: string;
  methodology_version: string;
  source: string;
  source_record_id: string;
}

export interface IpoOfferingFact {
  board: "MAIN" | "GEM" | "NASQ";
  boardLot: number;
  clawbackType: "A" | "B" | "NA";
  currency: "HKD" | "USD" | "RMB";
  desc: string;
  exchange: "HKEX";
  finalOfferPrice: number | null;
  fundsRaisedText: string;
  hkexCode: string;
  id: string;
  listingDate: string;
  listingType: "Normal" | "18A" | "18C";
  marketCapText: string;
  nameEn: string;
  nameZhHans: string;
  nameZhHant: string;
  offerPriceRange: [number, number] | null;
  oneLotSuccessRate: number | null;
  overSubscriptionMultiple: number | null;
  sector: "tech" | "health" | "fintech" | "industrial" | "energy";
  status: IpoStatus;
  ticker: string;
}

export interface IpoNarrativeSection {
  contentHtml: string;
  contentText: string;
  lang: "zh_hant";
  sectionKey:
    | "business_overview"
    | "competitive_strengths"
    | "risk_factors"
    | "use_of_proceeds";
  title: string;
}

export interface IpoCalendarEvent {
  date: string;
  eventCode: string;
  eventType: IpoCalendarEventType;
  offeringId: string;
  titleEn: string;
  titleZhHant: string;
}

export interface IpoCornerstoneFact {
  amountText: string | null;
  investorName: string;
  lockupPeriod: string | null;
  pct: number | null;
  redacted: boolean;
}

export interface IpoResearchDimension {
  key: string;
  label: string;
  score: number;
}

export interface IpoResearchSignalBlock {
  confidence: number;
  dims: IpoResearchDimension[];
  methodologyVersion: typeof IPO_RESEARCH_METHODOLOGY_VERSION;
  note: string;
  signal: IpoResearchSignal;
  source: "aiphabee_research";
  status: "descriptive_signal_not_advice";
}

export interface IpoAccessPolicy {
  defaultRightsStatus: "default_deny";
  exportAllowed: false;
  fieldAuthorizationRequired: true;
  mcpRedistributionAllowed: false;
  pointInTimeRequired: true;
  redactedFields: string[];
}

export interface IpoCapabilities {
  access_policy: IpoAccessPolicy;
  code_table_count: number;
  default_rights_status: "default_deny";
  expected_newipo_table_count: number;
  fact_and_analysis_separated: true;
  live_data_access: boolean;
  mdb_fixture_committed: false;
  package: "@aiphabee/ipo";
  release_state_required: true;
  status: "ipo_pipeline_scaffold" | "released_serving";
  version: typeof IPO_PIPELINE_VERSION;
}

export interface IpoWorkbenchSnapshot {
  accessPolicy: IpoAccessPolicy;
  capability: IpoCapabilities;
  cornerstones: IpoCornerstoneFact[];
  dataVersion: string;
  liveDataAccess: boolean;
  methodologyVersion: typeof IPO_PIPELINE_VERSION;
  narratives: IpoNarrativeSection[];
  offering: IpoOfferingFact;
  provenance: IpoProvenance[];
  qualityState: IpoQualityState;
  researchSignal: IpoResearchSignalBlock;
  status: IpoServingStatus;
  timetable: IpoCalendarEvent[];
  toolName: "get_ipo_profile";
}

export interface IpoScreenInput {
  board?: string;
  hasCornerstone?: boolean;
  listingDateFrom?: string;
  listingDateTo?: string;
  listingType?: string;
  minOversubscription?: number;
  sector?: string;
  status?: string;
}

export interface IpoScreenResult {
  accessPolicy: IpoAccessPolicy;
  dataVersion: string;
  filters: IpoScreenInput;
  liveDataAccess: boolean;
  methodologyVersion: typeof IPO_PIPELINE_VERSION;
  rows: IpoOfferingFact[];
  status: IpoServingStatus;
  toolName: "screen_ipos";
  totalRows: number;
}

export interface IpoCalendarResult {
  accessPolicy: IpoAccessPolicy;
  dataVersion: string;
  events: IpoCalendarEvent[];
  liveDataAccess: boolean;
  methodologyVersion: typeof IPO_PIPELINE_VERSION;
  status: IpoServingStatus;
  toolName: "search_ipo_calendar";
}

export interface IpoCompareResult {
  accessPolicy: IpoAccessPolicy;
  dataVersion: string;
  liveDataAccess: boolean;
  methodologyVersion: typeof IPO_PIPELINE_VERSION;
  rows: Array<
    Pick<
      IpoOfferingFact,
      | "board"
      | "finalOfferPrice"
      | "fundsRaisedText"
      | "id"
      | "listingDate"
      | "listingType"
      | "marketCapText"
      | "nameZhHant"
      | "oneLotSuccessRate"
      | "overSubscriptionMultiple"
      | "sector"
      | "ticker"
    >
  >;
  status: IpoServingStatus;
  toolName: "compare_ipos";
}

export const IPO_EXPECTED_NEWIPO_TABLES: IpoMdbTableSpec[] = [
  { name: "DataPeriod", primaryKey: "Nil", recordKind: "ipo_data_period" },
  { name: "DataPeriod_LockUpPeriod", primaryKey: "Nil", recordKind: "ipo_data_period" },
  { name: "DataPeriod_Plan", primaryKey: "Nil", recordKind: "ipo_data_period" },
  { name: "NewIPOInfo", primaryKey: "Code + ListingDate", recordKind: "ipo_overview" },
  { name: "ExpectedTimetable", primaryKey: "Code + ListingDate", recordKind: "ipo_timetable" },
  { name: "CompanySummary", primaryKey: "Code + ListingDate", recordKind: "ipo_summary" },
  { name: "OfferStatistics", primaryKey: "Code + ListingDate", recordKind: "ipo_offer_statistics" },
  { name: "PartiesInvolved", primaryKey: "Code + ListingDate", recordKind: "ipo_parties" },
  { name: "CompInfo", primaryKey: "Code + ListingDate", recordKind: "ipo_corporate_info" },
  { name: "CSI_Info", primaryKey: "Code + ListingDate + CSI_EngName", recordKind: "ipo_cornerstone" },
  { name: "Pool", primaryKey: "Code + ListingDate", recordKind: "ipo_pool" },
  { name: "ClawBack", primaryKey: "Code + ListingDate", recordKind: "ipo_clawback" },
  { name: "AllotmentResult", primaryKey: "Code + ListingDate + Pool + Share_App", recordKind: "ipo_allotment" },
  { name: "AllotmentSummary", primaryKey: "Code + ListingDate", recordKind: "ipo_allotment" },
  { name: "Plan_Info", primaryKey: "AppCode", recordKind: "ipo_pipeline" },
  { name: "App_Detail", primaryKey: "Code + ListingDate", recordKind: "ipo_application" },
  { name: "App_Share", primaryKey: "Code + ListingDate + Pool + Share_App", recordKind: "ipo_application" },
  { name: "LockUpPeriod", primaryKey: "Code + ListingDate + LockUpShareType + LockUpEndDate1", recordKind: "ipo_lockup" }
];

export const IPO_REFERENCED_CODE_TABLES: IpoCodeTableSpec[] = [
  { name: "CurrencyCode", purpose: "currency labels" },
  { name: "SectorCode", purpose: "sector labels" },
  { name: "IndustryCode", purpose: "industry labels" },
  { name: "SubIndustryCode", purpose: "sub-industry labels" },
  { name: "RegistrarCode", purpose: "registrar labels" },
  { name: "LockUpShareType", purpose: "lock-up share type labels" }
];

export const IPO_ACCESS_POLICY: IpoAccessPolicy = {
  defaultRightsStatus: "default_deny",
  exportAllowed: false,
  fieldAuthorizationRequired: true,
  mcpRedistributionAllowed: false,
  pointInTimeRequired: true,
  redactedFields: [
    "ipo_cornerstone.invest_amount",
    "ipo_offer_statistic.forward_looking_value",
    "ipo_allotment_result.valid_application_count",
    "ipo_pipeline_application.business_overview_zh_hant"
  ]
};

const FIXTURE_OFFERINGS: IpoOfferingFact[] = [
  {
    board: "MAIN",
    boardLot: 100,
    clawbackType: "A",
    currency: "HKD",
    desc: "AI 投研基础设施服务商，为机构提供多模型估值与尽调自动化。供应商事实与 AiphaBee 分析信号分开展示。",
    exchange: "HKEX",
    finalOfferPrice: null,
    fundsRaisedText: "HKD 4.2B",
    hkexCode: "2769",
    id: "honeycomb",
    listingDate: "2026-06-24",
    listingType: "Normal",
    marketCapText: "HKD 38.6B",
    nameEn: "Honeycomb Intelligence",
    nameZhHans: "蜂巢智能",
    nameZhHant: "蜂巢智能",
    offerPriceRange: [22.4, 24.8],
    oneLotSuccessRate: null,
    overSubscriptionMultiple: 128.4,
    sector: "tech",
    status: "pending",
    ticker: "2769.HK"
  },
  {
    board: "MAIN",
    boardLot: 200,
    clawbackType: "B",
    currency: "HKD",
    desc: "东南亚跨境支付与数字钱包龙头，盈利稳健，监管护城河深厚。",
    exchange: "HKEX",
    finalOfferPrice: null,
    fundsRaisedText: "HKD 6.8B",
    hkexCode: "2611",
    id: "lotus",
    listingDate: "2026-06-27",
    listingType: "Normal",
    marketCapText: "HKD 92.1B",
    nameEn: "Lotus Digital Pay",
    nameZhHans: "莲花数科",
    nameZhHant: "蓮花數科",
    offerPriceRange: [16.8, 18.2],
    oneLotSuccessRate: null,
    overSubscriptionMultiple: 64.2,
    sector: "fintech",
    status: "pending",
    ticker: "2611.HK"
  },
  {
    board: "MAIN",
    boardLot: 500,
    clawbackType: "NA",
    currency: "HKD",
    desc: "创新药企，核心管线处于 II 期临床。未盈利，估值依赖里程碑预期。",
    exchange: "HKEX",
    finalOfferPrice: 9.6,
    fundsRaisedText: "HKD 1.1B",
    hkexCode: "2197",
    id: "pearl",
    listingDate: "2026-06-20",
    listingType: "18A",
    marketCapText: "HKD 8.4B",
    nameEn: "Pearl River Biotech",
    nameZhHans: "珠江生物",
    nameZhHant: "珠江生物",
    offerPriceRange: [8.8, 9.6],
    oneLotSuccessRate: 33.2,
    overSubscriptionMultiple: 12.6,
    sector: "health",
    status: "priced",
    ticker: "2197.HK"
  },
  {
    board: "MAIN",
    boardLot: 500,
    clawbackType: "NA",
    currency: "HKD",
    desc: "区域智能仓储与冷链物流运营商，现金流稳定，成长性中性。",
    exchange: "HKEX",
    finalOfferPrice: null,
    fundsRaisedText: "HKD 2.4B",
    hkexCode: "9699",
    id: "apex",
    listingDate: "2026-06-30",
    listingType: "Normal",
    marketCapText: "HKD 21.0B",
    nameEn: "Apex Logistics",
    nameZhHans: "顶峰物流",
    nameZhHant: "頂峰物流",
    offerPriceRange: [12.1, 13.4],
    oneLotSuccessRate: null,
    overSubscriptionMultiple: 6.8,
    sector: "industrial",
    status: "pending",
    ticker: "9699.HK"
  },
  {
    board: "MAIN",
    boardLot: 1000,
    clawbackType: "NA",
    currency: "HKD",
    desc: "光伏组件制造商，行业产能过剩、毛利承压。上市首日破发。",
    exchange: "HKEX",
    finalOfferPrice: 6.2,
    fundsRaisedText: "HKD 0.9B",
    hkexCode: "0586",
    id: "greenfield",
    listingDate: "2026-06-12",
    listingType: "Normal",
    marketCapText: "HKD 5.6B",
    nameEn: "GreenField Energy",
    nameZhHans: "绿野能源",
    nameZhHant: "綠野能源",
    offerPriceRange: [5.8, 6.2],
    oneLotSuccessRate: 65.4,
    overSubscriptionMultiple: 2.1,
    sector: "energy",
    status: "listed",
    ticker: "0586.HK"
  }
];

const RESEARCH_SIGNALS: Record<string, IpoResearchSignalBlock> = {
  apex: createResearchSignal("neutral", 55, [50, 58, 52, 44, 60, 38], "需求平淡，认购偏冷，缺乏基石支撑；现金流稳定但成长性中性。"),
  greenfield: createResearchSignal("negative", 64, [28, 40, 35, 22, 30, 18], "行业景气度低、认购冷淡，上市首日已破发；行业产能与毛利是主要风险。"),
  honeycomb: createResearchSignal("strong_positive", 86, [82, 88, 74, 90, 68, 84], "科技板块情绪向好，叠加强认购需求；该信号仅用于研究观察，不构成建议。"),
  lotus: createResearchSignal("positive", 74, [70, 80, 78, 66, 82, 72], "基本面扎实，认购需求健康；盈利质量与监管护城河是主要支撑维度。"),
  pearl: createResearchSignal("neutral", 61, [58, 62, 55, 48, 40, 60], "18A 未盈利生物科技，估值依赖临床里程碑，基本面评分偏低。")
};

const CORNERSTONES: Record<string, IpoCornerstoneFact[]> = {
  honeycomb: [
    { amountText: "HKD 600M", investorName: "Hillhouse 高瓴", lockupPeriod: "6 months", pct: 14.3, redacted: false },
    { amountText: "HKD 420M", investorName: "GIC Singapore", lockupPeriod: "6 months", pct: 10.0, redacted: false },
    { amountText: "HKD 380M", investorName: "Tencent 腾讯", lockupPeriod: "6 months", pct: 9.0, redacted: false }
  ],
  lotus: [
    { amountText: "HKD 800M", investorName: "Temasek 淡马锡", lockupPeriod: "6 months", pct: 11.8, redacted: false },
    { amountText: "HKD 500M", investorName: "BlackRock", lockupPeriod: "6 months", pct: 7.4, redacted: false }
  ],
  pearl: [
    { amountText: "HKD 220M", investorName: "Qiming 启明创投", lockupPeriod: "6 months", pct: 20.0, redacted: false }
  ]
};

export function getIpoCapabilities(
  input: {
    liveDataAccess?: boolean;
    status?: IpoCapabilities["status"];
  } = {}
): IpoCapabilities {
  return {
    access_policy: IPO_ACCESS_POLICY,
    code_table_count: IPO_REFERENCED_CODE_TABLES.length,
    default_rights_status: "default_deny" as const,
    expected_newipo_table_count: IPO_EXPECTED_NEWIPO_TABLES.length,
    fact_and_analysis_separated: true,
    live_data_access: input.liveDataAccess === true,
    mdb_fixture_committed: false,
    package: "@aiphabee/ipo",
    release_state_required: true,
    status: input.status ?? "ipo_pipeline_scaffold",
    version: IPO_PIPELINE_VERSION
  };
}

export function listIpoOfferings(): IpoOfferingFact[] {
  return FIXTURE_OFFERINGS.map((offering) => ({ ...offering }));
}

export function findIpoOffering(idOrCode: string | undefined): IpoOfferingFact | undefined {
  if (!idOrCode) {
    return FIXTURE_OFFERINGS[0];
  }

  const normalized = idOrCode.toLowerCase().replace(/\.hk$/u, "");
  return FIXTURE_OFFERINGS.find(
    (offering) =>
      offering.id === normalized ||
      offering.hkexCode === normalized.padStart(4, "0") ||
      offering.ticker.toLowerCase() === idOrCode.toLowerCase()
  );
}

export function createIpoWorkbenchSnapshot(input: {
  includeSensitiveFields?: boolean;
  ipoId?: string;
} = {}): IpoWorkbenchSnapshot {
  const offering = findIpoOffering(input.ipoId);
  if (!offering) {
    throw new IpoNotFoundError(input.ipoId ?? "");
  }

  const cornerstones = maybeRedactCornerstones(
    CORNERSTONES[offering.id] ?? [],
    input.includeSensitiveFields === true
  );

  return {
    accessPolicy: IPO_ACCESS_POLICY,
    capability: getIpoCapabilities(),
    cornerstones,
    dataVersion: IPO_FIXTURE_DATA_VERSION,
    liveDataAccess: false,
    methodologyVersion: IPO_PIPELINE_VERSION,
    narratives: createNarratives(offering),
    offering: { ...offering },
    provenance: createProvenance(offering.id),
    qualityState: "HOLD",
    researchSignal: RESEARCH_SIGNALS[offering.id],
    status: "fixture_scaffold",
    timetable: createTimetable(offering),
    toolName: "get_ipo_profile"
  };
}

export function screenIpos(input: IpoScreenInput = {}): IpoScreenResult {
  const rows = listIpoOfferings().filter((offering) => {
    if (input.status && offering.status !== input.status) return false;
    if (input.board && offering.board !== input.board) return false;
    if (input.sector && offering.sector !== input.sector) return false;
    if (input.listingType && offering.listingType !== input.listingType) return false;
    if (
      input.minOversubscription !== undefined &&
      (offering.overSubscriptionMultiple ?? 0) < input.minOversubscription
    ) {
      return false;
    }
    if (input.hasCornerstone === true && (CORNERSTONES[offering.id] ?? []).length === 0) {
      return false;
    }
    if (input.listingDateFrom && offering.listingDate < input.listingDateFrom) return false;
    if (input.listingDateTo && offering.listingDate > input.listingDateTo) return false;
    return true;
  });

  return {
    accessPolicy: IPO_ACCESS_POLICY,
    dataVersion: IPO_FIXTURE_DATA_VERSION,
    filters: input,
    liveDataAccess: false,
    methodologyVersion: IPO_PIPELINE_VERSION,
    rows,
    status: "fixture_scaffold",
    toolName: "screen_ipos",
    totalRows: rows.length
  };
}

export function searchIpoCalendar(input: {
  eventTypes?: IpoCalendarEventType[];
  from?: string;
  to?: string;
} = {}): IpoCalendarResult {
  const events = FIXTURE_OFFERINGS.flatMap((offering) => createTimetable(offering))
    .filter((event) => !input.from || event.date >= input.from)
    .filter((event) => !input.to || event.date <= input.to)
    .filter((event) => !input.eventTypes?.length || input.eventTypes.includes(event.eventType))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    accessPolicy: IPO_ACCESS_POLICY,
    dataVersion: IPO_FIXTURE_DATA_VERSION,
    events,
    liveDataAccess: false,
    methodologyVersion: IPO_PIPELINE_VERSION,
    status: "fixture_scaffold",
    toolName: "search_ipo_calendar"
  };
}

export function compareIpos(input: { ipoIds?: string[] } = {}): IpoCompareResult {
  const ids = input.ipoIds?.length ? input.ipoIds : ["honeycomb", "lotus", "pearl"];
  const rows = ids
    .map((id) => findIpoOffering(id))
    .filter((row): row is IpoOfferingFact => Boolean(row))
    .slice(0, 5)
    .map((offering) => ({
      board: offering.board,
      finalOfferPrice: offering.finalOfferPrice,
      fundsRaisedText: offering.fundsRaisedText,
      id: offering.id,
      listingDate: offering.listingDate,
      listingType: offering.listingType,
      marketCapText: offering.marketCapText,
      nameZhHant: offering.nameZhHant,
      oneLotSuccessRate: offering.oneLotSuccessRate,
      overSubscriptionMultiple: offering.overSubscriptionMultiple,
      sector: offering.sector,
      ticker: offering.ticker
    }));

  return {
    accessPolicy: IPO_ACCESS_POLICY,
    dataVersion: IPO_FIXTURE_DATA_VERSION,
    liveDataAccess: false,
    methodologyVersion: IPO_PIPELINE_VERSION,
    rows,
    status: "fixture_scaffold",
    toolName: "compare_ipos"
  };
}

export class IpoNotFoundError extends Error {
  constructor(ipoId: string) {
    super(`No IPO matches id "${ipoId}".`);
    this.name = "IpoNotFoundError";
  }
}

function createResearchSignal(
  signal: IpoResearchSignal,
  confidence: number,
  scores: [number, number, number, number, number, number],
  note: string
): IpoResearchSignalBlock {
  const labels = [
    ["chip", "筹码分布"],
    ["sponsor", "保荐质量"],
    ["underwriter", "承销实力"],
    ["sector", "板块动能"],
    ["fundamentals", "基本面"],
    ["cornerstone", "基石质量"]
  ] as const;

  return {
    confidence,
    dims: labels.map(([key, label], index) => ({ key, label, score: scores[index] })),
    methodologyVersion: IPO_RESEARCH_METHODOLOGY_VERSION,
    note,
    signal,
    source: "aiphabee_research",
    status: "descriptive_signal_not_advice"
  };
}

function maybeRedactCornerstones(
  cornerstones: IpoCornerstoneFact[],
  includeSensitiveFields: boolean
): IpoCornerstoneFact[] {
  return cornerstones.map((cornerstone) => ({
    ...cornerstone,
    amountText: includeSensitiveFields ? cornerstone.amountText : null,
    redacted: includeSensitiveFields ? false : true
  }));
}

function createNarratives(offering: IpoOfferingFact): IpoNarrativeSection[] {
  return [
    {
      contentHtml: `<p>${offering.desc}</p>`,
      contentText: offering.desc,
      lang: "zh_hant",
      sectionKey: "business_overview",
      title: "业务概览 Business Overview"
    },
    {
      contentHtml: "<p>供应商 Memo 经过白名单 HTML 清洗后进入 serving；当前为 fixture scaffold。</p>",
      contentText: "供应商 Memo 经过白名单 HTML 清洗后进入 serving；当前为 fixture scaffold。",
      lang: "zh_hant",
      sectionKey: "risk_factors",
      title: "风险因素 Risk Factors"
    }
  ];
}

function createTimetable(offering: IpoOfferingFact): IpoCalendarEvent[] {
  return [
    createEvent(offering, "ETDate03", "application_start", -5, "招股开始", "Application opens"),
    createEvent(offering, "ETDate09", "application_end", -2, "招股截止", "Application closes"),
    createEvent(offering, "PRICE", "pricing", -1, "定价", "Pricing"),
    createEvent(offering, "LISTING", "listing", 0, "上市", "Listing")
  ];
}

function createEvent(
  offering: IpoOfferingFact,
  eventCode: string,
  eventType: IpoCalendarEventType,
  dayOffset: number,
  titleZhHant: string,
  titleEn: string
): IpoCalendarEvent {
  const date = new Date(`${offering.listingDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);

  return {
    date: date.toISOString().slice(0, 10),
    eventCode,
    eventType,
    offeringId: offering.id,
    titleEn,
    titleZhHant
  };
}

function createProvenance(offeringId: string): IpoProvenance[] {
  return [
    {
      data_version: IPO_FIXTURE_DATA_VERSION,
      methodology_version: IPO_PIPELINE_VERSION,
      source: "ipo-fixture",
      source_record_id: `ipo-fixture:${offeringId}`
    },
    {
      data_version: IPO_FIXTURE_DATA_VERSION,
      methodology_version: IPO_RESEARCH_METHODOLOGY_VERSION,
      source: "aiphabee_research",
      source_record_id: `ipo-research-signal:${offeringId}`
    }
  ];
}
