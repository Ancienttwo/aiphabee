#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/get-corporate-actions.contract.json";
const requiredInputs = ["instrument_id", "from", "to", "types", "limit", "cursor"];
const requiredActionTypes = [
  "dividend",
  "split",
  "consolidation",
  "rights",
  "placement",
  "buyback"
];
const requiredStatuses = [
  "found",
  "not_found",
  "data_not_licensed",
  "data_quality_hold",
  "out_of_range",
  "too_many_rows"
];
const requiredActionFields = [
  "actionId",
  "actionType",
  "announcementDate",
  "effectiveDate",
  "terms",
  "adjustmentImpact",
  "qualityState",
  "sourceRecordId"
];
const requiredErrorCodes = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "NOT_FOUND",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS",
  "SCOPE_DENIED"
];
const requiredFixtureCases = [
  "corporate_action_rows",
  "type_subset",
  "cursor_pagination",
  "unlicensed_type",
  "quality_hold",
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

  if (value.tool_name !== "get_corporate_actions") {
    errors.push("tool_name must be get_corporate_actions");
  }

  if (value.route !== "POST /tools/get-corporate-actions") {
    errors.push("route must be POST /tools/get-corporate-actions");
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

  if (value.adjustment_impact_metadata !== true) {
    errors.push("adjustment_impact_metadata must be true");
  }

  if (value.cursor_pagination !== true) {
    errors.push("cursor_pagination must be true");
  }

  errors.push(...validateStringArray(value.supported_inputs, requiredInputs, "supported_inputs"));
  errors.push(
    ...validateStringArray(
      value.supported_action_types,
      requiredActionTypes,
      "supported_action_types"
    )
  );
  errors.push(
    ...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(
      value.required_action_fields,
      requiredActionFields,
      "required_action_fields"
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
