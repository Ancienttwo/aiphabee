export const DATA_INGEST_VERSION =
  "2026-06-25.hkex-news-ingest-contract.v0";
export const HKEX_NEWS_RIGHTS_POLICY_VERSION =
  "hkex-news-rights-policy-scaffold-v0";
export const HKEX_NEWS_SKILL_NAME = "hkex-news-daily";
export const HKEX_NEWS_PLANNED_ENGINE = "scrapy";
export const HKEX_NEWS_RUNTIME_SOURCE_OF_TRUTH = "postgres";
export const HKEX_NEWS_SCRAPY_SPIDER = "hkex_news";
export const HKEX_NEWS_REPORT_TEMPLATE = "runtime/reports/<run_id>/documents.jsonl";
export const HKEX_NEWS_JOBDIR_TEMPLATE = "runtime/scrapy-jobs/<run_id>";

export const HKEX_NEWS_DAILY_COMMAND = [
  "data-ingest",
  "hkex",
  "daily",
  "--business-date",
  "today",
  "--timezone",
  "Asia/Hong_Kong",
  "--until",
  "held",
  "--output",
  "json"
] as const;

export const HKEX_NEWS_SOURCE_SURFACES = [
  "latest_list",
  "title_search",
  "content_search",
  "new_listing_information",
  "ap_phip",
  "progress_report"
] as const;

export const HKEX_NEWS_SCHEMA_TABLES = [
  "core.hkex_news_crawl_run",
  "core.hkex_news_document",
  "core.hkex_news_document_observation",
  "core.hkex_news_document_headline",
  "core.hkex_news_document_relation",
  "core.hkex_news_document_content",
  "core.ipo_source_document_link",
  "core.hkex_news_extraction_run",
  "core.hkex_news_extracted_fact",
  "core.hkex_news_transform_run",
  "governance.hkex_news_ingest_contract"
] as const;

export const DATA_INGEST_PIPELINE_STAGES = [
  "preflight",
  "lock",
  "raw_source_batch",
  "data_version",
  "crawl_run",
  "scrapy",
  "sanitize",
  "extract",
  "link",
  "validate",
  "finalize"
] as const;

export const DATA_INGEST_MINIMAL_COMMANDS = [
  "hkex daily",
  "run status",
  "run resume",
  "validate",
  "release"
] as const;

export const DATA_INGEST_EXIT_CODES = {
  completed: 0,
  configurationFailure: 40,
  databaseOrStorageFailure: 50,
  heldQualityFailure: 30,
  invariantViolation: 60,
  retryableNetworkFailure: 20,
  skippedLocked: 10
} as const;

export type HkexNewsSourceSurface = (typeof HKEX_NEWS_SOURCE_SURFACES)[number];
export type HkexNewsReleaseState = "held";
export type DataIngestPipelineStage = (typeof DATA_INGEST_PIPELINE_STAGES)[number];
export type HkexNewsRunStatus =
  | "completed"
  | "failed"
  | "held_quality_failure"
  | "no_change"
  | "skipped_locked";

export interface HkexNewsRunCounts {
  changed: number;
  discovered: number;
  documents_persisted: number;
  errors: number;
  facts_extracted: number;
  fetched: number;
  unchanged: number;
  warnings: number;
}

export interface HkexNewsDailyRunResult {
  business_date: string;
  command: readonly string[];
  counts: HkexNewsRunCounts;
  data_version: string;
  error_code: string | null;
  error_summary: string | null;
  last_completed_stage: DataIngestPipelineStage;
  planned_engine: typeof HKEX_NEWS_PLANNED_ENGINE;
  release_state: HkexNewsReleaseState;
  retryable: boolean;
  run_id: string;
  runtime_source_of_truth: typeof HKEX_NEWS_RUNTIME_SOURCE_OF_TRUTH;
  source_surfaces: readonly HkexNewsSourceSurface[];
  status: HkexNewsRunStatus;
  timezone: "Asia/Hong_Kong";
  version: typeof DATA_INGEST_VERSION;
}

export interface HkexNewsDocumentItem {
  canonical_url: string;
  content_hash_sha256?: string;
  content_type: string;
  document_url?: string;
  hkex_code?: string;
  published_at?: string;
  response_body_storage_uri?: string;
  source_record_id: string;
  source_surface: HkexNewsSourceSurface;
  title_en?: string;
  title_zh_hant?: string;
}

export interface HkexNewsRuntimeConfig {
  database_write_requires_env: "DATA_INGEST_ENABLE_DB_WRITE=1";
  database_url_env: readonly ["DATA_INGEST_DATABASE_URL", "IPO_DATABASE_URL", "DATABASE_URL"];
  jobdir_template: typeof HKEX_NEWS_JOBDIR_TEMPLATE;
  report_template: typeof HKEX_NEWS_REPORT_TEMPLATE;
  scrapy_engine: true;
  scrapy_spider: typeof HKEX_NEWS_SCRAPY_SPIDER;
  source_of_truth: typeof HKEX_NEWS_RUNTIME_SOURCE_OF_TRUTH;
}

export const HKEX_NEWS_RUNTIME_CONFIG: HkexNewsRuntimeConfig = {
  database_write_requires_env: "DATA_INGEST_ENABLE_DB_WRITE=1",
  database_url_env: ["DATA_INGEST_DATABASE_URL", "IPO_DATABASE_URL", "DATABASE_URL"],
  jobdir_template: HKEX_NEWS_JOBDIR_TEMPLATE,
  report_template: HKEX_NEWS_REPORT_TEMPLATE,
  scrapy_engine: true,
  scrapy_spider: HKEX_NEWS_SCRAPY_SPIDER,
  source_of_truth: HKEX_NEWS_RUNTIME_SOURCE_OF_TRUTH
};

export function createHkexNewsDailyResult(
  input: {
    businessDate?: string;
    counts?: Partial<HkexNewsRunCounts>;
    dataVersion?: string;
    runId?: string;
    status?: HkexNewsRunStatus;
  } = {}
): HkexNewsDailyRunResult {
  const businessDate = input.businessDate ?? todayInHongKong();
  const dataVersion = input.dataVersion ?? `dv_hkex_news_${businessDate.replaceAll("-", "")}_local_contract`;
  const runId = input.runId ?? `cr_hkex_news_${businessDate.replaceAll("-", "")}_local_contract`;

  return {
    business_date: businessDate,
    command: HKEX_NEWS_DAILY_COMMAND,
    counts: {
      changed: input.counts?.changed ?? 0,
      discovered: input.counts?.discovered ?? 0,
      documents_persisted: input.counts?.documents_persisted ?? 0,
      errors: input.counts?.errors ?? 0,
      facts_extracted: input.counts?.facts_extracted ?? 0,
      fetched: input.counts?.fetched ?? 0,
      unchanged: input.counts?.unchanged ?? 0,
      warnings: input.counts?.warnings ?? 0
    },
    data_version: dataVersion,
    error_code: null,
    error_summary: null,
    last_completed_stage: "validate",
    planned_engine: HKEX_NEWS_PLANNED_ENGINE,
    release_state: "held",
    retryable: false,
    run_id: runId,
    runtime_source_of_truth: HKEX_NEWS_RUNTIME_SOURCE_OF_TRUTH,
    source_surfaces: HKEX_NEWS_SOURCE_SURFACES,
    status: input.status ?? "completed",
    timezone: "Asia/Hong_Kong",
    version: DATA_INGEST_VERSION
  };
}

export function isNormalDailyOutcome(status: HkexNewsRunStatus): boolean {
  return status === "completed" || status === "no_change" || status === "skipped_locked";
}

export function dataIngestExitCodeFor(status: HkexNewsRunStatus): number {
  if (status === "skipped_locked") return DATA_INGEST_EXIT_CODES.skippedLocked;
  if (status === "held_quality_failure") return DATA_INGEST_EXIT_CODES.heldQualityFailure;
  if (status === "failed") return DATA_INGEST_EXIT_CODES.configurationFailure;
  return DATA_INGEST_EXIT_CODES.completed;
}

function todayInHongKong(): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Hong_Kong",
    year: "numeric"
  }).format(new Date());
}
