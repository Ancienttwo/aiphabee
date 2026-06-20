#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/get-market-calendar.contract.json";
const requiredInputs = ["market", "from", "to"];
const requiredMarkets = ["HK"];
const requiredSessionStatuses = ["trading_day", "half_day", "closed"];
const requiredClosureReasons = ["weather", "holiday", "weekend"];
const requiredStatuses = ["found", "not_found", "out_of_range"];
const requiredSessionFields = [
  "date",
  "market",
  "timezone",
  "sessionStatus",
  "isTradingDay",
  "notes"
];
const requiredErrorCodes = ["NOT_FOUND", "OUT_OF_RANGE", "SCOPE_DENIED"];
const requiredFixtureCases = [
  "trading_day",
  "half_day",
  "weather_closure",
  "holiday_closure",
  "weekend_closure",
  "unsupported_market",
  "out_of_range"
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

  if (value.tool_name !== "get_market_calendar") {
    errors.push("tool_name must be get_market_calendar");
  }

  if (value.route !== "POST /tools/get-market-calendar") {
    errors.push("route must be POST /tools/get-market-calendar");
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

  if (value.timezone !== "Asia/Hong_Kong") {
    errors.push("timezone must be Asia/Hong_Kong");
  }

  errors.push(...validateStringArray(value.supported_inputs, requiredInputs, "supported_inputs"));
  errors.push(...validateStringArray(value.supported_markets, requiredMarkets, "supported_markets"));
  errors.push(
    ...validateStringArray(
      value.supported_session_statuses,
      requiredSessionStatuses,
      "supported_session_statuses"
    )
  );
  errors.push(
    ...validateStringArray(
      value.supported_closure_reasons,
      requiredClosureReasons,
      "supported_closure_reasons"
    )
  );
  errors.push(
    ...validateStringArray(value.required_statuses, requiredStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(
      value.required_session_fields,
      requiredSessionFields,
      "required_session_fields"
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
