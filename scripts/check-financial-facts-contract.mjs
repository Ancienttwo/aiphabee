#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/get-financial-facts.contract.json";
const requiredInputs = [
  "instrument_id",
  "from",
  "to",
  "statement_types",
  "metrics",
  "as_of",
  "limit",
  "cursor"
];
const requiredStatementTypes = ["income_statement", "balance_sheet", "cash_flow"];
const requiredMetrics = [
  "revenue",
  "net_income",
  "assets",
  "liabilities",
  "equity",
  "operating_cash_flow",
  "free_cash_flow"
];
const requiredStatuses = [
  "found",
  "not_found",
  "data_not_licensed",
  "data_quality_hold",
  "out_of_range",
  "point_in_time_unavailable",
  "too_many_rows"
];
const requiredFactFields = [
  "statementId",
  "statementType",
  "metricId",
  "periodEnd",
  "value",
  "currency",
  "unit",
  "scale",
  "accountingStandard",
  "restatementVersion",
  "publishedAt",
  "qualityState",
  "sourceRecordId"
];
const requiredErrorCodes = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "NOT_FOUND",
  "OUT_OF_RANGE",
  "POINT_IN_TIME_UNAVAILABLE",
  "TOO_MANY_ROWS",
  "SCOPE_DENIED"
];
const requiredFixtureCases = [
  "financial_fact_rows",
  "metric_subset",
  "statement_type_subset",
  "cursor_pagination",
  "unlicensed_metric",
  "unlicensed_statement_type",
  "quality_hold",
  "point_in_time_unavailable",
  "not_found",
  "out_of_range",
  "too_many_rows"
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
    fixture_cases: contract.fixture_cases.length,
    route: contract.route,
    status: "ok",
    tool: contract.tool_name
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
    errors.push("status must be local_contract until live tool data exists");
  }

  if (value.tool_name !== "get_financial_facts") {
    errors.push("tool_name must be get_financial_facts");
  }

  if (value.route !== "POST /tools/get-financial-facts") {
    errors.push("route must be POST /tools/get-financial-facts");
  }

  if (value.handler_ready !== true) {
    errors.push("handler_ready must be true for this scaffold");
  }

  if (value.live_data_access !== false) {
    errors.push("live_data_access must be false in this scaffold");
  }

  if (value.allow_arbitrary_sql !== false) {
    errors.push("allow_arbitrary_sql must be false");
  }

  if (value.allow_arbitrary_url !== false) {
    errors.push("allow_arbitrary_url must be false");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  if (value.currency_unit_metadata !== true) {
    errors.push("currency_unit_metadata must be true");
  }

  if (value.point_in_time_selection !== true) {
    errors.push("point_in_time_selection must be true");
  }

  if (value.restatement_versions !== true) {
    errors.push("restatement_versions must be true");
  }

  errors.push(...validateStringArray(value.supported_inputs, requiredInputs, "supported_inputs"));
  errors.push(
    ...validateStringArray(
      value.supported_statement_types,
      requiredStatementTypes,
      "supported_statement_types"
    )
  );
  errors.push(...validateStringArray(value.supported_metrics, requiredMetrics, "supported_metrics"));
  errors.push(
    ...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(value.required_fact_fields, requiredFactFields, "required_fact_fields")
  );
  errors.push(
    ...validateStringArray(value.required_error_codes, requiredErrorCodes, "required_error_codes")
  );
  errors.push(
    ...validateStringArray(value.fixture_cases, requiredFixtureCases, "fixture_cases")
  );
  errors.push(...validateNoSecretLikeValues(value));

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

function validateNoSecretLikeValues(value) {
  const serialized = JSON.stringify(value);
  const patterns = [
    /sk-[A-Za-z0-9_-]+/u,
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]+/u,
    /gh[pousr]_[A-Za-z0-9_]+/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ];

  return patterns
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
