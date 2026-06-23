#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/gateway/data-coverage-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredFreshnessTiers = ["realtime", "delayed", "eod"];
const requiredCoverageDomains = [
  "corporate_actions",
  "financial_restatements",
  "delistings",
  "identifier_history"
];
const requiredTables = [
  "aiphabee_core.data_coverage_release_gate",
  "aiphabee_governance.data_coverage_release_gate_contract"
];
const requiredOutputFields = [
  "freshness_markers",
  "coverage_domains",
  "release_gate",
  "validation"
];
const requiredBlockers = [
  "partner_coverage_files_missing",
  "live_freshness_policy_not_loaded",
  "golden_coverage_not_signed_off"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const errors = validateContract(contract, databaseContract);

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
    coverage_domains: contract.required_coverage_domains.length,
    freshness_tiers: contract.required_freshness_tiers.length,
    route: contract.route,
    status: "ok"
  },
  0
);

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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.data-coverage-release-gate-scaffold.v0") {
    errors.push("version must match the data coverage release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/data-access-gateway") {
    errors.push("package must be @aiphabee/data-access-gateway");
  }

  if (value.runtime_route !== "GET /gateway/runtime") {
    errors.push("runtime_route must be GET /gateway/runtime");
  }

  if (value.route !== "GET /gateway/data-coverage/release-gate") {
    errors.push("route must be GET /gateway/data-coverage/release-gate");
  }

  for (const field of [
    "frontend",
    "live_partner_data_reads",
    "coverage_policy_loaded",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_freshness_tiers,
      requiredFreshnessTiers,
      "required_freshness_tiers"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_coverage_domains,
      requiredCoverageDomains,
      "required_coverage_domains"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_partner_coverage") {
    errors.push("release_gate.gate_status must be blocked_live_partner_coverage");
  }

  if (value.live_partner_coverage_required !== true) {
    errors.push("release_gate.live_partner_coverage_required must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["data_engineering", "data_partner", "quality_owner"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validateDatabaseTables(databaseValue) {
  const migrations = isRecord(databaseValue) && Array.isArray(databaseValue.migrations)
    ? databaseValue.migrations
    : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file === "supabase/migrations/20260621130000_data_coverage_release_gate_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include data coverage release gate migration"];
  }

  return validateStringArray(migration.tables, requiredTables, "database migration tables");
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const errors = [];

  for (const required of requiredValues) {
    if (!value.includes(required)) {
      errors.push(`${label} must include ${required}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
