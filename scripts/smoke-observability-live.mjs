#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  getLiveSmokeEnvValue,
  getMissingLiveSmokeEnv
} from "./lib/live-smoke-defaults.mjs";

const dryRun = process.argv.includes("--dry-run");
const commandTimeoutMs = parsePositiveInteger(process.env.OBSERVABILITY_LIVE_SMOKE_TIMEOUT_MS, 120_000);
const requiredEnv = [
  "OTLP_EXPORTER_OTLP_ENDPOINT",
  "OTLP_EXPORTER_OTLP_HEADERS",
  "CLOUDFLARE_D1_DATABASE_NAME"
];
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
const smokeId = randomUUID();
const tableName = "aiphabee_eval_store_live_smoke";
const observabilityEventVersion = "2026-06-20.phase0.observability.v0";
const evalStoreSchemaVersion = "2026-06-20.phase0.eval-store.v0";

if (dryRun) {
  emit(
    {
      forbidden_output_fields: [
        "authorization",
        "api_key",
        "token",
        "secret",
        "password",
        "otlp_headers",
        "raw_response",
        "raw_output",
        "record_json"
      ],
      operations: ["otlp_http_log_export", "eval_store_record_write_read_delete"],
      required_env: requiredEnv,
      status: "ready_no_network",
      synthetic_table: tableName
    },
    0
  );
}

const missingEnv = getMissingLiveSmokeEnv(requiredEnv);

if (missingEnv.length > 0) {
  emit(
    {
      missing_env: missingEnv,
      status: "missing_env"
    },
    2
  );
}

const endpoint = requiredEnvValue("OTLP_EXPORTER_OTLP_ENDPOINT");
const headers = parseOtlpHeaders(requiredEnvValue("OTLP_EXPORTER_OTLP_HEADERS"));
const databaseName = getLiveSmokeEnvValue("CLOUDFLARE_D1_DATABASE_NAME");
const results = [await smokeOtlp(endpoint, headers), await smokeEvalStore(databaseName)];
const failedResults = results.filter((result) => result.status !== "passed");

emit(
  {
    operation_count: results.reduce((total, result) => total + result.operation_count, 0),
    results,
    status: failedResults.length === 0 ? "ok" : "failed"
  },
  failedResults.length === 0 ? 0 : 1
);

async function smokeOtlp(endpoint, headers) {
  const payload = createOtlpLogPayload();

  try {
    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      headers: {
        ...headers,
        "content-type": "application/json"
      },
      method: "POST"
    });
    const responseText = await response.text();

    if (!response.ok) {
      return {
        endpoint_hash: hashString(endpoint),
        failure_code: "otlp_export_failed",
        http_status: response.status,
        operation_count: 1,
        response_hash: hashString(responseText),
        status: "failed",
        surface: "otlp_http_log_export"
      };
    }

    return {
      endpoint_hash: hashString(endpoint),
      http_status: response.status,
      operation_count: 1,
      response_hash: hashString(responseText),
      status: "passed",
      surface: "otlp_http_log_export"
    };
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message : String(error),
      endpoint_hash: hashString(endpoint),
      failure_code: "otlp_export_command_failed",
      operation_count: 1,
      status: "failed",
      surface: "otlp_http_log_export"
    };
  }
}

async function smokeEvalStore(databaseName) {
  const record = createEvalStoreSmokeRecord();
  const recordJson = JSON.stringify(record);
  let operationCount = 0;

  try {
    await executeD1(databaseName, createTableSql());
    operationCount += 1;
    await executeD1(databaseName, insertRecordSql(record, recordJson));
    operationCount += 1;

    const selected = await executeD1(
      databaseName,
      `SELECT schema_version, result, record_json FROM ${tableName} WHERE event_id = ${sqlString(record.event_id)}`
    );
    operationCount += 1;
    const row = extractFirstD1Row(selected.stdout);

    if (
      row?.schema_version !== evalStoreSchemaVersion ||
      row.result !== record.result ||
      row.record_json !== recordJson
    ) {
      throw new Error("D1 selected eval-store record did not match inserted payload");
    }

    await executeD1(databaseName, `DELETE FROM ${tableName} WHERE event_id = ${sqlString(record.event_id)}`);
    operationCount += 1;
    await executeD1(databaseName, `DROP TABLE IF EXISTS ${tableName}`);
    operationCount += 1;

    return {
      database_name_hash: hashString(databaseName),
      operation_count: operationCount,
      raw_output_hash: hashString(`${databaseName}:${record.event_id}:${operationCount}`),
      record_hash: hashString(recordJson),
      status: "passed",
      surface: "eval_store_record_write_read_delete",
      table_hash: hashString(tableName)
    };
  } catch (error) {
    await executeD1(databaseName, `DROP TABLE IF EXISTS ${tableName}`).catch(() => undefined);

    return {
      database_name_hash: hashString(databaseName),
      detail: error instanceof Error ? error.message : String(error),
      failure_code: "eval_store_live_smoke_failed",
      operation_count: operationCount,
      record_hash: hashString(recordJson),
      status: "failed",
      surface: "eval_store_record_write_read_delete",
      table_hash: hashString(tableName)
    };
  }
}

async function executeD1(databaseName, sql) {
  const result = await runCommand(npxBin, [
    "wrangler",
    "d1",
    "execute",
    databaseName,
    "--remote",
    "--yes",
    "--json",
    "--command",
    sql
  ]);

  if (result.exitCode !== 0) {
    throw new Error(`wrangler d1 execute failed: exit=${result.exitCode} stdout=${result.stdoutHash} stderr=${result.stderrHash}`);
  }

  return result;
}

function createTableSql() {
  return (
    `CREATE TABLE IF NOT EXISTS ${tableName} (` +
    [
      "event_id TEXT PRIMARY KEY",
      "schema_version TEXT NOT NULL",
      "event_version TEXT NOT NULL",
      "request_id TEXT NOT NULL",
      "run_id TEXT NOT NULL",
      "route TEXT NOT NULL",
      "result TEXT NOT NULL",
      "failed_check_count INTEGER NOT NULL",
      "wvro_eligible INTEGER NOT NULL",
      "record_json TEXT NOT NULL",
      "created_at TEXT NOT NULL"
    ].join(", ") +
    ")"
  );
}

function insertRecordSql(record, recordJson) {
  return (
    `INSERT OR REPLACE INTO ${tableName} (` +
    [
      "event_id",
      "schema_version",
      "event_version",
      "request_id",
      "run_id",
      "route",
      "result",
      "failed_check_count",
      "wvro_eligible",
      "record_json",
      "created_at"
    ].join(", ") +
    ") VALUES (" +
    [
      sqlString(record.event_id),
      sqlString(record.schema_version),
      sqlString(record.event_version),
      sqlString(record.request_id),
      sqlString(record.run_id),
      sqlString(record.route),
      sqlString(record.result),
      String(record.failed_check_count),
      record.wvro_eligible ? "1" : "0",
      sqlString(recordJson),
      "datetime('now')"
    ].join(", ") +
    ")"
  );
}

function createEvalStoreSmokeRecord() {
  const now = new Date().toISOString();

  return {
    check_count: 3,
    checks: [
      {
        name: "otlp_destination_configured",
        status: "pass"
      },
      {
        name: "eval_store_write_read_delete",
        status: "pass"
      },
      {
        name: "no_prompt_or_secret_payload",
        status: "pass"
      }
    ],
    emitted_at: now,
    environment: "live_smoke",
    event_id: `evt-${smokeId}`,
    event_version: observabilityEventVersion,
    evidence_binding: "not_applicable",
    eval_v1_version: "2026-06-21.phase1.eval-v1-wvro-scaffold.v0",
    failed_check_count: 0,
    high_intent_actions: [],
    outcome: "success",
    quality_metrics: [],
    request_id: `req-${smokeId}`,
    result: "pass",
    route: "scripts/smoke-observability-live.mjs",
    run_id: `run-${smokeId}`,
    schema_version: evalStoreSchemaVersion,
    service: "aiphabee-worker",
    wvro_eligible: false,
    wvro_week_start: now.slice(0, 10)
  };
}

function createOtlpLogPayload() {
  const nowUnixNano = `${Date.now()}000000`;

  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            {
              key: "service.name",
              value: {
                stringValue: "aiphabee-worker"
              }
            },
            {
              key: "deployment.environment",
              value: {
                stringValue: "live_smoke"
              }
            }
          ]
        },
        scopeLogs: [
          {
            logRecords: [
              {
                attributes: [
                  {
                    key: "request_id",
                    value: {
                      stringValue: `req-${smokeId}`
                    }
                  },
                  {
                    key: "surface",
                    value: {
                      stringValue: "otlp_http_log_export"
                    }
                  }
                ],
                body: {
                  stringValue: "aiphabee observability live smoke"
                },
                severityText: "INFO",
                timeUnixNano: nowUnixNano
              }
            ],
            scope: {
              name: "aiphabee.observability.live-smoke",
              version: "2026-06-22"
            }
          }
        ]
      }
    ]
  };
}

function parseOtlpHeaders(value) {
  const headers = {};

  for (const pair of value.split(",")) {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const headerValue = pair.slice(separatorIndex + 1).trim();

    if (key.length > 0 && headerValue.length > 0) {
      headers[key] = headerValue;
    }
  }

  return headers;
}

function extractFirstD1Row(output) {
  const parsed = JSON.parse(output);
  const result = Array.isArray(parsed) ? parsed[0] : parsed;
  const rows = result?.results ?? result?.result?.[0]?.results ?? result?.rows;

  if (Array.isArray(rows)) {
    return rows[0];
  }

  return undefined;
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`command timed out after ${commandTimeoutMs}ms`));
    }, commandTimeoutMs);

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8");
      resolve({
        exitCode: code ?? 1,
        raw_output_hash: hashString(stdoutText),
        stderrHash: hashString(stderrText),
        stdout: stdoutText,
        stdoutHash: hashString(stdoutText)
      });
    });
  });
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function requiredEnvValue(name) {
  const value = process.env[name];

  if (!hasValue(value)) {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
