#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/api-key.contract.json";
const requiredSprintItems = [
  "MCP-03",
  "server_to_server_api_key",
  "hash_storage",
  "rotation",
  "ip_allowlist",
  "one_time_display",
  "revocation_future_call_denial"
];
const requiredScopes = [
  "security.read",
  "market.read",
  "fundamentals.read",
  "filings.read",
  "analytics.run",
  "portfolio.read",
  "alerts.write",
  "exports.read",
  "admin.usage.read"
];
const requiredCreateFields = ["key_name", "scopes"];
const requiredCreateOutputFields = [
  "api_key",
  "hash_storage",
  "key_material",
  "ip_restrictions",
  "rotation",
  "revocation",
  "scope_binding",
  "server_to_server"
];
const requiredRotateFields = ["key_id", "scopes"];
const requiredRotateOutputFields = [
  "api_key",
  "hash_storage",
  "key_material",
  "rotation",
  "scope_binding",
  "server_to_server"
];
const requiredRevokeFields = ["key_id"];
const requiredRevokeOutputFields = [
  "revocation_plan",
  "future_calls_denied_after_revoke",
  "key_hash_disabled"
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
    create_route: contract.create_route,
    revoke_route: contract.revoke_route,
    rotate_route: contract.rotate_route,
    status: "ok"
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

  if (value.version !== "2026-06-21.phase2.mcp-api-key-scaffold.v0") {
    errors.push("version must match MCP API key scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.runtime_route !== "GET /mcp/api-keys/runtime") {
    errors.push("runtime_route must be GET /mcp/api-keys/runtime");
  }

  if (value.create_route !== "POST /mcp/api-keys/create/plan") {
    errors.push("create_route must be POST /mcp/api-keys/create/plan");
  }

  if (value.rotate_route !== "POST /mcp/api-keys/rotate/plan") {
    errors.push("rotate_route must be POST /mcp/api-keys/rotate/plan");
  }

  if (value.revoke_route !== "POST /mcp/api-keys/revoke/plan") {
    errors.push("revoke_route must be POST /mcp/api-keys/revoke/plan");
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of ["frontend", "api_key_live", "raw_key_returned", "raw_key_stored"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "server_to_server_only",
    "hash_storage_required",
    "pepper_required",
    "key_last_four_stored",
    "one_time_display",
    "rotation_supported",
    "ip_allowlist_supported",
    "future_calls_denied_after_revoke",
    "old_key_future_calls_denied_after_rotation"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.hash_algorithm !== "hmac_sha256_with_pepper_planned") {
    errors.push("hash_algorithm must be hmac_sha256_with_pepper_planned");
  }

  errors.push(
    ...validateStringArray(value.supported_scopes, requiredScopes, "supported_scopes")
  );
  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_3_items,
      requiredSprintItems,
      "covered_sprint_2_3_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.create_required_fields,
      requiredCreateFields,
      "create_required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.create_output_fields,
      requiredCreateOutputFields,
      "create_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.rotate_required_fields,
      requiredRotateFields,
      "rotate_required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.rotate_output_fields,
      requiredRotateOutputFields,
      "rotate_output_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.revoke_required_fields,
      requiredRevokeFields,
      "revoke_required_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.revoke_output_fields,
      requiredRevokeOutputFields,
      "revoke_output_fields"
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
