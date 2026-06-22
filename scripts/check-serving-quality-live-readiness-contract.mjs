#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/governance/serving-quality-live-readiness.contract.json";
const packageJsonPath = "package.json";
const gatewaySourcePath = "packages/data-access-gateway/src/index.ts";
const gatewayTestPath = "packages/data-access-gateway/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const requiredQualityStates = ["PASS", "WARN", "HOLD", "REJECT_RAW"];
const requiredScenarios = [
  "pass_snapshot_released_deferred_execution",
  "warn_snapshot_released_with_warning",
  "hold_snapshot_isolated_before_sql",
  "reject_raw_snapshot_withdrawn_before_sql"
];
const requiredReadinessChecks = [
  "release_mapping_passed",
  "gateway_quality_hold_guard_passed",
  "sql_execution_guard_passed",
  "no_blocked_quality_sql_execution",
  "no_live_reads_or_writes"
];
const activationBlockers = [
  "partner_serving_rows_absent",
  "live_hyperdrive_execution_disabled",
  "quality_owner_cutover_not_approved"
];
const requiredSignoffs = ["data_engineering", "data_partner", "quality_owner"];
const requiredTables = [
  "core.serving_dataset",
  "core.serving_field",
  "core.serving_snapshot",
  "core.serving_record"
];
const linkedContracts = [
  "deploy/gateway/access.contract.json",
  "deploy/database/migrations.contract.json",
  "deploy/governance/field-rights-live-policy-source.contract.json"
];
const forbiddenTextPatterns = [
  /(?:^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  gateway: readText(gatewaySourcePath),
  gatewayTest: readText(gatewayTestPath),
  tracker: readText(trackerPath),
  worker: readText(workerSourcePath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(contract, packageJson, sourceFiles);

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
    route: contract.route,
    smoke_scenarios: contract.expected_row_counts.smoke_scenarios,
    status: "ok"
  },
  0
);

function validateContract(value, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  expectEqual(
    errors,
    value.version,
    "2026-06-22.phase1.serving-quality-live-readiness.v0",
    "version"
  );
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.tracker_item, "DAT-06 serving quality live readiness", "tracker_item");
  expectEqual(errors, value.package, "@aiphabee/data-access-gateway", "package");
  expectEqual(errors, value.runtime_route, "GET /gateway/runtime", "runtime_route");
  expectEqual(errors, value.route, "GET /gateway/serving-quality/live-readiness", "route");
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");
  expectEqual(
    errors,
    value.fixture_version,
    "serving-quality-live-readiness@quality-release-fixture-v0",
    "fixture_version"
  );

  for (const field of [
    "frontend",
    "live_partner_rows_loaded",
    "live_serving_reads",
    "live_serving_sql_execution",
    "persistent_writes",
    "sql_executed"
  ]) {
    expectEqual(errors, value[field], false, field);
  }

  expectArray(errors, value.covered_prd_items, ["DAT-06"], "covered_prd_items");
  expectArray(errors, value.required_quality_states, requiredQualityStates, "required_quality_states");
  expectArray(errors, value.required_scenarios, requiredScenarios, "required_scenarios");
  expectArray(
    errors,
    value.required_readiness_checks,
    requiredReadinessChecks,
    "required_readiness_checks"
  );
  expectArray(errors, value.tables, requiredTables, "tables");
  expectArray(errors, value.linked_contracts, linkedContracts, "linked_contracts");
  errors.push(...validateActivation(value.activation));
  errors.push(...validateExpectedCounts(value.expected_row_counts));
  for (const path of linkedContracts) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }
  errors.push(...validatePackage(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateActivation(value) {
  if (!isRecord(value)) {
    return ["activation must be an object"];
  }

  const errors = [];
  expectEqual(errors, value.status, "blocked_live_serving_activation", "activation.status");
  expectArray(errors, value.blockers, activationBlockers, "activation.blockers");
  expectArray(errors, value.required_signoffs, requiredSignoffs, "activation.required_signoffs");
  return errors;
}

function validateExpectedCounts(value) {
  if (!isRecord(value)) {
    return ["expected_row_counts must be an object"];
  }

  const errors = [];
  expectEqual(errors, value.quality_states, 4, "expected_row_counts.quality_states");
  expectEqual(errors, value.blocked_quality_states, 2, "expected_row_counts.blocked_quality_states");
  expectEqual(errors, value.smoke_scenarios, 4, "expected_row_counts.smoke_scenarios");
  return errors;
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};
  const checkCommand = "node scripts/check-serving-quality-live-readiness-contract.mjs";

  if (scripts["check:serving-quality-live-readiness"] !== checkCommand) {
    errors.push("package.json scripts.check:serving-quality-live-readiness mismatch");
  }

  if (!String(scripts.check ?? "").includes("npm run check:serving-quality-live-readiness")) {
    errors.push("package.json scripts.check must include check:serving-quality-live-readiness");
  }

  return errors;
}

function validateSourceTokens(sourceFilesValue) {
  const errors = [];

  for (const token of [
    "SERVING_QUALITY_LIVE_READINESS_VERSION",
    "SERVING_QUALITY_LIVE_READINESS_FIXTURE_VERSION",
    "getServingQualityLiveReadinessCapabilities",
    "createServingQualityLiveReadinessReport",
    "SERVING_QUALITY_LIVE_READINESS_FIXTURES",
    "serving_quality_live_readiness_passed"
  ]) {
    if (!sourceFilesValue.gateway.includes(token)) {
      errors.push(`gateway source missing ${token}`);
    }
  }

  for (const scenario of requiredScenarios) {
    if (!sourceFilesValue.gateway.includes(scenario)) {
      errors.push(`gateway source missing scenario ${scenario}`);
    }
    if (!sourceFilesValue.gatewayTest.includes(scenario)) {
      errors.push(`gateway test missing scenario ${scenario}`);
    }
  }

  for (const token of [
    "getServingQualityLiveReadinessCapabilities",
    "createServingQualityLiveReadinessReport",
    "gateway_quality_hold_guard_passed: true",
    "no_blocked_quality_sql_execution: true",
    "blocked_quality_states: 2"
  ]) {
    if (!sourceFilesValue.gatewayTest.includes(token)) {
      errors.push(`gateway test missing ${token}`);
    }
  }

  for (const token of [
    'app.get("/gateway/serving-quality/live-readiness"',
    "getServingQualityLiveReadinessCapabilities",
    "createServingQualityLiveReadinessReport",
    "serving_quality_live_readiness"
  ]) {
    if (!sourceFilesValue.worker.includes(token)) {
      errors.push(`worker source missing ${token}`);
    }
  }

  for (const token of [
    "/gateway/serving-quality/live-readiness",
    "ServingQualityLiveReadinessBody",
    "serving_quality_live_readiness_passed",
    "smoke_count: 4"
  ]) {
    if (!sourceFilesValue.workerTest.includes(token)) {
      errors.push(`worker test missing ${token}`);
    }
  }

  if (!/^\|\s+DAT-06\b.*\|\s*☑\s*\|/mu.test(sourceFilesValue.tracker)) {
    errors.push("DAT-06 must be checked in §M traceability matrix");
  }
  if (!sourceFilesValue.tracker.includes("serving-quality-live-readiness")) {
    errors.push("tracker must mention serving-quality-live-readiness");
  }

  return errors;
}

function expectArray(errors, value, requiredValues, name) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${name} must be a string array`);
    return;
  }

  for (const requiredValue of requiredValues) {
    if (!value.includes(requiredValue)) {
      errors.push(`${name} must include ${requiredValue}`);
    }
  }
}

function expectEqual(errors, actual, expected, name) {
  if (actual !== expected) {
    errors.push(`${name} must be ${String(expected)}`);
  }
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `contract contains forbidden secret-like pattern: ${pattern}`);
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
        status: "missing_text"
      },
      1
    );
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
