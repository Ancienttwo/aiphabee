#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/protocol-release-gate.contract.json";
const databaseContractPath = "deploy/database/migrations.contract.json";
const packageJsonPath = "package.json";
const requiredRuntimeCapabilityFields = [
  "mcp_protocol_release_gate_ready",
  "mcp_protocol_release_gate_route",
  "mcp_protocol_release_gate_version",
  "mcp_protocol_release_gate_required_checks",
  "mcp_compatibility_status_ready",
  "mcp_compatibility_status_route",
  "mcp_live_client_e2e_passed",
  "origin_validation",
  "tool_call_input_strict_validation",
  "structured_content_output_schema_ready",
  "transport"
];
const requiredChecks = [
  "streamable_http_initialize_contract",
  "origin_required_and_allowed",
  "auth_enforced_before_tool_execution",
  "tools_list_default_deny_until_rights_confirmed",
  "tools_call_input_schema_validation",
  "tools_call_output_schema_contract",
  "compatibility_vectors_present"
];
const requiredOutputFields = [
  "protocol_gate",
  "origin_gate",
  "auth_gate",
  "schema_compatibility_gate",
  "compatibility_gate",
  "release_checks",
  "release_gate",
  "validation"
];
const requiredCompatibilityVectors = [
  "streamable_http_post",
  "initialize_negotiation",
  "tools_call_schema_validation",
  "structured_content_text_fallback"
];
const requiredTables = [
  "core.mcp_protocol_release_gate",
  "governance.mcp_protocol_release_gate_contract"
];
const requiredCoveredItems = [
  "mcp_streamable_http_origin_auth",
  "mcp_input_output_schema_compatibility"
];
const requiredBlockers = [
  "live_oauth_provider_missing",
  "live_auth_middleware_missing",
  "live_sdk_inspector_smoke_missing",
  "target_client_e2e_missing"
];
const requiredLinkedContracts = [
  "deploy/mcp/endpoint.contract.json",
  "deploy/mcp/tool-schema-validation.contract.json",
  "deploy/mcp/compatibility.contract.json",
  "deploy/mcp/error-codes.contract.json",
  "deploy/mcp/oauth-pkce.contract.json",
  "deploy/mcp/revocation-enforcement.contract.json",
  "deploy/database/migrations.contract.json"
];
const forbiddenTextPatterns = [
  /(?:^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const databaseContract = readJson(databaseContractPath);
const packageJson = readJson(packageJsonPath);
const errors = validateContract(contract, databaseContract, packageJson);

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
    checks: contract.required_checks.length,
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

function validateContract(value, databaseValue, packageValue) {
  const errors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0") {
    errors.push("version must match MCP protocol release gate scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  for (const [field, expected] of [
    ["runtime_route", "GET /mcp/runtime"],
    ["route", "POST /mcp/release-gates/protocol/plan"],
    ["protocol_route", "POST /mcp"],
    ["compatibility_status_route", "GET /mcp/compatibility/status"],
    ["transport", "streamable_http"],
    ["target_protocol_version", "2025-03-26"]
  ]) {
    if (value[field] !== expected) {
      errors.push(`${field} must be ${expected}`);
    }
  }

  if (value.standard_response_envelope !== true) {
    errors.push("standard_response_envelope must be true");
  }

  for (const field of [
    "frontend_rendering",
    "persistent_writes",
    "live_auth_middleware",
    "live_client_e2e_passed",
    "live_db_writes",
    "live_inspector_smoke",
    "live_oauth_provider",
    "live_sdk_smoke",
    "live_tool_execution",
    "model_calls",
    "sql_emitted"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(...validateStringArray(value.required_checks, requiredChecks, "required_checks"));
  errors.push(
    ...validateStringArray(
      value.required_output_fields,
      requiredOutputFields,
      "required_output_fields"
    )
  );
  errors.push(...validateProtocolGatePolicy(value.protocol_gate_policy));
  errors.push(...validateAuthGatePolicy(value.auth_gate_policy));
  errors.push(...validateSchemaCompatibilityPolicy(value.schema_compatibility_policy));
  errors.push(
    ...validateStringArray(
      value.required_compatibility_vectors,
      requiredCompatibilityVectors,
      "required_compatibility_vectors"
    )
  );
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateStringArray(value.tables, requiredTables, "tables"));
  errors.push(
    ...validateStringArray(
      value.covered_sprint_3_3_items,
      requiredCoveredItems,
      "covered_sprint_3_3_items"
    )
  );
  errors.push(
    ...validateStringArray(value.linked_contracts, requiredLinkedContracts, "linked_contracts")
  );
  errors.push(...validateLinkedContractFiles(value.linked_contracts));
  errors.push(...validatePackageScript(packageValue));
  errors.push(...validateDatabaseTables(databaseValue));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateProtocolGatePolicy(value) {
  if (!isRecord(value)) {
    return ["protocol_gate_policy must be an object"];
  }

  const errors = [];

  if (value.json_rpc !== "2.0") {
    errors.push("protocol_gate_policy.json_rpc must be 2.0");
  }

  if (value.streamable_http !== true) {
    errors.push("protocol_gate_policy.streamable_http must be true");
  }

  if (value.initialize_protocol_version !== "2025-03-26") {
    errors.push("protocol_gate_policy.initialize_protocol_version must be 2025-03-26");
  }

  if (value.origin_required !== true) {
    errors.push("protocol_gate_policy.origin_required must be true");
  }

  if (value.untrusted_origin_error !== "ORIGIN_NOT_ALLOWED") {
    errors.push("protocol_gate_policy.untrusted_origin_error must be ORIGIN_NOT_ALLOWED");
  }

  return errors;
}

function validateAuthGatePolicy(value) {
  if (!isRecord(value)) {
    return ["auth_gate_policy must be an object"];
  }

  const errors = [];

  for (const field of ["active_credential_allowed", "enforced_before_tool_execution"]) {
    if (value[field] !== true) {
      errors.push(`auth_gate_policy.${field} must be true`);
    }
  }

  for (const [field, expected] of [
    ["revoked_credential_error", "MCP_CREDENTIAL_REVOKED"],
    ["revoked_standard_error", "AUTH_REQUIRED"],
    ["rights_default_deny_error", "MCP_REDISTRIBUTION_RIGHTS_REQUIRED"],
    ["rights_standard_error", "DATA_NOT_LICENSED"]
  ]) {
    if (value[field] !== expected) {
      errors.push(`auth_gate_policy.${field} must be ${expected}`);
    }
  }

  return errors;
}

function validateSchemaCompatibilityPolicy(value) {
  if (!isRecord(value)) {
    return ["schema_compatibility_policy must be an object"];
  }

  const errors = [];

  for (const [field, expected] of [
    ["sample_tool_name", "get_quote_snapshot"],
    ["required_scope", "quotes:read"],
    ["input_schema_id", "tool.get_quote_snapshot.input.v0"],
    ["output_schema_id", "tool.get_quote_snapshot.output.v0"],
    ["unsupported_argument_error", "TOOL_ARGUMENT_UNSUPPORTED"],
    ["unsupported_argument_standard_error", "OUT_OF_RANGE"],
    ["structured_content_matches_output_schema", "planned_no_live"]
  ]) {
    if (value[field] !== expected) {
      errors.push(`schema_compatibility_policy.${field} must be ${expected}`);
    }
  }

  for (const field of ["structured_content_required"]) {
    if (value[field] !== true) {
      errors.push(`schema_compatibility_policy.${field} must be true`);
    }
  }

  for (const field of ["additional_properties_allowed", "raw_text_only_response_allowed"]) {
    if (value[field] !== false) {
      errors.push(`schema_compatibility_policy.${field} must be false`);
    }
  }

  return errors;
}

function validateReleaseGate(value) {
  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  const errors = [];

  if (value.gate_status !== "blocked_live_mcp_protocol_validation") {
    errors.push("release_gate.gate_status must be blocked_live_mcp_protocol_validation");
  }

  if (value.no_live_release_claim !== true) {
    errors.push("release_gate.no_live_release_claim must be true");
  }

  errors.push(
    ...validateStringArray(
      value.required_signoffs,
      ["platform", "security", "data-rights", "developer-relations"],
      "release_gate.required_signoffs"
    )
  );
  errors.push(...validateStringArray(value.blockers, requiredBlockers, "release_gate.blockers"));

  return errors;
}

function validateLinkedContractFiles(value) {
  if (!Array.isArray(value)) {
    return ["linked_contracts must be an array"];
  }

  return value
    .filter((path) => typeof path === "string" && !existsSync(resolve(process.cwd(), path)))
    .map((path) => `linked contract file missing: ${path}`);
}

function validatePackageScript(value) {
  if (!isRecord(value) || !isRecord(value.scripts)) {
    return ["package scripts must be present"];
  }

  const script = value.scripts["check:mcp-protocol-release-gate"];

  if (
    typeof script !== "string" ||
    !script.includes("scripts/check-mcp-protocol-release-gate-contract.mjs")
  ) {
    return ["check:mcp-protocol-release-gate script must run its contract checker"];
  }

  if (
    typeof value.scripts.check !== "string" ||
    !value.scripts.check.includes("check:mcp-protocol-release-gate")
  ) {
    return ["root check script must include check:mcp-protocol-release-gate"];
  }

  return [];
}

function validateDatabaseTables(value) {
  const migrations = isRecord(value) && Array.isArray(value.migrations) ? value.migrations : [];
  const migration = migrations.find(
    (entry) =>
      isRecord(entry) &&
      entry.file === "supabase/migrations/20260621135000_mcp_protocol_release_gate_scaffold.sql"
  );

  if (!isRecord(migration)) {
    return ["database contract must include MCP protocol release gate migration"];
  }

  return validateStringArray(migration.tables, requiredTables, "database migration tables");
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  const errors = [];

  for (const pattern of forbiddenTextPatterns) {
    if (pattern.test(serialized)) {
      errors.push(`contract contains forbidden secret-like pattern ${pattern}`);
    }
  }

  return errors;
}

function validateStringArray(value, requiredValues, label) {
  if (!Array.isArray(value)) {
    return [`${label} must be an array`];
  }

  const errors = [];

  for (const required of requiredValues) {
    if (!value.includes(required)) {
      errors.push(`${label} must include ${required}`);
    }
  }

  return errors;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
