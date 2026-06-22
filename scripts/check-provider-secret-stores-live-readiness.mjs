#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/secrets/live-smoke-readiness.contract.json";
const sourceContractPath = "deploy/secrets/stores.contract.json";
const packagePath = "package.json";
const smokeScriptPath = "scripts/smoke-provider-secret-stores-live.mjs";
const requiredProviders = ["cloudflare_workers", "github_actions", "supabase"];
const requiredOperations = [
  "set_synthetic_secret",
  "list_secret_metadata",
  "rotate_synthetic_secret",
  "delete_synthetic_secret",
  "confirm_absent"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const sourceContract = readJson(sourceContractPath);
const packageJson = readJson(packagePath);
const smokeScript = readText(smokeScriptPath);
const errors = validateContract(contract, sourceContract, packageJson, smokeScript);

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_provider_secret_stores_live_readiness"
    },
    1
  );
}

emit(
  {
    providers: contract.providers.length,
    script: contract.script,
    status: "ok",
    synthetic_secret_prefix: contract.synthetic_secret.name_prefix
  },
  0
);

function validateContract(value, sourceValue, packageValue, scriptValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase0.provider-secret-live-smoke-readiness.v0") {
    errors.push("version must match provider secret live smoke readiness version");
  }

  if (value.status !== "readiness_no_secret") {
    errors.push("status must be readiness_no_secret");
  }

  if (value.source_contract !== sourceContractPath) {
    errors.push(`source_contract must be ${sourceContractPath}`);
  }

  if (value.script !== smokeScriptPath) {
    errors.push(`script must be ${smokeScriptPath}`);
  }

  if (value.checker !== "scripts/check-provider-secret-stores-live-readiness.mjs") {
    errors.push("checker must point to the provider secret live readiness checker");
  }

  errors.push(...validateSourceContract(sourceValue));
  errors.push(...validateSyntheticSecret(value.synthetic_secret));
  errors.push(...validateProviders(value.providers));
  errors.push(...validatePassConditions(value.pass_conditions));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSmokeScript(scriptValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSourceContract(value) {
  const errors = [];

  if (!isRecord(value) || value.status !== "local_contract") {
    return ["source secret stores contract must remain local_contract"];
  }

  const providerNames = Array.isArray(value.providers)
    ? value.providers.map((provider) => provider?.name).filter((name) => typeof name === "string")
    : [];

  for (const providerName of requiredProviders) {
    if (!providerNames.includes(providerName)) {
      errors.push(`source secret stores contract must include ${providerName}`);
    }
  }

  return errors;
}

function validateSyntheticSecret(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["synthetic_secret must be an object"];
  }

  if (value.name_prefix !== "AIPHABEE_SECRET_STORE_SMOKE") {
    errors.push("synthetic_secret.name_prefix must be AIPHABEE_SECRET_STORE_SMOKE");
  }

  if (value.value_policy !== "generated_in_memory_not_logged") {
    errors.push("synthetic_secret.value_policy must be generated_in_memory_not_logged");
  }

  if (value.cleanup_required !== true) {
    errors.push("synthetic_secret.cleanup_required must be true");
  }

  return errors;
}

function validateProviders(value) {
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

    if (typeof provider.name === "string") {
      providerNames.add(provider.name);
    }

    if (provider.status !== "readiness_not_run") {
      errors.push(`providers[${index}].status must be readiness_not_run`);
    }

    if (!Array.isArray(provider.required_env) || provider.required_env.length === 0) {
      errors.push(`providers[${index}].required_env must be a non-empty array`);
    }

    if (typeof provider.auth_source !== "string" || provider.auth_source.length === 0) {
      errors.push(`providers[${index}].auth_source must be a non-empty string`);
    }

    if (!Array.isArray(provider.commands) || provider.commands.length < 3) {
      errors.push(`providers[${index}].commands must describe set/list/delete commands`);
    }

    errors.push(
      ...validateStringArray(
        provider.operations,
        requiredOperations,
        `providers[${index}].operations`
      )
    );
  });

  for (const providerName of requiredProviders) {
    if (!providerNames.has(providerName)) {
      errors.push(`missing provider ${providerName}`);
    }
  }

  return errors;
}

function validatePassConditions(value) {
  if (!Array.isArray(value) || value.length < 5) {
    return ["pass_conditions must contain set/list/rotate/delete/confirm-absent coverage"];
  }

  return [];
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json must contain scripts"];
  }

  if (value.scripts["check:provider-secret-stores-live-readiness"] !== "node scripts/check-provider-secret-stores-live-readiness.mjs") {
    errors.push("package.json must define check:provider-secret-stores-live-readiness");
  }

  if (value.scripts["smoke:provider-secret-stores-live"] !== "node scripts/smoke-provider-secret-stores-live.mjs") {
    errors.push("package.json must define smoke:provider-secret-stores-live");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:provider-secret-stores-live-readiness")
  ) {
    errors.push("npm run check must include check:provider-secret-stores-live-readiness");
  }

  return errors;
}

function validateSmokeScript(value) {
  const errors = [];
  const requiredTokens = [
    "--dry-run",
    "wrangler",
    "secret",
    "put",
    "delete",
    "gh",
    "secret",
    "set",
    "supabase",
    "secrets",
    "unset",
    "AIPHABEE_SECRET_STORE_SMOKE",
    "generated_in_memory_not_logged",
    "secret_value_hash",
    "raw_output_hash"
  ];

  for (const token of requiredTokens) {
    if (!value.includes(token)) {
      errors.push(`smoke script must include ${token}`);
    }
  }

  if (value.includes("raw_output:") || value.includes("secret_value:")) {
    errors.push("smoke script must not emit raw_output or secret_value fields");
  }

  return errors;
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
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern.source}`);
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

function readText(relativePath) {
  try {
    return readFileSync(resolve(root, relativePath), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path: relativePath,
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
