#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/percentile-comparison.contract.json";
const requiredItems = ["ANA-02"];
const requiredTools = ["resolve_security", "get_financial_ratios", "calculate_returns_risk"];
const requiredMetrics = ["net_margin", "total_return"];
const requiredBenchmarkTypes = ["peer", "index", "history"];
const requiredOutputFields = [
  "subject",
  "comparisons",
  "benchmark_type",
  "constituent_as_of",
  "constituents",
  "history_observations",
  "percentile_rank",
  "point_in_time_policy",
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

  if (value.version !== "2026-06-21.phase2.percentile-comparison-scaffold.v0") {
    errors.push("version must match percentile comparison scaffold version");
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

  if (value.route !== "POST /analytics/percentile-comparison") {
    errors.push("route must be POST /analytics/percentile-comparison");
  }

  if (value.tool_name !== "compare_percentiles") {
    errors.push("tool_name must be compare_percentiles");
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
  errors.push(...validatePercentileContract(value.percentile_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validatePercentileContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["percentile_contract must be an object"];
  }

  if (value.formula_version !== "percentile-comparison-v0") {
    errors.push("percentile_contract.formula_version must be percentile-comparison-v0");
  }

  if (value.point_in_time !== true) {
    errors.push("percentile_contract.point_in_time must be true");
  }

  if (value.no_future_constituents !== true) {
    errors.push("percentile_contract.no_future_constituents must be true");
  }

  if (value.live_constituents !== false) {
    errors.push("percentile_contract.live_constituents must be false");
  }

  if (value.method !== "nearest_rank_less_than_or_equal") {
    errors.push("percentile_contract.method must be nearest_rank_less_than_or_equal");
  }

  errors.push(
    ...validateStringArray(value.supported_metrics, requiredMetrics, "percentile_contract.supported_metrics")
  );
  errors.push(
    ...validateStringArray(
      value.benchmark_types,
      requiredBenchmarkTypes,
      "percentile_contract.benchmark_types"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "percentile_contract.required_output_fields"
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
