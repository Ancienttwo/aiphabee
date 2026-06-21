#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/observability/load-dr-incident-drill-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "supabase/migrations/20260622006000_load_dr_incident_drill_release_gate_scaffold.sql";
const requiredChecks = [
  "load_test_artifact_present",
  "load_test_targets_met",
  "dr_restore_rto_target_met",
  "dr_restore_rpo_target_met",
  "incident_drill_completed",
  "failover_rollback_plan_present",
  "communications_and_status_page_drill_present",
  "live_execution_and_persistent_writes_blocked"
];
const requiredOutputFields = ["drill_report", "release_checks", "release_gate", "validation"];
const requiredTables = [
  "core.load_dr_incident_drill_release_gate",
  "audit.load_dr_incident_drill_event",
  "governance.load_dr_incident_drill_release_gate_contract"
];
const requiredScenarios = [
  "load_test_peak_traffic",
  "database_restore",
  "worker_failover",
  "rollback",
  "incident_response",
  "status_comms"
];
const requiredBlockers = [
  "live_load_test_artifact_missing",
  "live_dr_restore_evidence_missing",
  "live_failover_execution_missing",
  "live_incident_drill_evidence_missing",
  "live_status_page_drill_missing",
  "ops_sre_product_signoff_missing"
];
const expectedTargets = {
  dr_rpo_minutes: 15,
  dr_rto_minutes: 60,
  load_test_max_error_rate_bps: 50,
  load_test_min_peak_rps: 100
};
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packageJsonPath);
const errors = validateContract(contract, databaseContract, packageJson);

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
    checks: contract.required_checks.length,
    route: contract.route,
    scenarios: contract.covered_scenarios.length,
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

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase3.load-dr-incident-drill-release-gate-scaffold.v0") {
    errors.push("version must match load DR incident drill release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/observability") {
    errors.push("package must be @aiphabee/observability");
  }

  if (value.runtime_route !== "GET /observability/runtime") {
    errors.push("runtime_route must be GET /observability/runtime");
  }

  if (value.route !== "POST /observability/release-gates/load-dr-incident-drill/plan") {
    errors.push("route must be POST /observability/release-gates/load-dr-incident-drill/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.event_contract !== "deploy/observability/events.contract.json") {
    errors.push("event_contract must be deploy/observability/events.contract.json");
  }

  if (value.target_source !== "docs/researches/AiphaBee_PRD_v1.0.md#12.1") {
    errors.push("target_source must point to PRD 12.1");
  }

  for (const field of [
    "frontend",
    "live_load_test_runner",
    "live_restore_execution",
    "live_incident_pager",
    "live_status_page_writes",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateTargets(value.targets));
  errors.push(...validateEvidence(value.synthetic_evidence));
  errors.push(...validateStringArray(value.covered_scenarios, requiredScenarios, "covered_scenarios"));
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateLinkedContractFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateTargets(value) {
  if (!isRecord(value)) {
    return ["targets must be an object"];
  }

  const errors = [];

  for (const [field, expected] of Object.entries(expectedTargets)) {
    if (value[field] !== expected) {
      errors.push(`targets.${field} must be ${expected}`);
    }
  }

  return errors;
}

function validateEvidence(value) {
  if (!isRecord(value)) {
    return ["synthetic_evidence must be an object"];
  }

  const errors = [];

  for (const field of [
    "communications_drill_completed",
    "incident_drill_completed",
    "load_test_completed",
    "restore_drill_completed"
  ]) {
    if (value[field] !== true) {
      errors.push(`synthetic_evidence.${field} must be true`);
    }
  }

  for (const field of [
    "failover_plan_id",
    "load_test_artifact_id",
    "rollback_plan_id",
    "status_page_drill_id"
  ]) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      errors.push(`synthetic_evidence.${field} must be a non-empty string`);
    }
  }

  if (!Number.isInteger(value.load_test_peak_rps) || value.load_test_peak_rps < 100) {
    errors.push("synthetic_evidence.load_test_peak_rps must be at least 100");
  }

  if (
    !Number.isInteger(value.load_test_error_rate_bps) ||
    value.load_test_error_rate_bps > 50
  ) {
    errors.push("synthetic_evidence.load_test_error_rate_bps must be at most 50");
  }

  if (!Number.isInteger(value.dr_rto_minutes) || value.dr_rto_minutes > 60) {
    errors.push("synthetic_evidence.dr_rto_minutes must be at most 60");
  }

  if (!Number.isInteger(value.dr_rpo_minutes) || value.dr_rpo_minutes > 15) {
    errors.push("synthetic_evidence.dr_rpo_minutes must be at most 15");
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_load_dr_incident_validation") {
    errors.push("release_gate.gate_status must be blocked_live_load_dr_incident_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["ops", "sre", "product"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validateLinkedContractFiles(paths) {
  const errors = [];

  if (!Array.isArray(paths)) {
    return ["linked_contracts must be an array"];
  }

  for (const path of paths) {
    if (typeof path !== "string") {
      errors.push("linked_contracts must contain only strings");
      continue;
    }

    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package.json scripts must be present"];
  }

  if (
    value.scripts["check:load-dr-incident-drill-release-gate"] !==
    "node scripts/check-load-dr-incident-drill-release-gate-contract.mjs"
  ) {
    return ["package.json must define check:load-dr-incident-drill-release-gate"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:load-dr-incident-drill-release-gate")
  ) {
    return ["package.json check script must include check:load-dr-incident-drill-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  if (!serialized.includes(migrationFile)) {
    errors.push(`database contract must include ${migrationFile}`);
  }

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
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
    .map((pattern) => `contract contains forbidden secret-like pattern ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
