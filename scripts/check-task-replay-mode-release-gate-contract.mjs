#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/task-replay-mode-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const requiredChecks = [
  "long_task_returns_task_id_and_resume_handle",
  "long_task_checkpoint_state_is_disconnect_safe",
  "saved_report_has_deterministic_replay_seed",
  "replay_preserves_old_report_snapshot",
  "newbie_professional_depth_preserves_data_contract",
  "mode_switch_changes_presentation_only"
];
const requiredOutputFields = [
  "workflow_resume_gate",
  "saved_report_replay_gate",
  "mode_invariant_gate",
  "release_checks",
  "validation"
];
const requiredTables = [
  "core.task_replay_mode_release_gate",
  "governance.task_replay_mode_release_gate_contract"
];
const requiredCoveredItems = [
  "long_task_resume",
  "saved_report_replay",
  "newbie_professional_mode_invariant"
];
const requiredBlockers = [
  "live_workflow_resume_execution_missing",
  "live_replay_job_execution_missing",
  "frontend_mode_switch_release_ui_missing"
];
const requiredLinkedContracts = [
  "deploy/agent/workflow-task.contract.json",
  "deploy/research/research-run-save.contract.json",
  "deploy/research/research-run-replay.contract.json",
  "deploy/agent/localized-response.contract.json",
  "deploy/database/migrations.contract.json"
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

  if (value.version !== "2026-06-21.phase3.task-replay-mode-release-gate-scaffold.v0") {
    errors.push("version must match task replay mode release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  for (const [field, expected] of [
    ["runtime_route", "GET /agent/runtime"],
    ["route", "POST /agent/release-gates/task-replay-mode/plan"],
    ["workflow_task_route", "POST /agent/workflows/tasks/plan"],
    ["workflow_resume_route", "GET /agent/workflows/tasks/:task_id"],
    ["research_save_route", "POST /research/runs/save/plan"],
    ["research_replay_route", "POST /research/runs/replay/plan"],
    ["localized_response_route", "POST /agent/runs/plan"]
  ]) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend_rendering",
    "persistent_writes",
    "live_db_writes",
    "live_queue_writes",
    "live_tool_execution",
    "live_workflow_execution",
    "model_calls",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(...validateWorkflowResumePolicy(value.workflow_resume_policy));
  errors.push(...validateSavedReportReplayPolicy(value.saved_report_replay_policy));
  errors.push(...validateModeInvariantPolicy(value.mode_invariant_policy));
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_3_items,
      requiredCoveredItems,
      "covered_sprint_3_3_items"
    )
  );
  errors.push(
    ...validateStringArray(value.linked_contracts, requiredLinkedContracts, "linked_contracts")
  );
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateLinkedContractFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateWorkflowResumePolicy(value) {
  if (!isRecord(value)) {
    return ["workflow_resume_policy must be an object"];
  }

  const errors = [];

  for (const field of [
    "task_id_visible",
    "resume_handle_required",
    "resumable",
    "disconnect_safe",
    "completion_notification_planned"
  ]) {
    if (value[field] !== true) {
      errors.push(`workflow_resume_policy.${field} must be true`);
    }
  }

  if (value.checkpoint_table !== "core.workflow_task_checkpoint") {
    errors.push("workflow_resume_policy.checkpoint_table must be core.workflow_task_checkpoint");
  }

  return errors;
}

function validateSavedReportReplayPolicy(value) {
  if (!isRecord(value)) {
    return ["saved_report_replay_policy must be an object"];
  }

  const errors = [];

  for (const field of [
    "deterministic_replay_seed_required",
    "old_report_immutable",
    "diff_summary_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`saved_report_replay_policy.${field} must be true`);
    }
  }

  for (const field of ["old_report_mutation_allowed", "silent_rewrite_allowed"]) {
    if (value[field] !== false) {
      errors.push(`saved_report_replay_policy.${field} must be false`);
    }
  }

  if (value.replay_execution_status !== "planned_no_write") {
    errors.push("saved_report_replay_policy.replay_execution_status must be planned_no_write");
  }

  return errors;
}

function validateModeInvariantPolicy(value) {
  if (!isRecord(value)) {
    return ["mode_invariant_policy must be an object"];
  }

  const errors = [];

  errors.push(
    ...validateStringArray(
      value.supported_response_depths,
      ["newbie", "professional"],
      "mode_invariant_policy.supported_response_depths"
    )
  );

  if (value.response_depth_changes_data !== false) {
    errors.push("mode_invariant_policy.response_depth_changes_data must be false");
  }

  for (const field of [
    "preserve_conclusion",
    "preserve_data_values",
    "preserve_source_record_ids",
    "preserve_methodology_versions",
    "preserve_evidence_card_refs",
    "newbie_adds_examples",
    "professional_can_show_raw_formula_and_source_fields"
  ]) {
    if (value[field] !== true) {
      errors.push(`mode_invariant_policy.${field} must be true`);
    }
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_task_replay_mode_validation") {
    errors.push("release_gate.gate_status must be blocked_live_task_replay_mode_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["product", "agent", "research", "operations"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validateLinkedContractFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  return value
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract file missing: ${path}`);
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:task-replay-mode-release-gate"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-task-replay-mode-release-gate-contract.mjs")
  ) {
    return ["check:task-replay-mode-release-gate script must run its contract checker"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("check:task-replay-mode-release-gate")
  ) {
    return ["root check script must include check:task-replay-mode-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file ===
        "supabase/migrations/20260621134000_task_replay_mode_release_gate_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include task replay mode release gate migration"];
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
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
