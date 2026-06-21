#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/revocation-enforcement.contract.json";
const requiredSprintItems = [
  "ACC-06",
  "oauth_connection_revoke",
  "api_key_revoke",
  "api_key_rotation_old_key_denial"
];
const requiredRuntimeCapabilityFields = [
  "mcp_revocation_enforcement_ready",
  "mcp_revocation_enforcement_route",
  "mcp_revocation_enforcement_version",
  "mcp_revocation_enforcement_live",
  "mcp_revocation_enforcement_error_code",
  "oauth_revoke_enforced_before_new_calls",
  "api_key_revoke_enforced_before_new_calls",
  "api_key_rotation_old_key_denied"
];
const requiredPlanFields = [
  "credential",
  "denial",
  "live_auth_middleware",
  "persistent_writes",
  "route",
  "status",
  "version"
];
const requiredDenialFields = [
  "decision",
  "denied",
  "client_action",
  "standard_error_code",
  "enforced_before_tool_execution",
  "enforced_before_usage_debit",
  "immediate_failure_after_revoke",
  "immediate_failure_after_rotation"
];
const requiredCredentialKinds = ["oauth_connection", "api_key"];
const requiredCredentialStatuses = ["active", "revoked", "rotated", "unknown"];
const requiredDeniedStatuses = ["revoked", "rotated", "unknown"];
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
    denied_statuses: contract.denied_statuses,
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

  if (value.version !== "2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0") {
    errors.push("version must match MCP revocation enforcement scaffold version");
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

  if (value.protocol_route !== "POST /mcp") {
    errors.push("protocol_route must be POST /mcp");
  }

  if (value.route !== "POST /mcp/revocations/enforce/plan") {
    errors.push("route must be POST /mcp/revocations/enforce/plan");
  }

  if (value.oauth_revoke_route !== "POST /mcp/oauth/revoke/plan") {
    errors.push("oauth_revoke_route must be POST /mcp/oauth/revoke/plan");
  }

  if (value.api_key_revoke_route !== "POST /mcp/api-keys/revoke/plan") {
    errors.push("api_key_revoke_route must be POST /mcp/api-keys/revoke/plan");
  }

  if (value.api_key_rotate_route !== "POST /mcp/api-keys/rotate/plan") {
    errors.push("api_key_rotate_route must be POST /mcp/api-keys/rotate/plan");
  }

  for (const field of [
    "frontend",
    "live_oauth_provider",
    "live_api_key_auth",
    "live_credential_store",
    "live_tool_execution",
    "persistent_writes",
    "raw_credential_storage"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "immediate_denial_after_revoke",
    "immediate_denial_after_rotation",
    "enforced_before_tool_execution",
    "enforced_before_usage_debit"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.standard_error_code !== "AUTH_REQUIRED") {
    errors.push("standard_error_code must be AUTH_REQUIRED");
  }

  if (value.client_action !== "reauthorize") {
    errors.push("client_action must be reauthorize");
  }

  errors.push(
    ...validateStringArray(
      value.covered_sprint_2_4_items,
      requiredSprintItems,
      "covered_sprint_2_4_items"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.required_plan_fields, requiredPlanFields, "required_plan_fields")
  );
  errors.push(
    ...validateStringArray(
      value.required_denial_fields,
      requiredDenialFields,
      "required_denial_fields"
    )
  );
  errors.push(
    ...validateStringArray(value.credential_kinds, requiredCredentialKinds, "credential_kinds")
  );
  errors.push(
    ...validateStringArray(
      value.credential_statuses,
      requiredCredentialStatuses,
      "credential_statuses"
    )
  );
  errors.push(
    ...validateStringArray(value.denied_statuses, requiredDeniedStatuses, "denied_statuses")
  );
  errors.push(...validateStringArray(value.allowed_statuses, ["active"], "allowed_statuses"));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateStringArray(value, required, label) {
  const errors = [];

  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  for (const item of required) {
    if (!value.includes(item)) {
      errors.push(`${label} must include ${item}`);
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

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
