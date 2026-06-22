#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getLiveSmokeEnvValue,
  getMissingLiveSmokeEnv
} from "./lib/live-smoke-defaults.mjs";

const contractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
const contract = readJson(contractPath);
const dryRun = process.argv.includes("--dry-run");
const requiredEnv = contract.required_env;
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
      api_base_url: contract.api_base_url,
      forbidden_output_fields: forbiddenOutputFields,
      read_only_endpoints: contract.read_only_endpoints,
      required_env: requiredEnv,
      status: "ready_no_network"
    },
    0
  );
}

const missingEnv = getMissingLiveSmokeEnv(requiredEnv);

if (missingEnv.length > 0) {
  emit(
    {
      missing_env: missingEnv,
      required_env: requiredEnv,
      status: "missing_env"
    },
    2
  );
}

const accountId = getLiveSmokeEnvValue("CLOUDFLARE_ACCOUNT_ID");
const apiToken = getLiveSmokeEnvValue("CLOUDFLARE_API_TOKEN");
const resourceResults = [];

await checkListResource({
  bindingName: "aiphabee-worker",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/workers/scripts`,
  envName: "CLOUDFLARE_WORKER_NAME",
  fields: ["id", "name", "script_name"],
  type: "worker"
});

await checkWorkflow({
  bindingName: "AIPHABEE_RESEARCH_WORKFLOW",
  envName: "CLOUDFLARE_WORKFLOW_NAME",
  type: "workflow"
});

await checkListResource({
  bindingName: "AIPHABEE_EVENTS_QUEUE",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/queues`,
  envName: "QUEUE_NAME",
  fields: ["queue_name", "name", "id"],
  type: "queue"
});

await checkCron({
  bindingName: "AIPHABEE_MAINTENANCE_CRON",
  envName: "CLOUDFLARE_WORKER_NAME",
  type: "cron"
});

await checkListResource({
  bindingName: "AIPHABEE_RUN_COORDINATOR",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/workers/durable_objects/namespaces`,
  envName: "CLOUDFLARE_DURABLE_OBJECT_NAMESPACE_NAME",
  fields: ["name", "class_name", "script_name", "id"],
  type: "durable_object"
});

await checkListResource({
  bindingName: "AIPHABEE_ARTIFACTS",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/r2/buckets`,
  envName: "R2_BUCKET_NAME",
  fields: ["name", "bucket_name"],
  type: "r2"
});

await checkListResource({
  bindingName: "AIPHABEE_CONFIG",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces`,
  envName: "KV_NAMESPACE_ID",
  fields: ["id", "title"],
  type: "kv"
});

await checkListResource({
  bindingName: "AIPHABEE_EVAL_STORE",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/d1/database`,
  envName: "CLOUDFLARE_D1_DATABASE_NAME",
  fields: ["name"],
  type: "d1"
});

await checkListResource({
  bindingName: "AIPHABEE_AI_GATEWAY",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/ai-gateway/gateways`,
  envName: "AI_GATEWAY_NAME",
  fields: ["name", "id", "slug"],
  type: "ai_gateway"
});

await checkListResource({
  bindingName: "AIPHABEE_HYPERDRIVE",
  endpoint: `/accounts/${encodeURIComponent(accountId)}/hyperdrive/configs`,
  envName: "CLOUDFLARE_HYPERDRIVE_CONFIG_NAME",
  fields: ["name", "id"],
  type: "hyperdrive"
});

const missingResources = resourceResults
  .filter((result) => result.status === "missing")
  .map((result) => result.binding_name);
const permissionErrors = resourceResults
  .filter((result) => result.status === "api_error")
  .map((result) => ({
    binding_name: result.binding_name,
    http_status: result.http_status,
    type: result.type
  }));
const output = {
  missing_resources: missingResources,
  permission_errors: permissionErrors,
  resource_results: resourceResults,
  response_hash: hashString(JSON.stringify(resourceResults)),
  status: missingResources.length === 0 && permissionErrors.length === 0 ? "ok" : "failed"
};

emit(output, output.status === "ok" ? 0 : 1);

async function checkListResource({ bindingName, endpoint, envName, fields, type }) {
  const expected = getLiveSmokeEnvValue(envName);
  const response = await cloudflareGet(endpoint, { per_page: "100" });

  if (!response.ok) {
    resourceResults.push(toApiError({ bindingName, response, type }));
    return;
  }

  const items = normalizeItems(response.body?.result);
  const found = items.some((item) => fields.some((field) => item[field] === expected));

  resourceResults.push({
    binding_name: bindingName,
    checked_count: items.length,
    expected_ref_hash: hashString(expected),
    http_status: response.status,
    match_fields: fields,
    status: found ? "found" : "missing",
    type
  });
}

async function checkWorkflow({ bindingName, envName, type }) {
  const workflowName = getLiveSmokeEnvValue(envName);
  const response = await cloudflareGet(
    `/accounts/${encodeURIComponent(accountId)}/workflows/${encodeURIComponent(workflowName)}`
  );

  if (!response.ok) {
    resourceResults.push(
      response.status === 404
        ? {
            binding_name: bindingName,
            expected_ref_hash: hashString(workflowName),
            http_status: response.status,
            status: "missing",
            type
          }
        : toApiError({ bindingName, response, type })
    );
    return;
  }

  resourceResults.push({
    binding_name: bindingName,
    expected_ref_hash: hashString(workflowName),
    http_status: response.status,
    status: "found",
    type
  });
}

async function checkCron({ bindingName, envName, type }) {
  const scriptName = getLiveSmokeEnvValue(envName);
  const response = await cloudflareGet(
    `/accounts/${encodeURIComponent(accountId)}/workers/scripts/${encodeURIComponent(
      scriptName
    )}/schedules`
  );

  if (!response.ok) {
    resourceResults.push(toApiError({ bindingName, response, type }));
    return;
  }

  const schedules = normalizeItems(response.body?.result);

  resourceResults.push({
    binding_name: bindingName,
    checked_count: schedules.length,
    expected_ref_hash: hashString(scriptName),
    http_status: response.status,
    status: schedules.length > 0 ? "found" : "missing",
    type
  });
}

async function cloudflareGet(path, query = {}) {
  const url = new URL(`${contract.api_base_url}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      method: "GET"
    });
    const text = await response.text();
    const body = parseJson(text);

    return {
      body,
      ok: response.ok && body?.success !== false,
      status: response.status
    };
  } catch (error) {
    return {
      body: {
        errors: [
          {
            message: error instanceof Error ? error.message : String(error)
          }
        ]
      },
      ok: false,
      status: 0
    };
  }
}

function toApiError({ bindingName, response, type }) {
  return {
    binding_name: bindingName,
    error_hash: hashString(JSON.stringify(sanitizeErrors(response.body?.errors))),
    http_status: response.status,
    status: "api_error",
    type
  };
}

function normalizeItems(value) {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (Array.isArray(value?.items)) {
    return value.items.filter(isRecord);
  }

  return [];
}

function sanitizeErrors(errors) {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.filter(isRecord).map((error) => ({
    code: typeof error.code === "number" ? error.code : undefined,
    message_hash: hashString(sanitizeText(String(error.message ?? "cloudflare_error")))
  }));
}

function sanitizeText(value) {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gu, "Bearer [REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]+/gu, "sk-[REDACTED]")
    .replace(/gh[pousr]_[A-Za-z0-9_]+/gu, "gh[REDACTED]");
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

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
