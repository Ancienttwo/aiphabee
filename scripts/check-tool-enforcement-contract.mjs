#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/agent/tool-enforcement.contract.json";
const requiredChecks = [
  "registered",
  "versioned",
  "schema_bound",
  "permission_scope",
  "rights_aware",
  "no_arbitrary_sql",
  "no_arbitrary_url",
  "read_only_no_live_data"
];
const requiredToolCheckFields = [
  "name",
  "version",
  "registered",
  "versioned",
  "input_schema_id",
  "output_schema_id",
  "schema_bound",
  "permission_scope",
  "rights_aware",
  "data_classes",
  "allow_arbitrary_sql",
  "allow_arbitrary_url",
  "live_data_access",
  "standard_response_envelope",
  "status"
];
const requiredToolCallFields = [
  "name",
  "version",
  "input_schema_id",
  "output_schema_id",
  "required_scope",
  "rights_aware",
  "data_classes",
  "allow_arbitrary_sql",
  "allow_arbitrary_url",
  "live_data_access",
  "standard_response_envelope",
  "execution"
];
const forbiddenToolNames = ["sql.query", "http.fetch"];
const forbiddenInputProperties = ["sql", "url", "queryText", "rawSql"];
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
    registered_tool_count: contract.registered_tool_count,
    route: contract.route,
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

  if (value.route !== "POST /agent/runs/plan") {
    errors.push("route must be POST /agent/runs/plan");
  }

  if (value.dry_run_route !== "POST /agent/runs/dry-run") {
    errors.push("dry_run_route must be POST /agent/runs/dry-run");
  }

  if (value.runtime_route !== "GET /agent/runtime") {
    errors.push("runtime_route must be GET /agent/runtime");
  }

  for (const field of ["actual_tool_execution", "frontend", "model_calls"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "permission_aware",
    "registered_tools_only",
    "registry_version_required",
    "schema_bound",
    "versioned_tools"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.registered_tool_count !== 16) {
    errors.push("registered_tool_count must be 16");
  }

  if (value.denied_tool_behavior !== "reject_request") {
    errors.push("denied_tool_behavior must be reject_request");
  }

  if (value.standard_error_code !== "SCOPE_DENIED") {
    errors.push("standard_error_code must be SCOPE_DENIED");
  }

  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(
    ...validateStringArray(
      value.required_tool_check_fields,
      requiredToolCheckFields,
      "required_tool_check_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_tool_call_fields,
      requiredToolCallFields,
      "required_tool_call_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.forbidden_tool_names, forbiddenToolNames, "forbidden_tool_names")
  );
  errors.push(
    ...validateStringArray(
      value.forbidden_input_properties,
      forbiddenInputProperties,
      "forbidden_input_properties"
    )
  );
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
