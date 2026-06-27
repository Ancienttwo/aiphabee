#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const goldsetPath = "skills/hkex-news-crawl-qa/evals/goldset.json";
const officialEndpoint = "https://www1.hkexnews.hk/search/titleSearchServlet.do";
const requiredParams = [
  "sortDir",
  "sortByOptions",
  "category",
  "market",
  "stockId",
  "documentType",
  "fromDate",
  "toDate",
  "title",
  "searchType",
  "t1code",
  "t2Gcode",
  "t2code",
  "rowRange",
  "lang"
];
const args = process.argv.slice(2);
const observedJsonl = optionValue("--observed-jsonl");
const errors = [];

const goldset = readJson(goldsetPath);
validateGoldset(goldset);
const sampleCount = Array.isArray(goldset?.samples) ? goldset.samples.length : 0;

let comparedObserved = false;
let observedCount = 0;
if (observedJsonl) {
  const observedPath = resolve(root, observedJsonl);
  if (!existsSync(observedPath)) {
    errors.push(`observed jsonl not found: ${observedJsonl}`);
  } else {
    const observed = readJsonl(observedPath, observedJsonl);
    observedCount = observed.length;
    comparedObserved = true;
    if (Array.isArray(goldset?.samples)) {
      compareObserved(goldset, observed);
    }
  }
}

if (errors.length > 0) {
  emit(
    {
      errors,
      goldset: goldsetPath,
      status: "invalid_hkex_news_crawl_goldset"
    },
    1
  );
}

emit(
  {
    goldset: goldsetPath,
    observed_compared: comparedObserved,
    observed_documents: observedCount,
    samples: sampleCount,
    status: "ok"
  },
  0
);

function validateGoldset(value) {
  if (!isRecord(value)) {
    errors.push("goldset must be an object");
    return;
  }
  if (value.version !== "2026-06-27.hkex-news-crawl-goldset.v1") {
    errors.push("goldset version mismatch");
  }
  if (value.authority !== "HKEX official titleSearchServlet.do public endpoint") {
    errors.push("goldset authority must be official HKEX titleSearch");
  }
  if (value.source_endpoint !== officialEndpoint) {
    errors.push("goldset source_endpoint must be the official HKEX titleSearch endpoint");
  }
  if (!isRecord(value.live_probe_hint)) {
    errors.push("goldset must include live_probe_hint");
  } else {
    if (!/^cr_hkex_news_\d{8}$/u.test(value.live_probe_hint.crawl_run_id)) {
      errors.push("live_probe_hint.crawl_run_id must use cr_hkex_news_YYYYMMDD");
    }
    if (value.live_probe_hint.query_scope !== "ipo") {
      errors.push("live_probe_hint.query_scope must be ipo");
    }
    if (value.live_probe_hint.lookback_days !== 30) {
      errors.push("live_probe_hint.lookback_days must be 30");
    }
    if (value.live_probe_hint.row_range !== 3) {
      errors.push("live_probe_hint.row_range must be 3");
    }
  }
  for (const field of ["NEWS_ID", "FILE_LINK", "STOCK_CODE", "DATE_TIME", "TITLE"]) {
    if (!value.required_hkex_row_fields?.includes(field)) {
      errors.push(`goldset required_hkex_row_fields missing ${field}`);
    }
  }
  for (const field of [
    "source_record_id",
    "document_url",
    "title_en",
    "category",
    "hkex_code",
    "published_at",
    "source_page_url",
    "result_rank",
    "http_status"
  ]) {
    if (!value.required_observed_fields?.includes(field)) {
      errors.push(`goldset required_observed_fields missing ${field}`);
    }
  }
  if (!Array.isArray(value.samples) || value.samples.length < 4) {
    errors.push("goldset must include at least 4 samples");
    return;
  }

  const sampleIds = new Set();
  const newsIds = new Set();
  const categories = new Set();
  for (const sample of value.samples) {
    validateSample(sample, { categories, newsIds, sampleIds });
  }
  if (categories.size < 4) {
    errors.push("goldset must cover at least 4 HKEX query categories");
  }
}

function validateSample(sample, state) {
  if (!isRecord(sample)) {
    errors.push("goldset sample must be an object");
    return;
  }
  if (!isNonEmptyString(sample.id)) {
    errors.push("goldset sample missing id");
  } else if (state.sampleIds.has(sample.id)) {
    errors.push(`duplicate goldset sample id ${sample.id}`);
  } else {
    state.sampleIds.add(sample.id);
  }

  const expected = sample.expected;
  const titleSearch = sample.title_search;
  const row = titleSearch?.row;
  const params = titleSearch?.params;

  if (!isRecord(expected)) errors.push(`${sample.id}: expected must be an object`);
  if (!isRecord(titleSearch)) errors.push(`${sample.id}: title_search must be an object`);
  if (!isRecord(row)) errors.push(`${sample.id}: title_search.row must be an object`);
  if (!isRecord(params)) errors.push(`${sample.id}: title_search.params must be an object`);
  if (!isRecord(expected) || !isRecord(titleSearch) || !isRecord(row) || !isRecord(params)) return;

  for (const field of ["source_record_id", "category", "hkex_code", "published_at", "title_contains"]) {
    if (!isNonEmptyString(expected[field])) {
      errors.push(`${sample.id}: expected.${field} must be a non-empty string`);
    }
  }
  if (state.newsIds.has(expected.source_record_id)) {
    errors.push(`duplicate goldset NEWS_ID ${expected.source_record_id}`);
  } else {
    state.newsIds.add(expected.source_record_id);
  }
  state.categories.add(expected.category);

  for (const field of ["NEWS_ID", "FILE_LINK", "STOCK_CODE", "DATE_TIME", "TITLE"]) {
    if (!isNonEmptyString(row[field])) {
      errors.push(`${sample.id}: row.${field} must be a non-empty string`);
    }
  }
  if (expected.source_record_id !== row.NEWS_ID) {
    errors.push(`${sample.id}: expected.source_record_id must match row.NEWS_ID`);
  }
  if (expected.hkex_code !== row.STOCK_CODE) {
    errors.push(`${sample.id}: expected.hkex_code must match row.STOCK_CODE`);
  }
  if (!row.TITLE.includes(expected.title_contains)) {
    errors.push(`${sample.id}: row.TITLE must include expected.title_contains`);
  }
  if (titleSearch.query_label !== expected.category) {
    errors.push(`${sample.id}: title_search.query_label must match expected.category`);
  }
  validateOfficialUrl(sample.id, titleSearch.source_url, params);
}

function validateOfficialUrl(sampleId, sourceUrl, params) {
  if (!isNonEmptyString(sourceUrl)) {
    errors.push(`${sampleId}: title_search.source_url must be a non-empty string`);
    return;
  }
  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    errors.push(`${sampleId}: title_search.source_url must be a valid URL`);
    return;
  }
  if (parsed.origin + parsed.pathname !== officialEndpoint) {
    errors.push(`${sampleId}: source_url must point to official HKEX titleSearch endpoint`);
  }
  for (const key of requiredParams) {
    if (typeof params[key] !== "string") {
      errors.push(`${sampleId}: title_search.params.${key} must be a string`);
      continue;
    }
    if (parsed.searchParams.get(key) !== params[key]) {
      errors.push(`${sampleId}: source_url query ${key} must match title_search.params`);
    }
  }
}

function compareObserved(goldsetValue, observed) {
  const bySourceRecordId = new Map();
  for (const document of observed) {
    if (isRecord(document) && typeof document.source_record_id === "string") {
      bySourceRecordId.set(document.source_record_id, document);
    }
  }

  for (const sample of goldsetValue.samples) {
    const expected = sample.expected;
    const row = sample.title_search.row;
    const document = bySourceRecordId.get(expected.source_record_id);
    if (!document) {
      errors.push(`${sample.id}: observed output missing source_record_id ${expected.source_record_id}`);
      continue;
    }
    for (const field of goldsetValue.required_observed_fields) {
      if (document[field] === undefined || document[field] === null || document[field] === "") {
        errors.push(`${sample.id}: observed document missing ${field}`);
      }
    }
    if (document.category !== expected.category) {
      errors.push(`${sample.id}: observed category ${document.category} must equal ${expected.category}`);
    }
    if (document.hkex_code !== expected.hkex_code) {
      errors.push(`${sample.id}: observed hkex_code ${document.hkex_code} must equal ${expected.hkex_code}`);
    }
    if (document.published_at !== expected.published_at) {
      errors.push(`${sample.id}: observed published_at ${document.published_at} must equal ${expected.published_at}`);
    }
    if (!String(document.title_en || "").includes(expected.title_contains)) {
      errors.push(`${sample.id}: observed title_en must include ${expected.title_contains}`);
    }
    if (!String(document.document_url || "").endsWith(row.FILE_LINK)) {
      errors.push(`${sample.id}: observed document_url must end with ${row.FILE_LINK}`);
    }
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), "utf8"));
  } catch (error) {
    errors.push(`${path} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function readJsonl(path, label) {
  const lines = readFileSync(path, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0);
  return lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      errors.push(`${label}:${index + 1} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  });
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
