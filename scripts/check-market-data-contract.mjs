#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/get-quote-snapshot.contract.json";
const requiredInputs = ["instrument_id", "fields", "mode", "as_of"];
const requiredModes = ["delayed", "close"];
const requiredFields = [
  "lastPrice",
  "previousClose",
  "change",
  "changePercent",
  "volume",
  "turnover"
];
const requiredStatuses = [
  "found",
  "not_found",
  "data_not_licensed",
  "data_quality_hold",
  "point_in_time_unavailable"
];
const requiredQuoteFields = [
  "instrumentId",
  "symbol",
  "market",
  "exchange",
  "currency",
  "asOf",
  "delay",
  "marketStatus",
  "qualityState",
  "fields"
];
const requiredErrorCodes = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "NOT_FOUND",
  "POINT_IN_TIME_UNAVAILABLE",
  "SCOPE_DENIED"
];
const requiredFixtureCases = [
  "delayed_snapshot",
  "close_snapshot",
  "field_subset",
  "unlicensed_field",
  "quality_hold",
  "not_found",
  "point_in_time_unavailable"
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

  if (value.tool_name !== "get_quote_snapshot") {
    errors.push("tool_name must be get_quote_snapshot");
  }

  if (value.route !== "POST /tools/get-quote-snapshot") {
    errors.push("route must be POST /tools/get-quote-snapshot");
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

  if (value.delay_metadata !== true) {
    errors.push("delay_metadata must be true");
  }

  errors.push(...validateStringArray(value.supported_inputs, requiredInputs, "supported_inputs"));
  errors.push(...validateStringArray(value.supported_modes, requiredModes, "supported_modes"));
  errors.push(...validateStringArray(value.supported_fields, requiredFields, "supported_fields"));
  errors.push(
    ...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(
      value.required_quote_fields,
      requiredQuoteFields,
      "required_quote_fields"
    )
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
