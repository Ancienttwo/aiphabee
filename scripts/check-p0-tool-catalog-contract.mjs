#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/tools/p0-tool-catalog.contract.json";
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
  "get_entitlements",
  "get_ipo_profile",
  "search_ipo_calendar",
  "get_ipo_timetable",
  "get_ipo_offering",
  "get_ipo_allotment",
  "screen_ipos",
  "compare_ipos"
];
const requiredSurfaces = [
  "registry",
  "tool_schemas",
  "mcp_schema_validation",
  "mcp_versioning",
  "mcp_usage_envelope",
  "mcp_pagination_limits",
  "golden_fixtures",
  "agent_tool_enforcement"
];
const forbiddenTextPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\//iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

const contract = readJson(contractPath);
const registry = readJson(contract.tool_registry_contract);
const toolSchemas = readJson(contract.tool_schema_contract);
const schemaValidation = readJson(contract.mcp_schema_validation_contract);
const versioning = readJson(contract.mcp_versioning_contract);
const usageEnvelope = readJson(contract.mcp_usage_envelope_contract);
const paginationLimits = readJson(contract.mcp_pagination_limits_contract);
const goldenManifest = readJson(contract.golden_tool_manifest);
const toolEnforcement = readJson(contract.agent_tool_enforcement_contract);

const errors = [
  ...validateContract(contract),
  ...validateRegistry(registry),
  ...validateToolSchemas(toolSchemas),
  ...validateMcpValidatedTools(schemaValidation, "mcp_schema_validation"),
  ...validateMcpValidatedTools(versioning, "mcp_versioning"),
  ...validateMcpValidatedTools(usageEnvelope, "mcp_usage_envelope"),
  ...validateMcpValidatedTools(paginationLimits, "mcp_pagination_limits"),
  ...validateGoldenManifest(goldenManifest),
  ...validateAgentToolEnforcement(toolEnforcement),
  ...validateNoSecrets({
    contract,
    goldenManifest,
    paginationLimits,
    registry,
    schemaValidation,
    toolEnforcement,
    toolSchemas,
    usageEnvelope,
    versioning
  })
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
    golden_fixture_count: goldenManifest.samples.length,
    p0_tool_count: requiredTools.length,
    schema_pairs: Object.keys(toolSchemas.schemas).length,
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

  if (value.version !== "2026-06-21.phase3.p0-tool-catalog-consistency.v0") {
    errors.push("version must match P0 tool catalog consistency version");
  }

  if (value.status !== "local_contract") {
    errors.push("status must be local_contract");
  }

  for (const field of ["frontend", "live_tool_execution"]) {
    if (value[field] !== false) {
      errors.push(`${field} must be false`);
    }
  }

  for (const field of [
    "p0_tool_count",
    "registry_tool_count",
    "tool_schema_pairs",
    "mcp_validated_tools",
    "golden_fixture_count"
  ]) {
    if (value[field] !== requiredTools.length) {
      errors.push(`${field} must be ${requiredTools.length}`);
    }
  }

  errors.push(...validateStringArray(value.required_tools, requiredTools, "required_tools"));
  errors.push(...validateStringArray(value.unified_surfaces, requiredSurfaces, "unified_surfaces"));

  return errors;
}

function validateRegistry(value) {
  const errors = [];

  if (!isRecord(value)) {
    return ["registry contract must be an object"];
  }

  errors.push(...validateStringArray(value.required_tools, requiredTools, "registry.required_tools"));
  errors.push(...validateStringArray(value.scaffold_tools, requiredTools, "registry.scaffold_tools"));

  return errors;
}

function validateToolSchemas(value) {
  const errors = [];

  if (!isRecord(value) || !isRecord(value.schemas)) {
    return ["tool schema contract must expose schemas"];
  }

  for (const toolName of requiredTools) {
    if (!isRecord(value.schemas[toolName])) {
      errors.push(`tool schema contract must include ${toolName}`);
    }
  }

  if (Object.keys(value.schemas).length !== requiredTools.length) {
    errors.push(`tool schema contract must contain exactly ${requiredTools.length} schema pairs`);
  }

  return errors;
}

function validateMcpValidatedTools(value, name) {
  if (!isRecord(value)) {
    return [`${name} contract must be an object`];
  }

  return validateStringArray(value.validated_tools, requiredTools, `${name}.validated_tools`);
}

function validateGoldenManifest(value) {
  const errors = [];

  if (!isRecord(value) || !Array.isArray(value.samples)) {
    return ["golden tool manifest must expose samples"];
  }

  const toolNames = value.samples
    .filter(isRecord)
    .map((sample) => sample.tool_name)
    .filter((toolName) => typeof toolName === "string");

  for (const toolName of requiredTools) {
    if (!toolNames.includes(toolName)) {
      errors.push(`golden tool manifest must include ${toolName}`);
    }
  }

  if (toolNames.length !== requiredTools.length) {
    errors.push(`golden tool manifest must contain exactly ${requiredTools.length} samples`);
  }

  return errors;
}

function validateAgentToolEnforcement(value) {
  if (!isRecord(value)) {
    return ["agent tool enforcement contract must be an object"];
  }

  if (value.registered_tool_count !== requiredTools.length) {
    return [`agent tool enforcement registered_tool_count must be ${requiredTools.length}`];
  }

  return [];
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
