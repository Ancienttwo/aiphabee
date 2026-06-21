#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/model-providers/live-smoke-readiness.contract.json";
const providerContractPath = "deploy/model-providers/providers.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const packageJsonPath = "package.json";
const agentRuntimePath = "packages/agent-runtime/src/index.ts";
const workerPath = "apps/worker/src/index.ts";
const smokeScriptPath = "scripts/smoke-ai-gateway-live.mjs";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";

const requiredEnv = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "AI_GATEWAY_NAME",
  "AI_GATEWAY_SMOKE_MODEL"
];
const requiredOutputFields = [
  "status",
  "http_status",
  "http_statuses",
  "provider",
  "method",
  "gateway_id_hash",
  "model_hash",
  "prompt_hash",
  "operation_count",
  "generate_text",
  "stream_text",
  "response_hash"
];
const forbiddenOutputFields = [
  "authorization",
  "api_key",
  "token",
  "secret",
  "raw_prompt",
  "raw_model_output",
  "gateway_id",
  "model"
];
const requiredScriptTokens = [
  "/ai/v1/chat/completions",
  "cf-aig-gateway-id",
  "missing_env",
  "response_hash",
  "output_hash",
  "generateText",
  "streamText",
  "createOpenAICompatible",
  "raw_model_output"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const providerContract = readJson(providerContractPath);
const envSchema = readJson(envSchemaPath);
const packageJson = readJson(packageJsonPath);
const agentRuntime = readText(agentRuntimePath);
const worker = readText(workerPath);
const smokeScript = readText(smokeScriptPath);
const tracker = readText(trackerPath);
const errors = validateContract(
  contract,
  providerContract,
  envSchema,
  packageJson,
  agentRuntime,
  worker,
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
    endpoint: `${contract.http.base_url}${contract.http.endpoint}`,
    required_env: contract.required_env,
    status: "ok"
  },
  0
);

function validateContract(
  value,
  providerValue,
  envValue,
  packageValue,
  agentRuntimeValue,
  workerValue,
  smokeScriptValue,
  trackerValue
) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.model-provider-live-smoke-readiness.v0") {
    errors.push("version must match model provider live-smoke readiness version");
  }

  if (value.status !== "ready_missing_env") {
    errors.push("status must be ready_missing_env until a real live smoke passes");
  }

  if (value.provider_contract !== providerContractPath) {
    errors.push(`provider_contract must be ${providerContractPath}`);
  }

  if (value.live_smoke_script !== smokeScriptPath) {
    errors.push(`live_smoke_script must be ${smokeScriptPath}`);
  }

  if (value.readiness_check_script !== "scripts/check-model-provider-live-readiness.mjs") {
    errors.push("readiness_check_script must point to this checker");
  }

  if (!isRecord(value.http)) {
    errors.push("http must be an object");
  } else {
    if (value.http.method !== "POST") {
      errors.push("http.method must be POST");
    }

    if (value.http.base_url !== "https://api.cloudflare.com/client/v4/accounts/{account_id}") {
      errors.push("http.base_url must use Cloudflare AI REST API base");
    }

    if (value.http.endpoint !== "/ai/v1/chat/completions") {
      errors.push("http.endpoint must be /ai/v1/chat/completions");
    }

    if (value.http.gateway_header !== "cf-aig-gateway-id") {
      errors.push("http.gateway_header must be cf-aig-gateway-id");
    }
  }

  errors.push(...validateStringArray(value.required_env, requiredEnv, "required_env"));
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
  errors.push(...validateProviderContract(providerValue));
  errors.push(...validateEnvSchema(envValue));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateRuntimeIntegration(agentRuntimeValue, workerValue));
  errors.push(...validateSmokeScript(smokeScriptValue));
  errors.push(...validateTrackerSync(trackerValue));
  errors.push(
    ...validateLinkedFiles([
      value.provider_contract,
      value.live_smoke_script,
      agentRuntimePath,
      workerPath
    ])
  );
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateProviderContract(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.gateway) || !isRecord(value.live_smoke)) {
    return ["provider contract must include gateway and live_smoke"];
  }

  if (
    value.gateway.rest_api_base !==
    "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai"
  ) {
    errors.push("provider gateway rest_api_base must use Cloudflare AI REST API base");
  }

  if (value.gateway.gateway_header !== "cf-aig-gateway-id") {
    errors.push("provider gateway must declare cf-aig-gateway-id header");
  }

  if (
    !Array.isArray(value.gateway.routes) ||
    !value.gateway.routes.includes("POST /ai/v1/chat/completions")
  ) {
    errors.push("provider gateway routes must include POST /ai/v1/chat/completions");
  }

  if (value.gateway.status !== "planned") {
    errors.push("provider gateway status must remain planned until live provisioned");
  }

  if (value.live_smoke.status !== "ready_missing_env") {
    errors.push("provider live_smoke status must remain ready_missing_env");
  }

  errors.push(
    ...validateStringArray(
      value.live_smoke.required_env,
      requiredEnv,
      "provider live_smoke.required_env"
    )
  );
  errors.push(
    ...validateStringArray(
      value.live_smoke.proof_fields,
      [
        "http_status",
        "http_statuses",
        "provider",
        "method",
        "gateway_id_hash",
        "model_hash",
        "prompt_hash",
        "operation_count",
        "generate_text",
        "stream_text",
        "response_hash"
      ],
      "provider live_smoke.proof_fields"
    )
  );

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

    if (!isRecord(variable)) {
      errors.push(`env schema missing ${envName}`);
      continue;
    }

    if (envName === "CLOUDFLARE_API_TOKEN" && variable.secret !== true) {
      errors.push("CLOUDFLARE_API_TOKEN must be marked secret");
    }

    if (envName !== "CLOUDFLARE_API_TOKEN" && variable.secret !== false) {
      errors.push(`${envName} must be marked non-secret`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const errors = [];
  const readinessScript = value.scripts["check:model-provider-live-readiness"];
  const smokeScript = value.scripts["smoke:ai-gateway-live"];
  const check = value.scripts.check;

  if (
    typeof readinessScript !== "string" ||
    !readinessScript.includes("scripts/check-model-provider-live-readiness.mjs")
  ) {
    errors.push("check:model-provider-live-readiness must run its checker");
  }

  if (
    typeof smokeScript !== "string" ||
    !smokeScript.includes("scripts/smoke-ai-gateway-live.mjs")
  ) {
    errors.push("smoke:ai-gateway-live must run the live smoke script");
  }

  if (typeof check !== "string" || !check.includes("check:model-provider-live-readiness")) {
    errors.push("root check must include check:model-provider-live-readiness");
  }

  return errors;
}

function validateRuntimeIntegration(agentRuntimeValue, workerValue) {
  const errors = [];

  for (const token of [
    "runAiGatewayLiveSmoke",
    "createOpenAICompatible",
    "generateText",
    "streamText",
    "cf-aig-gateway-id",
    "AI_GATEWAY_LIVE_SMOKE_PROMPT"
  ]) {
    if (!agentRuntimeValue.includes(token)) {
      errors.push(`agent runtime must include ${token}`);
    }
  }

  for (const token of [
    "AI_GATEWAY_LIVE_SMOKE_VERSION",
    "runAiGatewayLiveSmoke",
    "/agent/model-provider/live-smoke",
    "model-provider-live-v1",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_API_TOKEN",
    "AI_GATEWAY_NAME",
    "AI_GATEWAY_SMOKE_MODEL"
  ]) {
    if (!workerValue.includes(token)) {
      errors.push(`worker runtime must include ${token}`);
    }
  }

  return errors;
}

function validateSmokeScript(value) {
  const errors = [];

  for (const token of requiredScriptTokens) {
    if (!value.includes(token)) {
      errors.push(`smoke script must include ${token}`);
    }
  }

  return errors;
}

function validateTrackerSync(value) {
  const errors = [];

  if (!value.includes("npm run check:model-provider-live-readiness")) {
    errors.push("tracker must reference check:model-provider-live-readiness");
  }

  if (!value.includes("npm run smoke:ai-gateway-live")) {
    errors.push("tracker must reference smoke:ai-gateway-live");
  }

  if (!value.includes("- [ ] AI Gateway 接管模型调用日志/成本/限流/缓存/fallback")) {
    errors.push("tracker must keep the A5 live AI Gateway item unchecked");
  }

  if (!value.includes("- [ ] Model provider live execution smoke")) {
    errors.push("tracker must keep model provider live execution smoke unchecked");
  }

  return errors;
}

function validateLinkedFiles(paths) {
  if (!Array.isArray(paths)) {
    return ["linked files must be an array"];
  }

  return paths
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked file missing: ${path}`);
}

function validateStringArray(value, requiredValues, name) {
  const errors = [];

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);

  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
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
