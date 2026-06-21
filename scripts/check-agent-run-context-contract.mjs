#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/run-context.contract.json";
const requiredContextSections = [
  "run",
  "user",
  "workspace",
  "subscription",
  "entitlements",
  "toolset",
  "budget",
  "model"
];
const requiredRunFields = ["run_id", "request_id", "status", "mode", "runtime_version"];
const requiredBudgetDimensions = [
  "max_steps",
  "max_parallel_tools",
  "max_tokens",
  "max_rows",
  "max_credits",
  "max_wall_clock_ms"
];
const requiredToolFields = [
  "name",
  "version",
  "input_schema_id",
  "output_schema_id",
  "required_scope",
  "live_data_access"
];
const requiredChannels = ["web", "mcp", "api"];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

let contract;

try {
  contract = JSON.parse(readFileSync(resolve(process.cwd(), contractPath), "utf8"));
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      path: contractPath,
      status: "invalid_json"
    },
    1
  );
}

const errors = validateContract(contract);

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
    runtime_route: contract.runtime_route,
    status: "ok"
  },
  0
);

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    errors.push("version must be a non-empty string");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/agent-runtime") {
    errors.push("package must be @aiphabee/agent-runtime");
  }

  if (value.route !== "POST /agent/runs/dry-run") {
    errors.push("route must be POST /agent/runs/dry-run");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  for (const field of [
    "context_ready",
    "frontend",
    "live_entitlement_reads",
    "model_calls",
    "partner_rights_matrix_loaded",
    "streaming"
  ]) {
    if (typeof value[field] !== "boolean") {
      errors.push(`${field} must be boolean`);
    }
  }

  if (value.context_ready !== true) {
    errors.push("context_ready must be true");
  }

  for (const field of [
    "frontend",
    "live_entitlement_reads",
    "model_calls",
    "partner_rights_matrix_loaded",
    "streaming"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must remain false in this scaffold`);
    }
  }

  if (value.entitlement_policy_source !== "synthetic_default_deny") {
    errors.push("entitlement_policy_source must be synthetic_default_deny");
  }

  errors.push(
    ...validateStringArray(
      value.required_context_sections,
      requiredContextSections,
      "required_context_sections"
    )
  );
  errors.push(
    ...validateStringArray(value.required_run_fields, requiredRunFields, "required_run_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_budget_dimensions,
      requiredBudgetDimensions,
      "required_budget_dimensions"
    )
  );
  errors.push(
    ...validateStringArray(value.required_tool_fields, requiredToolFields, "required_tool_fields")
  );
  errors.push(...validateStringArray(value.allowed_channels, requiredChannels, "allowed_channels"));
  errors.push(...validateStringArray(value.model_tiers, ["dry_run"], "model_tiers"));
  errors.push(...validateNoSecrets(value));

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
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
