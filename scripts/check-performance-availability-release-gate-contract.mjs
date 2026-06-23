#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/observability/performance-availability-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const migrationFile =
  "supabase/migrations/20260622005000_performance_availability_release_gate_scaffold.sql";
const requiredChecks = [
  "core_api_availability_target_met",
  "mcp_tool_p95_targets_met",
  "web_first_token_p95_target_met",
  "simple_research_completion_p95_target_met",
  "tool_success_rate_target_met",
  "slo_report_request_id_and_route_coverage_present",
  "live_apm_and_probe_writes_blocked"
];
const requiredOutputFields = ["slo_report", "release_checks", "release_gate", "validation"];
const requiredTables = [
  "aiphabee_core.performance_availability_release_gate",
  "aiphabee_audit.performance_slo_drill_event",
  "aiphabee_governance.performance_availability_release_gate_contract"
];
const requiredRoutes = ["/health", "/mcp", "/agent/runs/stream", "/agent/runs/plan"];
const requiredBlockers = [
  "live_apm_provider_missing",
  "live_probe_scheduler_missing",
  "slo_metric_store_missing",
  "load_test_run_artifact_missing",
  "frontend_first_token_live_measurement_missing",
  "ops_sre_signoff_missing"
];
const expectedTargets = {
  core_api_availability_bps: 9990,
  mcp_tool_cold_p95_ms: 2500,
  mcp_tool_hot_p95_ms: 800,
  mcp_tool_success_rate_bps: 9950,
  simple_research_completion_p95_ms: 15000,
  web_first_token_p95_ms: 2500
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
    observations: contract.synthetic_observations.length,
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

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-22.phase3.performance-availability-release-gate-scaffold.v0") {
    errors.push("version must match performance availability release gate scaffold version");
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

  if (value.route !== "POST /observability/release-gates/performance-availability/plan") {
    errors.push("route must be POST /observability/release-gates/performance-availability/plan");
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
    "live_apm_provider_reads",
    "live_probe_reads",
    "live_slo_store_writes",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  errors.push(...validateTargets(value.targets));
  errors.push(...validateObservations(value.synthetic_observations));
  errors.push(...validateStringArray(value.route_coverage, requiredRoutes, "route_coverage"));
  errors.push(
    ...validateStringArray(
      value.excluded_failure_categories,
      ["user_input_error", "authorization_denied"],
      "excluded_failure_categories"
    )
  );
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

function validateObservations(value) {
  if (!Array.isArray(value)) {
    return ["synthetic_observations must be an array"];
  }

  const errors = [];
  const observationsByMetric = new Map(
    value
      .filter((observation) => isRecord(observation) && typeof observation.metric_id === "string")
      .map((observation) => [observation.metric_id, observation])
  );

  for (const [metricId, targetValue] of Object.entries(expectedTargets)) {
    const observation = observationsByMetric.get(metricId);

    if (!isRecord(observation)) {
      errors.push(`synthetic_observations must include ${metricId}`);
      continue;
    }

    if (observation.target_value !== targetValue) {
      errors.push(`${metricId}.target_value must be ${targetValue}`);
    }

    if (!Number.isInteger(observation.observed_value) || observation.observed_value < 0) {
      errors.push(`${metricId}.observed_value must be a non-negative integer`);
    }

    if (observation.comparator === "at_least") {
      if (observation.observed_value < observation.target_value) {
        errors.push(`${metricId} observed_value must be at least target_value`);
      }
    } else if (observation.comparator === "at_most") {
      if (observation.observed_value > observation.target_value) {
        errors.push(`${metricId} observed_value must be at most target_value`);
      }
    } else {
      errors.push(`${metricId}.comparator must be at_least or at_most`);
    }

    if (!["basis_points", "milliseconds"].includes(observation.unit)) {
      errors.push(`${metricId}.unit must be basis_points or milliseconds`);
    }
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_performance_availability_validation") {
    errors.push("release_gate.gate_status must be blocked_live_performance_availability_validation");
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
    value.scripts["check:performance-availability-release-gate"] !==
    "node scripts/check-performance-availability-release-gate-contract.mjs"
  ) {
    return ["package.json must define check:performance-availability-release-gate"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("npm run check:performance-availability-release-gate")
  ) {
    return ["package.json check script must include check:performance-availability-release-gate"];
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
