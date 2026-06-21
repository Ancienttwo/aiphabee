import {
  resolveSecurity,
  type ResolveSecurityResult
} from "@aiphabee/security-tools";

export const DOCUMENT_TOOLS_VERSION =
  "2026-06-21.phase2.search-announcements-scaffold.v0";
export const DOCUMENT_TOOLS_RUNTIME_VERSION =
  "2026-06-21.phase2.get-announcement-scaffold.v0";
export const GET_ANNOUNCEMENT_VERSION =
  "2026-06-21.phase2.get-announcement-scaffold.v0";

export type SearchAnnouncementCategory = "buyback" | "dividend" | "results";
export type SearchAnnouncementLanguage = "en" | "zh-Hant";
export type SearchAnnouncementsStatus = "blocked_resolution" | "found" | "not_found";
export type GetAnnouncementStatus = "found" | "not_found" | "section_not_found";

export interface DocumentTrustPolicy {
  content_is_untrusted_data: true;
  prompt_injection_isolated: true;
  scripts_executable: false;
}

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

export interface AnnouncementExcerptLocator {
  anchor: string;
  document_id: string;
  external_href_authority: false;
  locator_type: "synthetic_excerpt_locator";
  original_url: string;
  page: number;
  paragraph: number;
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
  document_trust_policy: DocumentTrustPolicy;
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

export interface GetAnnouncementInput {
  documentId?: string;
  maxExcerptChars?: number;
  requestId: string;
  sections?: string[];
}

export interface GetAnnouncementExcerpt {
  authorization: {
    excerpt_scope: "synthetic_excerpt_allowlist";
    full_text_returned: false;
    max_excerpt_chars: number;
    truncated: boolean;
  };
  evidence_locator: AnnouncementExcerptLocator;
  excerpt: string;
  section_id: string;
  section_title: string;
  untrusted_document: true;
}

export interface GetAnnouncementResult {
  allowed_sections: string[];
  as_of: string;
  data_version: typeof GET_ANNOUNCEMENT_VERSION;
  document_id?: string;
  document_trust_policy: DocumentTrustPolicy;
  excerpts: GetAnnouncementExcerpt[];
  excerpts_authorized: true;
  filters: {
    document_id?: string;
    max_excerpt_chars: number;
    sections: string[];
  };
  frontend_rendering: false;
  full_document_returned: false;
  live_data_access: false;
  methodology_version: typeof GET_ANNOUNCEMENT_VERSION;
  original_document_fetch: false;
  row_count: number;
  sql_emitted: false;
  status: GetAnnouncementStatus;
  toolName: "get_announcement";
  usage: {
    cached: false;
    credits: number;
    rows: number;
  };
  vector_search: false;
  source?: {
    announcement_id: string;
    category: SearchAnnouncementCategory;
    instrument_id: string;
    language: SearchAnnouncementLanguage;
    published_at: string;
    source_record_id: string;
    symbol: string;
    title: string;
  };
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

interface SyntheticAnnouncementSection {
  anchor: string;
  excerpt: string;
  page: number;
  paragraph: number;
  section_id: string;
  section_title: string;
}

interface SyntheticAnnouncementDocument {
  announcement: SyntheticAnnouncementRecord;
  document_id: string;
  sections: readonly SyntheticAnnouncementSection[];
}

const DEFAULT_FROM = "2024-01-01";
const DEFAULT_TO = "2026-01-07";
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 5;
const DEFAULT_EXCERPT_CHARS = 240;
const MAX_EXCERPT_CHARS = 400;
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

const SYNTHETIC_ANNOUNCEMENT_DOCUMENTS: readonly SyntheticAnnouncementDocument[] =
  SYNTHETIC_ANNOUNCEMENTS.map((announcement) => ({
    announcement,
    document_id: announcement.evidence_locator.document_id,
    sections: createSyntheticAnnouncementSections(announcement)
  }));

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

export function getAnnouncementCapabilities() {
  return {
    allowed_excerpt_scope: "synthetic_excerpt_allowlist" as const,
    evidence_locator_ready: true,
    frontend_rendering: false,
    live_data_access: false,
    max_excerpt_chars: MAX_EXCERPT_CHARS,
    original_document_fetch: false,
    package: "@aiphabee/document-tools" as const,
    required_inputs: ["document_id"] as const,
    route: "POST /documents/get-announcement" as const,
    status: "get_announcement_scaffold" as const,
    supported_inputs: ["document_id", "sections", "max_excerpt_chars"] as const,
    tool_name: "get_announcement" as const,
    untrusted_document_policy: true,
    version: GET_ANNOUNCEMENT_VERSION,
    vector_search: false
  };
}

export function getDocumentToolsCapabilities() {
  return {
    frontend_rendering: false,
    get_announcement: getAnnouncementCapabilities(),
    live_data_access: false,
    package: "@aiphabee/document-tools" as const,
    route: "POST /documents/search-announcements" as const,
    routes: ["POST /documents/search-announcements", "POST /documents/get-announcement"] as const,
    runtime_route: "GET /documents/runtime" as const,
    search_announcements: getSearchAnnouncementsCapabilities(),
    status: "document_tools_scaffold" as const,
    version: DOCUMENT_TOOLS_RUNTIME_VERSION
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

export function getAnnouncement(input: GetAnnouncementInput): GetAnnouncementResult {
  const asOf = "2026-01-07T16:15:00+08:00";
  const documentId = input.documentId?.trim();
  const requestedSections = normalizeSections(input.sections);
  const maxExcerptChars = normalizeExcerptChars(input.maxExcerptChars);
  const filters: GetAnnouncementResult["filters"] = {
    document_id: documentId === "" ? undefined : documentId,
    max_excerpt_chars: maxExcerptChars,
    sections: requestedSections
  };

  if (documentId === undefined || documentId.length === 0) {
    return createGetAnnouncementResult({
      asOf,
      document: undefined,
      excerpts: [],
      filters,
      status: "not_found"
    });
  }

  const document = SYNTHETIC_ANNOUNCEMENT_DOCUMENTS.find(
    (item) => item.document_id === documentId
  );

  if (document === undefined) {
    return createGetAnnouncementResult({
      asOf,
      document: undefined,
      documentId,
      excerpts: [],
      filters,
      status: "not_found"
    });
  }

  const sections =
    requestedSections.length === 0
      ? document.sections
      : document.sections.filter((section) =>
          requestedSections.includes(section.section_id)
        );
  const excerpts = sections.map((section) =>
    createGetAnnouncementExcerpt(document, section, maxExcerptChars)
  );

  return createGetAnnouncementResult({
    asOf,
    document,
    excerpts,
    filters,
    status: excerpts.length > 0 ? "found" : "section_not_found"
  });
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

function createGetAnnouncementResult(params: {
  asOf: string;
  document: SyntheticAnnouncementDocument | undefined;
  documentId?: string;
  excerpts: GetAnnouncementExcerpt[];
  filters: GetAnnouncementResult["filters"];
  status: GetAnnouncementStatus;
}): GetAnnouncementResult {
  const documentId = params.document?.document_id ?? params.documentId;
  const announcement = params.document?.announcement;

  return {
    allowed_sections: params.document?.sections.map((section) => section.section_id) ?? [],
    as_of: params.asOf,
    data_version: GET_ANNOUNCEMENT_VERSION,
    document_id: documentId,
    document_trust_policy: createDocumentTrustPolicy(),
    excerpts: params.excerpts,
    excerpts_authorized: true,
    filters: params.filters,
    frontend_rendering: false,
    full_document_returned: false,
    live_data_access: false,
    methodology_version: GET_ANNOUNCEMENT_VERSION,
    original_document_fetch: false,
    row_count: params.excerpts.length,
    source:
      announcement === undefined
        ? undefined
        : {
            announcement_id: announcement.announcement_id,
            category: announcement.category,
            instrument_id: announcement.instrument_id,
            language: announcement.language,
            published_at: announcement.published_at,
            source_record_id: announcement.source_record_id,
            symbol: announcement.symbol,
            title: announcement.title
          },
    sql_emitted: false,
    status: params.status,
    toolName: "get_announcement",
    usage: {
      cached: false,
      credits: params.excerpts.length > 0 ? 1 : 0,
      rows: params.excerpts.length
    },
    vector_search: false
  };
}

function createGetAnnouncementExcerpt(
  document: SyntheticAnnouncementDocument,
  section: SyntheticAnnouncementSection,
  maxExcerptChars: number
): GetAnnouncementExcerpt {
  const excerpt = section.excerpt.slice(0, maxExcerptChars);

  return {
    authorization: {
      excerpt_scope: "synthetic_excerpt_allowlist",
      full_text_returned: false,
      max_excerpt_chars: maxExcerptChars,
      truncated: section.excerpt.length > excerpt.length
    },
    evidence_locator: createAnnouncementExcerptLocator(
      document.announcement.announcement_id,
      document.announcement.source_record_id,
      section.page,
      section.paragraph,
      section.anchor
    ),
    excerpt,
    section_id: section.section_id,
    section_title: section.section_title,
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

function createAnnouncementExcerptLocator(
  announcementId: string,
  sourceRecordId: string,
  page: number,
  paragraph: number,
  anchor: string
): AnnouncementExcerptLocator {
  return {
    anchor,
    document_id: `doc_${announcementId}`,
    external_href_authority: false,
    locator_type: "synthetic_excerpt_locator",
    original_url: `urn:aiphabee:synthetic:announcement:${announcementId}#page=${page}&paragraph=${paragraph}&anchor=${anchor}`,
    page,
    paragraph,
    source_record_id: sourceRecordId
  };
}

function createSyntheticAnnouncementSections(
  announcement: SyntheticAnnouncementRecord
): SyntheticAnnouncementSection[] {
  switch (announcement.announcement_id) {
    case "ann_00700_20240320_results":
      return [
        {
          anchor: "financial-highlights",
          excerpt:
            "The annual results announcement states revenue and operating profit highlights for the year ended 31 December 2023, with the financial metrics presented as disclosed figures rather than model estimates.",
          page: 4,
          paragraph: 2,
          section_id: "financial_highlights",
          section_title: "Financial highlights"
        },
        {
          anchor: "management-discussion",
          excerpt:
            "Management discussion describes segment performance and investment priorities. This excerpt is a bounded synthetic quote for evidence-location testing only.",
          page: 8,
          paragraph: 5,
          section_id: "management_discussion",
          section_title: "Management discussion"
        }
      ];
    case "ann_00700_20260103_dividend":
      return [
        {
          anchor: "document-summary",
          excerpt:
            "The document summarizes an updated dividend timetable and identifies the relevant event dates for shareholder verification.",
          page: 1,
          paragraph: 1,
          section_id: "document_summary",
          section_title: "Document summary"
        },
        {
          anchor: "dividend-timetable",
          excerpt:
            "The timetable section identifies the ex-dividend date, record date, and payment date for the dividend update. The source record remains the announcement filing rather than generated commentary.",
          page: 2,
          paragraph: 3,
          section_id: "dividend_timetable",
          section_title: "Dividend timetable"
        }
      ];
    case "ann_00700_20260106_buyback":
      return [
        {
          anchor: "repurchase-summary",
          excerpt:
            "The repurchase summary discloses the number of shares bought back and the consideration paid, with the position tied to the synthetic page and paragraph locator.",
          page: 1,
          paragraph: 4,
          section_id: "repurchase_summary",
          section_title: "Repurchase summary"
        }
      ];
    case "ann_00001_20260105_results":
      return [
        {
          anchor: "segment-results",
          excerpt:
            "The segment results section describes quarterly trading performance and revenue direction by segment, with the extract retained within the authorized excerpt scope.",
          page: 3,
          paragraph: 2,
          section_id: "segment_results",
          section_title: "Segment results"
        }
      ];
    default:
      return [];
  }
}

function createDocumentTrustPolicy(): DocumentTrustPolicy {
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

function normalizeExcerptChars(limit: number | undefined): number {
  if (limit === undefined || !Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_EXCERPT_CHARS;
  }

  return Math.min(limit, MAX_EXCERPT_CHARS);
}

function normalizeSections(sections: string[] | undefined): string[] {
  if (sections === undefined) {
    return [];
  }

  return sections
    .map((section) => section.trim())
    .filter((section, index, values) => section.length > 0 && values.indexOf(section) === index);
}
