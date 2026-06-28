import { describe, expect, it } from "vitest";
import {
  DATA_INGEST_EXIT_CODES,
  HKEX_NEWS_DAILY_COMMAND,
  HKEX_NEWS_RELEASE_COMMAND,
  HKEX_NEWS_RELEASE_REQUIRES_ENV,
  HKEX_NEWS_REPO_DAILY_COMMAND,
  HKEX_NEWS_REPO_RELEASE_COMMAND,
  HKEX_NEWS_RUNTIME_CONFIG,
  HKEX_NEWS_SCRAPY_SPIDER,
  HKEX_NEWS_SCHEMA_TABLES,
  HKEX_NEWS_SOURCE_SURFACES,
  createHkexNewsDailyResult,
  dataIngestExitCodeFor,
  isNormalDailyOutcome
} from "./index";

describe("data-ingest HKEX News contract", () => {
  it("keeps the automation command exact and held-only", () => {
    expect(HKEX_NEWS_DAILY_COMMAND).toEqual([
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
    ]);
    expect(HKEX_NEWS_DAILY_COMMAND).not.toContain("release");
    expect(HKEX_NEWS_REPO_DAILY_COMMAND).toEqual([
      "npm",
      "run",
      "data-ingest",
      "--",
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
    ]);
    expect(HKEX_NEWS_RELEASE_COMMAND).toEqual([
      "data-ingest",
      "release",
      "--data-version",
      "<data_version>",
      "--approval-id",
      "<approval_id>",
      "--output",
      "json"
    ]);
    expect(HKEX_NEWS_REPO_RELEASE_COMMAND).toEqual([
      "npm",
      "run",
      "data-ingest",
      "--",
      "release",
      "--data-version",
      "<data_version>",
      "--approval-id",
      "<approval_id>",
      "--output",
      "json"
    ]);
    expect(HKEX_NEWS_RELEASE_REQUIRES_ENV).toBe("DATA_INGEST_ENABLE_RELEASE=1");
  });

  it("models HKEX News as multi-surface public inflow with Postgres as source of truth", () => {
    const result = createHkexNewsDailyResult({ businessDate: "2026-06-25" });

    expect(result.release_state).toBe("held");
    expect(result.runtime_source_of_truth).toBe("postgres");
    expect(result.planned_engine).toBe("scrapy");
    expect(result.source_surfaces).toEqual(HKEX_NEWS_SOURCE_SURFACES);
    expect(result.source_surfaces).toContain("title_search");
    expect(result.source_surfaces).toContain("new_listing_information");
    expect(result.source_surfaces).toContain("ap_phip");
  });

  it("keeps Scrapy as an internal adapter and Postgres as the run lifecycle owner", () => {
    expect(HKEX_NEWS_RUNTIME_CONFIG).toMatchObject({
      database_write_requires_env: "DATA_INGEST_ENABLE_DB_WRITE=1",
      jobdir_template: "runtime/scrapy-jobs/<run_id>",
      release_requires_env: "DATA_INGEST_ENABLE_RELEASE=1",
      report_template: "runtime/reports/<run_id>/documents.jsonl",
      runtime_dir_env: "DATA_INGEST_RUNTIME_DIR",
      scrapy_engine: true,
      scrapy_spider: HKEX_NEWS_SCRAPY_SPIDER,
      source_of_truth: "postgres"
    });
    expect(HKEX_NEWS_RUNTIME_CONFIG.database_url_env).toEqual([
      "DATA_INGEST_DATABASE_URL",
      "IPO_DATABASE_URL",
      "DATABASE_URL"
    ]);
  });

  it("tracks canonical documents, observations, headlines, lifecycle and extracted facts", () => {
    expect(HKEX_NEWS_SCHEMA_TABLES).toEqual([
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
    ]);
  });

  it("classifies completed/no-change/locked as normal but quality failures as triage", () => {
    expect(isNormalDailyOutcome("completed")).toBe(true);
    expect(isNormalDailyOutcome("no_change")).toBe(true);
    expect(isNormalDailyOutcome("skipped_locked")).toBe(true);
    expect(isNormalDailyOutcome("held_quality_failure")).toBe(false);
    expect(dataIngestExitCodeFor("skipped_locked")).toBe(DATA_INGEST_EXIT_CODES.skippedLocked);
    expect(dataIngestExitCodeFor("held_quality_failure")).toBe(DATA_INGEST_EXIT_CODES.heldQualityFailure);
  });
});
