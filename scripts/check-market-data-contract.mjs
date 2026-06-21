#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const quoteContractPath = "deploy/tools/get-quote-snapshot.contract.json";
const priceHistoryContractPath = "deploy/tools/get-price-history.contract.json";
const requiredQuoteInputs = ["instrument_id", "fields", "mode", "as_of"];
const requiredQuoteModes = ["delayed", "close"];
const requiredQuoteSupportedFields = [
  "lastPrice",
  "previousClose",
  "change",
  "changePercent",
  "volume",
  "turnover"
];
const requiredQuoteStatuses = [
  "found",
  "not_found",
  "data_not_licensed",
  "data_quality_hold",
  "point_in_time_unavailable"
];
const requiredQuotePayloadFields = [
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
const requiredPriceInputs = [
  "instrument_id",
  "from",
  "to",
  "adjustment",
  "fields",
  "limit",
  "cursor"
];
const requiredPriceAdjustments = ["raw", "split_adjusted", "total_return_adjusted"];
const requiredPriceFields = [
  "open",
  "high",
  "low",
  "close",
  "volume",
  "turnover",
  "return",
  "drawdown"
];
const requiredPriceStatuses = [
  "found",
  "not_found",
  "data_not_licensed",
  "data_quality_hold",
  "out_of_range",
  "too_many_rows"
];
const requiredHistoryFields = [
  "instrumentId",
  "symbol",
  "market",
  "exchange",
  "currency",
  "from",
  "to",
  "adjustment",
  "adjustmentMethodology",
  "qualityState",
  "rows",
  "nextCursor"
];
const requiredPriceErrorCodes = [
  "DATA_NOT_LICENSED",
  "DATA_QUALITY_HOLD",
  "NOT_FOUND",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS",
  "SCOPE_DENIED"
];
const requiredPriceFixtureCases = [
  "price_history_rows",
  "field_subset",
  "cursor_pagination",
  "unlicensed_field",
  "unlicensed_adjustment",
  "quality_hold",
  "not_found",
  "out_of_range",
  "too_many_rows"
];

let quoteContract;
let priceHistoryContract;

try {
  quoteContract = JSON.parse(readFileSync(resolve(process.cwd(), quoteContractPath), "utf8"));
  priceHistoryContract = JSON.parse(
    readFileSync(resolve(process.cwd(), priceHistoryContractPath), "utf8")
  );
} catch (error) {
  emit(
    {
      error: error instanceof Error ? error.message : String(error),
      paths: [quoteContractPath, priceHistoryContractPath],
      status: "invalid_json"
    },
    1
  );
}

const errors = [
  ...validateQuoteContract(quoteContract).map((error) => `get_quote_snapshot: ${error}`),
  ...validatePriceHistoryContract(priceHistoryContract).map(
    (error) => `get_price_history: ${error}`
  )
];

if (errors.length > 0) {
  emit(
    {
      errors,
      paths: [quoteContractPath, priceHistoryContractPath],
      status: "invalid_contract"
    },
    1
  );
}

emit(
  {
    fixture_cases:
      quoteContract.fixture_cases.length + priceHistoryContract.fixture_cases.length,
    routes: [quoteContract.route, priceHistoryContract.route],
    status: "ok",
    tools: [quoteContract.tool_name, priceHistoryContract.tool_name]
  },
  0
);

function validateQuoteContract(value) {
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

  errors.push(
    ...validateStringArray(value.supported_inputs, requiredQuoteInputs, "supported_inputs")
  );
  errors.push(...validateStringArray(value.supported_modes, requiredQuoteModes, "supported_modes"));
  errors.push(
    ...validateStringArray(value.supported_fields, requiredQuoteSupportedFields, "supported_fields")
  );
  errors.push(
    ...validateStringArray(value.required_statuses, requiredQuoteStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(
      value.required_quote_fields,
      requiredQuotePayloadFields,
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

function validatePriceHistoryContract(value) {
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

  if (value.tool_name !== "get_price_history") {
    errors.push("tool_name must be get_price_history");
  }

  if (value.route !== "POST /tools/get-price-history") {
    errors.push("route must be POST /tools/get-price-history");
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

  if (value.adjustment_methodology !== true) {
    errors.push("adjustment_methodology must be true");
  }

  if (value.cursor_pagination !== true) {
    errors.push("cursor_pagination must be true");
  }

  errors.push(...validateStringArray(value.supported_inputs, requiredPriceInputs, "supported_inputs"));
  errors.push(
    ...validateStringArray(
      value.supported_adjustments,
      requiredPriceAdjustments,
      "supported_adjustments"
    )
  );
  errors.push(...validateStringArray(value.supported_fields, requiredPriceFields, "supported_fields"));
  errors.push(
    ...validateStringArray(value.required_statuses, requiredPriceStatuses, "required_statuses")
  );
  errors.push(
    ...validateStringArray(
      value.required_history_fields,
      requiredHistoryFields,
      "required_history_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_error_codes, requiredPriceErrorCodes, "required_error_codes")
  );
  errors.push(
    ...validateStringArray(value.fixture_cases, requiredPriceFixtureCases, "fixture_cases")
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
