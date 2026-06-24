#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const DATA_INGEST_VERSION = "2026-06-25.hkex-news-ingest-contract.v0";
const SOURCE_NAME = "hkex_news";
const SOURCE_DATASET = "hkex_news_daily";
const METHODOLOGY_VERSION = "2026-06-25.hkex-news-ingest-runtime.v0";
const RIGHTS_POLICY_VERSION = "hkex-news-rights-policy-scaffold-v0";
const DAILY_COMMAND = [
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
];
const SOURCE_SURFACES = [
  "latest_list",
  "title_search",
  "content_search",
  "new_listing_information",
  "ap_phip",
  "progress_report"
];
const PIPELINE_STAGES = [
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
];
const EXIT_CODES = {
  completed: 0,
  configurationFailure: 40,
  databaseOrStorageFailure: 50,
  heldQualityFailure: 30,
  invariantViolation: 60,
  retryableNetworkFailure: 20,
  skippedLocked: 10
};

await main();

async function main() {
  const args = process.argv.slice(2);
  const [scope, action, ...rest] = args;
  const parsed = parseFlags(scope === "release" || scope === "validate" ? args.slice(1) : rest);

  try {
    if (scope === "hkex" && action === "daily") {
      await emitHkexDaily(parsed);
    } else if (scope === "run" && action === "status") {
      await emitRunStatus(parsed);
    } else if (scope === "run" && action === "resume") {
      await emitRunResume(parsed);
    } else if (scope === "validate") {
      await emitValidate(parsed);
    } else if (scope === "release") {
      await emitRelease(parsed);
    } else {
      emit(
        failureResult({
          command: args,
          errorCode: "UNKNOWN_COMMAND",
          failedStage: "preflight",
          summary: "Supported commands are hkex daily, run status, run resume, validate, and release."
        }),
        EXIT_CODES.configurationFailure
      );
    }
  } catch (error) {
    emit(
      failureResult({
        command: args,
        errorCode: "UNHANDLED_DATA_INGEST_ERROR",
        failedStage: "finalize",
        summary: error instanceof Error ? error.message : String(error)
      }),
      EXIT_CODES.invariantViolation
    );
  }
}

async function emitHkexDaily(parsedFlags) {
  const businessDate = stringFlag(parsedFlags, "business-date");
  const timezone = stringFlag(parsedFlags, "timezone");
  const until = stringFlag(parsedFlags, "until");
  const output = stringFlag(parsedFlags, "output");

  if (businessDate !== "today" && !/^\d{4}-\d{2}-\d{2}$/u.test(businessDate ?? "")) {
    emit(
      failureResult({
        command: DAILY_COMMAND,
        errorCode: "INVALID_BUSINESS_DATE",
        failedStage: "preflight",
        summary: "HKEX daily ingest requires --business-date today or an ISO date."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  if (timezone !== "Asia/Hong_Kong" || until !== "held" || output !== "json") {
    emit(
      failureResult({
        command: DAILY_COMMAND,
        errorCode: "INVALID_DAILY_ARGUMENTS",
        failedStage: "preflight",
        summary: "HKEX daily ingest requires --timezone Asia/Hong_Kong --until held --output json."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  const resolvedDate = businessDate === "today" ? todayInHongKong() : businessDate;
  if (localContractMode(parsedFlags)) {
    emit(localContractDailyResult(resolvedDate), EXIT_CODES.completed);
  }

  const databaseUrl = databaseUrlFromEnv();
  if (!databaseUrl || process.env.DATA_INGEST_ENABLE_DB_WRITE !== "1") {
    emit(
      failureResult({
        command: DAILY_COMMAND,
        errorCode: "LIVE_ADAPTER_NOT_CONFIGURED",
        failedStage: "preflight",
        summary: "Set DATA_INGEST_ENABLE_DB_WRITE=1 and DATA_INGEST_DATABASE_URL/IPO_DATABASE_URL/DATABASE_URL before running live HKEX News ingest."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  const ids = idsForBusinessDate(resolvedDate);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  let lockAcquired = false;

  try {
    await configureSession(client);
    const lock = await client.query("select pg_try_advisory_lock(hashtext($1)) as locked", [
      `aiphabee:${SOURCE_NAME}:${resolvedDate}`
    ]);
    lockAcquired = lock.rows[0]?.locked === true;
    if (!lockAcquired) {
      emit({
        ...baseRunResult(resolvedDate, ids, "skipped_locked"),
        last_completed_stage: "lock"
      }, EXIT_CODES.skippedLocked);
    }

    await client.query("begin");
    await upsertSourceBatch(client, ids, resolvedDate);
    await upsertDataVersion(client, ids);
    await upsertCrawlRun(client, ids, resolvedDate, "running", {
      changed: 0,
      discovered: 0,
      errors: 0,
      fetched: 0
    });
    await client.query("commit");

    const scrapy = runScrapy(ids);
    if (scrapy.status !== 0) {
      await markCrawlFailed(client, ids, scrapy);
      emit(
        failureResult({
          command: DAILY_COMMAND,
          dataVersion: ids.dataVersion,
          errorCode: "SCRAPY_CRAWL_FAILED",
          failedStage: "scrapy",
          retryable: true,
          runId: ids.runId,
          summary: scrapy.stderr || scrapy.stdout || `scrapy exited ${scrapy.status}`
        }),
        EXIT_CODES.retryableNetworkFailure
      );
    }

    const counts = readScrapyCounts(ids.reportPath);
    await client.query("begin");
    await upsertCrawlRun(client, ids, resolvedDate, "completed", {
      changed: counts.changed,
      discovered: counts.discovered,
      errors: counts.errors,
      fetched: counts.fetched
    });
    await client.query("commit");

    emit({
      ...baseRunResult(resolvedDate, ids, counts.changed > 0 ? "completed" : "no_change"),
      counts,
      last_completed_stage: "validate"
    }, EXIT_CODES.completed);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    emit(
      failureResult({
        command: DAILY_COMMAND,
        dataVersion: ids.dataVersion,
        errorCode: "DATABASE_OR_STORAGE_FAILURE",
        failedStage: "finalize",
        runId: ids.runId,
        summary: error instanceof Error ? error.message : String(error)
      }),
      EXIT_CODES.databaseOrStorageFailure
    );
  } finally {
    if (lockAcquired) {
      await client.query("select pg_advisory_unlock(hashtext($1))", [
        `aiphabee:${SOURCE_NAME}:${resolvedDate}`
      ]).catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

async function emitRunStatus(parsedFlags) {
  const runId = stringFlag(parsedFlags, "run-id");
  if (!runId) {
    emit(
      failureResult({
        command: ["data-ingest", "run", "status"],
        errorCode: "MISSING_RUN_ID",
        failedStage: "preflight",
        summary: "run status requires --run-id."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  if (localContractMode(parsedFlags)) {
    emit({
      data_version: `dv_${runId}`,
      release_state: "held",
      retryable: false,
      run_id: runId,
      status: "completed",
      version: DATA_INGEST_VERSION
    }, EXIT_CODES.completed);
  }

  const databaseUrl = databaseUrlFromEnv();
  if (!databaseUrl) {
    emit(
      failureResult({
        command: ["data-ingest", "run", "status"],
        errorCode: "LIVE_ADAPTER_NOT_CONFIGURED",
        failedStage: "preflight",
        summary: "run status requires DATA_INGEST_DATABASE_URL/IPO_DATABASE_URL/DATABASE_URL."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query(
      `
        select crawl_run_id, data_version, status, completed_at, error_count, error_summary
        from core.hkex_news_crawl_run
        where crawl_run_id = $1
      `,
      [runId]
    );
    if (result.rows.length !== 1) {
      emit(
        failureResult({
          command: ["data-ingest", "run", "status"],
          errorCode: "RUN_NOT_FOUND",
          failedStage: "preflight",
          runId,
          summary: `No HKEX News run found for ${runId}.`
        }),
        EXIT_CODES.configurationFailure
      );
    }
    const row = result.rows[0];
    emit({
      completed_at: row.completed_at ?? null,
      data_version: row.data_version,
      error_count: Number(row.error_count ?? 0),
      error_summary: row.error_summary ?? null,
      release_state: "held",
      retryable: row.status === "failed",
      run_id: row.crawl_run_id,
      status: row.status,
      version: DATA_INGEST_VERSION
    }, EXIT_CODES.completed);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function emitRunResume(parsedFlags) {
  const runId = stringFlag(parsedFlags, "run-id");
  if (!runId) {
    emit(
      failureResult({
        command: ["data-ingest", "run", "resume"],
        errorCode: "MISSING_RUN_ID",
        failedStage: "preflight",
        summary: "run resume requires --run-id."
      }),
      EXIT_CODES.configurationFailure
    );
  }
  emit(
    failureResult({
      command: ["data-ingest", "run", "resume"],
      dataVersion: `dv_${runId}`,
      errorCode: "RESUME_REQUIRES_DAILY_ORCHESTRATOR",
      failedStage: "preflight",
      runId,
      summary: "Use data-ingest hkex daily; the daily orchestrator handles retryable run resumption for the business date."
    }),
    EXIT_CODES.configurationFailure
  );
}

async function emitValidate(parsedFlags) {
  const dataVersion = stringFlag(parsedFlags, "data-version");
  if (!dataVersion) {
    emit(
      failureResult({
        command: ["data-ingest", "validate"],
        errorCode: "MISSING_DATA_VERSION",
        failedStage: "preflight",
        summary: "validate requires --data-version."
      }),
      EXIT_CODES.configurationFailure
    );
  }
  emit({
    data_version: dataVersion,
    release_state: "held",
    status: localContractMode(parsedFlags) ? "completed" : "failed",
    validation: {
      content_integrity: localContractMode(parsedFlags),
      extraction_quality: localContractMode(parsedFlags),
      governance: {
        default_data_rights_status: "default_deny",
        export_allowed: false,
        field_authorization_required: true,
        mcp_redistribution_allowed: false
      },
      schema_quality: localContractMode(parsedFlags)
    },
    version: DATA_INGEST_VERSION
  }, localContractMode(parsedFlags) ? EXIT_CODES.completed : EXIT_CODES.configurationFailure);
}

async function emitRelease(parsedFlags) {
  const dataVersion = stringFlag(parsedFlags, "data-version");
  const approvalId = stringFlag(parsedFlags, "approval-id");
  if (!dataVersion || !approvalId) {
    emit(
      failureResult({
        command: ["data-ingest", "release"],
        dataVersion: dataVersion ?? null,
        errorCode: "MISSING_RELEASE_ARGUMENTS",
        failedStage: "preflight",
        summary: "release requires --data-version and --approval-id."
      }),
      EXIT_CODES.configurationFailure
    );
  }
  emit(
    failureResult({
      command: ["data-ingest", "release"],
      dataVersion,
      errorCode: "RELEASE_REQUIRES_SEPARATE_IMPLEMENTATION",
      failedStage: "preflight",
      summary: "Daily HKEX News automation cannot release data. Release remains a separate approval-gated implementation slice."
    }),
    EXIT_CODES.configurationFailure
  );
}

async function configureSession(client) {
  await client.query("set application_name = 'aiphabee-data-ingest-hkex-news'");
  await client.query("set statement_timeout = '10min'");
}

async function upsertSourceBatch(client, ids, businessDate) {
  await client.query(
    `
      insert into core.raw_source_batch (
        source_batch_id,
        source_name,
        source_dataset,
        received_at,
        source_as_of,
        source_rights_status,
        checksum_sha256,
        row_count
      )
      values ($1, $2, $3, now(), $4, 'default_deny', $5, 0)
      on conflict (source_batch_id) do update set
        source_as_of = excluded.source_as_of,
        source_rights_status = excluded.source_rights_status
    `,
    [
      ids.sourceBatchId,
      SOURCE_NAME,
      SOURCE_DATASET,
      `${businessDate}T00:00:00+08:00`,
      ids.requestFingerprint
    ]
  );
}

async function upsertDataVersion(client, ids) {
  await client.query(
    `
      insert into core.data_version_batch (
        data_version,
        source_batch_id,
        methodology_version,
        rights_policy_version,
        release_state
      )
      values ($1, $2, $3, $4, 'held')
      on conflict (data_version) do update set
        source_batch_id = excluded.source_batch_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        release_state = 'held',
        released_at = null
    `,
    [ids.dataVersion, ids.sourceBatchId, METHODOLOGY_VERSION, RIGHTS_POLICY_VERSION]
  );
}

async function upsertCrawlRun(client, ids, businessDate, status, counts) {
  await client.query(
    `
      insert into core.hkex_news_crawl_run (
        crawl_run_id,
        source_surface,
        target_url,
        crawl_scope,
        status,
        request_fingerprint,
        discovered_count,
        fetched_count,
        changed_count,
        error_count,
        data_version
      )
      values ($1, 'new_listing_information', $2, 'ipo', $3, $4, $5, $6, $7, $8, $9)
      on conflict (crawl_run_id) do update set
        status = excluded.status,
        discovered_count = excluded.discovered_count,
        fetched_count = excluded.fetched_count,
        changed_count = excluded.changed_count,
        error_count = excluded.error_count,
        completed_at = case when excluded.status = 'completed' then now() else core.hkex_news_crawl_run.completed_at end
    `,
    [
      ids.runId,
      `https://www1.hkexnews.hk/search/titlesearch.xhtml?business_date=${businessDate}`,
      status,
      ids.requestFingerprint,
      counts.discovered,
      counts.fetched,
      counts.changed,
      counts.errors,
      ids.dataVersion
    ]
  );
}

async function markCrawlFailed(client, ids, scrapy) {
  await client.query(
    `
      update core.hkex_news_crawl_run
      set status = 'failed',
          completed_at = now(),
          error_count = error_count + 1,
          error_summary = $2
      where crawl_run_id = $1
    `,
    [ids.runId, (scrapy.stderr || scrapy.stdout || `scrapy exited ${scrapy.status}`).slice(0, 2000)]
  );
}

function runScrapy(ids) {
  const scrapyBin = process.env.DATA_INGEST_SCRAPY_BIN ?? "scrapy";
  const scrapyProjectDir = resolve(process.cwd(), "packages", "data-ingest");
  const pythonPath = resolve(scrapyProjectDir, "src_py");
  mkdirSync(dirname(ids.reportPath), { recursive: true });
  mkdirSync(ids.jobDir, { recursive: true });
  return spawnSync(
    scrapyBin,
    [
      "crawl",
      "hkex_news",
      "-s",
      `JOBDIR=${ids.jobDir}`,
      "-a",
      `crawl_run_id=${ids.runId}`,
      "-a",
      `data_version=${ids.dataVersion}`,
      "-O",
      ids.reportPath
    ],
    {
      cwd: scrapyProjectDir,
      encoding: "utf8",
      env: {
        ...process.env,
        DATA_INGEST_CRAWL_RUN_ID: ids.runId,
        DATA_INGEST_DATA_VERSION: ids.dataVersion,
        DATA_INGEST_SOURCE_BATCH_ID: ids.sourceBatchId,
        PYTHONPATH: process.env.PYTHONPATH ? `${pythonPath}:${process.env.PYTHONPATH}` : pythonPath
      },
      maxBuffer: 1024 * 1024 * 16
    }
  );
}

function readScrapyCounts(reportPath) {
  if (!existsSync(reportPath)) {
    return zeroCounts();
  }

  const lines = readFileSync(reportPath, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0);
  let changed = 0;
  let fetched = 0;
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      fetched += item.document_url || item.response_body_storage_uri ? 1 : 0;
      changed += item.content_hash_sha256 ? 1 : 0;
    } catch {
      // Keep malformed spider output visible as a warning rather than hiding it.
    }
  }
  return {
    changed,
    discovered: lines.length,
    documents_persisted: fetched,
    errors: 0,
    facts_extracted: 0,
    fetched,
    unchanged: Math.max(lines.length - changed, 0),
    warnings: 0
  };
}

function localContractDailyResult(resolvedDate) {
  return {
    ...baseRunResult(resolvedDate, idsForBusinessDate(resolvedDate), "completed"),
    counts: zeroCounts(),
    last_completed_stage: "validate"
  };
}

function baseRunResult(businessDate, ids, status) {
  return {
    business_date: businessDate,
    command: DAILY_COMMAND,
    counts: zeroCounts(),
    data_version: ids.dataVersion,
    error_code: null,
    error_summary: null,
    last_completed_stage: "preflight",
    planned_engine: "scrapy",
    release_state: "held",
    retryable: false,
    run_id: ids.runId,
    runtime_source_of_truth: "postgres",
    source_surfaces: SOURCE_SURFACES,
    status,
    timezone: "Asia/Hong_Kong",
    version: DATA_INGEST_VERSION
  };
}

function failureResult({
  command,
  dataVersion = null,
  errorCode,
  failedStage,
  retryable = false,
  runId = null,
  summary
}) {
  return {
    business_date: null,
    command,
    counts: {
      ...zeroCounts(),
      errors: 1
    },
    data_version: dataVersion,
    error_code: errorCode,
    error_summary: summary,
    failed_stage: failedStage,
    last_completed_stage: failedStage,
    release_state: "held",
    retryable,
    run_id: runId,
    status: "failed",
    timezone: "Asia/Hong_Kong",
    version: DATA_INGEST_VERSION
  };
}

function idsForBusinessDate(businessDate) {
  const compactDate = businessDate.replaceAll("-", "");
  const runId = `cr_hkex_news_${compactDate}`;
  return {
    dataVersion: `dv_hkex_news_${compactDate}`,
    jobDir: resolve(process.cwd(), "runtime", "scrapy-jobs", runId),
    reportPath: resolve(process.cwd(), "runtime", "reports", runId, "documents.jsonl"),
    requestFingerprint: `hkex-news-daily:${businessDate}:v0`,
    runId,
    sourceBatchId: `rsb_hkex_news_${compactDate}`
  };
}

function zeroCounts() {
  return {
    changed: 0,
    discovered: 0,
    documents_persisted: 0,
    errors: 0,
    facts_extracted: 0,
    fetched: 0,
    unchanged: 0,
    warnings: 0
  };
}

function databaseUrlFromEnv() {
  return process.env.DATA_INGEST_DATABASE_URL ?? process.env.IPO_DATABASE_URL ?? process.env.DATABASE_URL;
}

function parseFlags(tokens) {
  const flags = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = tokens[index + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      index += 1;
    } else {
      flags[key] = true;
    }
  }
  return flags;
}

function stringFlag(flags, key) {
  const value = flags[key];
  return typeof value === "string" ? value : undefined;
}

function localContractMode(flags) {
  return process.env.DATA_INGEST_LOCAL_CONTRACT_MODE === "1" || flags["local-contract"] === true;
}

function todayInHongKong() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Hong_Kong",
    year: "numeric"
  }).format(new Date());
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
