#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/compatibility.contract.json";
const requiredSprintItems = [
  "MCP-12",
  "official_inspector",
  "official_sdk",
  "target_clients",
  "status_page",
  "as_of_delay_source_display"
];
const requiredRuntimeCapabilityFields = [
  "mcp_compatibility_status_ready",
  "mcp_compatibility_status_route",
  "mcp_compatibility_status_version",
  "mcp_live_client_e2e_passed",
  "mcp_target_protocol_version",
  "monitored_protocol_versions"
];
const requiredStatusFields = [
  "version",
  "status",
  "target_protocol_version",
  "monitored_protocol_versions",
  "inspector",
  "sdk",
  "target_clients",
  "test_vectors",
  "status_page",
  "release_gate"
];
const requiredInspectorChecks = [
  "connectivity",
  "capability_negotiation",
  "tools_tab",
  "error_responses"
];
const requiredTargetClients = [
  "mcp_inspector",
  "typescript_sdk_client",
  "claude_desktop",
  "cursor",
  "chatgpt_connector"
];
const requiredTestVectors = [
  "streamable_http_post",
  "initialize_negotiation",
  "tools_list",
  "tools_call_schema_validation",
  "structured_content_text_fallback",
  "oauth_pkce",
  "api_key_lifecycle",
  "pagination_limits",
  "standard_errors",
  "usage_and_request_id",
  "as_of_delay_source_display"
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
    status: "ok",
    status_route: contract.status_route,
    target_protocol_version: contract.target_protocol_version,
    test_vectors: contract.required_test_vectors.length,
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

  if (value.version !== "2026-06-21.phase2.mcp-compatibility-status-scaffold.v0") {
    errors.push("version must match MCP compatibility status scaffold version");
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

  if (value.status_route !== "GET /mcp/compatibility/status") {
    errors.push("status_route must be GET /mcp/compatibility/status");
  }

  if (value.protocol_route !== "POST /mcp") {
    errors.push("protocol_route must be POST /mcp");
  }

  if (value.transport !== "streamable_http") {
    errors.push("transport must be streamable_http");
  }

  if (value.target_protocol_version !== "2025-03-26") {
    errors.push("target_protocol_version must be 2025-03-26");
  }

  for (const field of [
    "frontend",
    "public_status_page_live",
    "live_client_e2e_passed",
    "live_inspector_smoke",
    "live_sdk_smoke"
  ]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  errors.push(
    ...validateStringArray(
      value.monitored_protocol_versions,
      ["2025-03-26", "2025-11-25"],
      "monitored_protocol_versions"
    )
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
      value.required_runtime_capability_fields,
      requiredRuntimeCapabilityFields,
      "required_runtime_capability_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_status_fields,
      requiredStatusFields,
      "required_status_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_inspector_checks,
      requiredInspectorChecks,
      "required_inspector_checks"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_target_clients,
      requiredTargetClients,
      "required_target_clients"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_test_vectors,
      requiredTestVectors,
      "required_test_vectors"
    )
  );
  errors.push(...validateOfficialTargets(value.official_targets));
  errors.push(...validateStatusPage(value.status_page));
  errors.push(...validateReleaseGate(value.release_gate));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateOfficialTargets(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["official_targets must be an object"];
  }

  if (value.inspector !== "@modelcontextprotocol/inspector") {
    errors.push("official_targets.inspector must be @modelcontextprotocol/inspector");
  }

  if (value.inspector_command !== "npx @modelcontextprotocol/inspector") {
    errors.push("official_targets.inspector_command must be npx @modelcontextprotocol/inspector");
  }

  if (value.typescript_sdk_channel !== "typescript-sdk-v1.x") {
    errors.push("official_targets.typescript_sdk_channel must be typescript-sdk-v1.x");
  }

  if (value.typescript_sdk_latest_seen_v1_release !== "v1.29.0") {
    errors.push("official_targets.typescript_sdk_latest_seen_v1_release must be v1.29.0");
  }

  if (value.typescript_sdk_v2_status !== "pre_alpha_not_targeted") {
    errors.push("official_targets.typescript_sdk_v2_status must be pre_alpha_not_targeted");
  }

  return errors;
}

function validateStatusPage(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["status_page must be an object"];
  }

  if (value.route !== "GET /mcp/compatibility/status") {
    errors.push("status_page.route must be GET /mcp/compatibility/status");
  }

  for (const field of [
    "shows_protocol_version",
    "shows_last_successful_client_smoke",
    "shows_open_incidents"
  ]) {
    if (value[field] !== true) {
      errors.push(`status_page.${field} must be true`);
    }
  }

  if (value.public_status_page_live !== false) {
    errors.push("status_page.public_status_page_live must be false");
  }

  return errors;
}

function validateReleaseGate(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["release_gate must be an object"];
  }

  if (value.local_contract_required !== "npm run check:mcp-compatibility") {
    errors.push("release_gate.local_contract_required must be npm run check:mcp-compatibility");
  }

  if (value.remote_mcp_rights_required !== true) {
    errors.push("release_gate.remote_mcp_rights_required must be true");
  }

  if (value.live_client_smoke_required_before_ga !== true) {
    errors.push("release_gate.live_client_smoke_required_before_ga must be true");
  }

  return errors;
}

function validateStringArray(value, required, label) {
  const errors = [];

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return [`${label} must be a string array`];
  }

  for (const item of required) {
    if (!value.includes(item)) {
      errors.push(`${label} must include ${item}`);
    }
  }

  return errors;
}

function validateNoSecrets(value) {
  const text = JSON.stringify(value);
  return forbiddenTextPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => `contract must not contain secret-like value matching ${pattern}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
