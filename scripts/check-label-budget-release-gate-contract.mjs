#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/label-budget-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const requiredClaimLabels = ["fact", "calculation", "inference", "unknown"];
const requiredChecks = [
  "fact_label_requires_evidence_card",
  "inference_label_requires_evidence_strength",
  "unknown_label_requires_missing_reason",
  "high_cost_task_requires_budget_estimate",
  "high_cost_task_requires_confirmation_before_enqueue",
  "high_cost_usage_reservation_pre_debit_and_refund"
];
const requiredOutputFields = [
  "claim_label_gate",
  "high_cost_budget_gate",
  "release_checks",
  "validation"
];
const requiredTables = [
  "aiphabee_core.agent_label_budget_release_gate",
  "aiphabee_governance.agent_label_budget_release_gate_contract"
];
const requiredCoveredItems = ["claim_labels_effective", "high_cost_budget_confirmation"];
const requiredBlockers = [
  "actual_generated_answer_label_parser_missing",
  "frontend_budget_confirmation_ui_missing",
  "live_high_cost_queue_execution_missing"
];
const requiredLinkedContracts = [
  "deploy/agent/answer-evidence-contract.contract.json",
  "deploy/analytics/high-cost-analytics-queue.contract.json",
  "deploy/usage/high-cost-reservation.contract.json",
  "deploy/database/migrations.contract.json"
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

  if (value.version !== "2026-06-21.phase3.agent-label-budget-release-gate-scaffold.v0") {
    errors.push("version must match Agent label budget release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  if (value.route !== "POST /agent/release-gates/label-budget/plan") {
    errors.push("route must be POST /agent/release-gates/label-budget/plan");
  }

  if (value.tool_loop_route !== "POST /agent/runs/plan") {
    errors.push("tool_loop_route must be POST /agent/runs/plan");
  }

  if (value.analytics_high_cost_route !== "POST /analytics/high-cost/plan") {
    errors.push("analytics_high_cost_route must be POST /analytics/high-cost/plan");
  }

  if (value.usage_reservation_route !== "POST /usage/high-cost/reservation/plan") {
    errors.push("usage_reservation_route must be POST /usage/high-cost/reservation/plan");
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
    "live_ledger_writes",
    "model_calls",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(value.required_claim_labels, requiredClaimLabels, "required_claim_labels")
  );
  errors.push(...validateClaimLabelRequirements(value.claim_label_requirements));
  errors.push(...validateHighCostPolicy(value.high_cost_policy));
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

function validateClaimLabelRequirements(value) {
  if (!isRecord(value)) {
    return ["claim_label_requirements must be an object"];
  }

  const errors = [];

  for (const field of [
    "fact_requires_evidence_card",
    "calculation_requires_calculation_ref",
    "inference_requires_evidence_strength",
    "unknown_requires_missing_reason"
  ]) {
    if (value[field] !== true) {
      errors.push(`claim_label_requirements.${field} must be true`);
    }
  }

  if (value.confidence_score_display !== false) {
    errors.push("claim_label_requirements.confidence_score_display must be false");
  }

  return errors;
}

function validateHighCostPolicy(value) {
  if (!isRecord(value)) {
    return ["high_cost_policy must be an object"];
  }

  const errors = [];

  if (value.high_cost_threshold !== 8) {
    errors.push("high_cost_policy.high_cost_threshold must be 8");
  }

  for (const field of [
    "budget_estimate_required",
    "requires_confirmation_before_enqueue",
    "independent_concurrency_pool",
    "ordinary_pool_protected",
    "pre_debit_required",
    "failure_refund_required",
    "usage_ledger_link_required"
  ]) {
    if (value[field] !== true) {
      errors.push(`high_cost_policy.${field} must be true`);
    }
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_label_budget_validation") {
    errors.push("release_gate.gate_status must be blocked_live_label_budget_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["product", "agent", "analytics", "billing"],
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

  const script = value.scripts["check:label-budget-release-gate"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-label-budget-release-gate-contract.mjs")
  ) {
    return ["check:label-budget-release-gate script must run its contract checker"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("check:label-budget-release-gate")
  ) {
    return ["root check script must include check:label-budget-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file ===
        "supabase/migrations/20260621133000_agent_label_budget_release_gate_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include Agent label budget release gate migration"];
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
