import {
  resolveSecurity,
  type ResolveSecurityResult
} from "@aiphabee/security-tools";

export const DOCUMENT_TOOLS_VERSION =
  "2026-06-21.phase2.search-announcements-scaffold.v0";

export type SearchAnnouncementCategory = "buyback" | "dividend" | "results";
export type SearchAnnouncementLanguage = "en" | "zh-Hant";
export type SearchAnnouncementsStatus = "blocked_resolution" | "found" | "not_found";

export interface SearchAnnouncementsInput {
  asOf?: string;
  categories?: string[];
  from?: string;
  instrumentId?: string;
  keyword?: string;
  language?: string;
  limit?: number;
  requestId: string;
  securityQuery?: string;
  to?: string;
}

export interface AnnouncementEvidenceLocator {
  anchor: string;
  document_id: string;
  external_href_authority: false;
  locator_type: "synthetic_original_locator";
  original_url: string;
  page: number;
  source_record_id: string;
}

export interface SearchAnnouncementResultItem {
  announcement_id: string;
  category: SearchAnnouncementCategory;
  document_id: string;
  evidence_locator: AnnouncementEvidenceLocator;
  instrument_id: string;
  language: SearchAnnouncementLanguage;
  matched_fields: string[];
  published_at: string;
  source_record_id: string;
  summary: string;
  symbol: string;
  title: string;
  untrusted_document: true;
}

export interface SearchAnnouncementsResult {
  as_of: string;
  categories: SearchAnnouncementCategory[];
  data_version: typeof DOCUMENT_TOOLS_VERSION;
  document_trust_policy: {
    content_is_untrusted_data: true;
    prompt_injection_isolated: true;
    scripts_executable: false;
  };
  evidence_locator_ready: true;
  filters: {
    date_basis: "published_at";
    from: string;
    keyword?: string;
    language?: SearchAnnouncementLanguage;
    limit: number;
    security_query?: string;
    to: string;
  };
  frontend_rendering: false;
  instrument_id?: string;
  live_data_access: false;
  methodology_version: typeof DOCUMENT_TOOLS_VERSION;
  original_document_fetch: false;
  resolve_security?: ResolveSecurityResult;
  results: SearchAnnouncementResultItem[];
  row_count: number;
  search_engine: "synthetic_filter_scaffold";
  sql_emitted: false;
  status: SearchAnnouncementsStatus;
  toolName: "search_announcements";
  total_count: number;
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  vector_search: false;
}

interface SyntheticAnnouncementRecord {
  announcement_id: string;
  category: SearchAnnouncementCategory;
  evidence_locator: AnnouncementEvidenceLocator;
  instrument_id: string;
  language: SearchAnnouncementLanguage;
  published_at: string;
  source_record_id: string;
  summary: string;
  symbol: string;
  title: string;
}

const DEFAULT_FROM = "2024-01-01";
const DEFAULT_TO = "2026-01-07";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 5;
const ALL_CATEGORIES: SearchAnnouncementCategory[] = ["results", "dividend", "buyback"];

const SYNTHETIC_ANNOUNCEMENTS: readonly SyntheticAnnouncementRecord[] = [
  {
    announcement_id: "ann_00700_20240320_results",
    category: "results",
    evidence_locator: createAnnouncementLocator(
      "ann_00700_20240320_results",
      "src_announcement_00700_20240320_results",
      4,
      "financial-highlights"
    ),
    instrument_id: "eq_hk_00700",
    language: "en",
    published_at: "2024-03-20T18:30:00+08:00",
    source_record_id: "src_announcement_00700_20240320_results",
    summary: "Annual results announcement with financial highlights and FY metrics.",
    symbol: "00700.HK",
    title: "Annual Results Announcement for the Year Ended 31 December 2023"
  },
  {
    announcement_id: "ann_00700_20260103_dividend",
    category: "dividend",
    evidence_locator: createAnnouncementLocator(
      "ann_00700_20260103_dividend",
      "src_announcement_00700_20260103_dividend",
      2,
      "dividend-timetable"
    ),
    instrument_id: "eq_hk_00700",
    language: "en",
    published_at: "2026-01-03T12:00:00+08:00",
    source_record_id: "src_announcement_00700_20260103_dividend",
    summary: "Dividend timetable announcement with ex-date and payment-date evidence anchors.",
    symbol: "00700.HK",
    title: "Dividend Timetable Update"
  },
  {
    announcement_id: "ann_00700_20260106_buyback",
    category: "buyback",
    evidence_locator: createAnnouncementLocator(
      "ann_00700_20260106_buyback",
      "src_announcement_00700_20260106_buyback",
      1,
      "repurchase-summary"
    ),
    instrument_id: "eq_hk_00700",
    language: "zh-Hant",
    published_at: "2026-01-06T18:00:00+08:00",
    source_record_id: "src_announcement_00700_20260106_buyback",
    summary: "Share repurchase disclosure with quantity and consideration evidence anchors.",
    symbol: "00700.HK",
    title: "翌日披露報表 - 股份購回"
  },
  {
    announcement_id: "ann_00001_20260105_results",
    category: "results",
    evidence_locator: createAnnouncementLocator(
      "ann_00001_20260105_results",
      "src_announcement_00001_20260105_results",
      3,
      "segment-results"
    ),
    instrument_id: "eq_hk_00001",
    language: "en",
    published_at: "2026-01-05T17:45:00+08:00",
    source_record_id: "src_announcement_00001_20260105_results",
    summary: "Quarterly trading update with segment revenue and outlook commentary.",
    symbol: "00001.HK",
    title: "Quarterly Trading Update"
  }
];

export function getSearchAnnouncementsCapabilities() {
  return {
    categories: ALL_CATEGORIES,
    date_basis: "published_at" as const,
    evidence_locator_ready: true,
    frontend_rendering: false,
    live_data_access: false,
    max_limit: MAX_LIMIT,
    original_document_fetch: false,
    package: "@aiphabee/document-tools" as const,
    route: "POST /documents/search-announcements" as const,
    search_engine: "synthetic_filter_scaffold" as const,
    status: "search_announcements_scaffold" as const,
    supported_filters: ["instrument_id", "security_query", "from", "to", "categories", "keyword", "language"] as const,
    tool_name: "search_announcements" as const,
    untrusted_document_policy: true,
    version: DOCUMENT_TOOLS_VERSION,
    vector_search: false
  };
}

export function getDocumentToolsCapabilities() {
  return {
    frontend_rendering: false,
    live_data_access: false,
    package: "@aiphabee/document-tools" as const,
    route: "POST /documents/search-announcements" as const,
    runtime_route: "GET /documents/runtime" as const,
    search_announcements: getSearchAnnouncementsCapabilities(),
    status: "document_tools_scaffold" as const,
    version: DOCUMENT_TOOLS_VERSION
  };
}

export function searchAnnouncements(
  input: SearchAnnouncementsInput
): SearchAnnouncementsResult {
  const asOf = input.asOf ?? "2026-01-07T16:15:00+08:00";
  const from = input.from ?? DEFAULT_FROM;
  const to = input.to ?? DEFAULT_TO;
  const categories = normalizeCategories(input.categories);
  const language = normalizeLanguage(input.language);
  const limit = normalizeLimit(input.limit);
  const keyword = input.keyword?.trim();
  const resolution =
    input.instrumentId === undefined && input.securityQuery !== undefined
      ? resolveSecurity({
          asOf: input.asOf,
          query: input.securityQuery
        })
      : undefined;
  const instrumentId = input.instrumentId ?? resolution?.selectedInstrumentId;
  const filters: SearchAnnouncementsResult["filters"] = {
    date_basis: "published_at",
    from,
    keyword: keyword === "" ? undefined : keyword,
    language,
    limit,
    security_query: input.securityQuery,
    to
  };

  if (instrumentId === undefined) {
    return {
      as_of: asOf,
      categories,
      data_version: DOCUMENT_TOOLS_VERSION,
      document_trust_policy: createDocumentTrustPolicy(),
      evidence_locator_ready: true,
      filters,
      frontend_rendering: false,
      live_data_access: false,
      methodology_version: DOCUMENT_TOOLS_VERSION,
      original_document_fetch: false,
      resolve_security: resolution,
      results: [],
      row_count: 0,
      search_engine: "synthetic_filter_scaffold",
      sql_emitted: false,
      status: "blocked_resolution",
      toolName: "search_announcements",
      total_count: 0,
      usage: {
        cached: false,
        credits: 0,
        rows: 0
      },
      vector_search: false
    };
  }

  const normalizedKeyword = keyword?.toLowerCase();
  const matchingAnnouncements = SYNTHETIC_ANNOUNCEMENTS.filter(
    (announcement) =>
      announcement.instrument_id === instrumentId &&
      categories.includes(announcement.category) &&
      (language === undefined || announcement.language === language) &&
      announcement.published_at.slice(0, 10) >= from &&
      announcement.published_at.slice(0, 10) <= to &&
      createAnnouncementMatchedFields(announcement, normalizedKeyword).length > 0
  ).sort((left, right) => right.published_at.localeCompare(left.published_at));
  const results = matchingAnnouncements.slice(0, limit).map((announcement) =>
    createSearchAnnouncementResultItem(announcement, normalizedKeyword)
  );

  return {
    as_of: asOf,
    categories,
    data_version: DOCUMENT_TOOLS_VERSION,
    document_trust_policy: createDocumentTrustPolicy(),
    evidence_locator_ready: true,
    filters,
    frontend_rendering: false,
    instrument_id: instrumentId,
    live_data_access: false,
    methodology_version: DOCUMENT_TOOLS_VERSION,
    original_document_fetch: false,
    resolve_security: resolution,
    results,
    row_count: results.length,
    search_engine: "synthetic_filter_scaffold",
    sql_emitted: false,
    status: results.length > 0 ? "found" : "not_found",
    toolName: "search_announcements",
    total_count: matchingAnnouncements.length,
    usage: {
      cached: false,
      credits: results.length > 0 ? 1 : 0,
      rows: results.length
    },
    vector_search: false
  };
}

function createSearchAnnouncementResultItem(
  announcement: SyntheticAnnouncementRecord,
  normalizedKeyword: string | undefined
): SearchAnnouncementResultItem {
  return {
    ...announcement,
    document_id: announcement.evidence_locator.document_id,
    matched_fields: createAnnouncementMatchedFields(announcement, normalizedKeyword),
    untrusted_document: true
  };
}

function createAnnouncementMatchedFields(
  announcement: SyntheticAnnouncementRecord,
  normalizedKeyword: string | undefined
): string[] {
  const fields = [
    ["title", announcement.title],
    ["summary", announcement.summary],
    ["category", announcement.category],
    ["symbol", announcement.symbol]
  ] as const;

  if (normalizedKeyword === undefined || normalizedKeyword.length === 0) {
    return ["security", "published_at", "category"];
  }

  return fields
    .filter(([, value]) => value.toLowerCase().includes(normalizedKeyword))
    .map(([field]) => field);
}

function createAnnouncementLocator(
  announcementId: string,
  sourceRecordId: string,
  page: number,
  anchor: string
): AnnouncementEvidenceLocator {
  return {
    anchor,
    document_id: `doc_${announcementId}`,
    external_href_authority: false,
    locator_type: "synthetic_original_locator",
    original_url: `urn:aiphabee:synthetic:announcement:${announcementId}#page=${page}&anchor=${anchor}`,
    page,
    source_record_id: sourceRecordId
  };
}

function createDocumentTrustPolicy(): SearchAnnouncementsResult["document_trust_policy"] {
  return {
    content_is_untrusted_data: true,
    prompt_injection_isolated: true,
    scripts_executable: false
  };
}

function normalizeCategories(categories: string[] | undefined): SearchAnnouncementCategory[] {
  if (categories === undefined || categories.length === 0) {
    return ALL_CATEGORIES;
  }

  const normalized = categories.filter(
    (category): category is SearchAnnouncementCategory =>
      ALL_CATEGORIES.includes(category as SearchAnnouncementCategory)
  );

  return normalized.length > 0 ? normalized : ALL_CATEGORIES;
}

function normalizeLanguage(value: string | undefined): SearchAnnouncementLanguage | undefined {
  return value === "en" || value === "zh-Hant" ? value : undefined;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
}
