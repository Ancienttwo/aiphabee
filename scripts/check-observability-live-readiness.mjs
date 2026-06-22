#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = "deploy/observability/live-smoke-readiness.contract.json";
const sourceContractPath = "deploy/observability/events.contract.json";
const packagePath = "package.json";
const smokeScriptPath = "scripts/smoke-observability-live.mjs";
const requiredEnv = [
  "OTLP_EXPORTER_OTLP_ENDPOINT",
  "OTLP_EXPORTER_OTLP_HEADERS",
  "CLOUDFLARE_D1_DATABASE_NAME"
];
const requiredSurfaces = ["otlp_http_log_export", "eval_store_record_write_read_delete"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
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
      status: "invalid_observability_live_readiness"
    },
    1
  );
}

emit(
  {
    required_env: contract.required_env,
    script: contract.script,
    status: "ok",
    surfaces: contract.synthetic_surfaces.length
  },
  0
);

function validateContract(value, sourceValue, packageValue, scriptValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase0.observability-live-smoke-readiness.v0") {
    errors.push("version must match observability live smoke readiness version");
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

  if (value.checker !== "scripts/check-observability-live-readiness.mjs") {
    errors.push("checker must point to the observability live readiness checker");
  }

  errors.push(...validateStringArray(value.required_env, requiredEnv, "required_env"));
  errors.push(...validateSourceContract(sourceValue));
  errors.push(...validateSurfaces(value.synthetic_surfaces));
  errors.push(...validatePassConditions(value.pass_conditions));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSmokeScript(scriptValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSourceContract(value) {
  const errors = [];

  if (!isRecord(value) || value.status !== "local_contract") {
    return ["source observability contract must remain local_contract"];
  }

  if (!Array.isArray(value.sinks)) {
    return ["source observability contract must include sinks"];
  }

  const sinkNames = value.sinks
    .filter(isRecord)
    .map((sink) => sink.name)
    .filter((name) => typeof name === "string");

  for (const sinkName of ["eval_store", "otlp_destination"]) {
    if (!sinkNames.includes(sinkName)) {
      errors.push(`source observability contract must include ${sinkName}`);
    }
  }

  return errors;
}

function validateSurfaces(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["synthetic_surfaces must be an array"];
  }

  const names = new Set();

  value.forEach((surface, index) => {
    if (!isRecord(surface)) {
      errors.push(`synthetic_surfaces[${index}] must be an object`);
      return;
    }

    if (typeof surface.name === "string") {
      names.add(surface.name);
    }

    if (surface.status !== "readiness_not_run") {
      errors.push(`synthetic_surfaces[${index}].status must be readiness_not_run`);
    }

    for (const field of ["operation", "output"]) {
      if (typeof surface[field] !== "string" || surface[field].length === 0) {
        errors.push(`synthetic_surfaces[${index}].${field} must be a non-empty string`);
      }
    }
  });

  for (const surfaceName of requiredSurfaces) {
    if (!names.has(surfaceName)) {
      errors.push(`missing synthetic surface ${surfaceName}`);
    }
  }

  return errors;
}

function validatePassConditions(value) {
  if (!Array.isArray(value) || value.length < 5) {
    return ["pass_conditions must contain OTLP export and D1 write/read/delete coverage"];
  }

  return [];
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json must contain scripts"];
  }

  if (value.scripts["check:observability-live-readiness"] !== "node scripts/check-observability-live-readiness.mjs") {
    errors.push("package.json must define check:observability-live-readiness");
  }

  if (value.scripts["smoke:observability-live"] !== "node scripts/smoke-observability-live.mjs") {
    errors.push("package.json must define smoke:observability-live");
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:observability-live-readiness")
  ) {
    errors.push("npm run check must include check:observability-live-readiness");
  }

  return errors;
}

function validateSmokeScript(value) {
  const errors = [];
  const requiredTokens = [
    "--dry-run",
    "OTLP_EXPORTER_OTLP_ENDPOINT",
    "OTLP_EXPORTER_OTLP_HEADERS",
    "CLOUDFLARE_D1_DATABASE_NAME",
    "resourceLogs",
    "wrangler",
    "d1",
    "execute",
    "aiphabee_eval_store_live_smoke",
    "eval_store_record_write_read_delete",
    "otlp_http_log_export",
    "endpoint_hash",
    "record_hash",
    "raw_output_hash"
  ];

  for (const token of requiredTokens) {
    if (!value.includes(token)) {
      errors.push(`smoke script must include ${token}`);
    }
  }

  for (const forbidden of ["raw_response:", "record_json:", "otlp_headers:"]) {
    if (value.includes(forbidden)) {
      errors.push(`smoke script must not emit ${forbidden}`);
    }
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
