#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/returns-risk.contract.json";
const requiredItems = ["ANA-07"];
const requiredTools = ["resolve_security", "get_price_history"];
const requiredMetrics = [
  "total_return",
  "average_daily_return",
  "volatility_daily",
  "volatility_annualized",
  "max_drawdown",
  "beta"
];
const requiredFields = ["close", "return", "drawdown"];
const requiredBetaBlockedReasons = [
  "benchmark_required",
  "benchmark_history_not_found",
  "insufficient_overlap",
  "zero_benchmark_variance"
];
const requiredOutputFields = [
  "definitions",
  "metrics",
  "formula_version",
  "tolerance",
  "source_record_ids",
  "blocked_reason",
  "window"
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

  if (value.version !== "2026-06-21.phase2.returns-risk-scaffold.v0") {
    errors.push("version must match returns/risk scaffold version");
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

  if (value.route !== "POST /analytics/returns-risk") {
    errors.push("route must be POST /analytics/returns-risk");
  }

  if (value.tool_name !== "calculate_returns_risk") {
    errors.push("tool_name must be calculate_returns_risk");
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
  errors.push(...validateCalculationContract(value.calculation_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateCalculationContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["calculation_contract must be an object"];
  }

  if (value.formula_version !== "returns-risk-v0") {
    errors.push("calculation_contract.formula_version must be returns-risk-v0");
  }

  if (value.golden_tolerance !== 0.000001) {
    errors.push("calculation_contract.golden_tolerance must be 0.000001");
  }

  if (value.point_in_time !== true) {
    errors.push("calculation_contract.point_in_time must be true");
  }

  if (value.max_price_history_rows !== 3) {
    errors.push("calculation_contract.max_price_history_rows must be 3");
  }

  if (!isRecord(value.default_window)) {
    errors.push("calculation_contract.default_window must be an object");
  } else {
    if (value.default_window.from !== "2026-01-05") {
      errors.push("calculation_contract.default_window.from must be 2026-01-05");
    }

    if (value.default_window.to !== "2026-01-07") {
      errors.push("calculation_contract.default_window.to must be 2026-01-07");
    }

    if (value.default_window.adjustment !== "total_return_adjusted") {
      errors.push("calculation_contract.default_window.adjustment must be total_return_adjusted");
    }
  }

  errors.push(
    ...validateStringArray(value.supported_metrics, requiredMetrics, "calculation_contract.supported_metrics")
  );
  errors.push(
    ...validateStringArray(
      value.required_price_history_fields,
      requiredFields,
      "calculation_contract.required_price_history_fields"
    )
  );
  errors.push(...validateBetaContract(value.beta));

  if (value.volatility_method !== "sample_standard_deviation") {
    errors.push("calculation_contract.volatility_method must be sample_standard_deviation");
  }

  if (value.annualization_factor !== 252) {
    errors.push("calculation_contract.annualization_factor must be 252");
  }

  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "calculation_contract.required_output_fields"
    )
  );

  return errors;
}

function validateBetaContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["calculation_contract.beta must be an object"];
  }

  if (value.requires_benchmark !== true) {
    errors.push("calculation_contract.beta.requires_benchmark must be true");
  }

  if (value.method !== "sample_covariance_over_sample_variance") {
    errors.push("calculation_contract.beta.method must be sample_covariance_over_sample_variance");
  }

  errors.push(
    ...validateStringArray(
      value.blocked_reasons,
      requiredBetaBlockedReasons,
      "calculation_contract.beta.blocked_reasons"
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
