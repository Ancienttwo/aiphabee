#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/error-codes.contract.json";
const requiredSprintItems = [
  "MCP-08",
  "standard_error_codes",
  "machine_readable_error_detail",
  "client_action",
  "retry_after_contract"
];
const requiredCategories = ["authentication", "authorization", "data", "limit", "system"];
const requiredErrorCodes = [
  "AUTH_REQUIRED",
  "SCOPE_DENIED",
  "DATA_NOT_LICENSED",
  "SYMBOL_AMBIGUOUS",
  "OUT_OF_RANGE",
  "TOO_MANY_ROWS",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "UPSTREAM_STALE",
  "DATA_QUALITY_HOLD",
  "INTERNAL_ERROR"
];
const requiredDetailFields = [
  "category",
  "client_action",
  "internal_code",
  "mcp_error_version",
  "recoverable",
  "request_id",
  "retry_after_required",
  "source_record_id"
];
const requiredMappings = {
  API_KEY_ID_REQUIRED: "AUTH_REQUIRED",
  AUTHORIZATION_CODE_REQUIRED: "AUTH_REQUIRED",
  CODE_VERIFIER_REQUIRED: "AUTH_REQUIRED",
  CONNECTION_OR_TOKEN_REQUIRED: "AUTH_REQUIRED",
  MCP_REDISTRIBUTION_RIGHTS_REQUIRED: "DATA_NOT_LICENSED",
  ORIGIN_NOT_ALLOWED: "SCOPE_DENIED",
  ORIGIN_REQUIRED: "SCOPE_DENIED",
  TOOL_LIMIT_EXCEEDED: "TOO_MANY_ROWS",
  TOOL_NOT_REGISTERED: "SCOPE_DENIED",
  TOOL_SCOPE_REQUIRED: "SCOPE_DENIED",
  TOOL_TIME_RANGE_EXCEEDED: "OUT_OF_RANGE",
  UNSUPPORTED_METHOD: "OUT_OF_RANGE"
};
const requiredDefinitionByCode = {
  AUTH_REQUIRED: {
    category: "authentication",
    client_action: "reauthorize",
    retry_after_required: false
  },
  BUDGET_EXCEEDED: {
    category: "limit",
    client_action: "upgrade_or_shrink_task",
    retry_after_required: false
  },
  DATA_NOT_LICENSED: {
    category: "authorization",
    client_action: "upgrade_or_reduce_scope",
    retry_after_required: false
  },
  DATA_QUALITY_HOLD: {
    category: "data",
    client_action: "try_alternate_methodology_or_retry_later",
    retry_after_required: false
  },
  INTERNAL_ERROR: {
    category: "system",
    client_action: "contact_support_with_request_id",
    retry_after_required: false
  },
  OUT_OF_RANGE: {
    category: "limit",
    client_action: "narrow_request",
    retry_after_required: false
  },
  RATE_LIMITED: {
    category: "limit",
    client_action: "retry_after",
    retry_after_required: true
  },
  SCOPE_DENIED: {
    category: "authorization",
    client_action: "request_additional_scope",
    retry_after_required: false
  },
  SYMBOL_AMBIGUOUS: {
    category: "data",
    client_action: "select_security_candidate",
    retry_after_required: false
  },
  TOO_MANY_ROWS: {
    category: "limit",
    client_action: "narrow_request",
    retry_after_required: false
  },
  UPSTREAM_STALE: {
    category: "data",
    client_action: "show_last_available_as_of",
    retry_after_required: false
  }
};
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
    error_code_count: contract.standard_error_codes.length,
    route: contract.route,
    status: "ok",
    version: contract.version
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

  if (value.version !== "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0") {
    errors.push("version must match MCP standard error code scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.route !== "POST /mcp") {
    errors.push("route must be POST /mcp");
  }

  for (const field of ["standard_response_envelope", "machine_readable_errors", "stable_error_taxonomy"]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  for (const field of ["frontend", "live_oauth_provider", "live_tool_execution"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_3_items,
      requiredSprintItems,
      "covered_sprint_2_3_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.standard_error_categories,
      requiredCategories,
      "standard_error_categories"
    )
  );
  errors.push(
    ...validateStringArray(
      value.standard_error_codes,
      requiredErrorCodes,
      "standard_error_codes"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_error_detail_fields,
      requiredDetailFields,
      "required_error_detail_fields"
    )
  );
  errors.push(...validateDefinitions(value.standard_error_definitions));
  errors.push(...validateMappings(value.internal_error_mappings));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateDefinitions(value) {
  const errors = [];

  if (!Array.isArray(value)) {
    return ["standard_error_definitions must be an array"];
  }

  const seenCodes = new Set();
  for (const definition of value) {
    if (!isRecord(definition)) {
      errors.push("standard_error_definitions entries must be objects");
      continue;
    }

    if (typeof definition.code !== "string") {
      errors.push("standard_error_definitions entries must include code");
      continue;
    }

    seenCodes.add(definition.code);
    const expected = requiredDefinitionByCode[definition.code];
    if (expected === undefined) {
      errors.push(`unexpected standard error definition ${definition.code}`);
      continue;
    }

    for (const [field, expectedValue] of Object.entries(expected)) {
      if (definition[field] !== expectedValue) {
        errors.push(`${definition.code}.${field} must be ${expectedValue}`);
      }
    }

    if (definition.recoverable !== false && definition.recoverable !== true) {
      errors.push(`${definition.code}.recoverable must be boolean`);
    }

    if (definition.source_record_id !== `mcp_error_${definition.code.toLowerCase()}`) {
      errors.push(`${definition.code}.source_record_id must be deterministic`);
    }
  }

  for (const requiredCode of requiredErrorCodes) {
    if (!seenCodes.has(requiredCode)) {
      errors.push(`standard_error_definitions must include ${requiredCode}`);
    }
  }

  return errors;
}

function validateMappings(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["internal_error_mappings must be an object"];
  }

  for (const [internalCode, standardCode] of Object.entries(requiredMappings)) {
    if (value[internalCode] !== standardCode) {
      errors.push(`internal_error_mappings.${internalCode} must be ${standardCode}`);
    }
  }

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
