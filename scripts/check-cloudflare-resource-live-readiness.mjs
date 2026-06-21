#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
const bindingsContractPath = "deploy/cloudflare/bindings.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const packageJsonPath = "package.json";
const smokeScriptPath = "scripts/smoke-cloudflare-resources-live.mjs";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";

const requiredEnv = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_WORKER_NAME",
  "CLOUDFLARE_WORKFLOW_NAME",
  "QUEUE_NAME",
  "CLOUDFLARE_DURABLE_OBJECT_NAMESPACE_NAME",
  "R2_BUCKET_NAME",
  "KV_NAMESPACE_ID",
  "CLOUDFLARE_D1_DATABASE_NAME",
  "AI_GATEWAY_NAME",
  "CLOUDFLARE_HYPERDRIVE_CONFIG_NAME"
];
const requiredEndpoints = [
  "GET /accounts/{account_id}/workers/scripts",
  "GET /accounts/{account_id}/workers/scripts/{script_name}/schedules",
  "GET /accounts/{account_id}/workflows/{workflow_name}",
  "GET /accounts/{account_id}/queues",
  "GET /accounts/{account_id}/workers/durable_objects/namespaces",
  "GET /accounts/{account_id}/r2/buckets",
  "GET /accounts/{account_id}/storage/kv/namespaces",
  "GET /accounts/{account_id}/d1/database",
  "GET /accounts/{account_id}/ai-gateway/gateways",
  "GET /accounts/{account_id}/hyperdrive/configs"
];
const requiredOutputFields = [
  "status",
  "resource_results",
  "missing_resources",
  "permission_errors",
  "response_hash"
];
const forbiddenOutputFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "raw_response",
  "account_id",
  "resource_id",
  "env_value"
];
const requiredBindings = [
  ["aiphabee-worker", "worker"],
  ["AIPHABEE_RESEARCH_WORKFLOW", "workflow"],
  ["AIPHABEE_EVENTS_QUEUE", "queue"],
  ["AIPHABEE_MAINTENANCE_CRON", "cron"],
  ["AIPHABEE_RUN_COORDINATOR", "durable_object"],
  ["AIPHABEE_ARTIFACTS", "r2"],
  ["AIPHABEE_CONFIG", "kv"],
  ["AIPHABEE_EVAL_STORE", "d1"],
  ["AIPHABEE_AI_GATEWAY", "ai_gateway"],
  ["AIPHABEE_HYPERDRIVE", "hyperdrive"]
];
const requiredScriptTokens = [
  "/workers/scripts",
  "/workers/scripts/${encodeURIComponent(",
  "/workflows/${encodeURIComponent(",
  "/queues",
  "/workers/durable_objects/namespaces",
  "/r2/buckets",
  "/storage/kv/namespaces",
  "/d1/database",
  "/ai-gateway/gateways",
  "/hyperdrive/configs",
  "missing_env",
  "expected_ref_hash",
  "raw_response"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const bindingsContract = readJson(bindingsContractPath);
const envSchema = readJson(envSchemaPath);
const packageJson = readJson(packageJsonPath);
const smokeScript = readText(smokeScriptPath);
const tracker = readText(trackerPath);
const errors = validateContract(
  contract,
  bindingsContract,
  envSchema,
  packageJson,
  smokeScript,
  tracker
);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    endpoints: contract.read_only_endpoints.length,
    required_env: contract.required_env,
    resources: contract.expected_resources.length,
    status: "ok"
  },
  0
);

function validateContract(
  value,
  bindingsValue,
  envValue,
  packageValue,
  smokeScriptValue,
  trackerValue
) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.cloudflare-resource-smoke-readiness.v0") {
    errors.push("version must match Cloudflare resource smoke readiness version");
  }

  if (value.status !== "ready_missing_env") {
    errors.push("status must be ready_missing_env until a real live smoke passes");
  }

  if (value.bindings_contract !== bindingsContractPath) {
    errors.push(`bindings_contract must be ${bindingsContractPath}`);
  }

  if (value.live_smoke_script !== smokeScriptPath) {
    errors.push(`live_smoke_script must be ${smokeScriptPath}`);
  }

  if (value.readiness_check_script !== "scripts/check-cloudflare-resource-live-readiness.mjs") {
    errors.push("readiness_check_script must point to this checker");
  }

  if (value.readiness_command !== "npm run check:cloudflare-resource-live-readiness") {
    errors.push("readiness_command must be npm run check:cloudflare-resource-live-readiness");
  }

  if (value.live_smoke_command !== "npm run smoke:cloudflare-resources-live") {
    errors.push("live_smoke_command must be npm run smoke:cloudflare-resources-live");
  }

  if (value.api_base_url !== "https://api.cloudflare.com/client/v4") {
    errors.push("api_base_url must be Cloudflare API v4");
  }

  errors.push(...validateStringArray(value.required_env, requiredEnv, "required_env"));
  errors.push(
    ...validateStringArray(value.read_only_endpoints, requiredEndpoints, "read_only_endpoints")
  );
  errors.push(
    ...validateStringArray(
      value.required_live_output_fields,
      requiredOutputFields,
      "required_live_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.forbidden_live_output_fields,
      forbiddenOutputFields,
      "forbidden_live_output_fields"
    )
  );
  errors.push(...validateExpectedResources(value.expected_resources));
  errors.push(...validateBindingsContract(bindingsValue));
  errors.push(...validateEnvSchema(envValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSmokeScript(smokeScriptValue));
  errors.push(...validateTrackerSync(trackerValue));
  errors.push(...validateLinkedFiles([value.bindings_contract, value.live_smoke_script]));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateExpectedResources(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["expected_resources must be an array"];
  }

  const byBinding = new Map();

  for (const resource of value) {
    if (!isRecord(resource)) {
      errors.push("expected_resources must contain objects");
      continue;
    }

    if (typeof resource.binding_name === "string") {
      byBinding.set(resource.binding_name, resource);
    }

    for (const field of ["binding_name", "type", "match_env", "match_field"]) {
      if (typeof resource[field] !== "string" || resource[field].length === 0) {
        errors.push(`expected resource ${field} must be a non-empty string`);
      }
    }
  }

  for (const [bindingName, type] of requiredBindings) {
    const resource = byBinding.get(bindingName);

    if (!resource) {
      errors.push(`expected_resources missing ${bindingName}`);
      continue;
    }

    if (resource.type !== type) {
      errors.push(`${bindingName} expected type must be ${type}`);
    }

    if (!requiredEnv.includes(resource.match_env)) {
      errors.push(`${bindingName} match_env must be in required_env`);
    }
  }

  return errors;
}

function validateBindingsContract(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.bindings)) {
    return ["bindings contract must include bindings"];
  }

  const byBinding = new Map(
    value.bindings.filter(isRecord).map((binding) => [binding.name, binding])
  );

  for (const [bindingName, type] of requiredBindings) {
    const binding = byBinding.get(bindingName);

    if (!binding) {
      errors.push(`bindings contract missing ${bindingName}`);
      continue;
    }

    if (binding.type !== type) {
      errors.push(`${bindingName} binding type must be ${type}`);
    }
  }

  if (value.status !== "planned") {
    errors.push("bindings contract must remain planned until resources are provisioned");
  }

  return errors;
}

function validateEnvSchema(value) {
  if (!isRecord(value) || !Array.isArray(value.variables)) {
    return ["env schema must include variables"];
  }

  const variables = new Map(
    value.variables.filter(isRecord).map((variable) => [variable.name, variable])
  );
  const errors = [];

  for (const envName of requiredEnv) {
    const variable = variables.get(envName);

    if (!variable) {
      errors.push(`env schema missing ${envName}`);
      continue;
    }

    if (envName === "CLOUDFLARE_API_TOKEN" && variable.secret !== true) {
      errors.push("CLOUDFLARE_API_TOKEN must be marked secret");
    }

    if (envName !== "CLOUDFLARE_API_TOKEN" && variable.secret !== false) {
      errors.push(`${envName} must not be marked secret`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const errors = [];
  const checkScript = value.scripts["check:cloudflare-resource-live-readiness"];
  const smokeScript = value.scripts["smoke:cloudflare-resources-live"];
  const fullCheck = value.scripts.check;

  if (checkScript !== "node scripts/check-cloudflare-resource-live-readiness.mjs") {
    errors.push("check:cloudflare-resource-live-readiness must run its checker");
  }

  if (smokeScript !== "node scripts/smoke-cloudflare-resources-live.mjs") {
    errors.push("smoke:cloudflare-resources-live must run the live smoke script");
  }

  if (typeof fullCheck !== "string" || !fullCheck.includes("check:cloudflare-resource-live-readiness")) {
    errors.push("root check must include check:cloudflare-resource-live-readiness");
  }

  return errors;
}

function validateSmokeScript(value) {
  const errors = [];

  for (const token of requiredScriptTokens) {
    if (!value.includes(token)) {
      errors.push(`smoke script missing token ${token}`);
    }
  }

  for (const forbidden of forbiddenOutputFields) {
    if (!value.includes(forbidden)) {
      errors.push(`smoke script must declare forbidden output ${forbidden}`);
    }
  }

  return errors;
}

function validateTrackerSync(value) {
  const errors = [];

  if (!value.includes("npm run check:cloudflare-resource-live-readiness")) {
    errors.push("tracker must reference check:cloudflare-resource-live-readiness");
  }

  if (!value.includes("npm run smoke:cloudflare-resources-live")) {
    errors.push("tracker must reference smoke:cloudflare-resources-live");
  }

  if (!/^- \[ \] Cloudflare resources provisioned \+ binding smoke tests/mu.test(value)) {
    errors.push("tracker Cloudflare resources live item must remain unchecked");
  }

  return errors;
}

function validateLinkedFiles(paths) {
  return paths
    .filter((path) => typeof path === "string")
    .filter((path) => !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${path}`);
}

function validateNoSecrets(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern.source}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, fieldName) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${fieldName} must be an array of strings`];
  }

  const errors = [];

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${fieldName} missing ${requiredValue}`);
    }
  }

  return errors;
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

function readText(relativePath) {
  try {
    return readFileSync(resolve(process.cwd(), relativePath), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path: relativePath,
        status: "read_failed"
      },
      1
    );
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
