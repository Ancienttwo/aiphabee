#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/product-agent-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const requiredChecks = [
  "ambiguous_security_blocks_tool_planning",
  "silent_security_selection_blocked",
  "numeric_claim_requires_tool_result_or_calculation_ref",
  "post_generation_unsourced_numeric_claim_blocked",
  "answer_contract_blocks_unsourced_numbers",
  "deterministic_calculations_keep_model_out"
];
const requiredOutputFields = [
  "ambiguous_security_gate",
  "numeric_evidence_gate",
  "answer_contract_gate",
  "post_generation_evidence_binding",
  "release_checks",
  "validation"
];
const requiredTables = [
  "aiphabee_core.product_agent_release_gate",
  "aiphabee_governance.product_agent_release_gate_contract"
];
const requiredAllowedNumericSources = ["tool_result", "deterministic_calculation"];
const requiredBlockedNumericSources = [
  "model_memory",
  "training_data",
  "unverified_prompt",
  "unstated_source"
];
const requiredClaimLabels = ["fact", "calculation", "inference", "unknown"];
const requiredCoveredItems = [
  "security_ambiguity_no_silent_selection",
  "numeric_claims_evidence_bound"
];
const requiredBlockers = ["live_evidence_binding_missing", "frontend_clarification_ui_missing"];
const requiredLinkedContracts = [
  "deploy/agent/pre-tool-call-resolution.contract.json",
  "deploy/agent/numeric-source-guard.contract.json",
  "deploy/agent/answer-evidence-contract.contract.json",
  "deploy/governance/post-generation-evidence-binding.contract.json",
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

  if (value.version !== "2026-06-21.phase3.product-agent-release-gate-scaffold.v0") {
    errors.push("version must match product Agent release gate scaffold version");
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

  if (value.route !== "POST /agent/release-gates/product-agent/plan") {
    errors.push("route must be POST /agent/release-gates/product-agent/plan");
  }

  if (value.preflight_route !== "POST /agent/runs/preflight") {
    errors.push("preflight_route must be POST /agent/runs/preflight");
  }

  if (value.tool_loop_route !== "POST /agent/runs/plan") {
    errors.push("tool_loop_route must be POST /agent/runs/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend_rendering",
    "persistent_writes",
    "live_db_writes",
    "live_tool_execution",
    "model_calls",
    "sql_emitted",
    "silent_security_selection_allowed",
    "concrete_numbers_allowed_without_sources"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (value.ambiguous_security_must_block_tool_planning !== true) {
    errors.push("ambiguous_security_must_block_tool_planning must be true");
  }

  errors.push(
    ...validateStringArray(
      value.numeric_allowed_sources,
      requiredAllowedNumericSources,
      "numeric_allowed_sources"
    )
  );
  errors.push(
    ...validateStringArray(
      value.numeric_blocked_sources,
      requiredBlockedNumericSources,
      "numeric_blocked_sources"
    )
  );
  errors.push(
    ...validateStringArray(value.required_claim_labels, requiredClaimLabels, "required_claim_labels")
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

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_evidence_binding") {
    errors.push("release_gate.gate_status must be blocked_live_evidence_binding");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["product", "agent", "data_quality"],
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

  const script = value.scripts["check:product-agent-release-gate"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-product-agent-release-gate-contract.mjs")
  ) {
    return ["check:product-agent-release-gate script must run its contract checker"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("check:product-agent-release-gate")
  ) {
    return ["root check script must include check:product-agent-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file === "supabase/migrations/20260621132000_product_agent_release_gate_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include product Agent release gate migration"];
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
