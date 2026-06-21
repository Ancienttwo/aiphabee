#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/endpoint.contract.json";
const requiredSprintItems = [
  "MCP-01",
  "streamable_http_endpoint",
  "initialize",
  "tools_list",
  "tools_call",
  "origin_validation",
  "gate0_default_deny"
];
const requiredMethods = ["initialize", "tools/list", "tools/call"];
const requiredOriginFields = ["origin", "allowed_origins", "required", "valid"];
const requiredRightsGateFields = [
  "mcp_api_redistribution_rights_confirmed",
  "web_rights_do_not_imply_mcp",
  "default_deny",
  "blocked_reason"
];
const requiredProtocolFields = ["json_rpc", "streamable_http", "supported_methods"];
const requiredResponseFields = [
  "endpoint",
  "transport",
  "method",
  "origin_check",
  "rights_gate",
  "response_shape",
  "usage"
];
const requiredErrorCodes = [
  "AUTH_REQUIRED",
  "DATA_NOT_LICENSED",
  "SCOPE_DENIED",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "INTERNAL_ERROR"
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
    transport: contract.transport
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

  if (value.version !== "2026-06-21.phase2.mcp-endpoint-default-deny-scaffold.v0") {
    errors.push("version must match MCP endpoint default-deny scaffold version");
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

  if (value.transport !== "streamable_http") {
    errors.push("transport must be streamable_http");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend",
    "oauth_live",
    "api_key_live",
    "live_tool_execution",
    "mcp_api_redistribution_rights_confirmed"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of ["default_deny", "web_rights_do_not_imply_mcp", "origin_validation"]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
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
    ...validateStringArray(value.supported_methods, requiredMethods, "supported_methods")
  );
  errors.push(
    ...validateStringArray(
      value.required_origin_fields,
      requiredOriginFields,
      "required_origin_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_rights_gate_fields,
      requiredRightsGateFields,
      "required_rights_gate_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_protocol_fields,
      requiredProtocolFields,
      "required_protocol_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_response_fields,
      requiredResponseFields,
      "required_response_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.standard_error_codes,
      requiredErrorCodes,
      "standard_error_codes"
    )
  );
  errors.push(...validateNoSecrets(value));

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
