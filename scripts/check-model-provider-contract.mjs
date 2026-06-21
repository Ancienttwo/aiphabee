#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/model-providers/providers.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const requiredModes = ["dry_run", "generate_text", "stream_text"];
const requiredRoutes = [
  "POST /ai/run",
  "POST /ai/v1/chat/completions",
  "POST /ai/v1/responses",
  "POST /ai/v1/messages"
];
const requiredEnv = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "AI_GATEWAY_NAME"];
const forbiddenKeys = ["api_key", "password", "secret", "token", "value"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/u
];

const contract = readJson(contractPath);
const envSchema = readJson(envSchemaPath);
const errors = validateContract(contract, envSchema);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_model_provider_contract"
    },
    1
  );
}

emit(
  {
    execution_modes: contract.execution_modes.length,
    provider: contract.gateway.provider,
    status: "ok"
  },
  0
);

function validateContract(value, schema) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract until model provider is provisioned");
  }

  errors.push(...validateAiSdk(value.ai_sdk));
  errors.push(...validateGateway(value.gateway, schema));
  errors.push(...validateExecutionModes(value.execution_modes));
  errors.push(...validatePolicy(value.policy));
  errors.push(...validateSmokeTests(value.smoke_tests));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateAiSdk(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["ai_sdk must be an object"];
  }

  if (value.package_name !== "ai") {
    errors.push("ai_sdk.package_name must be ai");
  }

  if (value.target_version !== "7.0.0-beta.182") {
    errors.push("ai_sdk.target_version must match installed v7 beta");
  }

  if (value.stop_condition !== "isStepCount") {
    errors.push("ai_sdk.stop_condition must be isStepCount");
  }

  if (
    !Array.isArray(value.execution_apis) ||
    !value.execution_apis.includes("generateText") ||
    !value.execution_apis.includes("streamText")
  ) {
    errors.push("ai_sdk.execution_apis must include generateText and streamText");
  }

  return errors;
}

function validateGateway(value, schema) {
  const errors = [];

  if (!isRecord(value)) {
    return ["gateway must be an object"];
  }

  if (value.provider !== "cloudflare_ai_gateway") {
    errors.push("gateway.provider must be cloudflare_ai_gateway");
  }

  if (value.status !== "planned") {
    errors.push("gateway.status must be planned");
  }

  if (value.gateway_id !== "default") {
    errors.push("gateway.gateway_id must be default until a real gateway is selected");
  }

  if (
    typeof value.rest_api_base !== "string" ||
    !value.rest_api_base.includes("{account_id}") ||
    /\$[A-Z_]+/u.test(value.rest_api_base)
  ) {
    errors.push("gateway.rest_api_base must use {account_id} placeholder only");
  }

  if (!Array.isArray(value.routes)) {
    errors.push("gateway.routes must be an array");
  } else {
    for (const route of requiredRoutes) {
      if (!value.routes.includes(route)) {
        errors.push(`gateway.routes missing ${route}`);
      }
    }
  }

  const envNames = new Set(
    Array.isArray(schema.variables) ? schema.variables.map((variable) => variable.name) : []
  );

  if (!Array.isArray(value.required_env)) {
    errors.push("gateway.required_env must be an array");
  } else {
    for (const envName of requiredEnv) {
      if (!value.required_env.includes(envName)) {
        errors.push(`gateway.required_env missing ${envName}`);
      }

      if (!envNames.has(envName)) {
        errors.push(`env schema missing ${envName}`);
      }
    }
  }

  if (value.unified_billing !== true) {
    errors.push("gateway.unified_billing must be true");
  }

  return errors;
}

function validateExecutionModes(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["execution_modes must be an array"];
  }

  const modes = new Map();

  value.forEach((mode, index) => {
    if (!isRecord(mode)) {
      errors.push(`execution_modes[${index}] must be an object`);
      return;
    }

    if (typeof mode.name === "string") {
      modes.set(mode.name, mode);
    }

    if (typeof mode.route !== "string" || mode.route.length === 0) {
      errors.push(`execution_modes[${index}].route must be a non-empty string`);
    }

    if (mode.model_calls !== false) {
      errors.push(`execution_modes[${index}].model_calls must be false in Phase 0`);
    }
  });

  for (const requiredMode of requiredModes) {
    if (!modes.has(requiredMode)) {
      errors.push(`missing execution mode ${requiredMode}`);
    }
  }

  if (modes.get("dry_run")?.status !== "wired") {
    errors.push("dry_run mode must be wired");
  }

  if (modes.get("generate_text")?.status !== "planned") {
    errors.push("generate_text mode must be planned");
  }

  if (modes.get("stream_text")?.status !== "guarded") {
    errors.push("stream_text mode must be guarded");
  }

  return errors;
}

function validatePolicy(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["policy must be an object"];
  }

  for (const field of [
    "model_calls_enabled",
    "streaming_enabled",
    "arbitrary_model_ids",
    "market_data_surfaces",
    "mcp_redistribution_surfaces"
  ]) {
    if (value[field] !== false) {
      errors.push(`policy.${field} must be false in Phase 0`);
    }
  }

  for (const field of [
    "requires_ai_gateway_logs",
    "requires_budget_ledger",
    "requires_evidence_binding"
  ]) {
    if (value[field] !== true) {
      errors.push(`policy.${field} must be true before live model calls`);
    }
  }

  if (value.max_steps !== 6 || value.supported_max_steps !== 8) {
    errors.push("policy step limits must match Agent Runtime limits");
  }

  return errors;
}

function validateSmokeTests(value) {
  if (
    !Array.isArray(value) ||
    !value.some((item) => item.includes("GET /agent/model-provider")) ||
    !value.some((item) => item.includes("POST /agent/runs/stream"))
  ) {
    return ["smoke_tests must cover model provider route and stream guard"];
  }

  return [];
}

function validateNoSecrets(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const forbiddenKey of forbiddenKeys) {
    if (containsForbiddenKey(value, forbiddenKey)) {
      errors.push(`contract must not contain key ${forbiddenKey}`);
    }
  }

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern.source}`);
    }
  }

  return errors;
}

function containsForbiddenKey(value, forbiddenKey) {
  if (Array.isArray(value)) {
    return value.some((item) => containsForbiddenKey(item, forbiddenKey));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(([key, nested]) => {
    if (key.toLowerCase() === forbiddenKey) {
      return true;
    }

    return containsForbiddenKey(nested, forbiddenKey);
  });
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
