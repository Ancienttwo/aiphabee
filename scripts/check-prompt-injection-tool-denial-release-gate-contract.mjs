#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/prompt-injection-tool-denial-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const requiredChecks = [
  "untrusted_document_content_is_isolated",
  "document_origin_tool_instructions_not_executed",
  "arbitrary_sql_tool_denied_pre_execution",
  "arbitrary_url_tool_denied_pre_execution",
  "unregistered_tool_denied_pre_execution",
  "registered_tools_remain_schema_bound_read_only"
];
const requiredOutputFields = [
  "prompt_injection_gate",
  "tool_denial_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredTables = [
  "core.prompt_injection_tool_denial_release_gate",
  "governance.prompt_injection_tool_denial_release_gate_contract"
];
const requiredDeniedToolProbes = ["sql.query", "http.fetch", "admin.override"];
const requiredCoveredItems = [
  "prompt_injection_tests_pass",
  "arbitrary_sql_url_unregistered_tool_denied"
];
const requiredBlockers = [
  "live_prompt_injection_red_team_harness_missing",
  "live_tool_execution_proxy_enforcement_missing",
  "frontend_untrusted_content_rendering_release_ui_missing"
];
const requiredLinkedContracts = [
  "deploy/documents/document-sanitizer.contract.json",
  "deploy/agent/tool-enforcement.contract.json",
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

  if (
    value.version !==
    "2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0"
  ) {
    errors.push("version must match prompt injection tool denial release gate scaffold version");
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

  if (value.route !== "POST /agent/release-gates/prompt-injection/plan") {
    errors.push("route must be POST /agent/release-gates/prompt-injection/plan");
  }

  if (value.document_sanitizer_route !== "POST /documents/get-announcement") {
    errors.push("document_sanitizer_route must be POST /documents/get-announcement");
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
    "live_document_fetch",
    "live_tool_execution",
    "model_calls",
    "sql_emitted",
    "document_tool_invocation_allowed",
    "allow_arbitrary_sql",
    "allow_arbitrary_url"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "content_is_untrusted_data",
    "prompt_injection_isolated",
    "raw_document_instructions_ignored",
    "registered_tools_only",
    "pre_execution_denial"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.denied_tool_probes, requiredDeniedToolProbes, "denied_tool_probes")
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

  if (value.gate_status !== "blocked_live_prompt_injection_red_team_validation") {
    errors.push(
      "release_gate.gate_status must be blocked_live_prompt_injection_red_team_validation"
    );
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["security", "agent", "data_governance"],
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

  const script = value.scripts["check:prompt-injection-tool-denial-release-gate"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-prompt-injection-tool-denial-release-gate-contract.mjs")
  ) {
    return [
      "check:prompt-injection-tool-denial-release-gate script must run its contract checker"
    ];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("check:prompt-injection-tool-denial-release-gate")
  ) {
    return ["root check script must include check:prompt-injection-tool-denial-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file ===
        "supabase/migrations/20260621138000_prompt_injection_tool_denial_release_gate_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include prompt injection tool denial release gate migration"];
  }

  return validateStringArray(migration.tables, requiredTables, "database migration tables");
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`secret-like pattern detected: ${pattern}`);
    }
  }

  return errors;
}

function validateStringArray(value, expected, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const actual = value.filter((item) => typeof item === "string");

  if (actual.length !== value.length) {
    return [`${label} must contain only strings`];
  }

  if (actual.length !== expected.length) {
    return [`${label} length must be ${expected.length}`];
  }

  return expected
    .filter((item, index) => actual[index] !== item)
    .map((item, index) => `${label}[${index}] must be ${item}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
