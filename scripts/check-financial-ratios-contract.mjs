#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/analytics/financial-ratios.contract.json";
const requiredItems = ["FIN-RATIOS", "DAT-07"];
const requiredTools = ["resolve_security", "get_financial_facts"];
const requiredRatios = [
  "net_margin",
  "return_on_assets",
  "return_on_equity",
  "asset_turnover",
  "equity_multiplier"
];
const requiredInputs = ["revenue", "net_income", "assets", "equity"];
const requiredAnomalyHandling = [
  "missing_input",
  "zero_denominator",
  "negative_denominator",
  "quality_hold"
];
const requiredOutputFields = [
  "definitions",
  "ratios",
  "formula_version",
  "percentile",
  "source_record_ids",
  "blocked_reason"
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

  if (value.version !== "2026-06-21.phase2.financial-ratios-scaffold.v0") {
    errors.push("version must match financial ratios scaffold version");
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

  if (value.route !== "POST /analytics/financial-ratios") {
    errors.push("route must be POST /analytics/financial-ratios");
  }

  if (value.tool_name !== "get_financial_ratios") {
    errors.push("tool_name must be get_financial_ratios");
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
  errors.push(...validateRatioContract(value.ratio_contract));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateRatioContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["ratio_contract must be an object"];
  }

  if (value.formula_version !== "financial-ratios-v0") {
    errors.push("ratio_contract.formula_version must be financial-ratios-v0");
  }

  if (value.percentile_methodology !== "synthetic_peer_distribution_rank") {
    errors.push("ratio_contract.percentile_methodology must be synthetic_peer_distribution_rank");
  }

  if (value.point_in_time !== true) {
    errors.push("ratio_contract.point_in_time must be true");
  }

  if (value.live_peer_constituents !== false) {
    errors.push("ratio_contract.live_peer_constituents must be false");
  }

  errors.push(
    ...validateStringArray(value.supported_ratios, requiredRatios, "ratio_contract.supported_ratios")
  );
  errors.push(
    ...validateStringArray(value.required_inputs, requiredInputs, "ratio_contract.required_inputs")
  );
  errors.push(
    ...validateStringArray(
      value.anomaly_handling,
      requiredAnomalyHandling,
      "ratio_contract.anomaly_handling"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "ratio_contract.required_output_fields"
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
