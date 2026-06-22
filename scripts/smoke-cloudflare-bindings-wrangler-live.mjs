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
const requiredEnv = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "AI_GATEWAY_NAME",
  "AI_GATEWAY_SMOKE_MODEL"
];
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
const durableObjectClassName = "AiphaBeeRunCoordinator";
const workflowClassName = "AiphaBeeResearchWorkflow";
const maintenanceCron = "*/30 * * * *";
const requiredResourceNames = [
  "worker",
  "workflow",
  "queue",
  "kv_namespace_title",
  "r2_bucket",
  "d1_database",
  "hyperdrive_config"
];
const runtimeSmokeHeaderValue = "cloudflare-bindings-runtime-v1";
const observabilityEventVersion = "2026-06-20.phase0.observability.v0";
const evalStoreSchemaVersion = "2026-06-20.phase0.eval-store.v0";
const evalV1Version = "2026-06-21.phase1.eval-v1-wvro-scaffold.v0";

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
        "d1_eval_write_read_delete",
        "worker_runtime_binding_smoke",
        "queue_publish_consume_smoke",
        "durable_object_state_smoke",
        "workflow_instance_execution",
        "cron_handler_smoke",
        "cron_natural_trigger_evidence",
        "hyperdrive_select_1_smoke",
        "ai_gateway_model_request_smoke"
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
  const table = "aiphabee_eval_store_smoke";
  const record = createEvalStoreSmokeRecord(smokeId);
  const recordJson = JSON.stringify(record);
  const sql = [
    `CREATE TABLE IF NOT EXISTS ${table} (` +
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
      ")",
    `INSERT OR REPLACE INTO ${table} (` +
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
      `) VALUES (${[
        record.event_id,
        record.schema_version,
        record.event_version,
        record.request_id,
        record.run_id,
        record.route,
        record.result,
        String(record.failed_check_count),
        record.wvro_eligible ? "1" : "0",
        recordJson
      ]
        .map(sqlLiteral)
        .join(", ")}, datetime('now'))`,
    `SELECT schema_version, result, record_json FROM ${table} WHERE event_id = ${sqlLiteral(record.event_id)}`,
    `DELETE FROM ${table} WHERE event_id = ${sqlLiteral(record.event_id)}`,
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
    const selected = rows.some((row) => {
      const parsedRecord =
        typeof row?.record_json === "string" ? safeParseJson(row.record_json) : undefined;

      return (
        row?.schema_version === record.schema_version &&
        row?.result === record.result &&
        isRecord(parsedRecord) &&
        parsedRecord.event_id === record.event_id &&
        parsedRecord.schema_version === record.schema_version
      );
    });

    if (!selected) {
      return failedResult({
        bindingName: "AIPHABEE_EVAL_STORE",
        detail: "d1 select did not return written eval-store record",
        failureCode: "d1_eval_store_select_mismatch",
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
      value_hash: hashString(recordJson)
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
  let hyperdriveLookupFailure;
  let secretFilePath;
  let secretDir;

  try {
    const kvNamespaceId = await resolveKvNamespaceId(resourceNames.kv_namespace_title);
    const d1DatabaseId = await resolveD1DatabaseId(resourceNames.d1_database);
    const hyperdriveConfigId = await resolveHyperdriveConfigId(
      resourceNames.hyperdrive_config
    ).catch((error) => {
      hyperdriveLookupFailure = failedResult({
        bindingName: "AIPHABEE_HYPERDRIVE",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "hyperdrive_config_lookup_failed",
        key: resourceNames.hyperdrive_config ?? "AIPHABEE_HYPERDRIVE",
        surface: "hyperdrive_select_1_smoke"
      });

      return "";
    });
    configPath = await writeWorkerRuntimeSmokeConfig({
      d1DatabaseId,
      hyperdriveConfigId,
      kvNamespaceId
    });
    ({ secretDir, secretFilePath } = await writeAiGatewayLiveSmokeSecretsFile());
    const naturalCronAfterIssuedAt = new Date().toISOString();
    const deployResult = await runWrangler([
      "deploy",
      "--config",
      configPath,
      "--secrets-file",
      secretFilePath
    ]);
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
        }),
        failedResult({
          bindingName: "AIPHABEE_RUN_COORDINATOR",
          detail: "worker runtime URL missing before durable object smoke",
          failureCode: "durable_object_worker_runtime_prerequisite_failed",
          key: durableObjectClassName,
          surface: "durable_object_state_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_RESEARCH_WORKFLOW",
          detail: "worker runtime URL missing before workflow smoke",
          failureCode: "workflow_worker_runtime_prerequisite_failed",
          key: workflowClassName,
          surface: "workflow_instance_execution"
        }),
        failedResult({
          bindingName: "AIPHABEE_MAINTENANCE_CRON",
          detail: "worker runtime URL missing before cron smoke",
          failureCode: "cron_worker_runtime_prerequisite_failed",
          key: maintenanceCron,
          surface: "cron_handler_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_MAINTENANCE_CRON",
          detail: "worker runtime URL missing before natural cron evidence smoke",
          failureCode: "cron_natural_worker_runtime_prerequisite_failed",
          key: maintenanceCron,
          surface: "cron_natural_trigger_evidence"
        }),
        failedResult({
          bindingName: "AIPHABEE_HYPERDRIVE",
          detail: "worker runtime URL missing before Hyperdrive smoke",
          failureCode: "hyperdrive_worker_runtime_prerequisite_failed",
          key: resourceNames.hyperdrive_config ?? "AIPHABEE_HYPERDRIVE",
          surface: "hyperdrive_select_1_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_AI_GATEWAY",
          detail: "worker runtime URL missing before AI Gateway smoke",
          failureCode: "ai_gateway_worker_runtime_prerequisite_failed",
          key: process.env.AI_GATEWAY_NAME ?? "",
          surface: "ai_gateway_model_request_smoke"
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
        }),
        failedResult({
          bindingName: "AIPHABEE_RUN_COORDINATOR",
          detail: "worker runtime binding smoke failed before durable object smoke",
          failureCode: "durable_object_worker_runtime_prerequisite_failed",
          key: durableObjectClassName,
          surface: "durable_object_state_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_RESEARCH_WORKFLOW",
          detail: "worker runtime binding smoke failed before workflow smoke",
          failureCode: "workflow_worker_runtime_prerequisite_failed",
          key: workflowClassName,
          surface: "workflow_instance_execution"
        }),
        failedResult({
          bindingName: "AIPHABEE_MAINTENANCE_CRON",
          detail: "worker runtime binding smoke failed before cron smoke",
          failureCode: "cron_worker_runtime_prerequisite_failed",
          key: maintenanceCron,
          surface: "cron_handler_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_MAINTENANCE_CRON",
          detail: "worker runtime binding smoke failed before natural cron evidence smoke",
          failureCode: "cron_natural_worker_runtime_prerequisite_failed",
          key: maintenanceCron,
          surface: "cron_natural_trigger_evidence"
        }),
        failedResult({
          bindingName: "AIPHABEE_HYPERDRIVE",
          detail: "worker runtime binding smoke failed before Hyperdrive smoke",
          failureCode: "hyperdrive_worker_runtime_prerequisite_failed",
          key: resourceNames.hyperdrive_config ?? "AIPHABEE_HYPERDRIVE",
          surface: "hyperdrive_select_1_smoke"
        }),
        failedResult({
          bindingName: "AIPHABEE_AI_GATEWAY",
          detail: "worker runtime binding smoke failed before AI Gateway smoke",
          failureCode: "ai_gateway_worker_runtime_prerequisite_failed",
          key: process.env.AI_GATEWAY_NAME ?? "",
          surface: "ai_gateway_model_request_smoke"
        })
      ];
    }

    return [
      workerRuntimeResult,
      await smokeQueuePublishConsume(workerUrl),
      await smokeDurableObjectState(workerUrl),
      await smokeWorkflowInstanceExecution(workerUrl),
      await smokeCronHandler(workerUrl),
      await smokeCronNaturalTriggerEvidence(workerUrl, naturalCronAfterIssuedAt),
      hyperdriveLookupFailure ?? (await smokeHyperdriveSelectOne(workerUrl)),
      await smokeAiGatewayModelRequest(workerUrl)
    ];
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
      }),
      failedResult({
        bindingName: "AIPHABEE_RUN_COORDINATOR",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "durable_object_worker_runtime_command_failed",
        key: durableObjectClassName,
        surface: "durable_object_state_smoke"
      }),
      failedResult({
        bindingName: "AIPHABEE_RESEARCH_WORKFLOW",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "workflow_worker_runtime_command_failed",
        key: workflowClassName,
        surface: "workflow_instance_execution"
      }),
      failedResult({
        bindingName: "AIPHABEE_MAINTENANCE_CRON",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "cron_worker_runtime_command_failed",
        key: maintenanceCron,
        surface: "cron_handler_smoke"
      }),
      failedResult({
        bindingName: "AIPHABEE_MAINTENANCE_CRON",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "cron_natural_worker_runtime_command_failed",
        key: maintenanceCron,
        surface: "cron_natural_trigger_evidence"
      }),
      failedResult({
        bindingName: "AIPHABEE_HYPERDRIVE",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "hyperdrive_worker_runtime_command_failed",
        key: resourceNames.hyperdrive_config ?? "AIPHABEE_HYPERDRIVE",
        surface: "hyperdrive_select_1_smoke"
      }),
      failedResult({
        bindingName: "AIPHABEE_AI_GATEWAY",
        detail: error instanceof Error ? error.message : String(error),
        failureCode: "ai_gateway_worker_runtime_command_failed",
        key: process.env.AI_GATEWAY_NAME ?? "",
        surface: "ai_gateway_model_request_smoke"
      })
    ];
  } finally {
    await runWrangler(
      ["queues", "consumer", "worker", "remove", resourceNames.queue, workerName],
      { allowFailure: true, input: "y\n" }
    );
    await runWrangler(["secret", "delete", "AI_GATEWAY_LIVE_SMOKE_TOKEN", "--name", workerName], {
      allowFailure: true,
      input: "y\n"
    });

    if (configPath) {
      await rm(configPath, { force: true });
    }

    if (secretFilePath) {
      await rm(secretFilePath, { force: true });
    }

    if (secretDir) {
      await rm(secretDir, { force: true, recursive: true });
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

async function smokeDurableObjectState(workerUrl) {
  const response = await fetch(`${workerUrl}/cloudflare/durable-objects/smoke`, {
    headers: {
      "x-aiphabee-smoke": runtimeSmokeHeaderValue,
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();

  if (response.status !== 200 || body?.status !== "ok") {
    return failedResult({
      bindingName: "AIPHABEE_RUN_COORDINATOR",
      detail: JSON.stringify({
        durable_object_result: body?.durable_object_result
          ? {
              failure_code: body.durable_object_result.failure_code,
              status: body.durable_object_result.status,
              surface: body.durable_object_result.surface
            }
          : undefined,
        http_status: response.status,
        missing_bindings: Array.isArray(body?.missing_bindings) ? body.missing_bindings : [],
        status: body?.status
      }),
      failureCode: "durable_object_state_route_failed",
      key: durableObjectClassName,
      surface: "durable_object_state_smoke"
    });
  }

  return {
    binding_name: "AIPHABEE_RUN_COORDINATOR",
    operation_count:
      typeof body.durable_object_result?.operation_count === "number"
        ? body.durable_object_result.operation_count
        : 3,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(body.durable_object_result ?? {})),
    status: "passed",
    surface: "durable_object_state_smoke"
  };
}

async function smokeWorkflowInstanceExecution(workerUrl) {
  const response = await fetch(`${workerUrl}/cloudflare/workflows/smoke`, {
    headers: {
      "x-aiphabee-smoke": runtimeSmokeHeaderValue,
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();

  if (response.status !== 200 || body?.status !== "ok") {
    return failedResult({
      bindingName: "AIPHABEE_RESEARCH_WORKFLOW",
      detail: JSON.stringify({
        http_status: response.status,
        missing_bindings: Array.isArray(body?.missing_bindings) ? body.missing_bindings : [],
        status: body?.status,
        workflow_result: body?.workflow_result
          ? {
              failure_code: body.workflow_result.failure_code,
              status: body.workflow_result.status,
              surface: body.workflow_result.surface
            }
          : undefined
      }),
      failureCode: "workflow_instance_execution_route_failed",
      key: workflowClassName,
      surface: "workflow_instance_execution"
    });
  }

  return {
    binding_name: "AIPHABEE_RESEARCH_WORKFLOW",
    operation_count:
      typeof body.workflow_result?.operation_count === "number"
        ? body.workflow_result.operation_count
        : 3,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(body.workflow_result ?? {})),
    status: "passed",
    surface: "workflow_instance_execution"
  };
}

async function smokeCronHandler(workerUrl) {
  const response = await fetch(`${workerUrl}/cloudflare/cron/smoke`, {
    headers: {
      "x-aiphabee-smoke": runtimeSmokeHeaderValue,
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();

  if (response.status !== 200 || body?.status !== "ok") {
    return failedResult({
      bindingName: "AIPHABEE_MAINTENANCE_CRON",
      detail: JSON.stringify({
        cron_result: body?.cron_result
          ? {
              failure_code: body.cron_result.failure_code,
              status: body.cron_result.status,
              surface: body.cron_result.surface
            }
          : undefined,
        http_status: response.status,
        missing_bindings: Array.isArray(body?.missing_bindings) ? body.missing_bindings : [],
        status: body?.status
      }),
      failureCode: "cron_handler_route_failed",
      key: maintenanceCron,
      surface: "cron_handler_smoke"
    });
  }

  return {
    binding_name: "AIPHABEE_MAINTENANCE_CRON",
    operation_count:
      typeof body.cron_result?.operation_count === "number" ? body.cron_result.operation_count : 3,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(body.cron_result ?? {})),
    status: "passed",
    surface: "cron_handler_smoke"
  };
}

async function smokeCronNaturalTriggerEvidence(workerUrl, afterIssuedAt) {
  const maxAttempts = parsePositiveInteger(process.env.CRON_NATURAL_SMOKE_MAX_ATTEMPTS, 3);
  const intervalMs = parsePositiveInteger(process.env.CRON_NATURAL_SMOKE_INTERVAL_MS, 10_000);
  let lastBody;
  let lastStatus = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(`${workerUrl}/cloudflare/cron/natural-evidence`, {
      body: JSON.stringify({
        after_issued_at: afterIssuedAt
      }),
      headers: {
        "content-type": "application/json",
        "x-aiphabee-smoke": runtimeSmokeHeaderValue,
        "x-request-id": `req-${smokeId}`
      },
      method: "POST"
    });
    const body = await response.json();
    lastBody = body;
    lastStatus = response.status;

    if (response.status === 200 && body?.status === "ok") {
      return {
        binding_name: "AIPHABEE_MAINTENANCE_CRON",
        operation_count:
          typeof body.cron_result?.operation_count === "number" ? body.cron_result.operation_count : 1,
        response_hash: hasValue(body.response_hash)
          ? body.response_hash
          : hashString(JSON.stringify(body.cron_result ?? {})),
        status: "passed",
        surface: "cron_natural_trigger_evidence"
      };
    }

    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  return failedResult({
    bindingName: "AIPHABEE_MAINTENANCE_CRON",
    detail: JSON.stringify({
      attempt_count: maxAttempts,
      cron_result: lastBody?.cron_result
        ? {
            failure_code: lastBody.cron_result.failure_code,
            status: lastBody.cron_result.status,
            surface: lastBody.cron_result.surface
          }
        : undefined,
      http_status: lastStatus,
      missing_bindings: Array.isArray(lastBody?.missing_bindings) ? lastBody.missing_bindings : [],
      status: lastBody?.status
    }),
    failureCode: "cron_natural_trigger_evidence_missing",
    key: maintenanceCron,
    surface: "cron_natural_trigger_evidence"
  });
}

async function smokeHyperdriveSelectOne(workerUrl) {
  const response = await fetch(`${workerUrl}/cloudflare/hyperdrive/smoke`, {
    headers: {
      "x-aiphabee-smoke": runtimeSmokeHeaderValue,
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();

  if (response.status !== 200 || body?.status !== "ok") {
    return failedResult({
      bindingName: "AIPHABEE_HYPERDRIVE",
      detail: JSON.stringify({
        http_status: response.status,
        hyperdrive_result: body?.hyperdrive_result
          ? {
              failure_code: body.hyperdrive_result.failure_code,
              status: body.hyperdrive_result.status,
              surface: body.hyperdrive_result.surface
            }
          : undefined,
        missing_bindings: Array.isArray(body?.missing_bindings) ? body.missing_bindings : [],
        status: body?.status
      }),
      failureCode: "hyperdrive_select_1_route_failed",
      key: resourceNames.hyperdrive_config ?? "AIPHABEE_HYPERDRIVE",
      surface: "hyperdrive_select_1_smoke"
    });
  }

  return {
    binding_name: "AIPHABEE_HYPERDRIVE",
    operation_count:
      typeof body.hyperdrive_result?.operation_count === "number"
        ? body.hyperdrive_result.operation_count
        : 2,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(body.hyperdrive_result ?? {})),
    status: "passed",
    surface: "hyperdrive_select_1_smoke"
  };
}

async function smokeAiGatewayModelRequest(workerUrl) {
  const response = await fetch(`${workerUrl}/agent/model-provider/live-smoke`, {
    headers: {
      "x-aiphabee-smoke": "model-provider-live-v1",
      "x-request-id": `req-${smokeId}`
    },
    method: "POST"
  });
  const body = await response.json();
  const modelProviderResult = body?.model_provider_result ?? {};

  if (
    response.status !== 200 ||
    body?.status !== "ok" ||
    modelProviderResult?.status !== "ok" ||
    modelProviderResult?.generate_text?.exact_output_match !== true ||
    modelProviderResult?.stream_text?.exact_output_match !== true
  ) {
    return failedResult({
      bindingName: "AIPHABEE_AI_GATEWAY",
      detail: JSON.stringify({
        generate_text_exact_output_match:
          modelProviderResult?.generate_text?.exact_output_match,
        http_status: response.status,
        model_provider_status: modelProviderResult?.status,
        status: body?.status,
        stream_text_exact_output_match: modelProviderResult?.stream_text?.exact_output_match
      }),
      failureCode: "ai_gateway_model_request_route_failed",
      key: process.env.AI_GATEWAY_NAME ?? "",
      surface: "ai_gateway_model_request_smoke"
    });
  }

  return {
    binding_name: "AIPHABEE_AI_GATEWAY",
    operation_count:
      typeof modelProviderResult.operation_count === "number"
        ? modelProviderResult.operation_count
        : 2,
    response_hash: hasValue(body.response_hash)
      ? body.response_hash
      : hashString(JSON.stringify(modelProviderResult)),
    status: "passed",
    surface: "ai_gateway_model_request_smoke"
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

async function resolveHyperdriveConfigId(configName) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID.trim();
  const url = new URL(
    `${contract.api_base_url}/accounts/${encodeURIComponent(accountId)}/hyperdrive/configs`
  );
  url.searchParams.set("per_page", "100");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN.trim()}`,
      "Content-Type": "application/json"
    },
    method: "GET"
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body?.success === false) {
    throw new Error(
      JSON.stringify({
        error_hash: hashString(JSON.stringify(body?.errors ?? [])),
        http_status: response.status
      })
    );
  }

  const configs = normalizeCloudflareItems(body?.result);
  const config = configs.find((item) => item?.name === configName);

  if (!config || !hasValue(config.id)) {
    throw new Error("hyperdrive config name was not found");
  }

  return config.id.trim();
}

async function writeWorkerRuntimeSmokeConfig({ d1DatabaseId, hyperdriveConfigId, kvNamespaceId }) {
  const configPath = join(process.cwd(), "apps/worker", `.wrangler-smoke-${smokeId}.json`);
  const config = {
    name: resourceNames.worker,
    main: "src/index.ts",
    compatibility_date: "2026-06-20",
    compatibility_flags: ["nodejs_compat"],
    observability: {
      enabled: true,
      traces: {
        enabled: true
      }
    },
    vars: {
      AI_GATEWAY_NAME: process.env.AI_GATEWAY_NAME.trim(),
      AI_GATEWAY_SMOKE_MODEL: process.env.AI_GATEWAY_SMOKE_MODEL.trim(),
      APP_ENV: "smoke",
      APP_VERSION: "runtime-binding-smoke",
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID.trim()
    },
    durable_objects: {
      bindings: [
        {
          name: "AIPHABEE_RUN_COORDINATOR",
          class_name: durableObjectClassName
        }
      ]
    },
    migrations: [
      {
        tag: "v1_aiphabee_run_coordinator",
        new_classes: [durableObjectClassName]
      }
    ],
    workflows: [
      {
        binding: "AIPHABEE_RESEARCH_WORKFLOW",
        name: resourceNames.workflow,
        class_name: workflowClassName,
        schedules: [maintenanceCron]
      }
    ],
    triggers: {
      crons: [maintenanceCron]
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
    ...(hasValue(hyperdriveConfigId)
      ? {
          hyperdrive: [
            {
              binding: "AIPHABEE_HYPERDRIVE",
              id: hyperdriveConfigId.trim()
            }
          ]
        }
      : {}),
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

async function writeAiGatewayLiveSmokeSecretsFile() {
  const secretDir = await mkdtemp(join(tmpdir(), "aiphabee-ai-gateway-smoke-"));
  const secretFilePath = join(secretDir, "secrets.json");

  await writeFile(
    secretFilePath,
    `${JSON.stringify({
      AI_GATEWAY_LIVE_SMOKE_TOKEN: process.env.CLOUDFLARE_API_TOKEN.trim()
    })}\n`
  );

  return { secretDir, secretFilePath };
}

function extractWorkersDevUrl(value) {
  const match = String(value).match(/https:\/\/[^\s]+\.workers\.dev/iu);

  return match?.[0];
}

function normalizeCloudflareItems(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  if (Array.isArray(value?.results)) {
    return value.results;
  }

  if (Array.isArray(value?.result)) {
    return value.result;
  }

  return [];
}

function createEvalStoreSmokeRecord(id) {
  const requestId = `req-${id}`;
  const runId = `run-${id}`;
  const eventId = `${requestId}:run.eval`;

  return {
    check_count: 3,
    checks: [
      {
        name: "registered_tool_allowlist",
        status: "pass"
      },
      {
        name: "model_call_blocked",
        status: "pass"
      },
      {
        name: "evidence_binding",
        status: "not_applicable"
      }
    ],
    emitted_at: new Date().toISOString(),
    environment: "cloudflare_smoke",
    event_id: eventId,
    event_version: observabilityEventVersion,
    evidence_binding: "not_applicable",
    eval_v1_version: evalV1Version,
    failed_check_count: 0,
    high_intent_actions: [],
    outcome: "success",
    quality_metrics: [
      "fact_accuracy",
      "calculation_accuracy",
      "citation_accuracy",
      "correct_refusal_rate"
    ].map((metricId) => ({
      metric_id: metricId,
      passed: 0,
      rate: null,
      source: "eval_set_v1",
      status: "planned",
      total: 0
    })),
    request_id: requestId,
    result: "pass",
    route: "/cloudflare/bindings/smoke",
    run_id: runId,
    schema_version: evalStoreSchemaVersion,
    service: "aiphabee-worker",
    wvro_eligible: false,
    wvro_week_start: "runtime_as_of_unresolved"
  };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
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
