#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/compare-securities.contract.json";
const requiredItems = ["ANA-01", "ANA-02"];
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_quote_snapshot",
  "get_financial_facts"
];
const requiredMetrics = ["revenue", "net_income", "assets", "equity"];
const requiredOutputFields = [
  "rows",
  "unified_comparison",
  "missing_metrics",
  "quality_flags",
  "source_record_ids"
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

  if (value.version !== "2026-06-21.phase2.compare-securities-scaffold.v0") {
    errors.push("version must match compare securities scaffold version");
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

  if (value.route !== "POST /analytics/compare-securities") {
    errors.push("route must be POST /analytics/compare-securities");
  }

  if (value.tool_name !== "compare_securities") {
    errors.push("tool_name must be compare_securities");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "live_data_access", "sql_emitted"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  if (!isRecord(value.limits)) {
    errors.push("limits must be an object");
  } else {
    if (value.limits.min_securities !== 2) {
      errors.push("limits.min_securities must be 2");
    }

    if (value.limits.max_securities !== 5) {
      errors.push("limits.max_securities must be 5");
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
  errors.push(...validateComparisonContract(value.comparison_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateComparisonContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["comparison_contract must be an object"];
  }

  for (const field of [
    "unified_currency_required",
    "unit_alignment_required",
    "incomparable_rows_explicit",
    "ambiguous_security_blocks",
    "point_in_time_as_of_supported"
  ]) {
    if (value[field] !== true) {
      errors.push(`comparison_contract.${field} must be true`);
    }
  }

  if (value.fx_conversion_without_rate !== false) {
    errors.push("comparison_contract.fx_conversion_without_rate must be false");
  }

  errors.push(
    ...validateStringArray(
      value.required_metrics,
      requiredMetrics,
      "comparison_contract.required_metrics"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "comparison_contract.required_output_fields"
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
