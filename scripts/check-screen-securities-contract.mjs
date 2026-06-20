#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/screen-securities.contract.json";
const requiredItems = ["ANA-03", "ANA-04", "US-W05"];
const requiredTools = [
  "compare_securities",
  "resolve_security",
  "get_quote_snapshot",
  "get_financial_facts"
];
const requiredFields = ["revenue", "net_income", "assets", "equity", "last_price"];
const requiredOperators = ["eq", "gte", "lte"];
const requiredOutputFields = [
  "parsed_conditions",
  "editable_before_execution",
  "execution_preview",
  "hits",
  "why",
  "rejected_rows"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
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

function validateContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase2.screen-securities-scaffold.v0") {
    errors.push("version must match screen securities scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/analytics-tools") {
    errors.push("package must be @aiphabee/analytics-tools");
  }

  if (value.runtime_route !== "GET /analytics/runtime") {
    errors.push("runtime_route must be GET /analytics/runtime");
  }

  if (value.route !== "POST /analytics/screen-securities") {
    errors.push("route must be POST /analytics/screen-securities");
  }

  if (value.tool_name !== "screen_securities") {
    errors.push("tool_name must be screen_securities");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_data_access", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_1_items,
      requiredItems,
      "covered_sprint_2_1_items"
    )
  );
  errors.push(...validateStringArray(value.source_tools, requiredTools, "source_tools"));
  errors.push(...validateScreenContract(value.screen_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateScreenContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["screen_contract must be an object"];
  }

  if (value.natural_language_parser !== "deterministic_scaffold") {
    errors.push("screen_contract.natural_language_parser must be deterministic_scaffold");
  }

  for (const field of [
    "editable_conditions",
    "requires_confirmation_before_live_execution",
    "preview_execution",
    "missing_value_rule_visible",
    "hit_reasons_visible",
    "ranking_explainable"
  ]) {
    if (value[field] !== true) {
      errors.push(`screen_contract.${field} must be true`);
    }
  }

  errors.push(
    ...validateStringArray(value.supported_fields, requiredFields, "screen_contract.supported_fields")
  );
  errors.push(
    ...validateStringArray(
      value.supported_operators,
      requiredOperators,
      "screen_contract.supported_operators"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "screen_contract.required_output_fields"
    )
  );

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
