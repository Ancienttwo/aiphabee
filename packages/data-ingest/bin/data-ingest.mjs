#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const DATA_INGEST_VERSION = "2026-06-25.hkex-news-ingest-contract.v0";
const SOURCE_NAME = "hkex_news";
const SOURCE_DATASET = "hkex_news_daily";
const METHODOLOGY_VERSION = "2026-06-25.hkex-news-ingest-runtime.v0";
const RIGHTS_POLICY_VERSION = "hkex-news-rights-policy-scaffold-v0";
const SANITIZER_VERSION = "metadata-sanitizer-v0";
const EXTRACTOR_NAME = "hkex-news-metadata-extractor";
const EXTRACTOR_VERSION = "2026-06-27.metadata-facts.v0";
const TRANSFORM_VERSION = "2026-06-27.pending-fact-transform.v0";
const STALE_RUNNING_RUN_MINUTES = 15;
const RELEASE_ENABLE_ENV = "DATA_INGEST_ENABLE_RELEASE";
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
const AUTO_IPO_LINK_MATCHED_BY = [
  "hkex_code",
  "hkex_code:application",
  "hkex_code:offering",
  "hkex_code:offering_application"
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
  const command = [
    "data-ingest",
    "hkex",
    "daily",
    "--business-date",
    businessDate,
    "--timezone",
    timezone,
    "--until",
    until,
    "--output",
    output
  ];
  if (localContractMode(parsedFlags)) {
    emit(localContractDailyResult(resolvedDate, command), EXIT_CODES.completed);
  }

  await runHkexDaily(resolvedDate, command);
}

async function runHkexDaily(resolvedDate, command = DAILY_COMMAND) {
  const databaseUrl = databaseUrlFromEnv();
  if (!databaseUrl || process.env.DATA_INGEST_ENABLE_DB_WRITE !== "1") {
    emit(
      failureResult({
        command,
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
        ...baseRunResult(resolvedDate, ids, "skipped_locked", command),
        last_completed_stage: "lock"
      }, EXIT_CODES.skippedLocked);
    }

    const existingReleaseState = await readDataVersionReleaseState(client, ids.dataVersion);
    if (existingReleaseState && existingReleaseState !== "held") {
      emit(
        failureResult({
          command,
          dataVersion: ids.dataVersion,
          errorCode: "DATA_VERSION_NOT_MUTABLE",
          failedStage: "data_version",
          runId: ids.runId,
          summary: `Daily HKEX News ingest cannot mutate ${ids.dataVersion} because release_state=${existingReleaseState}.`
        }),
        EXIT_CODES.invariantViolation
      );
    }

    await client.query("begin");
    await upsertSourceBatch(client, ids, resolvedDate);
    await upsertDataVersion(client, ids);
    await markStaleRunningRunFailed(client, ids);
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
          command,
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

    const report = readScrapyReport(ids.reportPath);
    await client.query("begin");
    const persistence = await persistScrapyDocuments(client, ids, report.items);
    const reconciliation = await reconcileCurrentRunScope(client, ids, persistence.documents);
    const heldFacts = await runHeldFactPipeline(client, ids, persistence.documents, reconciliation);
    const counts = countsFromScrapyReport(report, persistence);
    counts.facts_extracted = heldFacts.factsExtracted;
    await updateSourceBatchRowCount(client, ids, counts.documents_persisted);
    await upsertCrawlRun(client, ids, resolvedDate, "completed", {
      changed: counts.changed,
      discovered: counts.discovered,
      errors: counts.errors,
      fetched: counts.fetched
    });
    await client.query("commit");

    emit({
      ...baseRunResult(
        resolvedDate,
        ids,
        counts.changed > 0 || counts.facts_extracted > 0 ? "completed" : "no_change",
        command
      ),
      counts,
      last_completed_stage: "validate"
    }, EXIT_CODES.completed);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    emit(
      failureResult({
        command,
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

  const resolvedDate = businessDateFromRunId(runId);
  if (!resolvedDate) {
    emit(
      failureResult({
        command: ["data-ingest", "run", "resume"],
        dataVersion: `dv_${runId}`,
        errorCode: "INVALID_RUN_ID",
        failedStage: "preflight",
        runId,
        summary: "run resume requires a cr_hkex_news_YYYYMMDD run id."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  if (localContractMode(parsedFlags)) {
    emit({
      ...baseRunResult(resolvedDate, idsForBusinessDate(resolvedDate), "completed", [
        "data-ingest",
        "run",
        "resume",
        "--run-id",
        runId,
        "--output",
        "json"
      ]),
      last_completed_stage: "validate"
    }, EXIT_CODES.completed);
  }

  await runHkexDaily(resolvedDate, ["data-ingest", "run", "resume", "--run-id", runId, "--output", "json"]);
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
  if (localContractMode(parsedFlags)) {
    emit(validationResult(dataVersion, true), EXIT_CODES.completed);
  }

  const databaseUrl = databaseUrlFromEnv();
  if (!databaseUrl) {
    emit(
      failureResult({
        command: ["data-ingest", "validate"],
        dataVersion,
        errorCode: "LIVE_ADAPTER_NOT_CONFIGURED",
        failedStage: "preflight",
        summary: "validate requires DATA_INGEST_DATABASE_URL/IPO_DATABASE_URL/DATABASE_URL."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const validation = await readValidationState(client, dataVersion);
    if (!validation.exists) {
      emit(
        failureResult({
          command: ["data-ingest", "validate"],
          dataVersion,
          errorCode: "DATA_VERSION_NOT_FOUND",
          failedStage: "validate",
          summary: `No data_version found for ${dataVersion}.`
        }),
        EXIT_CODES.configurationFailure
      );
    }
    emit(
      validationResult(dataVersion, validation.pass, validation.metrics, validation.releaseState ?? "held"),
      validation.pass ? EXIT_CODES.completed : EXIT_CODES.heldQualityFailure
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function emitRelease(parsedFlags) {
  const dataVersion = stringFlag(parsedFlags, "data-version");
  const approvalId = stringFlag(parsedFlags, "approval-id");
  const output = stringFlag(parsedFlags, "output");
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
  if (output !== "json") {
    emit(
      failureResult({
        command: releaseCommand(dataVersion),
        dataVersion,
        errorCode: "INVALID_RELEASE_ARGUMENTS",
        failedStage: "preflight",
        summary: "release requires --output json."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  if (localContractMode(parsedFlags)) {
    emit(
      releaseResult({
        approvalId,
        dataVersion,
        mode: "local_contract",
        releasedAt: null,
        validationMetrics: {
          counts_match_transform: true,
          transform_completed: true
        },
        writesDatabase: false
      }),
      EXIT_CODES.completed
    );
  }

  const releaseBusinessDate = businessDateFromDataVersion(dataVersion);
  if (!releaseBusinessDate) {
    emit(
      failureResult({
        command: releaseCommand(dataVersion),
        dataVersion,
        errorCode: "INVALID_DATA_VERSION",
        failedStage: "preflight",
        summary: "release requires data_version shaped as dv_hkex_news_YYYYMMDD."
      }),
      EXIT_CODES.configurationFailure
    );
  }

  const databaseUrl = databaseUrlFromEnv();
  if (!databaseUrl || process.env[RELEASE_ENABLE_ENV] !== "1") {
    emit(
      failureResult({
        command: releaseCommand(dataVersion),
        dataVersion,
        errorCode: "LIVE_RELEASE_NOT_CONFIGURED",
        failedStage: "preflight",
        summary: `release requires ${RELEASE_ENABLE_ENV}=1 and DATA_INGEST_DATABASE_URL/IPO_DATABASE_URL/DATABASE_URL.`
      }),
      EXIT_CODES.configurationFailure
    );
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  let lockAcquired = false;
  try {
    await configureSession(client);
    const lock = await client.query("select pg_try_advisory_lock(hashtext($1)) as locked", [
      `aiphabee:${SOURCE_NAME}:${releaseBusinessDate}`
    ]);
    lockAcquired = lock.rows[0]?.locked === true;
    if (!lockAcquired) {
      emit(
        failureResult({
          command: releaseCommand(dataVersion),
          dataVersion,
          errorCode: "DATA_VERSION_LOCKED",
          failedStage: "lock",
          retryable: true,
          summary: `release skipped because ${dataVersion} is locked by an active HKEX News ingest.`
        }),
        EXIT_CODES.skippedLocked
      );
    }

    await client.query("begin");
    const validation = await readValidationState(client, dataVersion);
    if (!validation.exists) {
      await client.query("rollback");
      emit(
        failureResult({
          command: releaseCommand(dataVersion),
          dataVersion,
          errorCode: "DATA_VERSION_NOT_FOUND",
          failedStage: "validate",
          summary: `No data_version found for ${dataVersion}.`
        }),
        EXIT_CODES.configurationFailure
      );
    }
    if (validation.releaseState !== "held") {
      await client.query("rollback");
      emit(
        failureResult({
          command: releaseCommand(dataVersion),
          dataVersion,
          errorCode: "DATA_VERSION_NOT_HELD",
          failedStage: "validate",
          summary: `release requires held data_version; ${dataVersion} is ${validation.releaseState}.`
        }),
        EXIT_CODES.invariantViolation
      );
    }
    if (!validation.pass) {
      await client.query("rollback");
      emit(
        {
          ...failureResult({
            command: releaseCommand(dataVersion),
            dataVersion,
            errorCode: "RELEASE_VALIDATION_FAILED",
            failedStage: "validate",
            summary: `release validation failed for ${dataVersion}.`
          }),
          metrics: validation.metrics
        },
        EXIT_CODES.heldQualityFailure
      );
    }

    const update = await client.query(
      `
        update core.data_version_batch
        set release_state = 'released',
            released_at = now()
        where data_version = $1
          and release_state = 'held'
        returning released_at
      `,
      [dataVersion]
    );
    if (update.rows.length !== 1) {
      await client.query("rollback");
      emit(
        failureResult({
          command: releaseCommand(dataVersion),
          dataVersion,
          errorCode: "RELEASE_STATE_UPDATE_CONFLICT",
          failedStage: "release",
          summary: `release_state update did not affect exactly one held data_version for ${dataVersion}.`
        }),
        EXIT_CODES.invariantViolation
      );
    }
    await client.query("commit");
    emit(
      releaseResult({
        approvalId,
        dataVersion,
        mode: "live",
        releasedAt: update.rows[0]?.released_at ? new Date(update.rows[0].released_at).toISOString() : null,
        validationMetrics: validation.metrics,
        writesDatabase: true
      }),
      EXIT_CODES.completed
    );
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    emit(
      failureResult({
        command: releaseCommand(dataVersion),
        dataVersion,
        errorCode: "DATABASE_OR_STORAGE_FAILURE",
        failedStage: "release",
        summary: error instanceof Error ? error.message : String(error)
      }),
      EXIT_CODES.databaseOrStorageFailure
    );
  } finally {
    if (lockAcquired) {
      await client.query("select pg_advisory_unlock(hashtext($1))", [
        `aiphabee:${SOURCE_NAME}:${releaseBusinessDate}`
      ]).catch(() => undefined);
    }
    await client.end().catch(() => undefined);
  }
}

async function readDataVersionReleaseState(client, dataVersion) {
  const result = await client.query(
    "select release_state from core.data_version_batch where data_version = $1",
    [dataVersion]
  );
  return typeof result.rows[0]?.release_state === "string" ? result.rows[0].release_state : null;
}

async function readValidationState(client, dataVersion) {
  const result = await client.query(
    `
      with latest_crawl as (
        select status, error_count
        from core.hkex_news_crawl_run
        where data_version = $1
        order by completed_at desc nulls last, crawl_run_id desc
        limit 1
      ),
      observation_counts as (
        select count(distinct document_id)::int as document_count
        from core.hkex_news_document_observation
        where data_version = $1
      ),
      fact_counts as (
        select count(distinct extracted_fact_id)::int as extracted_fact_count
        from core.hkex_news_extracted_fact
        where data_version = $1
          and fact_namespace = 'hkex_news'
      ),
      latest_transform as (
        select status, validation_report
        from core.hkex_news_transform_run
        where data_version = $1
        order by completed_at desc nulls last, transform_run_id desc
        limit 1
      )
      select
        dv.data_version,
        dv.release_state,
        cr.status,
        cr.error_count,
        coalesce(obs.document_count, 0)::int as document_count,
        coalesce(fact.extracted_fact_count, 0)::int as extracted_fact_count,
        tx.status = 'completed' as transform_completed,
        tx.validation_report
      from core.data_version_batch dv
      left join latest_crawl cr on true
      left join observation_counts obs on true
      left join fact_counts fact on true
      left join latest_transform tx on true
      where dv.data_version = $1
    `,
    [dataVersion]
  );
  if (result.rows.length === 0) {
    return {
      exists: false,
      metrics: {},
      pass: false,
      releaseState: null
    };
  }

  const row = result.rows[0];
  const documentCount = Number(row.document_count ?? 0);
  const extractedFactCount = Number(row.extracted_fact_count ?? 0);
  const transformCompleted = row.transform_completed === true;
  const validationReport = isRecord(row.validation_report) ? row.validation_report : {};
  const expectedDocumentCount = integerOrNull(validationReport.document_count);
  const expectedFactCount = integerOrNull(validationReport.candidate_fact_count);
  const countsMatchTransform = (expectedDocumentCount === null || documentCount === expectedDocumentCount)
    && (expectedFactCount === null || extractedFactCount === expectedFactCount);
  const pass = row.release_state === "held"
    && row.status === "completed"
    && Number(row.error_count ?? 0) === 0
    && (documentCount === 0 || extractedFactCount > 0)
    && transformCompleted
    && countsMatchTransform;

  return {
    exists: true,
    metrics: {
      counts_match_transform: countsMatchTransform,
      document_count: documentCount,
      expected_document_count: expectedDocumentCount,
      expected_fact_count: expectedFactCount,
      extracted_fact_count: extractedFactCount,
      linked_document_count: integerOrNull(validationReport.linked_document_count),
      reconciliation: isRecord(validationReport.reconciliation) ? validationReport.reconciliation : null,
      transform_completed: transformCompleted
    },
    pass,
    releaseState: typeof row.release_state === "string" ? row.release_state : null
  };
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
        release_state = case
          when core.data_version_batch.release_state = 'held' then 'held'
          else core.data_version_batch.release_state
        end,
        released_at = case
          when core.data_version_batch.release_state = 'held' then null
          else core.data_version_batch.released_at
        end
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
      values ($1, 'title_search', $2, 'ipo', $3, $4, $5, $6, $7, $8, $9)
      on conflict (crawl_run_id) do update set
        source_surface = excluded.source_surface,
        target_url = excluded.target_url,
        crawl_scope = excluded.crawl_scope,
        status = excluded.status,
        request_fingerprint = excluded.request_fingerprint,
        started_at = case when excluded.status = 'running' then now() else core.hkex_news_crawl_run.started_at end,
        discovered_count = excluded.discovered_count,
        fetched_count = excluded.fetched_count,
        changed_count = excluded.changed_count,
        error_count = excluded.error_count,
        error_summary = case when excluded.status in ('running', 'completed') then null else core.hkex_news_crawl_run.error_summary end,
        data_version = excluded.data_version,
        completed_at = case
          when excluded.status = 'completed' then now()
          when excluded.status = 'running' then null
          else core.hkex_news_crawl_run.completed_at
        end
    `,
    [
      ids.runId,
      `https://www1.hkexnews.hk/search/titleSearchServlet.do?business_date=${businessDate}&scope=ipo`,
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

async function markStaleRunningRunFailed(client, ids) {
  await client.query(
    `
      update core.hkex_news_crawl_run
      set status = 'failed',
          completed_at = now(),
          error_count = error_count + 1,
          error_summary = $3
      where crawl_run_id = $1
        and data_version = $2
        and status = 'running'
        and started_at < now() - ($4::int * interval '1 minute')
    `,
    [
      ids.runId,
      ids.dataVersion,
      `Stale running HKEX News ingest recovered before rerun after ${STALE_RUNNING_RUN_MINUTES} minutes; previous execution likely ended before JSON output.`,
      STALE_RUNNING_RUN_MINUTES
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

async function updateSourceBatchRowCount(client, ids, rowCount) {
  await client.query(
    `
      update core.raw_source_batch
      set row_count = $2
      where source_batch_id = $1
    `,
    [ids.sourceBatchId, rowCount]
  );
}

async function persistScrapyDocuments(client, ids, items) {
  let changed = 0;
  let documentsPersisted = 0;
  let warnings = 0;
  const documents = [];

  for (const [index, item] of items.entries()) {
    const document = normalizeScrapyDocument(item, index);
    if (!document) {
      warnings += 1;
      continue;
    }

    const previous = await client.query(
      `
        select latest_content_hash_sha256
        from core.hkex_news_document
        where source_name = $1 and source_record_id = $2
        limit 1
      `,
      [SOURCE_NAME, document.sourceRecordId]
    );
    const previousHash = previous.rows[0]?.latest_content_hash_sha256 ?? null;
    const isChanged = previousHash !== document.contentHash;

    if (isChanged) {
      changed += 1;
    }
    documentsPersisted += 1;

    await upsertRawSnapshot(client, ids, document);
    await upsertDocument(client, document);
    await upsertDocumentObservation(client, ids, document, isChanged);
    if (document.contentHash) {
      await upsertDocumentContent(client, document);
    }
    documents.push(document);
  }

  return {
    changed,
    documents,
    documentsPersisted,
    warnings
  };
}

async function upsertRawSnapshot(client, ids, document) {
  await client.query(
    `
      insert into core.raw_snapshot (
        raw_snapshot_id,
        source_batch_id,
        source_record_id,
        record_kind,
        payload,
        payload_hash_sha256,
        received_at,
        quality_state,
        data_version,
        methodology_version
      )
      values ($1, $2, $3, 'hkex_news_document', $4::jsonb, $5, now(), 'HOLD', $6, $7)
      on conflict (source_batch_id, source_record_id) do update set
        payload = excluded.payload,
        payload_hash_sha256 = excluded.payload_hash_sha256,
        received_at = excluded.received_at,
        quality_state = excluded.quality_state,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version
    `,
    [
      document.rawSnapshotId,
      ids.sourceBatchId,
      document.sourceRecordId,
      JSON.stringify(document.rawPayload),
      document.payloadHash,
      ids.dataVersion,
      METHODOLOGY_VERSION
    ]
  );
}

async function upsertDocument(client, document) {
  await client.query(
    `
      insert into core.hkex_news_document (
        document_id,
        source_name,
        source_record_id,
        canonical_url,
        document_url,
        title_en,
        title_zh_hant,
        hkex_code,
        market,
        published_at,
        language,
        content_type,
        latest_content_hash_sha256,
        document_state,
        access_policy,
        rights_policy_version,
        quality_state
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, 'UNKNOWN', $9, 'unknown', $10, $11, 'unknown', $12, $13, 'HOLD')
      on conflict (source_name, source_record_id) do update set
        canonical_url = excluded.canonical_url,
        document_url = excluded.document_url,
        title_en = excluded.title_en,
        title_zh_hant = excluded.title_zh_hant,
        hkex_code = excluded.hkex_code,
        published_at = excluded.published_at,
        content_type = excluded.content_type,
        latest_content_hash_sha256 = excluded.latest_content_hash_sha256,
        access_policy = excluded.access_policy,
        rights_policy_version = excluded.rights_policy_version,
        quality_state = excluded.quality_state,
        last_seen_at = now()
    `,
    [
      document.documentId,
      SOURCE_NAME,
      document.sourceRecordId,
      document.canonicalUrl,
      document.documentUrl,
      document.titleEn,
      document.titleZhHant,
      document.hkexCode,
      document.publishedAt,
      document.contentType,
      document.contentHash,
      document.accessPolicy,
      RIGHTS_POLICY_VERSION
    ]
  );
}

async function upsertDocumentObservation(client, ids, document, isChanged) {
  await client.query(
    `
      insert into core.hkex_news_document_observation (
        document_observation_id,
        document_id,
        crawl_run_id,
        raw_snapshot_id,
        data_version,
        source_surface,
        source_page_url,
        result_rank,
        fetched_at,
        http_status,
        observed_content_hash_sha256,
        is_changed
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9, $10, $11)
      on conflict (document_id, crawl_run_id, source_page_url) do update set
        raw_snapshot_id = excluded.raw_snapshot_id,
        result_rank = excluded.result_rank,
        fetched_at = excluded.fetched_at,
        http_status = excluded.http_status,
        observed_content_hash_sha256 = excluded.observed_content_hash_sha256,
        is_changed = excluded.is_changed
    `,
    [
      document.observationId,
      document.documentId,
      ids.runId,
      document.rawSnapshotId,
      ids.dataVersion,
      document.sourceSurface,
      document.sourcePageUrl,
      document.resultRank,
      document.httpStatus,
      document.contentHash,
      isChanged
    ]
  );
}

async function upsertDocumentContent(client, document) {
  await client.query(
    `
      insert into core.hkex_news_document_content (
        document_content_id,
        document_id,
        raw_snapshot_id,
        storage_uri,
        binary_hash_sha256,
        raw_text,
        sanitized_text,
        sanitizer_version,
        extraction_ready,
        prompt_injection_isolated
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, true, true)
      on conflict (document_content_id) do update set
        raw_snapshot_id = excluded.raw_snapshot_id,
        storage_uri = excluded.storage_uri,
        raw_text = excluded.raw_text,
        sanitized_text = excluded.sanitized_text,
        sanitizer_version = excluded.sanitizer_version,
        extraction_ready = true,
        prompt_injection_isolated = true
    `,
    [
      document.contentId,
      document.documentId,
      document.rawSnapshotId,
      document.storageUri,
      document.contentHash,
      document.rawText,
      document.sanitizedText,
      SANITIZER_VERSION
    ]
  );
}

async function reconcileCurrentRunScope(client, ids, documents) {
  const documentIds = Array.from(new Set(documents.map((document) => document.documentId)));
  const factCleanup = await client.query(
    `
      delete from core.hkex_news_extracted_fact
      where data_version = $1
        and fact_namespace = 'hkex_news'
        and review_state = 'pending'
        and quality_state = 'HOLD'
        and not (document_id = any($2::text[]))
    `,
    [ids.dataVersion, documentIds]
  );
  const linkCleanup = await client.query(
    `
      delete from core.ipo_source_document_link
      where data_version = $1
        and matched_by = any($2::text[])
        and not (document_id = any($3::text[]))
    `,
    [ids.dataVersion, AUTO_IPO_LINK_MATCHED_BY, documentIds]
  );
  const extractionRunCleanup = await client.query(
    `
      delete from core.hkex_news_extraction_run run
      where run.data_version = $1
        and run.extractor_name = $3
        and not (run.document_id = any($2::text[]))
        and not exists (
          select 1
          from core.hkex_news_extracted_fact fact
          where fact.extraction_run_id = run.extraction_run_id
        )
    `,
    [ids.dataVersion, documentIds, EXTRACTOR_NAME]
  );
  const observationCleanup = await client.query(
    `
      delete from core.hkex_news_document_observation
      where crawl_run_id = $1
        and data_version = $2
        and not (document_id = any($3::text[]))
    `,
    [ids.runId, ids.dataVersion, documentIds]
  );

  return {
    currentDocumentCount: documentIds.length,
    removedExtractionRuns: extractionRunCleanup.rowCount ?? 0,
    removedFacts: factCleanup.rowCount ?? 0,
    removedLinks: linkCleanup.rowCount ?? 0,
    removedObservations: observationCleanup.rowCount ?? 0
  };
}

async function runHeldFactPipeline(client, ids, documents, reconciliation) {
  let factsExtracted = 0;
  let linkedDocuments = 0;

  for (const document of documents) {
    const entityLink = await resolveIpoEntityLink(client, document);
    if (entityLink.offeringId || entityLink.appCode) {
      await upsertIpoSourceDocumentLink(client, ids, document, entityLink);
      linkedDocuments += 1;
    }

    const extractionRunId = extractionRunIdFor(ids, document);
    await upsertExtractionRun(client, ids, document, extractionRunId);

    for (const fact of extractedFactsForDocument(ids, document, entityLink, extractionRunId)) {
      await upsertExtractedFact(client, fact);
      factsExtracted += 1;
    }
  }

  await upsertTransformRun(client, ids, {
    documentsExtracted: documents.length,
    factsExtracted,
    linkedDocuments,
    reconciliation
  });

  return {
    documentsExtracted: documents.length,
    factsExtracted,
    linkedDocuments
  };
}

async function resolveIpoEntityLink(client, document) {
  const normalizedCode = normalizeHkexCode(document.hkexCode);
  if (!normalizedCode) {
    return { appCode: null, confidence: null, matchedBy: null, offeringId: null };
  }

  const offering = await client.query(
    `
      select offering_id
      from core.ipo_offering
      where lpad(regexp_replace(hkex_code, '\\D', '', 'g'), 5, '0') = $1
      order by listing_date desc, updated_at desc
      limit 1
    `,
    [normalizedCode]
  );
  const offeringId = offering.rows[0]?.offering_id ?? null;

  const application = await client.query(
    `
      select app_code, offering_id
      from core.ipo_pipeline_application
      where lpad(regexp_replace(coalesce(list_code, ''), '\\D', '', 'g'), 5, '0') = $1
         or ($2::text is not null and offering_id = $2)
      order by publish_date desc nulls last, phip_date desc nulls last, app_code
      limit 1
    `,
    [normalizedCode, offeringId]
  );

  return {
    appCode: application.rows[0]?.app_code ?? null,
    confidence: entityLinkConfidence({
      appCode: application.rows[0]?.app_code ?? null,
      offeringId: offeringId ?? application.rows[0]?.offering_id ?? null
    }),
    matchedBy: entityLinkMatchedBy({
      appCode: application.rows[0]?.app_code ?? null,
      offeringId: offeringId ?? application.rows[0]?.offering_id ?? null
    }),
    offeringId: offeringId ?? application.rows[0]?.offering_id ?? null
  };
}

async function upsertIpoSourceDocumentLink(client, ids, document, entityLink) {
  const linkType = classifyDocumentLinkType(document);
  await client.query(
    `
      delete from core.ipo_source_document_link
      where document_id = $1
        and data_version = $2
        and link_type <> $3
        and matched_by = any($4::text[])
    `,
    [document.documentId, ids.dataVersion, linkType, AUTO_IPO_LINK_MATCHED_BY]
  );
  await client.query(
    `
      insert into core.ipo_source_document_link (
        ipo_source_document_link_id,
        offering_id,
        app_code,
        document_id,
        link_type,
        confidence,
        matched_by,
        data_version
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (document_id, link_type, data_version) do update set
        offering_id = excluded.offering_id,
        app_code = excluded.app_code,
        confidence = excluded.confidence,
        matched_by = excluded.matched_by
    `,
    [
      `iposdl_${stableHash(`${document.documentId}:${linkType}:${ids.dataVersion}`).slice(0, 32)}`,
      entityLink.offeringId,
      entityLink.appCode,
      document.documentId,
      linkType,
      entityLink.confidence,
      entityLink.matchedBy,
      ids.dataVersion
    ]
  );
}

async function upsertExtractionRun(client, ids, document, extractionRunId) {
  await client.query(
    `
      insert into core.hkex_news_extraction_run (
        extraction_run_id,
        document_id,
        document_content_id,
        extractor_name,
        extractor_version,
        run_kind,
        completed_at,
        status,
        data_version
      )
      values ($1, $2, $3, $4, $5, 'deterministic', now(), 'completed', $6)
      on conflict (extraction_run_id) do update set
        extractor_name = excluded.extractor_name,
        extractor_version = excluded.extractor_version,
        completed_at = now(),
        status = 'completed',
        error_summary = null,
        data_version = excluded.data_version
    `,
    [
      extractionRunId,
      document.documentId,
      document.contentId,
      EXTRACTOR_NAME,
      EXTRACTOR_VERSION,
      ids.dataVersion
    ]
  );
}

async function upsertExtractedFact(client, fact) {
  await client.query(
    `
      insert into core.hkex_news_extracted_fact (
        extracted_fact_id,
        extraction_run_id,
        document_id,
        offering_id,
        app_code,
        fact_namespace,
        fact_key,
        value_type,
        value_text,
        value_numeric,
        value_date,
        value_timestamptz,
        value_boolean,
        value_json,
        unit,
        currency,
        lang,
        locator,
        locator_hash,
        confidence,
        review_state,
        raw_snapshot_id,
        data_version,
        quality_state
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14::jsonb,
        $15, $16, $17, $18::jsonb, $19, $20,
        'pending', $21, $22, 'HOLD'
      )
      on conflict (document_id, fact_key, locator_hash, data_version) do update set
        extraction_run_id = excluded.extraction_run_id,
        offering_id = excluded.offering_id,
        app_code = excluded.app_code,
        value_type = excluded.value_type,
        value_text = excluded.value_text,
        value_numeric = excluded.value_numeric,
        value_date = excluded.value_date,
        value_timestamptz = excluded.value_timestamptz,
        value_boolean = excluded.value_boolean,
        value_json = excluded.value_json,
        unit = excluded.unit,
        currency = excluded.currency,
        lang = excluded.lang,
        locator = excluded.locator,
        confidence = excluded.confidence,
        review_state = 'pending',
        raw_snapshot_id = excluded.raw_snapshot_id,
        quality_state = 'HOLD'
    `,
    [
      fact.extractedFactId,
      fact.extractionRunId,
      fact.documentId,
      fact.offeringId,
      fact.appCode,
      fact.factNamespace,
      fact.factKey,
      fact.valueType,
      fact.valueText,
      fact.valueNumeric,
      fact.valueDate,
      fact.valueTimestamptz,
      fact.valueBoolean,
      JSON.stringify(fact.valueJson),
      fact.unit,
      fact.currency,
      fact.lang,
      JSON.stringify(fact.locator),
      fact.locatorHash,
      fact.confidence,
      fact.rawSnapshotId,
      fact.dataVersion
    ]
  );
}

async function upsertTransformRun(client, ids, summary) {
  await client.query(
    `
      insert into core.hkex_news_transform_run (
        transform_run_id,
        source_name,
        data_version,
        completed_at,
        status,
        accepted_fact_count,
        upserted_offering_count,
        upserted_timetable_event_count,
        upserted_allotment_summary_count,
        validation_report
      )
      values ($1, $2, $3, now(), 'completed', 0, 0, 0, 0, $4::jsonb)
      on conflict (transform_run_id) do update set
        completed_at = now(),
        status = 'completed',
        accepted_fact_count = 0,
        upserted_offering_count = 0,
        upserted_timetable_event_count = 0,
        upserted_allotment_summary_count = 0,
        validation_report = excluded.validation_report
    `,
    [
      transformRunIdFor(ids),
      SOURCE_NAME,
      ids.dataVersion,
      JSON.stringify({
        candidate_fact_count: summary.factsExtracted,
        current_document_count: summary.reconciliation?.currentDocumentCount ?? summary.documentsExtracted,
        document_count: summary.documentsExtracted,
        extractor_version: EXTRACTOR_VERSION,
        linked_document_count: summary.linkedDocuments,
        reconciliation: summary.reconciliation ?? null,
        release_state: "held",
        review_state: "pending",
        serving_projection: "not_released",
        transform_version: TRANSFORM_VERSION
      })
    ]
  );
}

function runScrapy(ids) {
  const scrapyBin = process.env.DATA_INGEST_SCRAPY_BIN ?? "scrapy";
  const scrapyProjectDir = resolve(process.cwd(), "packages", "data-ingest");
  const pythonPath = resolve(scrapyProjectDir, "src_py");
  const startUrl = process.env.DATA_INGEST_SCRAPY_START_URL;
  const scrapyArgs = [
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
  ];
  if (startUrl) {
    scrapyArgs.splice(6, 0, "-a", `start_url=${startUrl}`);
  }
  mkdirSync(dirname(ids.reportPath), { recursive: true });
  mkdirSync(ids.jobDir, { recursive: true });
  return spawnSync(
    scrapyBin,
    scrapyArgs,
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

function readScrapyReport(reportPath) {
  if (!existsSync(reportPath)) {
    return {
      items: [],
      malformed: 0
    };
  }

  const lines = readFileSync(reportPath, "utf8")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0);
  const items = [];
  let malformed = 0;

  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch {
      malformed += 1;
    }
  }

  return {
    items,
    malformed
  };
}

function countsFromScrapyReport(report, persistence) {
  return {
    changed: persistence.changed,
    discovered: report.items.length + report.malformed,
    documents_persisted: persistence.documentsPersisted,
    errors: 0,
    facts_extracted: 0,
    fetched: persistence.documentsPersisted,
    unchanged: Math.max(report.items.length - persistence.changed, 0),
    warnings: persistence.warnings + report.malformed
  };
}

function normalizeScrapyDocument(item, index) {
  if (!isRecord(item)) {
    return null;
  }

  const canonicalUrl = nonEmptyString(item.canonical_url) ?? nonEmptyString(item.document_url);
  if (!canonicalUrl) {
    return null;
  }

  const sourceRecordId = nonEmptyString(item.source_record_id) ?? stableHash(canonicalUrl);
  const sourceSurface = SOURCE_SURFACES.includes(item.source_surface) ? item.source_surface : "title_search";
  const documentId = `hkex_doc_${stableHash(`${SOURCE_NAME}:${sourceRecordId}`).slice(0, 32)}`;
  const contentHash = nonEmptyString(item.content_hash_sha256) ?? stableHash(JSON.stringify(item));
  const rawSnapshotId = `raw_hkex_news_${stableHash(`${sourceRecordId}:${item.data_version ?? ""}`).slice(0, 32)}`;
  const rawPayload = {
    canonical_url: canonicalUrl,
    category: nonEmptyString(item.category),
    content_hash_sha256: contentHash,
    content_type: nonEmptyString(item.content_type) ?? "unknown",
    crawl_run_id: nonEmptyString(item.crawl_run_id),
    data_version: nonEmptyString(item.data_version),
    document_url: nonEmptyString(item.document_url),
    hkex_code: nonEmptyString(item.hkex_code),
    published_at: nonEmptyString(item.published_at),
    response_body_storage_uri: nonEmptyString(item.response_body_storage_uri),
    source_page_url: nonEmptyString(item.source_page_url),
    source_record_id: sourceRecordId,
    source_surface: sourceSurface,
    title_en: nonEmptyString(item.title_en),
    title_zh_hant: nonEmptyString(item.title_zh_hant)
  };
  const rawText = metadataTextForDocument(rawPayload);

  return {
    accessPolicy: accessPolicyForSurface(sourceSurface),
    canonicalUrl,
    contentHash,
    contentId: `hkc_${stableHash(`${documentId}:${contentHash}`).slice(0, 32)}`,
    contentType: rawPayload.content_type,
    documentId,
    documentUrl: nonEmptyString(item.document_url) ?? canonicalUrl,
    hkexCode: nonEmptyString(item.hkex_code),
    httpStatus: integerOrNull(item.http_status),
    observationId: `hko_${stableHash(`${documentId}:${item.crawl_run_id ?? ""}:${rawPayload.source_page_url ?? canonicalUrl}`).slice(0, 32)}`,
    payloadHash: stableHash(JSON.stringify(rawPayload)),
    publishedAt: isoTimestampOrNull(item.published_at),
    rawPayload,
    rawSnapshotId,
    rawText,
    resultRank: integerOrNull(item.result_rank) ?? index + 1,
    sanitizedText: sanitizeMetadataText(rawText),
    sourcePageUrl: nonEmptyString(item.source_page_url) ?? canonicalUrl,
    sourceRecordId,
    sourceSurface,
    storageUri: nonEmptyString(item.response_body_storage_uri),
    titleEn: nonEmptyString(item.title_en),
    titleZhHant: nonEmptyString(item.title_zh_hant)
  };
}

function accessPolicyForSurface(sourceSurface) {
  if (sourceSurface === "ap_phip") return "public_ap_phip_warning_gate";
  if (sourceSurface === "new_listing_information") return "public_new_listing";
  return "public_general";
}

function extractedFactsForDocument(ids, document, entityLink, extractionRunId) {
  const facts = [];
  const addFact = ({ confidence, field, lang = "unknown", value, valueType }) => {
    if (value === null || value === undefined || value === "") return;
    const factKey = `document.${field}`;
    const locator = {
      canonical_url: document.canonicalUrl,
      document_id: document.documentId,
      field,
      result_rank: document.resultRank,
      source_record_id: document.sourceRecordId,
      source_surface: document.sourceSurface
    };
    const locatorHash = stableHash(JSON.stringify(locator));
    facts.push({
      appCode: entityLink.appCode,
      confidence,
      currency: null,
      dataVersion: ids.dataVersion,
      documentId: document.documentId,
      extractedFactId: `hkef_${stableHash(`${document.documentId}:${factKey}:${locatorHash}:${ids.dataVersion}`).slice(0, 32)}`,
      extractionRunId,
      factKey,
      factNamespace: "hkex_news",
      lang,
      locator,
      locatorHash,
      offeringId: entityLink.offeringId,
      rawSnapshotId: document.rawSnapshotId,
      unit: null,
      valueBoolean: null,
      valueDate: null,
      valueJson: {
        extraction_source: EXTRACTOR_NAME,
        field,
        value
      },
      valueNumeric: null,
      valueText: valueType === "text" ? value : null,
      valueTimestamptz: valueType === "timestamp" ? value : null,
      valueType
    });
  };

  addFact({ confidence: 0.9, field: "source_record_id", value: document.sourceRecordId, valueType: "text" });
  addFact({ confidence: 0.82, field: "category", value: document.rawPayload.category, valueType: "text" });
  addFact({ confidence: 0.86, field: "title_en", lang: "en", value: document.titleEn, valueType: "text" });
  addFact({ confidence: 0.9, field: "hkex_code", value: document.hkexCode, valueType: "text" });
  addFact({ confidence: 0.88, field: "published_at", value: document.publishedAt, valueType: "timestamp" });
  addFact({ confidence: 0.95, field: "document_url", value: document.documentUrl, valueType: "text" });

  return facts;
}

function metadataTextForDocument(rawPayload) {
  return [
    ["source_record_id", rawPayload.source_record_id],
    ["category", rawPayload.category],
    ["title_en", rawPayload.title_en],
    ["hkex_code", rawPayload.hkex_code],
    ["published_at", rawPayload.published_at],
    ["document_url", rawPayload.document_url],
    ["canonical_url", rawPayload.canonical_url],
    ["content_type", rawPayload.content_type],
    ["source_surface", rawPayload.source_surface]
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function sanitizeMetadataText(value) {
  return nonEmptyString(value?.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/gu, " ")) ?? "";
}

function normalizeHkexCode(value) {
  const digits = nonEmptyString(value)?.replace(/\D/gu, "");
  if (!digits) return null;
  return digits.padStart(5, "0");
}

function classifyDocumentLinkType(document) {
  const categoryLinkType = linkTypeForCategory(document.rawPayload.category);
  if (categoryLinkType) return categoryLinkType;

  const title = `${document.titleEn ?? ""} ${document.documentUrl ?? ""}`.toLowerCase();
  if (title.includes("prospectus")) return "prospectus";
  if (title.includes("phip")) return "phip";
  if (/\ballotment\s+results?\b/u.test(title) || /\ballocation\s+results?\b/u.test(title)) {
    return "allotment_result";
  }
  if (title.includes("listing approval")) return "listing_approval";
  if (title.includes("progress report")) return "progress_report";
  return "announcement";
}

function linkTypeForCategory(category) {
  switch (category) {
    case "allotment_results":
      return "allotment_result";
    case "application_proof":
    case "phip":
      return "phip";
    case "formal_notice":
    case "offer_subscription":
    case "supplementary_listing_document":
      return "prospectus";
    case "oc_announcement":
    case "supplemental_ipo":
    case "transfer_gem_main":
      return "announcement";
    default:
      return null;
  }
}

function entityLinkConfidence({ appCode, offeringId }) {
  if (appCode && offeringId) return 0.84;
  if (offeringId) return 0.78;
  if (appCode) return 0.72;
  return null;
}

function entityLinkMatchedBy({ appCode, offeringId }) {
  if (appCode && offeringId) return "hkex_code:offering_application";
  if (offeringId) return "hkex_code:offering";
  if (appCode) return "hkex_code:application";
  return null;
}

function extractionRunIdFor(ids, document) {
  return `hker_${stableHash(`${ids.dataVersion}:${document.documentId}:${document.contentHash}:${EXTRACTOR_VERSION}`).slice(0, 32)}`;
}

function transformRunIdFor(ids) {
  return `hktr_${stableHash(`${ids.dataVersion}:${TRANSFORM_VERSION}`).slice(0, 32)}`;
}

function stableHash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function integerOrNull(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/u.test(value)) return Number(value);
  return null;
}

function isoTimestampOrNull(value) {
  const text = nonEmptyString(value);
  if (!text) return null;
  const timestamp = Date.parse(text);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function localContractDailyResult(resolvedDate, command = DAILY_COMMAND) {
  return {
    ...baseRunResult(resolvedDate, idsForBusinessDate(resolvedDate), "completed", command),
    counts: zeroCounts(),
    last_completed_stage: "validate"
  };
}

function validationResult(dataVersion, pass, metrics = {}, releaseState = "held") {
  return {
    data_version: dataVersion,
    metrics,
    release_state: releaseState,
    status: pass ? "completed" : "held_quality_failure",
    validation: {
      content_integrity: pass,
      extraction_quality: pass,
      governance: {
        default_data_rights_status: "default_deny",
        export_allowed: false,
        field_authorization_required: true,
        mcp_redistribution_allowed: false
      },
      schema_quality: pass
    },
    version: DATA_INGEST_VERSION
  };
}

function releaseResult({
  approvalId,
  dataVersion,
  mode,
  releasedAt,
  validationMetrics,
  writesDatabase
}) {
  return {
    approval_id_hash: `approval:${stableHash(approvalId).slice(0, 24)}`,
    automation_release_allowed: false,
    command: releaseCommand(dataVersion),
    data_version: dataVersion,
    governance: {
      default_data_rights_status: "default_deny",
      export_allowed: false,
      field_authorization_required: true,
      mcp_redistribution_allowed: false
    },
    mode,
    release_state: "released",
    release_state_after: "released",
    release_state_before: "held",
    released_at: releasedAt,
    status: "released",
    validation: {
      metrics: validationMetrics,
      passed: true
    },
    version: DATA_INGEST_VERSION,
    writes_database: writesDatabase
  };
}

function releaseCommand(dataVersion) {
  return [
    "data-ingest",
    "release",
    "--data-version",
    dataVersion,
    "--approval-id",
    "<redacted>",
    "--output",
    "json"
  ];
}

function baseRunResult(businessDate, ids, status, command = DAILY_COMMAND) {
  return {
    business_date: businessDate,
    command,
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
  const runtimeRoot = resolve(process.env.DATA_INGEST_RUNTIME_DIR ?? resolve(process.cwd(), "runtime"));
  return {
    dataVersion: `dv_hkex_news_${compactDate}`,
    jobDir: resolve(runtimeRoot, "scrapy-jobs", runId),
    reportPath: resolve(runtimeRoot, "reports", runId, "documents.jsonl"),
    requestFingerprint: `hkex-news-daily:${businessDate}:scope=ipo:v1`,
    runId,
    sourceBatchId: `rsb_hkex_news_${compactDate}`
  };
}

function businessDateFromRunId(runId) {
  const match = /^cr_hkex_news_(\d{4})(\d{2})(\d{2})$/u.exec(runId);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function businessDateFromDataVersion(dataVersion) {
  const match = /^dv_hkex_news_(\d{4})(\d{2})(\d{2})(?:_local_contract)?$/u.exec(dataVersion);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
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
