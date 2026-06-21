#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/tool-schemas.contract.json";
const requiredTools = [
  "resolve_security",
  "get_security_profile",
  "get_market_calendar",
  "get_quote_snapshot",
  "get_price_history",
  "get_corporate_actions",
  "get_financial_facts",
  "get_financial_ratios",
  "search_announcements",
  "get_announcement",
  "screen_securities",
  "compare_securities",
  "calculate_returns_risk",
  "get_event_timeline",
  "get_data_lineage",
  "get_entitlements"
];
const requiredEnvelopeFields = [
  "ok",
  "request_id",
  "as_of",
  "market_status",
  "provenance",
  "usage"
];
const requiredLineageFields = ["source", "source_record_id", "data_version", "methodology_version"];
const requiredErrorCodes = [
  "AUTH_REQUIRED",
  "DATA_NOT_LICENSED",
  "SCOPE_DENIED",
  "DATA_QUALITY_HOLD",
  "AMBIGUOUS_SECURITY",
  "SYMBOL_AMBIGUOUS",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS",
  "POINT_IN_TIME_UNAVAILABLE",
  "NOT_FOUND",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "MODEL_PROVIDER_NOT_CONFIGURED",
  "UPSTREAM_STALE",
  "INTERNAL_ERROR"
];
const forbiddenInputProperties = ["sql", "sql_text", "url", "endpoint"];

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
    schema_pairs: Object.keys(contract.schemas).length,
    status: "ok",
    tools: requiredTools.length
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
    errors.push("status must be local_contract until schema registry is served");
  }

  if (value.schema_dialect !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push("schema_dialect must be JSON Schema draft 2020-12");
  }

  for (const booleanField of [
    "live_data_access",
    "allow_arbitrary_sql",
    "allow_arbitrary_url"
  ]) {
    if (value[booleanField] !== false) {
      errors.push(`${booleanField} must be false`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_envelope_fields,
      requiredEnvelopeFields,
      "required_envelope_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_provenance_fields,
      requiredLineageFields,
      "required_provenance_fields"
    )
  );

  if (value.numeric_lineage_required !== true) {
    errors.push("numeric_lineage_required must be true");
  }

  if (!isRecord(value.schemas)) {
    errors.push("schemas must be an object keyed by tool name");
    return errors;
  }

  for (const toolName of requiredTools) {
    const schemaPair = value.schemas[toolName];

    if (!isRecord(schemaPair)) {
      errors.push(`schemas must include ${toolName}`);
      continue;
    }

    errors.push(...validateInputSchema(toolName, schemaPair.input));
    errors.push(...validateOutputSchema(toolName, schemaPair.output));

    if (!Array.isArray(schemaPair.standard_error_codes)) {
      errors.push(`${toolName}.standard_error_codes must be an array`);
    }
  }

  errors.push(...validateErrorSchema(value.error_schema));
  errors.push(...validateNoSecretLikeValues(value));

  return errors;
}

function validateInputSchema(toolName, schema) {
  const errors = [];

  if (!isRecord(schema)) {
    return [`${toolName}.input must be a JSON Schema object`];
  }

  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push(`${toolName}.input.$schema must be draft 2020-12`);
  }

  if (schema.$id !== `tool.${toolName}.input.v0`) {
    errors.push(`${toolName}.input.$id must match registry input schema id`);
  }

  if (schema.type !== "object") {
    errors.push(`${toolName}.input.type must be object`);
  }

  if (schema.additionalProperties !== false) {
    errors.push(`${toolName}.input.additionalProperties must be false`);
  }

  if (!isRecord(schema.properties)) {
    errors.push(`${toolName}.input.properties must be present`);
  } else {
    for (const property of forbiddenInputProperties) {
      if (Object.hasOwn(schema.properties, property)) {
        errors.push(`${toolName}.input must not expose arbitrary ${property}`);
      }
    }
  }

  return errors;
}

function validateOutputSchema(toolName, schema) {
  const errors = [];

  if (!isRecord(schema)) {
    return [`${toolName}.output must be a JSON Schema object`];
  }

  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    errors.push(`${toolName}.output.$schema must be draft 2020-12`);
  }

  if (schema.$id !== `tool.${toolName}.output.v0`) {
    errors.push(`${toolName}.output.$id must match registry output schema id`);
  }

  errors.push(
    ...validateStringArray(
      schema.required,
      [...requiredEnvelopeFields, "data", "data_version", "methodology_version"],
      `${toolName}.output.required`
    )
  );

  const provenanceSchema = schema.properties?.provenance;

  if (!isRecord(provenanceSchema) || provenanceSchema.type !== "array") {
    errors.push(`${toolName}.output.properties.provenance must be an array schema`);
  } else {
    errors.push(
      ...validateStringArray(
        provenanceSchema.items?.required,
        requiredLineageFields,
        `${toolName}.output.properties.provenance.items.required`
      )
    );
  }

  const dataProperties = schema.properties?.data?.properties;
  const dataRequired = schema.properties?.data?.required;

  if (!isRecord(dataProperties)) {
    errors.push(`${toolName}.output.properties.data.properties must be present`);
  } else {
    errors.push(
      ...validateStringArray(
        dataRequired,
        ["toolName", "status", "liveDataAccess", "data_version", "methodology_version"],
        `${toolName}.output.properties.data.required`
      )
    );

    if (dataProperties.toolName?.const !== toolName) {
      errors.push(`${toolName}.output data.toolName const must match tool name`);
    }

    if (dataProperties.liveDataAccess?.const !== false) {
      errors.push(`${toolName}.output data.liveDataAccess const must be false`);
    }
  }

  return errors;
}

function validateErrorSchema(schema) {
  const errors = [];

  if (!isRecord(schema)) {
    return ["error_schema must be a JSON Schema object"];
  }

  errors.push(
    ...validateStringArray(schema.required, [...requiredEnvelopeFields, "error"], "error_schema.required")
  );

  const errorCodeEnum = schema.properties?.error?.properties?.code?.enum;

  errors.push(
    ...validateStringArray(errorCodeEnum, requiredErrorCodes, "error_schema.error.code.enum")
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

function validateNoSecretLikeValues(value) {
  const serialized = JSON.stringify(value);
  const patterns = [
    /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]{20,}/u,
    /gh[pousr]_[A-Za-z0-9_]{20,}/u,
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
