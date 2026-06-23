#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/saved-screening-schedule.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const analyticsSourcePath = "packages/analytics-tools/src/index.ts";
const analyticsTestPath = "packages/analytics-tools/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const migrationPath = "supabase/migrations/20260622013000_saved_screening_schedule_scaffold.sql";
const requiredItems = ["ANA-05", "US-W05", "US-W10"];
const requiredTools = ["screen_securities", "plan_high_cost_analytics"];
const requiredLinkedContracts = [
  "deploy/analytics/screen-securities.contract.json",
  "deploy/analytics/high-cost-analytics-queue.contract.json",
  "deploy/agent/workflow-task.contract.json",
  "deploy/database/migrations.contract.json"
];
const requiredCadences = ["manual", "daily", "weekly"];
const requiredStatuses = [
  "planned_no_write",
  "blocked_missing_workspace",
  "blocked_missing_owner",
  "blocked_empty_screen",
  "blocked_missing_schedule",
  "blocked_future_data"
];
const requiredInputs = [
  "workspace_id",
  "owner_user_id",
  "request_id",
  "natural_language_or_conditions",
  "cadence",
  "next_run_at_for_periodic"
];
const requiredOutputFields = [
  "saved_screening",
  "schedule",
  "periodic_run_policy",
  "source_screen",
  "persistence_plan",
  "validation"
];
const requiredTables = [
  "aiphabee_core.saved_screening",
  "aiphabee_core.saved_screening_run_schedule",
  "aiphabee_core.saved_screening_run",
  "aiphabee_governance.saved_screening_schedule_contract"
];
const forbiddenTextPatterns = [
  /(?:^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  analytics: readText(analyticsSourcePath),
  analyticsTest: readText(analyticsTestPath),
  migration: readText(migrationPath),
  tracker: readText(trackerPath),
  worker: readText(workerSourcePath),
  workerTest: readText(workerTestPath)
};
const errors = validateContract(contract, databaseContract, packageJson, sourceFiles);

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
    status: "ok",
    tool_name: contract.tool_name
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

function validateContract(value, databaseValue, packageValue, sourceFilesValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  expectEqual(errors, value.version, "2026-06-22.phase2.saved-screening-schedule-scaffold.v0", "version");
  expectEqual(errors, value.status, "local_contract", "status");
  expectEqual(errors, value.package, "@aiphabee/analytics-tools", "package");
  expectEqual(errors, value.runtime_route, "GET /analytics/runtime", "runtime_route");
  expectEqual(errors, value.route, "POST /analytics/saved-screenings/plan", "route");
  expectEqual(errors, value.tool_name, "plan_saved_screening", "tool_name");
  expectEqual(errors, value.standard_response_envelope, true, "standard_response_envelope");

  for (const field of [
    "frontend",
    "live_data_access",
    "live_execution",
    "live_db_writes",
    "persistent_writes",
    "workflow_execution",
    "queue_writes",
    "sql_emitted"
  ]) {
    expectEqual(errors, value[field], false, field);
  }

  expectArray(errors, value.covered_prd_items, requiredItems, "covered_prd_items");
  expectArray(errors, value.source_tools, requiredTools, "source_tools");
  expectArray(errors, value.linked_contracts, requiredLinkedContracts, "linked_contracts");
  for (const path of requiredLinkedContracts) {
    if (!existsSync(resolve(process.cwd(), path))) {
      errors.push(`linked contract missing: ${path}`);
    }
  }
  expectArray(errors, value.supported_cadences, requiredCadences, "supported_cadences");
  expectArray(errors, value.expected_statuses, requiredStatuses, "expected_statuses");
  expectArray(errors, value.required_inputs, requiredInputs, "required_inputs");
  expectArray(errors, value.required_output_fields, requiredOutputFields, "required_output_fields");
  expectArray(errors, value.tables, requiredTables, "tables");
  errors.push(...validateSavedScreeningContract(value.saved_screening_contract));
  errors.push(...validateDatabase(databaseValue));
  errors.push(...validatePackage(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateSavedScreeningContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["saved_screening_contract must be an object"];
  }

  expectEqual(errors, value.source_tool, "screen_securities", "saved_screening_contract.source_tool");
  expectEqual(
    errors,
    value.screen_route,
    "POST /analytics/screen-securities",
    "saved_screening_contract.screen_route"
  );
  expectEqual(
    errors,
    value.high_cost_queue_route,
    "POST /analytics/high-cost/plan",
    "saved_screening_contract.high_cost_queue_route"
  );
  expectEqual(
    errors,
    value.workflow_binding,
    "AIPHABEE_RESEARCH_WORKFLOW",
    "saved_screening_contract.workflow_binding"
  );
  expectEqual(errors, value.event_queue, "AIPHABEE_EVENTS_QUEUE", "saved_screening_contract.event_queue");
  expectEqual(errors, value.default_timezone, "Asia/Hong_Kong", "saved_screening_contract.default_timezone");

  for (const field of [
    "parsed_conditions_required",
    "point_in_time_re_evaluation",
    "requires_workspace",
    "requires_owner_user",
    "schedule_enablement_explicit",
    "idempotency_key_required"
  ]) {
    expectEqual(errors, value[field], true, `saved_screening_contract.${field}`);
  }

  return errors;
}

function validateDatabase(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  if (!serialized.includes(migrationPath)) {
    errors.push(`database contract must include ${migrationPath}`);
  }

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
    }
  }

  return errors;
}

function validatePackage(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (scripts["check:saved-screening"] !== "node scripts/check-saved-screening-contract.mjs") {
    errors.push("package.json scripts.check:saved-screening must run the saved screening checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:saved-screening")) {
    errors.push("package.json scripts.check must include npm run check:saved-screening");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];

  for (const token of [
    "SAVED_SCREENING_VERSION",
    "createSavedScreeningPlan",
    "getSavedScreeningCapabilities",
    "POST /analytics/saved-screenings/plan"
  ]) {
    if (!value.analytics.includes(token)) {
      errors.push(`analytics source must include ${token}`);
    }
  }

  for (const token of ["createSavedScreeningPlan", "getSavedScreeningCapabilities"]) {
    if (!value.analyticsTest.includes(token)) {
      errors.push(`analytics test must include ${token}`);
    }
  }

  for (const token of [
    "createSavedScreeningPlan",
    "getSavedScreeningCapabilities",
    "/analytics/saved-screenings/plan"
  ]) {
    if (!value.worker.includes(token)) {
      errors.push(`worker source must include ${token}`);
    }
  }

  for (const token of ["/analytics/saved-screenings/plan", "saved_screening"]) {
    if (!value.workerTest.includes(token)) {
      errors.push(`worker test must include ${token}`);
    }
  }

  if (!value.tracker.includes("| ANA-05 保存筛选/定期运行 | P1 | 2.4 | ☑ |")) {
    errors.push("tracker must mark ANA-05 complete in §M");
  }

  if (!value.migration.includes("create table if not exists aiphabee_core.saved_screening")) {
    errors.push("migration must create aiphabee_core.saved_screening");
  }

  if (!value.analytics.includes("workflow_execution: false")) {
    errors.push("analytics source must keep workflow_execution false");
  }

  if (!value.worker.includes("saved_screening: savedScreeningCapability")) {
    errors.push("worker runtime must expose saved_screening capability");
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
    errors.push(`${name} must be ${JSON.stringify(expected)}`);
  }
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
