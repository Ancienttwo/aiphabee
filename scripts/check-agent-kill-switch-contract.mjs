#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/kill-switch.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const requiredSprintItems = [
  "US-O04",
  "model_kill_switch",
  "tool_kill_switch",
  "safe_degradation"
];
const requiredRuntimeCapabilityFields = [
  "actual_tool_execution",
  "frontend",
  "live_flag_reads",
  "model_calls",
  "model_kill_switch_ready",
  "persistent_writes",
  "route",
  "safe_degradation_ready",
  "status",
  "tool_kill_switch_ready",
  "version"
];
const requiredPlanFields = [
  "switch_state",
  "decision",
  "safe_degradation",
  "live_flag_reads",
  "persistent_writes",
  "route",
  "status",
  "version"
];
const requiredDecisionFields = [
  "degraded",
  "degradation_mode",
  "model_request_blocked",
  "tool_execution_blocked",
  "safe_degradation_required",
  "tool_execution_allowed",
  "model_calls_allowed"
];
const requiredDegradationModes = [
  "normal_no_live",
  "tool_only_no_model",
  "no_model_no_tools"
];
const requiredTargets = ["model", "tool", "all", "none"];
const requiredTables = [
  "core.agent_kill_switch_state",
  "governance.agent_kill_switch_contract"
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
const errors = validateContract(contract, databaseContract);

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
    version: contract.version
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

function validateContract(value, databaseValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.kill-switch-scaffold.v0") {
    errors.push("version must match the kill switch scaffold version");
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

  if (value.route !== "POST /agent/kill-switch/plan") {
    errors.push("route must be POST /agent/kill-switch/plan");
  }

  if (value.agent_plan_route !== "POST /agent/runs/plan") {
    errors.push("agent_plan_route must be POST /agent/runs/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "model_calls",
    "actual_tool_execution",
    "live_flag_reads",
    "persistent_writes"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "safe_degradation_ready",
    "model_kill_switch_ready",
    "tool_kill_switch_ready"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_4_items,
      requiredSprintItems,
      "covered_sprint_2_4_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_plan_fields, requiredPlanFields, "required_plan_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_decision_fields,
      requiredDecisionFields,
      "required_decision_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.degradation_modes,
      requiredDegradationModes,
      "degradation_modes"
    )
  );
  errors.push(...validateStringArray(value.targets, requiredTargets, "targets"));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateDatabaseTables(value) {
  const errors = [];
  const serialized = JSON.stringify(value);

  for (const table of requiredTables) {
    if (!serialized.includes(table)) {
      errors.push(`database contract must include ${table}`);
    }
  }

  return errors;
}

function validateStringArray(value, required, label) {
  const errors = [];

  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  for (const item of required) {
    if (!value.includes(item)) {
      errors.push(`${label} must include ${item}`);
    }
  }

  return errors;
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

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
