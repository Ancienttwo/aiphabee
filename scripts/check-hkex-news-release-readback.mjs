#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const contractPath = "deploy/ingest/hkex-news-release-readback.contract.json";
const sourceContractPath = "deploy/ingest/hkex-news-ingest.contract.json";
const packagePath = "package.json";
const cliPath = "packages/data-ingest/bin/data-ingest.mjs";
const expectedVersion = "2026-06-28.hkex-news-release-readback.v0";
const expectedScript = "node scripts/check-hkex-news-release-readback.mjs --check";
const args = process.argv.slice(2);
const live = args.includes("--live");

const contract = readJson(contractPath);
const sourceContract = readJson(sourceContractPath);
const packageJson = readJson(packagePath);
const cliSource = readText(cliPath);

const errors = [
  ...validateContract(contract),
  ...validateSourceContract(sourceContract),
  ...validatePackage(packageJson),
  ...validateCliSource(cliSource),
  ...validateNoSecrets(contract),
  ...validateNoSecrets(sourceContract.release_readback ?? {})
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract",
      version: expectedVersion
    },
    1
  );
}

if (!live) {
  emit(
    {
      mode: "local_contract",
      live_requires_flag: "--live",
      status: "ok",
      version: expectedVersion
    },
    0
  );
}

const dataVersion = optionValue("--data-version") ?? process.env.DATA_INGEST_RELEASE_READBACK_DATA_VERSION;
const databaseUrl = databaseUrlFromEnv();
if (!databaseUrl) {
  emit(
    {
      database_url_env: contract.database_url_env,
      status: "missing_database_url",
      version: expectedVersion
    },
    1
  );
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  await configureReadbackSession(client);
  const row = await readReleaseReadback(client, dataVersion);
  if (!row) {
    emit(
      {
        mode: "live",
        status: "missing_released_data_version",
        summary: {
          data_version_filter_present: Boolean(dataVersion)
        },
        version: expectedVersion
      },
      1
    );
  }

  const liveErrors = validateLiveRow(row);
  const summary = summarizeLiveRow(row);
  emit(
    {
      mode: "live",
      readback_hash: prefixedHash("sha256", JSON.stringify(summary)),
      status: liveErrors.length === 0 ? "ok" : "failed",
      summary,
      validation_errors: liveErrors,
      version: expectedVersion
    },
    liveErrors.length === 0 ? 0 : 1
  );
} finally {
  await client.end().catch(() => undefined);
}

async function configureReadbackSession(client) {
  await client.query("set application_name = 'aiphabee-hkex-news-release-readback'");
  await client.query("set statement_timeout = '2min'");
  await client.query("set default_transaction_read_only = on");
}

async function readReleaseReadback(client, dataVersion) {
  const targetWhere = dataVersion
    ? "where data_version = $1 and data_version like 'dv_hkex_news_%'"
    : "where data_version like 'dv_hkex_news_%' and release_state = 'released'";
  const params = dataVersion ? [dataVersion] : [];
  const result = await client.query(
    `
      with target as (
        select
          data_version,
          source_batch_id,
          release_state,
          released_at,
          created_at
        from core.data_version_batch
        ${targetWhere}
        order by released_at desc nulls last, created_at desc, data_version desc
        limit 1
      ),
      latest_crawl as (
        select status, error_count
        from core.hkex_news_crawl_run
        where data_version = (select data_version from target)
        order by completed_at desc nulls last, crawl_run_id desc
        limit 1
      ),
      latest_transform as (
        select status, validation_report
        from core.hkex_news_transform_run
        where data_version = (select data_version from target)
        order by completed_at desc nulls last, transform_run_id desc
        limit 1
      )
      select
        target.data_version,
        target.source_batch_id,
        target.release_state,
        target.released_at,
        cr.status as crawl_status,
        cr.error_count as crawl_error_count,
        tx.status as transform_status,
        tx.validation_report
      from target
      left join latest_crawl cr on true
      left join latest_transform tx on true
    `,
    params
  );
  return result.rows[0] ?? null;
}

function validateLiveRow(row) {
  const validationErrors = [];
  if (row.release_state !== "released") {
    validationErrors.push("release_state must be released");
  }
  if (!row.released_at) {
    validationErrors.push("released_at must be present");
  }
  if (row.crawl_status !== "completed") {
    validationErrors.push("latest crawl status must be completed");
  }
  if (Number(row.crawl_error_count ?? 0) !== 0) {
    validationErrors.push("latest crawl error_count must be zero");
  }
  if (row.transform_status !== "completed") {
    validationErrors.push("latest transform status must be completed");
  }
  return validationErrors;
}

function summarizeLiveRow(row) {
  const releasedAt = row.released_at ? new Date(row.released_at).toISOString() : "";
  return {
    crawl_error_count: Number(row.crawl_error_count ?? 0),
    crawl_status: row.crawl_status ?? null,
    data_version_hash: prefixedHash("sha256", row.data_version),
    release_state: row.release_state ?? null,
    release_state_after: row.release_state ?? null,
    released_at_hash: releasedAt ? prefixedHash("sha256", releasedAt) : null,
    released_at_present: Boolean(row.released_at),
    source_batch_id_hash: prefixedHash("sha256", row.source_batch_id),
    transform_status: row.transform_status ?? null,
    validation_report_hash: prefixedHash("sha256", JSON.stringify(row.validation_report ?? {})),
    writes_database: false,
    writes_serving_tables: false
  };
}

function validateContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["release readback contract must be an object"];

  for (const [field, expected] of Object.entries({
    checker: "scripts/check-hkex-news-release-readback.mjs",
    package: "@aiphabee/data-ingest",
    package_script: "npm run check:hkex-news-release-readback",
    provider: "postgres",
    source_contract: sourceContractPath,
    status: "local_contract",
    version: expectedVersion
  })) {
    if (value[field] !== expected) validationErrors.push(`${field} must be ${expected}`);
  }

  validationErrors.push(
    ...validateStringArray(
      value.database_url_env,
      ["DATA_INGEST_DATABASE_URL", "IPO_DATABASE_URL", "DATABASE_URL"],
      "database_url_env"
    )
  );
  validationErrors.push(
    ...validateStringArray(
      value.target_tables,
      ["core.data_version_batch", "core.hkex_news_crawl_run", "core.hkex_news_transform_run"],
      "target_tables"
    )
  );
  validationErrors.push(
    ...validateStringArray(
      value.blocked_tables,
      ["core.ipo_offering", "core.ipo_timetable_event", "core.ipo_narrative", "core.ipo_cornerstone"],
      "blocked_tables"
    )
  );
  validationErrors.push(
    ...validateStringArray(
      value.response_fields,
      [
        "data_version_hash",
        "source_batch_id_hash",
        "release_state",
        "release_state_after",
        "released_at_present",
        "released_at_hash",
        "crawl_status",
        "crawl_error_count",
        "transform_status",
        "validation_report_hash",
        "readback_hash"
      ],
      "response_fields"
    )
  );
  validationErrors.push(...validateSafeOutputPolicy(value.safe_output_policy, "safe_output_policy"));

  for (const field of ["read_only_database", "latest_released_default", "specific_data_version_supported", "hash_only_response"]) {
    if (value[field] !== true) validationErrors.push(`${field} must be true`);
  }
  for (const field of [
    "writes_database",
    "writes_object_store",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "emits_approval_id",
    "emits_raw_payload"
  ]) {
    if (value[field] !== false) validationErrors.push(`${field} must be false`);
  }

  if (value.verification?.contract_check !== "npm run check:hkex-news-release-readback") {
    validationErrors.push("verification.contract_check mismatch");
  }
  if (
    value.verification?.live_readback !==
    "DATA_INGEST_DATABASE_URL=<database_url> node scripts/check-hkex-news-release-readback.mjs --live --data-version <data_version>"
  ) {
    validationErrors.push("verification.live_readback mismatch");
  }

  return validationErrors;
}

function validateSourceContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["source contract must be an object"];
  const readback = value.release_readback;
  if (!isRecord(readback)) return ["source contract must include release_readback"];

  for (const [field, expected] of Object.entries({
    checker: "scripts/check-hkex-news-release-readback.mjs",
    contract: contractPath,
    package_script: "npm run check:hkex-news-release-readback",
    provider: "postgres",
    version: expectedVersion
  })) {
    if (readback[field] !== expected) {
      validationErrors.push(`source contract release_readback.${field} must be ${expected}`);
    }
  }
  if (readback.read_only_database !== true) {
    validationErrors.push("source contract release_readback.read_only_database must be true");
  }
  if (readback.hash_only_response !== true) {
    validationErrors.push("source contract release_readback.hash_only_response must be true");
  }
  if (readback.emits_approval_id !== false) {
    validationErrors.push("source contract release_readback.emits_approval_id must be false");
  }
  if (readback.writes_database !== false) {
    validationErrors.push("source contract release_readback.writes_database must be false");
  }
  validationErrors.push(
    ...validateStringArray(
      readback.target_tables,
      ["core.data_version_batch", "core.hkex_news_crawl_run", "core.hkex_news_transform_run"],
      "source contract release_readback.target_tables"
    )
  );

  return validationErrors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const validationErrors = [];
  if (scripts["check:hkex-news-release-readback"] !== expectedScript) {
    validationErrors.push(`package.json check:hkex-news-release-readback must be ${expectedScript}`);
  }
  const rootCheck = String(scripts.check ?? "");
  const ingestIndex = rootCheck.indexOf("npm run check:hkex-news-ingest");
  const releaseReadbackIndex = rootCheck.indexOf("npm run check:hkex-news-release-readback");
  const publicSourceIndex = rootCheck.indexOf("npm run check:hk-ipo-public-sources");
  if (releaseReadbackIndex < 0) validationErrors.push("root check must include check:hkex-news-release-readback");
  if (ingestIndex < 0 || releaseReadbackIndex < ingestIndex) {
    validationErrors.push("root check must run release readback after HKEX News ingest contract");
  }
  if (publicSourceIndex < 0 || releaseReadbackIndex > publicSourceIndex) {
    validationErrors.push("root check must run release readback before HK IPO public source checks");
  }
  return validationErrors;
}

function validateCliSource(source) {
  const validationErrors = [];
  for (const text of [
    "DATA_INGEST_ENABLE_RELEASE",
    "DATA_VERSION_LOCKED",
    "LIVE_RELEASE_NOT_CONFIGURED",
    "RELEASE_VALIDATION_FAILED",
    "approval_id_hash",
    "release_state_after",
    "writes_database",
    "readValidationState",
    "businessDateFromDataVersion",
    "release_state = 'released'",
    "released_at = now()"
  ]) {
    if (!source.includes(text)) validationErrors.push(`CLI source missing ${text}`);
  }
  if (source.includes("RELEASE_REQUIRES_SEPARATE_IMPLEMENTATION")) {
    validationErrors.push("CLI release must not remain a separate-implementation refusal");
  }
  return validationErrors;
}

function validateSafeOutputPolicy(value, name) {
  if (!isRecord(value)) return [`${name} must be an object`];
  const validationErrors = [];
  for (const field of [
    "no_database_url",
    "no_password",
    "no_secret",
    "no_raw_payload",
    "no_raw_html",
    "no_source_url",
    "no_security_code",
    "no_approval_id",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) validationErrors.push(`${name}.${field} must be true`);
  }
  return validationErrors;
}

function validateStringArray(value, expectedValues, name) {
  const validationErrors = [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }
  for (const expected of expectedValues) {
    if (!value.includes(expected)) validationErrors.push(`${name} missing ${expected}`);
  }
  return validationErrors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return [
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]{20,}/u,
    /sk-[A-Za-z0-9_-]{10,}/u,
    /gh[pousr]_[A-Za-z0-9_]{20,}/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ]
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function databaseUrlFromEnv() {
  return process.env.DATA_INGEST_DATABASE_URL ?? process.env.IPO_DATABASE_URL ?? process.env.DATABASE_URL;
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function prefixedHash(prefix, value) {
  return `${prefix}:${createHash(prefix).update(String(value ?? "")).digest("hex")}`;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
