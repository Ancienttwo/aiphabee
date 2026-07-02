#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/compliance/licensed-advice-exploration.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const migrationPath = "deploy/database/migrations/20260622010000_licensed_advice_exploration_scaffold.sql";
const packageJsonPath = "package.json";
const runtimeSourcePath = "packages/licensed-advice-runtime/src/index.ts";
const runtimeTestPath = "packages/licensed-advice-runtime/src/index.test.ts";
const workerSourcePath = "apps/worker/src/index.ts";
const workerTestPath = "apps/worker/src/index.test.ts";
const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const migrationFile = "deploy/database/migrations/20260622010000_licensed_advice_exploration_scaffold.sql";
const requiredPhase4Items = [
  "持牌路径确认",
  "个性化建议探索",
  "suitability_controls",
  "supervised_advice_records"
];
const requiredSurfaces = [
  "personalized_buy_sell_hold",
  "portfolio_rebalance",
  "position_sizing",
  "suitability_based_recommendation",
  "licensed_partner_referral"
];
const requiredControls = [
  "type4_written_opinion",
  "licensed_entity_or_partner",
  "responsible_officer_supervision",
  "suitability_profile_controls",
  "advice_record_retention",
  "human_review_escalation",
  "kill_switch_policy",
  "complaint_handling_path"
];
const forbiddenUnlicensedOutputs = [
  "buy_sell_hold_recommendation",
  "target_position_size",
  "personalized_suitability_conclusion",
  "order_routing",
  "copy_trading_instruction"
];
const regulatorySourceUrls = [
  "https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Licensing/Do-you-need-a-licence-or-registration",
  "https://www.sfc.hk/en/Rules-and-standards/Suitability-requirement"
];
const requiredTables = [
  "aiphabee_core.licensed_advice_exploration",
  "aiphabee_core.suitability_control_profile",
  "aiphabee_audit.licensed_advice_review_event",
  "aiphabee_governance.licensed_advice_exploration_contract"
];
const requiredOutputFields = [
  "advice_output_policy",
  "legal_review",
  "licensed_path",
  "suitability_controls",
  "compliance_controls",
  "validation"
];
const requiredBlockedStatuses = [
  "blocked_missing_context",
  "blocked_supervision_controls_missing",
  "blocked_suitability_controls_missing",
  "blocked_unlicensed_path",
  "blocked_unsupported_surface"
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
const packageJson = readJson(packageJsonPath);
const sourceFiles = {
  migration: readText(migrationPath),
  runtime: readText(runtimeSourcePath),
  runtimeTest: readText(runtimeTestPath),
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
    supported_surfaces: contract.supported_surfaces.length
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
        status: "missing_file"
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

  if (value.version !== "2026-06-22.phase4.licensed-advice-exploration-scaffold.v0") {
    errors.push("version must match licensed advice exploration scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/licensed-advice-runtime") {
    errors.push("package must be @aiphabee/licensed-advice-runtime");
  }

  if (value.runtime_route !== "GET /compliance/licensed-advice/runtime") {
    errors.push("runtime_route must be GET /compliance/licensed-advice/runtime");
  }

  if (value.route !== "POST /compliance/licensed-advice/exploration/plan") {
    errors.push("route must be POST /compliance/licensed-advice/exploration/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "advice_generation_enabled",
    "live_model_execution",
    "order_execution",
    "persistent_writes",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.covered_phase4_items, requiredPhase4Items, "covered_phase4_items")
  );
  errors.push(...validateStringArray(value.supported_surfaces, requiredSurfaces, "supported_surfaces"));
  errors.push(...validateStringArray(value.required_controls, requiredControls, "required_controls"));
  errors.push(
    ...validateStringArray(
      value.forbidden_unlicensed_outputs,
      forbiddenUnlicensedOutputs,
      "forbidden_unlicensed_outputs"
    )
  );
  errors.push(
    ...validateStringArray(value.regulatory_source_urls, regulatorySourceUrls, "regulatory_source_urls")
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(value.required_output_fields, requiredOutputFields, "required_output_fields")
  );
  errors.push(...validateStringArray(value.blocked_statuses, requiredBlockedStatuses, "blocked_statuses"));
  errors.push(...validateSecurityContract(value.security_contract));
  errors.push(...validateIntegrationRoutes(value.integration_routes));
  errors.push(...validateDatabaseMigration(databaseValue));
  errors.push(...validateMigrationText(sourceFilesValue.migration));
  errors.push(...validatePackageScripts(packageValue));
  errors.push(...validateSourceTokens(sourceFilesValue));
  errors.push(...validateTrackerSync(sourceFilesValue.tracker));
  errors.push(...validateNoSensitiveLiterals(value));

  return errors;
}

function validateSecurityContract(value) {
  if (!isRecord(value)) {
    return ["security_contract must be an object"];
  }

  const errors = [];

  for (const field of [
    "type4_written_opinion_required",
    "licensed_entity_required",
    "responsible_officer_supervision_required",
    "suitability_controls_required",
    "advice_record_retention_required",
    "human_review_required",
    "kill_switch_required",
    "complaint_handling_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`security_contract.${field} must be true`);
    }
  }

  for (const field of [
    "advice_generation_enabled",
    "order_execution",
    "live_model_execution",
    "persistent_writes",
    "raw_risk_profile_stored",
    "raw_personal_contact_stored"
  ]) {
    if (value[field] !== false) {
      errors.push(`security_contract.${field} must be false`);
    }
  }

  return errors;
}

function validateIntegrationRoutes(value) {
  if (!isRecord(value)) {
    return ["integration_routes must be an object"];
  }

  const expected = {
    answer_evidence: "POST /agent/runs/validate-answer",
    compliance_release_gate: "POST /public/release-gates/compliance-ops/plan",
    kill_switch: "POST /agent/kill-switch/plan",
    plan: "POST /compliance/licensed-advice/exploration/plan",
    runtime: "GET /compliance/licensed-advice/runtime"
  };
  const errors = [];

  for (const [field, route] of Object.entries(expected)) {
    if (value[field] !== route) {
      errors.push(`integration_routes.${field} must be ${route}`);
    }
  }

  return errors;
}

function validateDatabaseMigration(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.migrations)) {
    return ["database migrations contract must include migrations"];
  }

  const migration = value.migrations.find(
    (item) => isRecord(item) && item.file === migrationFile
  );

  if (!isRecord(migration)) {
    return [`database migrations contract must include ${migrationFile}`];
  }

  errors.push(...validateStringArray(migration.tables, requiredTables, "migration.tables"));

  if (migration.default_rights_status !== "default_deny") {
    errors.push("licensed advice exploration migration must preserve default_deny");
  }

  if (migration.market_data !== false) {
    errors.push("licensed advice exploration migration market_data must be false");
  }

  return errors;
}

function validateMigrationText(value) {
  const errors = [];

  for (const token of [
    "create table if not exists aiphabee_core.licensed_advice_exploration",
    "create table if not exists aiphabee_core.suitability_control_profile",
    "create table if not exists aiphabee_audit.licensed_advice_review_event",
    "create table if not exists aiphabee_governance.licensed_advice_exploration_contract",
    "default 'default_deny'",
    "advice_generation_enabled boolean not null default false",
    "order_execution_enabled boolean not null default false",
    "live_model_execution_enabled boolean not null default false",
    "persistent_write_enabled boolean not null default false",
    "raw_risk_profile_stored boolean not null default false",
    "raw_personal_contact_stored boolean not null default false"
  ]) {
    if (!value.includes(token)) {
      errors.push(`migration must include ${token}`);
    }
  }

  return errors;
}

function validatePackageScripts(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:licensed-advice-exploration"];
  const check = value.scripts.check;

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-licensed-advice-exploration-contract.mjs")
  ) {
    errors.push("check:licensed-advice-exploration must run its contract checker");
  }

  if (typeof check !== "string" || !check.includes("check:licensed-advice-exploration")) {
    errors.push("root check script must include check:licensed-advice-exploration");
  }

  return errors;
}

function validateSourceTokens(value) {
  const errors = [];
  const requiredByFile = {
    runtime: [
      "LICENSED_ADVICE_RUNTIME_VERSION",
      "createLicensedAdviceExplorationPlan",
      "getLicensedAdviceRuntimeCapabilities",
      "FORBIDDEN_UNLICENSED_ADVICE_OUTPUTS",
      "blocked_unlicensed_path",
      "advice_output_policy"
    ],
    runtimeTest: [
      "reports runtime capabilities with advice generation disabled",
      "plans licensed advice exploration without generating advice output",
      "blocks exploration when the licensed path is not confirmed"
    ],
    worker: [
      'app.get("/compliance/licensed-advice/runtime"',
      'app.post("/compliance/licensed-advice/exploration/plan"',
      "createLicensedAdviceExplorationPlan",
      "getLicensedAdviceRuntimeCapabilities",
      "advice_record_retention_policy_id"
    ],
    workerTest: [
      "serves licensed advice runtime with advice generation disabled",
      "plans licensed advice exploration without generating advice or orders",
      "blocks licensed advice exploration until the licensed path is confirmed"
    ]
  };

  for (const [fileKey, tokens] of Object.entries(requiredByFile)) {
    const text = value[fileKey];

    if (typeof text !== "string") {
      errors.push(`${fileKey} source missing`);
      continue;
    }

    for (const token of tokens) {
      if (!text.includes(token)) {
        errors.push(`${fileKey} must include ${token}`);
      }
    }
  }

  return errors;
}

function validateTrackerSync(tracker) {
  const errors = [];

  if (!tracker.includes("- [x] 持牌路径确认后探索个性化建议能力")) {
    errors.push("tracker must mark licensed advice exploration phase4 item complete");
  }

  if (!tracker.includes("npm run check:licensed-advice-exploration")) {
    errors.push("tracker licensed advice row must reference check:licensed-advice-exploration");
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

function validateNoSensitiveLiterals(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract contains forbidden sensitive-like pattern ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}
