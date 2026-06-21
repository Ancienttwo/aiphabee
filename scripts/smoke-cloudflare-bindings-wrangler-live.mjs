#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
const contract = readJson(contractPath);
const dryRun = process.argv.includes("--dry-run");
const requiredEnv = ["CLOUDFLARE_ACCOUNT_ID"];
const requiredForbiddenOutputFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "raw_response",
  "account_id",
  "resource_id",
  "env_value"
];
const forbiddenOutputFields = contract.forbidden_live_output_fields;
const smokePrefix = "aiphabee-smoke";
const smokeId = `smoke_${Date.now()}_${randomUUID().replace(/-/gu, "").slice(0, 12)}`;
const resourceNames = contract.partial_provisioning?.resource_names ?? {};
const requiredResourceNames = [
  "worker",
  "queue",
  "kv_namespace_title",
  "r2_bucket",
  "d1_database"
];
const runtimeSmokeHeaderValue = "cloudflare-bindings-runtime-v1";

for (const field of requiredForbiddenOutputFields) {
  if (!forbiddenOutputFields.includes(field)) {
    emit(
      {
        missing_forbidden_output_field: field,
        status: "invalid_contract"
      },
      1
    );
  }
}

if (dryRun) {
  emit(
    {
      forbidden_output_fields: forbiddenOutputFields,
      operations: [
        "kv_put_get_delete",
        "r2_put_get_delete",
        "d1_create_insert_select_delete_drop",
        "worker_runtime_binding_smoke",
        "queue_publish_consume_smoke"
      ],
      required_env: requiredEnv,
      required_resource_names: requiredResourceNames,
      status: "ready_no_network",
      synthetic_prefix: smokePrefix
    },
    0
  );
}

const missingEnv = requiredEnv.filter((name) => !hasValue(process.env[name]));
const missingResourceNames = requiredResourceNames.filter((name) => !hasValue(resourceNames[name]));

if (missingEnv.length > 0 || missingResourceNames.length > 0) {
  emit(
    {
      missing_env: missingEnv,
      missing_resource_names: missingResourceNames,
      required_env: requiredEnv,
      status: "missing_env"
    },
    2
  );
}

const results = [];

results.push(await smokeKv());
results.push(await smokeR2());
results.push(await smokeD1());
results.push(...await smokeWorkerRuntimeBindings());

const failed = results.filter((result) => result.status !== "passed");
emit(
  {
    functional_results: results,
    response_hash: hashString(JSON.stringify(results)),
    status: failed.length === 0 ? "ok" : "failed"
  },
  failed.length === 0 ? 0 : 1
);

async function smokeKv() {
  const key = `${smokePrefix}/kv/${smokeId}`;
  const value = JSON.stringify({ smoke_id: smokeId, surface: "kv", version: 1 });
  let namespaceId;

  try {
    namespaceId = await resolveKvNamespaceId(resourceNames.kv_namespace_title);
    await runWrangler([
      "kv",
      "key",
      "put",
      key,
      value,
      "--namespace-id",
      namespaceId,
      "--remote"
    ]);
    const readValue = await readKvWithRetry({ key, namespaceId });

    if (readValue !== value) {
      return failedResult({
        bindingName: "AIPHABEE_CONFIG",
        detail: "kv read value did not match written value",
        failureCode: "kv_read_mismatch",
        key,
        surface: "kv_put_get_delete"
      });
    }

    return {
      binding_name: "AIPHABEE_CONFIG",
      key_hash: hashString(key),
      operation_count: 3,
      status: "passed",
      surface: "kv_put_get_delete",
      value_hash: hashString(value)
    };
  } catch (error) {
    return failedResult({
      bindingName: "AIPHABEE_CONFIG",
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "kv_command_failed",
      key,
      surface: "kv_put_get_delete"
    });
  } finally {
    if (namespaceId) {
      await runWrangler(
        [
          "kv",
          "key",
          "delete",
          key,
          "--namespace-id",
          namespaceId,
          "--remote"
        ],
        { allowFailure: true, input: "y\n" }
      );
    }
  }
}

async function readKvWithRetry({ key, namespaceId }) {
  let lastValue = "";

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const getResult = await runWrangler([
      "kv",
      "key",
      "get",
      key,
      "--namespace-id",
      namespaceId,
      "--remote",
      "--text"
    ]);
    lastValue = getResult.stdout.trim();

    if (lastValue.length > 0) {
      return lastValue;
    }

    await sleep(1000 * attempt);
  }

  return lastValue;
}

async function smokeR2() {
  const objectKey = `${smokePrefix}/r2/${smokeId}.json`;
  const objectPath = `${resourceNames.r2_bucket}/${objectKey}`;
  const value = JSON.stringify({ smoke_id: smokeId, surface: "r2", version: 1 });
  const dir = await mkdtemp(join(tmpdir(), "aiphabee-r2-smoke-"));
  const putPath = join(dir, "put.json");
  const getPath = join(dir, "get.json");

  try {
    await writeFile(putPath, value);
    await runWrangler([
      "r2",
      "object",
      "put",
      objectPath,
      "--file",
      putPath,
      "--remote",
      "--force"
    ]);
    await runWrangler(["r2", "object", "get", objectPath, "--file", getPath, "--remote"]);
    const readValue = await readFile(getPath, "utf8");

    if (readValue !== value) {
      return failedResult({
        bindingName: "AIPHABEE_ARTIFACTS",
        detail: "r2 read value did not match written value",
        failureCode: "r2_read_mismatch",
        key: objectKey,
        surface: "r2_put_get_delete"
      });
    }

    return {
      binding_name: "AIPHABEE_ARTIFACTS",
      object_key_hash: hashString(objectKey),
      operation_count: 3,
      status: "passed",
      surface: "r2_put_get_delete",
      value_hash: hashString(value)
    };
  } catch (error) {
    return failedResult({
      bindingName: "AIPHABEE_ARTIFACTS",
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "r2_command_failed",
      key: objectKey,
      surface: "r2_put_get_delete"
    });
  } finally {
    await runWrangler(["r2", "object", "delete", objectPath, "--remote"], {
      allowFailure: true
    });
    await rm(dir, { force: true, recursive: true });
  }
}

async function smokeD1() {
  const table = "aiphabee_smoke_live";
  const value = `d1-${smokeId}`;
  const sql = [
    `CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, value TEXT, created_at TEXT)`,
    `INSERT OR REPLACE INTO ${table} (id, value, created_at) VALUES ('${smokeId}', '${value}', datetime('now'))`,
    `SELECT value FROM ${table} WHERE id = '${smokeId}'`,
    `DELETE FROM ${table} WHERE id = '${smokeId}'`,
    `DROP TABLE IF EXISTS ${table}`
  ].join("; ");

  try {
    const result = await runWrangler([
      "d1",
      "execute",
      resourceNames.d1_database,
      "--remote",
      "--json",
      "--command",
      sql
    ]);
    const parsed = JSON.parse(result.stdout);
    const rows = Array.isArray(parsed) ? parsed.flatMap((item) => item.results ?? []) : [];
    const selected = rows.some((row) => row?.value === value);

    if (!selected) {
      return failedResult({
        bindingName: "AIPHABEE_EVAL_STORE",
        detail: "d1 select did not return written value",
        failureCode: "d1_select_mismatch",
        key: table,
        surface: "d1_eval_write_read_delete"
      });
    }

    return {
      binding_name: "AIPHABEE_EVAL_STORE",
      operation_count: 5,
      status: "passed",
      surface: "d1_eval_write_read_delete",
      table_hash: hashString(table),
      value_hash: hashString(value)
    };
  } catch (error) {
    await runWrangler(
      [
        "d1",
        "execute",
        resourceNames.d1_database,
        "--remote",
        "--json",
        "--command",
        `DROP TABLE IF EXISTS ${table}`
      ],
      { allowFailure: true }
    );
    return failedResult({
      bindingName: "AIPHABEE_EVAL_STORE",
      detail: error instanceof Error ? error.message : String(error),
      failureCode: "d1_command_failed",
      key: table,
      surface: "d1_eval_write_read_delete"
    });
  }
}

async function smokeWorkerRuntimeBindings() {
  const workerName = resourceNames.worker;
  let configPath;

  try {
    const kvNamespaceId = await resolveKvNamespaceId(resourceNames.kv_namespace_title);
    const d1DatabaseId = await resolveD1DatabaseId(resourceNames.d1_database);
    configPath = await writeWorkerRuntimeSmokeConfig({
      d1DatabaseId,
      kvNamespaceId
    });
    const deployResult = await runWrangler(["deploy", "--config", configPath]);
    const workerUrl = extractWorkersDevUrl(deployResult.stdout);

    if (!hasValue(workerUrl)) {
      return [
        failedResult({
          bindingName: "aiphabee-worker",
          detail: "wrangler deploy output did not include a workers.dev route",
          failureCode: "worker_runtime_url_missing",
          key: workerName,
          surface: "worker_runtime_binding_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_EVENTS_QUEUE",
          detail: "worker runtime URL missing before queue smoke",
          failureCode: "queue_worker_runtime_prerequisite_failed",
          key: resourceNames.queue,
          surface: "queue_publish_consume_smoke"
        })
      ];
    }

    const workerRuntimeResult = await smokeWorkerRuntimeRoute(workerUrl);

    if (workerRuntimeResult.status !== "passed") {
      return [
        workerRuntimeResult,
        failedResult({
          bindingName: "AIPHABEE_EVENTS_QUEUE",
          detail: "worker runtime binding smoke failed before queue smoke",
          failureCode: "queue_worker_runtime_prerequisite_failed",
          key: resourceNames.queue,
          surface: "queue_publish_consume_smoke"
        })
      ];
    }

    return [workerRuntimeResult, await smokeQueuePublishConsume(workerUrl)];
  } catch (error) {
    return [
      failedResult({
        bindingName: "aiphabee-worker",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "worker_runtime_command_failed",
        key: workerName,
        surface: "worker_runtime_binding_smoke"
      }),
      failedResult({
        bindingName: "AIPHABEE_EVENTS_QUEUE",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "queue_worker_runtime_command_failed",
        key: resourceNames.queue,
        surface: "queue_publish_consume_smoke"
      })
    ];
  } finally {
    await runWrangler(
      ["queues", "consumer", "worker", "remove", resourceNames.queue, workerName],
      { allowFailure: true, input: "y\n" }
    );

    if (configPath) {
      await rm(configPath, { force: true });
    }
  }
}

async function smokeWorkerRuntimeRoute(workerUrl) {
  const response = await fetch(`${workerUrl}/cloudflare/bindings/smoke`, {
    headers: {
      "x-aiphabee-smoke": runtimeSmokeHeaderValue,
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();

  if (response.status !== 200 || body?.status !== "ok") {
    return failedResult({
      bindingName: "aiphabee-worker",
      detail: JSON.stringify({
        http_status: response.status,
        missing_bindings: Array.isArray(body?.missing_bindings)
          ? body.missing_bindings
          : [],
        runtime_results: Array.isArray(body?.runtime_results)
          ? body.runtime_results.map((result) => ({
              binding_name: result?.binding_name,
              failure_code: result?.failure_code,
              status: result?.status,
              surface: result?.surface
            }))
          : [],
        status: body?.status
      }),
      failureCode: "worker_runtime_route_failed",
      key: resourceNames.worker,
      surface: "worker_runtime_binding_smoke"
    });
  }

  return {
    binding_name: "aiphabee-worker",
    operation_count: Array.isArray(body.runtime_results)
      ? body.runtime_results.reduce(
          (count, result) =>
            count + (typeof result?.operation_count === "number" ? result.operation_count : 0),
          1
        )
      : 1,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(body.runtime_results ?? [])),
    status: "passed",
    surface: "worker_runtime_binding_smoke"
  };
}

async function smokeQueuePublishConsume(workerUrl) {
  const response = await fetch(`${workerUrl}/cloudflare/queues/smoke`, {
    headers: {
      "x-aiphabee-smoke": runtimeSmokeHeaderValue,
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();

  if (response.status !== 200 || body?.status !== "ok") {
    return failedResult({
      bindingName: "AIPHABEE_EVENTS_QUEUE",
      detail: JSON.stringify({
        http_status: response.status,
        missing_bindings: Array.isArray(body?.missing_bindings) ? body.missing_bindings : [],
        queue_result: body?.queue_result
          ? {
              failure_code: body.queue_result.failure_code,
              status: body.queue_result.status,
              surface: body.queue_result.surface
            }
          : undefined,
        status: body?.status
      }),
      failureCode: "queue_publish_consume_route_failed",
      key: resourceNames.queue,
      surface: "queue_publish_consume_smoke"
    });
  }

  return {
    binding_name: "AIPHABEE_EVENTS_QUEUE",
    operation_count:
      typeof body.queue_result?.operation_count === "number"
        ? body.queue_result.operation_count
        : 3,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(body.queue_result ?? {})),
    status: "passed",
    surface: "queue_publish_consume_smoke"
  };
}

async function resolveKvNamespaceId(title) {
  const result = await runWrangler(["kv", "namespace", "list"]);
  const namespaces = JSON.parse(result.stdout);

  if (!Array.isArray(namespaces)) {
    throw new Error("kv namespace list did not return an array");
  }

  const namespace = namespaces.find((item) => item?.title === title);

  if (!namespace || !hasValue(namespace.id)) {
    throw new Error("kv namespace title was not found");
  }

  return namespace.id.trim();
}

async function resolveD1DatabaseId(databaseName) {
  const result = await runWrangler(["d1", "list", "--json"]);
  const databases = JSON.parse(result.stdout);

  if (!Array.isArray(databases)) {
    throw new Error("d1 list did not return an array");
  }

  const database = databases.find((item) => item?.name === databaseName);
  const databaseId = database?.uuid ?? database?.database_id ?? database?.id;

  if (!database || !hasValue(databaseId)) {
    throw new Error("d1 database name was not found");
  }

  return databaseId.trim();
}

async function writeWorkerRuntimeSmokeConfig({ d1DatabaseId, kvNamespaceId }) {
  const configPath = join(process.cwd(), "apps/worker", `.wrangler-smoke-${smokeId}.json`);
  const config = {
    name: resourceNames.worker,
    main: "src/index.ts",
    compatibility_date: "2026-06-20",
    observability: {
      enabled: true,
      traces: {
        enabled: true
      }
    },
    vars: {
      APP_ENV: "smoke",
      APP_VERSION: "runtime-binding-smoke"
    },
    kv_namespaces: [
      {
        binding: "AIPHABEE_CONFIG",
        id: kvNamespaceId
      }
    ],
    r2_buckets: [
      {
        binding: "AIPHABEE_ARTIFACTS",
        bucket_name: resourceNames.r2_bucket
      }
    ],
    d1_databases: [
      {
        binding: "AIPHABEE_EVAL_STORE",
        database_name: resourceNames.d1_database,
        database_id: d1DatabaseId
      }
    ],
    queues: {
      consumers: [
        {
          queue: resourceNames.queue,
          max_batch_size: 1,
          max_batch_timeout: 1,
          max_retries: 1
        }
      ],
      producers: [
        {
          binding: "AIPHABEE_EVENTS_QUEUE",
          queue: resourceNames.queue
        }
      ]
    }
  };

  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

  return configPath;
}

function extractWorkersDevUrl(value) {
  const match = String(value).match(/https:\/\/[^\s]+\.workers\.dev/iu);

  return match?.[0];
}

async function runWrangler(args, options = {}) {
  const { allowFailure = false, input } = options;

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("npx", ["wrangler", ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", rejectPromise);
    child.on("close", (exitCode) => {
      const result = {
        exitCode,
        stderr,
        stdout
      };

      if (exitCode === 0 || allowFailure) {
        resolvePromise(result);
        return;
      }

      rejectPromise(
        new Error(
          JSON.stringify({
            args_hash: hashString(args.join(" ")),
            exit_code: exitCode,
            stderr_hash: hashString(sanitizeText(result.stderr)),
            stdout_hash: hashString(sanitizeText(result.stdout))
          })
        )
      );
    });

    if (input) {
      child.stdin.write(input);
    }

    child.stdin.end();
  });
}

function failedResult({ bindingName, detail, failureCode, key, surface }) {
  return {
    binding_name: bindingName,
    detail_hash: hashString(sanitizeText(detail)),
    failure_code: failureCode,
    key_hash: hashString(key),
    status: "failed",
    surface
  };
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function sanitizeText(value) {
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/gu, "sk-[REDACTED]")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/gu, "gh[REDACTED]")
    .replace(/\b[a-f0-9]{32}\b/giu, "[REDACTED_ID]")
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/giu,
      "[REDACTED_UUID]"
    );
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), relativePath), "utf8"));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path: relativePath,
        status: "invalid_json"
      },
      1
    );
  }
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function emit(payload, exitCode) {
  const serialized = JSON.stringify(payload);

  for (const forbiddenField of forbiddenOutputFields) {
    if (Object.prototype.hasOwnProperty.call(payload, forbiddenField)) {
      payload = {
        forbidden_output_field: forbiddenField,
        status: "invalid_output"
      };
      break;
    }
  }

  if (/\b[a-f0-9]{32}\b/iu.test(serialized)) {
    payload = {
      forbidden_output_pattern: "resource_id",
      status: "invalid_output"
    };
  }

  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
