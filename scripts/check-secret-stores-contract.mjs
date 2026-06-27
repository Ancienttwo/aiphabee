#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/secrets/stores.contract.json";
const envSchemaPath = "deploy/env/env.schema.json";
const requiredProviders = ["cloudflare_workers", "github_actions"];
const requiredProviderFields = [
  "name",
  "status",
  "scope",
  "set_command",
  "list_command",
  "delete_command",
  "evidence"
];
const forbiddenKeys = ["id", "password", "secret_value", "token_value", "value"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]+/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]+/u,
  /gh[pousr]_[A-Za-z0-9_]+/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const envSchema = readJson(envSchemaPath);
const errors = validateContract(contract, envSchema);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_secret_stores_contract"
    },
    1
  );
}

emit(
  {
    providers: contract.providers.length,
    secrets: contract.secret_names.length,
    status: "ok"
  },
  0
);

function validateContract(contractValue, schemaValue) {
  const errors = [];

  if (!isRecord(contractValue)) {
    return ["contract must be an object"];
  }

  if (!isRecord(schemaValue) || !Array.isArray(schemaValue.variables)) {
    return ["env schema must contain variables"];
  }

  const secretNamesFromEnv = schemaValue.variables
    .filter((variable) => variable.secret === true)
    .map((variable) => variable.name)
    .sort();

  if (typeof contractValue.version !== "string" || contractValue.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (contractValue.status !== "local_contract") {
    errors.push("status must be local_contract until provider stores are provisioned");
  }

  if (!Array.isArray(contractValue.secret_names)) {
    errors.push("secret_names must be an array");
  } else {
    const secretNames = [...contractValue.secret_names].sort();

    if (secretNames.join("\n") !== secretNamesFromEnv.join("\n")) {
      errors.push("secret_names must match secret variables in deploy/env/env.schema.json");
    }
  }

  errors.push(...validateProviders(contractValue.providers, secretNamesFromEnv));
  errors.push(...validateRotation(contractValue.rotation));
  errors.push(...validateEmergencyRevocation(contractValue.emergency_revocation));
  errors.push(...validateNoSecrets(contractValue));

  return errors;
}

function validateProviders(value, allowedSecretNames) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["providers must be an array"];
  }

  const providerNames = new Set();

  value.forEach((provider, index) => {
    if (!isRecord(provider)) {
      errors.push(`providers[${index}] must be an object`);
      return;
    }

    for (const field of requiredProviderFields) {
      if (typeof provider[field] !== "string" || provider[field].length === 0) {
        errors.push(`providers[${index}].${field} must be a non-empty string`);
      }
    }

    if (typeof provider.name === "string") {
      providerNames.add(provider.name);
    }

    if (provider.status !== "planned") {
      errors.push(`providers[${index}].status must be planned`);
    }

    if (
      typeof provider.rotation_cadence_days !== "number" ||
      provider.rotation_cadence_days < 1 ||
      provider.rotation_cadence_days > 180
    ) {
      errors.push(`providers[${index}].rotation_cadence_days must be 1-180`);
    }

    if (
      typeof provider.emergency_revocation_sla_minutes !== "number" ||
      provider.emergency_revocation_sla_minutes < 1 ||
      provider.emergency_revocation_sla_minutes > 60
    ) {
      errors.push(`providers[${index}].emergency_revocation_sla_minutes must be 1-60`);
    }

    if (!Array.isArray(provider.stores) || provider.stores.length === 0) {
      errors.push(`providers[${index}].stores must be a non-empty array`);
    } else {
      for (const secretName of provider.stores) {
        if (!allowedSecretNames.includes(secretName)) {
          errors.push(`providers[${index}] stores unknown secret ${secretName}`);
        }
      }
    }
  });

  for (const providerName of requiredProviders) {
    if (!providerNames.has(providerName)) {
      errors.push(`missing provider ${providerName}`);
    }
  }

  return errors;
}

function validateRotation(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["rotation must be an object"];
  }

  if (typeof value.cadence_days !== "number" || value.cadence_days > 180) {
    errors.push("rotation.cadence_days must be <= 180");
  }

  if (value.requires_dual_write_window !== true) {
    errors.push("rotation.requires_dual_write_window must be true");
  }

  if (value.requires_post_rotation_smoke !== true) {
    errors.push("rotation.requires_post_rotation_smoke must be true");
  }

  if (
    !Array.isArray(value.minimum_smoke_tests) ||
    !value.minimum_smoke_tests.includes("GET /health")
  ) {
    errors.push("rotation.minimum_smoke_tests must include GET /health");
  }

  return errors;
}

function validateEmergencyRevocation(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["emergency_revocation must be an object"];
  }

  if (typeof value.sla_minutes !== "number" || value.sla_minutes > 30) {
    errors.push("emergency_revocation.sla_minutes must be <= 30");
  }

  if (!Array.isArray(value.steps) || value.steps.length < 4) {
    errors.push("emergency_revocation.steps must contain at least four steps");
  }

  return errors;
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
