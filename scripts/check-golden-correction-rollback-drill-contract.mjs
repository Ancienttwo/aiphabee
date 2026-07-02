#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/research/golden-correction-rollback-drill.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const goldenManifestPath = "tests/golden/manifest.json";
const toolGoldenManifestPath = "tests/golden/tools/manifest.json";
const packageJsonPath = "package.json";
const requiredSteps = [
  "golden_fixture_gate",
  "correction_event_plan",
  "affected_report_mark",
  "user_notification_plan",
  "rollback_replay_plan"
];
const requiredOutputFields = [
  "golden_fixture_gate",
  "correction_notification_plan",
  "rollback_replay_plan",
  "drill_steps",
  "validation"
];
const requiredTables = [
  "aiphabee_core.golden_correction_rollback_drill",
  "aiphabee_governance.golden_correction_rollback_drill_contract",
  "aiphabee_core.data_correction_event",
  "aiphabee_core.research_run_correction_impact"
];
const newMigrationTables = [
  "aiphabee_core.golden_correction_rollback_drill",
  "aiphabee_governance.golden_correction_rollback_drill_contract"
];
const requiredCoveredItems = [
  "golden_samples_pass",
  "data_correction_rollback_drill"
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
const goldenManifest = readJson(goldenManifestPath);
const toolGoldenManifest = readJson(toolGoldenManifestPath);
const packageJson = readJson(packageJsonPath);
const errors = validateContract({
  contract,
  databaseContract,
  goldenManifest,
  packageJson,
  toolGoldenManifest
});

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
    golden_samples: goldenManifest.samples.length,
    route: contract.route,
    status: "ok",
    tool_golden_samples: toolGoldenManifest.samples.length
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

function validateContract({
  contract: value,
  databaseContract: databaseValue,
  goldenManifest: goldenValue,
  packageJson: packageValue,
  toolGoldenManifest: toolGoldenValue
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.golden-correction-rollback-drill-scaffold.v0") {
    errors.push("version must match golden correction rollback drill scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/research-runtime") {
    errors.push("package must be @aiphabee/research-runtime");
  }

  if (value.runtime_route !== "GET /research/runtime") {
    errors.push("runtime_route must be GET /research/runtime");
  }

  if (value.route !== "POST /research/golden-correction-rollback-drill/plan") {
    errors.push("route must be POST /research/golden-correction-rollback-drill/plan");
  }

  if (value.tool_name !== "plan_golden_correction_rollback_drill") {
    errors.push("tool_name must be plan_golden_correction_rollback_drill");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend_rendering",
    "persistent_writes",
    "live_db_writes",
    "queue_writes",
    "live_rollback_execution",
    "sql_emitted",
    "production_partner_corpus_loaded",
    "old_report_mutation_allowed",
    "silent_rewrite_allowed"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.golden_fixture_command !== "npm run test:golden") {
    errors.push("golden_fixture_command must be npm run test:golden");
  }

  if (value.golden_manifest_path !== goldenManifestPath) {
    errors.push(`golden_manifest_path must be ${goldenManifestPath}`);
  }

  if (value.tool_golden_manifest_path !== toolGoldenManifestPath) {
    errors.push(`tool_golden_manifest_path must be ${toolGoldenManifestPath}`);
  }

  if (value.required_golden_sample_count !== 8) {
    errors.push("required_golden_sample_count must be 8");
  }

  if (value.required_tool_golden_sample_count !== toolGoldenValue.samples.length) {
    errors.push("required_tool_golden_sample_count must match tool golden manifest samples");
  }

  if (value.required_quality_rule_count !== 12) {
    errors.push("required_quality_rule_count must be 12");
  }

  if (value.quality_rules_version !== "quality_rules_v0") {
    errors.push("quality_rules_version must be quality_rules_v0");
  }

  errors.push(...validateStringArray(value.required_steps, requiredSteps, "required_steps"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_3_items,
      requiredCoveredItems,
      "covered_sprint_3_3_items"
    )
  );
  errors.push(...validateGoldenManifest(goldenValue, value));
  errors.push(...validateToolGoldenManifest(toolGoldenValue, value));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateGoldenManifest(value, contract) {
  const errors = [];

  if (!isRecord(value)) {
    return ["golden manifest must be an object"];
  }

  if (value.version !== "golden-fixtures-version=2026-06-20.phase0.v0") {
    errors.push("golden manifest version must match the contract baseline");
  }

  if (value.version !== contract.golden_fixture_version && contract.golden_fixture_version !== undefined) {
    errors.push("golden_fixture_version must match golden manifest version");
  }

  if (value.quality_rules_version !== "quality_rules_v0") {
    errors.push("golden manifest quality_rules_version must be quality_rules_v0");
  }

  if (!Array.isArray(value.samples)) {
    errors.push("golden manifest samples must be an array");
  } else if (value.samples.length !== contract.required_golden_sample_count) {
    errors.push(`golden manifest must contain ${contract.required_golden_sample_count} samples`);
  }

  return errors;
}

function validateToolGoldenManifest(value, contract) {
  const errors = [];

  if (!isRecord(value)) {
    return ["tool golden manifest must be an object"];
  }

  if (!Array.isArray(value.samples)) {
    errors.push("tool golden manifest samples must be an array");
  } else if (value.samples.length !== contract.required_tool_golden_sample_count) {
    errors.push(
      `tool golden manifest must contain ${contract.required_tool_golden_sample_count} samples`
    );
  }

  return errors;
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["test:golden"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-golden-regression.mjs --require-fixtures")
  ) {
    return ["test:golden must run the strict golden regression fixture gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const serialized = JSON.stringify(value);
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file ===
        "deploy/database/migrations/20260621131000_golden_correction_rollback_drill_scaffold.sql"
  );
  const errors = [];

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
    }
  }

  if (!isRecord(migration)) {
    errors.push("database contract must include golden correction rollback drill migration");
    return errors;
  }

  errors.push(
    ...validateStringArray(migration.tables, newMigrationTables, "database migration tables")
  );

  return errors;
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
