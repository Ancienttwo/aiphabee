#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/mcp/tool-versioning.contract.json";
const registryContractPath = "deploy/tools/registry.contract.json";
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
const requiredSprintItems = [
  "MCP-05",
  "stable_tool_versions",
  "deprecation_policy",
  "breaking_changes_new_major",
  "old_version_notice_window"
];
const requiredRegistryLifecycleFields = [
  "publicVersion",
  "majorVersion",
  "breakingChangesRequireNewMajor",
  "deprecation",
  "compatibility"
];
const requiredMcpDescriptorFields = [
  "version",
  "public_version",
  "major_version",
  "breaking_changes_require_new_major",
  "deprecation"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{10,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const registryContract = readJson(registryContractPath);
const errors = [
  ...validateContract(contract),
  ...validateRegistryContract(registryContract)
];

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
    tools: requiredTools.length,
    versioning_ready: contract.tool_versioning_ready
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

  if (value.version !== "2026-06-21.phase2.mcp-tool-versioning-scaffold.v0") {
    errors.push("version must match MCP tool versioning scaffold version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  if (value.package !== "@aiphabee/mcp-runtime") {
    errors.push("package must be @aiphabee/mcp-runtime");
  }

  if (value.tool_registry_package !== "@aiphabee/tool-registry") {
    errors.push("tool_registry_package must be @aiphabee/tool-registry");
  }

  if (value.route !== "POST /mcp") {
    errors.push("route must be POST /mcp");
  }

  if (value.runtime_route !== "GET /mcp/runtime") {
    errors.push("runtime_route must be GET /mcp/runtime");
  }

  if (value.tool_list_method !== "tools/list") {
    errors.push("tool_list_method must be tools/list");
  }

  for (const field of ["frontend", "live_tool_execution"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false in this scaffold`);
    }
  }

  for (const field of [
    "tool_versioning_ready",
    "deprecation_policy_ready",
    "breaking_changes_require_new_major",
    "old_major_available_during_notice"
  ]) {
    if (value[field] !== true) {
      errors.push(`${field} must be true`);
    }
  }

  if (value.minimum_deprecation_notice_days < 90) {
    errors.push("minimum_deprecation_notice_days must be at least 90");
  }

  if (value.previous_major_support_window_days < 180) {
    errors.push("previous_major_support_window_days must be at least 180");
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
      value.required_registry_lifecycle_fields,
      requiredRegistryLifecycleFields,
      "required_registry_lifecycle_fields"
    )
  );
  errors.push(
    ...validateStringArray(
      value.required_mcp_descriptor_fields,
      requiredMcpDescriptorFields,
      "required_mcp_descriptor_fields"
    )
  );
  errors.push(...validateStringArray(value.validated_tools, requiredTools, "validated_tools"));
  errors.push(...validateNoSecrets(value));

  return errors;
}

function validateRegistryContract(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["registry contract must be an object"];
  }

  if (value.versioning_ready !== true) {
    errors.push("registry contract versioning_ready must be true");
  }

  if (value.deprecation_policy_ready !== true) {
    errors.push("registry contract deprecation_policy_ready must be true");
  }

  if (value.breaking_changes_require_new_major !== true) {
    errors.push("registry contract breaking_changes_require_new_major must be true");
  }

  if (value.minimum_deprecation_notice_days < 90) {
    errors.push("registry minimum_deprecation_notice_days must be at least 90");
  }

  if (value.previous_major_support_window_days < 180) {
    errors.push("registry previous_major_support_window_days must be at least 180");
  }

  errors.push(
    ...validateStringArray(
      value.required_lifecycle_fields,
      requiredRegistryLifecycleFields,
      "registry.required_lifecycle_fields"
    )
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
