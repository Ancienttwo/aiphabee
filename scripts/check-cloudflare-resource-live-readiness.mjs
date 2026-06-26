#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/cloudflare/resource-smoke-readiness.contract.json";
const bindingsContractPath = "deploy/cloudflare/bindings.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const packageJsonPath = "package.json";
const smokeScriptPath = "scripts/smoke-cloudflare-resources-live.mjs";
const functionalSmokeScriptPath = "scripts/smoke-cloudflare-bindings-wrangler-live.mjs";
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
const requiredFunctionalSurfaces = [
  ["aiphabee-worker", "worker_runtime_binding_smoke"],
  ["AIPHABEE_EVENTS_QUEUE", "queue_publish_consume_smoke"],
  ["AIPHABEE_RUN_COORDINATOR", "durable_object_state_smoke"],
  ["AIPHABEE_RESEARCH_WORKFLOW", "workflow_instance_execution"],
  ["AIPHABEE_MAINTENANCE_CRON", "cron_handler_smoke"],
  ["AIPHABEE_AI_GATEWAY", "ai_gateway_model_request_smoke"],
  ["AIPHABEE_CONFIG", "kv_put_get_delete"],
  ["AIPHABEE_ARTIFACTS", "r2_put_get_delete"],
  ["AIPHABEE_EVAL_STORE", "d1_eval_write_read_delete"],
  ["AIPHABEE_HYPERDRIVE", "hyperdrive_select_1_smoke"]
];
const requiredRemainingFunctionalSurfaces = [
  ["AIPHABEE_MAINTENANCE_CRON", "cron_natural_trigger_evidence"]
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
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u,
  /\b[a-f0-9]{32}\b/iu,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu
];

const contract = readJson(contractPath);
const bindingsContract = readJson(bindingsContractPath);
const envSchema = readJson(envSchemaPath);
const packageJson = readJson(packageJsonPath);
const smokeScript = readText(smokeScriptPath);
const functionalSmokeScript = readText(functionalSmokeScriptPath);
const tracker = readText(trackerPath);
const errors = validateContract(
  contract,
  bindingsContract,
  envSchema,
  packageJson,
  smokeScript,
  functionalSmokeScript,
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
  functionalSmokeScriptValue,
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

  if (value.functional_smoke_script !== functionalSmokeScriptPath) {
    errors.push(`functional_smoke_script must be ${functionalSmokeScriptPath}`);
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

  if (value.functional_smoke_command !== "npm run smoke:cloudflare-bindings-wrangler-live") {
    errors.push(
      "functional_smoke_command must be npm run smoke:cloudflare-bindings-wrangler-live"
    );
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
  errors.push(...validatePartialProvisioning(value.partial_provisioning, bindingsValue));
  errors.push(...validateFunctionalSmoke(value.functional_smoke, bindingsValue));
  errors.push(...validateEnvSchema(envValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSmokeScript(smokeScriptValue));
  errors.push(...validateFunctionalSmokeScript(functionalSmokeScriptValue));
  errors.push(...validateTrackerSync(trackerValue));
  errors.push(
    ...validateLinkedFiles([
      value.bindings_contract,
      value.live_smoke_script,
      value.functional_smoke_script
    ])
  );
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

function validatePartialProvisioning(value, bindingsValue) {
  const errors = [];

  if (!isRecord(bindingsValue) || !Array.isArray(bindingsValue.bindings)) {
    return errors;
  }

  const bindings = bindingsValue.bindings.filter(isRecord);
  const provisionedBindingNames = bindings
    .filter((binding) => binding.provisioned === true)
    .map((binding) => binding.name)
    .filter((name) => typeof name === "string");
  const plannedBindingNames = bindings
    .filter((binding) => binding.provisioned === false)
    .map((binding) => binding.name)
    .filter((name) => typeof name === "string");

  if (provisionedBindingNames.length > 1 && !isRecord(value)) {
    return [
      "partial_provisioning must be present once external resources are partially provisioned"
    ];
  }

  if (typeof value === "undefined") {
    return errors;
  }

  if (!isRecord(value)) {
    return ["partial_provisioning must be an object"];
  }

  if (value.status !== "partial_external_provisioned") {
    errors.push("partial_provisioning.status must be partial_external_provisioned");
  }

  if (typeof value.observed_at !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value.observed_at)) {
    errors.push("partial_provisioning.observed_at must be YYYY-MM-DD");
  }

  if (typeof value.account_label !== "string" || value.account_label.length === 0) {
    errors.push("partial_provisioning.account_label must be a non-empty string");
  } else if (/^[a-f0-9]{32}$/iu.test(value.account_label)) {
    errors.push("partial_provisioning.account_label must not be a raw account id");
  }

  errors.push(
    ...validateExactStringArray(
      value.provisioned_bindings,
      provisionedBindingNames,
      "partial_provisioning.provisioned_bindings"
    )
  );

  if (!isRecord(value.resource_names)) {
    errors.push("partial_provisioning.resource_names must be an object");
  } else {
    for (const [key, resourceName] of Object.entries(value.resource_names)) {
      if (typeof key !== "string" || key.length === 0) {
        errors.push("partial_provisioning.resource_names keys must be non-empty strings");
      }

      if (typeof resourceName !== "string" || resourceName.length === 0) {
        errors.push(`partial_provisioning.resource_names.${key} must be a non-empty string`);
      }
    }
  }

  if (!Array.isArray(value.live_smoke_results) || value.live_smoke_results.length === 0) {
    errors.push("partial_provisioning.live_smoke_results must be a non-empty array");
  } else {
    for (const [index, result] of value.live_smoke_results.entries()) {
      if (!isRecord(result)) {
        errors.push(`partial_provisioning.live_smoke_results[${index}] must be an object`);
        continue;
      }

      for (const field of ["surface", "result"]) {
        if (typeof result[field] !== "string" || result[field].length === 0) {
          errors.push(
            `partial_provisioning.live_smoke_results[${index}].${field} must be a non-empty string`
          );
        }
      }
    }
  }

  if (!Array.isArray(value.blocked_bindings)) {
    errors.push("partial_provisioning.blocked_bindings must be an array");
  } else {
    const blockedBindingNames = [];

    for (const [index, blocked] of value.blocked_bindings.entries()) {
      if (!isRecord(blocked)) {
        errors.push(`partial_provisioning.blocked_bindings[${index}] must be an object`);
        continue;
      }

      if (typeof blocked.binding_name !== "string" || blocked.binding_name.length === 0) {
        errors.push(
          `partial_provisioning.blocked_bindings[${index}].binding_name must be a non-empty string`
        );
      } else {
        blockedBindingNames.push(blocked.binding_name);
      }

      if (typeof blocked.reason !== "string" || blocked.reason.length === 0) {
        errors.push(
          `partial_provisioning.blocked_bindings[${index}].reason must be a non-empty string`
        );
      }
    }

    errors.push(
      ...validateExactStringArray(
        blockedBindingNames,
        plannedBindingNames,
        "partial_provisioning.blocked_bindings.binding_name"
      )
    );
  }

  errors.push(...validateForbiddenKeys(value, "partial_provisioning"));
  errors.push(...validateNoSecrets(value).map((error) => `partial_provisioning ${error}`));

  return errors;
}

function validateFunctionalSmoke(value, bindingsValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["functional_smoke must be present after Wrangler live smoke passes"];
  }

  if (value.status !== "partial_live_passed") {
    errors.push("functional_smoke.status must be partial_live_passed");
  }

  if (value.runner !== "wrangler_oauth_cli") {
    errors.push("functional_smoke.runner must be wrangler_oauth_cli");
  }

  if (value.command !== "npm run smoke:cloudflare-bindings-wrangler-live") {
    errors.push("functional_smoke.command must be npm run smoke:cloudflare-bindings-wrangler-live");
  }

  errors.push(
    ...validateStringArray(
      value.required_env,
      ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "AI_GATEWAY_NAME", "AI_GATEWAY_SMOKE_MODEL"],
      "functional_smoke.required_env"
    )
  );

  if (value.synthetic_prefix !== "aiphabee-smoke") {
    errors.push("functional_smoke.synthetic_prefix must be aiphabee-smoke");
  }

  errors.push(
    ...validateSurfaceList(
      value.passed_surfaces,
      requiredFunctionalSurfaces,
      "functional_smoke.passed_surfaces"
    )
  );
  errors.push(
    ...validateSurfaceList(
      value.remaining_surfaces,
      requiredRemainingFunctionalSurfaces,
      "functional_smoke.remaining_surfaces"
    )
  );

  const bindings = isRecord(bindingsValue) && Array.isArray(bindingsValue.bindings)
    ? new Map(bindingsValue.bindings.filter(isRecord).map((binding) => [binding.name, binding]))
    : new Map();

  for (const [bindingName] of requiredFunctionalSurfaces) {
    const binding = bindings.get(bindingName);

    if (!binding || binding.provisioned !== true) {
      errors.push(`${bindingName} functional smoke requires provisioned binding`);
    }
  }

  errors.push(...validateForbiddenKeys(value, "functional_smoke"));
  errors.push(...validateNoSecrets(value).map((error) => `functional_smoke ${error}`));

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
  const functionalSmokeScript = value.scripts["smoke:cloudflare-bindings-wrangler-live"];
  const fullCheck = value.scripts.check;

  if (checkScript !== "node scripts/check-cloudflare-resource-live-readiness.mjs") {
    errors.push("check:cloudflare-resource-live-readiness must run its checker");
  }

  if (smokeScript !== "node scripts/smoke-cloudflare-resources-live.mjs") {
    errors.push("smoke:cloudflare-resources-live must run the live smoke script");
  }

  if (functionalSmokeScript !== "node scripts/smoke-cloudflare-bindings-wrangler-live.mjs") {
    errors.push("smoke:cloudflare-bindings-wrangler-live must run the functional smoke script");
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

function validateFunctionalSmokeScript(value) {
  const errors = [];
  const requiredTokens = [
    "kv",
    "namespace",
    "list",
    "key",
    "put",
    "deploy",
    "r2",
    "object",
    "d1",
    "execute",
    "/cloudflare/bindings/smoke",
    "/cloudflare/queues/smoke",
    "/cloudflare/durable-objects/smoke",
    "/cloudflare/workflows/smoke",
    "/cloudflare/cron/smoke",
    "/cloudflare/cron/natural-evidence",
    "/cloudflare/hyperdrive/smoke",
    "/agent/model-provider/live-smoke",
    "cloudflare-bindings-runtime-v1",
    "model-provider-live-v1",
    "worker_runtime_binding_smoke",
    "queue_publish_consume_smoke",
    "durable_object_state_smoke",
    "workflow_instance_execution",
    "cron_handler_smoke",
    "cron_natural_trigger_evidence",
    "CRON_NATURAL_SMOKE_MAX_ATTEMPTS",
    "after_issued_at",
    "aiphabee_eval_store_smoke",
    "record_json",
    "hyperdrive_select_1_smoke",
    "ai_gateway_model_request_smoke",
    "AI_GATEWAY_LIVE_SMOKE_TOKEN",
    "--secrets-file",
    "nodejs_compat",
    "kv_namespaces",
    "r2_buckets",
    "d1_databases",
    "hyperdrive",
    "durable_objects",
    "migrations",
    "new_classes",
    "workflows",
    "schedules",
    "triggers",
    "crons",
    "queues",
    "producers",
    "consumers",
    "functional_results",
    "forbidden_output_fields",
    "raw_response"
  ];

  for (const token of requiredTokens) {
    if (!value.includes(token)) {
      errors.push(`functional smoke script missing token ${token}`);
    }
  }

  for (const forbidden of forbiddenOutputFields) {
    if (!value.includes(forbidden)) {
      errors.push(`functional smoke script must declare forbidden output ${forbidden}`);
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

  if (!value.includes("npm run smoke:cloudflare-bindings-wrangler-live")) {
    errors.push("tracker must reference smoke:cloudflare-bindings-wrangler-live");
  }

  if (!/^- \[ \] Cloudflare resources provisioned \+ binding smoke tests/mu.test(value)) {
    errors.push("tracker Cloudflare resources live item must remain unchecked");
  }

  if (!/^- \[x\] Hyperdrive-backed Postgres\/Supabase live connection smoke/mu.test(value)) {
    errors.push("tracker Hyperdrive live smoke item must be checked after PlanetScale production readback");
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

function validateExactStringArray(value, expectedValues, fieldName) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${fieldName} must be an array of strings`];
  }

  const errors = [];
  const actual = [...new Set(value)].sort();
  const expected = [...new Set(expectedValues)].sort();
  const missing = expected.filter((item) => !actual.includes(item));
  const unexpected = actual.filter((item) => !expected.includes(item));

  if (actual.length !== value.length) {
    errors.push(`${fieldName} must not contain duplicates`);
  }

  if (missing.length > 0) {
    errors.push(`${fieldName} missing ${missing.join(", ")}`);
  }

  if (unexpected.length > 0) {
    errors.push(`${fieldName} contains unexpected ${unexpected.join(", ")}`);
  }

  return errors;
}

function validateSurfaceList(value, expectedPairs, fieldName) {
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    return [`${fieldName} must be an array of objects`];
  }

  const errors = [];
  const actual = value.map((item) => `${item.binding_name}:${item.surface}`).sort();
  const expected = expectedPairs.map(([bindingName, surface]) => `${bindingName}:${surface}`).sort();
  const missing = expected.filter((item) => !actual.includes(item));
  const unexpected = actual.filter((item) => !expected.includes(item));

  if (missing.length > 0) {
    errors.push(`${fieldName} missing ${missing.join(", ")}`);
  }

  if (unexpected.length > 0) {
    errors.push(`${fieldName} contains unexpected ${unexpected.join(", ")}`);
  }

  for (const [index, item] of value.entries()) {
    for (const field of ["binding_name", "surface"]) {
      if (typeof item[field] !== "string" || item[field].length === 0) {
        errors.push(`${fieldName}[${index}].${field} must be a non-empty string`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(item, "result")) {
      if (typeof item.result !== "string" || item.result.length === 0) {
        errors.push(`${fieldName}[${index}].result must be a non-empty string`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(item, "reason")) {
      if (typeof item.reason !== "string" || item.reason.length === 0) {
        errors.push(`${fieldName}[${index}].reason must be a non-empty string`);
      }
    }
  }

  return errors;
}

function validateForbiddenKeys(value, path) {
  const errors = [];
  const forbiddenKeys = new Set([
    "authorization",
    "api_key",
    "token",
    "secret",
    "raw_response",
    "account_id",
    "resource_id",
    "env_value",
    "id"
  ]);

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      errors.push(...validateForbiddenKeys(item, `${path}[${index}]`));
    });
    return errors;
  }

  if (!isRecord(value)) {
    return errors;
  }

  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      errors.push(`${path}.${key} must not be committed`);
    }

    errors.push(...validateForbiddenKeys(child, `${path}.${key}`));
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
